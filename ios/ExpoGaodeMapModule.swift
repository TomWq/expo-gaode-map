import ExpoModulesCore
import AMapFoundationKit
import AMapLocationKit
import MAMapKit

/**
 * 高德地图 Expo 模块
 *
 * 负责:
 * - SDK 初始化和配置
 * - 定位功能管理
 * - 权限管理
 * - 地图视图和覆盖物注册
 */
public class ExpoGaodeMapModule: Module {
    /// 定位管理器实例
    private var locationManager: LocationManager?
    /// 权限管理器实例
    private var permissionManager: PermissionManager?
    
    public func definition() -> ModuleDefinition {
        Name("ExpoGaodeMap")
        
        // 模块初始化时设置隐私合规
        OnCreate {
            MAMapView.updatePrivacyAgree(AMapPrivacyAgreeStatus.didAgree)
            MAMapView.updatePrivacyShow(AMapPrivacyShowStatus.didShow, privacyInfo: AMapPrivacyInfoStatus.didContain)
        }
        
        // ==================== SDK 初始化 ====================
        
        /**
         * 初始化高德地图 SDK
         * @param config 配置字典,包含 iosKey
         */
        Function("initSDK") { (config: [String: String]) in
            guard let iosKey = config["iosKey"] else { return }
            AMapServices.shared().apiKey = iosKey
            AMapServices.shared().enableHTTPS = true
            self.getLocationManager()
        }
        
        /**
         * 获取 SDK 版本号
         */
        Function("getVersion") {
            "iOS SDK Version"
        }
        
        // ==================== 定位功能 ====================
        
        /**
         * 开始连续定位
         */
        Function("start") {
            self.getLocationManager().start()
        }
        
        /**
         * 停止定位
         */
        Function("stop") {
            self.getLocationManager().stop()
        }
        
        /**
         * 检查是否正在定位
         */
        AsyncFunction("isStarted") { (promise: Promise) in
            promise.resolve(self.getLocationManager().isStarted())
        }
        
        /**
         * 获取当前位置(单次定位)
         * 返回位置信息和逆地理编码结果
         */
        AsyncFunction("getCurrentLocation") { (promise: Promise) in
            let status = CLLocationManager.authorizationStatus()
            
            if status == .authorizedAlways || status == .authorizedWhenInUse {
                let manager = self.getLocationManager()
                manager.locationManager?.requestLocation(withReGeocode: manager.locationManager?.locatingWithReGeocode ?? true, completionBlock: { location, regeocode, error in
                    if let error = error {
                        promise.reject("LOCATION_ERROR", error.localizedDescription)
                        return
                    }
                    
                    guard let location = location else {
                        promise.reject("LOCATION_ERROR", "位置信息为空")
                        return
                    }
                    
                    var locationData: [String: Any] = [
                        "latitude": location.coordinate.latitude,
                        "longitude": location.coordinate.longitude,
                        "accuracy": location.horizontalAccuracy,
                        "altitude": location.altitude,
                        "bearing": location.course,
                        "speed": location.speed,
                        "timestamp": location.timestamp.timeIntervalSince1970 * 1000
                    ]
                    
                    if let regeocode = regeocode {
                        locationData["address"] = regeocode.formattedAddress
                        locationData["province"] = regeocode.province
                        locationData["city"] = regeocode.city
                        locationData["district"] = regeocode.district
                        locationData["street"] = regeocode.street
                        locationData["streetNumber"] = regeocode.number
                        locationData["country"] = regeocode.country
                        locationData["cityCode"] = regeocode.citycode
                        locationData["adCode"] = regeocode.adcode
                    }
                    
                    promise.resolve(locationData)
                })
            } else {
                promise.reject("LOCATION_ERROR", "location unauthorized")
            }
        }
        
        /**
         * 坐标转换
         * iOS 高德地图 SDK 使用 GCJ-02 坐标系,不需要转换
         */
        AsyncFunction("coordinateConvert") { (coordinate: [String: Double], type: Int, promise: Promise) in
            guard let latitude = coordinate["latitude"],
                  let longitude = coordinate["longitude"] else {
                promise.reject("INVALID_ARGUMENT", "无效的坐标参数")
                return
            }
            
            // 高德地图 iOS SDK 使用 GCJ-02 坐标系，不需要转换
            let result: [String: Double] = [
                "latitude": latitude,
                "longitude": longitude
            ]
            promise.resolve(result)
        }
        
        // ==================== 定位配置 ====================
        
        Function("setLocatingWithReGeocode") { (isReGeocode: Bool) in
            self.getLocationManager().setLocatingWithReGeocode(isReGeocode)
        }
        
        Function("setLocationMode") { (_: Int) in
            // iOS 高德 SDK 没有对应的模式设置
        }
        
        Function("setInterval") { (interval: Int) in
            self.getLocationManager().setDistanceFilter(Double(interval))
        }
        
        Function("setLocationTimeout") { (timeout: Int) in
            self.getLocationManager().setLocationTimeout(timeout)
        }
        
        Function("setReGeocodeTimeout") { (timeout: Int) in
            self.getLocationManager().setReGeocodeTimeout(timeout)
        }
        
        Function("setDesiredAccuracy") { (accuracy: Int) in
            self.getLocationManager().setDesiredAccuracy(accuracy)
        }
        
        Function("setPausesLocationUpdatesAutomatically") { (pauses: Bool) in
            self.getLocationManager().setPausesLocationUpdatesAutomatically(pauses)
        }
        
        Function("setAllowsBackgroundLocationUpdates") { (allows: Bool) in
            self.getLocationManager().setAllowsBackgroundLocationUpdates(allows)
        }
        
        Function("startUpdatingHeading") {
            self.getLocationManager().startUpdatingHeading()
        }
        
        Function("stopUpdatingHeading") {
            self.getLocationManager().stopUpdatingHeading()
        }
        
        /**
         * 设置逆地理语言 (iOS 实现)
         */
        Function("setGeoLanguage") { (language: Int) in
            self.getLocationManager().setGeoLanguage(language)
        }
        
        /**
         * 设置是否单次定位 (Android 专用,iOS 空实现)
         */
        Function("setOnceLocation") { (_: Bool) in
            // iOS 不支持此配置
        }
        
        /**
         * 设置是否使用设备传感器 (Android 专用,iOS 空实现)
         */
        Function("setSensorEnable") { (_: Bool) in
            // iOS 不支持此配置
        }
        
        /**
         * 设置是否允许 WIFI 扫描 (Android 专用,iOS 空实现)
         */
        Function("setWifiScan") { (_: Bool) in
            // iOS 不支持此配置
        }
        
        /**
         * 设置是否 GPS 优先 (Android 专用,iOS 空实现)
         */
        Function("setGpsFirst") { (_: Bool) in
            // iOS 不支持此配置
        }
        
        /**
         * 设置是否等待 WIFI 列表刷新 (Android 专用,iOS 空实现)
         */
        Function("setOnceLocationLatest") { (_: Bool) in
            // iOS 不支持此配置
        }
        
        /**
         * 设置是否使用缓存策略 (Android 专用,iOS 空实现)
         */
        Function("setLocationCacheEnable") { (_: Bool) in
            // iOS 不支持此配置
        }
        
        /**
         * 设置网络请求超时时间 (Android 专用,iOS 空实现)
         */
        Function("setHttpTimeOut") { (_: Int) in
            // iOS 不支持此配置
        }
        
        /**
         * 设置定位协议 (未实现)
         */
        Function("setLocationProtocol") { (_: Int) in
            // 未实现
        }
        
        // ==================== 权限管理 ====================
        
        /**
         * 检查位置权限状态
         */
        AsyncFunction("checkLocationPermission") { (promise: Promise) in
            let status = CLLocationManager.authorizationStatus()
            let granted = status == .authorizedAlways || status == .authorizedWhenInUse
            
            promise.resolve([
                "granted": granted,
                "status": self.getAuthorizationStatusString(status)
            ])
        }
        
        /**
         * 请求位置权限
         */
        AsyncFunction("requestLocationPermission") { (promise: Promise) in
            if self.permissionManager == nil {
                self.permissionManager = PermissionManager()
            }
            
            self.permissionManager?.requestPermission { granted, status in
                print("🔐 [PermissionManager] 权限回调: granted=\(granted), status=\(status)")
                
                // 无论结果如何,都延迟后再次检查最终状态
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    let finalStatus = CLLocationManager.authorizationStatus()
                    let finalGranted = finalStatus == .authorizedAlways || finalStatus == .authorizedWhenInUse
                    let finalStatusString = self.getAuthorizationStatusString(finalStatus)
                    
                    print("🔐 [PermissionManager] 最终状态: granted=\(finalGranted), status=\(finalStatusString)")
                    
                    promise.resolve([
                        "granted": finalGranted,
                        "status": finalStatusString
                    ])
                }
            }
        }
        
