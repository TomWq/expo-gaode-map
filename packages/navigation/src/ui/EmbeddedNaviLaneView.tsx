import React from "react";
import {
  Image,
  type ImageStyle,
  Platform,
  StatusBar,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import type { NaviLaneInfoEvent } from "../types";

export interface EmbeddedNaviLaneViewProps {
  laneInfo: NaviLaneInfoEvent | null;
  visible?: boolean;
  compact?: boolean;
  placement?: "top" | "bottom";
  topOffset?: number;
  scale?: number;
  style?: StyleProp<ViewStyle>;
}

const laneAssets = {
  landback_0: require("../../src/ui/assets/lanes/landback_0.png"),
  landback_1: require("../../src/ui/assets/lanes/landback_1.png"),
  landback_2: require("../../src/ui/assets/lanes/landback_2.png"),
  landback_3: require("../../src/ui/assets/lanes/landback_3.png"),
  landback_4: require("../../src/ui/assets/lanes/landback_4.png"),
  landback_5: require("../../src/ui/assets/lanes/landback_5.png"),
  landback_6: require("../../src/ui/assets/lanes/landback_6.png"),
  landback_7: require("../../src/ui/assets/lanes/landback_7.png"),
  landback_8: require("../../src/ui/assets/lanes/landback_8.png"),
  landback_9: require("../../src/ui/assets/lanes/landback_9.png"),
  landback_a: require("../../src/ui/assets/lanes/landback_a.png"),
  landback_b: require("../../src/ui/assets/lanes/landback_b.png"),
  landback_c: require("../../src/ui/assets/lanes/landback_c.png"),
  landback_d: require("../../src/ui/assets/lanes/landback_d.png"),
  landback_e: require("../../src/ui/assets/lanes/landback_e.png"),
  landback_f: require("../../src/ui/assets/lanes/landback_f.png"),
  landback_g: require("../../src/ui/assets/lanes/landback_g.png"),
  landback_h: require("../../src/ui/assets/lanes/landback_h.png"),
  landback_i: require("../../src/ui/assets/lanes/landback_i.png"),
  landback_j: require("../../src/ui/assets/lanes/landback_j.png"),
  landback_l: require("../../src/ui/assets/lanes/landback_l.png"),
  landfront_0: require("../../src/ui/assets/lanes/landfront_0.png"),
  landfront_1: require("../../src/ui/assets/lanes/landfront_1.png"),
  landfront_3: require("../../src/ui/assets/lanes/landfront_3.png"),
  landfront_5: require("../../src/ui/assets/lanes/landfront_5.png"),
  landfront_8: require("../../src/ui/assets/lanes/landfront_8.png"),
  landfront_d: require("../../src/ui/assets/lanes/landfront_d.png"),
  landfront_kk: require("../../src/ui/assets/lanes/landfront_kk.png"),
  landfront_20: require("../../src/ui/assets/lanes/landfront_20.png"),
  landfront_21: require("../../src/ui/assets/lanes/landfront_21.png"),
  landfront_40: require("../../src/ui/assets/lanes/landfront_40.png"),
  landfront_43: require("../../src/ui/assets/lanes/landfront_43.png"),
  landfront_61: require("../../src/ui/assets/lanes/landfront_61.png"),
  landfront_63: require("../../src/ui/assets/lanes/landfront_63.png"),
  landfront_70: require("../../src/ui/assets/lanes/landfront_70.png"),
  landfront_71: require("../../src/ui/assets/lanes/landfront_71.png"),
  landfront_73: require("../../src/ui/assets/lanes/landfront_73.png"),
  landfront_90: require("../../src/ui/assets/lanes/landfront_90.png"),
  landfront_95: require("../../src/ui/assets/lanes/landfront_95.png"),
  landfront_a0: require("../../src/ui/assets/lanes/landfront_a0.png"),
  landfront_a8: require("../../src/ui/assets/lanes/landfront_a8.png"),
  landfront_b1: require("../../src/ui/assets/lanes/landfront_b1.png"),
  landfront_b5: require("../../src/ui/assets/lanes/landfront_b5.png"),
  landfront_c3: require("../../src/ui/assets/lanes/landfront_c3.png"),
  landfront_c8: require("../../src/ui/assets/lanes/landfront_c8.png"),
  landfront_e1: require("../../src/ui/assets/lanes/landfront_e1.png"),
  landfront_e5: require("../../src/ui/assets/lanes/landfront_e5.png"),
  landfront_f0: require("../../src/ui/assets/lanes/landfront_f0.png"),
  landfront_f1: require("../../src/ui/assets/lanes/landfront_f1.png"),
  landfront_f5: require("../../src/ui/assets/lanes/landfront_f5.png"),
  landfront_j1: require("../../src/ui/assets/lanes/landfront_j1.png"),
  landfront_j8: require("../../src/ui/assets/lanes/landfront_j8.png"),
} as const satisfies Record<string, ImageSourcePropType>;

type LaneAssetKey = keyof typeof laneAssets;

const driveWayGrayBgKeys: LaneAssetKey[] = [
  "landback_0",
  "landback_1",
  "landback_2",
  "landback_3",
  "landback_4",
  "landback_5",
  "landback_6",
  "landback_7",
  "landback_8",
  "landback_9",
  "landback_a",
  "landback_b",
  "landback_c",
  "landback_d",
  "landback_e",
  "landback_f",
  "landback_g",
  "landback_h",
  "landback_i",
  "landback_j",
  "landfront_kk",
  "landback_l",
];

const driveWayFrontKeys: LaneAssetKey[] = [
  "landfront_0",
  "landfront_1",
  "landback_2",
  "landfront_3",
  "landback_4",
  "landfront_5",
  "landback_6",
  "landback_7",
  "landfront_8",
  "landback_9",
  "landback_a",
  "landback_b",
  "landback_c",
  "landfront_d",
  "landback_e",
  "landback_f",
  "landback_g",
  "landback_h",
  "landback_i",
  "landback_j",
  "landfront_kk",
  "landback_l",
];

function resolveComplexGuideKey(
  laneBackInfoIndex: number,
  laneSelectIndex: number
): LaneAssetKey | null {
  if (laneBackInfoIndex === 10 && laneSelectIndex === 0) return "landfront_a0";
  if (laneBackInfoIndex === 10 && laneSelectIndex === 8) return "landfront_a8";
  if (laneBackInfoIndex === 9 && laneSelectIndex === 0) return "landfront_90";
  if (laneBackInfoIndex === 9 && laneSelectIndex === 5) return "landfront_95";
  if (laneBackInfoIndex === 2 && laneSelectIndex === 0) return "landfront_20";
  if (laneBackInfoIndex === 2 && laneSelectIndex === 1) return "landfront_21";
  if (laneBackInfoIndex === 4 && laneSelectIndex === 0) return "landfront_40";
  if (laneBackInfoIndex === 4 && laneSelectIndex === 3) return "landfront_43";
  if (laneBackInfoIndex === 6 && laneSelectIndex === 1) return "landfront_61";
  if (laneBackInfoIndex === 6 && laneSelectIndex === 3) return "landfront_63";
  if (laneBackInfoIndex === 7 && laneSelectIndex === 0) return "landfront_70";
  if (laneBackInfoIndex === 7 && laneSelectIndex === 1) return "landfront_71";
  if (laneBackInfoIndex === 7 && laneSelectIndex === 3) return "landfront_73";
  if (laneBackInfoIndex === 11 && laneSelectIndex === 5) return "landfront_b5";
  if (laneBackInfoIndex === 11 && laneSelectIndex === 1) return "landfront_b1";
  if ((laneBackInfoIndex === 14 || laneBackInfoIndex === 15) && laneSelectIndex === 1) return "landfront_e1";
  if ((laneBackInfoIndex === 14 || laneBackInfoIndex === 15) && laneSelectIndex === 5) return "landfront_e5";
  if (laneBackInfoIndex === 16 && laneSelectIndex === 0) return "landfront_f0";
  if (laneBackInfoIndex === 16 && laneSelectIndex === 1) return "landfront_f1";
  if (laneBackInfoIndex === 16 && laneSelectIndex === 5) return "landfront_f5";
  if (laneBackInfoIndex === 12 && laneSelectIndex === 8) return "landfront_c8";
  if (laneBackInfoIndex === 12 && laneSelectIndex === 3) return "landfront_c3";
  if (laneBackInfoIndex === 20 && laneSelectIndex === 1) return "landfront_j1";
  if (laneBackInfoIndex === 20 && laneSelectIndex === 5) return "landfront_j8";
  if (laneBackInfoIndex === 19 && laneSelectIndex === 0) return "landfront_70";
  if (laneBackInfoIndex === 19 && laneSelectIndex === 3) return "landfront_73";
  if (laneBackInfoIndex === 19 && laneSelectIndex === 8) return "landfront_71";
  if (laneBackInfoIndex === 21) return "landfront_kk";
  if (laneBackInfoIndex === 23) return "landback_l";
  return null;
}

function isComplexLane(laneBackInfoIndex: number): boolean {
  return (
    laneBackInfoIndex === 14 ||
    laneBackInfoIndex === 2 ||
    laneBackInfoIndex === 4 ||
    laneBackInfoIndex === 9 ||
    laneBackInfoIndex === 10 ||
    laneBackInfoIndex === 11 ||
    laneBackInfoIndex === 12 ||
    laneBackInfoIndex === 6 ||
    laneBackInfoIndex === 7 ||
    laneBackInfoIndex === 16 ||
    laneBackInfoIndex >= 12
  );
}

function resolveGuideKey(
  laneBackInfoIndex: number,
  laneSelectIndex: number
): LaneAssetKey | null {
  const complexGuide = isComplexLane(laneBackInfoIndex)
    ? resolveComplexGuideKey(laneBackInfoIndex, laneSelectIndex)
    : null;
  if (complexGuide) {
    return complexGuide;
  }

  if (laneSelectIndex !== 255 && driveWayFrontKeys[laneSelectIndex]) {
    return driveWayFrontKeys[laneSelectIndex];
  }

  return driveWayGrayBgKeys[laneBackInfoIndex] ?? null;
}

function getVisibleLaneCount(laneInfo: NaviLaneInfoEvent): number {
  const sentinelIndex = laneInfo.backgroundLane.indexOf(255);
  if (sentinelIndex >= 0) {
    return sentinelIndex;
  }

  return Math.max(
    laneInfo.laneCount,
    laneInfo.backgroundLane.length,
    laneInfo.frontLane.length
  );
}

function LaneCell({
  backgroundAction,
  frontAction,
  laneStyle,
  laneImageStyle,
  laneRadius,
  isFirst,
  isLast,
  isSingle,
}: {
  backgroundAction: number;
  frontAction: number;
  laneStyle: ViewStyle;
  laneImageStyle: ImageStyle;
  laneRadius: number;
  isFirst: boolean;
  isLast: boolean;
  isSingle: boolean;
}) {
  const guideKey = resolveGuideKey(backgroundAction, frontAction);
  if (!guideKey) {
    return null;
  }

  return (
    <View
      style={[
        styles.laneCell,
        laneStyle,
        isSingle ? { borderRadius: laneRadius } : null,
        isFirst
          ? {
              borderTopLeftRadius: laneRadius,
              borderBottomLeftRadius: laneRadius,
            }
          : null,
        isLast
          ? {
              borderTopRightRadius: laneRadius,
              borderBottomRightRadius: laneRadius,
            }
          : null,
      ]}
    >
      <Image
        source={laneAssets[guideKey]}
        resizeMode="contain"
        style={[styles.laneImage, laneImageStyle]}
      />
    </View>
  );
}

export function EmbeddedNaviLaneView({
  laneInfo,
  visible = true,
  compact = false,
  placement = "top",
  topOffset,
  scale = 0.88,
  style,
}: EmbeddedNaviLaneViewProps) {
  const topInset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
  const resolvedScale = Math.min(Math.max(scale, 0.65), 1.3);

  if (!visible || !laneInfo) {
    return null;
  }

  const laneCount = getVisibleLaneCount(laneInfo);
  if (laneCount <= 0) {
    return null;
  }

  const placementStyle =
    placement === "top"
      ? { top: topOffset ?? topInset + (compact ? 54 : 110) }
      : { bottom: compact ? 112 : 88 };
  const laneRadius = (compact ? 5 : 6) * resolvedScale;
  const laneStyle: ViewStyle = {
    width: (compact ? 35 : 40) * resolvedScale,
    height: (compact ? 56 : 64) * resolvedScale,
    paddingHorizontal: 4 * resolvedScale,
    paddingVertical: 6 * resolvedScale,
  };
  const laneImageStyle: ImageStyle = {};
  const separatorStyle: ViewStyle = {
    width: Math.max(1, Math.round(resolvedScale)),
    height: (compact ? 32 : 38) * resolvedScale,
  };

  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        placement === "top" ? styles.containerTop : styles.containerBottom,
        placementStyle,
        style,
      ]}
    >
      <View style={[styles.bar, compact ? styles.barCompact : null]}>
        {Array.from({ length: laneCount }, (_, index) => {
          const isLast = index === laneCount - 1;
          const isSingle = laneCount === 1;

          return (
            <React.Fragment key={`lane-${index}`}>
              <LaneCell
                backgroundAction={laneInfo.backgroundLane[index] ?? 255}
                frontAction={laneInfo.frontLane[index] ?? 255}
                laneStyle={laneStyle}
                laneImageStyle={laneImageStyle}
                laneRadius={laneRadius}
                isFirst={index === 0}
                isLast={isLast}
                isSingle={isSingle}
              />
              {!isLast ? (
                <View style={[styles.separator, separatorStyle]} />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  containerTop: {
    justifyContent: "flex-start",
  },
  containerBottom: {
    justifyContent: "flex-end",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
  },
  barCompact: {},
  laneCell: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0091ff",
  },
  separator: {
    marginHorizontal: 0,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
  },
  laneImage: {
    width: "100%",
    height: "100%",
  },
});

export default EmbeddedNaviLaneView;
