import Foundation

#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.1, *)
public struct NavigationLiveActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public var currentRoadName: String
    public var nextRoadName: String
    public var pathRetainDistance: Int
    public var routeTotalDistance: Int
    public var pathRetainTime: Int
    public var curStepRetainDistance: Int
    public var iconType: Int
    public var turnIconBase64: String?
    public var updatedAt: Date

    public init(
      currentRoadName: String,
      nextRoadName: String,
      pathRetainDistance: Int,
      routeTotalDistance: Int,
      pathRetainTime: Int,
      curStepRetainDistance: Int,
      iconType: Int,
      turnIconBase64: String? = nil,
      updatedAt: Date
    ) {
      self.currentRoadName = currentRoadName
      self.nextRoadName = nextRoadName
      self.pathRetainDistance = pathRetainDistance
      self.routeTotalDistance = routeTotalDistance
      self.pathRetainTime = pathRetainTime
      self.curStepRetainDistance = curStepRetainDistance
      self.iconType = iconType
      self.turnIconBase64 = turnIconBase64
      self.updatedAt = updatedAt
    }
  }

  public var appName: String

  public init(appName: String) {
    self.appName = appName
  }
}
#endif