        // ==================== 事件 ====================
        
        Events("onHeadingUpdate")
        
        Events("onLocationUpdate")
        
        // ==================== 视图定义 ====================
        
        View(ExpoGaodeMapView.self) {
            // 事件 - 使用 Expo 的事件命名约定
            Events("onMapPress", "onMapLongPress", "onLoad", "onMarkerPress", "onMarkerDragStart", "onMarkerDrag", "onMarkerDragEnd", "onCirclePress", "onPolygonPress", "onPolylinePress")
            
            // 地图类型
            Prop("mapType") { (view: ExpoGaodeMapView, type: Int) in
                view.mapType = type
            }
            
            // 初始相机位置
            Prop("initialCameraPosition") { (view: ExpoGaodeMapView, position: [String: Any]?) in
                view.initialCameraPosition = position
            }
            
            // 缩放限制
            Prop("maxZoom") { (view: ExpoGaodeMapView, zoom: Double) in
                view.setMaxZoom(zoom)
            }
            
            Prop("minZoom") { (view: ExpoGaodeMapView, zoom: Double) in
                view.setMinZoom(zoom)
            }
            
            // 控件显示
            Prop("zoomControlsEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.showsZoomControls = show
            }
            
            Prop("compassEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.showsCompass = show
            }
            
            Prop("scaleControlsEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.showsScale = show
            }
            
            // 手势控制
            Prop("zoomGesturesEnabled") { (view: ExpoGaodeMapView, enabled: Bool) in
                view.isZoomEnabled = enabled
            }
            
            Prop("scrollGesturesEnabled") { (view: ExpoGaodeMapView, enabled: Bool) in
                view.isScrollEnabled = enabled
            }
            
            Prop("rotateGesturesEnabled") { (view: ExpoGaodeMapView, enabled: Bool) in
                view.isRotateEnabled = enabled
            }
            
            Prop("tiltGesturesEnabled") { (view: ExpoGaodeMapView, enabled: Bool) in
                view.isTiltEnabled = enabled
            }
            
            // 地图图层
            Prop("myLocationEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.setShowsUserLocation(show)
            }
            
            Prop("followUserLocation") { (view: ExpoGaodeMapView, follow: Bool) in
                view.setFollowUserLocation(follow)
            }
            
            Prop("userLocationRepresentation") { (view: ExpoGaodeMapView, config: [String: Any]) in
                view.setUserLocationRepresentation(config)
            }
            
            Prop("trafficEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.setShowsTraffic(show)
            }
            
            Prop("buildingsEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.setShowsBuildings(show)
            }
            
            Prop("indoorViewEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.setShowsIndoorMap(show)
            }
            
            // 生命周期方法
            OnViewDidUpdateProps { (view: ExpoGaodeMapView) in
                view.applyProps()
            }
            
            // 相机控制方法
            AsyncFunction("moveCamera") { (view: ExpoGaodeMapView, position: [String: Any], duration: Int) in
                view.moveCamera(position: position, duration: duration)
            }
            
            AsyncFunction("getLatLng") { (view: ExpoGaodeMapView, point: [String: Double]) -> [String: Double] in
                return view.getLatLng(point: point)
            }
            
            AsyncFunction("setCenter") { (view: ExpoGaodeMapView, center: [String: Double], animated: Bool) in
                view.setCenter(center: center, animated: animated)
            }
            
            AsyncFunction("setZoom") { (view: ExpoGaodeMapView, zoom: Double, animated: Bool) in
                view.setZoom(zoom: zoom, animated: animated)
            }
            
            AsyncFunction("getCameraPosition") { (view: ExpoGaodeMapView) -> [String: Any] in
                return view.getCameraPosition()
            }
            
            // Circle 命令
            AsyncFunction("addCircle") { (view: ExpoGaodeMapView, id: String, props: [String: Any]) in
                view.addCircle(id: id, props: props)
            }
            
            AsyncFunction("removeCircle") { (view: ExpoGaodeMapView, id: String) in
                view.removeCircle(id: id)
            }
            
            AsyncFunction("updateCircle") { (view: ExpoGaodeMapView, id: String, props: [String: Any]) in
                view.updateCircle(id: id, props: props)
            }
            
            // Marker 命令
            AsyncFunction("addMarker") { (view: ExpoGaodeMapView, id: String, props: [String: Any]) in
                view.addMarker(id: id, props: props)
            }
            
            AsyncFunction("removeMarker") { (view: ExpoGaodeMapView, id: String) in
                view.removeMarker(id: id)
            }
            
            AsyncFunction("updateMarker") { (view: ExpoGaodeMapView, id: String, props: [String: Any]) in
                view.updateMarker(id: id, props: props)
            }
            
            // Polyline 命令
            AsyncFunction("addPolyline") { (view: ExpoGaodeMapView, id: String, props: [String: Any]) in
                view.addPolyline(id: id, props: props)
            }
            
            AsyncFunction("removePolyline") { (view: ExpoGaodeMapView, id: String) in
                view.removePolyline(id: id)
            }
            
            AsyncFunction("updatePolyline") { (view: ExpoGaodeMapView, id: String, props: [String: Any]) in
                view.updatePolyline(id: id, props: props)
            }
            
            // Polygon 命令
            AsyncFunction("addPolygon") { (view: ExpoGaodeMapView, id: String, props: [String: Any]) in
                view.addPolygon(id: id, props: props)
            }
            
            AsyncFunction("removePolygon") { (view: ExpoGaodeMapView, id: String) in
                view.removePolygon(id: id)
            }
            
            AsyncFunction("updatePolygon") { (view: ExpoGaodeMapView, id: String, props: [String: Any]) in
                view.updatePolygon(id: id, props: props)
            }
        }
        
