import ActivityKit
import SwiftUI
import UIKit
import WidgetKit

struct NavigationLiveActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var currentRoadName: String
    var nextRoadName: String
    var pathRetainDistance: Int
    var routeTotalDistance: Int?
    var pathRetainTime: Int
    var curStepRetainDistance: Int
    var iconType: Int
    var turnIconBase64: String?
    var updatedAt: Date
  }

  var appName: String
}

private struct TurnMeta {
  let action: String
}

private func turnMeta(for iconType: Int) -> TurnMeta {
  switch iconType {
  case 2:
    return TurnMeta(action: "左转")
  case 3:
    return TurnMeta(action: "右转")
  case 4:
    return TurnMeta(action: "左前方")
  case 5:
    return TurnMeta(action: "右前方")
  case 6:
    return TurnMeta(action: "左后方")
  case 7:
    return TurnMeta(action: "右后方")
  case 8:
    return TurnMeta(action: "左转调头")
  case 9, 20:
    return TurnMeta(action: "直行")
  case 11, 12:
    return TurnMeta(action: "环岛")
  case 15:
    return TurnMeta(action: "到达目的地")
  case 19:
    return TurnMeta(action: "右转调头")
  case 65:
    return TurnMeta(action: "靠左行驶")
  case 66:
    return TurnMeta(action: "靠右行驶")
  default:
    return TurnMeta(action: "继续")
  }
}

private func formatDistanceCN(_ meters: Int, spacedUnit: Bool = false) -> String {
  let safeMeters = max(meters, 0)
  if safeMeters >= 1000 {
    let kilometers = Double(safeMeters) / 1000.0
    let value = kilometers >= 10 ? String(format: "%.0f", kilometers) : String(format: "%.1f", kilometers)
    return spacedUnit ? "\(value) 公里" : "\(value)公里"
  }
  return spacedUnit ? "\(safeMeters) 米" : "\(safeMeters)米"
}

private func formatTimeCN(_ seconds: Int) -> String {
  let safeSeconds = max(seconds, 0)
  if safeSeconds >= 3600 {
    return "约\(safeSeconds / 3600)小时\((safeSeconds % 3600) / 60)分钟"
  }
  return "约\(max(safeSeconds / 60, 1))分钟"
}

private func preferredRoadName(current: String, next: String) -> String {
  if !next.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
    return next.trimmingCharacters(in: .whitespacesAndNewlines)
  }
  if !current.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
    return current.trimmingCharacters(in: .whitespacesAndNewlines)
  }
  return ""
}

private func compactInstruction(distanceMeters: Int, roadName: String, action: String) -> String {
  if distanceMeters > 0 {
    if roadName.isEmpty {
      return "\(formatDistanceCN(distanceMeters))后\(action)"
    }
    return "\(formatDistanceCN(distanceMeters))后进入\(roadName)"
  }

  if !roadName.isEmpty {
    return "进入\(roadName)"
  }
  return "正在导航"
}

private func liveTurnIconImage(base64: String?) -> Image? {
  guard let base64, !base64.isEmpty, let data = Data(base64Encoded: base64) else {
    return nil
  }
  guard let image = UIImage(data: data) else {
    return nil
  }
  return Image(uiImage: image).renderingMode(.original)
}

private let customCarIndicatorBase64 = """
iVBORw0KGgoAAAANSUhEUgAAAGgAAAAyCAYAAACwCZ4wAAAAAXNSR0IArs4c6QAAAHplWElmTU0AKgAAAAgAAwESAAMAAAABAAEAAAExAAIAAAAdAAAAModpAAQAAAABAAAAUAAAAABBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAaKADAAQAAAABAAAAMgAAAABAGMAdAAAEEGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgICAgICAgICAgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8eG1wTU06RG9jdW1lbnRJRD54bXAuZGlkOkREMzlFQ0M5NTMzOTExRTc5ODNGQzk2RDE2MjAxM0ZGPC94bXBNTTpEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06SW5zdGFuY2VJRD54bXAuaWlkOkREMzlFQ0M4NTMzOTExRTc5ODNGQzk2RDE2MjAxM0ZGPC94bXBNTTpJbnN0YW5jZUlEPgogICAgICAgICA8eG1wTU06RGVyaXZlZEZyb20gcmRmOnBhcnNlVHlwZT0iUmVzb3VyY2UiPgogICAgICAgICAgICA8c3RSZWY6aW5zdGFuY2VJRD54bXAuaWlkOkE5N0RCQjQ1Mzg3MzExRTc5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
"""

