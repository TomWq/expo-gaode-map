import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  clearIndependentRoute,
  independentDriveRoute,
  MapView,
  Marker,
  Polyline,
  type IndependentRouteResult,
  type MapViewRef,
  type NaviPoint,
  type NaviViewRef,
  type RouteResult,
} from "expo-gaode-map-navigation";
import {
  getInputTips,
  initSearch,
  reGeocode,
  type InputTip,
} from "expo-gaode-map-search";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  buildDemoScenario,
  ensureDemoSdkReady,
  formatDistance,
  formatDuration,
  getRoutePreviewPoints,
} from "@/lib/gaode-demo";
import { EmbeddedNaviView } from "@/lib/navigation-ui";
import { useHideNavigationHeader } from "@/lib/useHideNavigationHeader";

type RouteFieldValue = {
  label: string;
  point: NaviPoint;
  address?: string;
  poiId?: string;
};

type WaypointField = {
  key: string;
  input: string;
  selected: RouteFieldValue | null;
};

type RouteTone = "primary" | "success" | "warm" | "neutral";

const MAX_WAYPOINTS = 5;
const DEFAULT_CITY = "北京";
const PREVIEW_EDGE_MARKER_SIZE = 32;
const PREVIEW_WAYPOINT_MARKER_WIDTH = 56;
const PREVIEW_WAYPOINT_MARKER_HEIGHT = 36;
const FALLBACK_START_POINT: NaviPoint = {
  latitude: 39.908823,
  longitude: 116.39747,
};

function createWaypointField(index: number): WaypointField {
  return {
    key: `waypoint-${index}`,
    input: "",
    selected: null,
  };
}

function createFieldValue(point: NaviPoint, label: string, address?: string): RouteFieldValue {
  return {
    label,
    point,
    address,
  };
}

async function withTimeout<T>(task: Promise<T>, timeoutMs: number, fallback: () => T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      task,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback()), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function getBestPointLabel(result: Awaited<ReturnType<typeof reGeocode>>, fallback: string): string {
  return (
    result.pois[0]?.name ||
    result.addressComponent.building ||
    result.addressComponent.neighborhood ||
    result.formattedAddress ||
    fallback
  );
}

async function resolvePointPresentation(
  point: NaviPoint,
  fallback: string
): Promise<{ label: string; address?: string; city?: string }> {
  try {
    const result = await withTimeout(
      reGeocode({
        location: point,
        radius: 200,
        requireExtension: true,
      }),
      2500,
      () => ({
        formattedAddress: fallback,
        addressComponent: {
          province: "",
          city: "",
          district: "",
          township: "",
          neighborhood: "",
          building: "",
          cityCode: "",
          adCode: "",
          streetNumber: {
            street: "",
            number: "",
            direction: "",
            distance: 0,
          },
          businessAreas: [],
        },
        pois: [],
        roads: [],
        roadCrosses: [],
        aois: [],
      })
    );

    return {
      label: getBestPointLabel(result, fallback),
      address: result.formattedAddress || undefined,
      city: result.addressComponent.city || undefined,
    };
  } catch {
    return { label: fallback };
  }
}

function getRouteTone(route: RouteResult, mainPathIndex: number, index: number): RouteTone {
  if (index === mainPathIndex) {
    return "primary";
  }
  if (route.trafficLightCount != null && route.trafficLightCount <= 6) {
    return "success";
  }
  if (route.distance <= 6000) {
    return "warm";
  }
  return "neutral";
}

function buildRouteLabel(
  route: RouteResult,
  index: number,
  mainPathIndex: number,
  shortestDistanceIndex: number,
  fewestLightsIndex: number
): string {
  if (index === mainPathIndex) {
    return "推荐";
  }
  if (index === fewestLightsIndex) {
    return "红绿灯少";
  }
  if (index === shortestDistanceIndex) {
    return "距离短";
  }
  if ((route.tollCost ?? 0) === 0) {
    return "少收费";
  }
  return `方案 ${index + 1}`;
}

function buildMarkerText(kind: "from" | "to" | "waypoint", index?: number): string {
  if (kind === "from") {
    return "起";
  }
  if (kind === "to") {
    return "终";
  }
  return String((index ?? 0) + 1);
}

function resolveTipTitle(tip: InputTip): string {
  return tip.name?.trim() || tip.address?.trim() || "未命名地点";
}

function resolveTipSubtitle(tip: InputTip): string {
  return [tip.address, tip.adName, tip.cityName].filter(Boolean).join(" · ");
}