        // ==================== 覆盖物视图注册 ====================
        
        // Marker - 标记点
        View(MarkerView.self) {
            Events("onPress", "onDragStart", "onDrag", "onDragEnd")
            
            Prop("position") { (view: MarkerView, position: [String: Double]) in
                view.setPosition(position)
            }
            
            Prop("title") { (view: MarkerView, title: String) in
                view.setTitle(title)
            }
            
            Prop("snippet") { (view: MarkerView, snippet: String) in
                view.setDescription(snippet)
            }
            
            Prop("draggable") { (view: MarkerView, draggable: Bool) in
                view.setDraggable(draggable)
            }
            
            Prop("icon") { (view: MarkerView, source: [String: Any]?) in
                view.setIcon(source)
            }
            
            Prop("iconWidth") { (view: MarkerView, width: Double) in
                view.iconWidth = width
            }
            
            Prop("iconHeight") { (view: MarkerView, height: Double) in
                view.iconHeight = height
            }
            
            Prop("centerOffset") { (view: MarkerView, offset: [String: Double]) in
                view.setCenterOffset(offset)
            }
            
            Prop("animatesDrop") { (view: MarkerView, animate: Bool) in
                view.setAnimatesDrop(animate)
            }
            
            Prop("pinColor") { (view: MarkerView, color: String) in
                view.setPinColor(color)
            }
            
            Prop("canShowCallout") { (view: MarkerView, show: Bool) in
                view.setCanShowCallout(show)
            }
        }
        
