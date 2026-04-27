import Foundation
import AMapLocationKit
import AMapFoundationKit
import CoreLocation
import ExpoModulesCore

/**
 * 定位管理器
 * 
 * 负责:
 * - 连续定位和单次定位
 * - 定位配置管理
 * - 方向传感器管理
 * - 定位结果回调
 */

class LocationManager: NSObject, AMapLocationManagerDelegate {

    // 高德定位对象
    var locationManager: AMapLocationManager?

    // 连续定位是否已开启
    private var isLocationStarted = false

    // 连续定位 event 回调（给 JS map listener 用）
    var onLocationUpdate: (([String: Any]) -> Void)?
    var onHeadingUpdate: (([String: Any]) -> Void)?
    private var locationIntervalMillis: Int = 2000
    private var lastLocationEventTimestampMillis: Double?

    override init() {
        super.init()
    }

    // MARK: - 连续定位控制

    func start() {
        lastLocationEventTimestampMillis = nil
        ensureLocationManager()?.startUpdatingLocation()
        isLocationStarted = true
    }

    func stop() {
        ensureLocationManager()?.stopUpdatingLocation()
        isLocationStarted = false
        lastLocationEventTimestampMillis = nil
    }

    func isStarted() -> Bool {
        return isLocationStarted
    }

    // MARK: - 高德定位配置 API

    func setLocatingWithReGeocode(_ isReGeocode: Bool) {
        ensureLocationManager()?.locatingWithReGeocode = isReGeocode
    }

    func setDistanceFilter(_ distance: Double) {
        ensureLocationManager()?.distanceFilter = distance
    }

    func setInterval(_ interval: Int) {
        locationIntervalMillis = max(interval, 0)
    }

    func setLocationTimeout(_ timeout: Int) {
        ensureLocationManager()?.locationTimeout = timeout
    }

    func setReGeocodeTimeout(_ timeout: Int) {
        ensureLocationManager()?.reGeocodeTimeout = timeout
    }

    func setDesiredAccuracy(_ accuracy: Int) {
        let value: CLLocationAccuracy
        switch accuracy {
        case 0: value = kCLLocationAccuracyBestForNavigation
        case 1: value = kCLLocationAccuracyBest
        case 2: value = kCLLocationAccuracyNearestTenMeters
        case 3: value = kCLLocationAccuracyHundredMeters
        case 4: value = kCLLocationAccuracyKilometer
        case 5: value = kCLLocationAccuracyThreeKilometers
        default: value = kCLLocationAccuracyBest
        }
        ensureLocationManager()?.desiredAccuracy = value
    }

    func setPausesLocationUpdatesAutomatically(_ pauses: Bool) {
        ensureLocationManager()?.pausesLocationUpdatesAutomatically = pauses
    }

