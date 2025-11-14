import ExpoModulesCore
import AMapFoundationKit
import AMapLocationKit
import MAMapKit

public class ExpoGaodeMapModule: Module {
    private var locationManager: LocationManager?
    
    public func definition() -> ModuleDefinition {
        Name("ExpoGaodeMap")
        
        // ==================== SDK 初始化 ====================
        
        Function("initSDK") { (config: [String: String]) in
            guard let iosKey = config["iosKey"] else { return }
            AMapServices.shared().apiKey = iosKey
            AMapServices.shared().enableHTTPS = true
            MAMapView.updatePrivacyAgree(AMapPrivacyAgreeStatus.didAgree)
            MAMapView.updatePrivacyShow(AMapPrivacyShowStatus.didShow, privacyInfo: AMapPrivacyInfoStatus.didContain)
            self.getLocationManager()
        }
        
        Function("getVersion") {
            "iOS SDK Version"
        }
        
        // ==================== 定位功能 ====================
        
        Function("start") {
            self.getLocationManager().start()
        }
        
        Function("stop") {
            self.getLocationManager().stop()
        }
        
        AsyncFunction("isStarted") { (promise: Promise) in
            promise.resolve(self.getLocationManager().isStarted())
        }
        
        AsyncFunction("getCurrentLocation") { (promise: Promise) in
            let status = CLLocationManager.authorizationStatus()
            let clManager = CLLocationManager()
            clManager.requestWhenInUseAuthorization()
            
            if status == .authorizedAlways || status == .authorizedWhenInUse || status == .notDetermined {
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
        
        AsyncFunction("coordinateConvert") { (coordinate: [String: Double], type: Int, promise: Promise) in
            // iOS 高德地图 SDK 坐标转换
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
        
        // ==================== 事件 ====================
        
        Events("onHeadingUpdate")
        
        Events("onLocationUpdate")
        
        // ==================== 视图定义 ====================
        
        View(ExpoGaodeMapView.self) {
            // 事件 - 使用 Expo 的事件命名约定
            Events("onMapPress", "onMapLongPress", "onLoad")
            
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
                view.showsTraffic = show
            }
            
            Prop("buildingsEnabled") { (view: ExpoGaodeMapView, show: Bool) in
                view.showsBuildings = show
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
            
            Prop("description") { (view: MarkerView, description: String) in
                view.setDescription(description)
            }
            
            Prop("draggable") { (view: MarkerView, draggable: Bool) in
                view.setDraggable(draggable)
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
            
            Prop("fillColor") { (view: CircleView, color: Int) in
                view.setFillColor(color)
            }
            
            Prop("strokeColor") { (view: CircleView, color: Int) in
                view.setStrokeColor(color)
            }
            
            Prop("strokeWidth") { (view: CircleView, width: Float) in
                view.setStrokeWidth(width)
            }
        }
        
        // Polyline - 折线
        View(PolylineView.self) {
            Events("onPress")
            
            Prop("points") { (view: PolylineView, points: [[String: Double]]) in
                view.setPoints(points)
            }
            
            Prop("strokeWidth") { (view: PolylineView, width: Float) in
                view.setStrokeWidth(width)
            }
            
            Prop("strokeColor") { (view: PolylineView, color: Int) in
                view.setStrokeColor(color)
            }
            
            Prop("texture") { (view: PolylineView, url: String?) in
                view.setTexture(url)
            }
        }
        
        // Polygon - 多边形
        View(PolygonView.self) {
            Events("onPress")
            
            Prop("points") { (view: PolygonView, points: [[String: Double]]) in
                view.setPoints(points)
            }
            
            Prop("fillColor") { (view: PolygonView, color: Int) in
                view.setFillColor(color)
            }
            
            Prop("strokeColor") { (view: PolygonView, color: Int) in
                view.setStrokeColor(color)
            }
            
            Prop("strokeWidth") { (view: PolygonView, width: Float) in
                view.setStrokeWidth(width)
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
    
    // MARK: - Private Methods
    
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
}
