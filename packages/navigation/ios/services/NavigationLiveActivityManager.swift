import Foundation
import UIKit

#if canImport(ActivityKit)
import ActivityKit
#endif

struct NavigationLiveActivitySnapshot {
  let appName: String
  let currentRoadName: String
  let nextRoadName: String
  let pathRetainDistance: Int
  let routeTotalDistance: Int
  let pathRetainTime: Int
  let curStepRetainDistance: Int
  let iconType: Int
  let turnIconBase64: String?
}

final class NavigationLiveActivityManager {
  static let shared = NavigationLiveActivityManager()

  private var currentActivityId: String?
  private var hasLoggedMissingPlistSupport = false
  private var hasLoggedSystemDisabled = false
  private var lastSnapshot: NavigationLiveActivitySnapshot?
  private var autoStopWorkItem: DispatchWorkItem?
  private var delayedStopWorkItem: DispatchWorkItem?
  private let staleTimeoutSeconds: TimeInterval = 45
  private let maxEstimatedContentStateBytes = 3900
  private let maxRoadNameCharacters = 22
  private let maxAppNameCharacters = 18

  private init() {}

  func startOrUpdate(snapshot: NavigationLiveActivitySnapshot) {
#if canImport(ActivityKit)
    guard #available(iOS 16.1, *) else {
      return
    }

    guard supportsLiveActivityByPlist() else {
      return
    }

    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      if !hasLoggedSystemDisabled {
        hasLoggedSystemDisabled = true
        NSLog("[ExpoGaodeMapNaviView][LiveActivity] Activities are disabled by system settings")
      }
      return
    }
    hasLoggedSystemDisabled = false

    let normalizedSnapshot = NavigationLiveActivitySnapshot(
      appName: snapshot.appName,
      currentRoadName: snapshot.currentRoadName,
      nextRoadName: snapshot.nextRoadName,
      pathRetainDistance: max(snapshot.pathRetainDistance, 0),
      routeTotalDistance: max(snapshot.routeTotalDistance, 0),
      pathRetainTime: max(snapshot.pathRetainTime, 0),
      curStepRetainDistance: max(snapshot.curStepRetainDistance, 0),
      iconType: snapshot.iconType,
      turnIconBase64: snapshot.turnIconBase64
    )

    let payloadSafeSnapshot = snapshotForPayloadBudget(from: normalizedSnapshot)
    let contentState = makeContentState(from: payloadSafeSnapshot)
    let attributes = NavigationLiveActivityAttributes(appName: payloadSafeSnapshot.appName)

    if let activity = resolveCurrentActivity() {
      lastSnapshot = payloadSafeSnapshot
      Task {
        if #available(iOS 16.2, *) {
          let content = ActivityContent(state: contentState, staleDate: nil)
          await activity.update(content)
        } else {
          await activity.update(using: contentState)
        }
      }
      scheduleAutoStop()
      return
    }

    do {
      let activity: Activity<NavigationLiveActivityAttributes>
      if #available(iOS 16.2, *) {
        let content = ActivityContent(state: contentState, staleDate: nil)
        activity = try Activity.request(attributes: attributes, content: content, pushType: nil)
      } else {
        activity = try Activity.request(attributes: attributes, contentState: contentState, pushType: nil)
      }
      currentActivityId = activity.id
      lastSnapshot = payloadSafeSnapshot
      scheduleAutoStop()
    } catch {
      NSLog("[ExpoGaodeMapNaviView][LiveActivity] request failed: \(error.localizedDescription)")
    }
