import Foundation
import CoreLocation
import AMapLocationKit

struct WeakManager { weak var value: AMapLocationManager? }

var failures: [String] = []
func check(_ value: @autoclosure () -> Bool, _ name: String) {
    if !value() { failures.append(name) }
}

func test(_ name: String, _ body: () -> Void) {
    AMapLocationManager.instances.removeAll()
    AMapLocationManager.rejectNextRequest = false
    AMapLocationManager.completeNextRequestSynchronously = false
    GaodeMapPrivacyManager.isReady = true
    let before = failures.count
    body()
    if before == failures.count { print("PASS: " + name) }
}

// Drain work queued from a background SDK callback before checking its result.
func drainMainQueue() {
    var drained = false
    DispatchQueue.main.async { drained = true }
    let deadline = Date(timeIntervalSinceNow: 2)
    while !drained && Date() < deadline {
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.001))
    }
    check(drained, "main queue must drain")
}

func completeSDKRequests() {
    AMapLocationManager.instances.forEach { $0.complete() }
}

test("one-shot succeeds while continuous location stays active") {
    let owner = LocationManager()
    owner.start()
    let continuous = AMapLocationManager.instances.first!
    var results = 0
    owner.requestSingleLocation { location, _, error in
        if location != nil && error == nil { results += 1 }
    }
    completeSDKRequests()
    check(results == 1, "continuous location must not block a one-shot result")
    check(owner.isStarted() && continuous.updating, "one-shot must preserve continuous updates")
    owner.destroy()
}

test("starting and stopping continuous location preserves pending one-shots") {
    let owner = LocationManager()
    var successes = 0
    var errors = 0
    for _ in 0..<2 {
        owner.requestSingleLocation { location, _, error in
            if location != nil && error == nil { successes += 1 }
            if error != nil { errors += 1 }
        }
    }
    owner.start()
    owner.stop()
    completeSDKRequests()
    check(successes == 2 && errors == 0, "start/stop must not cancel pending one-shots")
    owner.destroy()
}

test("SDK refusal completes once without waiting for a callback or destroy") {
    let owner = LocationManager()
    AMapLocationManager.rejectNextRequest = true
    var completions = 0
    var failure: NSError?
    owner.requestSingleLocation { location, _, error in
        completions += 1
        failure = error as NSError?
        check(location == nil, "refusal must not return a location")
    }
    check(completions == 1 && failure != nil, "refused request must fail immediately")
    owner.destroy()
    check(completions == 1, "refusal must settle only once")
}

test("synchronous completion cannot be settled twice by cancellation") {
    let owner = LocationManager()
    AMapLocationManager.completeNextRequestSynchronously = true
    var completions = 0
    owner.requestSingleLocation { location, _, error in
        completions += 1
        check(location != nil && error == nil, "synchronous success must survive cleanup")
    }
    owner.destroy()
    check(completions == 1, "cleanup must not deliver a second completion")
}

test("destroy settles pending requests once and ignores late background callbacks") {
    let owner = LocationManager()
    var completions = 0
    var cancellations = 0
    var lateCallbacks: [AMapLocationManager.Completion] = []
    for _ in 0..<2 {
        owner.requestSingleLocation { location, _, error in
            completions += 1
            if location == nil && error != nil { cancellations += 1 }
            check(Thread.isMainThread, "completion must run on main queue")
        }
        if let callback = AMapLocationManager.instances.last?.captureCompletion() {
            lateCallbacks.append(callback)
        }
    }
    owner.destroy()
    owner.destroy()
    let done = DispatchSemaphore(value: 0)
    DispatchQueue.global().async {
        for callback in lateCallbacks {
            callback(CLLocation(latitude: 1, longitude: 2), nil, nil)
            callback(nil, nil, NSError(domain: "AMapLocationErrorDomain", code: 5))
        }
        done.signal()
    }
    check(done.wait(timeout: .now() + 2) == .success, "background callbacks must finish")
    drainMainQueue()
    check(completions == 2 && cancellations == 2, "destroy and late callbacks must settle each request once")
    let countBefore = AMapLocationManager.instances.count
    var rejected = false
    owner.requestSingleLocation { location, _, error in rejected = location == nil && error != nil }
    check(rejected, "a destroyed owner must reject new requests")
    check(AMapLocationManager.instances.count == countBefore, "destroyed owner must not create SDK managers")
}

test("successful requests release their SDK manager") {
    let owner = LocationManager()
    owner.requestSingleLocation { _, _, _ in }
    var request: AMapLocationManager? = AMapLocationManager.instances.last!
    let releasedRequest = WeakManager(value: request)
    AMapLocationManager.instances.removeAll { $0 === request }
    request?.complete()
    request = nil
    check(releasedRequest.value == nil, "completed SDK manager must be released before owner destruction")
    owner.destroy()
}

test("one-shot uses configured accuracy, timeouts and geocoding mode") {
    let owner = LocationManager()
    owner.setLocatingWithReGeocode(false)
    owner.setLocationTimeout(19)
    owner.setReGeocodeTimeout(7)
    owner.setDesiredAccuracy(2)
    owner.setDistanceFilter(23)
    owner.setPausesLocationUpdatesAutomatically(true)
    var succeeded = false
    owner.requestSingleLocation { location, _, error in succeeded = location != nil && error == nil }
    let request = AMapLocationManager.instances.last!
    check(request.locationTimeout == 19 && request.reGeocodeTimeout == 7, "request must preserve configured timeouts")
    check(request.desiredAccuracy == kCLLocationAccuracyNearestTenMeters, "request must preserve desired accuracy")
    check(request.locationAccuracyMode == .reduceAccuracy, "request must support reduced accuracy")
    check(request.distanceFilter == 23 && request.pausesLocationUpdatesAutomatically, "request must preserve update settings")
    check(request.requestedReGeocode == false, "coordinate-only request must not enable geocoding")
    request.complete()
    check(succeeded, "configured request must complete")
    owner.destroy()
}

test("privacy rejection does not create a native manager") {
    GaodeMapPrivacyManager.isReady = false
    let owner = LocationManager()
    var rejected = false
    owner.requestSingleLocation { location, _, error in rejected = location == nil && error != nil }
    check(rejected, "privacy rejection must complete with an error")
    check(AMapLocationManager.instances.isEmpty, "privacy rejection must not create an SDK manager")
    owner.destroy()
}

test("native location error details survive both Expo error formats") {
    let native = NSError(domain: "AMapLocationErrorDomain", code: 5,
                         userInfo: [NSLocalizedDescriptionKey: "Request cancelled"])
    let error = LocationRequestException(native)
    check(error.code == "LOCATION_ERROR", "error must preserve the public location error code")
    for message in [error.description, error.debugDescription] {
        check(message.contains("AMapLocationErrorDomain:5"), "error must include native domain and code")
        check(message.contains("Request cancelled"), "error must include the native reason")
        check(!message.contains("undefined reason"), "native error must not become undefined reason")
    }
}

if !failures.isEmpty {
    failures.forEach { print("FAIL: " + $0) }
    exit(1)
}
