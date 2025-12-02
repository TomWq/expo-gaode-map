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
    
    // MARK: - 事件派发器
    
    let onMapPress = EventDispatcher()
    let onMapLongPress = EventDispatcher()
    let onLoad = EventDispatcher()
    let onLocation = EventDispatcher()
    let onCameraMove = EventDispatcher()
    let onCameraIdle = EventDispatcher()
    
    // MARK: - 私有属性
    
    /// 高德地图视图实例
    var mapView: MAMapView!
    /// 相机管理器
    private var cameraManager: CameraManager!
    /// UI 管理器
    private var uiManager: UIManager!
    /// 地图是否已加载完成
    private var isMapLoaded = false
    /// 是否正在处理 annotation 选择事件
    private var isHandlingAnnotationSelect = false
    /// MarkerView 的隐藏容器（用于渲染 children）
    private var markerContainer: UIView!
    /// 其他覆盖物（Circle, Polyline...）的隐藏容器
    private var overlayContainer: UIView!
    /// 显式跟踪所有覆盖物视图（新架构下 subviews 可能不可靠）
    private var overlayViews: [UIView] = []
    
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
        
        // 创建其他覆盖物的隐藏容器
        overlayContainer = UIView(frame: CGRect(x: 0, y: 0, width: 1, height: 1))
        overlayContainer.isHidden = true
        overlayContainer.isUserInteractionEnabled = false
        overlayContainer.alpha = 0
        
        // 视图层级:
        // 1. self (ExpoGaodeMapView)
        // 2.   - markerContainer (隐藏)
        // 3.   - overlayContainer (隐藏)
        // 4.   - mapView (可见，在最上层)
        addSubview(markerContainer)
        addSubview(overlayContainer)
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
        
        setupDefaultConfig()
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        mapView.frame = bounds
        // 🔑 移除自动调用 setupAllOverlayViews()，避免频繁触发
        // layoutSubviews 会在任何视图变化时调用，导致不必要的批量刷新
    }
    
    /**
     * 视图被添加到窗口时调用
     * 这是确保覆盖物在新架构下正确连接的关键时机
     */
    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil {
          
            // 🔑 只在首次添加到窗口时批量设置，后续添加通过 didAddSubview 单独处理
            setupAllOverlayViews()
        }
    }
    
    /**
     * 遍历所有容器，确保每个覆盖物视图都已连接到地图实例
     * 这个函数是幂等的，重复调用是安全的
     */
    private func setupAllOverlayViews() {
        // 统一从 overlayViews 数组设置所有覆盖物（包括 MarkerView）
        for view in overlayViews {
            if let markerView = view as? MarkerView {
                markerView.setMap(mapView)
            } else if let circleView = view as? CircleView {
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
    }
    
    /**
     * 重写 addSubview
     * 根据视图类型，将其分配到正确的隐藏容器中
     */
    override func addSubview(_ view: UIView) {
        // 🔑 关键修复：旧架构下统一不移动任何覆盖物视图，避免破坏 React Native 布局
        // 所有覆盖物都隐藏并添加到 overlayViews 数组追踪
        if let markerView = view as? MarkerView {
            overlayContainer.addSubview(markerView)
            // 🔑 关键：MarkerView 不能隐藏，否则 children 无法渲染成图片
            // 通过 hitTest 返回 nil 已经确保不阻挡地图交互
            overlayViews.append(markerView)
            markerView.setMap(mapView)
          
            return
        }
        
        if let circleView = view as? CircleView {
            overlayContainer.addSubview(circleView)
            circleView.alpha = 0
            circleView.isHidden = true
            overlayViews.append(circleView)
            circleView.setMap(mapView)
         
            return
        } else if let polylineView = view as? PolylineView {
            overlayContainer.addSubview(polylineView)
            polylineView.alpha = 0
            polylineView.isHidden = true
            overlayViews.append(polylineView)
            polylineView.setMap(mapView)
           
            return
        } else if let polygonView = view as? PolygonView {
            overlayContainer.addSubview(polygonView)
            polygonView.alpha = 0
            polygonView.isHidden = true
            overlayViews.append(polygonView)
            polygonView.setMap(mapView)
          
            return
        } else if let heatMapView = view as? HeatMapView {
            overlayContainer.addSubview(heatMapView)
            heatMapView.alpha = 0
            heatMapView.isHidden = true
            overlayViews.append(heatMapView)
            heatMapView.setMap(mapView)
           
            return
        } else if let multiPointView = view as? MultiPointView {
            overlayContainer.addSubview(multiPointView)
            multiPointView.alpha = 0
            multiPointView.isHidden = true
            overlayViews.append(multiPointView)
            multiPointView.setMap(mapView)
           
            return
        } else if let clusterView = view as? ClusterView {
            overlayContainer.addSubview(clusterView)
            clusterView.alpha = 0
            clusterView.isHidden = true
            overlayViews.append(clusterView)
            clusterView.setMap(mapView)
            
            return
        }
        
        // 其他非地图组件的视图正常添加
        super.addSubview(view)
    }
    
    /**
     * 🔑 关键方法：在新架构下捕获子视图添加
     * 当 Fabric 将子视图添加到此视图时，会触发 didAddSubview
     */
    override func didAddSubview(_ subview: UIView) {
        super.didAddSubview(subview)
        
      
        
        // 跳过我们自己创建的容器和地图视图
        if subview === markerContainer || subview === overlayContainer || subview === mapView {
          
            return
        }
        
        // 🔑 处理 MarkerView - 新架构下直接连接，旧架构下已在 addSubview 处理
        if let markerView = subview as? MarkerView {
            // 检查是否已经在容器中（旧架构下 addSubview 已经处理过）
            if markerView.superview === overlayContainer {
             
                return
            }
          
            // 🔑 新架构下也不能隐藏 MarkerView，否则 children 无法渲染
            overlayViews.append(markerView)
            markerView.setMap(mapView)
            // 🔑 关键修复：不再调用 setupAllOverlayViews()，避免所有覆盖物重新设置
            return
        }
        
        // 🔑 其他覆盖物不移动视图，只设置连接和隐藏
        if let circleView = subview as? CircleView {
            if circleView.superview === overlayContainer {
               
                return
            }
           
            circleView.alpha = 0
            circleView.isHidden = true
            overlayViews.append(circleView)
            circleView.setMap(mapView)
            // 🔑 关键修复：不再调用 setupAllOverlayViews()
            return
        } else if let polylineView = subview as? PolylineView {
            if polylineView.superview === overlayContainer {
               
                return
            }
            
            polylineView.alpha = 0
            polylineView.isHidden = true
            overlayViews.append(polylineView)
            polylineView.setMap(mapView)
            // 🔑 关键修复：不再调用 setupAllOverlayViews()
            return
        } else if let polygonView = subview as? PolygonView {
            if polygonView.superview === overlayContainer {
               
                return
            }
          
            polygonView.alpha = 0
            polygonView.isHidden = true
            overlayViews.append(polygonView)
            polygonView.setMap(mapView)
            // 🔑 关键修复：不再调用 setupAllOverlayViews()
            return
        } else if let heatMapView = subview as? HeatMapView {
            if heatMapView.superview === overlayContainer {
               
                return
            }
          
            heatMapView.alpha = 0
            heatMapView.isHidden = true
            overlayViews.append(heatMapView)
            heatMapView.setMap(mapView)
            // 🔑 关键修复：不再调用 setupAllOverlayViews()
            return
        } else if let multiPointView = subview as? MultiPointView {
            if multiPointView.superview === overlayContainer {
               
                return
            }
          
            multiPointView.alpha = 0
            multiPointView.isHidden = true
            overlayViews.append(multiPointView)
            multiPointView.setMap(mapView)
            // 🔑 关键修复：不再调用 setupAllOverlayViews()
            return
        } else if let clusterView = subview as? ClusterView {
            if clusterView.superview === overlayContainer {
               
                return
            }
          
            clusterView.alpha = 0
            clusterView.isHidden = true
            overlayViews.append(clusterView)
            clusterView.setMap(mapView)
            // 🔑 关键修复：不再调用 setupAllOverlayViews()
            return
        }
        
       
    }
    
    /**
     * 🔑 关键方法：在视图即将被移除时清理覆盖物
     * 新架构下需要手动清理 overlayViews 数组和地图覆盖物
     */
    override func willRemoveSubview(_ subview: UIView) {
        super.willRemoveSubview(subview)
        
        // 🔑 处理 MarkerView - 新架构下也需要从数组中移除
        if let markerView = subview as? MarkerView {
            overlayViews.removeAll { $0 === markerView }
            if let annotation = markerView.annotation {
                mapView.removeAnnotation(annotation)
            }
        } else if let circleView = subview as? CircleView {
            overlayViews.removeAll { $0 === circleView }
            if let circle = circleView.circle {
                mapView.remove(circle)
            }
        } else if let polylineView = subview as? PolylineView {
            overlayViews.removeAll { $0 === polylineView }
            if let polyline = polylineView.polyline {
                mapView.remove(polyline)
            }
        } else if let polygonView = subview as? PolygonView {
            overlayViews.removeAll { $0 === polygonView }
            if let polygon = polygonView.polygon {
                mapView.remove(polygon)
            }
        } else if let heatMapView = subview as? HeatMapView {
            overlayViews.removeAll { $0 === heatMapView }
        } else if let multiPointView = subview as? MultiPointView {
            overlayViews.removeAll { $0 === multiPointView }
        } else if let clusterView = subview as? ClusterView {
            overlayViews.removeAll { $0 === clusterView }
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
        
        // applyProps 时不再需要手动收集视图，因为 addSubview 已经处理了
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
     * 地图区域即将改变时触发
     */
    public func mapView(_ mapView: MAMapView, regionWillChangeAnimated animated: Bool) {
        // 相机开始移动
        let cameraPosition = cameraManager.getCameraPosition()
        let visibleRegion = mapView.region
        
        onCameraMove([
            "cameraPosition": cameraPosition,
            "latLngBounds": [
                "northeast": [
                    "latitude": visibleRegion.center.latitude + visibleRegion.span.latitudeDelta / 2,
                    "longitude": visibleRegion.center.longitude + visibleRegion.span.longitudeDelta / 2
                ],
                "southwest": [
                    "latitude": visibleRegion.center.latitude - visibleRegion.span.latitudeDelta / 2,
                    "longitude": visibleRegion.center.longitude - visibleRegion.span.longitudeDelta / 2
                ]
            ]
        ])
    }
    
    /**
     * 地图区域改变完成后触发
     */
    public func mapView(_ mapView: MAMapView, regionDidChangeAnimated animated: Bool) {
        // 相机移动完成
        let cameraPosition = cameraManager.getCameraPosition()
        let visibleRegion = mapView.region
        
        onCameraIdle([
            "cameraPosition": cameraPosition,
            "latLngBounds": [
                "northeast": [
                    "latitude": visibleRegion.center.latitude + visibleRegion.span.latitudeDelta / 2,
                    "longitude": visibleRegion.center.longitude + visibleRegion.span.longitudeDelta / 2
                ],
                "southwest": [
                    "latitude": visibleRegion.center.latitude - visibleRegion.span.latitudeDelta / 2,
                    "longitude": visibleRegion.center.longitude - visibleRegion.span.longitudeDelta / 2
                ]
            ]
        ])
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
        
        // 检查声明式覆盖物点击
        if checkCirclePress(at: coordinate) { return }
        if checkPolygonPress(at: coordinate) { return }
        if checkPolylinePress(at: coordinate) { return }
        
        onMapPress(["latitude": coordinate.latitude, "longitude": coordinate.longitude])
    }
    
    /**
     * 检查点击位置是否在圆形内
     */
    private func checkCirclePress(at coordinate: CLLocationCoordinate2D) -> Bool {
        // 从 overlayViews 数组中查找 CircleView
        let circleViews = overlayViews.compactMap { $0 as? CircleView }
        
        for circleView in circleViews {
            guard let circle = circleView.circle else {
                continue
            }
            
            let circleCenter = circle.coordinate
            let distance = calculateDistance(from: coordinate, to: circleCenter)
            
            if distance <= circle.radius {
                // 🔑 关键修复：直接调用 circleView 的 onCirclePress，它会自动派发到 React Native
                circleView.onCirclePress([
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
        // 从 overlayViews 数组中查找 PolygonView
        let polygonViews = overlayViews.compactMap { $0 as? PolygonView }
        
        for polygonView in polygonViews {
            guard let polygon = polygonView.polygon else {
                continue
            }
            
            // 使用射线法判断点是否在多边形内
            if isPoint(coordinate, inPolygon: polygon) {
                polygonView.onPolygonPress([
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
        // 从 overlayViews 数组中查找 PolylineView
        let polylineViews = overlayViews.compactMap { $0 as? PolylineView }
        let threshold: Double = 20.0 // 20米容差
        
        for polylineView in polylineViews {
            guard let polyline = polylineView.polyline else {
                continue
            }
            
            if isPoint(coordinate, nearPolyline: polyline, threshold: threshold) {
                polylineView.onPolylinePress([
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
            // 🔑 统一从 overlayViews 数组查找 MarkerView（新旧架构统一）
            for view in overlayViews {
                if let markerView = view as? MarkerView, markerView.annotation === annotation {
                    return markerView.getAnnotationView(for: mapView, annotation: annotation)
                }
            }
        }
        return nil
    }
    
    /**
     * 创建覆盖物渲染器
     * 从 overlayContainer 中查找对应的视图
     */
    public func mapView(_ mapView: MAMapView, rendererFor overlay: MAOverlay) -> MAOverlayRenderer {
        // 从 overlayViews 数组中查找
        for view in overlayViews {
            if let circleView = view as? CircleView, let circle = circleView.circle {
                if circle === overlay {
                    return circleView.getRenderer()
                }
            } else if let polylineView = view as? PolylineView, let polyline = polylineView.polyline, polyline === overlay {
                return polylineView.getRenderer()
            } else if let polygonView = view as? PolygonView, let polygon = polygonView.polygon, polygon === overlay {
                return polygonView.getRenderer()
            }
        }
        
        return MAOverlayRenderer(overlay: overlay)
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
        
        // 🔑 统一从 overlayViews 查找 MarkerView（新旧架构统一）
        for view in overlayViews {
            if let markerView = view as? MarkerView {
                if markerView.annotation === annotation {
                    let eventData: [String: Any] = [
                        "latitude": annotation.coordinate.latitude,
                        "longitude": annotation.coordinate.longitude
                    ]
                    markerView.onMarkerPress(eventData)
                    return
                }
            }
        }
        
        // 不要立即取消选中，让气泡有机会显示
        // 用户点击地图其他地方时会自动取消选中
    }
    
    /**
     * 标注拖拽状态变化
     */
    public func mapView(_ mapView: MAMapView, annotationView view: MAAnnotationView, didChange newState: MAAnnotationViewDragState, fromOldState oldState: MAAnnotationViewDragState) {
        guard let annotation = view.annotation else {
            return
        }
        
        let coord = annotation.coordinate
        let event: [String: Any] = [
            "latitude": coord.latitude,
            "longitude": coord.longitude
        ]
        
        // 🔑 统一从 overlayViews 查找 MarkerView（新旧架构统一）
        for view in overlayViews {
            if let markerView = view as? MarkerView, markerView.annotation === annotation {
                switch newState {
                case .starting:
                    markerView.onMarkerDragStart(event)
                case .dragging:
                    markerView.onMarkerDrag(event)
                case .ending, .canceling:
                    markerView.onMarkerDragEnd(event)
                default:
                    break
                }
                return
            }
        }

    }
}