function getRouteLineStyle(
  variant: "selected" | "other",
  zoom: number
) {
  const compact =
    zoom < 11.8
      ? {
          selectedHaloWidth: 11.5,
          selectedMainWidth: 8.2,
          selectedCoreWidth: 5,
          fallbackHaloWidth: 4.8,
          fallbackMainWidth: 2.6,
        }
      : zoom < 12.8
        ? {
            selectedHaloWidth: 13.5,
            selectedMainWidth: 9.6,
            selectedCoreWidth: 5.9,
            fallbackHaloWidth: 5.4,
            fallbackMainWidth: 3.1,
          }
        : {
            selectedHaloWidth: 15.5,
            selectedMainWidth: 11.4,
            selectedCoreWidth: 7,
            fallbackHaloWidth: 6.2,
            fallbackMainWidth: 3.6,
          };

  if (variant === "selected") {
    return {
      haloColor: "rgba(255,255,255,0.96)",
      mainColor: "#4f7dff",
      coreColor: null,
      haloWidth: compact.selectedHaloWidth,
      mainWidth: compact.selectedMainWidth,
      coreWidth: 0,
    };
  }

  return {
    haloColor: "rgba(255,255,255,0.42)",
    mainColor: "rgba(148,163,184,0.58)",
    coreColor: null,
    haloWidth: compact.fallbackHaloWidth,
    mainWidth: compact.fallbackMainWidth,
    coreWidth: 0,
  };
}

function getPreviewFitOptions(selectedRoute: RouteResult | null) {
  if (!selectedRoute) {
    return {
      duration: 380,
      paddingFactor: 0.62,
      minZoom: 11.7,
      maxZoom: 14.2,
      singlePointZoom: 15.8,
    };
  }

  const distance = selectedRoute.distance ?? 0;

  if (distance >= 18000) {
    return {
      duration: 460,
      paddingFactor: 0.9,
      minZoom: 9.6,
      maxZoom: 16.6,
      singlePointZoom: 15.2,
    };
  }

  if (distance >= 12000) {
    return {
      duration: 460,
      paddingFactor: 0.78,
      minZoom: 10.4,
      maxZoom: 16.9,
      singlePointZoom: 15.4,
    };
  }

  if (distance >= 7000) {
    return {
      duration: 460,
      paddingFactor: 0.62,
      minZoom: 11.2,
      maxZoom: 17,
      singlePointZoom: 15.6,
    };
  }

  return {
    duration: 460,
    paddingFactor: 0.5,
    minZoom: 12.2,
    maxZoom: 14.2,
    singlePointZoom: 15.8,
  };
}

