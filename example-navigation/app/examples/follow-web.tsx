import {
  clearIndependentRoute,
  followWebPlannedRoute,
  MapView,
  Polygon,
  Polyline,
  type FollowWebPlannedRouteResult,
  type MapViewRef,
  type ExpoGaodeMapNaviViewRef,
  type WebPlannedRoute,
} from "expo-gaode-map-navigation";
import {
  DrivingStrategy as WebDrivingStrategy,
  extractRoutePoints,
  GaodeWebAPI,
} from "expo-gaode-map-web-api";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EXAMPLE_WEB_API_KEY } from "@/exampleConfig";
import {
  buildAvoidanceDemoScenario,
  ensureDemoSdkReady,
  formatDistance,
  formatDuration,
  formatPoint,
  getRoutePreviewPoints,
  type DemoScenario,
} from "@/lib/gaode-demo";
import { EmbeddedNaviView } from "@/lib/navigation-ui";
import { useHideNavigationHeader } from "@/lib/useHideNavigationHeader";

interface WebPreview {
  distance: number;
  duration: number;
  webRoute: WebPlannedRoute;
}

function normalizeAvoidPolygons(
  polygons: DemoScenario["avoidPolygons"]
): string | undefined {
  if (!polygons.length) {
    return undefined;
  }

  const normalized = polygons
    .map((polygon) =>
      polygon.map((point) => `${point.longitude},${point.latitude}`).join(";")
    )
    .filter(Boolean)
    .join("|");

  return normalized || undefined;
}

