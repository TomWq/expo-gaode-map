import Foundation
import AMapLocationKit
import CoreLocation

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

    override init() {
        super.init()
        initLocationManager()
    }

    // MARK: - 连续定位控制

    func start() {
        locationManager?.startUpdatingLocation()
        isLocationStarted = true
    }

    func stop() {
        locationManager?.stopUpdatingLocation()
        isLocationStarted = false
    }

    func isStarted() -> Bool {
        return isLocationStarted
    }

    // MARK: - 高德定位配置 API

    func setLocatingWithReGeocode(_ isReGeocode: Bool) {
        locationManager?.locatingWithReGeocode = isReGeocode
    }

    func setDistanceFilter(_ distance: Double) {
        locationManager?.distanceFilter = distance
    }

    func setLocationTimeout(_ timeout: Int) {
        locationManager?.locationTimeout = timeout
    }

    func setReGeocodeTimeout(_ timeout: Int) {
        locationManager?.reGeocodeTimeout = timeout
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
        locationManager?.desiredAccuracy = value
    }

    func setPausesLocationUpdatesAutomatically(_ pauses: Bool) {
        locationManager?.pausesLocationUpdatesAutomatically = pauses
    }

    func setAllowsBackgroundLocationUpdates(_ allows: Bool) {
        locationManager?.allowsBackgroundLocationUpdates = allows
    }

    func setGeoLanguage(_ language: Int) {
        switch language {
        case 0: locationManager?.reGeocodeLanguage = .default
        case 1: locationManager?.reGeocodeLanguage = .chinse
        case 2: locationManager?.reGeocodeLanguage = .english
        default: break
        }
    }

    // MARK: - 方向

    func startUpdatingHeading() {
        locationManager?.startUpdatingHeading()
    }

    func stopUpdatingHeading() {
        locationManager?.stopUpdatingHeading()
    }

    // MARK: - 初始化

    private func initLocationManager() {
        locationManager = AMapLocationManager()
        locationManager?.delegate = self

        // 默认配置
        locationManager?.desiredAccuracy = kCLLocationAccuracyHundredMeters
        locationManager?.distanceFilter = 10
        locationManager?.locationTimeout = 10
        locationManager?.reGeocodeTimeout = 5
        locationManager?.locatingWithReGeocode = true
        locationManager?.pausesLocationUpdatesAutomatically = false
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

        // 触发连续定位回调
        onLocationUpdate?(data)
    }

    func amapLocationManager(_ manager: AMapLocationManager!, didUpdate heading: CLHeading!) {
        let headingData: [String: Any] = [
            "heading": heading.trueHeading,
            "accuracy": heading.headingAccuracy,
            "timestamp": heading.timestamp.timeIntervalSince1970 * 1000
        ]
        onHeadingUpdate?(headingData)
    }

    func amapLocationManager(_ manager: AMapLocationManager!, didFailWithError error: Error!) {
        // 定位失败 - 静默处理（连续定位会自动重试）
    }

    // MARK: - 销毁
    func destroy() {
        locationManager?.stopUpdatingLocation()
        locationManager?.stopUpdatingHeading()
        locationManager?.delegate = nil
        locationManager = nil
        onLocationUpdate = nil
        onHeadingUpdate = nil
    }
}
