import React from 'react';
import {
  Image,
  type LayoutChangeEvent,
  type ImageSourcePropType,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Circle,
  ExpoGaodeMapModule,
  MapType,
  MapUI,
  MapView,
  Marker,
  Polyline,
  type LatLng,
  type MapViewRef,
} from 'expo-gaode-map';
import { subscribeTripSheetCommand } from './tripSheetBus';
import {
  buildFallbackTripDayRoutePlan,
  formatDuration,
  getCachedTripDayRoutePlan,
  getTripDayRoutePlan,
  type TripDayRoutePlan,
} from './tripRoutePlanning';

export type TripStop = {
  id: string;
  name: string;
  subtitle: string;
  time: string;
  coordinate: LatLng;
  image: ImageSourcePropType;
};

export type TripDay = {
  day: number;
  title: string;
  mood: string;
  color: string;
  stops: TripStop[];
};

type FlatStop = TripStop & {
  dayIndex: number;
  day: number;
  dayColor: string;
};

function remoteImage(uri: string): ImageSourcePropType {
  return { uri };
}

const STOP_IMAGES = {
  'd1-tiananmen': require('./assets/7630170bd05cd254104fc20ef0747a01~tplv-be4g95zd3a-image.jpeg'),
  'd1-forbidden-city': require('./assets/1c5068435af7bb410102894fe4965433~tplv-be4g95zd3a-image.jpeg'),
  'd1-jingshan': require('./assets/0ce2ee1ea2edc7d68c3b3e3f50f90686~tplv-be4g95zd3a-image.jpeg'),
  'd1-wangfujing': require('./assets/362264b57b4ab2148cd625cd00250983~tplv-be4g95zd3a-image.jpeg'),
  'd2-mutianyu': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2021/0928/20210928180255647.jpg'
  ),
  'd2-hongluosi': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2021/0928/20210928180255647.jpg'
  ),
  'd2-yanqi-lake': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2019/0619/20190619021930705.jpg'
  ),
  'd3-summer-palace': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2023/0403/cb09cc6dcac640e8f0ae87cc06b2c115.jpg'
  ),
  'd3-yuanmingyuan': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2023/0403/cb09cc6dcac640e8f0ae87cc06b2c115.jpg'
  ),
  'd3-olympic-park': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2021/0218/20210218155849212.jpg'
  ),
  'd4-nanluo': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2020/0509/20200509042230914.jpg'
  ),
  'd4-shichahai': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2020/0509/20200509042230914.jpg'
  ),
  'd4-yandai': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2020/0509/20200509042230914.jpg'
  ),
  'd4-sanlitun': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2021/0218/20210218155849212.jpg'
  ),
  'd5-universal': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2021/0928/20210928152332276.jpg@base@tag=imgScale&m=1&w=600&h=400&c=1'
  ),
  'd5-grand-canal': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2013/0315/20130315115206694.jpg@base@tag=imgScale&m=1&w=600&h=400&c=1'
  ),
  'd5-city-end': remoteImage(
    'https://r1.visitbeijing.com.cn/vbj-s/2021/0218/20210218155849212.jpg'
  ),
} as const;