private func customCarIndicatorImage() -> Image? {
  struct Cache {
    static let image: UIImage? = {
      guard let data = Data(base64Encoded: customCarIndicatorBase64, options: [.ignoreUnknownCharacters]) else {
        return nil
      }
      return UIImage(data: data)
    }()
  }

  guard let image = Cache.image else {
    return nil
  }
  return Image(uiImage: image).renderingMode(.original)
}

private func routeProgress(remainDistance: Int, totalDistance: Int) -> Double {
  guard totalDistance > 0 else {
    return 0
  }
  let safeRemain = min(max(remainDistance, 0), totalDistance)
  let finished = totalDistance - safeRemain
  return min(max(Double(finished) / Double(totalDistance), 0), 1)
}

private func clampedProgress(_ value: Double) -> Double {
  min(max(value, 0), 1)
}

private struct NavigationProgressTrack: View {
  let progress: Double
  var showsIndicator: Bool = true
  var trackHeight: CGFloat = 7

  var body: some View {
    GeometryReader { proxy in
      let width = max(proxy.size.width, 1)
      let normalizedProgress = clampedProgress(progress)
      let carWidth: CGFloat = 34
      let carHeight: CGFloat = 16
      let trackYOffset: CGFloat = showsIndicator ? 5 : 0
      let indicatorOffset = min(max(0, normalizedProgress * max(width - carWidth, 0)), max(width - carWidth, 0))
      let fillWidth = min(width, max(trackHeight, indicatorOffset + (carWidth * 0.45)))

      ZStack(alignment: .leading) {
        Capsule(style: .continuous)
          .fill(Color.white.opacity(0.18))
          .frame(height: trackHeight)
          .offset(y: trackYOffset)

        Capsule(style: .continuous)
          .fill(
            LinearGradient(
              colors: [
                Color(red: 0.32, green: 0.78, blue: 0.98),
                Color(red: 0.24, green: 0.70, blue: 0.98)
              ],
              startPoint: .leading,
              endPoint: .trailing
            )
          )
          .frame(width: fillWidth, height: trackHeight)
          .offset(y: trackYOffset)

        if showsIndicator {
          Group {
            if let customCar = customCarIndicatorImage() {
              ZStack(alignment: .leading) {
                Circle()
                  .fill(Color(red: 0.23, green: 0.78, blue: 0.98))
                  .frame(width: 8, height: 8)
                  .offset(x: -1, y: 2)
                customCar
                  .resizable()
                  .scaledToFit()
                  .frame(width: carWidth, height: carHeight)
              }
            } else {
              ZStack {
                Circle()
                  .fill(
                    LinearGradient(
                      colors: [
                        Color(red: 0.08, green: 0.66, blue: 0.96),
                        Color(red: 0.18, green: 0.80, blue: 0.98)
                      ],
                      startPoint: .topLeading,
                      endPoint: .bottomTrailing
                    )
                  )
                Image(systemName: "car.side.fill")
                  .font(.system(size: 12, weight: .bold))
                  .foregroundStyle(.white)
              }
              .frame(width: 24, height: 24)
            }
          }
          .shadow(color: Color.black.opacity(0.16), radius: 2, x: 0, y: 1)
          .offset(x: indicatorOffset, y: trackYOffset)
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
    .frame(height: showsIndicator ? 24 : max(trackHeight, 4))
  }
}

@main
struct NavigationLiveActivityWidgetBundle: WidgetBundle {
  var body: some Widget {
    NavigationLiveActivityWidget()
  }
}

struct NavigationLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: NavigationLiveActivityAttributes.self) { context in
      LockScreenNavigationLiveActivityView(context: context)
        .activityBackgroundTint(.clear)
        .activitySystemActionForegroundColor(.white)
    } dynamicIsland: { context in
      let meta = turnMeta(for: context.state.iconType)
      let roadName = preferredRoadName(current: context.state.currentRoadName, next: context.state.nextRoadName)
      let totalDistance = max(context.state.routeTotalDistance ?? 0, max(context.state.pathRetainDistance, 0))
      let progress = routeProgress(
        remainDistance: context.state.pathRetainDistance,
        totalDistance: totalDistance
      )
      let instruction = compactInstruction(
        distanceMeters: max(context.state.curStepRetainDistance, 0),
        roadName: roadName,
        action: meta.action
      )

      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Group {
            if let turnIconImage = liveTurnIconImage(base64: context.state.turnIconBase64) {
              turnIconImage
                .resizable()
                .scaledToFit()
                .padding(6)
            } else {
              Color.clear
            }
          }
          .frame(width: 34, height: 34)
        }

        DynamicIslandExpandedRegion(.center) {
          VStack(alignment: .leading, spacing: 4) {
            Text(context.attributes.appName)
              .font(.caption2)
              .foregroundStyle(.white.opacity(0.75))
            Text(instruction)
              .font(.subheadline.weight(.semibold))
              .foregroundStyle(.white)
              .lineLimit(1)
            NavigationProgressTrack(progress: progress, showsIndicator: false, trackHeight: 4)
              .frame(height: 6)
          }
        }

        DynamicIslandExpandedRegion(.trailing) {
          Text(formatDistanceCN(context.state.pathRetainDistance))
            .font(.caption.weight(.semibold))
            .foregroundStyle(.white.opacity(0.92))
        }
      } compactLeading: {
        Group {
          if let turnIconImage = liveTurnIconImage(base64: context.state.turnIconBase64) {
            turnIconImage
              .resizable()
              .scaledToFit()
          } else {
            Color.clear
          }
        }
      } compactTrailing: {
        Text(formatDistanceCN(context.state.curStepRetainDistance))
          .font(.caption2)
          .foregroundStyle(.white)
      } minimal: {
        Group {
          if let turnIconImage = liveTurnIconImage(base64: context.state.turnIconBase64) {
            turnIconImage
              .resizable()
              .scaledToFit()
          } else {
            Color.clear
          }
        }
      }
      .keylineTint(.white)
    }
  }
}

