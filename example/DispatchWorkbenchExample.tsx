import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import {
  ExpoGaodeMapModule,
  MapView,
  MapViewRef,
  Marker,
  Polygon,
  Polyline,
  type LatLng,
} from 'expo-gaode-map';
import { getInputTips, searchNearby, type InputTip, type POI } from 'expo-gaode-map';
import { DrivingStrategy, GaodeWebAPI } from 'expo-gaode-map-web-api';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const DEFAULT_CENTER: LatLng = { latitude: 39.9042, longitude: 116.4074 };
const riderIcon = Image.resolveAssetSource(require('./assets/qishou.png')).uri;

type TravelMode = 'driving' | 'bicycling' | 'walking';
type OrderStatus = '待接单' | '取货中' | '配送中' | '已完成';

interface DispatchOrder {
  id: string;
  code: string;
  pickup: LatLng;
  pickupName: string;
  dropoff: LatLng;
  dropoffName: string;
  tags: string[];
}

interface RouteSegment {
  points: LatLng[];
  distance: number;
  duration: number;
}

interface RawPath {
  distance?: string;
  duration?: string;
  cost?: {
    duration?: string;
  };
  steps?: Array<{
    polyline?: string;
  }>;
}

interface SearchDestination {
  name: string;
  address: string;
  point: LatLng;
}

const travelModeLabels: Record<TravelMode, string> = {
  driving: '驾车',
  bicycling: '骑行',
  walking: '步行',
};

const offsetPoint = (base: LatLng, dLat: number, dLng: number): LatLng => ({
  latitude: Number((base.latitude + dLat).toFixed(6)),
  longitude: Number((base.longitude + dLng).toFixed(6)),
});

const estimateZoom = (points: LatLng[]): number => {
  if (points.length <= 1) return 16;
  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  const latSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const lngSpan = Math.max(...longitudes) - Math.min(...longitudes);
  const span = Math.max(latSpan, lngSpan);

  if (span > 0.28) return 10;
  if (span > 0.16) return 11;
  if (span > 0.09) return 12;
  if (span > 0.05) return 13;
  if (span > 0.02) return 14;
  return 15;
};

const getCenter = (points: LatLng[]): LatLng => {
  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  return {
    latitude: (Math.max(...latitudes) + Math.min(...latitudes)) / 2,
    longitude: (Math.max(...longitudes) + Math.min(...longitudes)) / 2,
  };
};

const toMinutesLabel = (durationSeconds: number): string => {
  if (!durationSeconds || durationSeconds <= 0) return '--';
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  return `${minutes} 分钟`;
};

const toDistanceLabel = (meters: number): string => {
  if (!meters || meters <= 0) return '--';
  if (meters < 1000) return `${Math.round(meters)} 米`;
  return `${(meters / 1000).toFixed(1)} 公里`;
};

