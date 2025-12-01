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
     * 更新标记点（批量处理，避免频繁更新）
     */
    func updateAnnotation() {
        // 取消之前的延迟更新
        pendingUpdateTask?.cancel()
        
        // 延迟 16ms（一帧）批量更新
        let task = DispatchWorkItem { [weak self] in
            self?.performUpdateAnnotation()
        }
        pendingUpdateTask = task
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.016, execute: task)
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
        if let oldAnnotation = annotation {
            mapView.removeAnnotation(oldAnnotation)
        }
        
        // 创建新的标记
        let annotation = MAPointAnnotation()
        annotation.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        annotation.title = title
        annotation.subtitle = markerDescription
        
        self.annotation = annotation
        
        // 🔑 关键修复：立即添加到地图（与 CircleView 等保持一致）
        // 不再使用延迟添加，避免新架构下的时序问题
        mapView.addAnnotation(annotation)
    }
    
    /**
     * 获取 annotation 视图（由 ExpoGaodeMapView 调用）
     */
    func getAnnotationView(for mapView: MAMapView, annotation: MAAnnotation) -> MAAnnotationView? {
        
        // 🔑 如果有 children，使用自定义视图
        if self.subviews.count > 0 {
            let reuseId = "custom_marker_children_\(ObjectIdentifier(self).hashValue)"
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: reuseId)
            
            if annotationView == nil {
                annotationView = MAAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
            }
            
            annotationView?.annotation = annotation
            annotationView?.canShowCallout = canShowCallout
            annotationView?.isDraggable = draggable
            self.annotationView = annotationView
            
            if let image = self.createImageFromSubviews() {
                annotationView?.image = image
                annotationView?.centerOffset = CGPoint(x: 0, y: -image.size.height / 2)
            } else {
                // 🔑 关键修复：不返回 nil，而是设置透明图片，然后延迟重试
                let size = CGSize(width: CGFloat(customViewWidth > 0 ? customViewWidth : 200),
                                  height: CGFloat(customViewHeight > 0 ? customViewHeight : 40))
                UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
                let transparentImage = UIGraphicsGetImageFromCurrentImageContext()
                UIGraphicsEndImageContext()
                annotationView?.image = transparentImage
                
                // 延迟重试创建图片
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self, weak annotationView] in
                    guard let self = self, let annotationView = annotationView else { return }
                    if let image = self.createImageFromSubviews() {
                        annotationView.image = image
                        annotationView.centerOffset = CGPoint(x: 0, y: -image.size.height / 2)
                    }
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
            annotationView?.canShowCallout = canShowCallout
            annotationView?.isDraggable = draggable
            self.annotationView = annotationView
            
            // 加载自定义图标
            loadIcon(iconUri: iconUri) { [weak self] image in
                guard let self = self, let image = image else {
                    return
                }
                let size = CGSize(width: self.iconWidth, height: self.iconHeight)
                
                UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
                image.draw(in: CGRect(origin: .zero, size: size))
                let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
                UIGraphicsEndImageContext()
                
                DispatchQueue.main.async {
                    annotationView?.image = resizedImage
                    annotationView?.centerOffset = CGPoint(x: 0, y: -self.iconHeight / 2)
                }
            }
            
            return annotationView
        }
        
        // 🔑 既没有 children 也没有 icon，使用系统默认大头针
        let reuseId = "pin_marker_\(ObjectIdentifier(self).hashValue)"
        var pinView = mapView.dequeueReusableAnnotationView(withIdentifier: reuseId) as? MAPinAnnotationView
        
        if pinView == nil {
            pinView = MAPinAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
        }
        
        pinView?.annotation = annotation
        pinView?.canShowCallout = canShowCallout
        pinView?.isDraggable = draggable
        pinView?.animatesDrop = animatesDrop
        
        // 设置大头针颜色
        switch pinColor.lowercased() {
        case "green":
            pinView?.pinColor = .green
        case "purple":
            pinView?.pinColor = .purple
        default:
            pinView?.pinColor = .red
        }
        
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
        guard let firstSubview = subviews.first else {
            return nil
        }
        
        // 优先使用 customViewWidth/customViewHeight（用于 children），其次使用子视图尺寸，最后使用默认值
        // 注意：iconWidth/iconHeight 是用于自定义图标的，不用于 children
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
        
        // 🔑 关键修复：多次强制布局，确保 React Native Text 完全渲染
        for _ in 0..<3 {
            forceLayoutRecursively(view: firstSubview)
            RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.01))
        }
        
        UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        guard let context = UIGraphicsGetCurrentContext() else {
            return nil
        }
        
        // 使用 drawHierarchy 而不是 layer.render，这样能正确渲染 Text
        let success = firstSubview.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true)
        
        guard let image = UIGraphicsGetImageFromCurrentImageContext() else {
            return nil
        }
        
        // 🔑 关键：检查图片是否真的有内容（不是空白图片）
        guard let cgImage = image.cgImage else {
            return nil
        }
        
        // 检查图片数据是否为空白
        let dataProvider = cgImage.dataProvider
        let data = dataProvider?.data
        let buffer = CFDataGetBytePtr(data)
        
        var isBlank = true
        if let buffer = buffer {
            let length = CFDataGetLength(data)
            // 检查前 100 个字节是否都是 0（空白）
            let checkLength = min(100, length)
            for i in 0..<checkLength {
                if buffer[i] != 0 {
                    isBlank = false
                    break
                }
            }
        }
        
        if isBlank {
            return nil
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
        
        // 取消任何待处理的延迟任务
        pendingAddTask?.cancel()
        pendingAddTask = nil
        pendingUpdateTask?.cancel()
        pendingUpdateTask = nil
        
        // 立即保存引用并清空属性，避免在异步块中访问 self
        guard let mapView = mapView, let annotation = annotation else {
            return
        }
        self.annotation = nil
        self.annotationView = nil
        
        // 同步移除，避免对象在异步块执行时已被释放
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
