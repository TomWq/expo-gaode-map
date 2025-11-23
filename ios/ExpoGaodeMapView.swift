import ExpoModulesCore
import MAMapKit

/**
 * 高德地图视图组件
 * 
 * 负责:
 * - 地图视图的创建和管理
 * - 相机控制和手势交互
 * - 覆盖物的添加和管理
 * - 地图事件的派发
 */
class ExpoGaodeMapView: ExpoView, MAMapViewDelegate {
    // MARK: - 属性
    
    /// 地图类型 (0:标准 1:卫星 2:夜间 3:导航)
    var mapType: Int = 0
    /// 初始相机位置
    var initialCameraPosition: [String: Any]?
    /// 是否显示缩放控件
    var showsZoomControls: Bool = true
    /// 是否显示指南针
    var showsCompass: Bool = true
    /// 是否显示比例尺
    var showsScale: Bool = true
    /// 是否启用缩放手势
    var isZoomEnabled: Bool = true
    /// 是否启用滚动手势
    var isScrollEnabled: Bool = true
    /// 是否启用旋转手势
    var isRotateEnabled: Bool = true
    /// 是否启用倾斜手势
    var isTiltEnabled: Bool = true
    /// 是否显示用户位置
    var showsUserLocation: Bool = false
    /// 是否跟随用户位置
    var followUserLocation: Bool = false {
        didSet {
            if showsUserLocation {
                uiManager?.setShowsUserLocation(true, followUser: followUserLocation)
            }
        }
    }
    /// 用户位置样式配置
    var userLocationRepresentation: [String: Any]?
    /// 是否显示交通路况
    var showsTraffic: Bool = false
    /// 是否显示建筑物
    var showsBuildings: Bool = false
    /// 是否显示室内地图
    var showsIndoorMap: Bool = false
    /// 最大缩放级别
    var maxZoomLevel: CGFloat = 20
    /// 最小缩放级别
    var minZoomLevel: CGFloat = 3
    
    // MARK: - 事件派发器
    
    let onMapPress = EventDispatcher()
    let onMapLongPress = EventDispatcher()
    let onLoad = EventDispatcher()
    let onLocation = EventDispatcher()
    let onMarkerPress = EventDispatcher()
    let onMarkerDragStart = EventDispatcher()
    let onMarkerDrag = EventDispatcher()
    let onMarkerDragEnd = EventDispatcher()
    let onCirclePress = EventDispatcher()
    let onPolygonPress = EventDispatcher()
    let onPolylinePress = EventDispatcher()
    
    // MARK: - 私有属性
    
    /// 高德地图视图实例
    private var mapView: MAMapView!
    /// 相机管理器
    private var cameraManager: CameraManager!
    /// UI 管理器
    private var uiManager: UIManager!
    /// 覆盖物管理器
    private var overlayManager: OverlayManager!
    /// 地图是否已加载完成
    private var isMapLoaded = false
    /// 是否正在处理 annotation 选择事件
    private var isHandlingAnnotationSelect = false
    /// MarkerView 的隐藏容器（用于渲染 children）
    private var markerContainer: UIView!
    
    // MARK: - 初始化
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        
        // 确保隐私合规已设置
        MAMapView.updatePrivacyAgree(.didAgree)
        MAMapView.updatePrivacyShow(.didShow, privacyInfo: .didContain)
        
        // 创建 MAMapView
        mapView = MAMapView(frame: bounds)
        
        mapView.delegate = self
        mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
        // 创建 MarkerView 隐藏容器
        markerContainer = UIView(frame: CGRect(x: 0, y: 0, width: 1, height: 1))
        markerContainer.isHidden = true
        markerContainer.isUserInteractionEnabled = false
        markerContainer.alpha = 0
        
        // 先添加隐藏容器（在最底层）
        addSubview(markerContainer)
        
        // 再添加 mapView（在隐藏容器之上，确保地图可以接收触摸）
        addSubview(mapView)
        
        cameraManager = CameraManager(mapView: mapView)
        uiManager = UIManager(mapView: mapView)
        