private struct LockScreenNavigationLiveActivityView: View {
  let context: ActivityViewContext<NavigationLiveActivityAttributes>

  private var meta: TurnMeta {
    turnMeta(for: context.state.iconType)
  }

  private var roadName: String {
    preferredRoadName(current: context.state.currentRoadName, next: context.state.nextRoadName)
  }

  private var stepDistanceText: String {
    if context.state.iconType == 15 {
      return "到达目的地"
    }
    let step = max(context.state.curStepRetainDistance, 0)
    guard step > 0 else {
      return meta.action == "继续" ? "继续前行" : meta.action
    }
    return formatDistanceCN(step, spacedUnit: true)
  }

  private var instructionText: String {
    if context.state.iconType == 15 {
      return ""
    }
    if !roadName.isEmpty {
      return "进入 \(roadName)"
    }
    return meta.action == "继续" ? "正在导航" : meta.action
  }

  private var remainText: String {
    "剩余 \(formatDistanceCN(context.state.pathRetainDistance, spacedUnit: true)) · \(formatTimeCN(context.state.pathRetainTime))"
  }

  private var routeTotalDistance: Int {
    max(context.state.routeTotalDistance ?? 0, max(context.state.pathRetainDistance, 0))
  }

  private var progressValue: Double {
    routeProgress(remainDistance: context.state.pathRetainDistance, totalDistance: routeTotalDistance)
  }

  var body: some View {
    ZStack {
      RoundedRectangle(cornerRadius: 24, style: .continuous)
        .fill(
          LinearGradient(
            colors: [
              Color(red: 0.10, green: 0.12, blue: 0.19),
              Color(red: 0.08, green: 0.10, blue: 0.16)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
          )
        )

      VStack(alignment: .leading, spacing: 8) {
        HStack(spacing: 14) {
          Group {
            if let turnIconImage = liveTurnIconImage(base64: context.state.turnIconBase64) {
              turnIconImage
                .resizable()
                .scaledToFit()
                .padding(12)
            } else {
              Color.clear
            }
          }
          .frame(width: 78, height: 78)

          VStack(alignment: .leading, spacing: 6) {
            Text(stepDistanceText)
              .font(.system(size: 38, weight: .heavy, design: .rounded))
              .foregroundStyle(.white)
              .lineLimit(1)
              .minimumScaleFactor(0.65)

            if !instructionText.isEmpty {
              Text(instructionText)
                .font(.system(size: 23, weight: .semibold, design: .rounded))
                .foregroundStyle(.white.opacity(0.96))
                .lineLimit(1)
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        }

        NavigationProgressTrack(progress: progressValue, showsIndicator: true, trackHeight: 8)
          .frame(height: 24)
          .frame(maxWidth: .infinity, alignment: .leading)

        Text(remainText)
          .font(.system(size: 13, weight: .medium))
          .foregroundStyle(.white.opacity(0.72))
          .lineLimit(1)
          .frame(maxWidth: .infinity, alignment: .center)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(.horizontal, 16)
      .padding(.vertical, 14)
    }
    .padding(.horizontal, 2)
  }
}
