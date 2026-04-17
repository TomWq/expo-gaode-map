
import {
  Circle,
  ExpoGaodeMapModule,
  MapView,
  MapViewRef,
  Marker,
  Polygon,
  Polyline,
  MultiPoint,
  HeatMap,
  Cluster,
  type ClusterPoint,
  type CameraPosition,
  type Coordinates,
  type ReGeocode,
  type MapPoi,
  MapUI,
  type LatLngPoint,
  MapType,
} from 'expo-gaode-map';
import { reGeocode } from 'expo-gaode-map-search'


import React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View ,Image} from 'react-native';

import {
  type ExampleMultiPoint,
  type GeoJsonCoordinate,
  type HeatMapPoint,
  generateClusterData,
  generateHeatMapData,
  generateIrregularOutline,
  generateMaskOuterRing,
  generateMultiPointData,
  positionIconUri,
} from './playgroundUtils';

const HARMONY_KEY = process.env.HARMONY_KEY || '23797e2dc6a31f25bbc065aa3c1b6950';
let hasInitializedHarmonySDK = false;


function ensureHarmonySDKInitialized() {
  if (hasInitializedHarmonySDK) {
    return;
  }

  // 验证 API Key 是否存在
  if (!HARMONY_KEY) {
    console.error('[App] HARMONY_KEY is not configured. Please set HARMONY_KEY environment variable.');
    return;
  }

  ExpoGaodeMapModule.setPrivacyConfig({
    hasContainsPrivacy: true,
    hasShow: true,
    hasAgree: true,
  });
  ExpoGaodeMapModule.initSDK({ harmonyKey: HARMONY_KEY });
  console.info(`[App] ExpoGaodeMapModule.initSDK called, key=${HARMONY_KEY ? `${HARMONY_KEY.slice(0, 4)}***${HARMONY_KEY.slice(-4)}` : 'EMPTY'}`);

  hasInitializedHarmonySDK = true;
}

ensureHarmonySDKInitialized();