        // 设置定位变化回调
        uiManager.onLocationChanged = { [weak self] latitude, longitude, accuracy in
            self?.onLocation([
                "latitude": latitude,
                "longitude": longitude,
                "accuracy": accuracy,
                "timestamp": Date().timeIntervalSince1970 * 1000
            ])
        }
        
        overlayManager = OverlayManager(mapView: mapView)
        
        // 设置覆盖物点击回调
        overlayManager.onCirclePress = { [weak self] event in
            self?.onCirclePress(event)
        }
        overlayManager.onPolygonPress = { [weak self] event in
            self?.onPolygonPress(event)
        }
        overlayManager.onPolylinePress = { [weak self] event in
            self?.onPolylinePress(event)
        }
        
        setupDefaultConfig()
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        mapView.frame = bounds
        
        // 收集并设置 MarkerView
        collectAndSetupMarkerViews()
    }
    
    /**
     * 收集所有 MarkerView 子视图并设置地图
     */
    private func collectAndSetupMarkerViews() {
        // 从隐藏容器中收集 MarkerView
        for subview in markerContainer.subviews {
            if let markerView = subview as? MarkerView {
                markerView.setMap(mapView)
            }
        }
    }
    
    /**
     * 添加子视图时自动连接到地图
     * 将地图实例传递给覆盖物子视图
     */
    override func addSubview(_ view: UIView) {
        if let markerView = view as? MarkerView {
            // ✅ 关键修复：将 MarkerView 添加到隐藏容器中，而不是主视图
            // 这样 MarkerView 完全不会影响地图的触摸事件
            markerContainer.addSubview(markerView)
            markerView.setMap(mapView)
            return
        }
        
        // 其他视图正常添加
        super.addSubview(view)
        
        if let circleView = view as? CircleView {
            circleView.setMap(mapView)
        } else if let polylineView = view as? PolylineView {
            polylineView.setMap(mapView)
        } else if let polygonView = view as? PolygonView {
            polygonView.setMap(mapView)
        } else if let heatMapView = view as? HeatMapView {
            heatMapView.setMap(mapView)
        } else if let multiPointView = view as? MultiPointView {
            multiPointView.setMap(mapView)
        } else if let clusterView = view as? ClusterView {
            clusterView.setMap(mapView)
        }
    }
    
    /**
     * 设置默认配置
     */
    private func setupDefaultConfig() {
        uiManager.setMapType(0)
        uiManager.setShowsScale(showsScale)
        uiManager.setShowsCompass(showsCompass)
        uiManager.setZoomEnabled(isZoomEnabled)
        uiManager.setScrollEnabled(isScrollEnabled)
        uiManager.setRotateEnabled(isRotateEnabled)
        uiManager.setTiltEnabled(isTiltEnabled)
        uiManager.setShowsUserLocation(showsUserLocation, followUser: followUserLocation)
    }
    
    /**
     * 应用所有属性配置
     * 在 Props 更新时调用
     */
    func applyProps() {
        uiManager.setMapType(mapType)
        
        // 如果有初始位置，设置相机位置
        if let position = initialCameraPosition {
            cameraManager.setInitialCameraPosition(position)
        }
        
        uiManager.setShowsScale(showsScale)
        uiManager.setShowsCompass(showsCompass)
        uiManager.setZoomEnabled(isZoomEnabled)
        uiManager.setScrollEnabled(isScrollEnabled)
        uiManager.setRotateEnabled(isRotateEnabled)
        uiManager.setTiltEnabled(isTiltEnabled)
        uiManager.setShowsUserLocation(showsUserLocation, followUser: followUserLocation)
        uiManager.setShowsTraffic(showsTraffic)
        uiManager.setShowsBuildings(showsBuildings)
        uiManager.setShowsIndoorMap(showsIndoorMap)
        
        // 收集并设置所有 MarkerView
        collectAndSetupMarkerViews()
    }
    
    // MARK: - 缩放控制
    
    func setMaxZoom(_ maxZoom: Double) {
        cameraManager.setMaxZoomLevel(CGFloat(maxZoom))
    }
    
    func setMinZoom(_ minZoom: Double) {
        cameraManager.setMinZoomLevel(CGFloat(minZoom))
    }
    
    // MARK: - 相机控制
    
    func moveCamera(position: [String: Any], duration: Int) {
        cameraManager.moveCamera(position: position, duration: duration)
    }
    
    func getLatLng(point: [String: Double]) -> [String: Double] {
        return cameraManager.getLatLng(point: point)
    }
    
    func setCenter(center: [String: Double], animated: Bool) {
        cameraManager.setCenter(center: center, animated: animated)
    }
    
    func setZoom(zoom: Double, animated: Bool) {
        cameraManager.setZoomLevel(zoom: CGFloat(zoom), animated: animated)
    }
    
    func getCameraPosition() -> [String: Any] {
        return cameraManager.getCameraPosition()
    }
    
    // MARK: - 覆盖物管理
    
    func addCircle(id: String, props: [String: Any]) {
        overlayManager.addCircle(id: id, props: props)
    }
    
    func removeCircle(id: String) {
        overlayManager.removeCircle(id: id)
    }
    
    func updateCircle(id: String, props: [String: Any]) {
        overlayManager.updateCircle(id: id, props: props)
    }
    
    func addMarker(id: String, props: [String: Any]) {
        overlayManager.addMarker(id: id, props: props)
    }
    
    func removeMarker(id: String) {
        overlayManager.removeMarker(id: id)
    }
    
    func updateMarker(id: String, props: [String: Any]) {
        overlayManager.updateMarker(id: id, props: props)
    }
    
    func addPolyline(id: String, props: [String: Any]) {
        overlayManager.addPolyline(id: id, props: props)
    }
    
    func removePolyline(id: String) {
        overlayManager.removePolyline(id: id)
    }
    
    func updatePolyline(id: String, props: [String: Any]) {
        overlayManager.updatePolyline(id: id, props: props)
    }
    
    func addPolygon(id: String, props: [String: Any]) {
        overlayManager.addPolygon(id: id, props: props)
    }
    
    func removePolygon(id: String) {
        overlayManager.removePolygon(id: id)
    }
    
    func updatePolygon(id: String, props: [String: Any]) {
        overlayManager.updatePolygon(id: id, props: props)
    }
    
    // MARK: - 图层控制
    
    func setShowsTraffic(_ show: Bool) {
        showsTraffic = show
        uiManager.setShowsTraffic(show)
    }
    
    func setShowsBuildings(_ show: Bool) {
        showsBuildings = show
        uiManager.setShowsBuildings(show)
    }
    
    func setShowsIndoorMap(_ show: Bool) {
        showsIndoorMap = show
        uiManager.setShowsIndoorMap(show)
    }
    
    func setFollowUserLocation(_ follow: Bool) {
        followUserLocation = follow
        uiManager.setShowsUserLocation(showsUserLocation, followUser: follow)
    }
    
    func setShowsUserLocation(_ show: Bool) {
        showsUserLocation = show
        uiManager.setShowsUserLocation(show, followUser: followUserLocation)
        if show {
            applyUserLocationStyle()
        }
    }
    
    func setUserLocationRepresentation(_ config: [String: Any]) {
        userLocationRepresentation = config
        if showsUserLocation {
            uiManager.setUserLocationRepresentation(config)
        }
    }
    
    /**
     * 应用用户位置样式
     */
    private func applyUserLocationStyle() {
        guard let config = userLocationRepresentation else { return }
        uiManager.setUserLocationRepresentation(config)
    }
    
    /**
     * 析构函数 - 清理资源
     */
    deinit {
        // 先设置 delegate 为 nil，停止接收回调
        mapView?.delegate = nil
    }
}