export const TRIP_DAYS: TripDay[] = [
  {
    day: 1,
    title: '中轴线经典首刷',
    mood: '历史文化日',
    color: '#2563eb',
    stops: [
      {
        id: 'd1-tiananmen',
        name: '天安门广场',
        subtitle: '升旗机位 + 早高峰前打卡',
        time: '08:00',
        coordinate: { latitude: 39.9042, longitude: 116.39748 },
        image: STOP_IMAGES['d1-tiananmen'],
      },
      {
        id: 'd1-forbidden-city',
        name: '故宫午门',
        subtitle: '中轴线主线游览',
        time: '09:30',
        coordinate: { latitude: 39.91407, longitude: 116.39765 },
        image: STOP_IMAGES['d1-forbidden-city'],
      },
      {
        id: 'd1-jingshan',
        name: '景山万春亭',
        subtitle: '俯瞰故宫全景',
        time: '14:30',
        coordinate: { latitude: 39.92541, longitude: 116.39707 },
        image: STOP_IMAGES['d1-jingshan'],
      },
      {
        id: 'd1-wangfujing',
        name: '王府井步行街',
        subtitle: '夜景与晚餐',
        time: '18:30',
        coordinate: { latitude: 39.91524, longitude: 116.41189 },
        image: STOP_IMAGES['d1-wangfujing'],
      },
    ],
  },
  {
    day: 2,
    title: '长城与山景',
    mood: '轻徒步日',
    color: '#ea580c',
    stops: [
      {
        id: 'd2-mutianyu',
        name: '慕田峪长城',
        subtitle: '索道上山 + 观景步道',
        time: '08:30',
        coordinate: { latitude: 40.43777, longitude: 116.56458 },
        image: STOP_IMAGES['d2-mutianyu'],
      },
      {
        id: 'd2-hongluosi',
        name: '红螺寺景区',
        subtitle: '返程顺路打卡',
        time: '13:30',
        coordinate: { latitude: 40.37267, longitude: 116.62412 },
        image: STOP_IMAGES['d2-hongluosi'],
      },
      {
        id: 'd2-yanqi-lake',
        name: '雁栖湖观景',
        subtitle: '湖景慢游',
        time: '16:30',
        coordinate: { latitude: 40.41157, longitude: 116.68244 },
        image: STOP_IMAGES['d2-yanqi-lake'],
      },
    ],
  },
  {
    day: 3,
    title: '皇家园林线',
    mood: '湖畔慢游日',
    color: '#0f766e',
    stops: [
      {
        id: 'd3-summer-palace',
        name: '颐和园东宫门',
        subtitle: '昆明湖 + 长廊',
        time: '09:00',
        coordinate: { latitude: 39.99966, longitude: 116.27556 },
        image: STOP_IMAGES['d3-summer-palace'],
      },
      {
        id: 'd3-yuanmingyuan',
        name: '圆明园遗址',
        subtitle: '历史遗迹线',
        time: '13:00',
        coordinate: { latitude: 40.00937, longitude: 116.30748 },
        image: STOP_IMAGES['d3-yuanmingyuan'],
      },
      {
        id: 'd3-olympic-park',
        name: '奥林匹克公园',
        subtitle: '鸟巢夜景',
        time: '18:00',
        coordinate: { latitude: 39.99289, longitude: 116.39748 },
        image: STOP_IMAGES['d3-olympic-park'],
      },
    ],
  },
  {
    day: 4,
    title: '胡同与城市烟火',
    mood: 'City Walk 日',
    color: '#8b5cf6',
    stops: [
      {
        id: 'd4-nanluo',
        name: '南锣鼓巷',
        subtitle: '早场街区拍照',
        time: '09:30',
        coordinate: { latitude: 39.93887, longitude: 116.40389 },
        image: STOP_IMAGES['d4-nanluo'],
      },
      {
        id: 'd4-shichahai',
        name: '什刹海',
        subtitle: '湖边骑行休闲',
        time: '12:00',
        coordinate: { latitude: 39.94346, longitude: 116.38881 },
        image: STOP_IMAGES['d4-shichahai'],
      },
      {
        id: 'd4-yandai',
        name: '烟袋斜街',
        subtitle: '文创与小吃',
        time: '15:00',
        coordinate: { latitude: 39.93995, longitude: 116.39037 },
        image: STOP_IMAGES['d4-yandai'],
      },
      {
        id: 'd4-sanlitun',
        name: '三里屯太古里',
        subtitle: '夜生活收官',
        time: '19:00',
        coordinate: { latitude: 39.93444, longitude: 116.45462 },
        image: STOP_IMAGES['d4-sanlitun'],
      },
    ],
  },
  {
    day: 5,
    title: '主题乐园与运河',
    mood: '娱乐压轴日',
    color: '#db2777',
    stops: [
      {
        id: 'd5-universal',
        name: '北京环球影城',
        subtitle: '热门项目优先',
        time: '08:00',
        coordinate: { latitude: 39.84847, longitude: 116.6736 },
        image: STOP_IMAGES['d5-universal'],
      },
      {
        id: 'd5-grand-canal',
        name: '大运河森林公园',
        subtitle: '午后放松',
        time: '15:00',
        coordinate: { latitude: 39.88743, longitude: 116.74426 },
        image: STOP_IMAGES['d5-grand-canal'],
      },
      {
        id: 'd5-city-end',
        name: '国贸夜景',
        subtitle: '五一终点站',
        time: '20:00',
        coordinate: { latitude: 39.90873, longitude: 116.45989 },
        image: STOP_IMAGES['d5-city-end'],
      },
    ],
  },
];