#endif
  }

  func stop() {
#if canImport(ActivityKit)
    cancelAutoStop()
    cancelDelayedStop()

    guard #available(iOS 16.1, *) else {
      return
    }

    guard let activity = resolveCurrentActivity() else {
      currentActivityId = nil
      return
    }

    let fallbackSnapshot = lastSnapshot ?? NavigationLiveActivitySnapshot(
      appName: "",
      currentRoadName: "",
      nextRoadName: "",
      pathRetainDistance: 0,
      routeTotalDistance: 0,
      pathRetainTime: 0,
      curStepRetainDistance: 0,
      iconType: 0,
      turnIconBase64: nil
    )
    let fallback = NavigationLiveActivityAttributes.ContentState(
      currentRoadName: fallbackSnapshot.currentRoadName,
      nextRoadName: fallbackSnapshot.nextRoadName,
      pathRetainDistance: fallbackSnapshot.pathRetainDistance,
      routeTotalDistance: fallbackSnapshot.routeTotalDistance,
      pathRetainTime: fallbackSnapshot.pathRetainTime,
      curStepRetainDistance: fallbackSnapshot.curStepRetainDistance,
      iconType: fallbackSnapshot.iconType,
      turnIconBase64: fallbackSnapshot.turnIconBase64,
      updatedAt: Date()
    )

    Task {
      if #available(iOS 16.2, *) {
        let content = ActivityContent(state: fallback, staleDate: nil)
        await activity.end(content, dismissalPolicy: .immediate)
      } else {
        await activity.end(using: fallback, dismissalPolicy: .immediate)
      }
    }

    currentActivityId = nil
    lastSnapshot = nil
#endif
  }

  func showArrivedAndStop(snapshot: NavigationLiveActivitySnapshot, dismissAfter seconds: TimeInterval = 6) {
#if canImport(ActivityKit)
    guard #available(iOS 16.1, *) else {
      return
    }

    guard let activity = resolveCurrentActivity() else {
      return
    }

    cancelAutoStop()
    cancelDelayedStop()

    let normalized = NavigationLiveActivitySnapshot(
      appName: snapshot.appName,
      currentRoadName: "",
      nextRoadName: "",
      pathRetainDistance: 0,
      routeTotalDistance: max(snapshot.routeTotalDistance, 0),
      pathRetainTime: 0,
      curStepRetainDistance: 0,
      iconType: 15,
      turnIconBase64: nil
    )
    let payloadSafeSnapshot = snapshotForPayloadBudget(from: normalized)
    let contentState = makeContentState(from: payloadSafeSnapshot)
    lastSnapshot = payloadSafeSnapshot

    Task {
      if #available(iOS 16.2, *) {
        let content = ActivityContent(state: contentState, staleDate: nil)
        await activity.update(content)
      } else {
        await activity.update(using: contentState)
      }
    }

    let delay = max(seconds, 1)
    let workItem = DispatchWorkItem { [weak self] in
      guard let self else {
        return
      }
      NSLog(
        "[ExpoGaodeMapNaviView][LiveActivity] arrived destination card displayed for %.0fs, stopping activity",
        delay
      )
      self.stop()
    }
    delayedStopWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: workItem)
#endif
  }

  private func scheduleAutoStop() {
    cancelAutoStop()
    let workItem = DispatchWorkItem { [weak self] in
      guard let self else {
        return
      }
      NSLog(
        "[ExpoGaodeMapNaviView][LiveActivity] no updates for %.0fs, auto stopping activity",
        self.staleTimeoutSeconds
      )
      self.stop()
    }
    autoStopWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + staleTimeoutSeconds, execute: workItem)
  }

  private func cancelAutoStop() {
    autoStopWorkItem?.cancel()
    autoStopWorkItem = nil
  }

  private func cancelDelayedStop() {
    delayedStopWorkItem?.cancel()
    delayedStopWorkItem = nil
  }

  private func supportsLiveActivityByPlist() -> Bool {
    let enabled = (Bundle.main.object(forInfoDictionaryKey: "NSSupportsLiveActivities") as? Bool) == true
    if !enabled && !hasLoggedMissingPlistSupport {
      hasLoggedMissingPlistSupport = true
      NSLog("[ExpoGaodeMapNaviView][LiveActivity] NSSupportsLiveActivities is not enabled in Info.plist")
    }
    return enabled
  }

