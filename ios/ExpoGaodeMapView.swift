import ExpoModulesCore
import MAMapKit

/**
 * 地图注册表
 * 用于在新架构下管理地图实例和覆盖物视图，让它们能够相互找到对方
 */
class MapRegistry {
    /// 单例实例
    static let shared = MapRegistry()
    
    /// 地图实例存储 [viewTag: MAMapView]
    private var maps: [Int: MAMapView] = [:]
    
    /// 主地图实例（简化版本，假设只有一个地图）
    private var mainMap: MAMapView?
    
    /// 覆盖物视图数组（新架构关键修复）
    private var overlayViews: [UIView] = []
    
    private init() {}
    
    /**
     * 注册地图实例
     */
    func register(map: MAMapView, tag: Int) {
        print("🗺️ MapRegistry: 注册地图，tag = \(tag)")
        maps[tag] = map
        if mainMap == nil {
            mainMap = map
        }
    }
    
    /**
     * 获取地图实例
     */
    func getMap(tag: Int) -> MAMapView? {
        return maps[tag]
    }
    
    /**
     * 获取主地图实例
     */
    func getMainMap() -> MAMapView? {
        print("🗺️ MapRegistry: 获取主地图，mainMap = \(String(describing: mainMap))")
        return mainMap
    }
    
    /**
     * 注册覆盖物视图
     */
    func registerOverlay(_ view: UIView) {
        print("🗺️ MapRegistry: 注册覆盖物视图，类型 = \(type(of: view))")
        overlayViews.append(view)
    }
    
    /**
     * 注销覆盖物视图
     */
    func unregisterOverlay(_ view: UIView) {
        print("🗺️ MapRegistry: 注销覆盖物视图，类型 = \(type(of: view))")
        if let index = overlayViews.firstIndex(where: { $0 === view }) {
            overlayViews.remove(at: index)
            print("🗺️ MapRegistry: 已注销，剩余覆盖物数量 = \(overlayViews.count)")
        } else {
            print("⚠️ MapRegistry: 未找到要注销的覆盖物")
        }
    }
    
    /**
     * 获取所有覆盖物视图
     */
    func getAllOverlays() -> [UIView] {
        return overlayViews
    }
    
