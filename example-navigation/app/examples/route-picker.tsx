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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

export default function RoutePickerExampleScreen() {
  const mapRef = React.useRef<MapViewRef>(null);
  const naviRef = React.useRef<NaviViewRef>(null);
  const activeTokenRef = React.useRef<number | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [statusText, setStatusText] = React.useState("等待初始化");
  const [scenario, setScenario] = React.useState<DemoScenario | null>(null);
  const [routeResult, setRouteResult] = React.useState<IndependentRouteResult | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = React.useState(0);
  const [showNaviView, setShowNaviView] = React.useState(false);
  const requestedNaviType = Platform.OS === "android" ? 0 : 1;
  const naviModeLabel = Platform.OS === "android" ? "GPS 导航" : "模拟导航";

  const routes = routeResult?.routes ?? [];
  const selectedRoute = routes[selectedRouteIndex] ?? null;
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
    if (!showNaviView || !scenario || !routeResult) {
      return;
    }

    const timer = setTimeout(() => {
      void naviRef.current
        ?.startNavigationWithIndependentPath(routeResult.token, {
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
  }, [routeResult, scenario, selectedRouteIndex, showNaviView]);

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
          "本页会直接调用独立路径组算路，路线卡片的选择会真正参与后续导航启动。",
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

  const planRoutes = React.useCallback(async () => {
    if (!scenario) {
      Alert.alert("尚未初始化", "请先完成 SDK 初始化");
      return;
    }

    try {
      setLoading(true);
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
          `已生成 ${result.count} 条可导航候选路线`,
          `当前主路线索引: ${result.mainPathIndex}`,
          `选中的路线会通过 startNavigationWithIndependentPath(routeIndex) 真正启动。当前启动方式: ${naviModeLabel}。`,
          ...(Platform.OS === "android"
            ? ["Android 当前示例默认按 GPS 启动独立路径导航，避免模拟导航被 SDK 直接拒绝。"]
            : []),
        ].join("\n")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`路线规划失败: ${message}`);
      Alert.alert("路线规划失败", message);
    } finally {
      setLoading(false);
    }
  }, [scenario]);

  const stopNavigation = React.useCallback(async () => {
    try {
      await naviRef.current?.stopNavigation();
    } catch {}
    setShowNaviView(false);
  }, []);

  if (showNaviView && scenario) {
    return (
      <EmbeddedNaviView
        ref={naviRef}
        style={styles.naviContainer}
        naviType={requestedNaviType}
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
        backupOverlayVisible
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.badge}>route-picker</Text>
          <Text style={styles.title}>路线选择后再导航</Text>
          <Text style={styles.description}>
            这个示例不是只做假预览。它会先拿到原生独立路径组，你手动选中的那条路线会真正用于后续导航启动。
            {Platform.OS === "android"
              ? " Android 端当前默认按 GPS 方式启动，因为这类独立路径组在模拟导航下会被 SDK 拒绝。"
              : ""}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>状态</Text>
          <Text style={styles.cardText}>{statusText}</Text>
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
            onPress={() => void planRoutes()}
            disabled={!scenario || loading}
          >
            <Text style={styles.buttonText}>规划候选路线</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.successButton, !selectedRoute && styles.disabledButton]}
            onPress={() => setShowNaviView(true)}
            disabled={!selectedRoute}
          >
            <Text style={styles.buttonText}>使用当前选中路线进入{naviModeLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.cardTitle}>候选路线预览</Text>
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
                  key={`picker-route-${route.id}-${index}`}
                  points={getRoutePreviewPoints(route)}
                  strokeWidth={index === selectedRouteIndex ? 10 : 7}
                  strokeColor={index === selectedRouteIndex ? "#2563eb" : "#94a3b8"}
                />
              ))}
            </MapView>
          ) : (
            <View style={[styles.map, styles.mapPlaceholder]}>
              <Text style={styles.placeholderText}>初始化后会在这里显示候选路线</Text>
            </View>
          )}
        </View>

        {routes.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>手动选路</Text>
            {routes.map((route, index) => (
              <Pressable
                key={`picker-card-${route.id}-${index}`}
                style={[
                  styles.routeCard,
                  index === selectedRouteIndex && styles.routeCardActive,
                ]}
                onPress={() => setSelectedRouteIndex(index)}
              >
                <Text style={styles.routeTitle}>路线 {index + 1}</Text>
                <Text style={styles.routeMeta}>
                  {formatDistance(route.distance)} / {formatDuration(route.duration)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• 多条可导航候选路线展示</Text>
          <Text style={styles.feature}>• 用户手动选中的路线会真实参与导航启动</Text>
          <Text style={styles.feature}>• 当前页面会明确展示实际启动方式，避免“看起来是模拟，实际底层不支持”</Text>
          <Text style={styles.feature}>• 规划阶段和导航阶段解耦，但不再是“预览和实际导航不一致”</Text>
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