const ACTIVE_STOP_HIGHLIGHT_COLOR = TRIP_DAYS[0].color;
const MARKER_FOCUS_ZOOM = 16.2;
const MARKER_FOCUS_TILT = 42;

export function withAlpha(hex: string, alpha: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return `${hex}${alpha}`;
  }
  return hex;
}

export function formatKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

function calcPathDistance(points: LatLng[]): number {
  if (points.length < 2) return 0;

  let distance = 0;
  for (let i = 1; i < points.length; i += 1) {
    distance += ExpoGaodeMapModule.distanceBetweenCoordinates(
      points[i - 1],
      points[i]
    );
  }
  return distance;
}

function sampleRoutePoints(points: LatLng[], maxPointCount: number): LatLng[] {
  // 相机拟合不需要所有折线点：点太多会增加计算和动画成本。
  // 这里做均匀抽样，并确保终点一定保留。
  if (points.length <= maxPointCount) {
    return points;
  }

  const step = Math.ceil(points.length / maxPointCount);
  const sampled = points.filter((_, index) => index % step === 0);
  const tail = points[points.length - 1];
  const last = sampled[sampled.length - 1];
  const duplicatedTail =
    !!last &&
    Math.abs(last.latitude - tail.latitude) < 0.000001 &&
    Math.abs(last.longitude - tail.longitude) < 0.000001;
  if (!duplicatedTail) {
    sampled.push(tail);
  }
  return sampled;
}

function calcMaxPointDistance(points: LatLng[]): number {
  if (points.length < 2) return 0;

  let maxDistance = 0;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const distance = ExpoGaodeMapModule.distanceBetweenCoordinates(points[i], points[j]);
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }
  }

  return maxDistance;
}

function getMinZoomForCompactRoute(distanceMeters: number): number | null {
  if (distanceMeters < 2200) return 15;
  if (distanceMeters < 4500) return 14.4;
  if (distanceMeters < 7000) return 13.9;
  return null;
}

function getZoomCapForDistance(distanceMeters: number): number {
  if (distanceMeters < 2200) return 15.2;
  if (distanceMeters < 5000) return 14.5;
  if (distanceMeters < 10000) return 13.9;
  if (distanceMeters < 20000) return 13.1;
  if (distanceMeters < 35000) return 12.2;
  return 11.4;
}

function getBounds(points: LatLng[]) {
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const north = Math.max(...latitudes);
  const south = Math.min(...latitudes);
  const east = Math.max(...longitudes);
  const west = Math.min(...longitudes);

  return {
    north,
    south,
    east,
    west,
    center: {
      latitude: (north + south) / 2,
      longitude: (east + west) / 2,
    },
  };
}