// MARK: - MAMapViewDelegate

extension ExpoGaodeMapView {
    /**
     * 地图加载完成回调
     */
    public func mapViewDidFinishLoadingMap(_ mapView: MAMapView) {
        guard !isMapLoaded else { return }
        isMapLoaded = true
        onLoad(["loaded": true])
    }
    
    /**
     * 地图单击事件
     */
    public func mapView(_ mapView: MAMapView, didSingleTappedAt coordinate: CLLocationCoordinate2D) {
        // 如果正在处理 annotation 选择，跳过地图点击事件
        if isHandlingAnnotationSelect {
            isHandlingAnnotationSelect = false
            return
        }
        
        // 检查是否点击了圆形 (声明式 CircleView)
        if checkCirclePress(at: coordinate) {
            return
        }
        
        // 检查是否点击了圆形 (命令式 API)
        if overlayManager.checkCirclePress(at: coordinate) {
            return
        }
        
        // 检查是否点击了多边形 (声明式)
        if checkPolygonPress(at: coordinate) {
            return
        }
        
        // 检查是否点击了多边形 (命令式 API)
        if overlayManager.checkPolygonPress(at: coordinate) {
            return
        }
        
        // 检查是否点击了折线 (声明式)
        if checkPolylinePress(at: coordinate) {
            return
        }
        
        // 检查是否点击了折线 (命令式 API)
        if overlayManager.checkPolylinePress(at: coordinate) {
            return
        }
        
        onMapPress(["latitude": coordinate.latitude, "longitude": coordinate.longitude])
    }
    
