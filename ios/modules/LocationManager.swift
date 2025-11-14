import Foundation
import AMapLocationKit
import CoreLocation

class LocationManager: NSObject, AMapLocationManagerDelegate {
    var locationManager: AMapLocationManager?
    private var isLocationStarted = false
    var onLocationUpdate: (([String: Any]) -> Void)?
    var onHeadingUpdate: (([String: Any]) -> Void)?
    
    override init() {
        super.init()
        initLocationManager()
    }
    
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
    
    
    func startUpdatingHeading() {
        locationManager?.startUpdatingHeading()
    }
    
    func stopUpdatingHeading() {
        locationManager?.stopUpdatingHeading()
    }
    
    func destroy() {
        locationManager?.stopUpdatingLocation()
        locationManager = nil
    }
    
    private func initLocationManager() {
        locationManager = AMapLocationManager()
        locationManager?.delegate = self
        locationManager?.desiredAccuracy = kCLLocationAccuracyBest
        locationManager?.distanceFilter = 10
        locationManager?.locationTimeout = 2
        locationManager?.reGeocodeTimeout = 2
        locationManager?.locatingWithReGeocode = true
    }
    
    // MARK: - AMapLocationManagerDelegate
    
    func amapLocationManager(_ manager: AMapLocationManager!, didUpdate location: CLLocation!, reGeocode: AMapLocationReGeocode!) {
        var locationData: [String: Any] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "altitude": location.altitude,
            "bearing": location.course,
            "speed": location.speed,
            "timestamp": location.timestamp.timeIntervalSince1970 * 1000
        ]
        
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
    
    func amapLocationManager(_ manager: AMapLocationManager!, didUpdate heading: CLHeading!) {
        let headingData: [String: Any] = [
            "heading": heading.trueHeading,
            "accuracy": heading.headingAccuracy,
            "timestamp": heading.timestamp.timeIntervalSince1970 * 1000
        ]
        onHeadingUpdate?(headingData)
    }
    
    func amapLocationManager(_ manager: AMapLocationManager!, doRequireLocationAuth locationManager: CLLocationManager!) {
        locationManager.requestAlwaysAuthorization()
    }
    
    func amapLocationManager(_ manager: AMapLocationManager!, didFailWithError error: Error!) {
        print("定位失败: \(error.localizedDescription)")
    }
}