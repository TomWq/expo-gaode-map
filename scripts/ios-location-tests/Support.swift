import Foundation

struct TestLogger { func warn(_ value: String) {} }
let log = TestLogger()
enum GaodeMapPrivacyManager {
    static var isReady = true
    static func applyPrivacyState() {}
}
