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
  MarkerProps,
  configure
} from 'expo-gaode-map';
import {Image, StyleSheet, View, Text, Button, Alert, Platform, ScrollView, Animated } from 'react-native';

// 定义圆形类型
type CircleData = {
  id: string;
  center: { latitude: number; longitude: number };
  radius: number;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
};

// 定义标记类型
type MarkerData = {
  id: string;
  position: { latitude: number; longitude: number };
  title: string;
  draggable: boolean;
};

// 定义折线类型
type PolylineData = {
  id: string;
  points: { latitude: number; longitude: number }[];
  width: number;
  color: string;
  texture?: string;
};

// 定义多边形类型
type PolygonData = {
  id: string;
  points: { latitude: number; longitude: number }[];
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
};

// 获取图片的本地 URI
const iconUri = Image.resolveAssetSource(require('./assets/icon.png')).uri;


export default function App() {
  const mapRef = useRef<MapViewRef>(null);
  const [location, setLocation] = useState<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [circles, setCircles] = useState<CircleData[]>([]);
  const [markers, setMarkers] = useState<MarkerProps[]>([]);
  const [polylines, setPolylines] = useState<PolylineData[]>([]);
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [initialPosition, setInitialPosition] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('正在初始化高德地图 SDK...');
        initSDK({
          androidKey: '8ac9e5983e34398473ecc23fec1d4adc',
          iosKey: 'b07b626eb2ce321df3ff0e9e9371f389',
        });
        
        const status = await checkLocationPermission();
        console.log('📍 初始权限状态:', status);
        
        if (!status.granted) {
          console.log('📍 请求权限...');
          const result = await requestLocationPermission();
          console.log('📍 权限请求结果:', result);
          
          if (!result.granted) {
            console.log('📍 权限被拒绝,使用默认位置');
            setInitialPosition({ target: { latitude: 39.90923, longitude: 116.397428 }, zoom: 18 });
            return;
          }
        }
        
        console.log('📍 开始获取位置...');
        const loc = await getCurrentLocation();
        console.log('📍 获取到位置:', loc);
        setLocation(loc);
        setInitialPosition({
          target: { latitude: loc.latitude, longitude: loc.longitude },
          zoom: 18
        });
        
        // 淡入动画
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        configure({
          allowsBackgroundLocationUpdates: true
        })

       
      } catch (error) {
        console.error('初始化失败:', error);
        setInitialPosition({ target: { latitude: 39.90923, longitude: 116.397428 }, zoom: 18 });
      }
    };

    initializeApp();
  }, []);

  // 开始连续定位
  const startLocation = async () => {
    try {
      await start();
      setIsLocating(true);
      Alert.alert('成功', '开始定位');
    } catch (error) {
      console.error('开始定位失败:', error);
      Alert.alert('错误', '开始定位失败');
    }
  };

  // 停止定位
  const stopLocation = async () => {
    try {
      await stop();
      setIsLocating(false);
      Alert.alert('成功', '停止定位');
    } catch (error) {
      console.error('停止定位失败:', error);
    }
  };

  // 获取当前位置（单次定位）
  const getLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      console.log('当前位置:', loc);
      
      // 更新地图中心点 - 通过 ref 调用
      if (mapRef.current) {
        await mapRef.current.moveCamera({
          target: {
            latitude: loc.latitude,
            longitude: loc.longitude,
          },
          zoom:  18,
        }, 300);
      }
    } catch (error) {
      console.error('获取位置失败:', error);
      Alert.alert('错误', '获取位置失败');
    }
  };

  // 添加圆形
  const addCircle = () => {
    if (!location) {
      Alert.alert('提示', '请先获取位置');
      return;
    }

    // 随机颜色 - 使用 RN 风格的十六进制字符串
    const colors = [
      { fill: '#4400FF00', stroke: '#FF00FF00' }, // 绿色
      { fill: '#440000FF', stroke: '#FFFF0000' }, // 红色
      { fill: '#44FF0000', stroke: '#FF0000FF' }, // 蓝色
      { fill: '#44FFFF00', stroke: '#FFFF00FF' }, // 黄色
      { fill: '#44FF00FF', stroke: '#FFFFFF00' }, // 紫色
    ];
    
    const randomColor = colors[circles.length % colors.length];
    const randomOffset = () => (Math.random() - 0.5) * 0.01; // 随机偏移
    
    const newCircle: CircleData = {
      id: `circle_${Date.now()}`,
      center: {
        latitude: location.latitude + randomOffset(),
        longitude: location.longitude + randomOffset(),
      },
      radius: 100 + Math.random() * 200, // 100-300米随机半径
      fillColor: randomColor.fill,
      strokeColor: randomColor.stroke,
      strokeWidth: 2,
    };

    setCircles(prev => [...prev, newCircle]);
    Alert.alert('成功', `已添加第 ${circles.length + 1} 个圆形`);
  };

  // 移除最后一个圆形
  const removeLastCircle = () => {
    if (circles.length === 0) {
      Alert.alert('提示', '没有圆形可移除');
      return;
    }
    setCircles(prev => prev.slice(0, -1));
    Alert.alert('成功', `已移除圆形，还剩 ${circles.length - 1} 个`);
  };

  // 清除所有圆形
  const clearAllCircles = () => {
    setCircles([]);
    Alert.alert('成功', '已清除所有圆形');
  };

  // 添加标记
  const addMarker = () => {
    if (!location) {
      Alert.alert('提示', '请先获取位置');
      return;
    }

    const titles = ['标记A', '标记B', '标记C', '标记D', '标记E'];
    const randomOffset = () => (Math.random() - 0.5) * 0.01; // 随机偏移
    
    const newMarker: MarkerProps = {
      // id: `marker_${Date.now()}`,
      position: {
        latitude: location.latitude + randomOffset(),
        longitude: location.longitude + randomOffset(),
      },
      title: titles[markers.length % titles.length],
      snippet: '这是一个标记',
      
      draggable: markers.length % 2 === 0, // 奇偶交替可拖拽
    };

    setMarkers(prev => [...prev, newMarker]);
    Alert.alert('成功', `已添加第 ${markers.length + 1} 个标记`);
  };

  // 移除最后一个标记
  const removeLastMarker = () => {
    if (markers.length === 0) {
      Alert.alert('提示', '没有标记可移除');
      return;
    }
    setMarkers(prev => prev.slice(0, -1));
    Alert.alert('成功', `已移除标记，还剩 ${markers.length - 1} 个`);
  };

  // 清除所有标记
  const clearAllMarkers = () => {
    setMarkers([]);
    Alert.alert('成功', '已清除所有标记');
  };

  // 添加普通折线
  const addPolyline = () => {
    if (!location) {
      Alert.alert('提示', '请先获取位置');
      return;
    }

    const colors = ['#FFFF0000', '#FF00FF00', '#FF0000FF', '#FFFFFF00', '#FFFF00FF'];
    const randomColor = colors[polylines.length % colors.length];
    
    const points = [
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: location.latitude + 0.002, longitude: location.longitude + 0.003 },
      { latitude: location.latitude + 0.004, longitude: location.longitude },
    ];
    
    const newPolyline: PolylineData = {
      id: `polyline_${Date.now()}_${Math.random()}`, // 添加随机数确保唯一性
      points,
      width: 5,
      color: '#ffccee',
    };

    setPolylines(prev => [...prev, newPolyline]);
    Alert.alert('成功', `已添加普通折线（3个点）`);
  };

  // 添加纹理折线
  const addTexturePolyline = () => {
    if (!location) {
      Alert.alert('提示', '请先获取位置');
      return;
    }
    
    const points = [
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: location.latitude + 0.002, longitude: location.longitude + 0.003 },
      { latitude: location.latitude + 0.004, longitude: location.longitude },
    ];
    
    const newPolyline: PolylineData = {
      id: `polyline_${Date.now()}`,
      points,
      width: 20,
      color: '#FFFF0000',
      texture: iconUri,
    };

    setPolylines(prev => [...prev, newPolyline]);
    Alert.alert('成功', '已添加纹理折线（3个点）\n✨ 带纹理贴图');
  };

  // 移除最后一条折线
  const removeLastPolyline = () => {
    if (polylines.length === 0) {
      Alert.alert('提示', '没有折线可移除');
      return;
    }
    setPolylines(prev => prev.slice(0, -1));
    Alert.alert('成功', `已移除折线，还剩 ${polylines.length - 1} 条`);
  };

  // 清除所有折线
  const clearAllPolylines = () => {
    setPolylines([]);
    Alert.alert('成功', '已清除所有折线');
  };

  // 添加多边形
  const addPolygon = () => {
    if (!location) {
      Alert.alert('提示', '请先获取位置');
      return;
    }

    // 生成一个明显的三角形
    const points = [
      { latitude: location.latitude, longitude: location.longitude },
      { latitude: location.latitude + 0.002, longitude: location.longitude + 0.003 },
      { latitude: location.latitude - 0.002, longitude: location.longitude + 0.003 },
    ];
    
    const newPolygon: PolygonData = {
      id: `polygon_${Date.now()}`,
      points,
      fillColor: '#880000FF',   // 半透明蓝色填充
      strokeColor: '#FFFF0000', // 红色边框
      strokeWidth: 10,
    };

    console.log('🔷 添加多边形:', JSON.stringify(newPolygon));
    setPolygons(prev => [...prev, newPolygon]);
    Alert.alert('成功', `已添加第 ${polygons.length + 1} 个多边形\n蓝色填充，红色边框`);
  };

  // 移除最后一个多边形
  const removeLastPolygon = () => {
    if (polygons.length === 0) {
      Alert.alert('提示', '没有多边形可移除');
      return;
    }
    setPolygons(prev => prev.slice(0, -1));
    Alert.alert('成功', `已移除多边形，还剩 ${polygons.length - 1} 个`);
  };

  // 清除所有多边形
  const clearAllPolygons = () => {
    setPolygons([]);
    Alert.alert('成功', '已清除所有多边形');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>高德地图示例</Text>
      
      {initialPosition ? (
        <Animated.View style={[styles.map, { opacity: fadeAnim }]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            myLocationEnabled={true}
            indoorViewEnabled={true}
            trafficEnabled={true}
            mapType={0}
            
            userLocationRepresentation={{}}
            onMapPress={() => console.log('onMapPress:')}
            onMapLongPress={() => console.log('onMapLongPress')}
            compassEnabled={false}
            tiltGesturesEnabled={false}
            initialCameraPosition={initialPosition}
            minZoom={10}
            maxZoom={20}
            onLoad={() => console.log('地图加载完成')}
        >
          {markers.map((marker, index) => (
            <Marker
              key={`marker_${index}`}
              position={marker.position}
              title={marker.title}
              snippet={marker.snippet}
              draggable={marker.draggable}
              onPress={() => Alert.alert('标记点击', `点击了 ${marker.title}`)}
              onDragEnd={(e) => {
                console.log('拖拽结束:', e.nativeEvent);
                Alert.alert('拖拽结束', `${marker.title} 新位置: ${e.nativeEvent.latitude.toFixed(6)}, ${e.nativeEvent.longitude.toFixed(6)}`);
              }}
            />
          ))}
          
          {polygons.map((polygon) => (
            <Polygon
              key={polygon.id}
              points={polygon.points}
              fillColor={polygon.fillColor}
              strokeColor={polygon.strokeColor}
              strokeWidth={polygon.strokeWidth}
            />
          ))}
          {polylines.map((polyline) => (
            <Polyline
              key={polyline.id}
              points={polyline.points}
              width={polyline.width}
              color={polyline.color}
              texture={polyline.texture}
            />
          ))}
          {/* 静态 Marker 示例 - 展示各种属性 */}
          {/* <Marker
            key={'marker_static_1'}
            position={{
              latitude: 39.9,
              longitude: 116.4,
            }}
            title={'北京天安门'}
            snippet={'这是一个可拖拽的标记点'}
            draggable={true}
            pinColor={'purple'}
            icon={iconUri}
            iconWidth={50}
            iconHeight={50}  
            onPress={() =>{
              console.log('点击标记点');
            }}
            onDragEnd={(e) => {
              console.log('拖拽结束:', e.nativeEvent);
              Alert.alert('拖拽结束', `新位置: ${e.nativeEvent.latitude.toFixed(6)}, ${e.nativeEvent.longitude.toFixed(6)}`);
            }}
          /> */}
          
          {/* iOS 特有属性示例 */}
          {/* {Platform.OS === 'ios' && (
            <Marker
              key={'marker_static_2'}
              position={{
                latitude: 39.92,
                longitude: 116.42,
              }}
              title={'iOS 专属样式'}
              pinColor={'green'}
              animatesDrop={true}
            />
            
          )} */}
          {/* 文档示例 1: 静态 Circle */}
          <Circle
            center={{ latitude: 39.9, longitude: 116.4 }}
            radius={1000}
            fillColor="#8800FF00"
            strokeColor="#FFFF0000"
            strokeWidth={2}
            onPress={() => console.log('点击圆形')}
          />
          
          {/* 文档示例 2: 静态 Polygon */}
          <Polygon
            points={[
              { latitude: 39.9, longitude: 116.3 },
              { latitude: 39.9, longitude: 116.4 },
              { latitude: 39.8, longitude: 116.4 },
              { latitude: 39.8, longitude: 116.3 },
            ]}
            fillColor="red"
            strokeColor="#000"
            strokeWidth={2}
            onPress={() => console.log('点击多边形')}
            zIndex={99}
          />
          
          {/* 文档示例 3: 静态 Polyline - 虚线 + 大地线 */}
          <Polyline
            points={[
              { latitude: 39.9, longitude: 116.4 },
              { latitude: 39.95, longitude: 116.45 },
              // { latitude: 40.0, longitude: 116.5 },
            ]}
            width={10}
            dotted={true}
          
            color="#FFFF0000"
            onPress={() => console.log('点击折线')}
          />
       
          {/* {circles.map((circle) => (
            <Circle
              key={circle.id}
              center={circle.center}
              radius={circle.radius}
              fillColor={circle.fillColor}
              strokeColor={circle.strokeColor}
              strokeWidth={circle.strokeWidth}
               onPress={() => console.log('点击圆形')}
            />

          ))} */}
          </MapView>
        </Animated.View>
      ) : (
        <View style={styles.map}>
          <Text style={styles.title}>正在加载地图...</Text>
        </View>
      )}

      {/* 定位信息显示 */}
      {location && (
        <View style={styles.infoContainer}>
          {/* <Text style={styles.infoText}>纬度: {location.latitude?.toFixed(6)}</Text>
          <Text style={styles.infoText}>经度: {location.longitude?.toFixed(6)}</Text>
          <Text style={styles.infoText}>精度: {location.accuracy?.toFixed(2)}m</Text> */}
          {(location as any).address && (
            <Text style={styles.infoText}>地址: {(location as any).address}</Text>
          )}
        </View>
      )}

      {/* 控制按钮 */}
      <ScrollView style={styles.buttonContainer}>
        <Button
          title="获取当前位置"
          onPress={getLocation}
        />
        <View style={styles.buttonSpacer} />
        
        {/* 标记控制按钮 */}
        {location && (
          <>
            <Button
              title={`添加标记 (当前 ${markers.length} 个)`}
              onPress={addMarker}
              color="#2196F3"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="移除最后一个标记"
              onPress={removeLastMarker}
              disabled={markers.length === 0}
              color="#FF9800"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="清除所有标记"
              onPress={clearAllMarkers}
              disabled={markers.length === 0}
              color="#FF6347"
            />
            <View style={styles.buttonSpacer} />
          </>
        )}
        
        {/* 多边形控制按钮 */}
        {location && (
          <>
            <Button
              title={`添加多边形 (当前 ${polygons.length} 个)`}
              onPress={addPolygon}
              color="#FF5722"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="移除最后一个多边形"
              onPress={removeLastPolygon}
              disabled={polygons.length === 0}
              color="#FF9800"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="清除所有多边形"
              onPress={clearAllPolygons}
              disabled={polygons.length === 0}
              color="#FF6347"
            />
            <View style={styles.buttonSpacer} />
          </>
        )}
        
        {/* 折线控制按钮 */}
        {location && (
          <>
            <Button
              title={`添加普通折线 (当前 ${polylines.length} 条)`}
              onPress={addPolyline}
              color="#9C27B0"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="添加纹理折线"
              onPress={addTexturePolyline}
              color="#673AB7"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="移除最后一条折线"
              onPress={removeLastPolyline}
              disabled={polylines.length === 0}
              color="#FF9800"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="清除所有折线"
              onPress={clearAllPolylines}
              disabled={polylines.length === 0}
              color="#FF6347"
            />
            <View style={styles.buttonSpacer} />
          </>
        )}
        
        {/* 圆形控制按钮 */}
        {location && (
          <>
            <Button
              title={`添加圆形 (当前 ${circles.length} 个)`}
              onPress={addCircle}
              color="#4CAF50"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="移除最后一个圆形"
              onPress={removeLastCircle}
              disabled={circles.length === 0}
              color="#FF9800"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="清除所有圆形"
              onPress={clearAllCircles}
              disabled={circles.length === 0}
              color="#FF6347"
            />
          </>
        )}
        
        <View style={styles.buttonSpacer} />
        <Button
          title={isLocating ? "停止定位" : "开始连续定位"}
          onPress={isLocating ? stopLocation : startLocation}
          color={isLocating ? "#FF6347" : "#4CAF50"}
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
    marginTop: Platform.OS === 'ios' ? 50 : 20,
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
  },
  buttonSpacer: {
    height: 10,
  },
  markerContainer:{
     backgroundColor: 'white',
    borderRadius: 5,
    padding: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
    markerText: {
    fontSize: 12,
    color: '#333',
    fontWeight: "600",
  },
});