const TripMarkerCard = React.memo(function TripMarkerCard({
  stop,
}: {
  stop: FlatStop;
}) {
  return (
    <View style={styles.markerOuter}>
      <View style={[styles.markerCard, { borderColor: stop.dayColor }]}>
        <View style={styles.markerTopRow}>
          <Image source={stop.image} style={styles.markerThumb} />
          <View style={styles.markerMeta}>
            <View style={[styles.dayBadge, { backgroundColor: stop.dayColor }]}>
              <Text style={styles.dayBadgeText}>D{stop.day}</Text>
            </View>
            <Text style={styles.markerTime}>{stop.time}</Text>
          </View>
        </View>
        <Text style={styles.markerName} numberOfLines={1}>
          {stop.name}
        </Text>
      </View>
      <View style={[styles.markerArrow, { borderTopColor: stop.dayColor }]} />
    </View>
  );
});

export default function MayDayFiveDayTripExample() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = React.useRef<MapViewRef>(null);
  const latestFitRequestRef = React.useRef(0);

  const [mapViewport, setMapViewport] = React.useState({ width: 0, height: 0 });
  const [topBarHeight, setTopBarHeight] = React.useState(0);
  const [bottomPanelHeight, setBottomPanelHeight] = React.useState(0);
  const [activeDayIndex, setActiveDayIndex] = React.useState(0);
  const [activeStopId, setActiveStopId] = React.useState(TRIP_DAYS[0].stops[0].id);
  // 缓存“按天”路线结果，避免切换 Day 时反复请求 Web API。
  const [dayRoutePlans, setDayRoutePlans] = React.useState<Record<number, TripDayRoutePlan>>(() => {
    const initialPlans: Record<number, TripDayRoutePlan> = {};
    TRIP_DAYS.forEach((day, dayIndex) => {
      const cached = getCachedTripDayRoutePlan(dayIndex, day.stops);
      if (cached) {
        initialPlans[dayIndex] = cached;
      }
    });
    return initialPlans;
  });
  const [isActiveDayRouteLoading, setIsActiveDayRouteLoading] = React.useState(false);

  const allStops = React.useMemo<FlatStop[]>(() => {
    return TRIP_DAYS.flatMap((day, dayIndex) =>
      day.stops.map((stop) => ({
        ...stop,
        day: day.day,
        dayIndex,
        dayColor: day.color,
      }))
    );
  }, []);

  // 无网络或 Web Key 不可用时，直接回退到直线方案，保证示例可运行。
  const fallbackDayPlans = React.useMemo(
    () => TRIP_DAYS.map((day, dayIndex) => buildFallbackTripDayRoutePlan(dayIndex, day.stops)),
    []
  );

  const totalDistance = React.useMemo(() => {
    return TRIP_DAYS.reduce(
      (sum, _day, dayIndex) =>
        sum + (dayRoutePlans[dayIndex]?.totalDistanceMeters ?? fallbackDayPlans[dayIndex].totalDistanceMeters),
      0
    );
  }, [dayRoutePlans, fallbackDayPlans]);

  const activeDay = TRIP_DAYS[activeDayIndex];
  const activeDayStops = activeDay.stops;
  const activeDayMarkers = React.useMemo<FlatStop[]>(() => {
    return activeDayStops.map((stop) => ({
      ...stop,
      day: activeDay.day,
      dayIndex: activeDayIndex,
      dayColor: activeDay.color,
    }));
  }, [activeDay, activeDayIndex, activeDayStops]);

  const activeStop = React.useMemo(() => {
    return activeDayStops.find((stop) => stop.id === activeStopId) ?? activeDayStops[0];
  }, [activeDayStops, activeStopId]);

  const activeDayRoutePlan = React.useMemo(() => {
    return dayRoutePlans[activeDayIndex] ?? fallbackDayPlans[activeDayIndex];
  }, [activeDayIndex, dayRoutePlans, fallbackDayPlans]);

  const activeDayRoutePoints = React.useMemo(() => {
    return activeDayRoutePlan.segments.flatMap((segment) => segment.points);
  }, [activeDayRoutePlan.segments]);

  const activeDayCameraPoints = React.useMemo(() => {
    // 有真实路线时，拟合优先使用路线点（连续），避免 stop 点拼接造成跳点和过度缩小。
    const stopPoints = activeDayStops.map((stop) => stop.coordinate);
    if (activeDayRoutePoints.length < 2) {
      return stopPoints;
    }
    return sampleRoutePoints(activeDayRoutePoints, 120);
  }, [activeDayRoutePoints, activeDayStops]);

  const handleMapViewportLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setMapViewport((current) => {
      if (current.width === width && current.height === height) {
        return current;
      }
      return { width, height };
    });
  }, []);

  const handleTopBarLayout = React.useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setTopBarHeight((current) => (current === nextHeight ? current : nextHeight));
  }, []);

  const handleBottomPanelLayout = React.useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setBottomPanelHeight((current) => (current === nextHeight ? current : nextHeight));
  }, []);

  const loadDayRoutePlan = React.useCallback(async (dayIndex: number) => {
    // 路线规划结果由 tripRoutePlanning 内部做了 API + fallback + 缓存策略。
    const plan = await getTripDayRoutePlan(dayIndex, TRIP_DAYS[dayIndex].stops);
    setDayRoutePlans((current) => {
      if (current[dayIndex] === plan) {
        return current;
      }
      return {
        ...current,
        [dayIndex]: plan,
      };
    });
    return plan;
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setIsActiveDayRouteLoading(true);

    void loadDayRoutePlan(activeDayIndex)
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsActiveDayRouteLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeDayIndex, loadDayRoutePlan]);

  React.useEffect(() => {
    // 预加载下一天路线，减少用户切 Day 的等待感。
    const nextDayIndex = activeDayIndex + 1;
    if (nextDayIndex < TRIP_DAYS.length) {
      void loadDayRoutePlan(nextDayIndex).catch(() => undefined);
    }
  }, [activeDayIndex, loadDayRoutePlan]);

  const fitPoints = React.useCallback(async (points: LatLng[]) => {
    const requestId = latestFitRequestRef.current + 1;
    latestFitRequestRef.current = requestId;
    const isStale = () => requestId !== latestFitRequestRef.current;

    if (!points.length) return;

    const topOverlay = insets.top + 6 + topBarHeight + 12;
    const bottomOverlay = insets.bottom + 8 + bottomPanelHeight + 12;
    const overlayBias =
      mapViewport.height > 0 ? (bottomOverlay - topOverlay) / mapViewport.height : 0;
    const overlayRatio =
      mapViewport.height > 0
        ? Math.min(0.55, (topOverlay + bottomOverlay) / mapViewport.height)
        : 0;
    if (points.length === 1) {
      await mapRef.current?.moveCamera(
        {
          target: {
            latitude: points[0].latitude + Math.max(0, overlayBias) * 0.01,
            longitude: points[0].longitude,
          },
          zoom: 13.6,
          bearing: 0,
          tilt: 0,
        },
        300
      );
      return;
    }

    const maxPointDistance = calcMaxPointDistance(points);
    const pathDistance = calcPathDistance(points);
    // pathDistance 在路线弯折多时会显著大于真实可视跨度，这里做上限钳制，
    // 防止默认视角被“累计路程”错误拉得过远。
    const pathDistanceCap = maxPointDistance * 1.35;
    const focusDistance = Math.max(maxPointDistance, Math.min(pathDistance, pathDistanceCap));
    const compactRouteMinZoom = getMinZoomForCompactRoute(focusDistance);
    const maxZoom = getZoomCapForDistance(focusDistance);

    const minZoom = compactRouteMinZoom ?? 7.8;
    const bounds = getBounds(points);
    const viewportWidthPx = mapViewport.width > 1 ? mapViewport.width : 390;
    const viewportHeightPx = mapViewport.height > 1 ? mapViewport.height : 844;
    const platformPaddingScale = Platform.select({
      ios: 0.18,
      android: 0.08,
      default: 0.2,
    }) ?? 0.2;
    const overlayPaddingBoost = overlayRatio * 0.08;
    const distancePaddingBoost =
      focusDistance > 22000 ? 0.02 : focusDistance > 12000 ? 0.01 : 0;
    const paddingScale = Math.max(
      0.04,
      Math.min(0.6, platformPaddingScale + overlayPaddingBoost + distancePaddingBoost)
    );
    const paddingPx = Math.round(
      Math.min(viewportWidthPx, viewportHeightPx) * paddingScale
    );
    const fallbackPaddingFactor = Math.max(0.12, Math.min(0.7, paddingScale * 2));
    const zoomBias = Platform.select({
      ios: 0,
      android: 0.2,
      default: 0,
    }) ?? 0;

    try {
      const rawZoom = ExpoGaodeMapModule.calculateFitZoom(points, {
        viewportWidthPx,
        viewportHeightPx,
        paddingPx,
        minZoom,
        maxZoom,
      });
      const zoom = Math.min(maxZoom, Math.max(minZoom, rawZoom + zoomBias));
      const latitudeSpan = Math.max(0.0001, bounds.north - bounds.south);
      const target = {
        latitude: bounds.center.latitude + Math.max(0, overlayBias) * latitudeSpan * 0.3,
        longitude: bounds.center.longitude,
      };

      await mapRef.current?.moveCamera(
        {
          target,
          zoom,
          bearing: 0,
          tilt: 0,
        },
        360
      );
    } catch {
      await mapRef.current?.fitToCoordinates(points, {
        // 兼容 calculateFitZoom 异常场景，退化为 SDK 内置 fit 逻辑。
        duration: 360,
        paddingFactor: fallbackPaddingFactor,
        minZoom,
        maxZoom,
        bearing: 0,
        tilt: 0,
        preserveBearing: false,
        preserveTilt: false,
      });
    }

    if (isStale()) {
      return;
    }
  }, [bottomPanelHeight, insets.bottom, insets.top, mapViewport.height, mapViewport.width, topBarHeight]);

  const fitActiveDay = React.useCallback(async () => {
    await fitPoints(activeDayCameraPoints);
  }, [activeDayCameraPoints, fitPoints]);

  const fitAllDays = React.useCallback(async () => {
    await fitPoints(allStops.map((stop) => stop.coordinate));
  }, [allStops, fitPoints]);

  React.useEffect(() => {
    if (!mapViewport.width || !mapViewport.height || !topBarHeight || !bottomPanelHeight) {
      return;
    }

    const timer = setTimeout(() => {
      void fitActiveDay();
    }, 140);

    return () => clearTimeout(timer);
  }, [bottomPanelHeight, fitActiveDay, mapViewport.height, mapViewport.width, topBarHeight]);

  const handleSwitchDay = React.useCallback(
    (nextDayIndex: number) => {
      const firstStop = TRIP_DAYS[nextDayIndex].stops[0];
      setActiveDayIndex(nextDayIndex);
      setActiveStopId(firstStop.id);
    },
    []
  );

  const handleSelectStop = React.useCallback(
    (dayIndex: number, stop: TripStop) => {
      if (dayIndex !== activeDayIndex) {
        setActiveDayIndex(dayIndex);
      }
      setActiveStopId(stop.id);

      void (async () => {
        const map = mapRef.current;
        if (!map) return;

        const topOverlay = insets.top + 6 + topBarHeight + 12;
        const bottomOverlay = insets.bottom + 8 + bottomPanelHeight + 12;
        const overlayBias =
          mapViewport.height > 0 ? (bottomOverlay - topOverlay) / mapViewport.height : 0;
        // 底部面板会遮挡地图，下移视觉中心，点击站点时给一点纬度补偿。
        const latitudeOffset = Math.max(0, overlayBias) * 0.008;

        const currentCamera = (await map.getCameraPosition().catch(() => undefined)) as
          | { zoom?: number; bearing?: number; tilt?: number }
          | undefined;

        await map.moveCamera(
          {
            target: {
              latitude: stop.coordinate.latitude + latitudeOffset,
              longitude: stop.coordinate.longitude,
            },
            // 使用固定目标值，确保你改配置后每次点击都能稳定生效。
            zoom: 17.5,
            bearing:
              typeof currentCamera?.bearing === 'number' ? currentCamera.bearing : 0,
            tilt: 60,
          },
          280
        );
      })();
    },
    [activeDayIndex, bottomPanelHeight, insets.bottom, insets.top, mapViewport.height, topBarHeight]
  );

  const focusActiveStop = React.useCallback(async () => {
    await mapRef.current?.moveCamera(
      {
        target: activeStop.coordinate,
        zoom: MARKER_FOCUS_ZOOM,
        tilt: MARKER_FOCUS_TILT,
      },
      300
    );
  }, [activeStop.coordinate]);

  const openTripStopSheet = React.useCallback(
    (dayIndex: number, stopId: string) => {
      void router.push({
        pathname: '/trip-stop-sheet',
        params: {
          dayIndex: String(dayIndex),
          stopId,
          openToken: String(Date.now()),
        },
      });
    },
    [router]
  );

  React.useEffect(() => {
    // Sheet 与主地图通过简单事件总线解耦通信（选择站点 / 拟合范围 / 聚焦站点）。
    return subscribeTripSheetCommand((command) => {
      if (command.type === 'selectStop') {
        const day = TRIP_DAYS[command.dayIndex];
        const stop = day?.stops.find((item) => item.id === command.stopId);
        if (day && stop) {
          handleSelectStop(command.dayIndex, stop);
        }
        return;
      }

      if (command.type === 'fitAllDays') {
        void fitAllDays();
        return;
      }

      if (command.type === 'fitActiveDay') {
        void fitActiveDay();
        return;
      }

      if (command.type === 'focusActiveStop') {
        void focusActiveStop();
      }
    });
  }, [fitActiveDay, fitAllDays, focusActiveStop, handleSelectStop]);

  return (
    <View style={styles.container} onLayout={handleMapViewportLayout}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={{
          target: TRIP_DAYS[0].stops[0].coordinate,
          zoom: 11.4,
        }}
        myLocationEnabled
       
        indoorViewEnabled
        buildingsEnabled
        labelsEnabled
        trafficEnabled
      >
        {/* 每段路线用三层线条做“阴影 + 白色描边 + 主色线”，提高复杂底图上的可读性 */}
        {activeDayRoutePlan.segments.map((segment) => (
          <React.Fragment key={segment.id}>
            <Polyline
              points={segment.points}
              strokeColor="rgba(15, 23, 42, 0.14)"
              strokeWidth={8.6}
              zIndex={5}
            />
            <Polyline
              points={segment.points}
              strokeColor="rgba(255,255,255,0.82)"
              strokeWidth={6.2}
              zIndex={6}
            />
            <Polyline
              points={segment.points}
              strokeColor={activeDay.color}
              strokeWidth={3.4}
              zIndex={8}
            />
          </React.Fragment>
        ))}

        <Circle
          center={activeStop.coordinate}
          radius={180}
          fillColor={withAlpha(ACTIVE_STOP_HIGHLIGHT_COLOR, '1A')}
          strokeColor={withAlpha(ACTIVE_STOP_HIGHLIGHT_COLOR, '80')}
          strokeWidth={1.5}
          zIndex={9}
        />

        {activeDayMarkers.map((stop) => {
          return (
            <Marker
              key={stop.id}
              position={stop.coordinate}
              zIndex={20}
              cacheKey={`trip-stop-card-${stop.id}`}
              onMarkerPress={() => {
                handleSelectStop(activeDayIndex, stop);
                openTripStopSheet(activeDayIndex, stop.id);
              }}
            >
              <TripMarkerCard stop={stop} />
            </Marker>
          );
        })}

        <MapUI>
          <View
            pointerEvents="box-none"
            style={[
              styles.overlayRoot,
              {
                paddingTop: insets.top + 6,
                paddingBottom: insets.bottom + 8,
              },
            ]}
          >
            <View style={styles.topBar} onLayout={handleTopBarLayout}>
              <Pressable style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>{'<'}</Text>
              </Pressable>
              <View style={styles.tripChip}>
                <Text style={styles.tripChipTitle}>北京 5 日游</Text>
                <Text style={styles.tripChipMeta}>
                  {allStops.length} 站 · {formatKm(totalDistance)}
                </Text>
              </View>
            </View>

            <View style={styles.bottomPanel} onLayout={handleBottomPanelLayout}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayTabsContent}
              >
                {TRIP_DAYS.map((day, dayIndex) => {
                  const isActive = dayIndex === activeDayIndex;
                  return (
                    <Pressable
                      key={day.day}
                      onPress={() => handleSwitchDay(dayIndex)}
                      style={[
                        styles.dayTab,
                        {
                          borderColor: day.color,
                          backgroundColor: isActive ? withAlpha(day.color, '24') : '#ffffff',
                        },
                      ]}
                    >
                      <Text style={[styles.dayTabTitle, { color: day.color }]}>Day {day.day}</Text>
                      <Text style={styles.dayTabText} numberOfLines={1}>
                        {day.title}
                      </Text>
                      <Text style={styles.dayTabMood}>{day.mood}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Text style={styles.bottomHint}>点击地图上的站点气泡查看详情</Text>
              <Text style={styles.routeHint}>
                {isActiveDayRouteLoading
                  ? '正在规划当日景点间路线...'
                  : `${activeDayRoutePlan.segments.length} 段路线 · ${formatKm(
                      activeDayRoutePlan.totalDistanceMeters
                    )} · ${formatDuration(activeDayRoutePlan.totalDurationSeconds)}`}
              </Text>
            </View>
          </View>
        </MapUI>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
  },
  map: {
    flex: 1,
  },
  overlayRoot: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  backButtonText: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  tripChip: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: 'rgba(6, 11, 25, 0.80)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.22)',
  },
  tripChipTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  tripChipMeta: {
    marginTop: 2,
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '600',
  },
  bottomPanel: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 8,
    minHeight: 84,
    // maxHeight: 108,
  },
  dayTabsContent: {
    gap: 6,
    paddingBottom: 2,
    paddingRight: 4,
  },
  bottomHint: {
    marginTop: 6,
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  routeHint: {
    marginTop: 2,
    fontSize: 10,
    color: '#475569',
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedStopSheet: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedStopImage: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#dbe4f0',
  },
  selectedStopBody: {
    flex: 1,
    gap: 3,
  },
  selectedStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectedStopBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selectedStopBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  selectedStopTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  selectedStopName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  selectedStopSubtitle: {
    fontSize: 12,
    color: '#334155',
  },
  selectedStopMeta: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  dayTab: {
    width: 124,
   
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  dayTabTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  dayTabText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  dayTabMood: {
    marginTop: 2,
    fontSize: 10,
    color: '#64748b',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  daySummaryRow: {
    marginTop: 8,
    marginBottom: 6,
  },
  daySummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  daySummaryMeta: {
    marginTop: 1,
    fontSize: 11,
    color: '#475569',
  },
  stopList: {
    flexGrow: 1,
    minHeight: 120,
    maxHeight: 320,
  },
  stopListContent: {
    gap: 6,
    paddingBottom: 4,
  },
  stopCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stopIndexText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  stopBody: {
    flex: 1,
    paddingRight: 6,
  },
  stopName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  stopSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: '#64748b',
  },
  stopTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  markerOuter: {
    alignItems: 'center',
  },
  markerCard: {
    width: 96,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
  },
  markerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  markerThumb: {
    width: 20,
    height: 20,
    borderRadius: 6,
    marginRight: 5,
    backgroundColor: '#e2e8f0',
  },
  markerMeta: {
    flex: 1,
    gap: 2,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  dayBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  markerName: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0f172a',
  },
  markerTime: {
    fontSize: 8,
    color: '#64748b',
    fontWeight: '700',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
