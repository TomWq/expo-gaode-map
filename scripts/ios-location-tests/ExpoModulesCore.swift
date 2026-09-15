import Foundation

// Minimal Expo boundary for compiling the real LocationManager on macOS.
open class Exception: Error, @unchecked Sendable {
    public init() {}
    open var code: String { "ERR_EXCEPTION" }
    open var reason: String { "undefined reason" }
    public var description: String { reason }
    public var debugDescription: String { "\(code): \(reason)" }
}

public class Promise {
    public func resolve(_ value: Any) {}
    public func reject(_ code: String, _ description: String) {}
}