export default function MamScreen() {
  type PanelSection = 'overlays' | 'advanced' | 'debug';

  const mapRef = useRef<MapViewRef | null>(null);
  const [location, setLocation] = useState<Coordinates | ReGeocode | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [initialPosition, setInitialPosition] = useState<CameraPosition | null>(null);
  const [cameraInfo, setCameraInfo] = useState<string>('');
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  // 高级覆盖物状态
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [heatMapData, setHeatMapData] = useState<HeatMapPoint[]>([]);

  const [showMultiPoint, setShowMultiPoint] = useState(false);
  const [multiPointData, setMultiPointData] = useState<ExampleMultiPoint[]>([]);

  const [showCluster, setShowCluster] = useState(false);
  const [clusterData, setClusterData] = useState<ClusterPoint[]>([]);
  const [useClusterIcon, setUseClusterIcon] = useState(false);
  const [showAreaOutline, setShowAreaOutline] = useState(false);
  const [areaOutlinePoints, setAreaOutlinePoints] = useState<GeoJsonCoordinate[]>([]);
  const [sdkReady, setSdkReady] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [privacyStatusText, setPrivacyStatusText] = useState('未确认');
  const [showPrivacyModal, setShowPrivacyModal] = useState(true);
  const [currentPage, setCurrentPage] = useState<'welcome' | 'map'>('welcome');
  const [nativeCameraThrottleMs, setNativeCameraThrottleMs] = useState(32);
  const [cameraMoveEventCount, setCameraMoveEventCount] = useState(0);
  const [cameraIdleEventCount, setCameraIdleEventCount] = useState(0);
  const [lastPressedPoi, setLastPressedPoi] = useState<MapPoi | null>(null);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [activePanelSection, setActivePanelSection] = useState<PanelSection>('overlays');
  const blurRef = React.useRef<React.ElementRef<typeof View> | null>(null);

  // 主题与动态色
  const colorScheme = 'dark';
  const primary = '#007aff';
  const textColor = colorScheme === 'dark' ? '#fff' : '#1c1c1c';
  const muted = colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : '#444';
  const hairline = colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  const areaMaskPoints = React.useMemo<GeoJsonCoordinate[][]>(() => {
    if (!location || areaOutlinePoints.length === 0) {
      return [];
    }
    return [generateMaskOuterRing(location), areaOutlinePoints];
  }, [location, areaOutlinePoints]);
  const areaLabelPosition = React.useMemo(() => {
    if (areaOutlinePoints.length === 0) {
      return null;
    }

    const uniquePoints = areaOutlinePoints.slice(0, -1);
    if (uniquePoints.length === 0) {
      return null;
    }

    const total = uniquePoints.reduce(
      (acc, [lng, lat]) => {
        acc.longitude += lng;
        acc.latitude += lat;
        return acc;
      },
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: total.latitude / uniquePoints.length,
      longitude: total.longitude / uniquePoints.length,
    };
  }, [areaOutlinePoints]);

  // 用于测试 Marker 动态添加/删除和位置变化
  const [dynamicMarkers, setDynamicMarkers] = useState<Array<{
    id: string;
    latitude: number;
    longitude: number;
    content: string;
    color: 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet' | 'purple';
    useArrayPosition?: boolean;
  }>>([]);
  const markerIdCounter = useRef(0);

  // 用于测试声明式覆盖物的动态添加
  const [dynamicCircles, setDynamicCircles] = useState<Array<{
    id: string;
    latitude: number;
    longitude: number;
    radius: number;
    fillColor: string;
    strokeColor: string;
  }>>([]);
  const circleIdCounter = useRef(0);

  const [dynamicPolylines, setDynamicPolylines] = useState<Array<{
    id: string;
    points: LatLngPoint[];
    color: string;
  }>>([]);
  const polylineIdCounter = useRef(0);

  const [dynamicPolygons, setDynamicPolygons] = useState<Array<{
    id: string;
    points: Array<{ latitude: number; longitude: number }>;
    fillColor: string;
    strokeColor: string;
  }>>([]);
  const polygonIdCounter = useRef(0);



  // 隐私协议状态：未同意前不初始化、不渲染地图
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // 模拟从后端获取的 GeoJSON 格式轨迹数据 (数组格式 [经度, 纬度])
  // 这种数据格式在实际开发中非常常见，比如路径规划、历史轨迹回放
  const mockGeoJsonRoute: {
    type: string;
    properties: {
      name: string;
      color: string;
    };
    geometry: {
      type: 'LineString';
      coordinates: GeoJsonCoordinate[];
    };
  } = {
    type: "Feature",
    properties: {
      name: "模拟轨迹",
      color: "#FF0000"
    },
    geometry: {
      type: "LineString",
      coordinates: [
        [116.397428, 39.90923], // 天安门
        [116.397428, 39.91923], // 向北
        [116.407428, 39.91923], // 向东
        [116.407428, 39.90923], // 向南
        [116.397428, 39.90923]  // 回到起点
      ]
    }
  };

  const handleAgreePrivacyAndInitialize = async () => {
    try {
      setInitializing(true);
      setSdkReady(false);
      setInitialPosition(null);
      ExpoGaodeMapModule.setPrivacyConfig({
        hasShow: true,
        hasContainsPrivacy: true,
        hasAgree: true,
        privacyVersion: '2026-03-13', // 可选：隐私协议版本号
      });

      const privacyStatus = ExpoGaodeMapModule.getPrivacyStatus();
      setPrivacyStatusText(
        `展示: ${privacyStatus.hasShow ? '是' : '否'} / 包含隐私: ${privacyStatus.hasContainsPrivacy ? '是' : '否'} / 同意: ${privacyStatus.hasAgree ? '是' : '否'}`
      );

      ExpoGaodeMapModule.initSDK({
        webKey:'9f59c9453ccc5e9798983d4922afbd09'
      });

      const permission = await ExpoGaodeMapModule.requestLocationPermission();
      if (!permission.granted) {
        throw new Error('定位权限未授予');
      }

      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setInterval(10000);
      ExpoGaodeMapModule.setDistanceFilter(0);
      ExpoGaodeMapModule.setDesiredAccuracy(3);
      ExpoGaodeMapModule.startUpdatingHeading();

      const loc = await ExpoGaodeMapModule.getCurrentLocation();
      setLocation(loc);
      setInitialPosition({
        target: { latitude: loc.latitude, longitude: loc.longitude },
        zoom: 16.6,
      });

      const result = await reGeocode({
        location: {
          latitude: loc.latitude,
          longitude: loc.longitude,
        },
      });
      console.log(JSON.stringify(result.formattedAddress));

      setPrivacyAgreed(true);
      setSdkReady(true);
      setShowPrivacyModal(false);
      setCurrentPage('map');

      ExpoGaodeMapModule.addLocationListener((location) => {
        console.log('位置变化:', location);
      });

    } catch (error: any) {
      console.error('初始化失败:', error);
      if (error?.type) {
        console.warn(`错误类型: ${error.type}`);
        console.warn(`解决方案: ${error.solution}`);
      }
      setPrivacyStatusText(error?.message ?? '初始化失败');
      setPrivacyAgreed(false);
      setSdkReady(false);
      setInitialPosition(null);
      setShowPrivacyModal(true);
      setCurrentPage('welcome');
    } finally {
      setInitializing(false);
    }
  };

  const handleRejectPrivacy = () => {
    setShowPrivacyModal(false);
    Alert.alert('提示', '未同意前将停留在欢迎页，不会初始化地图 SDK。');
  };

  // 当 location 变化时更新高级覆盖物数据
  useEffect(() => {
    if (location && isMapReady) {
      if (showHeatMap && heatMapData.length === 0) {
        setHeatMapData(generateHeatMapData(location, 200));
      }
      if (showMultiPoint && multiPointData.length === 0) {
        setMultiPointData(generateMultiPointData(location, 500));
      }
      if (showCluster && clusterData.length === 0) {
        setClusterData(generateClusterData(location, 50));
      }
      if (showAreaOutline && areaOutlinePoints.length === 0) {
        setAreaOutlinePoints(generateIrregularOutline(location));
      }
    }
  }, [location, isMapReady, showHeatMap, showMultiPoint, showCluster, showAreaOutline, areaOutlinePoints.length]);


  const handleGetLocation = async () => {
    try {
      const loc = location ?? await ExpoGaodeMapModule.getCurrentLocation();

      setLocation((prev) => (
        prev
          ? { ...prev, ...loc }
          : loc
      ));
      if (mapRef.current) {
        await mapRef.current.moveCamera({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 16.6,
        }, 300);
      }
      // 重新启用真正的原生跟随模式
      setIsFollowing(true);
    } catch (error) {
      console.error('handleGetLocation error:', error);
      Alert.alert('错误', '获取位置失败');
    }
  };

  const handleStartLocation = () => {
    ExpoGaodeMapModule.start();
    ExpoGaodeMapModule.startUpdatingHeading();
    setIsLocating(true);
    Alert.alert('成功', '开始连续定位');
  };

  const handleStopLocation = () => {
    ExpoGaodeMapModule.stop();
    ExpoGaodeMapModule.stopUpdatingHeading();
    setIsLocating(false);
    Alert.alert('成功', '停止定位');
  };

  const handleZoomIn = async () => {
    try {
      if (!mapRef.current) {
        return;
      }

      setIsFollowing(false);
      const pos = await mapRef.current.getCameraPosition();
      if (pos.zoom !== undefined) {
        await mapRef.current.moveCamera(
          {
            ...pos,
            zoom: pos.zoom + 1,
          },
          250
        );
      }
    } catch (error) {
      console.error('handleZoomIn error:', error);
      Alert.alert('错误', '放大失败');
    }
  };

  const handleZoomOut = async () => {
    try {
      if (!mapRef.current) {
        return;
      }

      setIsFollowing(false);
      const pos = await mapRef.current.getCameraPosition();
      if (pos.zoom !== undefined) {
        await mapRef.current.moveCamera(
          {
            ...pos,
            zoom: pos.zoom - 1,
          },
          250
        );
      }
    } catch (error) {
      console.error('handleZoomOut error:', error);
      Alert.alert('错误', '缩小失败');
    }
  };

  // 声明式 API: 添加圆形
  const handleAddCircle = () => {
    if (!location) {
      Alert.alert('提示', '请等待定位完成');
      return;
    }
    const randomLatitude = location.latitude + (Math.random() - 0.5) * 0.02;
    const randomLongitude = location.longitude + (Math.random() - 0.5) * 0.02;
    const randomRadius = 200 + Math.random() * 500;
    const randomFillColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}44`;
    const randomStrokeColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    const newCircle = {
      id: `circle_${circleIdCounter.current++}`,
      latitude: randomLatitude,
      longitude: randomLongitude,
      radius: randomRadius,
      fillColor: randomFillColor,
      strokeColor: randomStrokeColor,
    };
    setDynamicCircles(prev => [...prev, newCircle]);
  };

  // 动态添加标记
  const handleAddMarker = () => {
    if (!location) {
      Alert.alert('提示', '请等待定位完成');
      return;
    }
    const colors: Array<'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet' | 'purple'> = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'violet', 'purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomOffset = () => (Math.random() - 0.5) * 0.02;
    const newMarker = {
      id: `marker_${markerIdCounter.current++}`,
      latitude: location.latitude + randomOffset(),
      longitude: location.longitude + randomOffset(),
      content: `动态标记 #${markerIdCounter.current}`,
      color: randomColor,
      cacheKey: `marker_${markerIdCounter.current++}`,

    };
    setDynamicMarkers(prev => [...prev, newMarker]);
  };

  // 动态添加折线
  const handleAddPolyline = () => {
    if (!location) {
      Alert.alert('提示', '请等待定位完成');
      return;
    }
    const randomOffset = () => (Math.random() - 0.5) * 0.02;
    // 使用数组格式的坐标点
    const points: GeoJsonCoordinate[] = [
      [location.longitude + randomOffset(), location.latitude + randomOffset()],
      [location.longitude + randomOffset(), location.latitude + randomOffset()],
      [location.longitude + randomOffset(), location.latitude + randomOffset()],
    ];
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    const newPolyline = {
      id: `polyline_${polylineIdCounter.current++}`,
      points,
      color: randomColor,
    };
    setDynamicPolylines(prev => [...prev, newPolyline]);
  };

  // 动态添加多边形
  const handleAddPolygon = () => {
    if (!location) {
      Alert.alert('提示', '请等待定位完成');
      return;
    }
    const randomOffset = () => (Math.random() - 0.5) * 0.02;
    const points = [
      { latitude: location.latitude + randomOffset(), longitude: location.longitude + randomOffset() },
      { latitude: location.latitude + randomOffset(), longitude: location.longitude + randomOffset() },
      { latitude: location.latitude + randomOffset(), longitude: location.longitude + randomOffset() },
    ];
    const randomFillColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}44`;
    const randomStrokeColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    const newPolygon = {
      id: `polygon_${polygonIdCounter.current++}`,
      points,
      fillColor: randomFillColor,
      strokeColor: randomStrokeColor,
    };
    setDynamicPolygons(prev => [...prev, newPolygon]);
  };

  // 移除所有动态覆盖物
  const handleRemoveAllOverlays = () => {
    // 同时也重置高级覆盖物状态
    setShowHeatMap(false);
    setShowMultiPoint(false);
    setShowCluster(false);
    setShowAreaOutline(false);
    setAreaOutlinePoints([]);

    const total = dynamicCircles.length + dynamicMarkers.length + dynamicPolylines.length + dynamicPolygons.length;
    if (total === 0 && !showHeatMap && !showMultiPoint && !showCluster && !showAreaOutline) {
      Alert.alert('提示', '没有可移除的覆盖物');
      return;
    }

    setDynamicCircles([]);
    setDynamicMarkers([]);
    setDynamicPolylines([]);
    setDynamicPolygons([]);
    Alert.alert('成功', `已移除所有覆盖物`);
  };

  // 切换热力图
  const toggleHeatMap = () => {
    setShowHeatMap((prev) => {
      const next = !prev;
      console.log('HeatMap toggle:', { prev, next, hasLocation: !!location });
      if (next) {
        setShowMultiPoint(false);
        setShowCluster(false);
        if (location) {
          const nextData = generateHeatMapData(location, 400);
          console.log('HeatMap data generated:', { length: nextData.length, sample: nextData[0] });
          setHeatMapData(nextData);
        }
      }
      return next;
    });
  };

  // 切换海量点
  const toggleMultiPoint = () => {
    setShowMultiPoint(!showMultiPoint);
    if (!showMultiPoint) {
      setShowHeatMap(false);
      setShowCluster(false);
    }
  };

  // 切换原生聚合
  const toggleCluster = () => {
    setShowCluster((prev) => {
      const next = !prev;
      if (next) {
        setShowHeatMap(false);
        setShowMultiPoint(false);
        if (location) {
          // legacy 页继续保留“大数据量压力验证”，但数据构造和新示例共用同一套 helper。
          setClusterData(generateClusterData(location, 1000));
        }
      }
      return next;
    });
  };

  const toggleAreaOutline = () => {
    setShowAreaOutline((prev) => {
      const next = !prev;
      if (next && location) {
        setAreaOutlinePoints(generateIrregularOutline(location));
      }
      if (!next) {
        setAreaOutlinePoints([]);
      }
      return next;
    });
  };

  // 保存图片到相册
  const saveImageToAlbum = async (uri: string) => {
    try {
      // 1. 请求权限
      
    } catch (error) {
      console.error('保存相册失败:', error);
      Alert.alert('保存失败', '保存到相册时发生错误');
    }
  };

  //截屏
  const handleTakeSnapshot = async () => {
    try {
      const snapshotPath = await mapRef.current?.takeSnapshot();
      if (snapshotPath) {
        //保存到相册
        await saveImageToAlbum(snapshotPath);
      } else {
        Alert.alert('错误', '截图失败');
      }
    } catch (error) {
      console.error('截图错误:', error);
      Alert.alert('错误', '截图过程中发生错误');
    }
  };

  const cycleNativeCameraThrottle = () => {
    setNativeCameraThrottleMs((prev) => {
      if (prev === 0) return 32;
      if (prev === 32) return 120;
      return 0;
    });
  };

  const resetCameraEventStats = () => {
    setCameraMoveEventCount(0);
    setCameraIdleEventCount(0);
    setCameraInfo('');
  };

  const handleCameraMove = useCallback(({ nativeEvent }: any) => {
    const { cameraPosition } = nativeEvent;
    const zoom = cameraPosition.zoom ?? 0;
    const bearing = cameraPosition.bearing ?? 0;
    const lat = cameraPosition.target?.latitude ?? 0;
    const lng = cameraPosition.target?.longitude ?? 0;

    setCameraMoveEventCount((prev) => prev + 1);
    setCameraInfo(
      `移动中 · 中心 ${lat.toFixed(4)}, ${lng.toFixed(4)} · 缩放 ${zoom.toFixed(2)} · 旋转 ${bearing.toFixed(2)}°`
    );
  }, []);

  const handlePressPoi = useCallback(({ nativeEvent }: { nativeEvent: MapPoi }) => {

    setLastPressedPoi(nativeEvent);
    Alert.alert(
      'POI 点击已触发',
      `${nativeEvent.name || '未命名 POI'}\n${nativeEvent.position.latitude.toFixed(6)}, ${nativeEvent.position.longitude.toFixed(6)}`
    );
  }, []);

  const renderExpandedPanelContent = () => {
    switch (activePanelSection) {
      case 'overlays':
        return (
          <>
            <Text style={[styles.sectionHint, { color: muted }]}>动态添加声明式覆盖物，验证渲染和交互。</Text>
            <View style={styles.actionRow}>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#4CAF50' }]} onPress={handleAddCircle}>
                <Text style={styles.actionBtnText}>圆形</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#2196F3' }]} onPress={handleAddMarker}>
                <Text style={styles.actionBtnText}>标记</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#9C27B0' }]} onPress={handleAddPolyline}>
                <Text style={styles.actionBtnText}>折线</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#FF5722' }]} onPress={handleAddPolygon}>
                <Text style={styles.actionBtnText}>多边形</Text>
              </Pressable>
            </View>
            <View style={[styles.actionRow, { marginTop: 10 }]}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: showAreaOutline ? '#0EA5E9' : '#455A64' }]}
                onPress={toggleAreaOutline}
              >
                <Text style={styles.actionBtnText}>{showAreaOutline ? '关闭区域高亮' : '区域高亮'}</Text>
              </Pressable>
              <View style={[styles.actionBtn, { backgroundColor: '#546E7A' }]}>
                <Text style={styles.actionBtnText}>园区/行政区风格</Text>
              </View>
            </View>
            <Pressable style={[styles.removeBtn]} onPress={handleRemoveAllOverlays}>
              <Text style={styles.removeBtnText}>重置所有覆盖物</Text>
            </Pressable>
          </>
        );
      case 'advanced':
        return (
          <>
            <Text style={[styles.sectionHint, { color: muted }]}>切换高阶图层和截图能力。</Text>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: showHeatMap ? '#F44336' : '#607D8B' }]}
                onPress={toggleHeatMap}
              >
                <Text style={styles.actionBtnText}>热力图</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: showMultiPoint ? '#FF9800' : '#607D8B' }]}
                onPress={toggleMultiPoint}
              >
                <Text style={styles.actionBtnText}>海量点</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: showCluster ? '#3F51B5' : '#607D8B' }]}
                onPress={toggleCluster}
              >
                <Text style={styles.actionBtnText}>聚合</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: '#607D8B' }]} onPress={handleTakeSnapshot}>
                <Text style={styles.actionBtnText}>截图</Text>
              </Pressable>
            </View>
          </>
        );
      case 'debug':
        return (
          <>
            <Text style={[styles.sectionHint, { color: muted }]}>验证原生节流、聚合图标和事件计数。</Text>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: nativeCameraThrottleMs === 0 ? '#795548' : '#00897B' }]}
                onPress={cycleNativeCameraThrottle}
              >
                <Text style={styles.actionBtnText}>原生节流 {nativeCameraThrottleMs}ms</Text>
              </Pressable>
              <View style={[styles.actionBtn, { backgroundColor: '#546E7A' }]}>
                <Text style={styles.actionBtnText}>只保留原生节流</Text>
              </View>
            </View>
            <View style={[styles.actionRow, { marginTop: 10 }]}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: useClusterIcon ? '#3949AB' : '#455A64' }]}
                onPress={() => setUseClusterIcon((prev) => !prev)}
              >
                <Text style={styles.actionBtnText}>聚合图标 {useClusterIcon ? '开' : '关'}</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: '#6D4C41' }]}
                onPress={resetCameraEventStats}
              >
                <Text style={styles.actionBtnText}>清空计数</Text>
              </Pressable>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  if (currentPage === 'welcome') {
    return (
      <View style={[styles.container, styles.welcomeScreen]}>
        <View style={styles.welcomeHero}>
          <Text style={styles.welcomeBadge}>expo-gaode-map example</Text>
          <Text style={styles.welcomeTitle}>高德地图示例应用</Text>
          <Text style={styles.welcomeDesc}>
            按常见 App 流程，首次进入先弹出隐私合规说明；只有用户同意后，才会初始化 SDK 并进入地图页面。
          </Text>
          <Pressable
            style={styles.welcomePrimaryBtn}
            onPress={() => setShowPrivacyModal(true)}
          >
            <Text style={styles.welcomePrimaryBtnText}>查看隐私弹窗</Text>
          </Pressable>
          <Text style={styles.privacyMeta}>当前状态：{privacyStatusText}</Text>
        </View>

        <Modal
          visible={showPrivacyModal}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {
            if (!initializing) {
              setShowPrivacyModal(false);
            }
          }}
        >
          <View style={styles.privacyModalBackdrop}>
            <View style={styles.privacyCard}>
              <Text style={styles.privacyTitle}>隐私保护提示</Text>
              <Text style={styles.privacyDesc}>
                为了使用地图展示、定位与搜索服务，我们会在你同意后再调用

              </Text>
              <Text style={styles.privacyMeta}>同意前不会进入地图页，也不会初始化地图 SDK。</Text>

              <View style={styles.privacyBtnRow}>
                <Pressable
                  style={[styles.privacyBtn, styles.privacyGhostBtn]}
                  onPress={handleRejectPrivacy}
                  disabled={initializing}
                >
                  <Text style={styles.privacyGhostBtnText}>暂不同意</Text>
                </Pressable>
                <Pressable
                  style={[styles.privacyBtn, { backgroundColor: '#007AFF' }]}
                  onPress={handleAgreePrivacyAndInitialize}
                  disabled={initializing}
                >
                  <Text style={styles.privacyBtnText}>
                    {initializing ? '正在初始化…' : '同意并进入地图'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (!privacyAgreed || !initialPosition) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#000', fontSize: 20, fontWeight: 'bold' }}>
          {sdkReady ? '正在加载地图...' : '正在初始化 SDK...'}
        </Text>
        <Text style={{ marginTop: 12, color: '#666' }}>{privacyStatusText}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#f5f5f5' }]}>

      <MapView
        ref={mapRef}
        style={styles.map}
        myLocationEnabled={true}
        followUserLocation={false}
        indoorViewEnabled={true}
        trafficEnabled={true}
        labelsEnabled={true}
        buildingsEnabled={true}
        mapType={MapType.Night}
        zoomGesturesEnabled
        scrollGesturesEnabled
        worldMapSwitchEnabled
        cameraEventThrottleMs={nativeCameraThrottleMs}
        initialCameraPosition={initialPosition as CameraPosition}
        minZoom={3}
        maxZoom={20}
        userLocationRepresentation={{
          showsAccuracyRing: true,
          showsHeadingIndicator: true,
          enablePulseAnimation: true,
          locationType: 'LOCATION_ROTATE_NO_CENTER'
        }}
        onLoad={() => {
          console.log('地图加载完成');
          requestAnimationFrame(() => {
            setIsMapReady(true);
          });
        }}
        onMapPress={(e) => {
          console.log('地图点击:', e.nativeEvent);
          setIsFollowing(false);
        }}
        onPressPoi={handlePressPoi}
        onMapLongPress={(e) => {
          console.log('地图长按:', e.nativeEvent);
          setIsFollowing(false);
        }}
        onLocation={({ nativeEvent }) => {
          setLocation((prev) => (
            prev
              ? { ...prev, ...nativeEvent }
              : prev
          ));
        }}
        onCameraMove={handleCameraMove}
        onCameraIdle={({ nativeEvent }) => {
          const { cameraPosition } = nativeEvent;
          const lat = cameraPosition.target?.latitude ?? 0;
          const lng = cameraPosition.target?.longitude ?? 0;
          const zoom = cameraPosition.zoom ?? 0;
          setCameraIdleEventCount((prev) => prev + 1);
          const info = `已停止 · 中心 ${lat.toFixed(4)}, ${lng.toFixed(4)} · 缩放 ${zoom.toFixed(2)}`;
          setCameraInfo(info);
        }}
      >
        {/* 高级覆盖物：热力图 */}
        <HeatMap
          data={heatMapData}
          visible={showHeatMap}
          radius={30}
          opacity={0.5}
          gradient={{
            colors: ['blue', 'green', 'red'],
            startPoints: [0.2, 0.5, 0.9]
          }}
        />

        {/* 高级覆盖物：海量点 */}
        {showMultiPoint && (
          <MultiPoint
            points={multiPointData}
            icon={positionIconUri} // 复用共享示例图标
            iconWidth={30}
            iconHeight={30}
            onMultiPointPress={(e) => Alert.alert('海量点点击', `index: ${e.nativeEvent.index}`)}
          />
        )}

        {/* 高级覆盖物：原生聚合 */}
        {showCluster && (
          <Cluster
            points={clusterData}
            icon={useClusterIcon ? positionIconUri : undefined}
            radius={30}
            minClusterSize={1}
            // 分级样式配置
            clusterBuckets={[
              { minPoints: 1, backgroundColor: '#00BFFF' }, // 1个: 蓝色
              { minPoints: 2, backgroundColor: '#32CD32' }, // 2-4个: 绿色
              { minPoints: 5, backgroundColor: '#FFA500' }, // 5-9个: 橙色
              { minPoints: 10, backgroundColor: '#FF4500' } // 10+个: 红色
            ]}
            // 自定义聚合点样式 (作为兜底)
            clusterStyle={{
              backgroundColor: '#999999',
              borderColor: 'white',       // 白色边框
              borderWidth: 3,             // 边框加粗
              width: 40,
              height: 40,
            }}
            // 自定义文字样式
            clusterTextStyle={{
              color: 'white',             // 白色文字
              fontSize: 16,               // 更大的字体
            }}
            onClusterPress={(e) => {
              const { count, pois } = e.nativeEvent;
              console.log('聚合点击:', JSON.stringify(e.nativeEvent));
              if (count > 1) {
                Alert.alert('聚合点点击', `包含 ${count} 个点\n前3个ID: ${pois?.slice(0, 3).map((p: any) => p.properties?.id).join(', ')}...`);
              } else {
                Alert.alert('单点点击', `ID: ${pois?.[0]?.properties?.id ?? 'unknown'}\nTitle: ${pois?.[0]?.properties?.title ?? 'none'}`);
              }
            }}
          />
        )}

        {/* 基础覆盖物 */}
        {
          <>
            {isMapReady && location && (
              <Circle
                // 故意添加额外的无用数据，验证数组格式解析的健壮性
                // 只要前两位是 [经度, 纬度]，后面的数据会被自动忽略
                center={[
                  location.longitude,
                  location.latitude,
                  100, // 高度 (GeoJSON 标准中允许，但地图组件目前只用前两个)
                ]} // 强制转换类型以绕过 TS 检查，仅用于演示运行时兼容性
                radius={300}
                fillColor="#4400FF00"
                strokeColor="#FF00FF00"
                strokeWidth={3}
                zIndex={99}
                onCirclePress={() => Alert.alert('圆形', '点击了声明式圆形')}
              />
            )}

            {/* {dynamicCircles.map((circle) => (
                <Circle
                    key={circle.id}
                    center={{ latitude: circle.latitude, longitude: circle.longitude }}
                    radius={circle.radius}
                    fillColor={circle.fillColor}
                    strokeColor={circle.strokeColor}
                    strokeWidth={2}
                    onCirclePress={() => Alert.alert('圆形', `点击了动态圆形 #${circle.id}`)}
                />
                ))} */}
            {dynamicCircles.map((circle) => (
              <Circle
                key={circle.id}
                // 直接使用数组格式 [经度, 纬度]
                center={[circle.longitude, circle.latitude]}
                radius={circle.radius}
                fillColor={circle.fillColor}
                strokeColor={circle.strokeColor}
                strokeWidth={2}
                onCirclePress={() => Alert.alert('圆形', `点击了动态圆形 #${circle.id}`)}
              />
            ))}

            {dynamicPolylines.map((polyline) => (
              <Polyline key={polyline.id} points={polyline.points} strokeWidth={5} strokeColor={polyline.color} />
            ))}

            {dynamicPolygons.map((polygon) => (
              <Polygon
                key={polygon.id}
                points={polygon.points}
                fillColor={polygon.fillColor}
                strokeColor={polygon.strokeColor}
                strokeWidth={2}
              />
            ))}

            {showAreaOutline && areaMaskPoints.length > 0 && (
              <Polygon
                key="irregular_area_mask_demo"
                points={areaMaskPoints}
                strokeWidth={0}
                strokeColor="transparent"
                fillColor="#7A06121E"
                zIndex={176}
              />
            )}

            {showAreaOutline && areaOutlinePoints.length > 0 && (
              <>
                <Polygon
                  key="irregular_area_fill_demo"
                  points={areaOutlinePoints}
                  strokeWidth={3}
                  strokeColor="#7DD3FC"
                  fillColor="#2A38BDF8"
                  zIndex={180}
                  onPolygonPress={() => Alert.alert('区域高亮', '点击了行政区/园区高亮示例')}
                />
                <Polyline
                  key="irregular_area_outline_line_demo"
                  points={areaOutlinePoints}
                  strokeWidth={6}
                  strokeColor="#E0F2FE"
                  zIndex={181}
                />
                {areaLabelPosition && (
                  <Marker
                    key="irregular_area_label_marker"
                    position={areaLabelPosition}
                   
                    cacheKey="irregular_area_label_marker"
                  >
                    <View style={styles.areaLabelBubble}>
                      <Image 
                        style={{width:80,height:40}} 
                        resizeMode={'contain'}
                        source={{uri:'https://img.phb123.com/uploads/allimg/230413/816-2304131356350-L.png'}}
                      />
                      <Text style={styles.areaLabelEyebrow}>区域高亮示例</Text>
                      <Text style={styles.areaLabelTitle}>星湖园区</Text>
                      <Text style={styles.areaLabelMeta}>描边 + 半透明蒙层</Text>
                    </View>
                  </Marker>
                )}
              </>
            )}

            {dynamicMarkers.map((marker) => (
              <Marker
                key={marker.id}
                position={{ latitude: marker.latitude, longitude: marker.longitude }}
                title={marker.content}
                pinColor={marker.color}
                zIndex={99}
                cacheKey={marker.id}
                growAnimation={true}
                onMarkerPress={() => Alert.alert('动态标记', `点击了 ${marker.content}\nID: ${marker.id}`)}>
                 <Text
                    style={[styles.dynamicMarkerText, { backgroundColor: marker.color, borderRadius: 20,  maxWidth: 200,  textAlign: 'center',}]}
                    numberOfLines={1}>
                    {marker.content}
                  </Text>
              </Marker>
            ))}

            {/* {isMapReady && location && (
              <Marker
                key="fixed_current_location_marker"
                // 数组格式建议使用 [经度, 纬度] (GeoJSON 标准)
                // 如果传入 [纬度, 经度] 会触发自动纠错警告
                position={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                zIndex={9999}
                title={location.address}
                cacheKey="fixed_current_location_marker"
                // anchor={{ x: 0.5, y: 0.5 }}
                onMarkerPress={() => Alert.alert('标记', '点击了当前位置标记')}
                growAnimation={true}
              >

                 <Text
                    style={[
                      styles.dynamicMarkerText,
                      {
                        backgroundColor: '#007AFF',
                        borderRadius: 10,
                        textAlign: 'center',
                        maxWidth: 200,
                        lineHeight: 22,

                      },
                    ]}
                    numberOfLines={2}
                  >
                    {location.address}
                  </Text>
              </Marker>
            )} */}

            {
              isMapReady && (
                <Polyline
                  key="polyline"
                  points={[
                    { latitude: 39.92, longitude: 116.42 },
                    { latitude: 39.93, longitude: 116.43 },
                    { latitude: 39.94, longitude: 116.44 },
                  ]}
                  strokeColor="#007AFF"
                  strokeWidth={4}
                />
              )
            }

            {isMapReady && <Marker
              key="draggable_marker"
              position={{ latitude: 39.92, longitude: 116.42 }}
              title="可拖拽标记"
              draggable={true}
              cacheKey={"draggable_marker"}
              pinColor="purple"
              onMarkerPress={() => Alert.alert('标记', '点击了可拖拽标记')}
              onMarkerDragEnd={(e) => {
                Alert.alert('拖拽结束', `新位置: ${e.nativeEvent.latitude.toFixed(6)}, ${e.nativeEvent.longitude.toFixed(6)}`);
              }}
            />}

            {isMapReady && <Marker
              key="custom_icon_marker"
              position={{ latitude: 39.93, longitude: 116.43 }}
              title="自定义图标"
              snippet="自定义图标描述"
              icon={positionIconUri}
              iconWidth={40}
              iconHeight={40}
            />}

            {isMapReady && (
              <Polyline
                key="geojson_route"
                // 直接使用 GeoJSON 原始数据中的 coordinates 数组，无需任何转换！
                points={mockGeoJsonRoute.geometry.coordinates}
                strokeColor="#FF0000"
                strokeWidth={6}
                zIndex={100}
                onPolylinePress={() => Alert.alert('提示', '这是一条直接使用 GeoJSON 数组数据的轨迹')}
              />
            )}

            {/* {isMapReady && Platform.OS === 'ios' && (
              <Marker
                key="ios_animated_marker"
                position={{ latitude: 39.94, longitude: 116.44 }}
                title="iOS 动画标记"
                pinColor="green"
                animatesDrop={true}
                cacheKey={"ios_animated_marker"}
                onMarkerPress={() => Alert.alert('标记', '点击了 iOS 动画标记')}
              />
            )} */}
          </>
        }
        <MapUI>

          {/* 底部悬浮操作面板 */}
          <View pointerEvents="box-none" style={[styles.overlayBottom]}>
            <View style={[styles.panelWrap, { borderColor: hairline }]}>
            
            
              <View style={styles.panelInner}>
                <View style={styles.panelHeaderRow}>
                  <View style={styles.panelHeaderTextWrap}>
                    <Text style={[styles.panelTitle, { color: textColor }]}>地图测试面板</Text>
                    <Text style={[styles.chipText, { color: muted }]}>Legacy 回归页，聚焦集中验证；更细的 API 示例请回到示例中心查看。</Text>
                  </View>
                  <Pressable
                    style={[styles.panelExpandBtn, { backgroundColor: panelExpanded ? '#374151' : '#2563EB' }]}
                    onPress={() => setPanelExpanded((prev) => !prev)}
                  >
                    <Text style={styles.panelExpandBtnText}>{panelExpanded ? '收起' : '展开'}</Text>
                  </Pressable>
                </View>

                <Text style={[styles.chipText, { color: lastPressedPoi ? '#34C759' : muted, marginBottom: 10 }]}>
                  {lastPressedPoi
                    ? `最近 POI：${lastPressedPoi.name} (${lastPressedPoi.position.latitude.toFixed(4)}, ${lastPressedPoi.position.longitude.toFixed(4)})`
                    : '最近 POI：暂无，点一下地图上的 POI 试试'}
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickActionRow}
                  style={styles.quickActionScroller}
                >
                  <Pressable
                    style={[
                      styles.quickActionBtn,
                      { backgroundColor: isFollowing ? '#4CAF50' : primary }
                    ]}
                    onPress={handleGetLocation}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text style={styles.actionBtnText}>{isFollowing ? '📍跟随' : '🎯定位'}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickActionBtn, { backgroundColor: isLocating ? '#FF6347' : '#4CAF50' }]}
                    onPress={isLocating ? handleStopLocation : handleStartLocation}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text style={styles.actionBtnText}>{isLocating ? '停止定位' : '开始定位'}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickActionBtn, { backgroundColor: '#2196F3' }]}
                    onPress={handleZoomIn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text style={styles.actionBtnText}>放大</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickActionBtn, { backgroundColor: '#FF9800' }]}
                    onPress={handleZoomOut}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text style={styles.actionBtnText}>缩小</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.quickActionBtn, { backgroundColor: '#607D8B' }]}
                    onPress={handleTakeSnapshot}
                  >
                    <Text style={styles.actionBtnText}>截图</Text>
                  </Pressable>
                </ScrollView>

                {panelExpanded && (
                  <View style={styles.sectionBody}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.sectionTabRow}
                      style={styles.sectionTabScroller}
                    >
                      <Pressable
                        style={[
                          styles.sectionTab,
                          activePanelSection === 'overlays' && styles.sectionTabActive,
                        ]}
                        onPress={() => setActivePanelSection('overlays')}
                      >
                        <Text style={styles.sectionTabText}>覆盖物</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.sectionTab,
                          activePanelSection === 'advanced' && styles.sectionTabActive,
                        ]}
                        onPress={() => setActivePanelSection('advanced')}
                      >
                        <Text style={styles.sectionTabText}>高级功能</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.sectionTab,
                          activePanelSection === 'debug' && styles.sectionTabActive,
                        ]}
                        onPress={() => setActivePanelSection('debug')}
                      >
                        <Text style={styles.sectionTabText}>调试验证</Text>
                      </Pressable>
                    </ScrollView>

                    {renderExpandedPanelContent()}
                  </View>
                )}
              </View>
            </View>
          </View>
        </MapUI>
      </MapView>

                         {/* 顶部信息 Chip */}
          <View style={[styles.overlayTop, { top: 100 }]}>
            {!!cameraInfo && (
              <View style={[styles.chipWrap, { borderColor: hairline }]}>
              
                <Text style={[styles.chipText, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
                  📷 {cameraInfo}
                </Text>
              </View>
            )}
            <View style={[styles.chipWrap, { borderColor: hairline }]}>
            
              <Text style={[styles.chipText, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
                事件统计 · move {cameraMoveEventCount} / idle {cameraIdleEventCount} · 原生 {nativeCameraThrottleMs}ms
              </Text>
            </View>
            <View style={[styles.chipWrap, { borderColor: hairline }]}>
             
              <Text style={[styles.chipText, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
                聚合图标 · {useClusterIcon ? 'icon on' : 'icon off'} {showCluster ? '· 聚合显示中' : '· 聚合未开启'}
              </Text>
            </View>
          </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeScreen: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111827',
  },
  welcomeHero: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 24,
    gap: 14,
  },
  welcomeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#0F172A',
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  welcomeDesc: {
    fontSize: 15,
    lineHeight: 24,
    color: '#CBD5E1',
  },
  welcomePrimaryBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  welcomePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  privacyModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  privacyCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  privacyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  privacyDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: '#D1D5DB',
  },
  privacyMeta: {
    fontSize: 13,
    lineHeight: 20,
    color: '#93C5FD',
  },
  privacyBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  privacyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  privacyBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  privacyGhostBtn: {
    backgroundColor: '#374151',
  },
  privacyGhostBtnText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '700',
  },
  map: {
    flex: 1,
    minHeight: 400,
  },
  overlayTop: {
    position: 'absolute',
    left: 16,
    right: 16,
    gap: 8,
  },
  chipWrap: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    maxWidth: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  chipText: {
    fontSize: 12,
  },
  overlayBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 24 : 16,
  },
  panelWrap: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    backgroundColor: Platform.OS == 'android' ? 'rgba(255,255,255,0.5)' : 'transparent',
  },
  panelInner: {
    padding: 10,
    backgroundColor: Platform.OS == 'android' ? 'rgba(255,255,255,0.5)' : 'transparent',
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  panelHeaderTextWrap: {
    flex: 1,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  panelExpandBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelExpandBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionScroller: {
    marginBottom: 2,
  },
  quickActionRow: {
    gap: 8,
    paddingRight: 4,
  },
  quickActionBtn: {
    minWidth: 82,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.16)',
  },
  sectionTabScroller: {
    marginBottom: 10,
  },
  sectionTabRow: {
    gap: 8,
    paddingRight: 4,
  },
  sectionTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sectionTabActive: {
    backgroundColor: '#2563EB',
  },
  sectionTabText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'transparent',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  removeBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6347',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  areaLabelBubble: {
    // minWidth: 128,
    // maxWidth: 168,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(10, 25, 41, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  areaLabelEyebrow: {
    color: '#7DD3FC',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  areaLabelTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  areaLabelMeta: {
    color: 'rgba(226, 232, 240, 0.82)',
    fontSize: 11,
    fontWeight: '600',
  },
  dynamicMarkerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 5,
    paddingHorizontal: 12,

    // borderRadius: 14,
    // textAlign: 'center',
    // overflow: 'hidden',
  },
});
