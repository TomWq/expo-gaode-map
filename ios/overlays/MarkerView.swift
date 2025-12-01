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
    var onMarkerPress = EventDispatcher() {
        didSet {
            print("🎯 [MarkerView] onMarkerPress EventDispatcher 已设置")
        }
    }
    var onMarkerDragStart = EventDispatcher() {
        didSet {
            print("🎯 [MarkerView] onMarkerDragStart EventDispatcher 已设置")
        }
    }
    var onMarkerDrag = EventDispatcher() {
        didSet {
            print("🎯 [MarkerView] onMarkerDrag EventDispatcher 已设置")
        }
    }
    var onMarkerDragEnd = EventDispatcher() {
        didSet {
            print("🎯 [MarkerView] onMarkerDragEnd EventDispatcher 已设置")
        }
    }
    
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
     * 查找父地图视图（新架构修复）
     */
    func findParentMapView() -> MAMapView? {
        // 🔑 新架构修复：从全局注册表获取地图
        return MapRegistry.shared.getMainMap()
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
        // 避免重复设置
        if self.mapView != nil {
            print("📍 MarkerView.setMap: 地图已连接，跳过重复设置")
            return
        }
        
        print("📍 MarkerView.setMap: 首次设置地图")
        self.mapView = map
        
        // 🔑 新架构修复：注册到全局注册表
        MapRegistry.shared.registerOverlay(self)
        
        // 如果有待处理的位置，先应用它
        if let pending = pendingPosition {
            self.position = pending
            pendingPosition = nil
        }
        
        updateAnnotation()
    }
    
    /**
     * 更新标记点
     */
    func updateAnnotation() {
        guard let mapView = mapView,
              let latitude = position["latitude"],
              let longitude = position["longitude"] else {
            return
        }
        
        // 取消之前的延迟任务
        pendingAddTask?.cancel()
        
        // 移除旧的标记（在主线程执行）
        if let oldAnnotation = annotation {
            DispatchQueue.main.async {
                mapView.removeAnnotation(oldAnnotation)
            }
        }
        
        // 创建新的标记
        let annotation = MAPointAnnotation()
        annotation.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        annotation.title = title
        annotation.subtitle = markerDescription
        
        self.annotation = annotation
        
        // 延迟添加到地图，等待 React Native 渲染 children
        let task = DispatchWorkItem { [weak self] in
            guard let self = self, !self.isRemoving else {
                print("⚠️ [MarkerView] 延迟任务取消，isRemoving: \(self?.isRemoving ?? true)")
                return
            }
            print("✅ [MarkerView] Annotation 延迟添加，当前 subviews: \(self.subviews.count)")
            mapView.addAnnotation(annotation)
        }
        pendingAddTask = task
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1, execute: task)
    }
    
    /**
     * 获取 annotation 视图（由 ExpoGaodeMapView 调用）
     */
    func getAnnotationView(for mapView: MAMapView, annotation: MAAnnotation) -> MAAnnotationView? {
        print("🎨 [MarkerView] getAnnotationView 被调用")
        print("🎨 [MarkerView] subviews.count: \(self.subviews.count)")
        print("🎨 [MarkerView] iconUri: \(String(describing: iconUri))")
        
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
            
            print("🎨 [MarkerView] 尝试创建自定义图片...")
            if let image = self.createImageFromSubviews() {
                print("✅ [MarkerView] 自定义图片创建成功, size: \(image.size)")
                annotationView?.image = image
                annotationView?.centerOffset = CGPoint(x: 0, y: -image.size.height / 2)
            } else {
                print("❌ [MarkerView] 自定义图片创建失败，返回 nil 使用系统默认")
                return nil
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
                    print("❌ [MarkerView] 图标加载失败")
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
                    print("✅ [MarkerView] 自定义图标已设置, size: \(size)")
                }
            }
            
            return annotationView
        }
        
        // 🔑 既没有 children 也没有 icon，使用系统默认大头针
        print("📍 [MarkerView] 使用系统默认大头针")
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
        guard let firstSubview = subviews.first else { return nil }
        
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
        
        // 递归强制布局所有子视图
        forceLayoutRecursively(view: firstSubview)
        
        UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        guard let context = UIGraphicsGetCurrentContext() else { return nil }
        
        // 使用 drawHierarchy 而不是 layer.render，这样能正确渲染 Text
        firstSubview.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true)
        
        return UIGraphicsGetImageFromCurrentImageContext()
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
     * 🔑 关键修复：只有在真正移除（newSuperview == nil）时才清理
     * 移动到 markerContainer 时不应该清理
     */
    override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)
        
        print("📍 [MarkerView] willMove(toSuperview:), newSuperview = \(String(describing: newSuperview))")
        print("📍 [MarkerView] newSuperview 类型 = \(newSuperview != nil ? String(describing: type(of: newSuperview!)) : "nil")")
        
        // 🔑 只有在 newSuperview 为 nil 时才是真正的移除
        // 移动到 markerContainer 时 newSuperview 不为 nil
        if newSuperview == nil {
            print("📍 [MarkerView] 真正移除，清理 annotation")
            removeAnnotationFromMap()
        } else {
            print("📍 [MarkerView] 移动到新父视图，不清理 annotation")
        }
    }
    
    /**
     * 从地图移除标记点
     */
    private func removeAnnotationFromMap() {
        guard !isRemoving else { return }
        isRemoving = true
        
        print("🗑️ [MarkerView] removeAnnotationFromMap 被调用")
        
        // 🔑 新架构修复：从全局注册表注销
        MapRegistry.shared.unregisterOverlay(self)
        
        // 取消任何待处理的延迟任务
        pendingAddTask?.cancel()
        pendingAddTask = nil
        
        // 立即保存引用并清空属性，避免在异步块中访问 self
        guard let mapView = mapView, let annotation = annotation else {
            print("⚠️ [MarkerView] 没有 annotation 需要移除")
            return
        }
        self.annotation = nil
        self.annotationView = nil
        
        // 同步移除，避免对象在异步块执行时已被释放
        if Thread.isMainThread {
            mapView.removeAnnotation(annotation)
            print("✅ [MarkerView] Annotation 已从地图移除（主线程）")
        } else {
            DispatchQueue.main.sync {
                mapView.removeAnnotation(annotation)
                print("✅ [MarkerView] Annotation 已从地图移除（同步到主线程）")
            }
        }
    }
    
    override func willRemoveSubview(_ subview: UIView) {
        super.willRemoveSubview(subview)
        
        // 如果正在移除，不要执行任何操作
        guard !isRemoving else {
            print("⚠️ [MarkerView] willRemoveSubview 被调用但正在移除，忽略")
            return
        }
        
        print("🎨 [MarkerView] willRemoveSubview 被调用，剩余 subviews.count: \(self.subviews.count - 1)")
        
        // 子视图移除后，需要刷新 annotation 视图
        if self.subviews.count <= 1 {
            // 所有子视图已移除，刷新以恢复默认图标
            if let mapView = mapView, let annotation = annotation {
                DispatchQueue.main.async { [weak self] in
                    guard let self = self, !self.isRemoving else {
                        print("⚠️ [MarkerView] 异步刷新时已被移除，取消操作")
                        return
                    }
                    mapView.removeAnnotation(annotation)
                    mapView.addAnnotation(annotation)
                    print("✅ [MarkerView] Annotation 已刷新为默认图标")
                }
            }
        }
    }
    
    override func didAddSubview(_ subview: UIView) {
        super.didAddSubview(subview)
        
        // 如果正在移除，不要执行任何操作
        guard !isRemoving else {
            print("⚠️ [MarkerView] didAddSubview 被调用但正在移除，忽略")
            return
        }
        
        print("🎨 [MarkerView] didAddSubview 被调用，subviews.count: \(self.subviews.count)")
        
        // 子视图添加后，需要刷新 annotation 视图
        // 通过移除并重新添加 annotation 来触发 getAnnotationView 调用
        if let mapView = mapView, let annotation = annotation {
            DispatchQueue.main.async { [weak self] in
                guard let self = self, !self.isRemoving else {
                    print("⚠️ [MarkerView] 异步刷新时已被移除，取消操作")
                    return
                }
                mapView.removeAnnotation(annotation)
                mapView.addAnnotation(annotation)
                print("✅ [MarkerView] Annotation 已刷新")
            }
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
        // 不执行任何操作，避免访问已释放的对象
        // 所有清理都应该在 willMove(toSuperview:) 中完成
    }
}
