import ExpoModulesCore
import AMapFoundationKit
import AMapLocationKit
import AMapNaviKit
import CoreLocation

/**
 * 高德地图 Expo 模块
 *
 * 负责:
 * - SDK 初始化和配置
 * - 定位功能管理
 * - 权限管理
 */
public class ExpoGaodeMapModule: Module {
    /// 定位管理器实例
    private var locationManager: LocationManager?
    /// 权限管理器实例
    private var permissionManager: PermissionManager?
    
    // MARK: - 私有辅助方法
    
    /**
     * 尝试从 Info.plist 读取并设置 API Key
     * @return 是否成功设置 API Key
     */
    @discardableResult
    private func trySetupApiKeyFromPlist() -> Bool {
        if AMapServices.shared().apiKey == nil || AMapServices.shared().apiKey?.isEmpty == true {
            if let plistKey = Bundle.main.infoDictionary?["AMapApiKey"] as? String, !plistKey.isEmpty {
                AMapServices.shared().apiKey = plistKey
                AMapServices.shared().enableHTTPS = true
                print("✅ ExpoGaodeMap: 从 Info.plist 读取并设置 AMapApiKey 成功")
                return true
            } else {
                print("⚠️ ExpoGaodeMap: Info.plist 未找到 AMapApiKey")
                return false
            }
        }
        return true // 已经设置过了
    }
    
