/**
 * 自定义顶部导航 HUD。
 * 这个文件主要负责消费导航实时信息，渲染当前动作、距离、道路名、
 * 下一步提示，并在普通态和大图场景下切换不同的顶部展示样式。
 */
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
  Image,
  type ImageStyle,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NaviInfoUpdateEvent } from "expo-gaode-map-navigation";

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
  imageUri,
  compact = false,
  size = "large",
}: {
  iconType?: number;
  imageUri?: string;
  compact?: boolean;
  size?: "large" | "small";
}) {
  const turnMeta = getTurnMeta(iconType);
  const isSmall = size === "small";
  const iconSize = isSmall ? (compact ? 18 : 20) : compact ? 42 : 56;
  const imageStyle: StyleProp<ImageStyle> = [
    styles.turnIconImage,
    isSmall ? styles.turnIconImageSmall : styles.turnIconImageLarge,
    compact && !isSmall ? styles.turnIconImageCompact : null,
  ];
  const containerStyle: StyleProp<ViewStyle> = [
    styles.turnBadge,
    isSmall ? styles.turnBadgeSmall : styles.turnBadgeLarge,
    compact && !isSmall ? styles.turnBadgeCompact : null,
  ];

  return (
    <View style={containerStyle}>
      {imageUri ? (
        <Image fadeDuration={0} resizeMode="contain" source={{ uri: imageUri }} style={imageStyle} />
      ) : (
        <>
          {turnMeta.guideVariant === "arrive" ? <View style={styles.turnGuideDot} /> : null}
          <MaterialIcons name={turnMeta.iconName} size={iconSize} color="#ffffff" />
        </>
      )}
    </View>
  );
}

export function EmbeddedNaviHud({
  info,
  compact = false,
  onLayout,
  blurTarget,
}: {
  info: NaviInfoUpdateEvent | null;
  compact?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
  blurTarget?: React.RefObject<React.ElementRef<typeof View> | null>;
}) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : insets.top;
  const hasPrimaryDistance = (info?.curStepRetainDistance ?? info?.pathRetainDistance ?? 0) > 0;
  const hasRoadName = Boolean(info?.nextRoadName?.trim() || info?.currentRoadName?.trim());
  const hasIcon = Boolean(info?.turnIconImage) || (typeof info?.iconType === "number" && info.iconType > 0);

  if (!info || (!hasPrimaryDistance && !hasRoadName && !hasIcon)) {
    return null;
  }

  const turnMeta = getTurnMeta(info?.iconType);
  const hasNextTurnIcon = typeof info?.nextIconType === "number" && info.nextIconType > 0;
  const nextTurnMeta = getTurnMeta(info?.nextIconType);
  const hasNextTurnImage = Boolean(info?.nextTurnIconImage);
  const showsNextTurnPanel = hasNextTurnImage || (Platform.OS === "android" && hasNextTurnIcon);

  const nextRoadName = info?.nextRoadName?.trim() || info?.currentRoadName?.trim() || "前方道路";
  const currentRoadName = info?.currentRoadName?.trim() || "当前道路信息获取中";
  const stepDistanceText = formatDistance(info?.curStepRetainDistance ?? info?.pathRetainDistance);
  const stepDistanceParts = splitDistanceParts(info?.curStepRetainDistance ?? info?.pathRetainDistance);
  const nextTurnText = hasNextTurnIcon ? nextTurnMeta.action : "";
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
    // 路口大图出现时切成横向紧凑 HUD，尽量不压住官方大图和地图前方视野。
    return (
      <View
        pointerEvents="none"
        onLayout={onLayout}
        style={[styles.container, styles.containerCompact, { paddingTop: topInset + 2 }]}
      >
        <View style={styles.compactShell}>
          {/* 这里直接消费外层 EmbeddedNaviView 提供的地图 blur target，保证毛玻璃真的来自地图背景。 */}
          <BlurView
            tint="dark"
            intensity={90}
            blurMethod="dimezisBlurViewSdk31Plus"
            blurTarget={blurTarget}
            style={styles.blurFill}
          />
          <View style={styles.compactOverlay} />

          <View style={styles.compactLeadPanel}>
            {turnMeta.guideVariant === "arrive" ? <View style={styles.compactLeadDot} /> : null}
            {info?.turnIconImage ? (
              <Image
                fadeDuration={0}
                resizeMode="contain"
                source={{ uri: info.turnIconImage }}
                style={styles.compactLeadImage}
              />
            ) : (
              <MaterialIcons name={turnMeta.iconName} size={48} color="#ffffff" />
            )}
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

          {showsNextTurnPanel ? (
            <View style={styles.compactTrailing}>
              <Text style={styles.compactTrailingLabel}>随后</Text>
              {hasNextTurnImage ? (
                <Image
                  fadeDuration={0}
                  resizeMode="contain"
                  source={{ uri: info?.nextTurnIconImage }}
                  style={styles.compactTrailingImage}
                />
              ) : (
                <MaterialIcons name={nextTurnMeta.iconName} size={24} color="#ffffff" />
              )}
            </View>
          ) : null}
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
        {/* 常态 HUD 也复用同一个 blur target，避免每张卡片自己再包一层 target 导致 blur 失效。 */}
        <BlurView
          tint="dark"
          intensity={90}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={blurTarget}
          style={styles.blurFill}
        />
        <View style={styles.cardOverlay} />

        <View style={styles.cardContent}>
          <View style={styles.primaryRow}>
            <View style={iconBoxStyle}>
              <TurnIconBadge
                iconType={info?.iconType}
                imageUri={info?.turnIconImage}
                compact={compact}
              />
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

            {showsNextTurnPanel ? (
              <View style={trailingBlockStyle}>
                <View style={styles.nextTurnRow}>
                  <Text style={styles.nextTurnLabel}>随后</Text>
                  <TurnIconBadge
                    iconType={info?.nextIconType}
                    imageUri={info?.nextTurnIconImage}
                    compact={compact}
                    size="small"
                  />
                </View>
                <Text numberOfLines={1} style={nextTurnTextStyle}>
                  {nextTurnText}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.secondaryRow}>
            <Text numberOfLines={1} style={styles.secondaryText}>
              当前: {currentRoadName}
            </Text>
            {trafficLightText ? <Text style={styles.secondaryBadge}>{trafficLightText}</Text> : null}
          </View>
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
    overflow: "hidden",
    boxShadow: "0px 10px 24px rgba(0, 0, 0, 0.24)",
  },
  cardContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 14, 22, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
  },
  cardCompact: {
    borderRadius: 18,
    maxWidth: "84%",
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  compactShell: {
    minHeight: 74,
    width: "100%",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.22)",
    
  },
  compactOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 8, 18, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
  },
  compactLeadPanel: {
    width: 62,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37, 99, 235, 0.88)",
  },
  compactLeadDot: {
    position: "absolute",
    width: 16,
    height: 16,
    bottom: 16,
    borderRadius: 8,
    backgroundColor: "rgba(191, 219, 254, 0.52)",
  },
  compactLeadImage: {
    width: 52,
    height: 52,
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
  compactTrailingImage: {
    width: 24,
    height: 24,
  },
  compactTrailingFallback: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    maxWidth: 74,
    textAlign: "right",
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
  turnIconImage: {
    width: "100%",
    height: "100%",
  },
  turnIconImageLarge: {
    width: 52,
    height: 52,
  },
  turnIconImageSmall: {
    width: 22,
    height: 22,
  },
  turnIconImageCompact: {
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
    fontSize: 24,
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
    fontSize: 18,
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
    textAlign: "right",
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
