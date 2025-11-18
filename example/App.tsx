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

const iconUri = Image.resolveAssetSource(require('./assets/icon.png')).uri;

export default function App() {
  const mapRef = useRef<MapViewRef>(null);
  const [location, setLocation] = useState<Coordinates | ReGeocode | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [initialPosition, setInitialPosition] = useState<CameraPosition | null>(null);

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
          zoom: 18
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

  // 命令式 API: 添加圆形
  const handleAddCircleByRef = async () => {
    if (!location || !mapRef.current) return;
    
    try {
      await mapRef.current.addCircle('imperative_circle', {
        center: { latitude: location.latitude + 0.01, longitude: location.longitude + 0.01 },
        radius: 500,
        fillColor: '#44FF0000',
        strokeColor: '#FFFF0000',
        strokeWidth: 2,
      });
      Alert.alert('成功', '通过 ref 添加了圆形');
    } catch (error) {
      Alert.alert('错误', '添加圆形失败');
    }
  };

  // 命令式 API: 添加标记
  const handleAddMarkerByRef = async () => {
    if (!location || !mapRef.current) return;
    
    try {
      await mapRef.current.addMarker('imperative_marker', {
        position: { latitude: location.latitude + 0.02, longitude: location.longitude + 0.02 },
        title: '命令式标记',
        draggable: true,
      });
      Alert.alert('成功', '通过 ref 添加了标记');
    } catch (error) {
      Alert.alert('错误', '添加标记失败');
    }
  };

  // 命令式 API: 添加折线
  const handleAddPolylineByRef = async () => {
    if (!location || !mapRef.current) return;
    
    try {
      await mapRef.current.addPolyline('imperative_polyline', {
        points: [
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: location.latitude + 0.01, longitude: location.longitude + 0.01 },
          { latitude: location.latitude + 0.02, longitude: location.longitude },
        ],
        width: 5,
        color: '#FFFF00FF',
      });
      Alert.alert('成功', '通过 ref 添加了折线');
    } catch (error) {
      Alert.alert('错误', '添加折线失败');
    }
  };

  // 命令式 API: 添加多边形
  const handleAddPolygonByRef = async () => {
    if (!location || !mapRef.current) return;
    
    try {
      await mapRef.current.addPolygon('imperative_polygon', {
        points: [
          { latitude: location.latitude - 0.01, longitude: location.longitude - 0.01 },
          { latitude: location.latitude - 0.01, longitude: location.longitude + 0.01 },
          { latitude: location.latitude - 0.03, longitude: location.longitude },
        ],
        fillColor: '#44FFFF00',
        strokeColor: '#FFFFFF00',
        strokeWidth: 2,
      });
      Alert.alert('成功', '通过 ref 添加了多边形');
    } catch (error) {
      Alert.alert('错误', '添加多边形失败');
    }
  };

  // 命令式 API: 移除所有命令式覆盖物
  const handleRemoveImperativeOverlays = async () => {
    if (!mapRef.current) return;
    
    try {
      await mapRef.current.removeCircle('imperative_circle');
      await mapRef.current.removeMarker('imperative_marker');
      await mapRef.current.removePolyline('imperative_polyline');
      await mapRef.current.removePolygon('imperative_polygon');
      Alert.alert('成功', '已移除所有命令式覆盖物');
    } catch (error) {
      console.log('移除覆盖物时出错(可能不存在):', error);
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
        onLoad={() => console.log('地图加载完成')}
        onMapPress={(e) => console.log('地图点击:', e)}
        onMapLongPress={(e) => console.log('地图长按:', e)}
      >
        {/* 声明式覆盖物 */}
        <Circle
          center={{ latitude: 39.9, longitude: 116.4 }}
          radius={1000}
          fillColor="#4400FF00"
          strokeColor="#FF00FF00"
          strokeWidth={2}
          onPress={() => Alert.alert('圆形', '点击了声明式圆形')}
        />
        
        <Marker
          position={{ latitude: 39.91, longitude: 116.41 }}
          title="天安门"
          snippet="北京市中心"
          onPress={() => Alert.alert('标记', '点击了天安门标记')}
        />
        
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
          fillColor="#880000FF"
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
        
        <View style={styles.sectionSpacer} />
        <Text style={styles.sectionTitle}>命令式 API (通过 ref)</Text>
        <Button title="添加圆形" onPress={handleAddCircleByRef} color="#4CAF50" />
        <View style={styles.buttonSpacer} />
        <Button title="添加标记" onPress={handleAddMarkerByRef} color="#2196F3" />
        <View style={styles.buttonSpacer} />
        <Button title="添加折线" onPress={handleAddPolylineByRef} color="#9C27B0" />
        <View style={styles.buttonSpacer} />
        <Button title="添加多边形" onPress={handleAddPolygonByRef} color="#FF5722" />
        <View style={styles.buttonSpacer} />
        <Button title="移除所有命令式覆盖物" onPress={handleRemoveImperativeOverlays} color="#FF6347" />
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
});