    /**
     * 尝试启动预加载（检查 API Key 后）
     * @param delay 延迟时间（秒）
     * @param poolSize 预加载池大小
     */
    private func tryStartPreload(delay: Double = 1.0, poolSize: Int = 1) {
        if let apiKey = AMapServices.shared().apiKey, !apiKey.isEmpty {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                let status = MapPreloadManager.shared.getStatus()
                let isPreloading = (status["isPreloading"] as? Bool) ?? false
                
                if !MapPreloadManager.shared.hasPreloadedMapView() && !isPreloading {
                   
                    MapPreloadManager.shared.startPreload(poolSize: poolSize)
                }
            }
        } else {
            print("⚠️ ExpoGaodeMap: API Key 未设置，跳过自动预加载")
        }
    }
    
    public func definition() -> ModuleDefinition {
        Name("ExpoGaodeMap")
        
        // 模块初始化：尝试从本地缓存恢复隐私同意状态
        OnCreate {

             // 1. 告知 SDK：隐私协议已展示且包含隐私内容
            MAMapView.updatePrivacyShow(
                AMapPrivacyShowStatus.didShow,
                privacyInfo: AMapPrivacyInfoStatus.didContain
            )

            // 2. 告知 SDK：用户已同意隐私协议（关键）
            MAMapView.updatePrivacyAgree(AMapPrivacyAgreeStatus.didAgree)

            print("✅ ExpoGaodeMap: 原生侧已默认同意隐私协议")

             // 3. 自动设置 API Key（Info.plist）
            self.trySetupApiKeyFromPlist()

            // 4. 自动启动预加载（可选）
            self.tryStartPreload(delay: 2.0, poolSize: 1)
        }
        
        // ==================== SDK 初始化 ====================
        
        /**
         * 初始化高德地图 SDK
         * @param config 配置字典,包含 iosKey
         */
        Function("initSDK") { (config: [String: String]) in
            // 1) 优先使用传入的 iosKey；2) 否则回退读取 Info.plist 的 AMapApiKey
            let providedKey = config["iosKey"]?.trimmingCharacters(in: .whitespacesAndNewlines)
            var finalKey: String? = (providedKey?.isEmpty == false) ? providedKey : nil
            if finalKey == nil {
                if let plistKey = Bundle.main.infoDictionary?["AMapApiKey"] as? String, !plistKey.isEmpty {
                    finalKey = plistKey
                    print("ℹ️ ExpoGaodeMap: initSDK 未提供 iosKey，已从 Info.plist 使用 AMapApiKey")
                }
            }
            
            guard let keyToUse = finalKey, !keyToUse.isEmpty else {
                print("⚠️ ExpoGaodeMap: 未提供 iosKey 且 Info.plist 中也无 AMapApiKey，无法初始化 SDK")
                throw Exception(name: "INIT_FAILED", description: "未提供 API Key")
            }
            
            // 设置 API Key（若与现有不同或尚未设置）
            if AMapServices.shared().apiKey != keyToUse {
                AMapServices.shared().apiKey = keyToUse
            }
            AMapServices.shared().enableHTTPS = true
            
            // 初始化定位管理器（触发原生侧懒加载）
            self.getLocationManager()
            
            print("✅ ExpoGaodeMap: 已设置 API Key 并完成初始化（来源：\(providedKey != nil ? "入参 iosKey" : "Info.plist" )）")
        }
        
        /**
         * 设置是否加载世界向量地图
         * @param enable 是否开启
         */
        Function("setLoadWorldVectorMap") { (enable: Bool) in
            MAMapView.loadWorldVectorMap = enable
        }
        
        /**
         * 获取 SDK 版本号
         */
        Function("getVersion") {
            "iOS SDK Version"
        }
        
        /**
         * 检查原生 SDK 是否已配置 API Key
         */
        Function("isNativeSDKConfigured") { () -> Bool in
            if let apiKey = AMapServices.shared().apiKey, !apiKey.isEmpty {
                return true
            }
            return false
        }
        
        // ==================== 定位功能 ====================
        
        /**
         * 开始连续定位
         */
        Function("start") {
            
            // 检查是否已设置 API Key
            if AMapServices.shared().apiKey == nil || AMapServices.shared().apiKey?.isEmpty == true {
                print("⚠️ ExpoGaodeMap: 未设置 API Key，无法开始定位")
                return
            }
            
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

            
            // 检查是否已设置 API Key
            if AMapServices.shared().apiKey == nil || AMapServices.shared().apiKey?.isEmpty == true {
                promise.reject("API_KEY_NOT_SET", "未设置 API Key，无法获取位置")
                return
            }
            
            let status = self.currentAuthorizationStatus()
            
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
         * 解析高德折线字符串 (Polyline)
         * @param polylineStr 折线字符串
         * @return 坐标点数组
         */
        Function("parsePolyline") { (polylineStr: String?) -> [[String: Double]] in
            guard let polylineStr = polylineStr, !polylineStr.isEmpty else {
                return []
            }
            
            let flatCoords = ClusterNative.parsePolyline(polylineStr: polylineStr)
            var result: [[String: Double]] = []
            
            // flatCoords 是 [lat1, lon1, lat2, lon2, ...]
            for i in stride(from: 0, to: flatCoords.count, by: 2) {
                if i + 1 < flatCoords.count {
                    result.append([
                        "latitude": flatCoords[i].doubleValue,
                        "longitude": flatCoords[i+1].doubleValue
                    ])
                }
            }
            
            return result
        }

        /**
         * 坐标转换
         * @param coordinate 原始坐标
         * @param type 坐标类型 (0: GPS/Google, 1: MapBar, 2: Baidu, 3: MapABC/SoSo)
         * @return 转换后的坐标
         */
        AsyncFunction("coordinateConvert") { (coordinate: [String: Double]?, type: Int, promise: Promise) in
            if let coord = LatLngParser.parseLatLng(coordinate) {
                let coordDict = ["latitude": coord.latitude, "longitude": coord.longitude]
                self.getLocationManager().coordinateConvert(coordDict, type: type, promise: promise)
            } else {
                promise.reject("INVALID_COORDINATE", "Invalid coordinate format")
            }
        }
        
        // ==================== 几何计算 ====================
        
        /**
         * 计算两点之间的距离
         */
        Function("distanceBetweenCoordinates") { (p1: [String: Double]?, p2: [String: Double]?) -> Double in
            guard let coord1 = LatLngParser.parseLatLng(p1),
                  let coord2 = LatLngParser.parseLatLng(p2) else {
                return 0.0
            }
            return ClusterNative.calculateDistance(lat1: coord1.latitude, lon1: coord1.longitude, lat2: coord2.latitude, lon2: coord2.longitude)
        }
        
        /**
         * 计算多边形面积
         * @param points 多边形顶点坐标数组，支持嵌套数组（多边形空洞）
         */
        Function("calculatePolygonArea") { (points: [Any]?) -> Double in
            let rings = LatLngParser.parseLatLngListList(points)
            if rings.isEmpty { return 0.0 }
            
            // 第一项是外轮廓
            let outerCoords = rings[0]
            var totalArea = ClusterNative.calculatePolygonArea(
                latitudes: outerCoords.map { NSNumber(value: $0.latitude) },
                longitudes: outerCoords.map { NSNumber(value: $0.longitude) }
            )
            
            // 后续项是内孔，需要减去面积
            if rings.count > 1 {
                for i in 1..<rings.count {
                    let ring = rings[i]
                    totalArea -= ClusterNative.calculatePolygonArea(
                        latitudes: ring.map { NSNumber(value: $0.latitude) },
                        longitudes: ring.map { NSNumber(value: $0.longitude) }
                    )
                }
            }
            
            return Swift.max(0.0, totalArea)
        }
        
        /**
         * 判断点是否在多边形内
         * @param point 待判断点
         * @param polygon 多边形顶点坐标数组，支持嵌套数组（多边形空洞）
         */
        Function("isPointInPolygon") { (point: [String: Double]?, polygon: [Any]?) -> Bool in
            guard let coord = LatLngParser.parseLatLng(point) else {
                return false
            }
            
            let rings = LatLngParser.parseLatLngListList(polygon)
            if rings.isEmpty { return false }
            
            // 点必须在外轮廓内
            let outerCoords = rings[0]
            let inOuter = ClusterNative.isPointInPolygon(
                pointLat: coord.latitude,
                pointLon: coord.longitude,
                latitudes: outerCoords.map { NSNumber(value: $0.latitude) },
                longitudes: outerCoords.map { NSNumber(value: $0.longitude) }
            )
            
            if !inOuter { return false }
            
            // 点不能在任何内孔内
            if rings.count > 1 {
                for i in 1..<rings.count {
                    let ring = rings[i]
                    let inHole = ClusterNative.isPointInPolygon(
                        pointLat: coord.latitude,
                        pointLon: coord.longitude,
                        latitudes: ring.map { NSNumber(value: $0.latitude) },
                        longitudes: ring.map { NSNumber(value: $0.longitude) }
                    )
                    if inHole { return false }
                }
            }
            
            return true
        }
        
        /**
         * 判断点是否在圆内
         */
        Function("isPointInCircle") { (point: [String: Double]?, center: [String: Double]?, radius: Double) -> Bool in
            guard let coord = LatLngParser.parseLatLng(point),
                  let centerCoord = LatLngParser.parseLatLng(center) else {
                return false
            }
            return ClusterNative.isPointInCircle(pointLat: coord.latitude, pointLon: coord.longitude, centerLat: centerCoord.latitude, centerLon: centerCoord.longitude, radiusMeters: radius)
        }
        
        /**
         * 计算矩形面积
         */
        Function("calculateRectangleArea") { (southWest: [String: Double]?, northEast: [String: Double]?) -> Double in
            guard let sw = LatLngParser.parseLatLng(southWest),
                  let ne = LatLngParser.parseLatLng(northEast) else {
                return 0.0
            }
            return ClusterNative.calculateRectangleArea(swLat: sw.latitude, swLon: sw.longitude, neLat: ne.latitude, neLon: ne.longitude)
        }
        
        /**
         * 计算路径上距离目标点最近的点
         */
        Function("getNearestPointOnPath") { (path: [[String: Double]]?, target: [String: Double]?) -> [String: Any]? in
            guard let targetCoord = LatLngParser.parseLatLng(target) else {
                return nil
            }
            
            let coords = LatLngParser.parseLatLngList(path)
            if coords.isEmpty {
                return nil
            }
            
            let lats = coords.map { NSNumber(value: $0.latitude) }
            let lons = coords.map { NSNumber(value: $0.longitude) }
            
            return ClusterNative.getNearestPointOnPath(latitudes: lats, longitudes: lons, targetLat: targetCoord.latitude, targetLon: targetCoord.longitude) as? [String: Any]
        }
        
        /**
         * 计算多边形质心
         * @param polygon 多边形顶点坐标数组，支持嵌套数组（多边形空洞）
         */
        Function("calculateCentroid") { (polygon: [Any]?) -> [String: Double]? in
            let rings = LatLngParser.parseLatLngListList(polygon)
            if rings.isEmpty { return nil }
            
            if rings.count == 1 {
                let coords = rings[0]
                let lats = coords.map { NSNumber(value: $0.latitude) }
                let lons = coords.map { NSNumber(value: $0.longitude) }
                return ClusterNative.calculateCentroid(latitudes: lats, longitudes: lons) as? [String: Double]
            }
            
            // 带孔多边形的质心计算: Σ(Area_i * Centroid_i) / Σ(Area_i)
            var totalArea = 0.0
            var sumLat = 0.0
            var sumLon = 0.0
            
            for i in 0..<rings.count {
                let coords = rings[i]
                let lats = coords.map { NSNumber(value: $0.latitude) }
                let lons = coords.map { NSNumber(value: $0.longitude) }
                
                let area = ClusterNative.calculatePolygonArea(latitudes: lats, longitudes: lons)
                if let centroid = ClusterNative.calculateCentroid(latitudes: lats, longitudes: lons) as? [String: Double],
                   let cLat = centroid["latitude"], let cLon = centroid["longitude"] {
                    
                    // 第一项是外轮廓(正)，后续是内孔(负)
                    let factor = (i == 0) ? 1.0 : -1.0
                    let signedArea = area * factor
                    
                    totalArea += signedArea
                    sumLat += cLat * signedArea
                    sumLon += cLon * signedArea
                }
            }
            
            if abs(totalArea) > 1e-9 {
                return [
                    "latitude": sumLat / totalArea,
                    "longitude": sumLon / totalArea
                ]
            }
            
            return nil
        }

        /**
         * 计算路径边界
         * @param points 路径点集合
         * @return 边界信息
         */
        Function("calculatePathBounds") { (points: [Any]?) -> [String: Any]? in
            let coords = LatLngParser.parseLatLngList(points)
            if coords.isEmpty { return nil }
            
            return ClusterNative.calculatePathBounds(
                latitudes: coords.map { NSNumber(value: $0.latitude) },
                longitudes: coords.map { NSNumber(value: $0.longitude) }
            ) as? [String: Any]
        }
        
        /**
         * GeoHash 编码
         */
        Function("encodeGeoHash") { (coordinate: [String: Double]?, precision: Int) -> String in
            guard let coord = LatLngParser.parseLatLng(coordinate) else {
                return ""
            }
            return ClusterNative.encodeGeoHash(lat: coord.latitude, lon: coord.longitude, precision: Int32(precision))
        }

        /**
         * 轨迹抽稀 (RDP 算法)
         */
        Function("simplifyPolyline") { (points: [[String: Double]]?, tolerance: Double) -> [[String: Double]] in
            let coords = LatLngParser.parseLatLngList(points)
            let simplified = GeometryUtils.simplifyPolyline(coords, tolerance: tolerance)
            
            return simplified.map {
                [
                    "latitude": $0.latitude,
                    "longitude": $0.longitude
                ]
            }
        }
        
        /**
         * 计算路径总长度
         */
        Function("calculatePathLength") { (points: [[String: Double]]?) -> Double in
            let coords = LatLngParser.parseLatLngList(points)
            let lats = coords.map { NSNumber(value: $0.latitude) }
            let lons = coords.map { NSNumber(value: $0.longitude) }
            return ClusterNative.calculatePathLength(latitudes: lats, longitudes: lons)
        }
        
        /**
         * 获取路径上指定距离的点
         */
        Function("getPointAtDistance") { (points: [[String: Double]]?, distance: Double) -> [String: Any]? in
            let coords = LatLngParser.parseLatLngList(points)
            let lats = coords.map { NSNumber(value: $0.latitude) }
            let lons = coords.map { NSNumber(value: $0.longitude) }
            return ClusterNative.getPointAtDistance(latitudes: lats, longitudes: lons, distanceMeters: distance) as? [String: Any]
        }

        // --- 瓦片与坐标转换 ---

        /**
         * 瓦片坐标转换：经纬度 -> 瓦片坐标
         */
        Function("latLngToTile") { (coordinate: [String: Double]?, zoom: Int) -> [String: Any]? in
            guard let coord = LatLngParser.parseLatLng(coordinate) else { return nil }
            return ClusterNative.latLngToTile(lat: coord.latitude, lon: coord.longitude, zoom: Int32(zoom)) as? [String: Any]
        }

        /**
         * 瓦片坐标转换：瓦片坐标 -> 经纬度
         */
        Function("tileToLatLng") { (tile: [String: Int]) -> [String: Double]? in
            guard let x = tile["x"], let y = tile["y"], let z = tile["z"] else { return nil }
            return ClusterNative.tileToLatLng(x: Int32(x), y: Int32(y), zoom: Int32(z)) as? [String: Double]
        }

        /**
         * 像素坐标转换：经纬度 -> 像素坐标
         */
        Function("latLngToPixel") { (coordinate: [String: Double]?, zoom: Int) -> [String: Any]? in
            guard let coord = LatLngParser.parseLatLng(coordinate) else { return nil }
            return ClusterNative.latLngToPixel(lat: coord.latitude, lon: coord.longitude, zoom: Int32(zoom)) as? [String: Any]
        }

        /**
         * 像素坐标转换：像素坐标 -> 经纬度
         */
        Function("pixelToLatLng") { (pixel: [String: Double], zoom: Int) -> [String: Double]? in
            guard let x = pixel["x"], let y = pixel["y"] else { return nil }
            return ClusterNative.pixelToLatLng(x: x, y: y, zoom: Int32(zoom)) as? [String: Double]
        }

        // --- 批量地理围栏与热力图 ---

        /**
         * 批量地理围栏检测
         */
        Function("findPointInPolygons") { (point: [String: Double]?, polygons: [Any]?) -> Int in
            guard let coord = LatLngParser.parseLatLng(point) else { return -1 }
            
            // 解析多边形集合，统一处理为 [[String: Any]] 格式供 ClusterNative 遍历
            let rings = LatLngParser.parseLatLngListList(polygons)
            if rings.isEmpty { return -1 }
            
            let nsPolygons = rings.map { ring in
                ring.map { ["latitude": $0.latitude, "longitude": $0.longitude] }
            }
            
            return Int(ClusterNative.findPointInPolygons(pointLat: coord.latitude, pointLon: coord.longitude, polygons: nsPolygons))
        }

        /**
         * 生成网格聚合数据
         */
        Function("generateHeatmapGrid") { (points: [[String: Any]]?, gridSizeMeters: Double) -> [[String: Any]] in
            guard let points = points, !points.isEmpty else { return [] }
            
            var lats: [NSNumber] = []
            var lons: [NSNumber] = []
            var weights: [NSNumber] = []
            
            for p in points {
                if let lat = p["latitude"] as? Double, let lon = p["longitude"] as? Double {
                    lats.append(NSNumber(value: lat))
                    lons.append(NSNumber(value: lon))
                    weights.append(NSNumber(value: (p["weight"] as? Double) ?? 1.0))
                }
            }
            
            return (ClusterNative.generateHeatmapGrid(latitudes: lats, longitudes: lons, weights: weights, gridSizeMeters: gridSizeMeters) as? [[String: Any]]) ?? []
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
        
        Function("setDistanceFilter") { (distance: Double) in
            self.getLocationManager().setDistanceFilter(distance)
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
        
        Property("isBackgroundLocationEnabled") { () -> Bool in
            let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String]
            return backgroundModes?.contains("location") == true
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
            let status = self.currentAuthorizationStatus()
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
                // 无论结果如何,都延迟后再次检查最终状态
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    let finalStatus = self.currentAuthorizationStatus()
                    let finalGranted = finalStatus == .authorizedAlways || finalStatus == .authorizedWhenInUse
                    let finalStatusString = self.getAuthorizationStatusString(finalStatus)
                    
                    promise.resolve([
                        "granted": finalGranted,
                        "status": finalStatusString
                    ])
                }
            }
        }
        
        /**
         * 请求后台位置权限（iOS）
         * 注意：必须在前台权限已授予后才能请求
         */
        AsyncFunction("requestBackgroundLocationPermission") { (promise: Promise) in
            let status = self.currentAuthorizationStatus()
            
            // 检查前台权限是否已授予
            if status != .authorizedWhenInUse && status != .authorizedAlways {
                promise.reject("FOREGROUND_PERMISSION_REQUIRED", "必须先授予前台位置权限才能请求后台位置权限")
                return
            }
            
            // iOS 上后台权限通过 Info.plist 配置 + 系统设置
            // 这里返回当前状态
            let hasBackground = status == .authorizedAlways
            
            promise.resolve([
                "granted": hasBackground,
                "backgroundLocation": hasBackground,
                "status": self.getAuthorizationStatusString(status),
                "message": hasBackground ? "已授予后台权限" : "需要在系统设置中手动授予'始终'权限"
            ])
        }
        
  
        /**
         * 打开应用设置页面（引导用户手动授予权限）
         */
        Function("openAppSettings") {
            if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(settingsUrl)
            }
        }
        

        
        Events("onHeadingUpdate")
        Events("onLocationUpdate")
        
        OnDestroy {
            self.locationManager?.destroy()
            self.locationManager = nil
            MapPreloadManager.shared.cleanup()
        }
    }
    
    // MARK: - 定位管理器
    
    /**
     * 获取或创建定位管理器实例
     * 使用懒加载模式,并设置事件回调
     */
    @discardableResult
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
     * 获取当前的权限状态（兼容 iOS 14+）
     */
    private func currentAuthorizationStatus() -> CLAuthorizationStatus {
        if #available(iOS 14.0, *) {
            return CLLocationManager().authorizationStatus
        } else {
            return CLLocationManager.authorizationStatus()
        }
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