    /**
     * 检查点击位置是否在圆形内
     */
    private func checkCirclePress(at coordinate: CLLocationCoordinate2D) -> Bool {
        let circleViews = subviews.compactMap { $0 as? CircleView }
        
        for circleView in circleViews {
            guard let circle = circleView.circle else { continue }
            
            let circleCenter = circle.coordinate
            let distance = calculateDistance(from: coordinate, to: circleCenter)
            
            if distance <= circle.radius {
                circleView.onPress([
                    "latitude": coordinate.latitude,
                    "longitude": coordinate.longitude
                ])
                return true
            }
        }
        return false
    }
    
    /**
     * 计算两点间距离(米)
     */
    private func calculateDistance(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let fromLocation = CLLocation(latitude: from.latitude, longitude: from.longitude)
        let toLocation = CLLocation(latitude: to.latitude, longitude: to.longitude)
        return fromLocation.distance(from: toLocation)
    }
    
    /**
     * 检查点击位置是否在多边形内
     */
    private func checkPolygonPress(at coordinate: CLLocationCoordinate2D) -> Bool {
        let polygonViews = subviews.compactMap { $0 as? PolygonView }
        
        for polygonView in polygonViews {
            guard let polygon = polygonView.polygon else { continue }
            
            // 使用射线法判断点是否在多边形内
            if isPoint(coordinate, inPolygon: polygon) {
                polygonView.onPress([
                    "latitude": coordinate.latitude,
                    "longitude": coordinate.longitude
                ])
                return true
            }
        }
        return false
    }
    
    /**
     * 检查点击位置是否在折线附近
     */
    private func checkPolylinePress(at coordinate: CLLocationCoordinate2D) -> Bool {
        let polylineViews = subviews.compactMap { $0 as? PolylineView }
        let threshold: Double = 20.0 // 20米容差
        
        for polylineView in polylineViews {
            guard let polyline = polylineView.polyline else { continue }
            
            if isPoint(coordinate, nearPolyline: polyline, threshold: threshold) {
                polylineView.onPress([
                    "latitude": coordinate.latitude,
                    "longitude": coordinate.longitude
                ])
                return true
            }
        }
        return false
    }
    
    /**
     * 判断点是否在多边形内(射线法)
     */
    private func isPoint(_ point: CLLocationCoordinate2D, inPolygon polygon: MAPolygon) -> Bool {
        let count = Int(polygon.pointCount)
        guard count >= 3 else { return false }
        
        var coords = [CLLocationCoordinate2D](repeating: CLLocationCoordinate2D(), count: count)
        polygon.getCoordinates(&coords, range: NSRange(location: 0, length: count))
        
        var inside = false
        var j = count - 1
        
        for i in 0..<count {
            let xi = coords[i].longitude
            let yi = coords[i].latitude
            let xj = coords[j].longitude
            let yj = coords[j].latitude
            
            if ((yi > point.latitude) != (yj > point.latitude)) {
                let slope = (xj - xi) * (point.latitude - yi) / (yj - yi)
                if point.longitude < slope + xi {
                    inside = !inside
                }
            }
            j = i
        }
        return inside
    }
    
