import { useState, useEffect, useRef } from 'react';
import {
  MapView,
  MapViewRef,
  Marker,
  Circle,
  Polyline,
  Polygon,
  initSDK,
  start,
  stop,
  getCurrentLocation,
  checkLocationPermission,
  requestLocationPermission,
  configure,
  addLocationListener,
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
    color: string;
  }>>([]);
  const markerIdCounter = useRef(0);

  useEffect(() => {
    const init = async () => {
      try {
        initSDK({
          androidKey: '8ac9e5983e34398473ecc23fec1d4adc',
          iosKey: 'b07b626eb2ce321df3ff0e9e9371f389',
        });
        
        const status = await checkLocationPermission();
        if (!status.granted) {
          const result = await requestLocationPermission();
          if (!result.granted) {
            setInitialPosition({ target: { latitude: 39.9, longitude: 116.4 }, zoom: 15 });
            return;
          }
        }
        
        configure({
          withReGeocode: true,
          interval: 5000,
          allowsBackgroundLocationUpdates: true,
          distanceFilter: 10,
          accuracy:3
        });
        
        const subscription = addLocationListener((loc) => {
          setLocation(loc);
        });
        
        const loc = await getCurrentLocation();
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
      const loc = await getCurrentLocation();
     
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
    start();
    setIsLocating(true);
    Alert.alert('成功', '开始连续定位');
  };

  const handleStopLocation = () => {
    stop();
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

  // 添加一个随机位置的 Marker
  const handleAddRandomMarker = () => {
    if (!location) {
      Alert.alert('提示', '请等待定位完成');
      return;
    }
    
    const colors = ['#FF5722', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomOffset = () => (Math.random() - 0.5) * 0.02;
    
    const newMarker = {
      id: `dynamic_${markerIdCounter.current++}`,
      latitude: location.latitude + randomOffset(),
      longitude: location.longitude + randomOffset(),
      content: `标记 #${markerIdCounter.current}`,
      color: randomColor,
    };

    /**
 * 将新标记添加到现有标记数组中
 * @param prev 现有的标记数组
 * @param newMarker 要添加的新标记
 * @returns 包含原有标记和新标记的新数组
 */
    setDynamicMarkers(prev => [...prev, newMarker]);
    Alert.alert('成功', `已添加标记 #${markerIdCounter.current}\n当前共 ${dynamicMarkers.length + 1} 个动态标记`);
  };

  // 移除最后一个 Marker
  const handleRemoveLastMarker = () => {
    if (dynamicMarkers.length === 0) {
      Alert.alert('提示', '没有可移除的标记');
      return;
    }
    
    setDynamicMarkers(prev => prev.slice(0, -1));
    Alert.alert('成功', `已移除最后一个标记\n剩余 ${dynamicMarkers.length - 1} 个动态标记`);
  };

  // 移除所有动态 Marker
  const handleRemoveAllMarkers = () => {
    if (dynamicMarkers.length === 0) {
      Alert.alert('提示', '没有可移除的标记');
      return;
    }
    
    const count = dynamicMarkers.length;
    setDynamicMarkers([]);
    Alert.alert('成功', `已移除所有 ${count} 个动态标记`);
  };

  // 随机移动所有 Marker 位置
  const handleMoveAllMarkers = () => {
    if (dynamicMarkers.length === 0) {
      Alert.alert('提示', '没有可移动的标记');
      return;
    }
    
    const randomOffset = () => (Math.random() - 0.5) * 0.01;
    setDynamicMarkers(prev => prev.map(marker => ({
      ...marker,
      latitude: marker.latitude + randomOffset(),
      longitude: marker.longitude + randomOffset(),
    })));
    Alert.alert('成功', `已移动所有 ${dynamicMarkers.length} 个标记`);
  };

  // 更新所有 Marker 内容
  const handleUpdateAllMarkerContent = () => {
    if (dynamicMarkers.length === 0) {
      Alert.alert('提示', '没有可更新的标记');
      return;
    }
    
    setDynamicMarkers(prev => prev.map(marker => ({
      ...marker,
      content: `${marker.content} ✨`,
    })));
    Alert.alert('成功', `已更新所有 ${dynamicMarkers.length} 个标记内容`);
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
        onMapPress={(e) => console.log('地图点击:', e)}
        onMapLongPress={(e) => console.log('地图长按:', e)}
      >
        {/* 声明式覆盖物 */}
        {location && (
          <Circle
            center={{ latitude: location.latitude, longitude: location.longitude }}
            radius={300}
            fillColor="#4400FF00"
            strokeColor="#FF00FF00"
            strokeWidth={3}
            // onPress={() => Alert.alert('圆形', '点击了声明式圆形')}
          />
        )}
      
        {/* 固定的当前位置 Marker - 放在最前面，确保稳定 */}
        {location && (
          <Marker
            key="fixed_current_location_marker"
            position={{ latitude: location.latitude, longitude: location.longitude }}
            title={location.address}
            customViewWidth={200}
            customViewHeight={40}
            onPress={() => Alert.alert('标记', '点击了当前位置标记')}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerText}>{location?.address}</Text>
            </View>
          </Marker>
        )}
        
        {/* 动态添加/删除的 Marker 列表 - 放在固定 Marker 之后 */}
        {dynamicMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.content}
            customViewWidth={180}
            customViewHeight={50}
            onPress={() => Alert.alert('动态标记', `点击了 ${marker.content}\nID: ${marker.id}`)}
          >
            <View style={[styles.dynamicMarkerItem, { borderColor: marker.color }]}>
              <Text style={[styles.dynamicMarkerItemText, { color: marker.color }]}>
                {marker.content}
              </Text>
            </View>
          </Marker>
        ))}
        
        <Marker
          position={{ latitude: 39.92, longitude: 116.42 }}
          title="可拖拽标记"
          draggable={true}
          pinColor="purple"
          onPress={() => Alert.alert('标记', '点击了可拖拽标记')}
          onDragEnd={(e) => {
            Alert.alert('拖拽结束', `新位置: ${e.nativeEvent.latitude.toFixed(6)}, ${e.nativeEvent.longitude.toFixed(6)}`);
          }}
        />
        
        <Marker
          position={{ latitude: 39.93, longitude: 116.43 }}
          title="自定义图标"
          icon={iconUri}
          iconWidth={40}
          iconHeight={40}
          onPress={() => Alert.alert('标记', '点击了自定义图标标记')}
        />
        
        {Platform.OS === 'ios' && (
          <Marker
            position={{ latitude: 39.94, longitude: 116.44 }}
            title="iOS 动画标记"
            pinColor="green"
            animatesDrop={true}
            onPress={() => Alert.alert('标记', '点击了 iOS 动画标记')}
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
          onPress={() => Alert.alert('多边形', '点击了声明式多边形')}
        />
        
        <Polyline
          points={[
            { latitude: 39.85, longitude: 116.35 },
            { latitude: 39.87, longitude: 116.37 },
            { latitude: 39.89, longitude: 116.35 },
          ]}
          width={5}
          color="#FFFF0000"
          onPress={() => Alert.alert('折线', '点击了普通折线')}
        />
        
        <Polyline
          points={[
            { latitude: 39.85, longitude: 116.45 },
            { latitude: 39.87, longitude: 116.47 },
            { latitude: 39.89, longitude: 116.45 },
          ]}
          width={5}
          color="#FF0000FF"
          dotted={true}
          onPress={() => Alert.alert('折线', '点击了虚线折线')}
        />
        
        <Polyline
          points={[
            { latitude: 39.95, longitude: 116.35 },
            { latitude: 39.97, longitude: 116.37 },
            { latitude: 39.99, longitude: 116.35 },
          ]}
          width={20}
          color="#FFFF0000"
          texture={iconUri}
          onPress={() => Alert.alert('折线', '点击了纹理折线')}
        />
        
        <Polyline
          points={[
            { latitude: 39.95, longitude: 116.45 },
            { latitude: 39.97, longitude: 116.47 },
            { latitude: 39.99, longitude: 116.45 },
          ]}
          width={5}
          color="#FF00FF00"
          geodesic={true}
          onPress={() => Alert.alert('折线', '点击了大地线折线')}
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
        
        {/* <View style={styles.sectionSpacer} />
        <Text style={styles.sectionTitle}>命令式 API (通过 ref)</Text>
        <Button title="添加圆形" onPress={handleAddCircleByRef} color="#4CAF50" />
        <View style={styles.buttonSpacer} />
        <Button title="添加标记" onPress={handleAddMarkerByRef} color="#2196F3" />
        <View style={styles.buttonSpacer} />
        <Button title="添加折线" onPress={handleAddPolylineByRef} color="#9C27B0" />
        <View style={styles.buttonSpacer} />
        <Button title="添加多边形" onPress={handleAddPolygonByRef} color="#FF5722" />
        <View style={styles.buttonSpacer} />
        <Button title="移除所有命令式覆盖物" onPress={handleRemoveImperativeOverlays} color="#FF6347" /> */}
        
        <View style={styles.sectionSpacer} />
        <Text style={styles.sectionTitle}>Marker 内容动态更新</Text>
        <Text style={styles.testDescription}>
          测试修复：切换内容时不再崩溃{'\n'}
          当前状态: {markerContent === 'text1' ? '文本1' : markerContent === 'text2' ? '文本2' : '无内容(默认图标)'}{'\n'}
          更新次数: {markerUpdateCount}
        </Text>
        <Button
          title="切换 Marker 内容"
          onPress={handleToggleMarkerContent}
          color="#E91E63"
        />
        
        <View style={styles.sectionSpacer} />
        <Text style={styles.sectionTitle}>Marker 动态添加/删除/移动</Text>
        <Text style={styles.testDescription}>
          全面测试 Marker 生命周期{'\n'}
          当前动态标记数量: {dynamicMarkers.length}
        </Text>
        <Button
          title="添加随机位置标记"
          onPress={handleAddRandomMarker}
          color="#4CAF50"
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="移除最后一个标记"
          onPress={handleRemoveLastMarker}
          color="#FF9800"
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="移动所有标记位置"
          onPress={handleMoveAllMarkers}
          color="#2196F3"
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="更新所有标记内容"
          onPress={handleUpdateAllMarkerContent}
          color="#9C27B0"
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="移除所有动态标记"
          onPress={handleRemoveAllMarkers}
          color="#FF6347"
        />
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
