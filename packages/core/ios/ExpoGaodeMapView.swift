import ExpoModulesCore
import MAMapKit
import MapKit
import CoreLocation

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
    /// 自定义地图样式配置
    var customMapStyleData: [String: Any]?
    /// 是否启用国内外地图自动切换
    var enableWorldMapSwitch: Bool = false
    
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
    /// 苹果地图视图实例
    var appleMapView: MKMapView!
    /// 苹果地图代理
    private var appleMapDelegate: AppleMapDelegate!
    /// 是否正在切换地图
    private var isSwitching = false
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
    
    // MARK: - 事件节流控制
    
    /// 相机移动事件节流间隔(秒)
    private let cameraMoveThrottleInterval: TimeInterval = 0.1
    /// 上次触发相机移动事件的时间戳
    private var lastCameraMoveTime: TimeInterval = 0
    /// 缓存的相机移动事件数据
    private var pendingCameraMoveData: [String: Any]?
    /// 节流定时器
    private var throttleTimer: Timer?
    
    // MARK: - 初始化
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        
        // 确保隐私合规已设置
        MAMapView.updatePrivacyAgree(.didAgree)
        MAMapView.updatePrivacyShow(.didShow, privacyInfo: .didContain)
        
        // 创建 MAMapView
        // 尝试从预加载池获取 MapView
        if let preloaded = MapPreloadManager.shared.getPreloadedMapView() {
            mapView = preloaded
            mapView.frame = bounds
        } else {
            mapView = MAMapView(frame: bounds)
        }
        
        mapView.delegate = self
        mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        // 创建 MKMapView
        appleMapView = MKMapView(frame: bounds)
        appleMapDelegate = AppleMapDelegate(parent: self)
        appleMapView.delegate = appleMapDelegate
        appleMapView.isHidden = true
        appleMapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        
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
        // 4.   - appleMapView (隐藏)
        // 5.   - mapView (可见，在最上层)
        addSubview(markerContainer)
        addSubview(overlayContainer)
        addSubview(appleMapView)
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
        appleMapView.frame = bounds
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
        if subview === markerContainer || subview === overlayContainer || subview === mapView || subview === appleMapView {
          
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
        
        // 更新苹果地图样式
        updateAppleMapStyle()
        
        // applyProps 时不再需要手动收集视图，因为 addSubview 已经处理了
    }

    /**
     * 更新苹果地图样式以匹配高德地图设置
     */
    private func updateAppleMapStyle() {
        switch mapType {
        case 1: // 卫星
            appleMapView.mapType = .satellite
            appleMapView.overrideUserInterfaceStyle = .unspecified
        case 2: // 夜间
            // 苹果地图没有专门的夜间模式枚举，通过强制 Dark Mode 实现
            appleMapView.mapType = .standard
            appleMapView.overrideUserInterfaceStyle = .dark
        case 3: // 导航
            appleMapView.mapType = .standard
            appleMapView.overrideUserInterfaceStyle = .unspecified
        default: // 标准 (0)
            appleMapView.mapType = .standard
            // 标准模式下跟随系统，如果系统是深色则显示深色，否则浅色
            appleMapView.overrideUserInterfaceStyle = .unspecified
        }
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
    
    /**
     * 设置自定义地图样式
     * @param styleData 样式配置
     */
    func setCustomMapStyle(_ styleData: [String: Any]) {
        customMapStyleData = styleData
        // 如果地图已加载，立即应用样式
        if isMapLoaded {
            uiManager.setCustomMapStyle(styleData)
        }
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
    

    
    // MARK: - 地图切换逻辑

    func handleMapviewRegionChange(mapView: UIView) {
        if !enableWorldMapSwitch {
            return
        }

        if mapView.isHidden {
            return
        }

        if isSwitching {
            isSwitching = false
            return
        }

        if mapView.isKind(of: MAMapView.self) {
            if !AMapDataAvailableForCoordinate(self.mapView.centerCoordinate) {
                showSwitchAlert(message: "是否切换到苹果地图显示", toApple: true)
            }
        } else if mapView.isKind(of: MKMapView.self) {
            if AMapDataAvailableForCoordinate(self.appleMapView.centerCoordinate) {
                showSwitchAlert(message: "是否切换到高德地图显示", toApple: false)
            }
        }
    }

    func showSwitchAlert(message: String, toApple: Bool) {
        // Find top controller
        guard let controller = self.findViewController() else { return }
        
        // Check if alert is already presented to avoid stacking
        if controller.presentedViewController is UIAlertController {
            return
        }

        let alert = UIAlertController(title: "", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "取消", style: .cancel, handler: nil))
        alert.addAction(UIAlertAction(title: "确定", style: .default, handler: { _ in
            self.performSwitching()
        }))
        controller.present(alert, animated: true, completion: nil)
    }

    func performSwitching() {
        print("[ExpoGaodeMap] performSwitching start. Current Gaode hidden: \(self.mapView.isHidden), Apple hidden: \(self.appleMapView.isHidden)")
        
        self.isSwitching = true

        let isGaodeCurrentlyVisible = !self.mapView.isHidden
        
        self.mapView.isHidden = isGaodeCurrentlyVisible
        self.appleMapView.isHidden = !isGaodeCurrentlyVisible

        if !isGaodeCurrentlyVisible {
            // 切换到高德 (Apple -> Gaode)
            print("[ExpoGaodeMap] Switching to Gaode Map")
            let region = self.MARegionForMKRegion(mkRegion: self.appleMapView.region)
            // 简单的合法性检查
            if region.span.latitudeDelta > 0 && region.span.longitudeDelta > 0 {
                self.mapView.region = region
            }
            self.mapView.centerCoordinate = self.appleMapView.centerCoordinate
            self.mapView.rotationDegree = CGFloat(self.appleMapView.camera.heading)
        } else {
            // 切换到苹果 (Gaode -> Apple)
            print("[ExpoGaodeMap] Switching to Apple Map")
            let gaodeRegion = self.mapView.region
            let gaodeCenter = self.mapView.centerCoordinate
            let gaodeHeading = self.mapView.rotationDegree
            
            print("[ExpoGaodeMap] Gaode Region: center(\(gaodeCenter.latitude), \(gaodeCenter.longitude)), span(\(gaodeRegion.span.latitudeDelta), \(gaodeRegion.span.longitudeDelta))")

            // 1. 设置 Region
            let mkRegion = self.MKRegionForMARegion(maRegion: gaodeRegion)
            // 确保 span 有效
            if mkRegion.span.latitudeDelta > 0 && mkRegion.span.longitudeDelta > 0 {
                self.appleMapView.setRegion(mkRegion, animated: false)
            } else {
                // 如果 span 无效，至少设置中心点
                self.appleMapView.setCenter(gaodeCenter, animated: false)
            }
            
            // 2. 尝试同步 Heading (可选，如果导致问题可先注释)
            // 注意：直接修改 camera.heading 可能无效或导致问题，建议使用 setCamera
            let currentCamera = self.appleMapView.camera
            // 调试：打印 altitude
            print("[ExpoGaodeMap] AppleMap Camera altitude: \(currentCamera.altitude)")
            
            // 如果 altitude 为 0，通常意味着地图还没完全初始化好。
            // 此时可以尝试给一个默认的高度，或者仅仅 setRegion 就够了。
            // 经验值：如果不设置 altitude，有时视角会极低导致看起来像黑屏。
            let altitudeToUse = currentCamera.altitude > 0 ? currentCamera.altitude : 10000.0 // 给个默认高度 10000米
            
            let newCamera = MKMapCamera(lookingAtCenter: gaodeCenter, fromDistance: altitudeToUse, pitch: currentCamera.pitch, heading: CLLocationDirection(gaodeHeading))
             self.appleMapView.setCamera(newCamera, animated: false)
        }
        
        // 强制布局更新，确保 Frame 正确
        self.setNeedsLayout()
        self.layoutIfNeeded()
    }

    func MARegionForMKRegion(mkRegion: MKCoordinateRegion) -> MACoordinateRegion {
        return MACoordinateRegion(center: mkRegion.center, span: MACoordinateSpan(latitudeDelta: mkRegion.span.latitudeDelta, longitudeDelta: mkRegion.span.longitudeDelta))
    }

    func MKRegionForMARegion(maRegion: MACoordinateRegion) -> MKCoordinateRegion {
        return MKCoordinateRegion(center: maRegion.center, span: MKCoordinateSpan(latitudeDelta: maRegion.span.latitudeDelta, longitudeDelta: maRegion.span.longitudeDelta))
    }
    
    // MARK: - 截图
    
    func takeSnapshot(completion: @escaping (String?, Error?) -> Void) {
        if !appleMapView.isHidden {
            // 苹果地图
            UIGraphicsBeginImageContextWithOptions(bounds.size, true, UIScreen.main.scale)
            
            if let superview = self.superview {
                // 如果有父视图（通常是 React Native 的容器），直接绘制父视图
                superview.drawHierarchy(in: bounds, afterScreenUpdates: true)
            } else {
                // 降级方案：只绘制自己
                drawHierarchy(in: bounds, afterScreenUpdates: true)
            }
            
            let image = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()
            
            saveSnapshot(image: image, completion: completion)
            return
        }
        
        // 高德地图：使用新的异步 API (takeSnapshotInRect:withCompletionBlock:)
        mapView.takeSnapshot(in: bounds) { [weak self] (image, state) in
            guard let self = self else { return }
            
            // 检查截图是否成功
            guard let mapImage = image else {
                completion(nil, NSError(domain: "ExpoGaodeMap", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to take map snapshot"]))
                return
            }
            
            // 开始绘制合成图
            // 🔑 将 opaque 设为 false，避免透明背景的 UI 组件在绘制时变黑
            UIGraphicsBeginImageContextWithOptions(self.bounds.size, false, UIScreen.main.scale)
            
            // 1. 绘制底图
            mapImage.draw(in: self.bounds)
            
            // 2. 绘制上层 UI 子视图 (React Native 的 UI 组件)
            if let superview = self.superview {
                for subview in superview.subviews {
                    // 跳过自己（ExpoGaodeMapView），因为已经画了底图
                    if subview != self && !subview.isHidden {
                        // 绘制兄弟节点
                        subview.drawHierarchy(in: subview.frame, afterScreenUpdates: true)
                    }
                }
            } else {
                // 如果没有 superview（不太可能），回退到只绘制自己的子视图
                for subview in self.subviews {
                    if subview != self.mapView && subview != self.appleMapView && !subview.isHidden {
                        subview.drawHierarchy(in: subview.frame, afterScreenUpdates: true)
                    }
                }
            }
            
            let finalImage = UIGraphicsGetImageFromCurrentImageContext()
            UIGraphicsEndImageContext()
            
            self.saveSnapshot(image: finalImage, completion: completion)
        }
    }
    
    private func saveSnapshot(image: UIImage?, completion: @escaping (String?, Error?) -> Void) {
        guard let finalImage = image,
              let data = finalImage.pngData() else {
            completion(nil, NSError(domain: "ExpoGaodeMap", code: -2, userInfo: [NSLocalizedDescriptionKey: "Failed to generate PNG data"]))
            return
        }
        
        let filename = UUID().uuidString + ".png"
        let tempDirectory = FileManager.default.temporaryDirectory
        let fileURL = tempDirectory.appendingPathComponent(filename)
        
        do {
            try data.write(to: fileURL)
            completion(fileURL.absoluteString, nil)
        } catch {
            print("Error saving snapshot: \(error)")
            completion(nil, error)
        }
    }

    /**
     * 析构函数 - 清理资源
     * 当视图从层级中移除并释放时自动调用
     */
    deinit {
        // 清理节流定时器
        throttleTimer?.invalidate()
        throttleTimer = nil
        pendingCameraMoveData = nil
        
        // 清理代理,停止接收回调
        mapView?.delegate = nil
        appleMapView?.delegate = nil
        appleMapDelegate = nil
        
        // 清除所有覆盖物和标注
        mapView?.removeAnnotations(mapView?.annotations ?? [])
        mapView?.removeOverlays(mapView?.overlays ?? [])
        appleMapView?.removeAnnotations(appleMapView?.annotations ?? [])
        appleMapView?.removeOverlays(appleMapView?.overlays ?? [])
        
        // 清空覆盖物数组
        overlayViews.removeAll()
        
        // 移除所有子视图
        markerContainer?.removeFromSuperview()
        overlayContainer?.removeFromSuperview()
        mapView?.removeFromSuperview()
        appleMapView?.removeFromSuperview()
        
        // 释放引用
        mapView = nil
        appleMapView = nil
        cameraManager = nil
        uiManager = nil
    }
}

// MARK: - AppleMapDelegate

class AppleMapDelegate: NSObject, MKMapViewDelegate {
    weak var parent: ExpoGaodeMapView?
    
    init(parent: ExpoGaodeMapView) {
        self.parent = parent
        super.init()
    }
    
    func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
        parent?.handleMapviewRegionChange(mapView: mapView)
    }
}

extension UIView {
    func findViewController() -> UIViewController? {
        if let nextResponder = self.next as? UIViewController {
            return nextResponder
        } else if let nextResponder = self.next as? UIView {
            return nextResponder.findViewController()
        } else {
            return nil
        }
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
        
        // 地图加载完成后，应用自定义样式
        if let styleData = customMapStyleData {
            uiManager.setCustomMapStyle(styleData)
        }
        
        onLoad(["loaded": true])
    }
    
    /**
     * 地图区域即将改变时触发 - 应用节流优化
     */
    public func mapView(_ mapView: MAMapView, regionWillChangeAnimated animated: Bool) {
        // 相机开始移动 - 应用节流优化
        let currentTime = Date().timeIntervalSince1970
        let cameraPosition = cameraManager.getCameraPosition()
        let visibleRegion = mapView.region
        
        let eventData: [String: Any] = [
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
        ]
        
        // 节流逻辑：0.1秒 内只触发一次
        if currentTime - lastCameraMoveTime >= cameraMoveThrottleInterval {
            // 超过节流时间，立即触发事件
            lastCameraMoveTime = currentTime
            onCameraMove(eventData)
            // 清除待处理的事件和定时器
            throttleTimer?.invalidate()
            throttleTimer = nil
            pendingCameraMoveData = nil
        } else {
            // 在节流时间内，缓存事件数据，使用定时器延迟触发
            pendingCameraMoveData = eventData
            throttleTimer?.invalidate()
            
            let delay = cameraMoveThrottleInterval - (currentTime - lastCameraMoveTime)
            throttleTimer = Timer.scheduledTimer(withTimeInterval: delay, repeats: false) { [weak self] _ in
                guard let self = self, let data = self.pendingCameraMoveData else { return }
                self.lastCameraMoveTime = Date().timeIntervalSince1970
                self.onCameraMove(data)
                self.pendingCameraMoveData = nil
                self.throttleTimer = nil
            }
        }
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

        // 这里的 overlayViews 是 [UIView] 类型，可能包含 ClusterView
        for view in overlayViews {
            if let clusterView = view as? ClusterView {
                // 只有当 clusterView 依然在视图树中时才通知
                if clusterView.superview != nil && clusterView.window != nil {
                    clusterView.mapRegionDidChange()
                }
            }
        }
        
        handleMapviewRegionChange(mapView: mapView)
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
        _ = b.distance(from: p)
        
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
        
        // 🔑 支持 MAAnimatedAnnotation（平滑移动）
        if annotation.isKind(of: MAAnimatedAnnotation.self) {
            // 从 overlayViews 数组查找对应的 MarkerView
            for view in overlayViews {
                if let markerView = view as? MarkerView,
                   let animatedAnnotation = markerView.animatedAnnotation,
                   animatedAnnotation === annotation {
                    return markerView.getAnimatedAnnotationView(for: mapView, annotation: annotation)
                }
            }
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
        
        // 🔑 支持 ClusterAnnotation
        if annotation.isKind(of: ClusterAnnotation.self) {
            for view in overlayViews {
                if let clusterView = view as? ClusterView,
                   let annotationView = clusterView.viewForAnnotation(annotation) {
                    return annotationView
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
            } else if let heatMapView = view as? HeatMapView, let heatmap = heatMapView.heatmapOverlay, heatmap === overlay {
                return heatMapView.getRenderer()
            } else if let multiPointView = view as? MultiPointView, let renderer = multiPointView.getRenderer(), renderer.overlay === overlay {
                renderer.delegate = self
                return renderer
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
            } else if let clusterView = view as? ClusterView {
                if clusterView.containsAnnotation(annotation) {
                    clusterView.handleAnnotationTap(annotation)
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

// MARK: - MAMultiPointOverlayRendererDelegate

extension ExpoGaodeMapView: MAMultiPointOverlayRendererDelegate {
    public func multiPointOverlayRenderer(_ renderer: MAMultiPointOverlayRenderer!, didItemTapped item: MAMultiPointItem!) {
        // 查找对应的 MultiPointView
        for view in overlayViews {
            if let multiPointView = view as? MultiPointView,
               let r = multiPointView.getRenderer(),
               r === renderer {
                multiPointView.handleMultiPointClick(item: item)
                return
            }
        }
    }
}