export default function RoutePickerExampleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const mapRef = React.useRef<MapViewRef>(null);
  const naviRef = React.useRef<NaviViewRef>(null);
  const activeTokenRef = React.useRef<number | null>(null);
  const waypointSeedRef = React.useRef(2);

  const [bootstrapping, setBootstrapping] = React.useState(true);
  const [planning, setPlanning] = React.useState(false);
  const [tipLoading, setTipLoading] = React.useState(false);
  const [city, setCity] = React.useState(DEFAULT_CITY);
  const [statusText, setStatusText] = React.useState("正在初始化地图与搜索能力");
  const [fromInput, setFromInput] = React.useState("");
  const [fromSelection, setFromSelection] = React.useState<RouteFieldValue | null>(null);
  const [toInput, setToInput] = React.useState("");
  const [toSelection, setToSelection] = React.useState<RouteFieldValue | null>(null);
  const [waypoints, setWaypoints] = React.useState<WaypointField[]>([createWaypointField(1)]);
  const [activeFieldId, setActiveFieldId] = React.useState<string | null>(null);
  const [tips, setTips] = React.useState<InputTip[]>([]);
  const [routeResult, setRouteResult] = React.useState<IndependentRouteResult | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = React.useState(0);
  const [showNaviView, setShowNaviView] = React.useState(false);
  const [previewZoom, setPreviewZoom] = React.useState(13.2);
  const [requestedNaviType, setRequestedNaviType] = React.useState(
    Platform.OS === "android" ? 0 : 1
  );
  const [topPanelHeight, setTopPanelHeight] = React.useState(0);
  const [bottomPanelHeight, setBottomPanelHeight] = React.useState(0);

  useHideNavigationHeader(true);

  const routes = routeResult?.routes ?? [];
  const selectedRoute = routes[selectedRouteIndex] ?? null;
  const selectedPoints = React.useMemo(() => {
    const points: NaviPoint[] = [];
    if (fromSelection?.point) {
      points.push(fromSelection.point);
    }
    for (const waypoint of waypoints) {
      if (waypoint.selected?.point) {
        points.push(waypoint.selected.point);
      }
    }
    if (toSelection?.point) {
      points.push(toSelection.point);
    }
    return points;
  }, [fromSelection, toSelection, waypoints]);

  const previewPoints = React.useMemo(() => {
    if (selectedRoute) {
      return getRoutePreviewPoints(selectedRoute);
    }
    return selectedPoints;
  }, [selectedPoints, selectedRoute]);

  const activeKeyword = React.useMemo(() => {
    if (!activeFieldId) {
      return "";
    }
    if (activeFieldId === "from") {
      return fromInput;
    }
    if (activeFieldId === "to") {
      return toInput;
    }
    const waypoint = waypoints.find((item) => item.key === activeFieldId);
    return waypoint?.input ?? "";
  }, [activeFieldId, fromInput, toInput, waypoints]);

  const shortestDistanceIndex = React.useMemo(() => {
    if (routes.length === 0) {
      return -1;
    }
    return routes.reduce((bestIndex, route, index, currentRoutes) => {
      if (bestIndex < 0) {
        return index;
      }
      return route.distance < currentRoutes[bestIndex].distance ? index : bestIndex;
    }, -1);
  }, [routes]);

  const fewestLightsIndex = React.useMemo(() => {
    if (routes.length === 0) {
      return -1;
    }
    return routes.reduce((bestIndex, route, index, currentRoutes) => {
      const routeLights = route.trafficLightCount ?? Number.MAX_SAFE_INTEGER;
      if (bestIndex < 0) {
        return index;
      }
      const bestLights = currentRoutes[bestIndex].trafficLightCount ?? Number.MAX_SAFE_INTEGER;
      return routeLights < bestLights ? index : bestIndex;
    }, -1);
  }, [routes]);

  React.useEffect(() => {
    return () => {
      if (activeTokenRef.current != null) {
        void clearIndependentRoute({ token: activeTokenRef.current }).catch(() => {});
      }
    };
  }, []);

  const compensatePreviewViewport = React.useCallback(async () => {
    if (!mapRef.current || windowWidth <= 0 || windowHeight <= 0) {
      return;
    }

    const topBlocked = Math.max(insets.top, 12) + topPanelHeight + 10;
    const bottomBlocked = Math.max(insets.bottom, 14) + bottomPanelHeight + 10;
    const visibleHeight = windowHeight - topBlocked - bottomBlocked;

    if (visibleHeight <= 120) {
      return;
    }

    const screenCenterY = windowHeight / 2;
    const visibleCenterY = topBlocked + visibleHeight / 2;
    const rawDeltaY = visibleCenterY - screenCenterY;
    const dampedDeltaY = Math.max(-72, Math.min(72, rawDeltaY * 0.38));

    if (Math.abs(dampedDeltaY) < 18) {
      return;
    }

    const compensatedPoint = {
      x: windowWidth / 2,
      y: screenCenterY + dampedDeltaY,
    };

    try {
      const [target, camera] = await Promise.all([
        mapRef.current.getLatLng(compensatedPoint),
        mapRef.current.getCameraPosition(),
      ]);

      await mapRef.current.moveCamera(
        {
          target,
          zoom: camera.zoom,
          bearing: camera.bearing,
          tilt: camera.tilt,
        },
        220
      );
    } catch {
      // ignore camera compensation failures and keep the fitted result
    }
  }, [
    bottomPanelHeight,
    insets.bottom,
    insets.top,
    topPanelHeight,
    windowHeight,
    windowWidth,
  ]);

  React.useEffect(() => {
    if (previewPoints.length < 2) {
      return;
    }

    const shouldCompensateViewport = Boolean(routeResult && selectedRoute);
    let cancelled = false;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          await mapRef.current?.fitToCoordinates(
            previewPoints,
            getPreviewFitOptions(selectedRoute)
          );

          if (cancelled) {
            return;
          }

          if (shouldCompensateViewport) {
            await compensatePreviewViewport();
          }
        } catch {
          // keep silent; planning UI already handles route errors elsewhere
        }
      })();
    }, 160);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [compensatePreviewViewport, previewPoints, routeResult, selectedRoute]);

  React.useEffect(() => {
    if (!activeFieldId) {
      setTips([]);
      setTipLoading(false);
      return;
    }

    const keyword = activeKeyword.trim();
    if (keyword.length < 2) {
      setTips([]);
      setTipLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setTipLoading(true);
      void getInputTips({
        keyword,
        city: city.trim() || undefined,
      })
        .then((result) => {
          setTips((result.tips ?? []).filter((tip) => tip.location != null));
        })
        .catch(() => {
          setTips([]);
        })
        .finally(() => {
          setTipLoading(false);
        });
    }, 260);

    return () => clearTimeout(timer);
  }, [activeFieldId, activeKeyword, city]);

  React.useEffect(() => {
    if (!showNaviView || !routeResult) {
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
              "这条独立路径组在当前高德 Android SDK 下会拒绝模拟导航启动。你可以先切回 GPS 导航验证自定义路线选择页。"
            );
            return;
          }
          Alert.alert("启动导航失败", message);
        });
    }, 360);

    return () => clearTimeout(timer);
  }, [requestedNaviType, routeResult, selectedRouteIndex, showNaviView]);

  React.useEffect(() => {
    const initialize = async () => {
      try {
        setBootstrapping(true);
        initSearch();
        const currentLocation = await withTimeout(
          ensureDemoSdkReady(),
          6000,
          () => FALLBACK_START_POINT
        );
        setBootstrapping(false);
        const demoScenario = buildDemoScenario(currentLocation);

        const [fromMeta, waypointMeta, toMeta] = await Promise.all([
          resolvePointPresentation(currentLocation, "我的位置"),
          resolvePointPresentation(demoScenario.waypoints[0], "演示途经点"),
          resolvePointPresentation(demoScenario.to, "演示终点"),
        ]);

        setCity(fromMeta.city || DEFAULT_CITY);
        setFromSelection(createFieldValue(currentLocation, fromMeta.label, fromMeta.address));
        setFromInput(fromMeta.label);
        setToSelection(createFieldValue(demoScenario.to, toMeta.label, toMeta.address));
        setToInput(toMeta.label);
        setWaypoints([
          {
            key: "waypoint-1",
            input: waypointMeta.label,
            selected: createFieldValue(
              demoScenario.waypoints[0],
              waypointMeta.label,
              waypointMeta.address
            ),
          },
        ]);
        waypointSeedRef.current = 2;
        setStatusText(
          currentLocation === FALLBACK_START_POINT
            ? "定位较慢，已切到北京默认示例点位。你也可以手动选起点、终点和途经点后直接规划。"
            : "已填入一条演示路线。你可以直接规划，也可以替换为自己的起点、终点和多个途经点。"
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setStatusText(`初始化失败: ${message}`);
        Alert.alert("初始化失败", message);
      } finally {
        setBootstrapping(false);
      }
    };

    void initialize();
  }, []);

  const setWaypointInput = React.useCallback((waypointKey: string, value: string) => {
    setWaypoints((current) =>
      current.map((item) =>
        item.key === waypointKey
          ? {
              ...item,
              input: value,
              selected: item.selected?.label === value ? item.selected : null,
            }
          : item
      )
    );
  }, []);

  const handleSwap = React.useCallback(() => {
    setFromInput(toInput);
    setFromSelection(toSelection);
    setToInput(fromInput);
    setToSelection(fromSelection);
    setStatusText("已交换起点和终点。重新规划后会刷新候选路线。");
  }, [fromInput, fromSelection, toInput, toSelection]);

  const resetRoutePreview = React.useCallback(async () => {
    if (activeTokenRef.current != null) {
      await clearIndependentRoute({ token: activeTokenRef.current }).catch(() => {});
      activeTokenRef.current = null;
    }
    setRouteResult(null);
    setSelectedRouteIndex(0);
  }, []);

  const applySelectedField = React.useCallback(
    (fieldId: string, value: RouteFieldValue) => {
      Keyboard.dismiss();
      if (fieldId === "from") {
        setFromInput(value.label);
        setFromSelection(value);
      } else if (fieldId === "to") {
        setToInput(value.label);
        setToSelection(value);
      } else {
        setWaypoints((current) =>
          current.map((item) =>
            item.key === fieldId
              ? {
                  ...item,
                  input: value.label,
                  selected: value,
                }
              : item
          )
        );
      }
      setActiveFieldId(null);
      setTips([]);
    },
    []
  );

  const handleTipPress = React.useCallback(
    (tip: InputTip) => {
      if (!activeFieldId || !tip.location) {
        return;
      }

      applySelectedField(activeFieldId, {
        label: resolveTipTitle(tip),
        address: tip.address,
        poiId: tip.id,
        point: tip.location,
      });
      setStatusText(`已选中 ${resolveTipTitle(tip)}，可以重新规划路线。`);
    },
    [activeFieldId, applySelectedField]
  );

  const handleUseCurrentLocation = React.useCallback(async () => {
    try {
      setBootstrapping(true);
      const currentLocation = await ensureDemoSdkReady();
      const presentation = await resolvePointPresentation(currentLocation, "我的位置");
      setFromSelection(createFieldValue(currentLocation, presentation.label, presentation.address));
      setFromInput(presentation.label);
      setCity(presentation.city || city);
      setStatusText("起点已更新为当前位置。");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("定位失败", message);
    } finally {
      setBootstrapping(false);
    }
  }, [city]);

  const handleAddWaypoint = React.useCallback(() => {
    setWaypoints((current) => {
      if (current.length >= MAX_WAYPOINTS) {
        return current;
      }
      const nextField = createWaypointField(waypointSeedRef.current);
      waypointSeedRef.current += 1;
      return [...current, nextField];
    });
  }, []);

  const handleRemoveWaypoint = React.useCallback((waypointKey: string) => {
    setWaypoints((current) => current.filter((item) => item.key !== waypointKey));
    if (activeFieldId === waypointKey) {
      setActiveFieldId(null);
      setTips([]);
    }
  }, [activeFieldId]);

  const planRoutes = React.useCallback(async () => {
    if (!fromSelection?.point || !toSelection?.point) {
      Alert.alert("信息不完整", "请先选择起点和终点。");
      return;
    }

    const typedButUnresolvedWaypoint = waypoints.find(
      (item) => item.input.trim().length > 0 && !item.selected?.point
    );
    if (typedButUnresolvedWaypoint) {
      Alert.alert("途经点未确认", "请从搜索建议中选择途经点，或清空这一行。");
      return;
    }

    try {
      Keyboard.dismiss();
      setPlanning(true);
      await resetRoutePreview();

      const result = await independentDriveRoute({
        from: {
          ...fromSelection.point,
          name: fromSelection.label,
          poiId: fromSelection.poiId,
        },
        to: {
          ...toSelection.point,
          name: toSelection.label,
          poiId: toSelection.poiId,
        },
        waypoints: waypoints
          .map((item) => item.selected)
          .filter((item): item is RouteFieldValue => Boolean(item?.point))
          .map((item) => ({
            ...item.point,
            name: item.label,
            poiId: item.poiId,
          })),
        avoidCongestion: true,
        restriction: false,
      });

      activeTokenRef.current = result.token;
      setRouteResult(result);
      setSelectedRouteIndex(result.mainPathIndex);
      setStatusText(
        result.count > 1
          ? `已生成 ${result.count} 条候选路线。底部卡片切换的是实际可导航路线，点击“开始导航”会按当前选中的 routeIndex 启动。`
          : "当前只返回 1 条候选路线。通常是因为途经点较多或路径约束较强，SDK 没有给出更多可选方案。"
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatusText(`路线规划失败: ${message}`);
      Alert.alert("路线规划失败", message);
    } finally {
      setPlanning(false);
    }
  }, [fromSelection, resetRoutePreview, toSelection, waypoints]);

  const stopNavigation = React.useCallback(async () => {
    try {
      await naviRef.current?.stopNavigation();
    } catch {}
    setShowNaviView(false);
  }, []);

  const selectedWaypointMarkers = waypoints
    .map((item) => item.selected)
    .filter((item): item is RouteFieldValue => Boolean(item?.point))
    .map((item) => ({
      latitude: item.point.latitude,
      longitude: item.point.longitude,
      title: "途经",
    }));
  const selectedWaypointCount = selectedWaypointMarkers.length;
  const previewMarkerRevision = routeResult?.token ?? "draft";

  if (showNaviView && routeResult) {
    return (
      <EmbeddedNaviView
        ref={naviRef}
        style={styles.naviContainer}
        naviType={requestedNaviType}
        customWaypointMarkers={selectedWaypointMarkers}
        routeMarkerVisible={{
          showStartEndVia: selectedWaypointMarkers.length === 0,
          showFootFerry: true,
          showForbidden: true,
          showRouteStartIcon: true,
          showRouteEndIcon: true,
        }}
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
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialCameraPosition={{
          target: fromSelection?.point ?? {
            latitude: 39.908823,
            longitude: 116.39747,
          },
          zoom: 13,
        }}
        trafficEnabled
        myLocationEnabled
        compassEnabled
        onCameraIdle={(event) => {
          setPreviewZoom(event.nativeEvent.cameraPosition.zoom ?? 13.2);
        }}
      >
        {routes.map((route, index) => {
          const isSelectedRoute = index === selectedRouteIndex;
          const line = getRouteLineStyle(
            isSelectedRoute ? "selected" : "other",
            previewZoom
          );
          const points = getRoutePreviewPoints(route);
          const zBase = isSelectedRoute ? 24 : 8;

          return (
            <React.Fragment key={`route-${route.id}-${index}`}>
              <Polyline
                points={points}
                strokeWidth={line.haloWidth}
                strokeColor={line.haloColor}
                zIndex={zBase}
              />
              <Polyline
                points={points}
                strokeWidth={line.mainWidth}
                strokeColor={line.mainColor}
                zIndex={zBase + 1}
              />
              {line.coreColor ? (
                <Polyline
                  points={points}
                  strokeWidth={line.coreWidth}
                  strokeColor={line.coreColor}
                  zIndex={zBase + 2}
                />
              ) : null}
            </React.Fragment>
          );
        })}

        {fromSelection?.point ? (
          <Marker
            key={`from-${fromSelection.point.latitude}-${fromSelection.point.longitude}`}
            position={fromSelection.point}
            anchor={{ x: 0.5, y: 0.92 }}
            zIndex={50}
            cacheKey={`preview-from-${fromSelection.point.latitude.toFixed(6)}-${fromSelection.point.longitude.toFixed(6)}`}
            customViewWidth={PREVIEW_EDGE_MARKER_SIZE}
            customViewHeight={PREVIEW_EDGE_MARKER_SIZE}
          >
            <View style={[styles.mapMarker, styles.startMarker]}>
              <Text style={styles.mapMarkerText}>{buildMarkerText("from")}</Text>
            </View>
          </Marker>
        ) : null}

        {waypoints.map((waypoint, index) =>
          waypoint.selected?.point ? (
            <Marker
              key={`marker-${waypoint.key}-${previewMarkerRevision}-${waypoint.selected.point.latitude}-${waypoint.selected.point.longitude}`}
              position={waypoint.selected.point}
              anchor={{ x: 0.5, y: 1 }}
              zIndex={60 + index}
              cacheKey={`preview-waypoint-${waypoint.key}-${previewMarkerRevision}-${waypoint.selected.point.latitude.toFixed(6)}-${waypoint.selected.point.longitude.toFixed(6)}`}
              customViewWidth={PREVIEW_WAYPOINT_MARKER_WIDTH}
              customViewHeight={PREVIEW_WAYPOINT_MARKER_HEIGHT}
            >
              <View style={styles.waypointBadge}>
                <View style={styles.waypointBadgeBody}>
                  <Text style={styles.waypointBadgeText}>
                    {selectedWaypointCount > 1 ? `途${index + 1}` : "途经"}
                  </Text>
                </View>
              </View>
            </Marker>
          ) : null
        )}

        {toSelection?.point ? (
          <Marker
            key={`to-${toSelection.point.latitude}-${toSelection.point.longitude}`}
            position={toSelection.point}
            anchor={{ x: 0.5, y: 0.92 }}
            zIndex={55}
            cacheKey={`preview-to-${toSelection.point.latitude.toFixed(6)}-${toSelection.point.longitude.toFixed(6)}`}
            customViewWidth={PREVIEW_EDGE_MARKER_SIZE}
            customViewHeight={PREVIEW_EDGE_MARKER_SIZE}
          >
            <View style={[styles.mapMarker, styles.endMarker]}>
              <Text style={styles.mapMarkerText}>{buildMarkerText("to")}</Text>
            </View>
          </Marker>
        ) : null}
      </MapView>
      <View
        pointerEvents="box-none"
        style={[
          styles.overlayLayer,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 14),
          },
        ]}
      >
        <View
          style={styles.topPanel}
          onLayout={(event) => {
            setTopPanelHeight(event.nativeEvent.layout.height);
          }}
        >
          <View style={styles.formCard}>
            <View style={styles.formCardHeader}>
              <Pressable style={styles.inlineBackButton} onPress={() => router.back()} hitSlop={8}>
                <FontAwesome name="angle-left" size={18} color="#0f3c83" />
                <Text style={styles.inlineBackText}>返回</Text>
              </Pressable>
              <Text style={styles.formTitle}>自定义路线选择</Text>
              <Pressable style={styles.swapButton} onPress={handleSwap}>
                <FontAwesome name="exchange" size={14} color="#0f3c83" />
              </Pressable>
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.fieldDot, styles.startDot]} />
              <TextInput
                value={fromInput}
                onChangeText={(value) => {
                  setFromInput(value);
                  if (fromSelection?.label !== value) {
                    setFromSelection(null);
                  }
                }}
                onFocus={() => setActiveFieldId("from")}
                placeholder="输入起点"
                placeholderTextColor="#8aa0b8"
                style={styles.input}
              />
              <Pressable style={styles.inlineAction} onPress={() => void handleUseCurrentLocation()}>
                <FontAwesome name="location-arrow" size={14} color="#1269ff" />
              </Pressable>
            </View>

            {waypoints.map((waypoint, index) => (
              <View key={waypoint.key} style={styles.fieldRow}>
                <View style={[styles.fieldDot, styles.waypointDot]} />
                <TextInput
                  value={waypoint.input}
                  onChangeText={(value) => setWaypointInput(waypoint.key, value)}
                  onFocus={() => setActiveFieldId(waypoint.key)}
                  placeholder={`输入途经点 ${index + 1}`}
                  placeholderTextColor="#8aa0b8"
                  style={styles.input}
                />
                <Pressable
                  style={styles.inlineAction}
                  onPress={() => handleRemoveWaypoint(waypoint.key)}
                >
                  <FontAwesome name="minus" size={14} color="#5b728b" />
                </Pressable>
              </View>
            ))}

            <View style={styles.fieldRow}>
              <View style={[styles.fieldDot, styles.endDot]} />
              <TextInput
                value={toInput}
                onChangeText={(value) => {
                  setToInput(value);
                  if (toSelection?.label !== value) {
                    setToSelection(null);
                  }
                }}
                onFocus={() => setActiveFieldId("to")}
                placeholder="输入终点"
                placeholderTextColor="#8aa0b8"
                style={styles.input}
              />
              <View style={styles.inlineActionPlaceholder} />
            </View>

            <View style={styles.formActions}>
              <View style={styles.cityChip}>
                <FontAwesome name="map-marker" size={12} color="#4a6178" />
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="城市"
                  placeholderTextColor="#7b91a7"
                  style={styles.cityInput}
                />
              </View>

              <Pressable
                style={[
                  styles.secondaryAction,
                  waypoints.length >= MAX_WAYPOINTS && styles.disabledButton,
                ]}
                onPress={handleAddWaypoint}
                disabled={waypoints.length >= MAX_WAYPOINTS}
              >
                <FontAwesome name="plus" size={12} color="#0f3c83" />
                <Text style={styles.secondaryActionText}>途经点</Text>
              </Pressable>

              <Pressable
                style={[styles.primaryAction, planning && styles.disabledButton]}
                onPress={() =>  planRoutes()}
                disabled={planning}
              >
                <FontAwesome name="road" size={13} color="#ffffff" />
                <Text style={styles.primaryActionText}>
                  {planning ? "规划中" : "规划路线"}
                </Text>
              </Pressable>
            </View>
          </View>

          {activeFieldId && (tipLoading || tips.length > 0 || activeKeyword.trim().length >= 2) ? (
            <View style={styles.suggestionCard}>
              <View style={styles.suggestionHeader}>
                <Text style={styles.suggestionTitle}>地点建议</Text>
                {tipLoading ? <Text style={styles.suggestionHint}>搜索中...</Text> : null}
              </View>

              {tips.length > 0 ? (
                <ScrollView
                  style={styles.tipList}
                  contentContainerStyle={styles.tipListContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {tips.map((tip) => (
                    <Pressable
                      key={`${tip.id}-${tip.name}`}
                      style={styles.tipRow}
                      onPress={() => handleTipPress(tip)}
                    >
                      <View style={styles.tipIcon}>
                        <FontAwesome name="search" size={12} color="#1269ff" />
                      </View>
                      <View style={styles.tipBody}>
                        <Text style={styles.tipTitle}>{resolveTipTitle(tip)}</Text>
                        <Text style={styles.tipSubtitle}>{resolveTipSubtitle(tip)}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.emptySuggestionText}>
                  {tipLoading ? "正在获取建议..." : "继续输入 2 个以上字符，或换一个关键词。"}
                </Text>
              )}
            </View>
          ) : null}
        </View>
        <View
          style={styles.bottomPanel}
          onLayout={(event) => {
            setBottomPanelHeight(event.nativeEvent.layout.height);
          }}
        >
          <View style={styles.routeSheet}>
            <View style={styles.routeSheetHeader}>
              <View style={styles.inlineStatus}>
                <Text style={styles.inlineStatusLabel}>状态</Text>
                <Text numberOfLines={1} style={styles.inlineStatusText}>
                  {statusText}
                </Text>
              </View>

              <View style={styles.compactModeRow}>
                <Pressable
                  style={[styles.compactModeChip, requestedNaviType === 0 && styles.modeChipActive]}
                  onPress={() => setRequestedNaviType(0)}
                >
                  <Text
                    style={[styles.compactModeText, requestedNaviType === 0 && styles.modeChipTextActive]}
                  >
                    GPS
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.compactModeChip, requestedNaviType === 1 && styles.modeChipActive]}
                  onPress={() => setRequestedNaviType(1)}
                >
                  <Text
                    style={[styles.compactModeText, requestedNaviType === 1 && styles.modeChipTextActive]}
                  >
                    模拟
                  </Text>
                </Pressable>
              </View>
            </View>

            {routes.length > 0 ? (
              <View style={styles.routeCardRow}>
                {routes.slice(0, 3).map((route, index) => {
                  const tone = getRouteTone(route, routeResult?.mainPathIndex ?? 0, index);
                  const label = buildRouteLabel(
                    route,
                    index,
                    routeResult?.mainPathIndex ?? 0,
                    shortestDistanceIndex,
                    fewestLightsIndex
                  );

                  return (
                    <Pressable
                      key={`route-card-${route.id}-${index}`}
                      style={[
                        styles.routeCard,
                        tone === "primary" && styles.routeCardPrimary,
                        tone === "success" && styles.routeCardSuccess,
                        tone === "warm" && styles.routeCardWarm,
                        index === selectedRouteIndex && styles.routeCardSelected,
                      ]}
                      onPress={() => setSelectedRouteIndex(index)}
                    >
                      <Text style={styles.routeLabel}>{label}</Text>
                      <Text style={styles.routeDuration}>{formatDuration(route.duration)}</Text>
                      <Text style={styles.routeDistance}>{formatDistance(route.distance)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.routePlaceholder}>
                <Text style={styles.routePlaceholderTitle}>候选路线会显示在这里</Text>
                <Text style={styles.routePlaceholderBody}>
                  当前页面支持起点、终点和多个途经点输入。规划完成后，下方会展示最多 3 条可切换路线。
                </Text>
              </View>
            )}

            <View style={styles.footerRow}>
              <View style={styles.routeMetaBlock}>
                <Text style={styles.routeMetaTitle}>
                  {selectedRoute ? `已选 ${buildRouteLabel(
                    selectedRoute,
                    selectedRouteIndex,
                    routeResult?.mainPathIndex ?? 0,
                    shortestDistanceIndex,
                    fewestLightsIndex
                  )}` : "未开始规划"}
                </Text>
                <Text style={styles.routeMetaText}>
                  {selectedRoute
                    ? [
                        selectedRoute.trafficLightCount != null
                          ? `红绿灯 ${selectedRoute.trafficLightCount} 个`
                          : null,
                        selectedRoute.tollCost != null
                          ? `收费约 ${selectedRoute.tollCost.toFixed(0)} 元`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "该路线暂无额外摘要"
                    : "请先规划路线，然后选择一条方案开始导航。"}
                </Text>
              </View>

              <Pressable
                style={[styles.startButton, !selectedRoute && styles.disabledButton]}
                onPress={() => setShowNaviView(true)}
                disabled={!selectedRoute}
              >
                <Text style={styles.startButtonText}>开始导航</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d8e6f6",
  },
  overlayLayer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 10,
    gap: 10,
  },
  naviContainer: {
    flex: 1,
  },
  topPanel: {
    gap: 6,
  },
  swapButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef5ff",
    borderWidth: 1,
    borderColor: "#d3e3fb",
  },
  formCard: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.94)",
    gap: 2,
    boxShadow: "0px 10px 24px rgba(15, 23, 42, 0.08)",
  },
  formCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  inlineBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 72,
  },
  inlineBackText: {
    color: "#0f3c83",
    fontSize: 13,
    fontWeight: "800",
  },
  formTitle: {
    flex: 1,
    textAlign: "center",
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    // minHeight: 38,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#d5e1ef",
  },
  fieldDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  startDot: {
    backgroundColor: "#22c55e",
  },
  waypointDot: {
    backgroundColor: "#f59e0b",
  },
  endDot: {
    backgroundColor: "#ef4444",
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
    paddingVertical: 8,
  },
  inlineAction: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eaf2ff",
  },
  inlineActionPlaceholder: {
    width: 24,
    height: 24,
  },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  cityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 68,
    borderRadius: 13,
    backgroundColor: "#f3f7fb",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cityInput: {
    minWidth: 36,
    fontSize: 11,
    fontWeight: "600",
    color: "#294867",
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 13,
    backgroundColor: "#f3f7fb",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  secondaryActionText: {
    color: "#0f3c83",
    fontSize: 11,
    fontWeight: "700",
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: "auto",
    borderRadius: 15,
    backgroundColor: "#1269ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.5,
  },
  suggestionCard: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(247,251,255,0.96)",
  },
  tipList: {
    maxHeight: 180,
  },
  tipListContent: {
    paddingBottom: 2,
  },
  suggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  suggestionTitle: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "800",
  },
  suggestionHint: {
    color: "#5f7590",
    fontSize: 11,
    fontWeight: "600",
  },
  tipRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#dbe7f5",
  },
  tipIcon: {
    width: 24,
    alignItems: "center",
    paddingTop: 2,
  },
  tipBody: {
    flex: 1,
  },
  tipTitle: {
    color: "#10233d",
    fontSize: 14,
    fontWeight: "700",
  },
  tipSubtitle: {
    marginTop: 3,
    color: "#60758d",
    fontSize: 11,
    lineHeight: 16,
  },
  emptySuggestionText: {
    color: "#60758d",
    fontSize: 11,
    lineHeight: 16,
    paddingVertical: 6,
  },
  bottomPanel: {
    gap: 0,
  },
  modeChipActive: {
    backgroundColor: "#0f3c83",
  },
  modeChipTextActive: {
    color: "#ffffff",
  },
  routeSheet: {
    borderRadius: 24,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    gap: 10,
    boxShadow: "0px 12px 28px rgba(15, 23, 42, 0.1)",
  },
  routeSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineStatus: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineStatusLabel: {
    color: "#9fc7ff",
    fontSize: 9,
    fontWeight: "700",
  },
  inlineStatusText: {
    marginTop: 2,
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  compactModeRow: {
    flexDirection: "row",
    gap: 6,
  },
  compactModeChip: {
    minWidth: 54,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#eef3f8",
  },
  compactModeText: {
    color: "#45627f",
    fontSize: 11,
    fontWeight: "700",
  },
  routeCardRow: {
    flexDirection: "row",
    gap: 8,
  },
  routeCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "#eef3f8",
    borderWidth: 1,
    borderColor: "#d7e3ef",
  },
  routeCardPrimary: {
    backgroundColor: "#edf4ff",
  },
  routeCardSuccess: {
    backgroundColor: "#edf9f0",
  },
  routeCardWarm: {
    backgroundColor: "#fff5e9",
  },
  routeCardSelected: {
    borderColor: "#1269ff",
    boxShadow: "0px 10px 24px rgba(11, 79, 194, 0.16)",
  },
  routeLabel: {
    color: "#50667c",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  routeDuration: {
    marginTop: 8,
    color: "#12243c",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  routeDistance: {
    marginTop: 4,
    color: "#5c7288",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  routePlaceholder: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#f1f6fb",
  },
  routePlaceholderTitle: {
    color: "#10233d",
    fontSize: 13,
    fontWeight: "800",
  },
  routePlaceholderBody: {
    marginTop: 6,
    color: "#60758d",
    fontSize: 11,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routeMetaBlock: {
    flex: 1,
  },
  routeMetaTitle: {
    color: "#10233d",
    fontSize: 13,
    fontWeight: "800",
  },
  routeMetaText: {
    marginTop: 4,
    color: "#60758d",
    fontSize: 11,
    lineHeight: 16,
  },
  startButton: {
    minWidth: 116,
    borderRadius: 16,
    // paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1269ff",
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  mapMarker: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  mapMarkerText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  startMarker: {
    backgroundColor: "#22c55e",
  },
  waypointMarker: {
    backgroundColor: "#f59e0b",
  },
  endMarker: {
    backgroundColor: "#ef4444",
  },
  waypointBadge: {
    alignItems: "center",
  },
  waypointBadgeBody: {
    minWidth: 44,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#2f67ff",
    borderWidth: 2,
    borderColor: "#ffffff",
    boxShadow: "0px 4px 10px rgba(21, 53, 127, 0.18)",
  },
  waypointBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
});