export default function DispatchWorkbenchExample() {
  const headerHeight = useHeaderHeight();
  const mapRef = useRef<MapViewRef | null>(null);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const api = useMemo(() => new GaodeWebAPI({ key: process.env.EXPO_PUBLIC_AMAP_WEB_KEY || '' }), []);

  const [isMapReady, setIsMapReady] = useState(false);
  const [dispatchCenter, setDispatchCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [routeStart, setRouteStart] = useState<LatLng | null>(null);
  const [riderPosition, setRiderPosition] = useState<LatLng | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ORD-1001');

  const [toPickupSegment, setToPickupSegment] = useState<RouteSegment | null>(null);
  const [toDropoffSegment, setToDropoffSegment] = useState<RouteSegment | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  const [nearbyPois, setNearbyPois] = useState<POI[]>([]);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<InputTip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customDestination, setCustomDestination] = useState<SearchDestination | null>(null);

  const [orderStatusMap, setOrderStatusMap] = useState<Record<string, OrderStatus>>({
    'ORD-1001': '待接单',
    'ORD-1002': '取货中',
    'ORD-1003': '待接单',
  });

  const orders = useMemo<DispatchOrder[]>(() => {
    const anchor = dispatchCenter;
    return [
      {
        id: 'ORD-1001',
        code: 'A1001',
        pickup: offsetPoint(anchor, 0.009, -0.007),
        pickupName: '新源里商圈门店',
        dropoff: offsetPoint(anchor, 0.021, 0.012),
        dropoffName: '亮马桥写字楼 A 座',
        tags: ['冷链', '30 分钟送达'],
      },
      {
        id: 'ORD-1002',
        code: 'A1002',
        pickup: offsetPoint(anchor, -0.004, 0.008),
        pickupName: '建国门旗舰店',
        dropoff: offsetPoint(anchor, -0.013, -0.014),
        dropoffName: '金融街公寓 2 号楼',
        tags: ['大件', '需电梯'],
      },
      {
        id: 'ORD-1003',
        code: 'A1003',
        pickup: offsetPoint(anchor, 0.002, 0.014),
        pickupName: '国贸快仓',
        dropoff: offsetPoint(anchor, 0.016, -0.016),
        dropoffName: '望京 SOHO 东区',
        tags: ['高价值', '签收拍照'],
      },
    ];
  }, [dispatchCenter]);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedOrderId) ?? orders[0];
  }, [orders, selectedOrderId]);

  const activeDropoff = customDestination?.point ?? selectedOrder.dropoff;
  const activeDropoffName = customDestination?.name ?? selectedOrder.dropoffName;

  const serviceArea = useMemo<LatLng[]>(() => {
    const anchor = dispatchCenter;
    return [
      offsetPoint(anchor, 0.03, -0.03),
      offsetPoint(anchor, 0.03, 0.03),
      offsetPoint(anchor, -0.028, 0.03),
      offsetPoint(anchor, -0.028, -0.03),
    ];
  }, [dispatchCenter]);

  const fullRoutePoints = useMemo<LatLng[]>(() => {
    const first = toPickupSegment?.points ?? [];
    const second = toDropoffSegment?.points ?? [];
    if (!first.length) return second;
    if (!second.length) return first;

    const tail = first[first.length - 1];
    const head = second[0];
    const shouldTrimSecondHead =
      Math.abs(tail.latitude - head.latitude) < 0.000001 &&
      Math.abs(tail.longitude - head.longitude) < 0.000001;

    return shouldTrimSecondHead ? [...first, ...second.slice(1)] : [...first, ...second];
  }, [toPickupSegment, toDropoffSegment]);

  const totalDistance = (toPickupSegment?.distance ?? 0) + (toDropoffSegment?.distance ?? 0);
  const totalDuration = (toPickupSegment?.duration ?? 0) + (toDropoffSegment?.duration ?? 0);

  const focusRoute = useCallback((points: LatLng[]) => {
    if (!mapRef.current || points.length === 0) return;
    mapRef.current.moveCamera(
      {
        target: getCenter(points),
        zoom: estimateZoom(points),
      },
      500,
    );
  }, []);

  const stopSimulation = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  const fetchSegment = useCallback(
    async (origin: LatLng, destination: LatLng, mode: TravelMode): Promise<RouteSegment | null> => {
      const originStr = `${origin.longitude},${origin.latitude}`;
      const destinationStr = `${destination.longitude},${destination.latitude}`;

      try {
        let rawPath: RawPath | undefined;

        if (mode === 'driving') {
          const response = await api.route.driving(originStr, destinationStr, {
            strategy: DrivingStrategy.AVOID_JAM,
            show_fields: 'polyline,cost',
          });
          rawPath = (response as { route?: { paths?: RawPath[] } }).route?.paths?.[0];
        } else if (mode === 'bicycling') {
          const response = await api.route.bicycling(originStr, destinationStr, {
            show_fields: 'polyline,cost',
          });
          rawPath = (response as { route?: { paths?: RawPath[] } }).route?.paths?.[0];
        } else {
          const response = await api.route.walking(originStr, destinationStr, {
            show_fields: 'polyline,cost',
          });
          rawPath = (response as { route?: { paths?: RawPath[] } }).route?.paths?.[0];
        }

        if (!rawPath) return null;

        let points: LatLng[] = [];
        for (const step of rawPath.steps ?? []) {
          if (step.polyline) {
            points = points.concat(ExpoGaodeMapModule.parsePolyline(step.polyline));
          }
        }

        if (points.length > 350) {
          points = ExpoGaodeMapModule.simplifyPolyline(points, 3);
        }

        return {
          points,
          distance: Number(rawPath.distance ?? 0),
          duration: Number(rawPath.cost?.duration ?? rawPath.duration ?? 0),
        };
      } catch (error) {
        console.error('[DispatchWorkbench] 获取路径失败:', error);
        return null;
      }
    },
    [api],
  );

  const fetchNearbyStations = useCallback(async (point: LatLng) => {
    try {
      const result = await searchNearby({
        center: point,
        keyword: '便利店',
        radius: 1500,
        pageSize: 8,
        pageNum: 1,
      });
      setNearbyPois(result.pois?.slice(0, 6) ?? []);
    } catch (error) {
      console.warn('[DispatchWorkbench] 周边搜索失败:', error);
      setNearbyPois([]);
    }
  }, []);

  const planSelectedOrder = useCallback(async () => {
    if (!routeStart || !selectedOrder) return;

    stopSimulation();
    setSimulationProgress(0);
    setIsPlanning(true);

    const first = await fetchSegment(routeStart, selectedOrder.pickup, travelMode);
    const second = await fetchSegment(selectedOrder.pickup, activeDropoff, travelMode);

    if (!first || !second || (!first.points.length && !second.points.length)) {
      setToPickupSegment(null);
      setToDropoffSegment(null);
      setIsPlanning(false);
      Alert.alert('错误', '路线规划失败，请检查 Web Key 或网络后重试');
      return;
    }

    setToPickupSegment(first);
    setToDropoffSegment(second);
    setIsPlanning(false);

    const cameraPoints = [routeStart, selectedOrder.pickup, activeDropoff, ...first.points, ...second.points];
    focusRoute(cameraPoints);
    fetchNearbyStations(selectedOrder.pickup);

    setOrderStatusMap((prev) => ({
      ...prev,
      [selectedOrder.id]: prev[selectedOrder.id] === '已完成' ? '已完成' : '取货中',
    }));
  }, [
    routeStart,
    selectedOrder,
    travelMode,
    activeDropoff,
    stopSimulation,
    fetchSegment,
    focusRoute,
    fetchNearbyStations,
  ]);

  const handleLocateMe = useCallback(async () => {
    try {
      const location = await ExpoGaodeMapModule.getCurrentLocation();
      if (!location) {
        Alert.alert('错误', '未获取到定位信息');
        return;
      }

      const point = { latitude: location.latitude, longitude: location.longitude };
      setDispatchCenter(point);
      setRouteStart(point);
      setRiderPosition(point);
      mapRef.current?.moveCamera({ target: point, zoom: 16 }, 400);
      Alert.alert('成功', '已同步当前位置');
    } catch (error) {
      Alert.alert('错误', '定位失败，请检查权限');
    }
  }, []);

  const startSimulation = useCallback(() => {
    if (fullRoutePoints.length < 2 || !selectedOrder) {
      Alert.alert('提示', '请先生成有效路线');
      return;
    }

    const totalLength = ExpoGaodeMapModule.calculatePathLength(fullRoutePoints);
    if (!totalLength || totalLength <= 0) {
      Alert.alert('错误', '路线点不足，无法模拟');
      return;
    }

    stopSimulation();
    setIsSimulating(true);
    setSimulationProgress(0);

    setOrderStatusMap((prev) => ({
      ...prev,
      [selectedOrder.id]: '配送中',
    }));

    const speedMetersPerTick =
      travelMode === 'walking' ? 35 : travelMode === 'bicycling' ? 110 : 180;

    let traveledMeters = 0;

    simulationTimerRef.current = setInterval(() => {
      traveledMeters = Math.min(totalLength, traveledMeters + speedMetersPerTick);
      const point = ExpoGaodeMapModule.getPointAtDistance(fullRoutePoints, traveledMeters) as
        | { latitude: number; longitude: number; angle: number }
        | null;

      if (!point) return;

      const nextPoint = { latitude: point.latitude, longitude: point.longitude };
      setRiderPosition(nextPoint);
      setSimulationProgress(Math.round((traveledMeters / totalLength) * 100));

      mapRef.current?.moveCamera(
        {
          target: nextPoint,
          zoom: 17,
          bearing: point.angle,
        },
        800,
      );

      if (traveledMeters >= totalLength) {
        stopSimulation();
        setSimulationProgress(100);
        setRouteStart(activeDropoff);
        setRiderPosition(activeDropoff);
        setOrderStatusMap((prev) => ({
          ...prev,
          [selectedOrder.id]: '已完成',
        }));
        const currentIndex = orders.findIndex((order) => order.id === selectedOrder.id);
        const nextOrder = orders[(currentIndex + 1) % orders.length];
        if (nextOrder && nextOrder.id !== selectedOrder.id) {
          setSelectedOrderId(nextOrder.id);
          setCustomDestination(null);
        }
        Alert.alert('成功', `订单 ${selectedOrder.code} 已送达`);
      }
    }, 1000);
  }, [activeDropoff, fullRoutePoints, orders, selectedOrder, stopSimulation, travelMode]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const permission = await ExpoGaodeMapModule.checkLocationPermission();
        if (!permission.granted) {
          await ExpoGaodeMapModule.requestLocationPermission();
        }

        const location = await ExpoGaodeMapModule.getCurrentLocation();
        const initial = location
          ? { latitude: location.latitude, longitude: location.longitude }
          : DEFAULT_CENTER;

        if (!mounted) return;
        setDispatchCenter(initial);
        setRouteStart(initial);
        setRiderPosition(initial);
      } catch (error) {
        console.warn('[DispatchWorkbench] 初始化定位失败，使用默认坐标:', error);
        if (!mounted) return;
        setDispatchCenter(DEFAULT_CENTER);
        setRouteStart(DEFAULT_CENTER);
        setRiderPosition(DEFAULT_CENTER);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
      stopSimulation();
    };
  }, [stopSimulation]);

  useEffect(() => {
    if (!routeStart) return;
    planSelectedOrder();
  }, [routeStart, selectedOrderId, travelMode, customDestination, planSelectedOrder]);

  useEffect(() => {
    if (!searchText.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const result = await getInputTips({ keyword: searchText, city: '北京' });
        setSuggestions(result.tips ?? []);
      } catch (error) {
        console.warn('[DispatchWorkbench] 输入提示失败:', error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSelectTip = (tip: InputTip) => {
    if (!tip.location) {
      Alert.alert('提示', '该候选缺少坐标，请换一个');
      return;
    }

    const destination: SearchDestination = {
      name: tip.name,
      address: tip.address || tip.adName || '',
      point: {
        latitude: tip.location.latitude,
        longitude: tip.location.longitude,
      },
    };

    setCustomDestination(destination);
    setSearchText(tip.name);
    setSuggestions([]);
    Keyboard.dismiss();
    Alert.alert('成功', '已替换当前订单终点，正在重算路线');
  };

  const resetDestination = () => {
    setCustomDestination(null);
    setSearchText('');
    setSuggestions([]);
  };

  const renderSuggestion = ({ item }: { item: InputTip }) => (
    <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectTip(item)}>
      <Ionicons name="location-sharp" size={16} color="#6b7280" />
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.suggestionAddress} numberOfLines={1}>
          {(item.adName || '') + (item.address || '')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
    </TouchableOpacity>
  );

  const activeStatus = orderStatusMap[selectedOrder.id] ?? '待接单';

  if (!routeStart || !riderPosition) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.loadingText}>正在初始化实战示例...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={(ref) => {
          mapRef.current = ref;
        }}
        style={styles.map}
        initialCameraPosition={{ target: routeStart, zoom: 14 }}
        myLocationEnabled
        trafficEnabled
        compassEnabled
        indoorViewEnabled
        userLocationRepresentation={{
          showsAccuracyRing: true,
          showsHeadingIndicator: true,
        }}
        onLoad={() => setIsMapReady(true)}
      >
        <Polygon
          points={serviceArea}
          fillColor="rgba(22,119,255,0.08)"
          strokeColor="rgba(22,119,255,0.7)"
          strokeWidth={2}
          zIndex={1}
        />

        {orders.map((order) => (
          <Marker
            key={order.id}
            position={order.pickup}
            title={`取货点 · ${order.code}`}
            snippet={order.pickupName}
            pinColor={order.id === selectedOrder.id ? 'orange' : 'blue'}
            zIndex={order.id === selectedOrder.id ? 20 : 10}
            onMarkerPress={() => {
              setSelectedOrderId(order.id);
              setCustomDestination(null);
            }}
          />
        ))}

        <Marker
          position={activeDropoff}
          title={`送达点 · ${selectedOrder.code}`}
          snippet={activeDropoffName}
          pinColor="red"
          zIndex={30}
        />

        <Marker
          position={riderPosition}
          title="骑手"
          snippet="实时位置"
          icon={riderIcon}
          iconWidth={36}
          iconHeight={36}
          zIndex={40}
        />

        {toPickupSegment?.points && toPickupSegment.points.length > 1 && (
          <Polyline points={toPickupSegment.points} strokeColor="#4f46e5" strokeWidth={7} zIndex={8} />
        )}

        {toDropoffSegment?.points && toDropoffSegment.points.length > 1 && (
          <Polyline points={toDropoffSegment.points} strokeColor="#10b981" strokeWidth={7} zIndex={9} />
        )}

        {nearbyPois.map((poi) =>
          poi.location ? (
            <Marker
              key={`poi-${poi.id}`}
              position={{ latitude: poi.location.latitude, longitude: poi.location.longitude }}
              title={poi.name}
              snippet={poi.address || poi.adName || '周边补给点'}
              pinColor="purple"
              zIndex={5}
            />
          ) : null,
        )}
      </MapView>

      <View style={[styles.topPanel, { top:  8 }]}> 
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.panelTitle}>配送调度实战示例</Text>
            <Text style={styles.panelSubtitle}>多订单 + 路线策略 + 搜索改点 + 实时模拟</Text>
          </View>
          <View style={styles.mapBadge}>
            <Ionicons name={isMapReady ? 'checkmark-circle' : 'time-outline'} size={14} color="#fff" />
            <Text style={styles.mapBadgeText}>{isMapReady ? '地图已就绪' : '加载中'}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeRow}>
          {(Object.keys(travelModeLabels) as TravelMode[]).map((mode) => {
            const active = mode === travelMode;
            return (
              <Pressable
                key={mode}
                style={[styles.modeChip, active && styles.modeChipActive]}
                onPress={() => setTravelMode(mode)}
              >
                <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                  {travelModeLabels[mode]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orderRow}>
          {orders.map((order) => {
            const isActive = order.id === selectedOrder.id;
            const status = orderStatusMap[order.id] ?? '待接单';
            return (
              <Pressable
                key={order.id}
                style={[styles.orderCard, isActive && styles.orderCardActive]}
                onPress={() => {
                  setSelectedOrderId(order.id);
                  setCustomDestination(null);
                }}
              >
                <Text style={[styles.orderCode, isActive && styles.orderCodeActive]}>{order.code}</Text>
                <Text style={[styles.orderStatus, isActive && styles.orderStatusActive]}>{status}</Text>
                <Text style={styles.orderPoint} numberOfLines={1}>
                  取: {order.pickupName}
                </Text>
                <Text style={styles.orderPoint} numberOfLines={1}>
                  送: {order.dropoffName}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="输入新终点（例如：首都医科大学）"
            placeholderTextColor="#9ca3af"
            autoCorrect={false}
          />
          {!!customDestination && (
            <TouchableOpacity onPress={resetDestination}>
              <Text style={styles.resetText}>恢复默认</Text>
            </TouchableOpacity>
          )}
        </View>

        {isSearching ? <ActivityIndicator size="small" color="#1677ff" style={styles.searchLoading} /> : null}

        {suggestions.length > 0 ? (
          <View style={styles.suggestionListContainer}>
            <FlatList
              keyboardShouldPersistTaps="always"
              data={suggestions.slice(0, 4)}
              keyExtractor={(item, index) => `${item.id || item.name}-${index}`}
              renderItem={renderSuggestion}
            />
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>当前订单</Text>
            <Text style={styles.statValue}>{selectedOrder.code}</Text>
            <Text style={styles.statDesc}>{activeStatus}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>总里程</Text>
            <Text style={styles.statValue}>{toDistanceLabel(totalDistance)}</Text>
            <Text style={styles.statDesc}>{travelModeLabels[travelMode]}策略</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>预计耗时</Text>
            <Text style={styles.statValue}>{toMinutesLabel(totalDuration)}</Text>
            <Text style={styles.statDesc}>周边点位 {nearbyPois.length} 个</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleLocateMe}>
            <Ionicons name="locate" size={15} color="#111827" />
            <Text style={styles.secondaryButtonText}>同步定位</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={planSelectedOrder}>
            <Ionicons name="refresh" size={15} color="#111827" />
            <Text style={styles.secondaryButtonText}>重算路线</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, isSimulating && styles.primaryButtonDanger]}
            onPress={isSimulating ? stopSimulation : startSimulation}
          >
            <Ionicons name={isSimulating ? 'stop' : 'play'} size={15} color="#fff" />
            <Text style={styles.primaryButtonText}>{isSimulating ? '停止模拟' : '开始配送'}</Text>
          </TouchableOpacity>
        </View>

        {(isPlanning || isSimulating) && (
          <View style={styles.progressWrap}>
            <View style={styles.progressMeta}>
              <Text style={styles.progressTitle}>{isPlanning ? '路线规划中...' : '配送模拟进行中'}</Text>
              <Text style={styles.progressValue}>{isPlanning ? '请稍候' : `${simulationProgress}%`}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${isPlanning ? 15 : simulationProgress}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    gap: 10,
  },
  loadingText: {
    color: '#374151',
    fontSize: 14,
  },
  map: {
    flex: 1,
  },
  topPanel: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  panelSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#1677ff',
  },
  mapBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  modeRow: {
    gap: 8,
    paddingVertical: 4,
  },
  modeChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e5e7eb',
  },
  modeChipActive: {
    backgroundColor: '#111827',
  },
  modeChipText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: '#fff',
  },
  orderRow: {
    gap: 8,
    paddingTop: 6,
    paddingBottom: 2,
  },
  orderCard: {
    width: 168,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  orderCardActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  orderCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  orderCodeActive: {
    color: '#1d4ed8',
  },
  orderStatus: {
    marginTop: 2,
    fontSize: 11,
    color: '#6b7280',
  },
  orderStatusActive: {
    color: '#2563eb',
  },
  orderPoint: {
    marginTop: 3,
    fontSize: 11,
    color: '#4b5563',
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    gap: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 10,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  resetText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  searchLoading: {
    marginTop: 2,
  },
  suggestionListContainer: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    maxHeight: 160,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  suggestionAddress: {
    marginTop: 1,
    fontSize: 11,
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 11,
  },
  statValue: {
    marginTop: 2,
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  statDesc: {
    marginTop: 2,
    color: '#4b5563',
    fontSize: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  primaryButton: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: '#1677ff',
  },
  primaryButtonDanger: {
    backgroundColor: '#ef4444',
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  progressWrap: {
    marginTop: 2,
    gap: 6,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
  progressValue: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1677ff',
  },
});
