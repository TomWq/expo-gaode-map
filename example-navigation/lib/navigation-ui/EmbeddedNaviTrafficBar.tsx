/**
 * 自定义路况光柱。
 * 这个文件主要负责根据原生透出的路况分段数据绘制整条路线的路况柱，
 * 同时按当前已行驶 / 剩余进度定位导航游标。
 */
import React from "react";
import {
  type LayoutChangeEvent,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import type { NaviInfoUpdateEvent, NaviTrafficStatusesEvent } from "expo-gaode-map-navigation";

export interface EmbeddedNaviTrafficBarProps {
  info: NaviInfoUpdateEvent | null;
  trafficStatuses: NaviTrafficStatusesEvent | null;
  visible?: boolean;
  /** 允许业务侧直接微调光柱位置与高度 */
  style?: StyleProp<ViewStyle>;
}

function getStatusColor(status: number): string {
  switch (status) {
    case 0:
      return "#0091FF";
    case 1:
      return "#00BA1F";
    case 2:
      return "#FFBA00";
    case 3:
      return "#F31D20";
    case 4:
      return "#A8090B";
    case 5:
      return "#94A3B8";
    case 6:
      return "#35C7FF";
    default:
      return "#D1D5DB";
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function EmbeddedNaviTrafficBar({
  info,
  trafficStatuses,
  visible = true,
  style,
}: EmbeddedNaviTrafficBarProps) {
  const [barHeight, setBarHeight] = React.useState(0);

  // Prefer the explicit route length emitted by native traffic events. If it is
  // temporarily unavailable, fall back to remaining + driven distance so the bar
  // can still render during the first few frames.
  const totalLength = React.useMemo(() => {
    const fromEvent = trafficStatuses?.totalLength ?? 0;
    if (fromEvent > 0) {
      return fromEvent;
    }
    const retainDistance = info?.pathRetainDistance ?? 0;
    const driveDistance = info?.driveDistance ?? 0;
    return retainDistance + driveDistance;
  }, [info?.driveDistance, info?.pathRetainDistance, trafficStatuses?.totalLength]);

  const retainDistance = info?.pathRetainDistance ?? trafficStatuses?.retainDistance ?? totalLength;
  // Ignore empty native segments so the custom bar stays visually continuous.
  const items = React.useMemo(
    () => (trafficStatuses?.items ?? []).filter((item) => item.length > 0),
    [trafficStatuses?.items]
  );

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setBarHeight((currentHeight) =>
      Math.abs(currentHeight - nextHeight) >= 1 ? nextHeight : currentHeight
    );
  }, []);

  if (!visible || totalLength <= 0 || items.length === 0) {
    return null;
  }

  const drawableHeight = Math.max(1, barHeight || 220);
  let accumulatedHeight = 0;
  // 高德返回的路况分段是“从当前位置往终点”的顺序，而光柱是从上往下画，
  // 所以这里先反转，再累计每段高度。
  const renderedSegments = items
    .slice()
    .reverse()
    .map((item, index, reversedItems) => {
      const remainingCount = reversedItems.length - index;
      const rawHeight = (item.length / totalLength) * drawableHeight;
      const segmentHeight =
        remainingCount === 1
          ? Math.max(1, drawableHeight - accumulatedHeight)
          : Math.max(1, Math.round(rawHeight));
      const top = accumulatedHeight;
      accumulatedHeight += segmentHeight;

      return {
        key: `${index}-${item.status}-${item.length}`,
        top,
        height: segmentHeight,
        color: getStatusColor(item.status),
      };
    });

  // 剩余距离同样是“从当前位置往前”的量，转成高度后可直接复用上面的坐标系。
  const cursorTop = clamp((retainDistance / totalLength) * drawableHeight, 0, drawableHeight);

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      <View style={styles.shadowShell}>
        <View style={styles.track} onLayout={handleLayout}>
          {renderedSegments.map((segment) => (
            <View
              key={segment.key}
              style={[
                styles.segment,
                {
                  top: segment.top,
                  height: segment.height,
                  backgroundColor: segment.color,
                },
              ]}
            />
          ))}
          <View style={[styles.passedMask, { top: cursorTop }]} />
        </View>
        <View style={[styles.cursor, { top: clamp(cursorTop - 7, 0, drawableHeight - 14) }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 18,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  shadowShell: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    width: 12,
    height: "100%",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(15, 23, 42, 0.2)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  segment: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  passedMask: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(148, 163, 184, 0.72)",
  },
  cursor: {
    position: "absolute",
    width: 18,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.14)",
    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.16)",
  },
});

export default EmbeddedNaviTrafficBar;