    func setAllowsBackgroundLocationUpdates(_ allows: Bool) {
        if allows {
            let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String]
            if backgroundModes?.contains("location") != true {
                log.warn("⚠️ [ExpoGaodeMap] iOS 后台定位未正确配置，setAllowsBackgroundLocationUpdates(true) 可能不会生效，请检查 Info.plist 是否包含 UIBackgroundModes: location，或者在 app.json 中配置 enableBackgroundLocation: true，然后重新执行 npx expo prebuild")
                return
            }
        }
        ensureLocationManager()?.allowsBackgroundLocationUpdates = allows
    }

    func setGeoLanguage(_ language: String) {
        switch language.uppercased() {
        case "ZH":
            ensureLocationManager()?.reGeocodeLanguage = .chinse
        case "EN":
            ensureLocationManager()?.reGeocodeLanguage = .english
        default:
            ensureLocationManager()?.reGeocodeLanguage = .default
        }
    }

    // MARK: - 方向

    func startUpdatingHeading() {
        ensureLocationManager()?.startUpdatingHeading()
    }

    func stopUpdatingHeading() {
        ensureLocationManager()?.stopUpdatingHeading()
    }

    func requestSingleLocation(completion: @escaping (_ location: CLLocation?, _ reGeocode: AMapLocationReGeocode?, _ error: Error?) -> Void) {
        guard let manager = ensureLocationManager() else {
            let error = NSError(
                domain: "ExpoGaodeMap",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "定位管理器未初始化，请先完成隐私协议确认"]
            )
            completion(nil, nil, error)
            return
        }

        manager.requestLocation(
            withReGeocode: manager.locatingWithReGeocode,
            completionBlock: completion
        )
    }

    // MARK: - 初始化

    @discardableResult
    private func ensureLocationManager() -> AMapLocationManager? {
        if let locationManager {
            return locationManager
        }

        guard GaodeMapPrivacyManager.isReady else {
            log.warn("⚠️ [ExpoGaodeMap] iOS 定位模块在隐私同意前不会初始化 AMapLocationManager")
            return nil
        }

        GaodeMapPrivacyManager.applyPrivacyState()

        let manager = AMapLocationManager()
        manager.delegate = self

        // 默认配置
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        manager.distanceFilter = 10
        manager.locationTimeout = 10
        manager.reGeocodeTimeout = 5
        manager.locatingWithReGeocode = true
        manager.pausesLocationUpdatesAutomatically = false

        locationManager = manager
        return manager
    }

    // MARK: - Delegate（连续定位回调）

    func amapLocationManager(_ manager: AMapLocationManager!,
                             didUpdate location: CLLocation!,
                             reGeocode: AMapLocationReGeocode!) {

        guard let location = location else { return }

        var data: [String: Any] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "altitude": location.altitude,
            "heading": location.course,
            "bearing": location.course,
            "speed": location.speed,
            "timestamp": location.timestamp.timeIntervalSince1970 * 1000
        ]

        if let geo = reGeocode {
            data["address"] = geo.formattedAddress
            data["province"] = geo.province
            data["city"] = geo.city
            data["district"] = geo.district
            data["street"] = geo.street
            data["streetNumber"] = geo.number
            data["country"] = geo.country
            data["cityCode"] = geo.citycode
            data["adCode"] = geo.adcode
        }

        let timestamp = location.timestamp.timeIntervalSince1970 * 1000
        if let lastTimestamp = lastLocationEventTimestampMillis,
           locationIntervalMillis > 0,
           timestamp - lastTimestamp < Double(locationIntervalMillis) {
            return
        }

        lastLocationEventTimestampMillis = timestamp
        onLocationUpdate?(data)
    }

    func amapLocationManager(_ manager: AMapLocationManager!, didUpdate heading: CLHeading!) {
        let headingData: [String: Any] = [
            "magneticHeading": heading.magneticHeading,
            "trueHeading": heading.trueHeading,
            "headingAccuracy": heading.headingAccuracy,
            "x": heading.x,
            "y": heading.y,
            "z": heading.z,
            "timestamp": heading.timestamp.timeIntervalSince1970 * 1000
        ]
        onHeadingUpdate?(headingData)
    }

    func amapLocationManager(_ manager: AMapLocationManager!, didFailWithError error: Error!) {
        // 定位失败 - 静默处理（连续定位会自动重试）
    }

    // MARK: - 工具方法

    /**
     * 坐标转换
     * @param coordinate 原始坐标
     * @param type 坐标类型 (0: GPS/Google, 1: MapBar, 2: Baidu, 3: MapABC/SoSo)
     * @param promise Promise
     */
    func coordinateConvert(_ coordinate: [String: Double], type: Int, promise: Promise) {
        guard GaodeMapPrivacyManager.isReady else {
            promise.reject("PRIVACY_NOT_AGREED", "隐私协议未完成确认，请先调用 setPrivacyConfig")
            return
        }

        guard let lat = coordinate["latitude"],
              let lon = coordinate["longitude"] else {
            promise.reject("INVALID_ARGUMENT", "Invalid coordinate")
            return
        }
        
        let coord = CLLocationCoordinate2D(latitude: lat, longitude: lon)
        var amapType: AMapCoordinateType
        
        // 根据文档映射
        switch type {
        case 0: amapType = AMapCoordinateType.GPS
        case 1: amapType = AMapCoordinateType.mapBar
        case 2: amapType = AMapCoordinateType.baidu
        case 3: amapType = AMapCoordinateType.mapABC
        default: amapType = AMapCoordinateType.GPS
        }
        
        let converted = AMapCoordinateConvert(coord, amapType)
        
        promise.resolve([
            "latitude": converted.latitude,
            "longitude": converted.longitude
        ])
    }

    // MARK: - 销毁
    func destroy() {
        locationManager?.stopUpdatingLocation()
        locationManager?.stopUpdatingHeading()
        locationManager?.delegate = nil
        locationManager = nil
        onLocationUpdate = nil
        onHeadingUpdate = nil
        lastLocationEventTimestampMillis = nil
    }
}
