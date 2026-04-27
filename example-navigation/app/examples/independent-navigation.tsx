import {
  MapView,
  Polyline,
  clearIndependentRoute,
  DriveStrategy,
  independentDriveRoute,
  type IndependentRouteResult,
  type MapViewRef,
  type NaviViewRef,
} from "expo-gaode-map-navigation";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  buildDemoScenario,
  ensureDemoSdkReady,
  formatDistance,
  formatDuration,
  formatPoint,
  getRoutePreviewPoints,
  type DemoScenario,
} from "@/lib/gaode-demo";
import { EmbeddedNaviView } from "@/lib/navigation-ui";
import { useHideNavigationHeader } from "@/lib/useHideNavigationHeader";

export default function IndependentNavigationExampleScreen() {
  const mapRef = React.useRef<MapViewRef>(null);
  const naviRef = React.useRef<NaviViewRef>(null);
  const activeTokenRef = React.useRef<number | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [planning, setPlanning] = React.useState(false);
  const [statusText, setStatusText] = React.useState("等待初始化");
  const [scenario, setScenario] = React.useState<DemoScenario | null>(null);
  const [routeResult, setRouteResult] = React.useState<IndependentRouteResult | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = React.useState(0);
  const [showNaviView, setShowNaviView] = React.useState(false);
  const [requestedNaviType, setRequestedNaviType] = React.useState(Platform.OS === "android" ? 0 : 1);

  useHideNavigationHeader(showNaviView);

  const naviModeLabel = Platform.OS === "android" ? "GPS 导航" : "模拟导航";
  const selectedModeLabel = requestedNaviType === 1 ? "模拟导航" : "GPS 导航";
  const routes = routeResult?.routes ?? [];
  const selectedRoute = routes[selectedRouteIndex] ?? null;
  const selectedWaypointMarkers = React.useMemo(
    () =>
      (scenario?.waypoints ?? []).map((point, index) => ({
        latitude: point.latitude,
        longitude: point.longitude,
        title: `途经${index + 1}`,
      })),
    [scenario]
  );
  const shouldUseCustomWaypointMarkersOnAndroid =
    Platform.OS === "android" && selectedWaypointMarkers.length > 0;

  const previewPoints = React.useMemo(() => {
    if (selectedRoute) {
      return getRoutePreviewPoints(selectedRoute);
    }
    if (!scenario) {
      return [];
    }
    return [scenario.from, ...scenario.waypoints, scenario.to];
  }, [scenario, selectedRoute]);

  React.useEffect(() => {
    if (previewPoints.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      void mapRef.current?.fitToCoordinates(previewPoints, {
        duration: 400,
        paddingFactor: 1.35,
        maxZoom: 17,
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [previewPoints]);

  React.useEffect(() => {
    return () => {
      if (activeTokenRef.current != null) {
        void clearIndependentRoute({ token: activeTokenRef.current }).catch(() => {});
      }
    };
  }, []);

  React.useEffect(() => {
    if (!showNaviView || !routeResult) {
      return;
    }

    const timer = setTimeout(() => {
      const selectedRouteId =
        typeof selectedRoute?.routeId === "number"
          ? selectedRoute.routeId
          : typeof selectedRoute?.id === "number"
            ? selectedRoute.id
            : undefined;
      void naviRef.current
        ?.startNavigationWithIndependentPath(routeResult.token, {
          routeId: selectedRouteId,
          routeIndex: selectedRouteIndex,
          naviType: requestedNaviType,
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          setShowNaviView(false);
          if (
            Platform.OS === "android" &&
            message.includes("高德 SDK 未接受该路径组")
          ) {
            Alert.alert(
              "Android 当前不支持这里的模拟独立导航",
              "这条独立路径组在当前高德 Android SDK 下会拒绝模拟导航启动。本示例已改为优先按 GPS 导航打开；如果你是在室内或未移动，页面能打开，但路线推进不会像模拟导航那样自动前进。"
            );
            return;
          }
          Alert.alert("启动导航失败", message);
        });
    }, 360);

    return () => clearTimeout(timer);
  }, [requestedNaviType, routeResult, selectedRoute, selectedRouteIndex, showNaviView]);

  const prepare = React.useCallback(async () => {
    try {
      setLoading(true);
      if (activeTokenRef.current != null) {
        await clearIndependentRoute({ token: activeTokenRef.current }).catch(() => {});
      }
      activeTokenRef.current = null;
      const currentLocation = await ensureDemoSdkReady();
      const nextScenario = buildDemoScenario(currentLocation);
      setScenario(nextScenario);
      setRouteResult(null);
      setSelectedRouteIndex(0);
      setStatusText(
        [
          "SDK 已就绪",
          `起点: ${formatPoint(nextScenario.from)}`,
          `终点: ${formatPoint(nextScenario.to)}`,
          "本页专门演示 independentDriveRoute -> startNavigationWithIndependentPath 的完整链路。",
        ].join("\n")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`初始化失败: ${message}`);
      Alert.alert("初始化失败", message);
    } finally {
      setLoading(false);
    }
  }, []);

  const planIndependentNavigation = React.useCallback(async () => {
    if (!scenario) {
      Alert.alert("尚未初始化", "请先完成 SDK 初始化");
      return;
    }

    try {
      setPlanning(true);
      if (activeTokenRef.current != null) {
        await clearIndependentRoute({ token: activeTokenRef.current }).catch(() => {});
      }
      activeTokenRef.current = null;

      const result = await independentDriveRoute({
        from: scenario.from,
        to: scenario.to,
        waypoints: scenario.waypoints,
        strategy: DriveStrategy.AVOID_CONGESTION,
        restriction: false,
      });

      activeTokenRef.current = result.token;
      setRouteResult(result);
      setSelectedRouteIndex(result.mainPathIndex);
      setStatusText(
        [
          `独立路径组已生成，共 ${result.count} 条候选路线`,
          `token: ${result.token}`,
          `当前主路线索引: ${result.mainPathIndex}`,
          `下一步可直接通过 startNavigationWithIndependentPath(routeIndex) 启动${selectedModeLabel}。`,
        ].join("\n")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`独立算路失败: ${message}`);
      Alert.alert("独立算路失败", message);
    } finally {
      setPlanning(false);
    }
  }, [scenario, selectedModeLabel]);

  const stopNavigation = React.useCallback(async () => {
    try {
      await naviRef.current?.stopNavigation();
    } catch {}
    setShowNaviView(false);
  }, []);

  if (showNaviView && routeResult) {
    return (
      <EmbeddedNaviView
        ref={naviRef}
        style={styles.naviContainer}
        naviType={requestedNaviType}
        customWaypointMarkers={
          shouldUseCustomWaypointMarkersOnAndroid ? selectedWaypointMarkers : undefined
        }
        routeMarkerVisible={
          shouldUseCustomWaypointMarkersOnAndroid
            ? {
                showStartEndVia: false,
                showFootFerry: true,
                showForbidden: true,
                showRouteStartIcon: false,
                showRouteEndIcon: false,
              }
            : undefined
        }
        showCamera
        enableVoice
        showTrafficBar
        showTrafficButton
        showDriveCongestion
        showTrafficLightView
        laneInfoVisible
        modeCrossDisplay
        eyrieCrossDisplay
        secondActionVisible
        backupOverlayVisible={false}
        showBackupRoute={false}
        naviStatusBarEnabled={false}
        driveViewEdgePadding={{ top: 12, left: 0, right: 0, bottom: 120 }}
        screenAnchor={{ x: 0.5, y: 0.78 }}
        onExitPress={() => void stopNavigation()}
        onNaviEnd={() => {
          void stopNavigation();
        }}
        onCalculateRouteFailure={(event) => {
          Alert.alert("导航失败", event.nativeEvent.error || "未知错误");
          void stopNavigation();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.badge}>independent-navigation</Text>
          <Text style={styles.title}>独立路径规划导航</Text>
          <Text style={styles.description}>
            这个示例专门演示“先独立算路，再按选中的独立路径启动导航”。它对应的就是
            `independentDriveRoute` 和 `startNavigationWithIndependentPath` 这条 API 链路。
          </Text>
          <Text style={styles.heroHint}>
            {Platform.OS === "android"
              ? "Android 当前默认按 GPS 启动，避免某些独立路径组在模拟导航下被 SDK 直接拒绝；你也可以手动切到模拟导航做验证。"
              : "iOS 当前默认按模拟导航启动，方便直接验证独立路径组是否能完整拉起导航。"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>状态</Text>
          <Text style={styles.cardText}>{statusText}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>启动方式</Text>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeChip, requestedNaviType === 0 && styles.modeChipActive]}
              onPress={() => setRequestedNaviType(0)}
            >
              <Text style={[styles.modeChipText, requestedNaviType === 0 && styles.modeChipTextActive]}>
                GPS 导航
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeChip, requestedNaviType === 1 && styles.modeChipActive]}
              onPress={() => setRequestedNaviType(1)}
            >
              <Text style={[styles.modeChipText, requestedNaviType === 1 && styles.modeChipTextActive]}>
                模拟导航
              </Text>
            </Pressable>
          </View>
          <Text style={styles.modeHint}>
            {Platform.OS === "android"
              ? requestedNaviType === 1
                ? "Android 独立路径组在模拟导航下可能被高德 SDK 直接拒绝；若失败，请切回 GPS 验证。"
                : "当前按 GPS 导航启动，适合先确认独立路径组是否可正常进入导航态。"
              : "iOS 一般可直接验证模拟导航；若你要接近真实场景，也可以切到 GPS。"}
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => void prepare()}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "处理中..." : "初始化并生成示例起终点"}</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton, !scenario && styles.disabledButton]}
            onPress={() => void planIndependentNavigation()}
            disabled={!scenario || planning}
          >
            <Text style={styles.buttonText}>{planning ? "独立算路中..." : "执行 independentDriveRoute"}</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.successButton, !selectedRoute && styles.disabledButton]}
            onPress={() => setShowNaviView(true)}
            disabled={!selectedRoute}
          >
            <Text style={styles.buttonText}>启动选中独立路径的{selectedModeLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.cardTitle}>独立路径组预览</Text>
          {scenario ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialCameraPosition={{
                target: scenario.from,
                zoom: 14,
              }}
              trafficEnabled
              myLocationEnabled
            >
              {routes.map((route, index) => (
                <Polyline
                  key={`independent-nav-route-${route.id}-${index}`}
                  points={getRoutePreviewPoints(route)}
                  strokeWidth={index === selectedRouteIndex ? 10 : 7}
                  strokeColor={index === selectedRouteIndex ? "#2563eb" : "#94a3b8"}
                />
              ))}
            </MapView>
          ) : (
            <View style={[styles.map, styles.mapPlaceholder]}>
              <Text style={styles.placeholderText}>初始化后会在这里显示独立路径组</Text>
            </View>
          )}
        </View>

        {routes.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>候选路线</Text>
            {routes.map((route, index) => (
              <Pressable
                key={`independent-nav-card-${route.id}-${index}`}
                style={[
                  styles.routeCard,
                  index === selectedRouteIndex && styles.routeCardActive,
                ]}
                onPress={() => setSelectedRouteIndex(index)}
              >
                <Text style={styles.routeTitle}>路线 {index + 1}</Text>
                <Text style={styles.routeMeta}>
                  routeId: {route.id} / {formatDistance(route.distance)} / {formatDuration(route.duration)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• `independentDriveRoute` 是否能返回 token 和候选路线</Text>
          <Text style={styles.feature}>• `routeIndex` 选择是否真正参与独立路径导航启动</Text>
          <Text style={styles.feature}>• `startNavigationWithIndependentPath` 是否能基于独立路径组直接启动导航</Text>
          <Text style={styles.feature}>• Android / iOS 两端独立路径启动方式差异是否符合预期</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f7fb",
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
  },
  hero: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "#111827",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#132f52",
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  title: {
    marginTop: 16,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "800",
    color: "#f8fafc",
  },
  description: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
    color: "#cbd5e1",
  },
  heroHint: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: "#93c5fd",
  },
  card: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ef",
  },
  mapCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbe3ef",
    gap: 12,
  },
  cardTitle: {
    marginBottom: 10,
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
  },
  modeRow: {
    flexDirection: "row",
    gap: 10,
  },
  modeChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    alignItems: "center",
  },
  modeChipActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  modeChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  modeChipTextActive: {
    color: "#1d4ed8",
  },
  modeHint: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#14532d",
  },
  secondaryButton: {
    backgroundColor: "#1d4ed8",
  },
  successButton: {
    backgroundColor: "#b45309",
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  map: {
    height: 280,
    borderRadius: 18,
    overflow: "hidden",
  },
  mapPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e2e8f0",
  },
  placeholderText: {
    fontSize: 14,
    color: "#475569",
  },
  routeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 14,
    marginTop: 10,
    backgroundColor: "#f8fafc",
  },
  routeCardActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  routeTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  routeMeta: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: "#475569",
  },
  feature: {
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },
  naviContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
});