export default function FollowWebRouteExampleScreen() {
  const mapRef = React.useRef<MapViewRef>(null);
  const naviRef = React.useRef<ExpoGaodeMapNaviViewRef>(null);
  const activeTokenRef = React.useRef<number | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [statusText, setStatusText] = React.useState("等待初始化");
  const [scenario, setScenario] = React.useState<DemoScenario | null>(null);
  const [webPreview, setWebPreview] = React.useState<WebPreview | null>(null);
  const [matchResult, setMatchResult] = React.useState<FollowWebPlannedRouteResult | null>(null);
  const [showNaviView, setShowNaviView] = React.useState(false);
  const [avoidAreaInputs, setAvoidAreaInputs] = React.useState(["", "", ""]);
  const [avoidRoadName, setAvoidRoadName] = React.useState("");

  useHideNavigationHeader(showNaviView);

  const avoidAreaKeywords = React.useMemo(
    () => avoidAreaInputs.map((item) => item.trim()).filter(Boolean),
    [avoidAreaInputs]
  );

  const updateAvoidAreaInput = React.useCallback((index: number, value: string) => {
    setAvoidAreaInputs((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }, []);

  React.useEffect(() => {
    return () => {
      if (activeTokenRef.current != null) {
        void clearIndependentRoute({ token: activeTokenRef.current }).catch(() => {});
      }
    };
  }, []);

  const matchedNativeRoute =
    matchResult?.independentResult.routes[matchResult.selectedRouteIndex ?? 0] ?? null;
  const canStartMatchedNavigation =
    Boolean(matchResult) && matchResult?.mode !== "preview_only";

  const previewPoints = React.useMemo(() => {
    const webPoints = webPreview?.webRoute.polyline ?? [];
    const nativePoints = getRoutePreviewPoints(matchedNativeRoute);
    const combinedPoints = [
      ...(scenario?.baselineRoute ?? []),
      ...webPoints,
      ...nativePoints,
      ...(scenario?.avoidPolygons.flatMap((polygon) => polygon) ?? []),
    ];

    if (combinedPoints.length > 1) {
      return combinedPoints;
    }

    if (!scenario) {
      return [];
    }

    return [scenario.from, ...scenario.waypoints, scenario.to];
  }, [matchedNativeRoute, scenario, webPreview]);

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
    if (!showNaviView || !matchResult) {
      return;
    }

    const timer = setTimeout(() => {
      void naviRef.current
        ?.startNavigationWithIndependentPath(matchResult.token, {
          routeIndex: matchResult.selectedRouteIndex ?? 0,
          naviType: 1,
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          setShowNaviView(false);
          Alert.alert("启动导航失败", message);
        });
    }, 360);

    return () => clearTimeout(timer);
  }, [matchResult, showNaviView]);

  const prepare = React.useCallback(async () => {
    try {
      setLoading(true);
      const currentLocation = await ensureDemoSdkReady();
      const nextScenario = await buildAvoidanceDemoScenario(
        currentLocation,
        avoidAreaKeywords
      );
      setScenario(nextScenario);
      setStatusText(
        [
          "SDK 已就绪",
          `起点: ${formatPoint(nextScenario.from)}`,
          `终点: ${formatPoint(nextScenario.to)}`,
          `动态避让区: ${(nextScenario.avoidAreaLabels ?? [nextScenario.avoidAreaLabel || "示例避让区"]).join(" / ")}`,
          `区域来源: ${(nextScenario.avoidAreaSources ?? [nextScenario.avoidAreaSource ?? "fallback"])
            .map((source) => (source === "searched" ? "搜索定位" : "回退生成"))
            .join(" / ")}`,
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

  const planWebRoute = React.useCallback(async () => {
    if (!scenario) {
      Alert.alert("尚未初始化", "请先完成 SDK 初始化");
      return;
    }

    try {
      setLoading(true);
      const api = new GaodeWebAPI({ key: EXAMPLE_WEB_API_KEY });
      const response = await api.route.driving(scenario.from, scenario.to, {
        strategy: WebDrivingStrategy.DEFAULT,
        waypoints: scenario.waypoints,
        avoidpolygons: normalizeAvoidPolygons(scenario.avoidPolygons),
        avoidroad: avoidRoadName.trim() || undefined,
        show_fields: "cost,navi,polyline",
      });

      const firstPath = response.route.paths[0];
      const points = extractRoutePoints(response);
      if (!firstPath || points.length < 2) {
        throw new Error("Web API 没有返回可用的 polyline");
      }

      setWebPreview({
        distance: Number(firstPath.distance ?? 0),
        duration: Number(firstPath.cost?.duration ?? firstPath.duration ?? 0),
        webRoute: {
          polyline: points,
        },
      });
      setMatchResult(null);
      setStatusText(`已获取 Web 路线，共 ${points.length} 个点`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`获取 Web 路线失败: ${message}`);
      Alert.alert("获取 Web 路线失败", message);
    } finally {
      setLoading(false);
    }
  }, [avoidRoadName, scenario]);

  const matchWebRoute = React.useCallback(async () => {
    if (!scenario || !webPreview) {
      Alert.alert("缺少 Web 路线", "请先通过 Web API 规划路线");
      return;
    }

    try {
      setLoading(true);
      if (activeTokenRef.current != null) {
        await clearIndependentRoute({ token: activeTokenRef.current }).catch(() => {});
      }

      const nextMatchResult = await followWebPlannedRoute({
        from: scenario.from,
        to: scenario.to,
        webRoute: webPreview.webRoute,
        maxViaPoints: 3,
        simplifyTolerance: 45,
        minSpacingMeters: 1600,
        maxDeviationMeters: 220,
        startNavigation: false,
        naviType: 1,
      });

      activeTokenRef.current = nextMatchResult.token;
      setMatchResult(nextMatchResult);
      setStatusText(
        [
          `匹配完成: ${nextMatchResult.mode}`,
          `平均偏差: ${Math.round(nextMatchResult.averageDeviationMeters ?? 0)} 米`,
          `导航方式: ${nextMatchResult.navigationUsesAnchorWaypoints ? "仍依赖锚点途经点" : "已切换为无途经点导航"}`,
          nextMatchResult.reason || "已完成原生近似匹配",
        ].join("\n")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`匹配失败: ${message}`);
      Alert.alert("匹配 Web 路线失败", message);
    } finally {
      setLoading(false);
    }
  }, [avoidRoadName, scenario, webPreview]);

  const stopNavigation = React.useCallback(async () => {
    try {
      await naviRef.current?.stopNavigation();
    } catch {}
    setShowNaviView(false);
  }, []);

  if (showNaviView && matchResult) {
    return (
      <EmbeddedNaviView
          ref={naviRef}
          style={styles.naviContainer}
          naviType={1}
          showCamera
          enableVoice
          showTrafficBar
          showTrafficButton
          showDriveCongestion
          showTrafficLightView
          routeMarkerVisible={{
            showStartEndVia: false,
            showFootFerry: false,
            showForbidden: true,
            showRouteStartIcon: false,
            showRouteEndIcon: false,
          }}
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.badge}>follow-web</Text>
          <Text style={styles.title}>按 Web 规划结果近似跟随导航</Text>
          <Text style={styles.description}>
            本页严格按这个顺序工作：先让 Web API 用避让参数生成橙线，再从橙线提炼锚点，最后只用锚点去重建蓝线原生可导航路线。
            也就是说，避让发生在 Web 规划阶段，不会再被错误地“二次塞回”原生独立算路。现在还会额外尝试切到“无途经点导航结果”。
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
              key={`avoid-area-${index}`}
              value={value}
              onChangeText={(nextValue) => updateAvoidAreaInput(index, nextValue)}
              placeholder={`避让区域 ${index + 1}，例如角门北路`}
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
          ))}
          <Text style={styles.cardTitle}>避让道路</Text>
          <TextInput
            value={avoidRoadName}
            onChangeText={setAvoidRoadName}
            placeholder="可选：再输入要规避的道路名，例如人民路"
            placeholderTextColor="#94a3b8"
            style={styles.input}
          />
          <Text style={styles.cardHint}>
            现在会优先用你输入的文字做高德 Web 搜索定位，再围绕搜索结果生成避让区。
            如果没搜到可靠坐标，才会回退为基于基准路线的示意区。
            橙线来自 Web 规避结果，蓝线来自锚点重建后的原生可导航结果，两者可能接近，也可能明显偏离。
          </Text>
          <Text style={styles.cardHint}>
            蓝线会优先尝试切换为“无途经点导航结果”；只有切不过去时，才会保留少量锚点途经点。
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
            onPress={() => void planWebRoute()}
            disabled={!scenario || loading}
          >
            <Text style={styles.buttonText}>调用 Web API 规划路线</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.secondaryButton, !webPreview && styles.disabledButton]}
            onPress={() => void matchWebRoute()}
            disabled={!webPreview || loading}
          >
            <Text style={styles.buttonText}>匹配原生独立路线</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.successButton, !canStartMatchedNavigation && styles.disabledButton]}
            onPress={() => setShowNaviView(true)}
            disabled={!canStartMatchedNavigation}
          >
            <Text style={styles.buttonText}>
              {matchResult?.mode === "preview_only" ? "当前仅能预览，不能启动导航" : "使用蓝线匹配结果开始导航"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.mapCard}>
          <Text style={styles.cardTitle}>线路对比</Text>
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
              {webPreview ? (
                <Polyline
                  points={webPreview.webRoute.polyline}
                  strokeWidth={8}
                  strokeColor="#0ea5e9"
                />
              ) : null}
              {matchedNativeRoute ? (
                <Polyline
                  points={getRoutePreviewPoints(matchedNativeRoute)}
                  strokeWidth={10}
                  strokeColor="#f97316"
                />
              ) : null}
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
              <Text style={styles.placeholderText}>初始化后会在这里对比 Web 路线和原生匹配结果</Text>
            </View>
          )}
          <Text style={styles.cardHint}>
            灰线: 无避让基准路线  橙线: Web 规避结果  蓝线: 原生可导航匹配结果
          </Text>
          <Text style={styles.cardHint}>
            当前动态避让区: {(scenario?.avoidAreaLabels ?? [scenario?.avoidAreaLabel || "示例避让区"]).join(" / ")}，
            {(scenario?.avoidAreaSources ?? [scenario?.avoidAreaSource ?? "fallback"])
              .map((source) => (source === "searched" ? "搜索定位" : "回退生成"))
              .join(" / ")}
          </Text>
        </View>

        {webPreview ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Web 规划结果</Text>
            <Text style={styles.cardText}>
              距离: {formatDistance(webPreview.distance)} / 时间: {formatDuration(webPreview.duration)}
            </Text>
            <Text style={styles.cardText}>折线点数: {webPreview.webRoute.polyline.length}</Text>
            <Text style={styles.cardHint}>
              这条橙线已经包含 Web 规划阶段的避让区域/避让道路结果。
            </Text>
          </View>
        ) : null}

        {matchResult ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>匹配结果</Text>
            <Text style={styles.cardText}>模式: {matchResult.mode}</Text>
            <Text style={styles.cardText}>
              平均偏差: {Math.round(matchResult.averageDeviationMeters ?? 0)} 米
            </Text>
            <Text style={styles.cardText}>
              最大偏差: {Math.round(matchResult.maxDeviationMeters ?? 0)} 米
            </Text>
            <Text style={styles.cardText}>锚点数量: {matchResult.anchorWaypoints.length}</Text>
            <Text style={styles.cardText}>
              导航方式: {matchResult.navigationUsesAnchorWaypoints ? "仍依赖锚点途经点" : "已切换为无途经点导航"}
            </Text>
            <Text style={styles.cardHint}>
              {matchResult.reason || "已拿到可导航的原生近似路线"}
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本页验证点</Text>
          <Text style={styles.feature}>• Web 规划出的 polyline 不能直接喂给官方导航 SDK</Text>
          <Text style={styles.feature}>• 本页先做 Web 规避，再只用锚点去匹配原生路线</Text>
          <Text style={styles.feature}>• 蓝线会优先切到“无途经点导航结果”；切不过去时才保留少量锚点</Text>
          <Text style={styles.feature}>• 最终进入导航的仍然是原生独立路径组，所以它是“近似跟随”，不是强制严格走 Web 折线</Text>
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
    textAlign: "center",
    paddingHorizontal: 18,
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