        // Circle - 圆形
        View(CircleView.self) {
            Events("onPress")
            
            Prop("center") { (view: CircleView, center: [String: Double]) in
                view.setCenter(center)
            }
            
            Prop("radius") { (view: CircleView, radius: Double) in
                view.setRadius(radius)
            }
            
            Prop("fillColor") { (view: CircleView, color: String) in
                view.setFillColor(color)
            }
            
            Prop("strokeColor") { (view: CircleView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("strokeWidth") { (view: CircleView, width: Double) in
                view.setStrokeWidth(Float(width))
            }
        }
        
        // Polyline - 折线
        View(PolylineView.self) {
            Events("onPress")
            
            Prop("points") { (view: PolylineView, points: [[String: Double]]) in
                view.setPoints(points)
            }
            
            Prop("width") { (view: PolylineView, width: Double) in
                view.setStrokeWidth(Float(width))
            }
            
            Prop("strokeWidth") { (view: PolylineView, width: Double) in
                view.setStrokeWidth(Float(width))
            }
            
            Prop("color") { (view: PolylineView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("strokeColor") { (view: PolylineView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("texture") { (view: PolylineView, url: String?) in
                view.setTexture(url)
            }
            
            Prop("dotted") { (view: PolylineView, dotted: Bool) in
                view.setDotted(dotted)
            }
        }
        
        // Polygon - 多边形
        View(PolygonView.self) {
            Events("onPress")
            
            Prop("points") { (view: PolygonView, points: [[String: Double]]) in
                view.setPoints(points)
            }
            
            Prop("fillColor") { (view: PolygonView, color: String) in
                view.setFillColor(color)
            }
            
            Prop("strokeColor") { (view: PolygonView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("strokeWidth") { (view: PolygonView, width: Double) in
                view.setStrokeWidth(Float(width))
            }
        }
        
        // HeatMap - 热力图
        View(HeatMapView.self) {
            Prop("data") { (view: HeatMapView, data: [[String: Any]]) in
                view.setData(data)
            }
            
            Prop("radius") { (view: HeatMapView, radius: Int) in
                view.setRadius(radius)
            }
            
            Prop("opacity") { (view: HeatMapView, opacity: Double) in
                view.setOpacity(opacity)
            }
        }
        
        // MultiPoint - 海量点
        View(MultiPointView.self) {
            Events("onPress")
            
            Prop("points") { (view: MultiPointView, points: [[String: Any]]) in
                view.setPoints(points)
            }
        }
        
        // Cluster - 点聚合
        View(ClusterView.self) {
            Events("onPress", "onClusterPress")
            
            Prop("points") { (view: ClusterView, points: [[String: Any]]) in
                view.setPoints(points)
            }
            
            Prop("radius") { (view: ClusterView, radius: Int) in
                view.setRadius(radius)
            }
            
            Prop("minClusterSize") { (view: ClusterView, size: Int) in
                view.setMinClusterSize(size)
            }
        }
        
        OnDestroy {
            self.locationManager?.destroy()
            self.locationManager = nil
        }
    }
    
    // MARK: - 私有方法
    
    /**
     * 获取或创建定位管理器实例
     * 使用懒加载模式,并设置事件回调
     */
    private func getLocationManager() -> LocationManager {
        if locationManager == nil {
            locationManager = LocationManager()
            locationManager?.onLocationUpdate = { [weak self] locationData in
                self?.sendEvent("onLocationUpdate", locationData)
            }
            locationManager?.onHeadingUpdate = { [weak self] headingData in
                self?.sendEvent("onHeadingUpdate", headingData)
            }
        }
        return locationManager!
    }
    
    /**
     * 将权限状态转换为字符串
     */
    private func getAuthorizationStatusString(_ status: CLAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "notDetermined"
        case .restricted: return "restricted"
        case .denied: return "denied"
        case .authorizedAlways: return "authorizedAlways"
        case .authorizedWhenInUse: return "authorizedWhenInUse"
        @unknown default: return "unknown"
        }
    }
}
