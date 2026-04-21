import ActivityKit
import SwiftUI
import UIKit
import WidgetKit
import ExpoGaodeMapNavigation

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
      let totalDistance = max(context.state.routeTotalDistance, max(context.state.pathRetainDistance, 0))
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
    max(context.state.routeTotalDistance, max(context.state.pathRetainDistance, 0))
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
