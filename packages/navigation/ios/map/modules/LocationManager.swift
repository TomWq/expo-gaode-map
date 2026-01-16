import Foundation
import AMapLocationKit
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
    /// 高德定位管理器实例
    var locationManager: AMapLocationManager?
    /// 定位是否已启动
    private var isLocationStarted = false
    /// 定位更新回调
    var onLocationUpdate: (([String: Any]) -> Void)?
    /// 方向更新回调
    var onHeadingUpdate: (([String: Any]) -> Void)?
    
    override init() {
        super.init()
        initLocationManager()
    }
    
    // MARK: - 定位控制
    
    /**
     * 开始连续定位
     */
    func start() {
        locationManager?.startUpdatingLocation()
        isLocationStarted = true
    }
    
    /**
     * 停止定位
     */
    func stop() {
        locationManager?.stopUpdatingLocation()
        isLocationStarted = false
    }
    
    /**
     * 检查定位是否已启动
     * @return 是否正在定位
     */
    func isStarted() -> Bool {
        return isLocationStarted
    }
    
    // MARK: - 定位配置
    
    /**
     * 设置是否返回逆地理信息
     * @param isReGeocode 是否返回逆地理信息
     */
    func setLocatingWithReGeocode(_ isReGeocode: Bool) {
        locationManager?.locatingWithReGeocode = isReGeocode
    }
    
    /**
     * 设置定位距离过滤器(米)
     * @param distance 最小距离变化才触发定位更新
     */
    func setDistanceFilter(_ distance: Double) {
        locationManager?.distanceFilter = distance
    }
    
    /**
     * 设置定位超时时间(秒)
     * @param timeout 超时时间
     */
    func setLocationTimeout(_ timeout: Int) {
        locationManager?.locationTimeout = timeout
    }
    
    /**
     * 设置逆地理超时时间(秒)
     * @param timeout 超时时间
     */
    func setReGeocodeTimeout(_ timeout: Int) {
        locationManager?.reGeocodeTimeout = timeout
    }
    
    /**
     * 设置定位精度
     * @param accuracy 精度级别
     *   - 0: 最适合导航
     *   - 1: 最佳精度
     *   - 2: 10米精度
     *   - 3: 100米精度
     *   - 4: 1公里精度
     *   - 5: 3公里精度
     */
    func setDesiredAccuracy(_ accuracy: Int) {
        let accuracyValue: CLLocationAccuracy
        switch accuracy {
        case 0: accuracyValue = kCLLocationAccuracyBestForNavigation
        case 1: accuracyValue = kCLLocationAccuracyBest
        case 2: accuracyValue = kCLLocationAccuracyNearestTenMeters
        case 3: accuracyValue = kCLLocationAccuracyHundredMeters
        case 4: accuracyValue = kCLLocationAccuracyKilometer
        case 5: accuracyValue = kCLLocationAccuracyThreeKilometers
        default: accuracyValue = kCLLocationAccuracyBest
        }
        locationManager?.desiredAccuracy = accuracyValue
    }
    
    /**
     * 设置是否自动暂停定位更新
     * @param pauses 是否自动暂停
     */
    func setPausesLocationUpdatesAutomatically(_ pauses: Bool) {
        locationManager?.pausesLocationUpdatesAutomatically = pauses
    }
    
    /**
     * 设置是否允许后台定位
     * @param allows 是否允许后台定位
     */
    func setAllowsBackgroundLocationUpdates(_ allows: Bool) {
        if allows {
            let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String]
            if backgroundModes?.contains("location") != true {
                log.warn("⚠️ [ExpoGaodeMap] iOS 后台定位未正确配置，setAllowsBackgroundLocationUpdates(true) 可能不会生效，请检查 Info.plist 是否包含 UIBackgroundModes: location，或者在 app.json 中配置 enableBackgroundLocation: true，然后重新执行 npx expo prebuild")
                return
            }
        }
        locationManager?.allowsBackgroundLocationUpdates = allows
    }
    
    /**
     * 设置逆地理语言
     * @param language 语言类型
     *   - 0: 默认
     *   - 1: 中文
     *   - 2: 英文
     */
    func setGeoLanguage(_ language: Int) {
        switch language {
        case 0: locationManager?.reGeocodeLanguage = .default
        case 1: locationManager?.reGeocodeLanguage = .chinse
        case 2: locationManager?.reGeocodeLanguage = .english
        default: break
        }
    }
    
    // MARK: - 方向传感器
    
    /**
     * 开始更新设备方向
     */
    func startUpdatingHeading() {
        locationManager?.startUpdatingHeading()
    }
    
    /**
     * 停止更新设备方向
     */
    func stopUpdatingHeading() {
        locationManager?.stopUpdatingHeading()
    }
    
    // MARK: - 生命周期
    
    /**
     * 销毁定位管理器
     */
    func destroy() {
        locationManager?.stopUpdatingLocation()
        locationManager?.stopUpdatingHeading()
        locationManager?.delegate = nil
        locationManager = nil
        onLocationUpdate = nil
        onHeadingUpdate = nil
    }
    
    /**
     * 初始化定位管理器
     */
    private func initLocationManager() {
        locationManager = AMapLocationManager()
        locationManager?.delegate = self
        // 推荐配置：百米精度，快速定位
        locationManager?.desiredAccuracy = kCLLocationAccuracyHundredMeters
        locationManager?.distanceFilter = 10
        // 增加超时时间，避免首次授权时超时(首次定位建议10秒以上)
        locationManager?.locationTimeout = 10  // 10秒超时
        locationManager?.reGeocodeTimeout = 5   // 5秒超时
        locationManager?.locatingWithReGeocode = true
        
        // iOS 9 之前:防止后台被系统挂起(默认关闭,用户可通过 setPausesLocationUpdatesAutomatically 配置)
        locationManager?.pausesLocationUpdatesAutomatically = false
    }
    
    // MARK: - AMapLocationManagerDelegate
    
    /**
     * 定位更新回调
     * @param manager 定位管理器
     * @param location 位置信息
     * @param reGeocode 逆地理信息
     */
    func amapLocationManager(_ manager: AMapLocationManager!, didUpdate location: CLLocation!, reGeocode: AMapLocationReGeocode!) {
        // 🔑 坐标验证：防止无效坐标
        guard location.coordinate.latitude >= -90 && location.coordinate.latitude <= 90,
              location.coordinate.longitude >= -180 && location.coordinate.longitude <= 180 else {
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
        
        // 添加逆地理信息
        if let reGeocode = reGeocode {
            locationData["address"] = reGeocode.formattedAddress
            locationData["province"] = reGeocode.province
            locationData["city"] = reGeocode.city
            locationData["district"] = reGeocode.district
            locationData["street"] = reGeocode.street
            locationData["streetNumber"] = reGeocode.number
            locationData["country"] = reGeocode.country
            locationData["cityCode"] = reGeocode.citycode
            locationData["adCode"] = reGeocode.adcode
        }
        
        onLocationUpdate?(locationData)
    }
    
    /**
     * 方向更新回调
     * @param manager 定位管理器
     * @param heading 方向信息
     */
    func amapLocationManager(_ manager: AMapLocationManager!, didUpdate heading: CLHeading!) {
        let headingData: [String: Any] = [
            "heading": heading.trueHeading,
            "accuracy": heading.headingAccuracy,
            "timestamp": heading.timestamp.timeIntervalSince1970 * 1000
        ]
        onHeadingUpdate?(headingData)
    }
    
    /**
     * 需要定位权限回调
     * @param manager 定位管理器
     * @param locationManager 系统定位管理器
     */
    func amapLocationManager(_ manager: AMapLocationManager!, doRequireLocationAuth locationManager: CLLocationManager!) {
        locationManager.requestAlwaysAuthorization()
    }
    
    /**
     * 定位失败回调
     * @param manager 定位管理器
     * @param error 错误信息
     */
    func amapLocationManager(_ manager: AMapLocationManager!, didFailWithError error: Error!) {
        // 定位失败 - 静默处理
    }
}
