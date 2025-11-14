import ExpoModulesCore
import MAMapKit

class ExpoGaodeMapView: ExpoView, MAMapViewDelegate {
    var mapType: Int = 0
    var initialCameraPosition: [String: Any]?
    var showsZoomControls: Bool = true
    var showsCompass: Bool = true
    var showsScale: Bool = true
    var isZoomEnabled: Bool = true
    var isScrollEnabled: Bool = true
    var isRotateEnabled: Bool = true
    var isTiltEnabled: Bool = true
    var showsUserLocation: Bool = false
    var followUserLocation: Bool = false {
        didSet {
            if showsUserLocation {
                uiManager?.setShowsUserLocation(true, followUser: followUserLocation)
            }
        }
    }
    var userLocationRepresentation: [String: Any]?
    var showsTraffic: Bool = false
    var showsBuildings: Bool = false
    var showsIndoorMap: Bool = false
    var maxZoomLevel: CGFloat = 20
    var minZoomLevel: CGFloat = 3
    
    let onMapPress = EventDispatcher()
    let onLongPress = EventDispatcher()
    let onLoad = EventDispatcher()
    
    private var mapView: MAMapView!
    private var cameraManager: CameraManager!
    private var uiManager: UIManager!
    private var overlayManager: OverlayManager!
    private var isMapLoaded = false
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        
        // 确保隐私合规已设置
        MAMapView.updatePrivacyAgree(.didAgree)
        MAMapView.updatePrivacyShow(.didShow, privacyInfo: .didContain)
        
        mapView = MAMapView(frame: bounds)
        mapView.delegate = self
        mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        addSubview(mapView)
        
        cameraManager = CameraManager(mapView: mapView)
        uiManager = UIManager(mapView: mapView)
        overlayManager = OverlayManager(mapView: mapView)
        
        setupDefaultConfig()
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        mapView.frame = bounds
    }
    
    override func addSubview(_ view: UIView) {
        super.addSubview(view)
        
        // 自动将地图实例传递给覆盖物子视图
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
    
    func applyProps() {
        uiManager.setMapType(mapType)
        
        if let position = initialCameraPosition, isMapLoaded {
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
    }
    
    func setMaxZoom(_ maxZoom: Double) {
        cameraManager.setMaxZoomLevel(CGFloat(maxZoom))
    }
    
    func setMinZoom(_ minZoom: Double) {
        cameraManager.setMinZoomLevel(CGFloat(minZoom))
    }
    
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
        // 如果定位已开启,立即应用新设置
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
    
    private func applyUserLocationStyle() {
        guard let config = userLocationRepresentation else { return }
        uiManager.setUserLocationRepresentation(config)
    }
}

extension ExpoGaodeMapView {
    public func mapViewDidFinishLoadingMap(_ mapView: MAMapView) {
        guard !isMapLoaded else { return }
        isMapLoaded = true
        if let position = initialCameraPosition {
            cameraManager.setInitialCameraPosition(position)
        }
        onLoad(["loaded": true])
    }
    
    public func mapView(_ mapView: MAMapView, didSingleTappedAt coordinate: CLLocationCoordinate2D) {
        onMapPress(["latitude": coordinate.latitude, "longitude": coordinate.longitude])
    }
    
    public func mapView(_ mapView: MAMapView, didLongPressedAt coordinate: CLLocationCoordinate2D) {
        onLongPress(["latitude": coordinate.latitude, "longitude": coordinate.longitude])
    }
    
    public func mapView(_ mapView: MAMapView, viewFor annotation: MAAnnotation) -> MAAnnotationView? {
        // 定位蓝点返回 nil,使用系统默认样式
        if annotation.isKind(of: MAUserLocation.self) {
            return nil
        }
        
        if annotation.isKind(of: MAPointAnnotation.self) {
            let identifier = "marker"
            var view = mapView.dequeueReusableAnnotationView(withIdentifier: identifier)
            if view == nil {
                view = MAPinAnnotationView(annotation: annotation, reuseIdentifier: identifier)
            }
            view?.canShowCallout = true
            return view
        }
        return nil
    }
    
    public func mapView(_ mapView: MAMapView, rendererFor overlay: MAOverlay) -> MAOverlayRenderer {
        // 首先检查是否是通过子视图添加的覆盖物
        for subview in subviews {
            if let circleView = subview as? CircleView, circleView.circle === overlay {
                return circleView.getRenderer()
            } else if let polylineView = subview as? PolylineView, polylineView.polyline === overlay {
                return polylineView.getRenderer()
            } else if let polygonView = subview as? PolygonView, polygonView.polygon === overlay {
                return polygonView.getRenderer()
            }
        }
        
        // 否则使用 OverlayManager 的渲染器
        return overlayManager.getRenderer(for: overlay) ?? MAOverlayRenderer(overlay: overlay)
    }
}

