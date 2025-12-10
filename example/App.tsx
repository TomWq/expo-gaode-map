import { useState, useEffect, useRef } from 'react';
import {
  MapView,
  MapViewRef,
  Marker,
  Circle,
  Polyline,
  Polygon,
  ExpoGaodeMapModule,
  type Coordinates,
  type ReGeocode,
  type CameraPosition,
} from 'expo-gaode-map';
import { Image, StyleSheet, View, Text, Button, Alert, Platform, ScrollView, TouchableOpacity } from 'react-native';
import RandomMarkersExample from './RandomMarkersExample';
import OptionalModuleDemo from './OptionalModuleDemo';
import SearchModuleTest from './SearchModuleTest';
import WebAPIExample from './WebAPIExample';
import PIOSearchExample from '../navigation-example/route-examples/POISearchExample';
import POISearchMapExample from '../navigation-example/route-examples/POISearchMapExample';
import POISearchNativeExample from '../navigation-example/route-examples/POISearchNativeExample';
import POISearchMapNativeExample from '../navigation-example/route-examples/POISearchMapNativeExample';
import InputTipsExample from '../navigation-example/route-examples/InputTipsExample';
import RouteExamplesMenu from '../navigation-example/route-examples/RouteExamplesMenu';
import ErrorHandlingExample from '../navigation-example/route-examples/ErrorHandlingExample';
import AddressPickerExample from '../navigation-example/route-examples/AddressPickerExample';
import AddressPickerNativeExample from '../navigation-example/route-examples/AddressPickerNativeExample';

const iconUri = Image.resolveAssetSource(require('./assets/positio_icon.png')).uri;

// 从环境变量读取 Key（示例）。生产请用 EXPO_PUBLIC_ 前缀或远端下发
const WEB_API_KEY = process.env.EXPO_PUBLIC_AMAP_WEB_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_AMAP_ANDROID_KEY;
const IOS_KEY = process.env.EXPO_PUBLIC_AMAP_IOS_KEY;