    /**
     * 注销地图实例
     */
    func unregister(tag: Int) {
        print("🗺️ MapRegistry: 注销地图，tag = \(tag)")
        if maps[tag] === mainMap {
            mainMap = nil
        }
        maps.removeValue(forKey: tag)
    }
}

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
    
    // MARK: - 私有属性
    
    /// 高德地图视图实例
    var mapView: MAMapView!
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
        
        // 🔑 新架构修复：注册地图到全局注册表
        MapRegistry.shared.register(map: mapView, tag: self.tag)
        print("🗺️ ExpoGaodeMapView.init: 地图已注册到全局注册表，tag = \(self.tag)")
        
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
        
        setupDefaultConfig()
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        mapView.frame = bounds
        
        // 🔑 关键修复：收集并设置所有覆盖物视图（不仅仅是 MarkerView）
        collectAndSetupOverlayViews()
    }
    
    /**
     * 视图被添加到窗口时调用
     * 新架构下这是一个重要的时机点来收集子视图
     */
    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil {
            print("🗺️ didMoveToWindow: 视图已添加到窗口，收集覆盖物")
            collectAndSetupOverlayViews()
        }
    }
    
    /**
     * 收集所有覆盖物子视图并设置地图
     * 这对新架构非常重要，确保所有覆盖物都能正确连接到地图
     */
    private func collectAndSetupOverlayViews() {
        print("🗺️ collectAndSetupOverlayViews: 开始收集覆盖物，容器子视图数量 = \(markerContainer.subviews.count)")
        
        // 从隐藏容器中收集所有覆盖物视图
        for (index, subview) in markerContainer.subviews.enumerated() {
            print("🗺️ collectAndSetupOverlayViews: [\(index)] 类型 = \(type(of: subview))")
            
            if let markerView = subview as? MarkerView {
                print("🗺️ collectAndSetupOverlayViews: [\(index)] 设置 MarkerView 地图")
                markerView.setMap(mapView)
            } else if let circleView = subview as? CircleView {
                print("🗺️ collectAndSetupOverlayViews: [\(index)] 设置 CircleView 地图")
                circleView.setMap(mapView)
            } else if let polylineView = subview as? PolylineView {
                print("🗺️ collectAndSetupOverlayViews: [\(index)] 设置 PolylineView 地图")
                polylineView.setMap(mapView)
            } else if let polygonView = subview as? PolygonView {
                print("🗺️ collectAndSetupOverlayViews: [\(index)] 设置 PolygonView 地图")
                polygonView.setMap(mapView)
            } else if let heatMapView = subview as? HeatMapView {
                print("🗺️ collectAndSetupOverlayViews: [\(index)] 设置 HeatMapView 地图")
                heatMapView.setMap(mapView)
            } else if let multiPointView = subview as? MultiPointView {
                print("🗺️ collectAndSetupOverlayViews: [\(index)] 设置 MultiPointView 地图")
                multiPointView.setMap(mapView)
            } else if let clusterView = subview as? ClusterView {
                print("🗺️ collectAndSetupOverlayViews: [\(index)] 设置 ClusterView 地图")
                clusterView.setMap(mapView)
            }
        }
        
        print("🗺️ collectAndSetupOverlayViews: 完成收集")
    }
    
    /**
     * 添加子视图时自动连接到地图
     * 🔑 新架构修复：不移动覆盖物视图，让它们保留在正常的视图树中
     * 这样 React Native 可以正常管理它们的 children
     */
    override func didAddSubview(_ subview: UIView) {
        super.didAddSubview(subview)
        
        print("🗺️ ExpoGaodeMapView.didAddSubview: 类型 = \(type(of: subview))")
        
        // 检查是否是覆盖物视图
        let isOverlayView = subview is MarkerView || subview is CircleView || subview is PolylineView ||
                           subview is PolygonView || subview is HeatMapView || subview is MultiPointView ||
                           subview is ClusterView
        
        if isOverlayView {
            print("🗺️ ExpoGaodeMapView.didAddSubview: 检测到覆盖物视图, tag=\(subview.tag)")
            
            // 🔑 新架构修复：将覆盖物视图移动到隐藏容器，避免阻挡地图触摸
            // 延迟移动，让 React Native 先设置好属性
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                
                // 先从原父视图移除（不触发 willRemoveSubview，因为用 removeFromSuperview）
                subview.removeFromSuperview()
                
                // 添加到隐藏容器
                self.markerContainer.addSubview(subview)
                print("🗺️ ExpoGaodeMapView.didAddSubview: 已移动到 markerContainer")
                
                // 连接到地图
                if let markerView = subview as? MarkerView {
                    print("🗺️ ExpoGaodeMapView.didAddSubview: 连接 MarkerView 到地图")
                    markerView.setMap(self.mapView)
                } else if let circleView = subview as? CircleView {
                    print("🗺️ ExpoGaodeMapView.didAddSubview: 连接 CircleView 到地图")
                    circleView.setMap(self.mapView)
                } else if let polylineView = subview as? PolylineView {
                    print("🗺️ ExpoGaodeMapView.didAddSubview: 连接 PolylineView 到地图")
                    polylineView.setMap(self.mapView)
                } else if let polygonView = subview as? PolygonView {
                    print("🗺️ ExpoGaodeMapView.didAddSubview: 连接 PolygonView 到地图")
                    polygonView.setMap(self.mapView)
                } else if let heatMapView = subview as? HeatMapView {
                    print("🗺️ ExpoGaodeMapView.didAddSubview: 连接 HeatMapView 到地图")
                    heatMapView.setMap(self.mapView)
                } else if let multiPointView = subview as? MultiPointView {
                    print("🗺️ ExpoGaodeMapView.didAddSubview: 连接 MultiPointView 到地图")
                    multiPointView.setMap(self.mapView)
                } else if let clusterView = subview as? ClusterView {
                    print("🗺️ ExpoGaodeMapView.didAddSubview: 连接 ClusterView 到地图")
                    clusterView.setMap(self.mapView)
                }
            }
        }
    }
    
    /**
     * 子视图即将被移除时调用
     * 🔑 关键：检查是否在 markerContainer 中，如果在则说明是真正的移除
     */
    override func willRemoveSubview(_ subview: UIView) {
        print("🗺️ ExpoGaodeMapView.willRemoveSubview: 类型 = \(type(of: subview)), tag = \(subview.tag)")
        
        // 检查子视图是否在 markerContainer 中
        // 如果在，说明是 React Native 真正要移除它（不是我们移动到 markerContainer）
        if markerContainer.subviews.contains(where: { $0 === subview }) {
            print("🗺️ ExpoGaodeMapView.willRemoveSubview: 子视图在 markerContainer 中，这是真正的移除")
            // 让子视图自己处理清理（通过 willMove(toSuperview: nil)）
        } else {
            print("🗺️ ExpoGaodeMapView.willRemoveSubview: 子视图不在 markerContainer 中，可能是内部移动")
        }
        
        super.willRemoveSubview(subview)
    }
    
    /**
     * 处理子视图添加（新架构专用）
     * 新架构下通过 OnChildViewAdded 回调处理子视图
     * 🔑 已废弃：现在使用 OnViewDidUpdateProps 来连接地图
     */
    func handleChildViewAdded(_ child: UIView) {
        print("🆕 ExpoGaodeMapView.handleChildViewAdded: 类型 = \(type(of: child))（已废弃）")
        // 不再需要，由 OnViewDidUpdateProps 处理
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
        
        // 🔑 关键修复：收集并设置所有覆盖物视图（新架构下非常重要）
        collectAndSetupOverlayViews()
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
        
        // 🔑 新架构修复：从全局注册表注销地图
        MapRegistry.shared.unregister(tag: self.tag)
        print("🗺️ ExpoGaodeMapView.deinit: 地图已从全局注册表注销，tag = \(self.tag)")
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
        // 🔑 从隐藏容器查找 CircleView
        let circleViews = markerContainer.subviews.compactMap { $0 as? CircleView }
        
        print("🔵 checkCirclePress: 找到 \(circleViews.count) 个 CircleView")
        
        for circleView in circleViews {
            guard let circle = circleView.circle else {
                print("🔵 checkCirclePress: CircleView 没有 circle 对象")
                continue
            }
            
            let circleCenter = circle.coordinate
            let distance = calculateDistance(from: coordinate, to: circleCenter)
            
            print("🔵 checkCirclePress: 点击距离圆心 \(distance)m, 半径 \(circle.radius)m")
            
            if distance <= circle.radius {
                print("🔵 checkCirclePress: ✅ 点击在圆形内，触发 onPress 事件")
                print("🔵 checkCirclePress: 事件数据 - latitude: \(coordinate.latitude), longitude: \(coordinate.longitude)")
                
                // 🔑 关键修复：直接调用 circleView 的 onCirclePress，它会自动派发到 React Native
                circleView.onCirclePress([
                    "latitude": coordinate.latitude,
                    "longitude": coordinate.longitude
                ])
                print("🔵 checkCirclePress: circleView.onCirclePress 已调用")
                return true
            }
        }
        print("🔵 checkCirclePress: ❌ 点击不在任何圆形内")
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
        // 🔑 从隐藏容器查找 PolygonView
        let polygonViews = markerContainer.subviews.compactMap { $0 as? PolygonView }
        
        print("🔶 checkPolygonPress: 找到 \(polygonViews.count) 个 PolygonView")
        
        for polygonView in polygonViews {
            guard let polygon = polygonView.polygon else {
                print("🔶 checkPolygonPress: PolygonView 没有 polygon 对象")
                continue
            }
            
            // 使用射线法判断点是否在多边形内
            if isPoint(coordinate, inPolygon: polygon) {
                print("🔶 checkPolygonPress: ✅ 点击在多边形内，触发 onPolygonPress 事件")
                polygonView.onPolygonPress([
                    "latitude": coordinate.latitude,
                    "longitude": coordinate.longitude
                ])
                return true
            }
        }
        print("🔶 checkPolygonPress: ❌ 点击不在任何多边形内")
        return false
    }
    
    /**
     * 检查点击位置是否在折线附近
     */
    private func checkPolylinePress(at coordinate: CLLocationCoordinate2D) -> Bool {
        // 🔑 从隐藏容器查找 PolylineView
        let polylineViews = markerContainer.subviews.compactMap { $0 as? PolylineView }
        let threshold: Double = 20.0 // 20米容差
        
        print("🔷 checkPolylinePress: 找到 \(polylineViews.count) 个 PolylineView")
        
        for polylineView in polylineViews {
            guard let polyline = polylineView.polyline else {
                print("🔷 checkPolylinePress: PolylineView 没有 polyline 对象")
                continue
            }
            
            if isPoint(coordinate, nearPolyline: polyline, threshold: threshold) {
                print("🔷 checkPolylinePress: ✅ 点击在折线附近，触发 onPolylinePress 事件")
                polylineView.onPolylinePress([
                    "latitude": coordinate.latitude,
                    "longitude": coordinate.longitude
                ])
                return true
            }
        }
        print("🔷 checkPolylinePress: ❌ 点击不在任何折线附近")
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
            // 检查是否是声明式 MarkerView 的 annotation
            for subview in markerContainer.subviews {
                if let markerView = subview as? MarkerView, markerView.annotation === annotation {
                    return markerView.getAnnotationView(for: mapView, annotation: annotation)
                }
            }
        }
        return nil
    }
    
    /**
     * 创建覆盖物渲染器
     * 新架构修复：从全局注册表获取覆盖物视图
     */
    public func mapView(_ mapView: MAMapView, rendererFor overlay: MAOverlay) -> MAOverlayRenderer {
        print("🎨 rendererFor 被调用，overlay 类型 = \(type(of: overlay))")
        
        // 🔑 新架构修复：从全局注册表中查找覆盖物视图
        let overlayViews = MapRegistry.shared.getAllOverlays()
        print("🎨 rendererFor: 全局注册表中有 \(overlayViews.count) 个覆盖物视图")
        
        for (index, view) in overlayViews.enumerated() {
            print("🎨 rendererFor: 检查视图[\(index)]，类型 = \(type(of: view))")
            
            if let circleView = view as? CircleView, let circle = circleView.circle, circle === overlay {
                print("🎨 rendererFor: ✅ 找到匹配的 CircleView，返回 renderer")
                return circleView.getRenderer()
            } else if let polylineView = view as? PolylineView, let polyline = polylineView.polyline, polyline === overlay {
                print("🎨 rendererFor: ✅ 找到匹配的 PolylineView，返回 renderer")
                return polylineView.getRenderer()
            } else if let polygonView = view as? PolygonView, let polygon = polygonView.polygon, polygon === overlay {
                print("🎨 rendererFor: ✅ 找到匹配的 PolygonView，返回 renderer")
                return polygonView.getRenderer()
            }
        }
        
        print("🎨 rendererFor: ❌ 未找到匹配的覆盖物视图，返回默认 renderer")
        return MAOverlayRenderer(overlay: overlay)
    }
    
    /**
     * 标注点击事件
     */
    public func mapView(_ mapView: MAMapView, didSelect view: MAAnnotationView) {
        guard let annotation = view.annotation, !annotation.isKind(of: MAUserLocation.self) else {
            print("📍 [didSelect] 跳过：用户位置标记")
            return
        }
        
        print("📍 [didSelect] 标记被点击")
        print("📍 [didSelect] 坐标: \(annotation.coordinate.latitude), \(annotation.coordinate.longitude)")
        
        // 标记正在处理 annotation 选择，阻止地图点击事件
        isHandlingAnnotationSelect = true
        
        // 🔑 优先检查声明式 MarkerView
        print("📍 [didSelect] 检查 markerContainer.subviews 数量: \(markerContainer.subviews.count)")
        for (index, subview) in markerContainer.subviews.enumerated() {
            print("📍 [didSelect] subview[\(index)]: \(type(of: subview))")
            if let markerView = subview as? MarkerView {
                print("📍 [didSelect] 找到 MarkerView，annotation 匹配: \(markerView.annotation === annotation)")
                if markerView.annotation === annotation {
                    print("✅ [didSelect] 触发 onMarkerPress 事件")
                    let eventData: [String: Any] = [
                        "latitude": annotation.coordinate.latitude,
                        "longitude": annotation.coordinate.longitude
                    ]
                    print("✅ [didSelect] 事件数据: \(eventData)")
                    markerView.onMarkerPress(eventData)
                    print("✅ [didSelect] onMarkerPress() 已调用完成")
                    return
                }
            }
        }
        
        print("⚠️ [didSelect] 未找到匹配的声明式 MarkerView")
        
        // 不要立即取消选中，让气泡有机会显示
        // 用户点击地图其他地方时会自动取消选中
    }
    
    /**
     * 标注拖拽状态变化
     */
    public func mapView(_ mapView: MAMapView, annotationView view: MAAnnotationView, didChange newState: MAAnnotationViewDragState, fromOldState oldState: MAAnnotationViewDragState) {
        guard let annotation = view.annotation else {
            print("🔄 [didChange] 没有 annotation")
            return
        }
        
        print("🔄 [didChange] 拖拽状态变化: \(oldState.rawValue) -> \(newState.rawValue)")
        
        let coord = annotation.coordinate
        let event: [String: Any] = [
            "latitude": coord.latitude,
            "longitude": coord.longitude
        ]
        
        // 🔑 优先检查声明式 MarkerView
        print("🔄 [didChange] 检查 markerContainer.subviews 数量: \(markerContainer.subviews.count)")
        for (index, subview) in markerContainer.subviews.enumerated() {
            print("🔄 [didChange] subview[\(index)]: \(type(of: subview))")
            if let markerView = subview as? MarkerView {
                print("🔄 [didChange] 找到 MarkerView，annotation 匹配: \(markerView.annotation === annotation)")
                if markerView.annotation === annotation {
                    print("✅ [didChange] 找到匹配的 MarkerView")
                    switch newState {
                    case .starting:
                        print("✅ [didChange] 触发 onMarkerDragStart")
                        markerView.onMarkerDragStart(event)
                        print("✅ [didChange] onMarkerDragStart() 已调用完成")
                    case .dragging:
                        print("✅ [didChange] 触发 onMarkerDrag")
                        markerView.onMarkerDrag(event)
                        print("✅ [didChange] onMarkerDrag() 已调用完成")
                    case .ending, .canceling:
                        print("✅ [didChange] 触发 onMarkerDragEnd")
                        markerView.onMarkerDragEnd(event)
                        print("✅ [didChange] onMarkerDragEnd() 已调用完成")
                    default:
                        print("⚠️ [didChange] 未处理的状态: \(newState.rawValue)")
                        break
                    }
                    return
                }
            }
        }

    }
}