    /**
     * 判断点是否在折线附近
     */
    private func isPoint(_ point: CLLocationCoordinate2D, nearPolyline polyline: MAPolyline, threshold: Double) -> Bool {
        let count = Int(polyline.pointCount)
        guard count >= 2 else { return false }
        
        var coords = [CLLocationCoordinate2D](repeating: CLLocationCoordinate2D(), count: count)
        polyline.getCoordinates(&coords, range: NSRange(location: 0, length: count))
        
        for i in 0..<(count - 1) {
            let start = coords[i]
            let end = coords[i + 1]
            let distance = distanceFromPoint(point, toLineSegment: (start, end))
            if distance <= threshold {
                return true
            }
        }
        return false
    }
    
    /**
     * 计算点到线段的距离
     */
    private func distanceFromPoint(_ point: CLLocationCoordinate2D, toLineSegment line: (CLLocationCoordinate2D, CLLocationCoordinate2D)) -> Double {
        let p = CLLocation(latitude: point.latitude, longitude: point.longitude)
        let a = CLLocation(latitude: line.0.latitude, longitude: line.0.longitude)
        let b = CLLocation(latitude: line.1.latitude, longitude: line.1.longitude)
        
        let ab = a.distance(from: b)
        let ap = a.distance(from: p)
        let bp = b.distance(from: p)
        
        if ab == 0 { return ap }
        
        let t = max(0, min(1, ((p.coordinate.latitude - a.coordinate.latitude) * (b.coordinate.latitude - a.coordinate.latitude) +
                               (p.coordinate.longitude - a.coordinate.longitude) * (b.coordinate.longitude - a.coordinate.longitude)) /
                              (ab * ab)))
        
        let projection = CLLocationCoordinate2D(
            latitude: a.coordinate.latitude + t * (b.coordinate.latitude - a.coordinate.latitude),
            longitude: a.coordinate.longitude + t * (b.coordinate.longitude - a.coordinate.longitude)
        )
        
        return p.distance(from: CLLocation(latitude: projection.latitude, longitude: projection.longitude))
    }
    
    /**
     * 地图长按事件
     */
    public func mapView(_ mapView: MAMapView, didLongPressedAt coordinate: CLLocationCoordinate2D) {
        onMapLongPress(["latitude": coordinate.latitude, "longitude": coordinate.longitude])
    }
    