#if canImport(ActivityKit)
  @available(iOS 16.1, *)
  private func makeContentState(from snapshot: NavigationLiveActivitySnapshot) -> NavigationLiveActivityAttributes.ContentState {
    NavigationLiveActivityAttributes.ContentState(
      currentRoadName: snapshot.currentRoadName,
      nextRoadName: snapshot.nextRoadName,
      pathRetainDistance: snapshot.pathRetainDistance,
      routeTotalDistance: snapshot.routeTotalDistance,
      pathRetainTime: snapshot.pathRetainTime,
      curStepRetainDistance: snapshot.curStepRetainDistance,
      iconType: snapshot.iconType,
      turnIconBase64: snapshot.turnIconBase64,
      updatedAt: Date()
    )
  }

  @available(iOS 16.1, *)
  private func estimateContentStateSizeBytes(snapshot: NavigationLiveActivitySnapshot) -> Int {
    let state = makeContentState(from: snapshot)
    guard let encoded = try? JSONEncoder().encode(state) else {
      return Int.max
    }
    return encoded.count
  }

  private func truncateCharacters(_ value: String, maxCharacters: Int) -> String {
    guard maxCharacters > 0, value.count > maxCharacters else {
      return value
    }
    return String(value.prefix(maxCharacters))
  }

  @available(iOS 16.1, *)
  private func snapshotForPayloadBudget(from snapshot: NavigationLiveActivitySnapshot) -> NavigationLiveActivitySnapshot {
    let originalEstimated = estimateContentStateSizeBytes(snapshot: snapshot)
    var candidate = snapshot
    var estimated = originalEstimated
    if estimated <= maxEstimatedContentStateBytes {
      return candidate
    }

    // Keep turn icon as long as possible; trim text first.
    candidate = NavigationLiveActivitySnapshot(
      appName: truncateCharacters(candidate.appName, maxCharacters: maxAppNameCharacters),
      currentRoadName: truncateCharacters(candidate.currentRoadName, maxCharacters: maxRoadNameCharacters),
      nextRoadName: truncateCharacters(candidate.nextRoadName, maxCharacters: maxRoadNameCharacters),
      pathRetainDistance: candidate.pathRetainDistance,
      routeTotalDistance: candidate.routeTotalDistance,
      pathRetainTime: candidate.pathRetainTime,
      curStepRetainDistance: candidate.curStepRetainDistance,
      iconType: candidate.iconType,
      turnIconBase64: candidate.turnIconBase64
    )
    estimated = estimateContentStateSizeBytes(snapshot: candidate)
    if estimated <= maxEstimatedContentStateBytes {
      NSLog(
        "[ExpoGaodeMapNaviView][LiveActivity] payload %dB exceeds budget, trimmed text to %dB while keeping turn icon",
        originalEstimated,
        estimated
      )
      return candidate
    }

    let strippedText = NavigationLiveActivitySnapshot(
      appName: truncateCharacters(candidate.appName, maxCharacters: maxAppNameCharacters),
      currentRoadName: "",
      nextRoadName: "",
      pathRetainDistance: candidate.pathRetainDistance,
      routeTotalDistance: candidate.routeTotalDistance,
      pathRetainTime: candidate.pathRetainTime,
      curStepRetainDistance: candidate.curStepRetainDistance,
      iconType: candidate.iconType,
      turnIconBase64: candidate.turnIconBase64
    )
    let strippedTextEstimated = estimateContentStateSizeBytes(snapshot: strippedText)
    if strippedTextEstimated <= maxEstimatedContentStateBytes {
      NSLog(
        "[ExpoGaodeMapNaviView][LiveActivity] payload %dB exceeds budget, cleared road text to %dB while keeping turn icon",
        originalEstimated,
        strippedTextEstimated
      )
      return strippedText
    }

    let droppedIcon = NavigationLiveActivitySnapshot(
      appName: strippedText.appName,
      currentRoadName: strippedText.currentRoadName,
      nextRoadName: strippedText.nextRoadName,
      pathRetainDistance: strippedText.pathRetainDistance,
      routeTotalDistance: strippedText.routeTotalDistance,
      pathRetainTime: strippedText.pathRetainTime,
      curStepRetainDistance: strippedText.curStepRetainDistance,
      iconType: strippedText.iconType,
      turnIconBase64: nil
    )
    let droppedIconEstimated = estimateContentStateSizeBytes(snapshot: droppedIcon)
    NSLog(
      "[ExpoGaodeMapNaviView][LiveActivity] payload still too large after text trim (%dB), dropped turn icon to %dB",
      strippedTextEstimated,
      droppedIconEstimated
    )
    return droppedIcon
  }
#endif

#if canImport(ActivityKit)
  @available(iOS 16.1, *)
  private func resolveCurrentActivity() -> Activity<NavigationLiveActivityAttributes>? {
    if let id = currentActivityId,
       let matched = Activity<NavigationLiveActivityAttributes>.activities.first(where: { $0.id == id }) {
      return matched
    }

    let first = Activity<NavigationLiveActivityAttributes>.activities.first
    currentActivityId = first?.id
    return first
  }
#endif
}
