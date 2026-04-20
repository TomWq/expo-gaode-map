/**
 * 自定义底部导航摘要条。
 * 这个文件主要负责展示全程剩余距离、剩余时间、预计到达时间，
 * 并承载退出导航等底部操作入口。
 */
import { BlurView } from "expo-blur";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
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

function formatArrivalTime(seconds?: number): string {
  if (!Number.isFinite(seconds)) {
    return "--:--";
  }

  const targetTime = new Date(Date.now() + Math.max(0, Math.round(seconds ?? 0)) * 1000);
  const hours = `${targetTime.getHours()}`.padStart(2, "0");
  const minutes = `${targetTime.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function EmbeddedNaviBottomSummary({
  info,
  onLayout,
  showExitButton = false,
  exitButtonText = "退出",
  onExitPress,
  blurTarget,
}: {
  info: NaviInfoUpdateEvent | null;
  onLayout?: (event: LayoutChangeEvent) => void;
  showExitButton?: boolean;
  exitButtonText?: string;
  onExitPress?: () => void;
  blurTarget?: React.RefObject<React.ElementRef<typeof View> | null>;
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const distance = info?.pathRetainDistance ?? 0;
  const duration = info?.pathRetainTime ?? 0;

  if (!info || distance <= 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      onLayout={onLayout}
      style={[styles.container, { bottom: Math.max(bottomInset + 10, 16) }]}
    >
      <View style={styles.card}>
        {/* 底部摘要条和顶部 HUD 共用同一份地图背景 target，整页玻璃材质更一致。 */}
        <BlurView
          tint="dark"
          intensity={54}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={blurTarget}
          style={styles.blurFill}
        />
        <View style={styles.cardOverlay} />

        <View style={styles.cardContent}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>剩余里程</Text>
            <Text style={styles.metricValue}>{formatDistance(distance)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>预计到达</Text>
            <Text style={styles.metricValue}>{formatArrivalTime(duration)}</Text>
            <Text style={styles.metricHint}>{formatDuration(duration)}</Text>
          </View>
          {showExitButton ? (
            <>
              <View style={styles.actionDivider} />
              <Pressable style={styles.exitAction} onPress={onExitPress}>
                <View style={styles.exitIconShell}>
                  <MaterialIcons name="logout" size={16} color="#ffffff" />
                </View>
                <Text style={styles.exitActionText}>{exitButtonText}</Text>
              </Pressable>
            </>
          ) : null}
        </View>
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
    paddingHorizontal: 16,
  },
  card: {
    minWidth: 248,
    maxWidth: 332,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    boxShadow: "0px 8px 22px rgba(0, 0, 0, 0.22)",
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "rgba(7, 12, 22, 0.18)",
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  metricBlock: {
    minWidth: 90,
    alignItems: "center",
  },
  metricLabel: {
    color: "rgba(226, 232, 240, 0.64)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: 4,
    color: "#ffffff",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  metricHint: {
    marginTop: 2,
    color: "rgba(191, 219, 254, 0.78)",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginHorizontal: 16,
    backgroundColor: "rgba(148, 163, 184, 0.3)",
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginLeft: 16,
    marginRight: 12,
    backgroundColor: "rgba(148, 163, 184, 0.34)",
  },
  exitAction: {
    minWidth: 74,
    paddingLeft: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  exitIconShell: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220, 38, 38, 0.9)",
  },
  exitActionText: {
    marginTop: 5,
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "800",
  },
});

export default EmbeddedNaviBottomSummary;
