import { MaterialIcons } from "@expo/vector-icons";
import type { NaviInfoUpdateEvent } from "../types";
import React from "react";
import {
  type LayoutChangeEvent,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

function formatDistance(distance?: number): string {
  if (!Number.isFinite(distance)) {
    return "--";
  }

  const safeDistance = Math.max(0, Math.round(distance ?? 0));
  if (safeDistance < 1000) {
    return `${safeDistance}米`;
  }

  const kilometers = safeDistance / 1000;
  return `${kilometers >= 10 ? kilometers.toFixed(0) : kilometers.toFixed(1)}公里`;
}

function splitDistanceParts(distance?: number): { value: string; unit: string } {
  if (!Number.isFinite(distance)) {
    return { value: "--", unit: "" };
  }

  const safeDistance = Math.max(0, Math.round(distance ?? 0));
  if (safeDistance < 1000) {
    return { value: `${safeDistance}`, unit: "m" };
  }

  const kilometers = safeDistance / 1000;
  return {
    value: `${kilometers >= 10 ? kilometers.toFixed(0) : kilometers.toFixed(1)}`,
    unit: "km",
  };
}

function formatDuration(seconds?: number): string {
  if (!Number.isFinite(seconds)) {
    return "--";
  }

  const safeSeconds = Math.max(0, Math.round(seconds ?? 0));
  if (safeSeconds < 60) {
    return "1分钟内";
  }

  const minutes = Math.round(safeSeconds / 60);
  if (minutes < 60) {
    return `${minutes}分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return remainMinutes > 0 ? `${hours}小时${remainMinutes}分` : `${hours}小时`;
}

function getTurnMeta(iconType?: number): {
  action: string;
  iconName: React.ComponentProps<typeof MaterialIcons>["name"];
  guideVariant:
    | "left"
    | "right"
    | "slightLeft"
    | "slightRight"
    | "sharpLeft"
    | "sharpRight"
    | "uturnLeft"
    | "uturnRight"
    | "straight"
    | "roundabout"
    | "arrive"
    | "forkLeft"
    | "forkRight"
    | "default";
} {
  switch (iconType) {
    case 2:
      return { action: "左转", iconName: "turn-left", guideVariant: "left" };
    case 3:
      return { action: "右转", iconName: "turn-right", guideVariant: "right" };
    case 4:
      return { action: "左前方", iconName: "turn-slight-left", guideVariant: "slightLeft" };
    case 5:
      return { action: "右前方", iconName: "turn-slight-right", guideVariant: "slightRight" };
    case 6:
      return { action: "左后方", iconName: "turn-sharp-left", guideVariant: "sharpLeft" };
    case 7:
      return { action: "右后方", iconName: "turn-sharp-right", guideVariant: "sharpRight" };
    case 8:
      return { action: "左转调头", iconName: "u-turn-left", guideVariant: "uturnLeft" };
    case 9:
      return { action: "直行", iconName: "straight", guideVariant: "straight" };
    case 11:
      return { action: "进入环岛", iconName: "roundabout-right", guideVariant: "roundabout" };
    case 12:
      return { action: "驶出环岛", iconName: "roundabout-right", guideVariant: "roundabout" };
    case 15:
      return { action: "到达目的地", iconName: "place", guideVariant: "arrive" };
    case 19:
      return { action: "右转调头", iconName: "u-turn-right", guideVariant: "uturnRight" };
    case 20:
      return { action: "顺行", iconName: "straight", guideVariant: "straight" };
    case 65:
      return { action: "靠左行驶", iconName: "fork-left", guideVariant: "forkLeft" };
    case 66:
      return { action: "靠右行驶", iconName: "fork-right", guideVariant: "forkRight" };
    default:
      return { action: "进入", iconName: "navigation", guideVariant: "default" };
  }
}

function TurnIconBadge({
  iconType,
  compact = false,
  size = "large",
}: {
  iconType?: number;
  compact?: boolean;
  size?: "large" | "small";
}) {
  const turnMeta = getTurnMeta(iconType);
  const isSmall = size === "small";
  const iconSize = isSmall ? (compact ? 18 : 20) : compact ? 42 : 56;
  const containerStyle: StyleProp<ViewStyle> = [
    styles.turnBadge,
    isSmall ? styles.turnBadgeSmall : styles.turnBadgeLarge,
    compact && !isSmall ? styles.turnBadgeCompact : null,
  ];

  return (
    <View style={containerStyle}>
      {turnMeta.guideVariant === "arrive" ? <View style={styles.turnGuideDot} /> : null}
      <MaterialIcons name={turnMeta.iconName} size={iconSize} color="#ffffff" />
    </View>
  );
}

export function EmbeddedNaviHud({
  info,
  compact = false,
  onLayout,
}: {
  info: NaviInfoUpdateEvent | null;
  compact?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
}) {
  const topInset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
  const hasPrimaryDistance = (info?.curStepRetainDistance ?? info?.pathRetainDistance ?? 0) > 0;
  const hasRoadName = Boolean(info?.nextRoadName?.trim() || info?.currentRoadName?.trim());
  const hasIcon = typeof info?.iconType === "number" && info.iconType > 0;

  if (!info || (!hasPrimaryDistance && !hasRoadName && !hasIcon)) {
    return null;
  }

  const turnMeta = getTurnMeta(info?.iconType);
  const nextTurnMeta = getTurnMeta(info?.nextIconType);

  const nextRoadName = info?.nextRoadName?.trim() || info?.currentRoadName?.trim() || "前方道路";
  const currentRoadName = info?.currentRoadName?.trim() || "当前道路信息获取中";
  const stepDistanceText = formatDistance(info?.curStepRetainDistance ?? info?.pathRetainDistance);
  const stepDistanceParts = splitDistanceParts(info?.curStepRetainDistance ?? info?.pathRetainDistance);
  const totalDistanceText = formatDistance(info?.pathRetainDistance);
  const totalDurationText = formatDuration(info?.pathRetainTime);
  const nextTurnText =
    typeof info?.nextIconType === "number" && info.nextIconType > 0
      ? `随后${nextTurnMeta.action}`
      : "随后保持当前路线";
  const cardStyle: StyleProp<ViewStyle> = [styles.card, compact ? styles.cardCompact : null];
  const iconBoxStyle: StyleProp<ViewStyle> = [styles.iconBox, compact ? styles.iconBoxCompact : null];
  const distanceStyle: StyleProp<TextStyle> = [styles.distance, compact ? styles.distanceCompact : null];
  const actionStyle: StyleProp<TextStyle> = [styles.action, compact ? styles.actionCompact : null];
  const roadNameStyle: StyleProp<TextStyle> = [styles.roadName, compact ? styles.roadNameCompact : null];
  const trailingBlockStyle: StyleProp<ViewStyle> = [
    styles.trailingBlock,
    compact ? styles.trailingBlockCompact : null,
  ];
  const nextTurnTextStyle: StyleProp<TextStyle> = [
    styles.nextTurnText,
    compact ? styles.nextTurnTextCompact : null,
  ];
  const trafficLightText =
    (info?.routeRemainTrafficLightCount ?? 0) > 0
      ? `余 ${info?.routeRemainTrafficLightCount} 个红绿灯`
      : null;

  if (compact) {
    return (
      <View
        pointerEvents="none"
        onLayout={onLayout}
        style={[styles.container, styles.containerCompact, { paddingTop: topInset + 2 }]}
      >
        <View style={styles.compactShell}>
          <View style={styles.compactLeadPanel}>
            {turnMeta.guideVariant === "arrive" ? <View style={styles.compactLeadDot} /> : null}
            <MaterialIcons name={turnMeta.iconName} size={48} color="#ffffff" />
          </View>

          <View style={styles.compactMain}>
            <View style={styles.compactHeadline}>
              <View style={styles.compactDistanceGroup}>
                <Text style={styles.compactDistanceValue}>{stepDistanceParts.value}</Text>
                {stepDistanceParts.unit ? (
                  <Text style={styles.compactDistanceUnit}>{stepDistanceParts.unit}</Text>
                ) : null}
              </View>
              <Text numberOfLines={1} style={styles.compactRoadText}>
                {nextRoadName}
              </Text>
            </View>
          </View>

          <View style={styles.compactTrailing}>
            <Text style={styles.compactTrailingLabel}>随后</Text>
            {typeof info?.nextIconType === "number" && info.nextIconType > 0 ? (
              <MaterialIcons name={nextTurnMeta.iconName} size={24} color="#ffffff" />
            ) : (
              <Text style={styles.compactTrailingFallback}>直行</Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={[styles.container, { paddingTop: topInset + 8 }]}
    >
      <View style={cardStyle}>
        <View style={styles.primaryRow}>
          <View style={iconBoxStyle}>
            <TurnIconBadge iconType={info?.iconType} compact={compact} />
          </View>

          <View style={styles.centerBlock}>
            <View style={styles.headlineRow}>
              <Text style={distanceStyle}>{stepDistanceText}</Text>
              <Text style={actionStyle}>{turnMeta.action}</Text>
            </View>
            <Text numberOfLines={1} style={roadNameStyle}>
              {nextRoadName}
            </Text>
          </View>

          <View style={trailingBlockStyle}>
            <View style={styles.nextTurnRow}>
              <Text style={styles.nextTurnLabel}>随后</Text>
              <TurnIconBadge iconType={info?.nextIconType} compact={compact} size="small" />
            </View>
            <Text numberOfLines={1} style={nextTurnTextStyle}>
              {nextTurnText}
            </Text>
            <Text style={styles.trailingLabel}>全程剩余</Text>
            <Text style={styles.trailingDistance}>{totalDistanceText}</Text>
            <Text style={styles.trailingDuration}>{totalDurationText}</Text>
          </View>
        </View>

        <View style={styles.secondaryRow}>
          <Text numberOfLines={1} style={styles.secondaryText}>
            当前: {currentRoadName}
          </Text>
          {trafficLightText ? <Text style={styles.secondaryBadge}>{trafficLightText}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  containerCompact: {
    paddingHorizontal: 8,
  },
  card: {
    borderRadius: 20,
    backgroundColor: "rgba(25, 28, 36, 0.96)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 18,
  },
  cardCompact: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "84%",
  },
  compactShell: {
    minHeight: 74,
    width: "100%",
    borderRadius: 20,
    backgroundColor: "rgba(3, 8, 18, 0.98)",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.26,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 14,
  },
  compactLeadPanel: {
    width: 62,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },
  compactLeadDot: {
    position: "absolute",
    width: 16,
    height: 16,
    bottom: 16,
    borderRadius: 8,
    backgroundColor: "rgba(191, 219, 254, 0.52)",
  },
  compactMain: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 14,
    paddingRight: 10,
    justifyContent: "center",
  },
  compactHeadline: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    minWidth: 0,
  },
  compactDistanceGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    flexShrink: 0,
  },
  compactDistanceValue: {
    color: "#ffffff",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.8,
  },
  compactDistanceUnit: {
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    marginLeft: 2,
  },
  compactRoadText: {
    flex: 1,
    minWidth: 0,
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    flexShrink: 1,
  },
  compactTrailing: {
    minWidth: 78,
    paddingLeft: 4,
    paddingRight: 12,
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
  },
  compactTrailingLabel: {
    color: "rgba(255, 255, 255, 0.76)",
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "800",
  },
  compactTrailingFallback: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  primaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxCompact: {
    width: 34,
  },
  turnBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  turnBadgeLarge: {
    width: 52,
    height: 52,
  },
  turnBadgeSmall: {
    width: 22,
    height: 22,
  },
  turnBadgeCompact: {
    width: 40,
    height: 40,
  },
  turnGuideDot: {
    position: "absolute",
    width: 16,
    height: 16,
    bottom: 11,
    borderRadius: 8,
    backgroundColor: "rgba(110, 231, 183, 0.38)",
  },
  centerBlock: {
    flex: 1,
    minWidth: 0,
    paddingLeft: 0,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  distance: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  distanceCompact: {
    fontSize: 21,
  },
  action: {
    color: "#d5d9e2",
    fontSize: 18,
    fontWeight: "700",
  },
  actionCompact: {
    fontSize: 15,
  },
  roadName: {
    marginTop: 2,
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "700",
  },
  roadNameCompact: {
    fontSize: 17,
    marginTop: 2,
  },
  trailingBlock: {
    marginLeft: 8,
    alignItems: "flex-end",
    minWidth: 110,
  },
  trailingBlockCompact: {
    minWidth: 96,
    marginLeft: 8,
  },
  nextTurnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nextTurnLabel: {
    color: "#8fb4ff",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  nextTurnText: {
    marginTop: 2,
    maxWidth: 110,
    color: "#dbeafe",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "right",
  },
  nextTurnTextCompact: {
    maxWidth: 96,
    fontSize: 10,
  },
  trailingLabel: {
    marginTop: 4,
    color: "#8d98ac",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  trailingDistance: {
    marginTop: 2,
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },
  trailingDuration: {
    marginTop: 2,
    color: "#d5d9e2",
    fontSize: 12,
    fontWeight: "600",
  },
  secondaryRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(148, 163, 184, 0.28)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  secondaryText: {
    flex: 1,
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "600",
  },
  secondaryBadge: {
    color: "#fde68a",
    fontSize: 12,
    fontWeight: "700",
  },
});

export default EmbeddedNaviHud;
