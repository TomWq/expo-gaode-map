import { BlurView } from 'expo-blur';
import {
  Circle,
  ExpoGaodeMapModule,
  MapView,
  MapViewRef,
  Marker,
  Polygon,
  Polyline,
  useLocationPermissions,
  MultiPoint,
  HeatMap,
  Cluster,
  type CameraPosition,
  type Coordinates,
  type ReGeocode,
  LatLng,
  ClusterPoint,
  MapUI,

} from 'expo-gaode-map';
import { reGeocode } from 'expo-gaode-map-search'
import * as MediaLibrary from 'expo-media-library';

import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, View, TouchableOpacity } from 'react-native';

import TestNewPermissionMethods from './TestNewPermissionMethods';
import UseMapExample from './UseMapExample';
import PolylineExample from './PolylineExample';
import WebAPIAdvancedTest from './WebAPIAdvancedTest';


const iconUri = Image.resolveAssetSource(require('./assets/positio_icon.png')).uri;
// 从环境变量读取 Key（示例）。生产请用 EXPO_PUBLIC_ 前缀或远端下发
const WEB_API_KEY = process.env.EXPO_PUBLIC_AMAP_WEB_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_AMAP_ANDROID_KEY;
const IOS_KEY = process.env.EXPO_PUBLIC_AMAP_IOS_KEY;

// 模拟热力图数据 (在当前位置周围生成)
const generateHeatMapData = (center: Coordinates, count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      latitude: center.latitude + (Math.random() - 0.5) * 0.05,
      longitude: center.longitude + (Math.random() - 0.5) * 0.05,
      count: Math.floor(Math.random() * 100), // 权重
    });
  }
  return data;
};

// 模拟海量点数据
const generateMultiPointData = (center: Coordinates, count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      latitude: center.latitude + (Math.random() - 0.5) * 0.1,
      longitude: center.longitude + (Math.random() - 0.5) * 0.1,
      title: `Point ${i}`,
      subtitle: `Subtitle ${i}`,
      customerId: `id_${i}`
    });
  }
  return data;
};

// 模拟原生聚合数据
const generateClusterData = (center: Coordinates, count: number) => {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      latitude: center.latitude + (Math.random() - 0.5) * 0.1,
      longitude: center.longitude + (Math.random() - 0.5) * 0.1,
      title: `Cluster Item ${i}`,
      snippet: `Detail info ${i}`,
    });
  }
  return data;
};

