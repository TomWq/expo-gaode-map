import ExpoModulesCore
import MAMapKit
import UIKit

/**
 * 标记点视图
 *
 * 负责:
 * - 在地图上显示标记点
 * - 管理标记点属性(位置、标题、描述)
 * - 支持拖拽功能
 * - 支持自定义 children 视图
 */
class MarkerView: ExpoView {
    // MARK: - 事件派发器（专属事件名避免冲突）
    var onMarkerPress = EventDispatcher()
    var onMarkerDragStart = EventDispatcher()
    var onMarkerDrag = EventDispatcher()
    var onMarkerDragEnd = EventDispatcher()
    
    /// 标记点位置
    var position: [String: Double] = [:]
    /// 临时存储的纬度
    private var pendingLatitude: Double?
    /// 临时存储的经度
    private var pendingLongitude: Double?
    /// 标题
    var title: String = ""
    /// 描述
    var markerDescription: String = ""
    /// 是否可拖拽
    var draggable: Bool = false
    /// 图标 URI
    var iconUri: String?
    /// 图标宽度（用于自定义图标 icon 属性）
    var iconWidth: Double = 40
    /// 图标高度（用于自定义图标 icon 属性）
    var iconHeight: Double = 40
    /// 自定义视图宽度（用于 children 属性）
    var customViewWidth: Double = 0
    /// 自定义视图高度（用于 children 属性）
    var customViewHeight: Double = 0
    /// 中心偏移
    var centerOffset: [String: Double]?
    /// 是否显示动画
    var animatesDrop: Bool = false
    /// 大头针颜色
    var pinColor: String = "red"
    /// 是否显示气泡
    var canShowCallout: Bool = true
    /// 地图视图引用
    private var mapView: MAMapView?
    /// 标记点对象
    var annotation: MAPointAnnotation?
    /// 在 MarkerView 中新增属性
    var cacheKey: String?
    /// 标记是否正在被移除（防止重复移除）
    private var isRemoving: Bool = false
    /// 标记点视图
    private var annotationView: MAAnnotationView?
    /// 待处理的位置（在 setMap 之前设置）
    private var pendingPosition: [String: Double]?
    /// 延迟添加任务
    private var pendingAddTask: DispatchWorkItem?
    /// 延迟更新任务（批量处理 props 更新）
    private var pendingUpdateTask: DispatchWorkItem?
    /// 上次设置的地图引用（防止重复调用）
    private weak var lastSetMapView: MAMapView?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        // 完全禁用交互，让触摸事件穿透
        isUserInteractionEnabled = false
        // 关键：让所有子视图也不接收触摸事件
        isMultipleTouchEnabled = false
        isExclusiveTouch = false
    }
    
    /**
     * 重写 hitTest，让触摸事件完全穿透此视图
     * 这是解决旧架构下 children 阻挡地图触摸的关键
     */
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        // 始终返回 nil，让触摸事件穿透到地图
        return nil
    }
    
    /**
     * 重写 point(inside:with:)，确保此视图不响应任何触摸
     */
    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        // 始终返回 false，表示点击不在此视图内
        return false
    }
    
    /**
     * 检查地图是否已连接
     */
    func isMapConnected() -> Bool {
        return mapView != nil
    }
    
    /**
     * 设置地图实例
     * @param map 地图视图
     */
    func setMap(_ map: MAMapView) {
        // 🔑 关键修复：检查是否是同一个地图实例，避免重复设置
        if lastSetMapView === map {
            return
        }
        
        let isNewMap = self.mapView == nil
        self.mapView = map
        lastSetMapView = map
        
        // 如果有待处理的位置，先应用它
        if let pending = pendingPosition {
            self.position = pending
            pendingPosition = nil
        }
        
        // 总是调用 updateAnnotation，确保幂等性
        updateAnnotation()
        
    }
    
    /**
     * 更新标记点（立即执行，与其他覆盖物保持一致）
     */
    func updateAnnotation() {
        // 🔑 性能优化：移除延迟机制，立即添加
        // 原因：延迟会在快速添加多个 Marker 时累积，导致帧率下降
        performUpdateAnnotation()
    }
    
    // JS 侧可以调用
    func setCacheKey(_ key: String?) {
        self.cacheKey = key
        // 发生变化时刷新 annotation
        updateAnnotation()
    }
    
    /**
     * 实际执行标记点更新
     */
    private func performUpdateAnnotation() {
        guard let mapView = mapView,
              let latitude = position["latitude"],
              let longitude = position["longitude"] else {
            return
        }
        
        // 🔑 坐标验证：防止无效坐标导致崩溃
        guard latitude >= -90 && latitude <= 90,
              longitude >= -180 && longitude <= 180 else {
            return
        }
        
        // 取消之前的延迟任务
        pendingAddTask?.cancel()
        pendingAddTask = nil
        
        // 移除旧的标记
//        if let oldAnnotation = annotation {
//            mapView.removeAnnotation(oldAnnotation)
//        }
//        
//        // 创建新的标记
//        let annotation = MAPointAnnotation()
        // 如果已有 annotation，尝试更新坐标与属性，避免 remove/add
        if let existing = annotation {
            existing.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            existing.title = title
            existing.subtitle = markerDescription
            // 如果 annotationView 已存在且需要刷新图片（比如 cacheKey 改变或 children 变化），我们后面会处理
            return
        }

        // 如果没有，则创建并添加
        let annotation = MAPointAnnotation()
        annotation.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        annotation.title = title
        annotation.subtitle = markerDescription
        self.annotation = annotation
        
        // 立即添加到地图（与 CircleView 等保持一致）
        mapView.addAnnotation(annotation)
    }
    
    /**
     * 获取 annotation 视图（由 ExpoGaodeMapView 调用）
     */
    func getAnnotationView(for mapView: MAMapView, annotation: MAAnnotation) -> MAAnnotationView? {
        
        // 🔑 如果有 children，使用自定义视图
        if self.subviews.count > 0 {
            // 使用 class-level reuseId，便于系统复用 view，减少内存
            let reuseId = "custom_marker_children"
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: reuseId)
            if annotationView == nil {
                annotationView = MAAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
            }
            annotationView?.annotation = annotation
            annotationView?.canShowCallout = false
            annotationView?.isDraggable = draggable
            self.annotationView = annotationView

            // 生成 cacheKey 或 fallback 到 identifier
            let key = cacheKey ?? "children_\(ObjectIdentifier(self).hashValue)"

            // 1) 如果缓存命中，直接同步返回图像（fast path）
            if let cached = IconBitmapCache.shared.image(forKey: key) {
                annotationView?.image = cached
                // 🔑 修复:自定义视图使用中心偏移,不需要底部偏移
                annotationView?.centerOffset = CGPoint(x: 0, y: 0)
                return annotationView
            }

            // 2) 缓存未命中：返回占位（透明），并异步在主线程生成图像然后回填
            let size = CGSize(width: CGFloat(customViewWidth > 0 ? customViewWidth : 200),
                              height: CGFloat(customViewHeight > 0 ? customViewHeight : 40))
            UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
            let transparentImage = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()
            annotationView?.image = transparentImage

            // 🔑 修复:延长延迟时间,给 React Native Image 更多加载时间
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self, weak annotationView] in
                guard let self = self, let annotationView = annotationView else { return }
                // 再次检查缓存（避免重复渲染）
                if let cached = IconBitmapCache.shared.image(forKey: key) {
                    print("🔄 iOS Marker: 使用缓存图片, key: \(key)")
                    annotationView.image = cached
                    annotationView.centerOffset = CGPoint(x: 0, y: 0)
                    return
                }
                
                print("⏰ iOS Marker: 0.5秒后开始渲染, key: \(key)")
                // 调用你的原生渲染逻辑（保留空白检测、多次 layout）
                if let generated = self.createImageFromSubviews() {
                    // 写入缓存（仅当用户传了 cacheKey 才缓存；否则建议仍缓存由 fingerprint 决定）
                    IconBitmapCache.shared.setImage(generated, forKey: key)
                    annotationView.image = generated
                    annotationView.centerOffset = CGPoint(x: 0, y: 0)
                    print("✅ iOS Marker: 渲染成功并显示, size: \(generated.size)")
                } else {
                    print("⚠️ iOS Marker: 渲染失败,图片为空")
                }
            }

            return annotationView
        }

        
        // 🔑 如果有 icon 属性，使用自定义图标
        if let iconUri = iconUri, !iconUri.isEmpty {
            let reuseId = "custom_marker_icon_\(ObjectIdentifier(self).hashValue)"
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: reuseId)
            
            if annotationView == nil {
                annotationView = MAAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
            }
            
            annotationView?.annotation = annotation
            // 只有在没有自定义内容时才使用 canShowCallout 设置
            annotationView?.canShowCallout = canShowCallout
            annotationView?.isDraggable = draggable
            self.annotationView = annotationView
            
            // 构建 key
            let key = cacheKey ?? "icon|\(iconUri)|\(Int(iconWidth))x\(Int(iconHeight))"
            if let cached = IconBitmapCache.shared.image(forKey: key) {
                annotationView?.image = cached
                annotationView?.centerOffset = CGPoint(x: 0, y: -cached.size.height / 2)
                return annotationView
            }

            // 原有异步加载，不变：只是在回调里先缓存 then set
            loadIcon(iconUri: iconUri) { [weak self, weak annotationView] image in
                guard let self = self, let image = image else { return }
                let size = CGSize(width: self.iconWidth, height: self.iconHeight)
                UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
                image.draw(in: CGRect(origin: .zero, size: size))
                let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
                UIGraphicsEndImageContext()

                DispatchQueue.main.async {
                    if let img = resizedImage {
                        IconBitmapCache.shared.setImage(img, forKey: key)
                        annotationView?.image = img
                        annotationView?.centerOffset = CGPoint(x: 0, y: -img.size.height / 2)
                    }
                }
            }

            
            return annotationView
        }
        
        // 🔑 既没有 children 也没有 icon，使用系统默认大头针
        // 🔑 性能优化：使用颜色作为 reuseId，让系统复用相同颜色的大头针
        let reuseId = "pin_marker_\(pinColor)"
        var pinView = mapView.dequeueReusableAnnotationView(withIdentifier: reuseId) as? MAPinAnnotationView
        
        if pinView == nil {
            pinView = MAPinAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
            
            // 🔑 创建时设置颜色（只在创建时设置一次）
            switch pinColor.lowercased() {
            case "green":
                pinView?.pinColor = .green
            case "purple":
                pinView?.pinColor = .purple
            default:
                pinView?.pinColor = .red
            }
        }
        
        pinView?.annotation = annotation
        pinView?.canShowCallout = canShowCallout
        pinView?.isDraggable = draggable
        pinView?.animatesDrop = animatesDrop
        
        self.annotationView = pinView
        return pinView
    }
    
    /**
     * 加载图标
     * @param iconUri 图标 URI (支持 http/https/file/本地资源)
     * @param completion 加载完成回调
     */
    private func loadIcon(iconUri: String, completion: @escaping (UIImage?) -> Void) {
        if iconUri.hasPrefix("http://") || iconUri.hasPrefix("https://") {
            // 网络图片
            guard let url = URL(string: iconUri) else {
                completion(nil)
                return
            }
            URLSession.shared.dataTask(with: url) { data, _, _ in
                guard let data = data, let image = UIImage(data: data) else {
                    DispatchQueue.main.async { completion(nil) }
                    return
                }
                DispatchQueue.main.async { completion(image) }
            }.resume()
        } else if iconUri.hasPrefix("file://") {
            // 本地文件
            let path = String(iconUri.dropFirst(7))
            completion(UIImage(contentsOfFile: path))
        } else {
            // 资源文件名
            completion(UIImage(named: iconUri))
        }
    }
    
    /**
     * 将子视图转换为图片
     */
    private func createImageFromSubviews() -> UIImage? {
        // 🔑 如果有 cacheKey 且命中缓存，直接返回缓存图片
        if let key = cacheKey, let cachedImage = IconBitmapCache.shared.image(forKey: key) {
            return cachedImage
        }
        
        guard let firstSubview = subviews.first else {
            return nil
        }
        
        // 优先使用 customViewWidth/customViewHeight（用于 children），其次使用子视图尺寸，最后使用默认值
        let width: CGFloat
        let height: CGFloat
        
        if customViewWidth > 0 {
            width = CGFloat(customViewWidth)
        } else if firstSubview.bounds.size.width > 0 {
            width = firstSubview.bounds.size.width
        } else {
            width = 200 // 默认宽度
        }
        
        if customViewHeight > 0 {
            height = CGFloat(customViewHeight)
        } else if firstSubview.bounds.size.height > 0 {
            height = firstSubview.bounds.size.height
        } else {
            height = 60 // 默认高度
        }
        
        let size = CGSize(width: width, height: height)
        
        // 强制子视图使用指定尺寸布局
        firstSubview.frame = CGRect(origin: .zero, size: size)
        
        // 🔑 多次强制布局，确保 React Native Text 完全渲染
        for _ in 0..<3 {
            forceLayoutRecursively(view: firstSubview)
            RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.01))
        }
        
        UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        guard let _ = UIGraphicsGetCurrentContext() else {
            return nil
        }
        
        // 使用 drawHierarchy 而不是 layer.render，这样能正确渲染 Text
        firstSubview.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true)
        
        guard let image = UIGraphicsGetImageFromCurrentImageContext() else {
            return nil
        }
        
        // 🔑 检查图片是否真的有内容（不是空白图片）
        // 暂时禁用空白检测,因为 React Native Image 可能需要额外的渲染时间
        // guard let cgImage = image.cgImage else {
        //     print("⚠️ iOS Marker: cgImage 为 nil")
        //     return nil
        // }
        
        // let dataProvider = cgImage.dataProvider
        // let data = dataProvider?.data
        // let buffer = CFDataGetBytePtr(data)
        
        // var isBlank = true
        // if let buffer = buffer {
        //     let length = CFDataGetLength(data)
        //     let checkLength = min(100, length)
        //     for i in 0..<checkLength {
        //         if buffer[i] != 0 {
        //             isBlank = false
        //             break
        //         }
        //     }
        // }
        
        // if isBlank {
        //     print("⚠️ iOS Marker: 渲染的图片是空白的")
        //     return nil
        // }
        
        print("✅ iOS Marker: 成功渲染图片, size: \(image.size)")
        
        // 🔑 写入缓存
        if let key = cacheKey {
            IconBitmapCache.shared.setImage(image, forKey: key)
        }
        
        return image
    }

    
    /**
     * 递归强制布局视图及其所有子视图
     */
    private func forceLayoutRecursively(view: UIView) {
        view.setNeedsLayout()
        view.layoutIfNeeded()
        
        for subview in view.subviews {
            forceLayoutRecursively(view: subview)
        }
    }
    
    
    /**
     * 当视图即将从父视图移除时调用
     */
    override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)
        
        // 如果 newSuperview 为 nil，说明视图正在被移除
        if newSuperview == nil {
            removeAnnotationFromMap()
        }
    }
    
    /**
     * 从地图移除标记点
     */
    private func removeAnnotationFromMap() {
        guard !isRemoving else { return }
        isRemoving = true
        pendingAddTask?.cancel(); pendingAddTask = nil
        pendingUpdateTask?.cancel(); pendingUpdateTask = nil

        guard let mapView = mapView, let annotation = annotation else { return }
        self.annotation = nil
        self.annotationView = nil

        // 🔑 修复：不要在移除时删除缓存
        // 理由：多个 Marker 可能共享同一 cacheKey，删除会影响其他 Marker
        // 缓存由 NSCache 自动管理，内存不足时会自动清理

        if Thread.isMainThread {
            mapView.removeAnnotation(annotation)
        } else {
            DispatchQueue.main.sync {
                mapView.removeAnnotation(annotation)
            }
        }
    }

    override func willRemoveSubview(_ subview: UIView) {
        super.willRemoveSubview(subview)
        
        // 如果正在移除，不要执行任何操作
        guard !isRemoving else {
            return
        }
        
        // 子视图移除后，需要刷新 annotation 视图
        if self.subviews.count <= 1 {
            // 所有子视图已移除，刷新以恢复默认图标
            if let mapView = mapView, let annotation = annotation {
                DispatchQueue.main.async { [weak self] in
                    guard let self = self, !self.isRemoving else {
                        return
                    }
                    mapView.removeAnnotation(annotation)
                    mapView.addAnnotation(annotation)
                }
            }
        }
    }
    
    override func didAddSubview(_ subview: UIView) {
        super.didAddSubview(subview)
        
        // 如果正在移除，不要执行任何操作
        guard !isRemoving else {
            return
        }
        
        // 🔑 关键修复：刷新 annotation
        if let mapView = mapView, let annotation = annotation {
            // annotation 已存在，立即刷新
            mapView.removeAnnotation(annotation)
            mapView.addAnnotation(annotation)
        } else if mapView != nil && annotation == nil {
            // annotation 还未创建，children 先添加了，触发创建
            updateAnnotation()
        }
    }
    
    /**
     * 设置纬度
     */
    func setLatitude(_ lat: Double) {
        pendingLatitude = lat
        
        // 如果经度也已设置，则更新位置
        if let lng = pendingLongitude {
            updatePosition(latitude: lat, longitude: lng)
        }
    }
    
    /**
     * 设置经度
     */
    func setLongitude(_ lng: Double) {
        pendingLongitude = lng
        
        // 如果纬度也已设置，则更新位置
        if let lat = pendingLatitude {
            updatePosition(latitude: lat, longitude: lng)
        }
    }
    
    /**
     * 更新标记位置（当经纬度都设置后）
     */
    private func updatePosition(latitude: Double, longitude: Double) {
        let position = ["latitude": latitude, "longitude": longitude]
        
        if mapView != nil {
            // 地图已设置，直接更新
            self.position = position
            pendingLatitude = nil
            pendingLongitude = nil
            updateAnnotation()
        } else {
            // 地图还未设置，保存位置待后续应用
            pendingPosition = position
        }
    }
    
    /**
     * 设置位置（兼容旧的 API）
     * @param position 位置坐标 {latitude, longitude}
     */
    func setPosition(_ position: [String: Double]) {
        if mapView != nil {
            // 地图已设置，直接更新
            self.position = position
            updateAnnotation()
        } else {
            // 地图还未设置，保存位置待后续应用
            pendingPosition = position
        }
    }
    
    /**
     * 设置标题
     * @param title 标题文本
     */
    func setTitle(_ title: String) {
        self.title = title
        updateAnnotation()
    }
    
    /**
     * 设置描述
     * @param description 描述文本
     */
    func setDescription(_ description: String) {
        self.markerDescription = description
        updateAnnotation()
    }
    
    /**
     * 设置是否可拖拽
     * @param draggable 是否可拖拽
     */
    func setDraggable(_ draggable: Bool) {
        self.draggable = draggable
        updateAnnotation()
    }
    
    func setIconUri(_ uri: String?) {
        self.iconUri = uri
        updateAnnotation()
    }
    
    func setCenterOffset(_ offset: [String: Double]) {
        self.centerOffset = offset
    }
    
    func setAnimatesDrop(_ animate: Bool) {
        self.animatesDrop = animate
    }
    
    func setPinColor(_ color: String) {
        self.pinColor = color
    }
    
    func setCanShowCallout(_ show: Bool) {
        self.canShowCallout = show
    }
    
    /**
     * 析构函数 - 不执行任何清理
     * 清理工作已在 willMove(toSuperview:) 中完成
     */
    deinit {
        // 取消待处理的任务
        pendingAddTask?.cancel()
        pendingUpdateTask?.cancel()
        
        // 清理引用，防止内存泄漏
        mapView = nil
        annotation = nil
        annotationView = nil
        lastSetMapView = nil
    }
}


/// 增强版内存缓存（带 cost 与清理）
class IconBitmapCache {
    static let shared = IconBitmapCache()
    private init() {
        // 设置 totalCostLimit = 1/8 可用内存（以字节计）
        let mem = ProcessInfo.processInfo.physicalMemory
        // 限制在可用物理内存的 1/8（可按需调整）
        let limit = Int(mem / 8)
        cache.totalCostLimit = limit
    }

    private var cache = NSCache<NSString, UIImage>()

    func image(forKey key: String) -> UIImage? {
        return cache.object(forKey: key as NSString)
    }

    func setImage(_ image: UIImage, forKey key: String) {
        // 以 bitmap 字节数作为 cost（更可靠）
        let cost = imageCostInBytes(image)
        cache.setObject(image, forKey: key as NSString, cost: cost)
    }

    func removeImage(forKey key: String) {
        cache.removeObject(forKey: key as NSString)
    }

    func clear() {
        cache.removeAllObjects()
    }

    private func imageCostInBytes(_ image: UIImage) -> Int {
        if let cg = image.cgImage {
            return cg.bytesPerRow * cg.height
        }
        // fallback estimate
        return Int(image.size.width * image.size.height * 4)
    }
}

