import Foundation
import CoreLocation

// SDK boundary double. Model only the documented per-manager request/start/stop
// contract; these tests do not run AMap's SDK, GPS, or reverse geocoding.
public protocol AMapLocationManagerDelegate: AnyObject {}
public enum AMapLocationAccuracyMode { case reduceAccuracy, fullAccuracy }
public class AMapLocationReGeocode: NSObject {
    public var formattedAddress: String?
    public var province: String?
    public var city: String?
    public var district: String?
    public var street: String?
    public var number: String?
    public var country: String?
    public var citycode: String?
    public var adcode: String?
}

public class AMapLocationManager: NSObject {
    public typealias Completion = (CLLocation?, AMapLocationReGeocode?, Error?) -> Void
    public static var instances: [AMapLocationManager] = []
    public static var rejectNextRequest = false
    public static var completeNextRequestSynchronously = false
    public weak var delegate: AMapLocationManagerDelegate?
    public var locationAccuracyMode: AMapLocationAccuracyMode = .fullAccuracy
    public var desiredAccuracy: CLLocationAccuracy = 100
    public var distanceFilter: Double = 10
    public var locationTimeout = 10
    public var reGeocodeTimeout = 5
    public var locatingWithReGeocode = true
    public var pausesLocationUpdatesAutomatically = false
    public var allowsBackgroundLocationUpdates = false
    public var detectRiskOfFakeLocation = false
    @objc public var reGeocodeLanguage = 0
    public private(set) var updating = false
    public private(set) var requestedReGeocode: Bool?
    private var callbacks: [Completion] = []

    public override init() {
        super.init()
        Self.instances.append(self)
    }

    public func startUpdatingLocation() {
        cancel()
        updating = true
    }

    public func stopUpdatingLocation() {
        updating = false
        cancel()
    }

    private func cancel() {
        let pending = callbacks
        callbacks.removeAll()
        let error = NSError(domain: "AMapLocationErrorDomain", code: 5,
                            userInfo: [NSLocalizedDescriptionKey: "Request cancelled"])
        pending.forEach { $0(nil, nil, error) }
    }

    public func requestLocation(withReGeocode: Bool, completionBlock: @escaping Completion) -> Bool {
        if Self.rejectNextRequest {
            Self.rejectNextRequest = false
            return false // No completion when the SDK refuses to add a request.
        }
        guard !updating else { return false }
        requestedReGeocode = withReGeocode
        callbacks.append(completionBlock)
        if Self.completeNextRequestSynchronously {
            Self.completeNextRequestSynchronously = false
            // Leave the callback registered until after delivery, so stopping in
            // the completion exercises a synchronous cancellation callback too.
            completionBlock(CLLocation(latitude: 1, longitude: 2), nil, nil)
            callbacks.removeAll()
        }
        return true
    }

    public func captureCompletion() -> Completion? { callbacks.first }

    public func complete() {
        let pending = callbacks
        callbacks.removeAll()
        pending.forEach { $0(CLLocation(latitude: 1, longitude: 2), nil, nil) }
    }

    public func startUpdatingHeading() {}
    public func stopUpdatingHeading() {}
}