    /**
     * 创建标注视图
     * 定位蓝点返回 nil 使用系统默认样式
     */
    public func mapView(_ mapView: MAMapView, viewFor annotation: MAAnnotation) -> MAAnnotationView? {
        if annotation.isKind(of: MAUserLocation.self) {
            return nil
        }
        
        if annotation.isKind(of: MAPointAnnotation.self) {
            // 首先检查是否是声明式 MarkerView 的 annotation
            // 从隐藏容器中查找 MarkerView
            for subview in markerContainer.subviews {
                if let markerView = subview as? MarkerView, markerView.annotation === annotation {
                    return markerView.getAnnotationView(for: mapView, annotation: annotation)
                }
            }
            
            // 如果不是声明式的，检查是否是命令式 API 的 Marker
            guard let props = overlayManager.getMarkerProps(for: annotation) else {
                return nil
            }
            
            let iconUri = props["icon"] as? String
            let iconWidth = props["iconWidth"] as? Double ?? 40
            let iconHeight = props["iconHeight"] as? Double ?? 40
            let pinColor = props["pinColor"] as? String ?? "red"
            let draggable = props["draggable"] as? Bool ?? false
            
            // 如果有自定义图标，使用 MAAnnotationView
            if let iconUri = iconUri, !iconUri.isEmpty {
                var annotationView = mapView.dequeueReusableAnnotationView(withIdentifier: "custom_marker")
                if annotationView == nil {
                    annotationView = MAAnnotationView(annotation: annotation, reuseIdentifier: "custom_marker")
                }
                annotationView?.annotation = annotation
                annotationView?.canShowCallout = true
                annotationView?.isDraggable = draggable
                
                // 加载图标
                loadMarkerIcon(iconUri: iconUri) { image in
                    if let img = image {
                        // 调整图标大小
                        let size = CGSize(width: iconWidth, height: iconHeight)
                        UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
                        img.draw(in: CGRect(origin: .zero, size: size))
                        let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
                        UIGraphicsEndImageContext()
                        
                        annotationView?.image = resizedImage
                        // 设置中心点偏移，使标注底部中间点成为经纬度对应点
                        annotationView?.centerOffset = CGPoint(x: 0, y: -iconHeight / 2)
                    }
                }
                
                return annotationView
            }
            
            // 使用大头针样式
            guard let pinView = MAPinAnnotationView(annotation: annotation, reuseIdentifier: "pin_marker") else {
                return nil
            }
            pinView.canShowCallout = true
            pinView.animatesDrop = true
            pinView.isDraggable = draggable
            
            // 设置大头针颜色
            if pinColor == "green" {
                pinView.pinColor = .green
            } else if pinColor == "purple" {
                pinView.pinColor = .purple
            } else {
                pinView.pinColor = .red
            }
            
            return pinView
        }
        return nil
    }
    
    /**
     * 创建覆盖物渲染器
     * 优先使用子视图的渲染器,否则使用 OverlayManager 的渲染器
     */
    public func mapView(_ mapView: MAMapView, rendererFor overlay: MAOverlay) -> MAOverlayRenderer {
        for subview in subviews {
            if let circleView = subview as? CircleView, let circle = circleView.circle, circle === overlay {
                return circleView.getRenderer()
            } else if let polylineView = subview as? PolylineView, polylineView.polyline === overlay {
                return polylineView.getRenderer()
            } else if let polygonView = subview as? PolygonView, polygonView.polygon === overlay {
                return polygonView.getRenderer()
            }
        }
        
        return overlayManager.getRenderer(for: overlay) ?? MAOverlayRenderer(overlay: overlay)
    }
    
    /**
     * 标注点击事件
     */
    public func mapView(_ mapView: MAMapView, didSelect view: MAAnnotationView) {
        guard let annotation = view.annotation, !annotation.isKind(of: MAUserLocation.self) else {
            return
        }
        
        // 标记正在处理 annotation 选择，阻止地图点击事件
        isHandlingAnnotationSelect = true
        
        // 查找对应的 markerId
        if let markerId = overlayManager.getMarkerId(for: annotation) {
            onMarkerPress([
                "markerId": markerId,
                "latitude": annotation.coordinate.latitude,
                "longitude": annotation.coordinate.longitude
            ])
        }
        
        // 不要立即取消选中，让气泡有机会显示
        // 用户点击地图其他地方时会自动取消选中
    }
    
    /**
     * 标注拖拽状态变化
     */
    public func mapView(_ mapView: MAMapView, annotationView view: MAAnnotationView, didChange newState: MAAnnotationViewDragState, fromOldState oldState: MAAnnotationViewDragState) {
        guard let annotation = view.annotation else { return }
        
        if let markerId = overlayManager.getMarkerId(for: annotation) {
            let coord = annotation.coordinate
            let event: [String: Any] = [
                "markerId": markerId,
                "latitude": coord.latitude,
                "longitude": coord.longitude
            ]
            
            switch newState {
            case .starting:
                onMarkerDragStart(event)
            case .dragging:
                onMarkerDrag(event)
            case .ending, .canceling:
                onMarkerDragEnd(event)
            default:
                break
            }
        }
    }
    
    /**
     * 加载标记图标
     * @param iconUri 图标 URI (支持 http/https/file/本地资源)
     * @param completion 加载完成回调
     */
    private func loadMarkerIcon(iconUri: String, completion: @escaping (UIImage?) -> Void) {
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
}