export default function MamScreen() {

  const mapRef = useRef<MapViewRef>(null);
  const [location, setLocation] = useState<Coordinates | ReGeocode | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [initialPosition, setInitialPosition] = useState<CameraPosition | null>(null);
  const [cameraInfo, setCameraInfo] = useState<string>('');
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [status, requestPermission] = useLocationPermissions()
  const [showPolylineExample, setShowPolylineExample] = useState(false);
  const [showWebAPITest, setShowWebAPITest] = useState(false);

  // 高级覆盖物状态
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [heatMapData, setHeatMapData] = useState<LatLng[]>([]);

  const [showMultiPoint, setShowMultiPoint] = useState(false);
  const [multiPointData, setMultiPointData] = useState<any[]>([]);

  const [showCluster, setShowCluster] = useState(false);
  const [clusterData, setClusterData] = useState<ClusterPoint[]>([]);

  // 主题与动态色
  const colorScheme = 'dark';
  const primary = '#007aff';
  const textColor = colorScheme === 'dark' ? '#fff' : '#1c1c1c';
  const muted = colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : '#444';
  const cardBg = colorScheme === 'dark' ? 'rgba(16,16,16,0.7)' : 'rgba(255,255,255,0.85)';
  const chipBg = colorScheme === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)';
  const hairline = colorScheme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  const [mSize, setMSize] = useState({ width: 0, height: 0 });

  // 用于测试 Marker 动态添加/删除和位置变化
  const [dynamicMarkers, setDynamicMarkers] = useState<Array<{
    id: string;
    latitude: number;
    longitude: number;
    content: string;
    color: 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet' | 'purple';
    width?: number;
    height?: number;
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
    points: Array<{ latitude: number; longitude: number }>;
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
  const [privacyAgreed, setPrivacyAgreed] = useState(true);

  // 模拟从后端获取的 GeoJSON 格式轨迹数据 (数组格式 [经度, 纬度])
  // 这种数据格式在实际开发中非常常见，比如路径规划、历史轨迹回放
  const mockGeoJsonRoute = {
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

  useEffect(() => {
    const init = async () => {
      try {

        // ExpoGaodeMapModule.initSDK({
        //   webKey: '',
        // })

        await requestPermission()

        // 配置定位选项
        ExpoGaodeMapModule.setLocatingWithReGeocode(true);
        ExpoGaodeMapModule.setInterval(5000);
        // ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates(true);
        ExpoGaodeMapModule.setDistanceFilter(0);
        ExpoGaodeMapModule.setDesiredAccuracy(3);
        ExpoGaodeMapModule.startUpdatingHeading();
        // 先获取初始位置
        const loc = await ExpoGaodeMapModule.getCurrentLocation();
        setLocation(loc);
        setInitialPosition({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 16.6
        });
        const result = await reGeocode({
          location: {
            latitude: loc.latitude,
            longitude: loc.longitude,
          }
        })
      
        // 使用便捷方法监听连续定位更新
        const subscription = ExpoGaodeMapModule.addLocationListener((location) => {
          console.log('收到定位更新:', location);
          setLocation(location);
        });

        return () => {
          subscription.remove();
        };
      } catch (error: any) {
        console.error('初始化失败:', error);
        if (error?.type) {
          console.warn(`错误类型: ${error.type}`);
          console.warn(`解决方案: ${error.solution}`);
        }
        setInitialPosition({ target: { latitude: 39.9, longitude: 116.4 }, zoom: 16.6 });
      }
    };

    init();
  }, [privacyAgreed]);

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
    }
  }, [location, isMapReady, showHeatMap, showMultiPoint, showCluster]);


  const handleGetLocation = async () => {
    try {
      const loc = await ExpoGaodeMapModule.getCurrentLocation();

      setLocation(loc);
      if (mapRef.current) {
        await mapRef.current.moveCamera({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 16.6,
        }, 0);
      }
      // 重新启用跟随模式
      setIsFollowing(true);
    } catch (error) {
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
    if (mapRef.current) {
      const pos = await mapRef.current.getCameraPosition();
      if (pos.zoom !== undefined) {
        await mapRef.current.setZoom(pos.zoom + 1, true);
      }
    }
  };

  const handleZoomOut = async () => {
    if (mapRef.current) {
      const pos = await mapRef.current.getCameraPosition();
      if (pos.zoom !== undefined) {
        await mapRef.current.setZoom(pos.zoom - 1, true);
      }
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
    const points = [
      [location.longitude + randomOffset(), location.latitude + randomOffset()],
      [location.longitude + randomOffset(), location.latitude + randomOffset()],
      [location.longitude + randomOffset(), location.latitude + randomOffset()],
    ];
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    const newPolyline = {
      id: `polyline_${polylineIdCounter.current++}`,
      points: points as any, // 临时规避类型检查，实际已支持
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

    const total = dynamicCircles.length + dynamicMarkers.length + dynamicPolylines.length + dynamicPolygons.length;
    if (total === 0 && !showHeatMap && !showMultiPoint && !showCluster) {
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
          setHeatMapData(nextData as any);
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
          // 生成模拟聚合数据
          const points: ClusterPoint[] = [];
          for (let i = 0; i < 200; i++) {
            points.push({
              latitude: location.latitude + (Math.random() - 0.5) * 0.05,
              longitude: location.longitude + (Math.random() - 0.5) * 0.05,
              properties: { id: i, title: `Point ${i}` }
            });
          }
          setClusterData(points);
        }
      }
      return next;
    });
  };

  // 保存图片到相册
  const saveImageToAlbum = async (uri: string) => {
    try {
      // 1. 请求权限
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问相册权限才能保存截图');
        return;
      }

      // 2. 保存到相册
      const asset = await MediaLibrary.createAssetAsync(uri);

      // 3. (可选) 创建相册并移动
      // await MediaLibrary.createAlbumAsync('ExpoGaodeMap', asset, false);

      Alert.alert('保存成功', '截图已保存到系统相册');
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


  if (false) {
    return <TestNewPermissionMethods />;
  }
  if (false) {
    return <UseMapExample />;
  }

  if (showPolylineExample) {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 50,
            left: 20,
            zIndex: 100,
            backgroundColor: 'rgba(255,255,255,0.9)',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={() => setShowPolylineExample(false)}
        >
          <Text style={{ fontWeight: '600' }}>← 返回主页</Text>
        </TouchableOpacity>
        <PolylineExample />
      </View>
    );
  }

  if (showWebAPITest) {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 50,
            left: 20,
            zIndex: 100,
            backgroundColor: 'rgba(255,255,255,0.9)',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          onPress={() => setShowWebAPITest(false)}
        >
          <Text style={{ fontWeight: '600' }}>← 返回主页</Text>
        </TouchableOpacity>
        <WebAPIAdvancedTest />
      </View>
    );
  }

  if (!initialPosition) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#000', fontSize: 20, fontWeight: 'bold' }}>正在加载地图...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#000' : '#f5f5f5' }]}>

      <MapView
        ref={mapRef}
        style={styles.map}
        myLocationEnabled={true}
        indoorViewEnabled={true}
        trafficEnabled={true}
        labelsEnabled={true}
        buildingsEnabled={true}
        mapType={2}
        zoomGesturesEnabled
        scrollGesturesEnabled
        worldMapSwitchEnabled
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
        onMapLongPress={(e) => {
          console.log('地图长按:', e.nativeEvent);
          setIsFollowing(false);
        }}
        onCameraMove={({ nativeEvent }) => {
          const { cameraPosition } = nativeEvent;
          const zoom = cameraPosition.zoom ?? 0;
          const bearing = cameraPosition.bearing ?? 0;
          const info = `移动中 · 缩放 ${zoom.toFixed(2)} · 旋转 ${bearing.toFixed(2)}°`;
          setCameraInfo(info);
        }}
        onCameraIdle={({ nativeEvent }) => {
          const { cameraPosition } = nativeEvent;
          const lat = cameraPosition.target?.latitude ?? 0;
          const lng = cameraPosition.target?.longitude ?? 0;
          const zoom = cameraPosition.zoom ?? 0;
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
            icon={iconUri} // 复用图标
            iconWidth={30}
            iconHeight={30}
            onMultiPointPress={(e) => Alert.alert('海量点点击', `index: ${e.nativeEvent.index}`)}
          />
        )}

        {/* 高级覆盖物：原生聚合 */}
        {showCluster && (
          <Cluster
            points={clusterData}
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

            {dynamicMarkers.map((marker) => (
              <Marker
                key={marker.id}
                position={{ latitude: marker.latitude, longitude: marker.longitude }}
                title={marker.content}
                pinColor={marker.color}
                zIndex={99}
                customViewWidth={marker.width}
                customViewHeight={marker.height}
                cacheKey={marker.id}
                growAnimation={true}  
                onMarkerPress={() => Alert.alert('动态标记', `点击了 ${marker.content}\nID: ${marker.id}`)}
              >
                <View
                  style={{ alignSelf: 'flex-start' }}
                  onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    if (marker.width !== width || marker.height !== height) {
                      setDynamicMarkers(prev =>
                        prev.map(m =>
                          m.id === marker.id
                            ? { ...m, width: Math.ceil(width), height: Math.ceil(height) }
                            : m
                        )
                      );
                    }
                  }}
                >
                  <Text
                    style={[styles.dynamicMarkerText, { backgroundColor: marker.color, borderRadius: 10 }]}
                    numberOfLines={2}>
                    {marker.content}
                  </Text>
                </View>
              </Marker>
            ))}

            {isMapReady && location && (
              <Marker
                key="fixed_current_location_marker"
                // 数组格式建议使用 [经度, 纬度] (GeoJSON 标准)
                // 如果传入 [纬度, 经度] 会触发自动纠错警告
                position={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                }}
                zIndex={99}
                title={location.address}
                cacheKey="fixed_current_location_marker"
                customViewWidth={mSize.width}
                customViewHeight={mSize.height}
                anchor={{ x: 0.5, y: 0.5 }}
                onMarkerPress={() => Alert.alert('标记', '点击了当前位置标记')}
                growAnimation={true}  
              >
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 6,
                    paddingVertical: 4,
                  }}
                  onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    if (mSize.width !== width || mSize.height !== height) {
                      setMSize({ width: Math.ceil(width), height: Math.ceil(height) });
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.dynamicMarkerText,
                      {
                        backgroundColor: '#007AFF',
                        borderRadius: 10,
                        textAlign: 'center',
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {location.address}
                  </Text>
                </View>
              </Marker>
            )}

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
              icon={iconUri}
              iconWidth={40}
              iconHeight={40}
            />}

            {isMapReady && (
              <Polyline
                key="geojson_route"
                // 直接使用 GeoJSON 原始数据中的 coordinates 数组，无需任何转换！
                points={mockGeoJsonRoute.geometry.coordinates as any}
                strokeColor="#FF0000"
                strokeWidth={6}
                zIndex={100}
                onPolylinePress={() => Alert.alert('提示', '这是一条直接使用 GeoJSON 数组数据的轨迹')}
              />
            )}

            {isMapReady && Platform.OS === 'ios' && (
              <Marker
                key="ios_animated_marker"
                position={{ latitude: 39.94, longitude: 116.44 }}
                title="iOS 动画标记"
                pinColor="green"
                animatesDrop={true}
                cacheKey={"ios_animated_marker"}
                onMarkerPress={() => Alert.alert('标记', '点击了 iOS 动画标记')}
              />
            )}
          </>
        }
        <MapUI>
     
          {/* 底部悬浮操作面板 */}
          <View style={[styles.overlayBottom]}>
            <View style={[styles.panelWrap, { borderColor: hairline }]}>
              <BlurView
                intensity={100}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.panelInner}>
                <Text style={[styles.panelTitle, { color: textColor }]}>常用操作</Text>

                <View style={styles.actionRow}>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      { backgroundColor: isFollowing ? '#4CAF50' : primary }
                    ]}
                    onPress={handleGetLocation}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text style={styles.actionBtnText}>
                      {isFollowing ? '📍跟随' : '🎯定位'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: isLocating ? '#FF6347' : '#4CAF50' }]}
                    onPress={isLocating ? handleStopLocation : handleStartLocation}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    <Text style={styles.actionBtnText}>{isLocating ? '停止' : '开始'}</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, { backgroundColor: '#2196F3' }]} onPress={handleZoomIn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                    <Text style={styles.actionBtnText}>放大</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, { backgroundColor: '#FF9800' }]} onPress={handleZoomOut} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} android_ripple={{ color: 'rgba(255,255,255,0.2)' }}>
                    <Text style={styles.actionBtnText}>缩小</Text>
                  </Pressable>
                </View>

                <Text style={[styles.panelTitle, { color: textColor, marginTop: 12 }]}>覆盖物操作</Text>

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

                <Text style={[styles.panelTitle, { color: textColor, marginTop: 12 }]}>高级功能</Text>
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

                <Text style={[styles.panelTitle, { color: textColor, marginTop: 12 }]}>更多示例</Text>
                <View style={styles.actionRow}>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#795548' }]}
                    onPress={() => setShowPolylineExample(true)}
                  >
                    <Text style={styles.actionBtnText}>Polyline抽稀</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#673AB7' }]}
                    onPress={() => setShowWebAPITest(true)}
                  >
                    <Text style={styles.actionBtnText}>WebAPI测试</Text>
                  </Pressable>
                </View>

                <Pressable style={[styles.removeBtn]} onPress={handleRemoveAllOverlays}>
                  <Text style={styles.removeBtnText}>重置所有</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </MapUI>
      </MapView>

                         {/* 顶部信息 Chip */}
          <View style={[styles.overlayTop, { top: 100 }]}>
            {!!cameraInfo && (
              <View style={[styles.chipWrap, { borderColor: hairline }]}>
                <BlurView
                  intensity={100}
                  experimentalBlurMethod={'dimezisBlurView'}
                  tint={colorScheme === 'dark' ? 'dark' : 'light'}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={[styles.chipText, { color: textColor }]} numberOfLines={1} ellipsizeMode="tail">
                  📷 {cameraInfo}
                </Text>
              </View>
            )}
          </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    padding: 12,
    backgroundColor: Platform.OS == 'android' ? 'rgba(255,255,255,0.5)' : 'transparent',
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
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
  dynamicMarkerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
