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
    var position: [String: Double]?
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
    /// 是否开启生长动画
    var growAnimation: Bool = false
    /// 地图视图引用
    private var mapView: MAMapView?
    /// 标记点对象
    var annotation: MAPointAnnotation?
    /// 在 MarkerView 中新增属性
    var cacheKey: String?
    /// 标记是否正在被移除（防止重复移除）
    private var isRemoving: Bool = false
    
    // 平滑移动相关
    var smoothMovePath: [[String: Double]] = []
    var smoothMoveDuration: Double = 0  // 🔑 修复：默认为 0，防止未设置时触发动画
    var animatedAnnotation: MAAnimatedAnnotation?  // internal: ExpoGaodeMapView 需要访问
    var animatedAnnotationView: MAAnnotationView?  // 平滑移动的 annotation view
    private var isAnimating: Bool = false  // 标记是否正在动画中
    /// 标记点视图
    private var annotationView: MAAnnotationView?
    /// 待处理的位置（在 setMap 之前设置）
    private var pendingPosition: [String: Double]?
    /// 延迟添加任务
    private var pendingAddTask: DispatchWorkItem?
    /// 延迟更新任务（批量处理 props 更新）
    private var pendingUpdateTask: DispatchWorkItem?
    /// 子视图变化后的延迟刷新任务
    private var pendingSubviewRefreshTask: DispatchWorkItem?
    /// 最近一次应用到 annotationView 的 children 结构签名
    private var lastRenderedChildrenSignature: String?
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
        
        _ = self.mapView == nil
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
        // 🔑 性能优化：立即执行
        performUpdateAnnotation()
        
        // 🔑 只有当正在导航（isNavigating 在 JS 侧对应的逻辑）且路径时长合法时才自动启动
        // 我们通过 smoothMovePath.isEmpty 来判断是否应该停止或不启动
        if mapView != nil && !smoothMovePath.isEmpty && smoothMoveDuration > 0 {
            startSmoothMove()
        }
    }
    
    // JS 侧可以调用
    func setCacheKey(_ key: String?) {
        guard cacheKey != key else { return }
        self.cacheKey = key
        refreshAnnotationAppearance(invalidateChildrenCache: !subviews.isEmpty)
    }
    
    /**
     * 实际执行标记点更新
     */
    private func performUpdateAnnotation() {
        guard let mapView = mapView,
              let coordinate = LatLngParser.parseLatLng(position) else {
            return
        }
        
        // 取消之前的延迟任务
        pendingAddTask?.cancel()
        pendingAddTask = nil
        
        // 🔑 修复抖动：如果正在进行原生平滑移动动画，不要执行普通的静态位置更新
        // 但如果 animatedAnnotation 为 nil，说明动画已经停止或正在清理中，此时允许更新
        if isAnimating && animatedAnnotation != nil {
            return
        }

        // 如果已有 annotation，尝试更新坐标与属性
        if let existing = annotation {
            // 🔑 显式设置坐标，MAPointAnnotation 的 coordinate 赋值通常是不带动画的
            existing.coordinate = coordinate
            existing.title = title
            existing.subtitle = markerDescription
            
            // 🔑 确保 annotation 在地图上
            if !mapView.annotations.contains(where: { ($0 as? NSObject) === existing }) {
                mapView.addAnnotation(existing)
            }
            return
        }

        // 如果没有，则创建并添加
        let annotation = MAPointAnnotation()
        annotation.coordinate = coordinate
        annotation.title = title
        annotation.subtitle = markerDescription
        self.annotation = annotation
        
        // 立即添加到地图
        mapView.addAnnotation(annotation)
    }
    
    /**
     * 获取 animated annotation 视图（由 ExpoGaodeMapView 调用）
     * 为 MAAnimatedAnnotation 提供图标支持
     */
    func getAnimatedAnnotationView(for mapView: MAMapView, annotation: MAAnnotation) -> MAAnnotationView? {
        let reuseId = "animated_marker_\(ObjectIdentifier(self).hashValue)" + (growAnimation ? "_grow" : "")
        var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: reuseId)
        
        if annotationView == nil {
            if growAnimation {
                annotationView = ExpoGrowAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
            } else {
                annotationView = MAAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
            }
        }
        
        if let growView = annotationView as? ExpoGrowAnnotationView {
            growView.enableGrowAnimation = true
        }
        
        annotationView?.annotation = annotation
        self.animatedAnnotationView = annotationView
        
        // 优先级：children > icon > pinColor
        
        // 1. 如果有 children，使用自定义视图
        if self.subviews.count > 0 {
            let size = resolvedCustomSubviewSize(defaultSize: CGSize(width: 200, height: 60))
            let key = childrenCacheKey(for: size)
            if let cached = IconBitmapCache.shared.image(forKey: key) {
                annotationView?.image = cached
                if let annotationView = annotationView {
                    applyCenterOffset(to: annotationView, defaultOffset: .zero)
                }
                return annotationView
            }
            
            // 异步渲染并设置
            DispatchQueue.main.async { [weak self, weak annotationView] in
                guard let self = self, let annotationView = annotationView else { return }
                if let generated = self.createImageFromSubviews() {
                    annotationView.image = generated
                    self.applyCenterOffset(to: annotationView, defaultOffset: .zero)
                }
            }
            return annotationView
        }
        
        // 2. 如果有 icon 属性，使用自定义图标
        if let iconUri = iconUri, !iconUri.isEmpty {
            let key = iconCacheKey(for: iconUri)
            if let cached = IconBitmapCache.shared.image(forKey: key) {
                annotationView?.image = cached
                if let annotationView = annotationView {
                    applyCenterOffset(to: annotationView, defaultOffset: CGPoint(x: 0, y: -cached.size.height / 2))
                }
                return annotationView
            }
            
            // 异步加载图标
            loadIcon(iconUri: iconUri) { [weak self, weak annotationView] image in
                guard let self = self, let image = image, let annotationView = annotationView else { return }
                let size = CGSize(width: self.iconWidth, height: self.iconHeight)
                UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
                image.draw(in: CGRect(origin: .zero, size: size))
                let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
                UIGraphicsEndImageContext()
                
                if let img = resizedImage {
                    IconBitmapCache.shared.setImage(img, forKey: key)
                    annotationView.image = img
                    self.applyCenterOffset(to: annotationView, defaultOffset: CGPoint(x: 0, y: -img.size.height / 2))
                }
            }
            return annotationView
        }
        
        // 3. 使用默认大头针颜色
        switch pinColor.lowercased() {
        case "green":
            // 使用绿色图标
            let greenIcon = UIImage(named: "map_marker_green") ?? UIImage(systemName: "mappin.circle.fill")
            annotationView?.image = greenIcon
        case "purple":
            let purpleIcon = UIImage(named: "map_marker_purple") ?? UIImage(systemName: "mappin.circle.fill")
            annotationView?.image = purpleIcon
        default:
            // 默认红色
            let redIcon = UIImage(named: "map_marker_red") ?? UIImage(systemName: "mappin.circle.fill")
            annotationView?.image = redIcon
        }
        
        return annotationView
    }

    /**
     * 获取 annotation 视图（由 ExpoGaodeMapView 调用）
     */
    func getAnnotationView(for mapView: MAMapView, annotation: MAAnnotation) -> MAAnnotationView? {
        
        // 🔑 如果有 children，使用自定义视图
        if self.subviews.count > 0 {
            // 使用 class-level reuseId，便于系统复用 view，减少内存
            let reuseId = "custom_marker_children" + (growAnimation ? "_grow" : "")
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: reuseId)
            if annotationView == nil {
                if growAnimation {
                    annotationView = ExpoGrowAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
                } else {
                    annotationView = MAAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
                }
            }
            
            if let growView = annotationView as? ExpoGrowAnnotationView {
                growView.enableGrowAnimation = true
            }

            annotationView?.annotation = annotation
            annotationView?.canShowCallout = false
            annotationView?.isDraggable = draggable
            self.annotationView = annotationView

            // 生成 cacheKey 或 fallback 到 identifier
            let size = resolvedCustomSubviewSize(defaultSize: CGSize(width: 200, height: 40))
            let key = childrenCacheKey(for: size)

            // 1) 如果缓存命中，直接同步返回图像（fast path）
            if let cached = IconBitmapCache.shared.image(forKey: key) {
                annotationView?.image = cached
                if let annotationView = annotationView {
                    applyCenterOffset(to: annotationView, defaultOffset: .zero)
                }
                return annotationView
            }

            // 2) 缓存未命中：返回占位（透明），并异步在主线程生成图像然后回填
            UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
            let transparentImage = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()
            annotationView?.image = transparentImage

            // 🔑 修复:延长延迟时间,给 React Native Image 更多加载时间
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self, weak annotationView] in
                guard let self = self, let annotationView = annotationView else { return }
                // 再次检查缓存（避免重复渲染）
                if let cached = IconBitmapCache.shared.image(forKey: key) {
                    annotationView.image = cached
                    self.applyCenterOffset(to: annotationView, defaultOffset: .zero)
                    return
                }
                
                // 调用你的原生渲染逻辑（保留空白检测、多次 layout）
                if let generated = self.createImageFromSubviews() {
                    annotationView.image = generated
                    self.applyCenterOffset(to: annotationView, defaultOffset: .zero)
                } else {
                }
            }

            return annotationView
        }

        
        // 🔑 如果有 icon 属性，使用自定义图标
        if let iconUri = iconUri, !iconUri.isEmpty {
            let reuseId = "custom_marker_icon_\(ObjectIdentifier(self).hashValue)" + (growAnimation ? "_grow" : "")
            var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: reuseId)
            
            if annotationView == nil {
                if growAnimation {
                    annotationView = ExpoGrowAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
                } else {
                    annotationView = MAAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
                }
            }
            
            if let growView = annotationView as? ExpoGrowAnnotationView {
                growView.enableGrowAnimation = true
            }

            annotationView?.annotation = annotation
            // 只有在没有自定义内容时才使用 canShowCallout 设置
            annotationView?.canShowCallout = canShowCallout
            annotationView?.isDraggable = draggable
            self.annotationView = annotationView
            
            // 构建 key
            let key = iconCacheKey(for: iconUri)
            if let cached = IconBitmapCache.shared.image(forKey: key) {
                annotationView?.image = cached
                if let annotationView = annotationView {
                    applyCenterOffset(to: annotationView, defaultOffset: CGPoint(x: 0, y: -cached.size.height / 2))
                }
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
                        if let annotationView = annotationView {
                            self.applyCenterOffset(to: annotationView, defaultOffset: CGPoint(x: 0, y: -img.size.height / 2))
                        }
                    }
                }
            }

            
            return annotationView
        }
        
        // 🔑 既没有 children 也没有 icon，使用系统默认大头针
        // 🔑 性能优化：使用颜色作为 reuseId，让系统复用相同颜色的大头针
        let reuseId = "pin_marker_\(pinColor)" + (growAnimation ? "_grow" : "")
        var pinView = mapView.dequeueReusableAnnotationView(withIdentifier: reuseId) as? MAPinAnnotationView
        
        if pinView == nil {
            if growAnimation {
                pinView = ExpoGrowPinAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
            } else {
                pinView = MAPinAnnotationView(annotation: annotation, reuseIdentifier: reuseId)
            }
            
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
        
        if let growView = pinView as? ExpoGrowPinAnnotationView {
            growView.enableGrowAnimation = true
        }
        
        pinView?.annotation = annotation
        pinView?.canShowCallout = canShowCallout
        pinView?.isDraggable = draggable
        pinView?.animatesDrop = animatesDrop
        if let pinView = pinView {
            applyCenterOffset(to: pinView, defaultOffset: .zero)
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
        let size = resolvedCustomSubviewSize(defaultSize: CGSize(width: 200, height: 60))
        let key = childrenCacheKey(for: size)

        if let cachedImage = IconBitmapCache.shared.image(forKey: key) {
            return cachedImage
        }
        
        guard let firstSubview = subviews.first else {
            return nil
        }

        guard size.width > 0, size.height > 0 else {
            return nil
        }
        
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
        
   
        
        IconBitmapCache.shared.setImage(image, forKey: key)
        
        return image
    }

    private func iconCacheKey(for iconUri: String) -> String {
        let baseKey = cacheKey ?? "icon|\(iconUri)"
        return "\(baseKey)|\(Int(iconWidth.rounded()))x\(Int(iconHeight.rounded()))"
    }

    private func applyCenterOffset(to annotationView: MAAnnotationView, defaultOffset: CGPoint) {
        annotationView.centerOffset = resolvedCenterOffset(defaultOffset: defaultOffset)
    }

    private func resolvedCenterOffset(defaultOffset: CGPoint) -> CGPoint {
        guard let centerOffset else {
            return defaultOffset
        }

        let x = centerOffset["x"] ?? Double(defaultOffset.x)
        let y = centerOffset["y"] ?? Double(defaultOffset.y)
        return CGPoint(x: x, y: y)
    }

    private func currentDefaultCenterOffset() -> CGPoint {
        if !subviews.isEmpty {
            return .zero
        }

        if let image = annotationView?.image ?? animatedAnnotationView?.image {
            return CGPoint(x: 0, y: -image.size.height / 2)
        }

        if let iconUri, !iconUri.isEmpty {
            return CGPoint(x: 0, y: -iconHeight / 2)
        }

        return .zero
    }

    private func resolvedCustomSubviewSize(defaultSize: CGSize) -> CGSize {
        guard let firstSubview = subviews.first else {
            return defaultSize
        }

        if customViewWidth > 0 || customViewHeight > 0 {
            let width = customViewWidth > 0 ? CGFloat(customViewWidth) : defaultSize.width
            let height = customViewHeight > 0 ? CGFloat(customViewHeight) : defaultSize.height
            return CGSize(width: width, height: height)
        }

        forceLayoutRecursively(view: firstSubview)

        let compressedSize = firstSubview.systemLayoutSizeFitting(UIView.layoutFittingCompressedSize)
        let fittingSize = firstSubview.sizeThatFits(
            CGSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        )
        let intrinsicSize = firstSubview.intrinsicContentSize

        let width = resolvedDimension(
            candidates: [compressedSize.width, fittingSize.width, intrinsicSize.width, firstSubview.bounds.size.width],
            fallback: defaultSize.width
        )
        let height = resolvedDimension(
            candidates: [compressedSize.height, fittingSize.height, intrinsicSize.height, firstSubview.bounds.size.height],
            fallback: defaultSize.height
        )

        return CGSize(width: width, height: height)
    }

    private func resolvedDimension(candidates: [CGFloat], fallback: CGFloat) -> CGFloat {
        for value in candidates {
            if value.isFinite && value > 0 {
                return ceil(value)
            }
        }

        return fallback
    }

    private func childrenCacheKey(for size: CGSize) -> String {
        let baseKey = cacheKey ?? "children_\(ObjectIdentifier(self).hashValue)"
        let roundedWidth = Int(ceil(size.width))
        let roundedHeight = Int(ceil(size.height))
        return "\(baseKey)|\(roundedWidth)x\(roundedHeight)"
    }

    private func childrenRenderSignature() -> String {
        guard let firstSubview = subviews.first else {
            return "empty"
        }

        var parts: [String] = []

        func appendSignature(for view: UIView) {
            parts.append(String(describing: type(of: view)))
            let bounds = view.bounds
            parts.append("b:\(Int(bounds.width.rounded()))x\(Int(bounds.height.rounded()))")

            if let label = view as? UILabel {
                parts.append("t:\(label.text ?? "")")
            }

            if let imageView = view as? UIImageView,
               let image = imageView.image {
                parts.append("i:\(Int(image.size.width.rounded()))x\(Int(image.size.height.rounded()))")
            }

            parts.append("c:\(view.subviews.count)")
            for child in view.subviews {
                appendSignature(for: child)
            }
        }

        appendSignature(for: firstSubview)
        return parts.joined(separator: "|")
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
        pendingSubviewRefreshTask?.cancel(); pendingSubviewRefreshTask = nil

        guard let mapView = mapView else { 
            isRemoving = false
            return 
        }
        
        // 确保在主线程执行移除操作
        let cleanup = { [weak self, weak mapView] in
            guard let self = self, let mapView = mapView else { return }
            
            // 1. 停止任何正在进行的平滑移动
            if self.animatedAnnotation != nil {
                self.stopSmoothMove()
            }
            
            // 2. 移除普通标记点
            if let annotation = self.annotation {
                mapView.removeAnnotation(annotation)
                self.annotation = nil
            }

            self.annotationView = nil
            self.animatedAnnotationView = nil
            self.isRemoving = false
        }

        if Thread.isMainThread {
            cleanup()
        } else {
            DispatchQueue.main.async(execute: cleanup)
        }
    }

    override func willRemoveSubview(_ subview: UIView) {
        super.willRemoveSubview(subview)
        
        // 如果正在移除，不要执行任何操作
        guard !isRemoving else {
            return
        }
        
        scheduleSubviewRefresh(allowFallbackToDefault: true)
    }
    
    override func didAddSubview(_ subview: UIView) {
        super.didAddSubview(subview)
        
        // 如果正在移除，不要执行任何操作
        guard !isRemoving else {
            return
        }
        
        scheduleSubviewRefresh(allowFallbackToDefault: false)
    }

    private func scheduleSubviewRefresh(allowFallbackToDefault: Bool) {
        pendingSubviewRefreshTask?.cancel()

        let task = DispatchWorkItem { [weak self] in
            guard let self = self, !self.isRemoving else { return }
            self.refreshAnnotationForSubviewChanges(allowFallbackToDefault: allowFallbackToDefault)
        }

        pendingSubviewRefreshTask = task
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.02, execute: task)
    }

    private func refreshAnnotationForSubviewChanges(allowFallbackToDefault: Bool) {
        guard let mapView = mapView else { return }

        if annotation == nil {
            updateAnnotation()
            return
        }

        guard let annotation = annotation else { return }

        if subviews.isEmpty {
            if allowFallbackToDefault {
                lastRenderedChildrenSignature = nil
                annotationView = nil
                mapView.removeAnnotation(annotation)
                mapView.addAnnotation(annotation)
            }
            return
        }

        let signature = childrenRenderSignature()
        if signature == lastRenderedChildrenSignature, annotationView?.image != nil {
            return
        }

        invalidateCurrentChildrenCache()

        if annotationView is MAPinAnnotationView {
            annotationView = nil
            mapView.removeAnnotation(annotation)
            mapView.addAnnotation(annotation)
            return
        }

        guard let annotationView = annotationView else {
            mapView.removeAnnotation(annotation)
            mapView.addAnnotation(annotation)
            return
        }

        if let image = createImageFromSubviews() {
            annotationView.image = image
            annotationView.centerOffset = CGPoint(x: 0, y: 0)
            annotationView.canShowCallout = false
            annotationView.isDraggable = draggable
            lastRenderedChildrenSignature = signature
        }
    }

    private func invalidateCurrentChildrenCache() {
        let sizes = [
            resolvedCustomSubviewSize(defaultSize: CGSize(width: 200, height: 40)),
            resolvedCustomSubviewSize(defaultSize: CGSize(width: 200, height: 60))
        ]

        for size in sizes {
            IconBitmapCache.shared.removeImage(forKey: childrenCacheKey(for: size))
        }
    }

    private func refreshAnnotationAppearance(invalidateChildrenCache: Bool = false) {
        guard !isRemoving else { return }

        let refresh = { [weak self] in
            guard let self = self, let mapView = self.mapView else { return }

            self.pendingSubviewRefreshTask?.cancel()
            self.pendingSubviewRefreshTask = nil

            if invalidateChildrenCache {
                self.lastRenderedChildrenSignature = nil
                if !self.subviews.isEmpty {
                    self.invalidateCurrentChildrenCache()
                }
            }

            if let animatedAnnotation = self.animatedAnnotation {
                self.animatedAnnotationView = nil
                mapView.removeAnnotation(animatedAnnotation)
                mapView.addAnnotation(animatedAnnotation)
                return
            }

            if let annotation = self.annotation {
                self.annotationView = nil
                mapView.removeAnnotation(annotation)
                mapView.addAnnotation(annotation)
            } else {
                self.updateAnnotation()
            }
        }

        if Thread.isMainThread {
            refresh()
        } else {
            DispatchQueue.main.async(execute: refresh)
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
    func setPosition(_ position: [String: Double]?) {
        if let coord = LatLngParser.parseLatLng(position) {
            let pos = ["latitude": coord.latitude, "longitude": coord.longitude]
            if mapView != nil {
                // 地图已设置，直接更新
                self.position = pos
                updateAnnotation()
            } else {
                // 地图还未设置，保存位置待后续应用
                pendingPosition = pos
            }
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
        annotationView?.isDraggable = draggable
        animatedAnnotationView?.isDraggable = draggable
        updateAnnotation()
    }
    
    func setIconUri(_ uri: String?) {
        self.iconUri = uri
        refreshAnnotationAppearance()
    }

    func setIconWidth(_ width: Double) {
        guard iconWidth != width else { return }
        iconWidth = width
        if let iconUri, !iconUri.isEmpty {
            refreshAnnotationAppearance()
        }
    }

    func setIconHeight(_ height: Double) {
        guard iconHeight != height else { return }
        iconHeight = height
        if let iconUri, !iconUri.isEmpty {
            refreshAnnotationAppearance()
        }
    }

    func setCustomViewWidth(_ width: Double) {
        guard customViewWidth != width else { return }
        customViewWidth = width
        if !subviews.isEmpty {
            refreshAnnotationAppearance(invalidateChildrenCache: true)
        }
    }

    func setCustomViewHeight(_ height: Double) {
        guard customViewHeight != height else { return }
        customViewHeight = height
        if !subviews.isEmpty {
            refreshAnnotationAppearance(invalidateChildrenCache: true)
        }
    }
    
    func setCenterOffset(_ offset: [String: Double]) {
        self.centerOffset = offset
        if let annotationView = annotationView {
            applyCenterOffset(to: annotationView, defaultOffset: currentDefaultCenterOffset())
        }
        if let animatedAnnotationView = animatedAnnotationView {
            applyCenterOffset(to: animatedAnnotationView, defaultOffset: currentDefaultCenterOffset())
        }
    }
    
    func setAnimatesDrop(_ animate: Bool) {
        self.animatesDrop = animate
        (annotationView as? MAPinAnnotationView)?.animatesDrop = animate
    }
    
    func setPinColor(_ color: String) {
        guard pinColor != color else { return }
        self.pinColor = color
        if subviews.isEmpty && (iconUri?.isEmpty ?? true) {
            refreshAnnotationAppearance()
        }
    }
    
    func setCanShowCallout(_ show: Bool) {
        self.canShowCallout = show
        if subviews.isEmpty {
            annotationView?.canShowCallout = show
            animatedAnnotationView?.canShowCallout = show
        }
    }

    func setGrowAnimation(_ enabled: Bool) {
        guard growAnimation != enabled else { return }
        growAnimation = enabled
        refreshAnnotationAppearance()
    }
    
    // MARK: - 平滑移动相关方法
    
    /**
     * 设置平滑移动路径
     * @param path 坐标点数组
     */
    func setSmoothMovePath(_ path: [[String: Double]]) {
        self.smoothMovePath = path
        
        // 🔑 修复逻辑：如果路径为空，立即停止动画
        if path.isEmpty {
            if animatedAnnotation != nil || isAnimating {
                stopSmoothMove()
            }
        } else if mapView != nil && smoothMoveDuration > 0 {
            // 只有在时长也准备好的情况下才自动启动
            startSmoothMove()
        }
    }
    
    /**
      * 停止平滑移动并恢复静态标记
      */
    func stopSmoothMove() {
        // 🔑 确保在主线程执行
        let cleanup = { [weak self, weak mapView] in
            guard let self = self, let mapView = mapView else { return }
            
            // 1. 获取并取消所有动画 (遵循官方文档建议)
            if let animAnnotation = self.animatedAnnotation {
                let animations = animAnnotation.allMoveAnimations()
                if let animations = animations {
                    for animation in animations {
                        animation.cancel()
                    }
                }
                
                // 2. 从地图移除动画标注
                mapView.removeAnnotation(animAnnotation)
                self.animatedAnnotation = nil
                self.animatedAnnotationView = nil
            }
            
            // 🔑 强制重置所有状态
            self.isAnimating = false
            self.smoothMovePath = []
            self.smoothMoveDuration = 0
            
            // 3. 恢复静态标注（立即跳转到 position 所在位置）
            self.performUpdateAnnotation()
        }

        if Thread.isMainThread {
            cleanup()
        } else {
            DispatchQueue.main.async(execute: cleanup)
        }
    }
    
    /**
     * 设置平滑移动时长（秒）
     */
    func setSmoothMoveDuration(_ duration: Double) {
        // 🔑 修复：不要在这里设置默认值 10，如果 JS 传 0 或未定义，就应该是 0
        self.smoothMoveDuration = duration
        
        // 🔑 如果时长被设为 0 或负数，停止当前动画
        if duration <= 0 {
            if animatedAnnotation != nil || isAnimating {
                stopSmoothMove()
            }
            return
        }
        
        // 🔑 只有当路径、时长都合法且地图就绪时，才启动平滑移动
        if !smoothMovePath.isEmpty && duration > 0 && mapView != nil {
            startSmoothMove()
        }
    }
    
    /**
     * 启动平滑移动（由 JS 端手动调用）
     */
    func startSmoothMove() {
        guard !isRemoving, let mapView = mapView, !smoothMovePath.isEmpty, smoothMoveDuration > 0 else { 
            if smoothMovePath.isEmpty && animatedAnnotation != nil {
                stopSmoothMove()
            }
            return 
        }
        
        // 🔑 确保在主线程执行
        if !Thread.isMainThread {
            DispatchQueue.main.async { [weak self] in
                self?.startSmoothMove()
            }
            return
        }
        
        // 转换路径为 CLLocationCoordinate2D 数组
        // 使用 C++ 优化计算路径中的最近点
        var adjustedPath: [[String: Double]]? = nil
        
        // 只有当有当前位置时才尝试寻找最近点
        if let pos = position, let currentLat = pos["latitude"], let currentLng = pos["longitude"] {
            // 准备数据给 C++
            let latitudes = smoothMovePath.compactMap { $0["latitude"] as NSNumber? }
            let longitudes = smoothMovePath.compactMap { $0["longitude"] as NSNumber? }
            
            if latitudes.count == longitudes.count && !latitudes.isEmpty {
                let lats = latitudes
                let lons = longitudes
                if let result = ClusterNative.getNearestPointOnPath(latitudes: lats,
                                                                  longitudes: lons,
                                                                  targetLat: currentLat,
                                                                  targetLon: currentLng) as? [String: Any] {
                    
                    if let indexNum = result["index"] as? NSNumber,
                       let lat = result["latitude"] as? Double,
                       let lon = result["longitude"] as? Double {
                        
                        let index = indexNum.intValue
                        if index >= 0 && index < smoothMovePath.count - 1 {
                            // 从 index + 1 开始截取
                            let subPath = Array(smoothMovePath[(index + 1)...])
                            // 插入投影点作为起点
                            var newPath = subPath
                            newPath.insert(["latitude": lat, "longitude": lon], at: 0)
                            adjustedPath = newPath
                        }
                    }
                }
            }
        }
        
        // 如果没有调整路径（C++计算失败或不需要调整），使用原始路径
        let finalPath = adjustedPath ?? smoothMovePath
        
        var coordinates = LatLngParser.parseLatLngList(finalPath)
        
        guard !coordinates.isEmpty else { return }
        
        // 🔑 停止之前的动画（如果存在）
        if let animAnnotation = animatedAnnotation,
           let animations = animAnnotation.allMoveAnimations() {
            for animation in animations {
                animation.cancel()
            }
        }
        
        // 🔑 重置动画标志
        isAnimating = false
        
        // 创建 MAAnimatedAnnotation（如果还没有）
        if animatedAnnotation == nil {
            animatedAnnotation = MAAnimatedAnnotation()
            
            // 设置初始位置
            if let pos = position, let startLat = pos["latitude"], let startLng = pos["longitude"] {
                animatedAnnotation?.coordinate = CLLocationCoordinate2D(latitude: startLat, longitude: startLng)
            }
            
            // 隐藏原始 annotation
            if let existingAnnotation = annotation {
                mapView.removeAnnotation(existingAnnotation)
            }
            
            // 添加 animated annotation
            if let anim = animatedAnnotation {
                mapView.addAnnotation(anim)
            }
        }
        
        // 添加移动动画
        guard let animAnnotation = animatedAnnotation else { return }
        
        // 复制到局部变量，避免 Swift 内存安全冲突
        let coordinateCount = coordinates.count
        let duration = smoothMoveDuration
        
        // 🔑 设置动画标志
        isAnimating = true
        
        // 转换为 UnsafeMutablePointer 传递给 C 风格的 API
        coordinates.withUnsafeMutableBufferPointer { buffer in
            let coords = buffer.baseAddress!
            
            animAnnotation.addMoveAnimation(
                withKeyCoordinates: coords,
                count: UInt(coordinateCount),
                withDuration: CGFloat(duration),
                withName: nil,
                completeCallback: { [weak self] isFinished in
                    // 动画完成时重置标志
                    self?.isAnimating = false
                }
            )
        }
    }
    
    /**
     * 析构函数 - 不执行任何清理
     * 清理工作已在 willMove(toSuperview:) 中完成
     */
    deinit {
        // 取消待处理的任务
        pendingAddTask?.cancel()
        pendingUpdateTask?.cancel()
        pendingSubviewRefreshTask?.cancel()
        
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

// MARK: - 自定义 AnnotationView (支持生长动画)

class ExpoGrowAnnotationView: MAAnnotationView, CAAnimationDelegate {
    var enableGrowAnimation: Bool = false
    private var didAnimateOnce: Bool = false

    override func prepareForReuse() {
        super.prepareForReuse()
        didAnimateOnce = false
    }
    
    override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)
        
        if enableGrowAnimation, let _ = newSuperview, !didAnimateOnce {
            didAnimateOnce = true
       
            // 缩放动画
            let scaleAnimation = CABasicAnimation(keyPath: "transform.scale")
            scaleAnimation.fromValue = 0
            scaleAnimation.toValue = 1.0
            
            // 透明度动画
            let opacityAnimation = CABasicAnimation(keyPath: "opacity")
            opacityAnimation.fromValue = 0
            opacityAnimation.toValue = 1.0
            
            // 组合动画
            let groupAnimation = CAAnimationGroup()
            groupAnimation.animations = [scaleAnimation, opacityAnimation]
            groupAnimation.delegate = self
            groupAnimation.duration = 0.8 // 与 Android 保持一致 (500ms)
            groupAnimation.timingFunction = CAMediaTimingFunction(name: .linear)
            groupAnimation.fillMode = .forwards
            groupAnimation.isRemovedOnCompletion = false
            
            self.layer.add(groupAnimation, forKey: "growAnimation")
        }
    }
}

class ExpoGrowPinAnnotationView: MAPinAnnotationView, CAAnimationDelegate {
    var enableGrowAnimation: Bool = false
    private var didAnimateOnce: Bool = false

    override func prepareForReuse() {
        super.prepareForReuse()
        didAnimateOnce = false
    }
    
    override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)
        
        if enableGrowAnimation, let _ = newSuperview, !didAnimateOnce {
            didAnimateOnce = true
            // 缩放动画
            let scaleAnimation = CABasicAnimation(keyPath: "transform.scale")
            scaleAnimation.fromValue = 0
            scaleAnimation.toValue = 1.0
            
            // 透明度动画
            let opacityAnimation = CABasicAnimation(keyPath: "opacity")
            opacityAnimation.fromValue = 0
            opacityAnimation.toValue = 1.0
            
            // 组合动画
            let groupAnimation = CAAnimationGroup()
            groupAnimation.animations = [scaleAnimation, opacityAnimation]
            groupAnimation.delegate = self
            groupAnimation.duration = 0.5 // 与 Android 保持一致 (500ms)
            groupAnimation.timingFunction = CAMediaTimingFunction(name: .linear)
            groupAnimation.fillMode = .forwards
            groupAnimation.isRemovedOnCompletion = false
            
            self.layer.add(groupAnimation, forKey: "growAnimation")
        }
    }
}
