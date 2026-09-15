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
    private var reGeocodeLanguage: Int?
    private var isDestroyed = false
    private typealias LocationCompletion = (CLLocation?, AMapLocationReGeocode?, Error?) -> Void
    private struct SingleLocationRequest {
        let manager: AMapLocationManager
        let completion: LocationCompletion
    }
    // Single requests are owned separately: AMap start/stop cancels requests on that manager.
    // All access to this collection is confined to the main queue.
    private var singleLocationRequests: [UUID: SingleLocationRequest] = [:]

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

    private func setReGeocodeLanguage(_ rawValue: Int) {
        reGeocodeLanguage = rawValue
        ensureLocationManager()?.setValue(rawValue, forKey: "reGeocodeLanguage")
    }

    func setGeoLanguage(_ language: String) {
        switch language.uppercased() {
        case "ZH":
            setReGeocodeLanguage(0)
        case "EN":
            setReGeocodeLanguage(2)
        default:
            setReGeocodeLanguage(0)
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
        onMain {
            self.beginSingleLocation(completion: completion)
        }
    }

    private func beginSingleLocation(completion: @escaping LocationCompletion) {
        guard !isDestroyed, let configuration = ensureLocationManager() else {
            let error = NSError(
                domain: "ExpoGaodeMap",
                code: -1,
                userInfo: [NSLocalizedDescriptionKey: "定位管理器不可用，请确认模块及隐私状态"]
            )
            completion(nil, nil, error)
            return
        }

        let manager = AMapLocationManager()
        manager.locationAccuracyMode = configuration.locationAccuracyMode
        manager.desiredAccuracy = configuration.desiredAccuracy
        manager.distanceFilter = configuration.distanceFilter
        manager.locationTimeout = configuration.locationTimeout
        manager.reGeocodeTimeout = configuration.reGeocodeTimeout
        manager.locatingWithReGeocode = configuration.locatingWithReGeocode
        manager.pausesLocationUpdatesAutomatically = configuration.pausesLocationUpdatesAutomatically
        manager.allowsBackgroundLocationUpdates = configuration.allowsBackgroundLocationUpdates
        manager.detectRiskOfFakeLocation = configuration.detectRiskOfFakeLocation
        if let reGeocodeLanguage {
            manager.setValue(reGeocodeLanguage, forKey: "reGeocodeLanguage")
        }

        let requestId = UUID()
        singleLocationRequests[requestId] = SingleLocationRequest(manager: manager, completion: completion)
        let accepted = manager.requestLocation(
            withReGeocode: manager.locatingWithReGeocode,
            completionBlock: { [weak self] location, reGeocode, error in
                self?.onMain {
                    self?.finishSingleLocation(requestId, location: location, reGeocode: reGeocode, error: error)
                }
            }
        )
        if !accepted {
            finishSingleLocation(requestId, location: nil, reGeocode: nil, error: NSError(
                domain: "ExpoGaodeMap",
                code: -2,
                userInfo: [NSLocalizedDescriptionKey: "定位请求未被 SDK 接受"]
            ))
        }
    }

    private func finishSingleLocation(_ requestId: UUID, location: CLLocation?, reGeocode: AMapLocationReGeocode?, error: Error?) {
        guard let request = singleLocationRequests.removeValue(forKey: requestId) else { return }
        // Retire ownership before stopping: stop may synchronously invoke a cancellation callback.
        request.manager.stopUpdatingLocation()
        request.manager.delegate = nil
        request.completion(location, reGeocode, error)
    }

    private func onMain(_ action: @escaping () -> Void) {
        if Thread.isMainThread {
            action()
        } else {
            DispatchQueue.main.async(execute: action)
        }
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
        if #available(iOS 14.0, *) {
            // Continue with the user's current precision instead of requiring full accuracy.
            manager.locationAccuracyMode = .reduceAccuracy
        }
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

        if #available(iOS 15.0, *) {
            if let sourceInformation = location.sourceInformation {
                data["isSimulatedBySoftware"] = sourceInformation.isSimulatedBySoftware
                data["isProducedByAccessory"] = sourceInformation.isProducedByAccessory
            }
        }

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
        log.warn("[ExpoGaodeMap] iOS continuous location failed: \(error.localizedDescription)")
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
        onMain {
            self.isDestroyed = true
            let error = NSError(domain: "ExpoGaodeMap", code: -3,
                                userInfo: [NSLocalizedDescriptionKey: "定位模块已销毁，请求已取消"])
            for requestId in Array(self.singleLocationRequests.keys) {
                self.finishSingleLocation(requestId, location: nil, reGeocode: nil, error: error)
            }
            self.locationManager?.stopUpdatingLocation()
            self.locationManager?.stopUpdatingHeading()
            self.locationManager?.delegate = nil
            self.locationManager = nil
            self.isLocationStarted = false
            self.onLocationUpdate = nil
            self.onHeadingUpdate = nil
            self.lastLocationEventTimestampMillis = nil
        }
    }
}

// Keep the native details in both Expo description and debugDescription.
// Expo SDK 57 formats debug errors using reason, not the description initializer argument.
final class LocationRequestException: Exception, @unchecked Sendable {
    private let nativeError: NSError

    init(_ error: Error) {
        nativeError = error as NSError
        super.init()
    }

    override var code: String { "LOCATION_ERROR" }
    override var reason: String {
        "定位失败（\(nativeError.domain):\(nativeError.code)）：\(nativeError.localizedDescription)"
    }
}