export default function App() {
  const [showRandomMarkers, setShowRandomMarkers] = useState(false);
  const [showOptionalModuleDemo, setShowOptionalModuleDemo] = useState(false);
  const [showSearchTest, setShowSearchTest] = useState(false);
  const [showWebAPITest, setShowWebAPITest] = useState(false);

  const [showRouteExamples, setShowRouteExamples] = useState(false);
  const [showPOIExamples, setShowPOIExamples] = useState(false);
  const [showPOIMapExample, setShowPOIMapExample] = useState(false);
  const [showPOISearchNativeExample, setShowPOISearchNativeExample] = useState(false);
  const [showPOISearchMapNativeExample, setShowPOISearchMapNativeExample] = useState(false);
  const [showInputTipsExample, setShowInputTipsExample] = useState(false);
  const [showErrorHandlingExample, setShowErrorHandlingExample] = useState(false);
  const [showAddressPickerExample, setShowAddressPickerExample] = useState(false);
  const [showAddressPickerNativeExample, setShowAddressPickerNativeExample] = useState(false);

  const mapRef = useRef<MapViewRef>(null);
  const [location, setLocation] = useState<Coordinates | ReGeocode | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [initialPosition, setInitialPosition] = useState<CameraPosition | null>(null);
  const [cameraInfo, setCameraInfo] = useState<string>('');
  
  // 用于测试动态更新 Marker 内容
  const [markerContent, setMarkerContent] = useState<'text1' | 'text2' | 'none'>('text1');
  const [markerUpdateCount, setMarkerUpdateCount] = useState(0);
  
  // 用于测试 Marker 动态添加/删除和位置变化
  const [dynamicMarkers, setDynamicMarkers] = useState<Array<{
    id: string;
    latitude: number;
    longitude: number;
    content: string;
    color: 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet' | 'purple';
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

  useEffect(() => {
    const init = async () => {
      try {
        if (!privacyAgreed) return;
        ExpoGaodeMapModule.updatePrivacyCompliance(true);
        // 初始化 SDK（建议通过 config-plugin/原生清单注入安卓/iOS Key）
        const sdkConfig: Record<string, string> = {};
        if (ANDROID_KEY) sdkConfig.androidKey = ANDROID_KEY;
        if (IOS_KEY) sdkConfig.iosKey = IOS_KEY;
        if (WEB_API_KEY) sdkConfig.webKey = WEB_API_KEY;
        ExpoGaodeMapModule.initSDK(sdkConfig);
        
        // 检查定位权限
        const status = await ExpoGaodeMapModule.checkLocationPermission();
        if (!status.granted) {
          const result = await ExpoGaodeMapModule.requestLocationPermission();
          if (!result.granted) {
            setInitialPosition({ target: { latitude: 39.9, longitude: 116.4 }, zoom: 15 });
            return;
          }
        }
        
        // 配置定位选项
        ExpoGaodeMapModule.setLocatingWithReGeocode(true);
        ExpoGaodeMapModule.setInterval(5000);
        // ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates(true);
        ExpoGaodeMapModule.setDistanceFilter(10);
        ExpoGaodeMapModule.setDesiredAccuracy(3);
        
        // 先获取初始位置
        const loc = await ExpoGaodeMapModule.getCurrentLocation();
        setLocation(loc);
        setInitialPosition({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 15
        });
        
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
        if (error?.code === 'PRIVACY_NOT_AGREED') {
          Alert.alert('错误', '请先同意隐私协议');
        } else if (error?.code === 'API_KEY_NOT_SET') {
          Alert.alert('错误', '未设置 API Key');
        } else {
          Alert.alert('错误', `初始化失败: ${error?.message || error}`);
        }
        setInitialPosition({ target: { latitude: 39.9, longitude: 116.4 }, zoom: 15 });
      }
    };

    init();
  }, [privacyAgreed]);

  // 隐私协议交互
  const handleAgreePrivacy = () => {
    try {
      // 用户明确同意后，先更新隐私合规状态，再触发初始化流程
      ExpoGaodeMapModule.updatePrivacyCompliance(true);
      setPrivacyAgreed(true);
    } catch {
      Alert.alert('错误', '设置隐私协议状态失败');
    }
  };

  const handleDeclinePrivacy = () => {
    ExpoGaodeMapModule.updatePrivacyCompliance(false);
    setPrivacyAgreed(false);
    Alert.alert('提示', '未同意隐私协议，地图与定位功能不可用');
  };

  const handleGetLocation = async () => {
    try {
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
     
      setLocation(loc);
      if (mapRef.current) {
        await mapRef.current.moveCamera({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 15,
        }, 300);
      }
    } catch (error) {
      Alert.alert('错误', '获取位置失败');
    }
  };

  const handleStartLocation = () => {
    ExpoGaodeMapModule.start();
    setIsLocating(true);
    Alert.alert('成功', '开始连续定位');
  };

  const handleStopLocation = () => {
    ExpoGaodeMapModule.stop();
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
    // Alert.alert('成功', `已添加圆形\n当前共 ${dynamicCircles.length + 1} 个动态圆形`);
  };

  // 声明式 API: 添加标记
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
    };
    
    setDynamicMarkers(prev => [...prev, newMarker]);
    // Alert.alert('成功', `已添加标记\n当前共 ${dynamicMarkers.length + 1} 个动态标记`);
  };

  // 声明式 API: 添加折线
  const handleAddPolyline = () => {
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
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    
    const newPolyline = {
      id: `polyline_${polylineIdCounter.current++}`,
      points,
      color: randomColor,
    };
    
    setDynamicPolylines(prev => [...prev, newPolyline]);
    // Alert.alert('成功', `已添加折线\n当前共 ${dynamicPolylines.length + 1} 个动态折线`);
  };

  // 声明式 API: 添加多边形
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
    // Alert.alert('成功', `已添加多边形\n当前共 ${dynamicPolygons.length + 1} 个动态多边形`);
  };

  // 移除所有动态覆盖物
  const handleRemoveAllOverlays = () => {
    const total = dynamicCircles.length + dynamicMarkers.length + dynamicPolylines.length + dynamicPolygons.length;
    if (total === 0) {
      Alert.alert('提示', '没有可移除的覆盖物');
      return;
    }
    
    setDynamicCircles([]);
    setDynamicMarkers([]);
    setDynamicPolylines([]);
    setDynamicPolygons([]);
    Alert.alert('成功', `已移除所有 ${total} 个动态覆盖物`);
  };

  // 测试动态更新 Marker 内容
  const handleToggleMarkerContent = () => {
    setMarkerUpdateCount(prev => prev + 1);
    
    if (markerContent === 'text1') {
      setMarkerContent('text2');
      Alert.alert('切换内容', '已切换到文本2');
    } else if (markerContent === 'text2') {
      setMarkerContent('none');
      Alert.alert('移除内容', '已移除自定义内容（显示默认图标）');
    } else {
      setMarkerContent('text1');
      Alert.alert('切换内容', '已切换到文本1');
    }
  };


  // 未同意隐私协议前展示引导页
  if (!privacyAgreed) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>隐私协议</Text>
        <View style={{ padding: 16 }}>
          <Text style={styles.testDescription}>
            使用地图与定位功能前，请阅读并同意隐私政策。我们将用于提供地图显示、定位导航等服务。
          </Text>
          <View style={{ height: 10 }} />
          <Button title="不同意" color="#9E9E9E" onPress={handleDeclinePrivacy} />
          <View style={{ height: 10 }} />
          <Button title="同意并继续" color="#4CAF50" onPress={handleAgreePrivacy} />
        </View>
      </View>
    );
  }

  if (!initialPosition) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>正在加载地图...</Text>
      </View>
    );
  }

  if(showAddressPickerNativeExample){
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowAddressPickerNativeExample(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <AddressPickerNativeExample />
      </View>
    );
  }

  if(showErrorHandlingExample){
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowErrorHandlingExample(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <ErrorHandlingExample />
      </View>
    );
  }

  if(showPOISearchNativeExample){
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowPOISearchNativeExample(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <POISearchNativeExample />
      </View>
    );
  }

  if(showPOISearchMapNativeExample){
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowPOISearchMapNativeExample(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <POISearchMapNativeExample />
      </View>
    );
  }

  if(showPOIExamples){
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowPOIExamples(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <PIOSearchExample />
      </View>
    );
  }

  if(showAddressPickerExample){
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowAddressPickerExample(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <AddressPickerExample />
      </View>
    );
  }

  if(showPOIMapExample){
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowPOIMapExample(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <POISearchMapExample />
      </View>
    );
  }

  if(showInputTipsExample){
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowInputTipsExample(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <InputTipsExample />
      </View>
    );
  }

  // 如果显示路径规划示例
  if(showRouteExamples){
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowRouteExamples(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <RouteExamplesMenu />
      </View>
    );
  }
  

  // 如果显示 Web API 测试页面
  if (showWebAPITest) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowWebAPITest(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <WebAPIExample />
      </View>
    );
  }

  // 如果显示搜索测试页面
  if (showSearchTest) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowSearchTest(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <SearchModuleTest />
      </View>
    );
  }


  // 如果显示随机标记示例,则渲染该组件
  if (showRandomMarkers) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setShowRandomMarkers(false)}
        >
          <Text style={styles.switchButtonText}>← 返回完整示例</Text>
        </TouchableOpacity>
        <RandomMarkersExample />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>高德地图完整示例</Text>
        <View style={styles.exampleButtonContainer}>
          <TouchableOpacity
            style={styles.exampleButton}
            onPress={() => setShowRouteExamples(true)}
          >
            <Text style={styles.exampleButtonText}>🚗 路径规划示例</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exampleButton}
            onPress={() => setShowPOIExamples(true)}
          >
            <Text style={styles.exampleButtonText}>📍 POI 搜索</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => setShowPOIMapExample(true)}
          >
            <Text style={styles.exampleButtonText}>🗺️ POI+地图</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#FF9800' }]}
            onPress={() => setShowInputTipsExample(true)}
          >
            <Text style={styles.exampleButtonText}>💡 输入提示</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => setShowAddressPickerExample(true)}
          >
            <Text style={styles.exampleButtonText}>🗺️ 地址选择</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#FF9800' }]}
            onPress={() => setShowAddressPickerNativeExample(true)}
          >
            <Text style={styles.exampleButtonText}>🗺️ 原生地址选择器</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#9C27B0' }]}
            onPress={() => setShowPOISearchNativeExample(true)}
          >
            <Text style={styles.exampleButtonText}>🔍 原生POI搜索</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#3F51B5' }]}
            onPress={() => setShowPOISearchMapNativeExample(true)}
          >
            <Text style={styles.exampleButtonText}>🗺️ 原生POI+地图</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#FF9800' }]}
            onPress={() => setShowErrorHandlingExample(true)}
          >
            <Text style={styles.exampleButtonText}>🚨 错误处理</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#FF9800' }]}
            onPress={() => setShowWebAPITest(true)}
          >
            <Text style={styles.exampleButtonText}>🌐 Web API</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.exampleButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => setShowSearchTest(true)}
          >
            <Text style={styles.exampleButtonText}>🔍 搜索测试</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.exampleButton}
            onPress={() => setShowRandomMarkers(true)}
          >
            <Text style={styles.exampleButtonText}>📍 随机标记</Text>
          </TouchableOpacity> */}
        </View>
      </View>
      
      <MapView
        ref={mapRef}
        style={styles.map}
        myLocationEnabled={true}
        indoorViewEnabled={true}
        trafficEnabled={true}
        compassEnabled={true}
        tiltGesturesEnabled={true}
        initialCameraPosition={initialPosition}
        minZoom={3}
        maxZoom={20}
        userLocationRepresentation={{
          showsAccuracyRing:false,
          image: iconUri,
          imageWidth: 40,
          imageHeight: 40
        }}
       onLoad={() => console.log('地图加载完成')}
        onMapPress={(e) => console.log('地图点击:', e.nativeEvent)}
        onMapLongPress={(e) => console.log('地图长按:', e.nativeEvent)}
        onCameraMove={({ nativeEvent }) => {
          const { cameraPosition } = nativeEvent;
          const zoom = cameraPosition.zoom ?? 0;
          const bearing = cameraPosition.bearing ?? 0;
          const info = `移动中 - 缩放: ${zoom.toFixed(2)}, 旋转: ${bearing.toFixed(2)}°`;
          setCameraInfo(info);
          console.log('相机移动:', cameraPosition);
        }}
        onCameraIdle={({ nativeEvent }) => {
          const { cameraPosition } = nativeEvent;
          const lat = cameraPosition.target?.latitude ?? 0;
          const lng = cameraPosition.target?.longitude ?? 0;
          const zoom = cameraPosition.zoom ?? 0;
          const info = `停止 - 中心: ${lat.toFixed(4)}, ${lng.toFixed(4)}, 缩放: ${zoom.toFixed(2)}`;
          setCameraInfo(info);
          console.log('相机停止:', cameraPosition);
        }}
      >
        {/* 声明式覆盖物 */}
        {location && (
          <Circle
            center={{ latitude: location.latitude, longitude: location.longitude }}
            radius={300}
            fillColor="#4400FF00"
            strokeColor="#FF00FF00"
            strokeWidth={3}
            zIndex={99}
            onCirclePress={() => Alert.alert('圆形', '点击了声明式圆形')}
          />
        )}
        
        {/* 动态添加的圆形 */}
        {dynamicCircles.map((circle) => (
          <Circle
            key={circle.id}
            center={{ latitude: circle.latitude, longitude: circle.longitude }}
            radius={circle.radius}
            fillColor={circle.fillColor}
            strokeColor={circle.strokeColor}
            strokeWidth={2}
            onCirclePress={() => Alert.alert('圆形', `点击了动态圆形 #${circle.id}`)}
          />
        ))}
        
        {/* 动态添加的折线 */}
        {dynamicPolylines.map((polyline) => (
          <Polyline
            key={polyline.id}
            points={polyline.points}
            strokeWidth={5}
            strokeColor={polyline.color}
          />
        ))}
        
        {/* 动态添加的多边形 */}
        {dynamicPolygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            points={polygon.points}
            fillColor={polygon.fillColor}
            strokeColor={polygon.strokeColor}
            strokeWidth={2}
          />
        ))}
      
        {/* 动态添加的 Marker 列表 - 移到最前面 */}
        {dynamicMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.content}
            pinColor={marker.color}
            zIndex={99}
            onMarkerPress={() => Alert.alert('动态标记', `点击了 ${marker.content}\nID: ${marker.id}`)}
          >
            <View style={[styles.markerContainer,{
              backgroundColor: marker.color}]}>
              <Text style={styles.markerText}>{marker.content}</Text>
            </View>
          </Marker>
        ))}
        
        {/* 固定的当前位置 Marker */}
        {location && (
          <Marker
            key="fixed_current_location_marker"
            position={{ latitude: location.latitude, longitude: location.longitude }}
            title={location.address}
            onMarkerPress={() => Alert.alert('标记', '点击了当前位置标记')}
          >
            <View style={styles.markerContainer}>
              <Text style={[styles.markerText, { color: '#2196F3' }]}>{location?.address}</Text>
            </View>
          </Marker>
        )}
        
        <Marker
          key="draggable_marker"
          position={{ latitude: 39.92, longitude: 116.42 }}
          title="可拖拽标记"
          draggable={true}
          pinColor="purple"
          onMarkerPress={() => Alert.alert('标记', '点击了可拖拽标记')}
          onMarkerDragEnd={(e) => {
            Alert.alert('拖拽结束', `新位置: ${e.nativeEvent.latitude.toFixed(6)}, ${e.nativeEvent.longitude.toFixed(6)}`);
          }}
        />
        
        <Marker
          key="custom_icon_marker"
          position={{ latitude: 39.93, longitude: 116.43 }}
          title="自定义图标"
          snippet="自定义图标描述"
          icon={iconUri}
          iconWidth={40}
          iconHeight={40}
          // onMarkerPress={() => Alert.alert('标记', '点击了自定义图标标记')}
        />
        
        {Platform.OS === 'ios' && (
          <Marker
            key="ios_animated_marker"
            position={{ latitude: 39.94, longitude: 116.44 }}
            title="iOS 动画标记"
            pinColor="green"
            animatesDrop={true}
            onMarkerPress={() => Alert.alert('标记', '点击了 iOS 动画标记')}
          />
        )}
        
        <Polygon
          points={[
            { latitude: 39.88, longitude: 116.38 },
            { latitude: 39.88, longitude: 116.42 },
            { latitude: 39.86, longitude: 116.40 },
          ]}
          fillColor="rgba(255, 0, 0, 0.5)"
          strokeColor="#FFFF0000"
          strokeWidth={3}
          zIndex={1}
          onPolygonPress={() => Alert.alert('多边形', '点击了声明式多边形')}
        />
        
        <Polyline
          points={[
            { latitude: 39.85, longitude: 116.35 },
            { latitude: 39.87, longitude: 116.37 },
            { latitude: 39.89, longitude: 116.35 },
          ]}
          strokeWidth={5}
          strokeColor="#FFFF0000"
          onPolylinePress={() => Alert.alert('折线', '点击了普通折线')}
        />
        
        <Polyline
          points={[
            { latitude: 39.85, longitude: 116.45 },
            { latitude: 39.87, longitude: 116.47 },
            { latitude: 39.89, longitude: 116.45 },
          ]}
          strokeWidth={5}
          strokeColor="#FF0000FF"
          dotted={true}
          onPolylinePress={() => Alert.alert('折线', '点击了虚线折线')}
        />
        
        <Polyline
          points={[
            { latitude: 39.95, longitude: 116.35 },
            { latitude: 39.97, longitude: 116.37 },
            { latitude: 39.99, longitude: 116.35 },
          ]}
          strokeWidth={20}
          strokeColor="#FFFF0000"
          texture={iconUri}
          onPolylinePress={() => Alert.alert('折线', '点击了纹理折线')}
        />
        
       
      </MapView>

      {location && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>纬度: {location.latitude.toFixed(6)}</Text>
          <Text style={styles.infoText}>经度: {location.longitude.toFixed(6)}</Text>
          <Text style={styles.infoText}>精度: {location.accuracy.toFixed(2)}m</Text>
          {'address' in location && location.address && (
            <Text style={styles.infoText}>地址: {location.address}</Text>
          )}
          {cameraInfo && (
            <Text style={[styles.infoText, styles.cameraInfo]}>📷 相机: {cameraInfo}</Text>
          )}
        </View>
      )}

      <ScrollView style={styles.buttonContainer} contentContainerStyle={styles.buttonContentContainer}>
        <Text style={styles.sectionTitle}>定位控制</Text>
        <Button title="获取当前位置" onPress={handleGetLocation} />
        <View style={styles.buttonSpacer} />
        <Button
          title={isLocating ? "停止连续定位" : "开始连续定位"}
          onPress={isLocating ? handleStopLocation : handleStartLocation}
          color={isLocating ? "#FF6347" : "#4CAF50"}
        />
        
        <View style={styles.sectionSpacer} />
        <Text style={styles.sectionTitle}>地图控制</Text>
        <Button title="放大地图" onPress={handleZoomIn} color="#2196F3" />
        <View style={styles.buttonSpacer} />
        <Button title="缩小地图" onPress={handleZoomOut} color="#FF9800" />
        
        <View style={styles.sectionSpacer} />
        <Text style={styles.sectionTitle}>声明式覆盖物 - 动态添加/删除</Text>
        <Text style={styles.testDescription}>
          所有覆盖物通过声明式 JSX 组件管理{'\n'}
          圆形: {dynamicCircles.length} | 标记: {dynamicMarkers.length} | 折线: {dynamicPolylines.length} | 多边形: {dynamicPolygons.length}
        </Text>
        <Button title="添加圆形" onPress={handleAddCircle} color="#4CAF50" />
        <View style={styles.buttonSpacer} />
        <Button title="添加标记" onPress={handleAddMarker} color="#2196F3" />
        <View style={styles.buttonSpacer} />
        <Button title="添加折线" onPress={handleAddPolyline} color="#9C27B0" />
        <View style={styles.buttonSpacer} />
        <Button title="添加多边形" onPress={handleAddPolygon} color="#FF5722" />
        <View style={styles.buttonSpacer} />
        <Button title="移除所有动态覆盖物" onPress={handleRemoveAllOverlays} color="#FF6347" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 10,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  switchButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 15,
    zIndex: 1000,
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  switchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  exampleButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  exampleButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exampleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
    minHeight: 400,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  infoText: {
    fontSize: 14,
    marginVertical: 2,
    color: '#333',
  },
  cameraInfo: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginTop: 5,
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  sectionSpacer: {
    height: 20,
  },
  buttonSpacer: {
    height: 10,
  },
  buttonContentContainer: {
    paddingBottom: 30,
  },
  markerContainer: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    width: 200,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    color: 'white',
    fontSize: 12,
  },
  dynamicMarkerContainer1: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    width: 250,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dynamicMarkerContainer2: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    width: 250,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dynamicMarkerText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dynamicMarkerSubText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  testDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
    lineHeight: 18,
  },
  dynamicMarkerItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: 180,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  dynamicMarkerItemText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
