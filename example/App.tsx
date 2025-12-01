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
import { Image, StyleSheet, View, Text, Button, Alert, Platform, ScrollView } from 'react-native';

const iconUri = Image.resolveAssetSource(require('./assets/positio_icon.png')).uri;

export default function App() {
  const mapRef = useRef<MapViewRef>(null);
  const [location, setLocation] = useState<Coordinates | ReGeocode | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [initialPosition, setInitialPosition] = useState<CameraPosition | null>(null);
  
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

  useEffect(() => {
    const init = async () => {
      try {
        ExpoGaodeMapModule.initSDK({
          androidKey: '8ac9e5983e34398473ecc23fec1d4adc',
          iosKey: 'b07b626eb2ce321df3ff0e9e9371f389',
        });
        
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
        ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates(true);
        ExpoGaodeMapModule.setDistanceFilter(10);
        ExpoGaodeMapModule.setDesiredAccuracy(3);
        
        const subscription = ExpoGaodeMapModule.addListener('onLocationUpdate', (loc) => {
          setLocation(loc);
        });
        
        const loc = await ExpoGaodeMapModule.getCurrentLocation();
        setLocation(loc);
        setInitialPosition({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 15
        });
        
        return () => subscription.remove();
      } catch (error) {
        console.error('初始化失败:', error);
        setInitialPosition({ target: { latitude: 39.9, longitude: 116.4 }, zoom: 15 });
      }
    };

    init();
  }, []);

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


  if (!initialPosition) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>正在加载地图...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>高德地图完整示例</Text>
      
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
       onLocation={({ nativeEvent }) => {
        const { latitude, longitude } = nativeEvent;  // 直接从 nativeEvent 获取
        console.log('地图定位:', latitude, longitude);
      }}
        onMapPress={(e) => console.log('地图点击:', e.nativeEvent)}
        onMapLongPress={(e) => console.log('地图长按:', e.nativeEvent)}
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
            customViewWidth={200}
            customViewHeight={40}
            onMarkerPress={() => Alert.alert('动态标记', `点击了 ${marker.content}\nID: ${marker.id}`)}
          >
            <View style={styles.markerContainer}>
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
            customViewWidth={200}
            customViewHeight={40}
            onMarkerPress={() => Alert.alert('标记', '点击了当前位置标记')}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerText}>{location?.address}</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: Platform.OS === 'ios' ? 50 : 40,
    marginBottom: 10,
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
    color: 'black',
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
