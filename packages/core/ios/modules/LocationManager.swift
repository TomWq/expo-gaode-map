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

    // --- 一次定位状态管理 ---
    private var onceSuccess: (([String: Any]) -> Void)?
    private var onceError: ((String, String) -> Void)?
    private var isTempStartForOnce = false
    

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

    // MARK: - 一次定位（给 Module 层的 getCurrentLocation 调用）

    func requestSingleLocation(
        onSuccess: @escaping ([String: Any]) -> Void,
        onError: @escaping (String, String) -> Void
    ) {
        // 若上一次未完成，先拒绝掉
        if onceSuccess != nil || onceError != nil {
            onceError?("LOCATION_CANCELLED", "Previous request was interrupted")
        }

        onceSuccess = onSuccess
        onceError = onError

        // 如果连续定位已开启 → 等下一次 update
        if isLocationStarted {
            scheduleTimeout()
            return
        }

        // 否则临时启动定位
        isTempStartForOnce = true
        start()
        scheduleTimeout()
    }

    private func scheduleTimeout() {
        DispatchQueue.main.asyncAfter(deadline: .now() + 4) { [weak self] in
            guard let self = self else { return }

            if let error = self.onceError {
                error("LOCATION_TIMEOUT", "getCurrentLocation timeout")
                self.onceSuccess = nil
                self.onceError = nil

                if self.isTempStartForOnce {
                    self.stop()
                    self.isTempStartForOnce = false
                }
            }
        }
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

    // MARK: - Delegate（一次定位 + 连续定位统一出口）

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

        // --- 一次定位优先 ---
        if let success = onceSuccess {
            success(data)
            onceSuccess = nil
            onceError = nil

            if isTempStartForOnce {
                stop()
                isTempStartForOnce = false
            }
            return
        }

        // --- 连续定位 ---
        onLocationUpdate?(data)
    }

    func amapLocationManager(_ manager: AMapLocationManager!, didFailWithError error: Error!) {

        if let onError = onceError {
            onError("LOCATION_ERROR", error.localizedDescription)

            onceSuccess = nil
            onceError = nil

            if isTempStartForOnce {
                stop()
                isTempStartForOnce = false
            }
        }
    }

    // MARK: - 销毁
    func destroy() {
        locationManager?.stopUpdatingLocation()
        locationManager?.stopUpdatingHeading()
        locationManager?.delegate = nil
        locationManager = nil

        onceSuccess = nil
        onceError = nil
        onLocationUpdate = nil
        onHeadingUpdate = nil
    }
}
