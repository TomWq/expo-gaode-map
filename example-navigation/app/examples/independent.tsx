import {
  calculateDriveRoute,
  clearIndependentRoute,
  DriveStrategy,
  EmbeddedNaviView,
  independentDriveRoute,
  MapView,
  Polygon,
  Polyline,
  RouteType,
  type DriveRouteResult,
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
  TextInput,
  View,
} from "react-native";

import {
  buildAvoidanceDemoScenario,
  ensureDemoSdkReady,
  formatDistance,
  formatDuration,
  formatPoint,
  getRoutePreviewPoints,
  type DemoScenario,
} from "@/lib/gaode-demo";

export default function IndependentRouteExampleScreen() {
  const mapRef = React.useRef<MapViewRef>(null);
  const naviRef = React.useRef<NaviViewRef>(null);
  const activeTokenRef = React.useRef<number | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [planning, setPlanning] = React.useState(false);
  const [statusText, setStatusText] = React.useState("等待初始化");
  const [scenario, setScenario] = React.useState<DemoScenario | null>(null);
  const [result, setResult] = React.useState<IndependentRouteResult | null>(null);
  const [previewResult, setPreviewResult] = React.useState<DriveRouteResult | null>(null);
  const [previewRouteIndex, setPreviewRouteIndex] = React.useState(0);
  const [selectedRouteIndex, setSelectedRouteIndex] = React.useState(0);
  const [showNaviView, setShowNaviView] = React.useState(false);
  const [avoidAreaInputs, setAvoidAreaInputs] = React.useState(["", "", ""]);
  const [avoidRoadName, setAvoidRoadName] = React.useState("");
  const [previewOnlyReason, setPreviewOnlyReason] = React.useState("");

  const avoidAreaKeywords = React.useMemo(
    () => avoidAreaInputs.map((item) => item.trim()).filter(Boolean),
    [avoidAreaInputs]
  );

  const updateAvoidAreaInput = React.useCallback((index: number, value: string) => {
    setAvoidAreaInputs((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }, []);

  const buildPlanOptions = React.useCallback(
    (withAvoid: boolean) => ({
      from: scenario!.from,
      to: scenario!.to,
      waypoints: scenario!.waypoints,
      strategy: DriveStrategy.AVOID_CONGESTION,
      ...(withAvoid ? { avoidPolygons: scenario!.avoidPolygons } : {}),
      ...(withAvoid && avoidRoadName.trim()
        ? { avoidRoad: avoidRoadName.trim() }
        : {}),
      restriction: false,
    }),
    [avoidRoadName, scenario]
  );

  const buildPreviewOptions = React.useCallback(
    () => ({
      type: RouteType.DRIVE as const,
      from: scenario!.from,
      to: scenario!.to,
      waypoints: scenario!.waypoints,
      strategy: DriveStrategy.AVOID_CONGESTION,
      avoidPolygons: scenario!.avoidPolygons,
      ...(avoidRoadName.trim() ? { avoidRoad: avoidRoadName.trim() } : {}),
    }),
    [avoidRoadName, scenario]
  );

  React.useEffect(() => {
    return () => {
      if (activeTokenRef.current != null) {
        void clearIndependentRoute({ token: activeTokenRef.current }).catch(() => {});
      }
    };
  }, []);

  const previewRoutes = previewResult?.routes ?? [];
  const navigableRoutes = result?.routes ?? [];
  const selectedPreviewRoute = previewRoutes[previewRouteIndex] ?? null;
  const selectedNavigableRoute = navigableRoutes[selectedRouteIndex] ?? null;
  const isPreviewOnly = !result && Boolean(previewResult);
  const previewPoints = React.useMemo(() => {
    const combinedPoints = [
      ...(scenario?.baselineRoute ?? []),
      ...getRoutePreviewPoints(selectedPreviewRoute),
      ...getRoutePreviewPoints(selectedNavigableRoute),
      ...(scenario?.avoidPolygons.flatMap((polygon) => polygon) ?? []),
    ];

    if (combinedPoints.length > 1) {
      return combinedPoints;
    }

    if (!scenario) {
      return [];
    }

    return [scenario.from, ...scenario.waypoints, scenario.to];
  }, [scenario, selectedNavigableRoute, selectedPreviewRoute]);

  React.useEffect(() => {
    if (previewPoints.length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      void mapRef.current?.fitToCoordinates(previewPoints, {
        duration: 400,
        paddingFactor: 1.45,
        maxZoom: 17,
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [previewPoints]);

  React.useEffect(() => {
    if (!showNaviView || !result) {
      return;
    }

    const timer = setTimeout(() => {
      void naviRef.current
        ?.startNavigationWithIndependentPath(result.token, {
          routeIndex: selectedRouteIndex,
          naviType: 1,
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          setShowNaviView(false);
          Alert.alert("启动独立路线导航失败", message);
        });
    }, 360);

    return () => clearTimeout(timer);
  }, [result, selectedRouteIndex, showNaviView]);

  const prepare = React.useCallback(async () => {
    try {
      setLoading(true);
      const currentLocation = await ensureDemoSdkReady();
      const nextScenario = await buildAvoidanceDemoScenario(currentLocation, avoidAreaKeywords);
      setScenario(nextScenario);
      setStatusText(
        [
          "SDK 已就绪",
          `起点: ${formatPoint(nextScenario.from)}`,
          `终点: ${formatPoint(nextScenario.to)}`,
          `动态避让区: ${(nextScenario.avoidAreaLabels ?? [nextScenario.avoidAreaLabel || "示例避让区"]).join(" / ")}`,
        ].join("\n")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`初始化失败: ${message}`);
      Alert.alert("初始化失败", message);
    } finally {
      setLoading(false);
    }
  }, [avoidAreaKeywords]);

  const planIndependentRoute = React.useCallback(async () => {
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
      setResult(null);
      setPreviewResult(null);
      setPreviewRouteIndex(0);
      setPreviewOnlyReason("");
      setSelectedRouteIndex(0);

      const fallbackPreview = await calculateDriveRoute(buildPreviewOptions());
      setPreviewResult(fallbackPreview);
      setPreviewRouteIndex(fallbackPreview.mainPathIndex);

      if (Platform.OS === "ios") {
        setStatusText(
          [
            "已生成带避让预览路线",
            "iOS 当前独立算路接口不会真正消费 avoidRoad / avoidPolygons。",
            "如果你要继续测试可导航独立路线，请点击“忽略避让继续独立导航”。",
          ].join("\n")
        );
        setPreviewOnlyReason(
          "当前 iOS 原生独立算路不会真正按避让区域/道路返回可直接导航的路径组，所以这里仅展示带避让的预览结果。"
        );
        return;
      }

      try {
        const nextResult = await independentDriveRoute(buildPlanOptions(true));
        activeTokenRef.current = nextResult.token;
        setResult(nextResult);
        setSelectedRouteIndex(nextResult.mainPathIndex);
        setStatusText(
          [
            "已生成带避让预览路线，并拿到可导航独立路径组。",
            `独立路线数量: ${nextResult.count}，当前主路线索引: ${nextResult.mainPathIndex}`,
            "地图上橙线是带避让预览，蓝线是实际可导航独立路线。",
          ].join("\n")
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const isAvoidUnsupported =
          Platform.OS === "android" &&
          (message.includes("AVOID_NOT_SUPPORTED") ||
            message.includes("不支持独立路径的避让参数") ||
            message.includes("独立路径的避让参数"));

        if (!isAvoidUnsupported) {
          throw error;
        }

        setPreviewOnlyReason(
          "当前安卓 SDK 不支持独立路径避让参数。橙线是带避让的预览结果，但它不能直接用于独立导航。"
        );
        setStatusText(
          [
            "已生成带避让预览路线，但当前 SDK 无法返回带避让的独立路径组。",
            "地图上的橙线是预览结果，不是可直接启动的独立导航路线。",
            "如果你要继续测试独立导航，请点击“忽略避让继续独立导航”。",
          ].join("\n")
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`独立算路失败: ${message}`);
      Alert.alert("独立算路失败", message);
    } finally {
      setPlanning(false);
    }
  }, [buildPlanOptions, buildPreviewOptions, scenario]);

  const continueWithoutAvoid = React.useCallback(async () => {
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

      const nextResult = await independentDriveRoute(buildPlanOptions(false));
      activeTokenRef.current = nextResult.token;
      setResult(nextResult);
      setPreviewOnlyReason("");
      setSelectedRouteIndex(nextResult.mainPathIndex);
      setStatusText(
        [
          `已生成可导航独立路线，共 ${nextResult.count} 条`,
          "蓝线为实际可导航独立路线；若与橙线不一致，说明当前原生独立导航无法完整复现避让预览。",
        ].join("\n")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`忽略避让后的独立算路失败: ${message}`);
      Alert.alert("独立算路失败", message);
    } finally {
      setPlanning(false);
    }
  }, [buildPlanOptions, scenario]);

  const stopNavigation = React.useCallback(async () => {
    try {
      await naviRef.current?.stopNavigation();
    } catch {}
    setShowNaviView(false);
  }, []);

  if (showNaviView && result) {
    return (
      <EmbeddedNaviView
          ref={naviRef}
          style={styles.naviContainer}
          naviType={1}
          showCamera
          enableVoice
          showUIElements
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
          androidStatusBarPaddingTop={0}
          driveViewEdgePadding={{ top: 12, left: 0, right: 0, bottom: 120 }}
          screenAnchor={{ x: 0.5, y: 0.78 }}
          showBackupRoute
          showEagleMap={false}
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
          <Text style={styles.badge}>independent</Text>
          <Text style={styles.title}>独立算路主要验证“避让预览”</Text>
          <Text style={styles.description}>
            本页不是承诺“带避让独立导航一定可用”，而是把能力边界直接摊开给你看：
            灰线是无避让基准路线，橙线是带避让预览结果，蓝线才是当前平台真正能启动的独立导航路线。
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>状态</Text>
          <Text style={styles.cardText}>{statusText}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>避让区域关键词</Text>
          {avoidAreaInputs.map((value, index) => (
            <TextInput
              key={`independent-avoid-area-${index}`}
              value={value}
              onChangeText={(nextValue) => updateAvoidAreaInput(index, nextValue)}
              placeholder={`避让区域 ${index + 1}，例如角门北路`}
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
          ))}
          <Text style={styles.cardTitle}>可选避让道路</Text>
          <TextInput
            value={avoidRoadName}
            onChangeText={setAvoidRoadName}
            placeholder="可选：输入要规避的道路名，例如人民路"
            placeholderTextColor="#94a3b8"
            style={styles.input}
          />
          <Text style={styles.cardHint}>
            现在第二个示例也会优先用这些关键词做高德 Web 搜索定位，再生成多块避让区。
            如果没搜到可靠坐标，才会回退为基于基准路线的示意区。
          </Text>
          <Text style={styles.cardHint}>
            重点：这些避让区一定会参与“预览算路”，但不代表当前平台一定支持“带避让直接独立导航”。
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => void prepare()}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "处理中..." : "初始化并生成示例路线"}</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton, !scenario && styles.disabledButton]}
            onPress={() => void planIndependentRoute()}
            disabled={!scenario || planning}
          >
            <Text style={styles.buttonText}>
              {planning ? "处理中..." : "先生成带避让预览，再检测是否支持独立导航"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.successButton, !result && styles.disabledButton]}
            onPress={() => setShowNaviView(true)}
            disabled={!result}
          >
            <Text style={styles.buttonText}>仅在拿到蓝线后才开始独立导航</Text>
          </Pressable>
        </View>

        {isPreviewOnly ? (
          <View style={[styles.card, styles.warningCard]}>
            <Text style={styles.cardTitle}>当前平台仅支持“避让预览”，不支持带避让独立导航</Text>
            <Text style={styles.cardText}>{previewOnlyReason}</Text>
            <Text style={styles.cardHint}>
              如果你要尽量贴近避让结果去导航，更适合用第三个示例“跟随 Web 路线”。
            </Text>
            <Pressable
              style={[styles.button, styles.warningButton, planning && styles.disabledButton]}
              onPress={() => void continueWithoutAvoid()}
              disabled={planning}
            >
              <Text style={styles.buttonText}>
                {planning ? "处理中..." : "忽略避让，仅测试原生独立导航"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.mapCard}>
          <Text style={styles.cardTitle}>路线对比</Text>
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
              {scenario.baselineRoute?.length ? (
                <Polyline
                  points={scenario.baselineRoute}
                  strokeWidth={7}
                  strokeColor="#cbd5e1"
                />
              ) : null}
              {previewRoutes.map((route, index) => (
                <Polyline
                  key={`preview-${route.id}-${index}`}
                  points={getRoutePreviewPoints(route)}
                  strokeWidth={index === previewRouteIndex ? 9 : 6}
                  strokeColor={index === previewRouteIndex ? "#f97316" : "#fdba74"}
                />
              ))}
              {navigableRoutes.map((route, index) => (
                <Polyline
                  key={`navigable-${route.id}-${index}`}
                  points={getRoutePreviewPoints(route)}
                  strokeWidth={index === selectedRouteIndex ? 10 : 7}
                  strokeColor={index === selectedRouteIndex ? "#2563eb" : "#93c5fd"}
                />
              ))}
              {scenario.avoidPolygons.map((polygon, index) => (
                <Polygon
                  key={`avoid-${index}`}
                  points={polygon}
                  strokeWidth={2}
                  strokeColor="#dc2626"
                  fillColor="rgba(220, 38, 38, 0.18)"
                  zIndex={1}
                />
              ))}
            </MapView>
          ) : (
            <View style={[styles.map, styles.mapPlaceholder]}>
              <Text style={styles.placeholderText}>初始化后会在这里对比灰线、橙线和蓝线</Text>
            </View>
          )}
          <Text style={styles.cardHint}>灰线: 无避让基准路线  橙线: 带避让预览  蓝线: 实际可导航独立路线</Text>
          <Text style={styles.cardHint}>
            当前动态避让区: {(scenario?.avoidAreaLabels ?? [scenario?.avoidAreaLabel || "示例避让区"]).join(" / ")}
          </Text>
          <Text style={styles.cardHint}>
            看图时请按这个结论理解：橙线一定代表“避让预览”，蓝线才代表“当前平台真的能拿来独立导航”。
          </Text>
        </View>

        {previewRoutes.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>带避让预览路线</Text>
            {previewRoutes.map((route, index) => (
              <Pressable
                key={`preview-card-${route.id}-${index}`}
                style={[
                  styles.routeCard,
                  index === previewRouteIndex && styles.routeCardActive,
                ]}
                onPress={() => setPreviewRouteIndex(index)}
              >
                <Text style={styles.routeTitle}>预览路线 {index + 1}</Text>
                <Text style={styles.routeMeta}>
                  {formatDistance(route.distance)} / {formatDuration(route.duration)}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {navigableRoutes.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>可导航独立路线</Text>
            {navigableRoutes.map((route, index) => (
              <Pressable
                key={`navigable-card-${route.id}-${index}`}
                style={[
                  styles.routeCard,
                  index === selectedRouteIndex && styles.routeCardActive,
                ]}
                onPress={() => setSelectedRouteIndex(index)}
              >
                <Text style={styles.routeTitle}>独立路线 {index + 1}</Text>
                <Text style={styles.routeMeta}>
                  {formatDistance(route.distance)} / {formatDuration(route.duration)}
                </Text>
                <Text style={styles.routeMeta}>routeId: {route.routeId ?? route.id}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• 这个页面优先验证“避让预览”是否正确，不保证“带避让独立导航”一定可用</Text>
          <Text style={styles.feature}>• 灰线、橙线、蓝线分开显示，不再把“预览”和“可导航结果”混成一条</Text>
          <Text style={styles.feature}>• `avoidPolygons` 与 `avoidRoad` 先作用在预览阶段，再判断独立导航是否真支持</Text>
          <Text style={styles.feature}>• Android 旧版 SDK 和当前 iOS 都不会再假装“带避让独立导航已经生效”</Text>
          <Text style={styles.feature}>• 如果你的目标是“尽量按避让后的 Web 结果去导航”，请优先看第三个示例</Text>
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
  warningCard: {
    borderColor: "#fdba74",
    backgroundColor: "#fff7ed",
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
  cardHint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
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
  warningButton: {
    marginTop: 14,
    backgroundColor: "#ea580c",
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
