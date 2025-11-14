# 使用示例

完整的使用示例和最佳实践。

## 目录

- [基础地图应用](#基础地图应用)
- [定位追踪应用](#定位追踪应用)
- [覆盖物示例](#覆盖物示例)
- [高级用法](#高级用法)

## 基础地图应用

```tsx
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { 
  MapView, 
  initSDK,
  Circle,
  Marker,
  Polyline,
  Polygon,
  type MapViewRef 
} from 'expo-gaode-map';

export default function App() {
  const mapRef = useRef<MapViewRef>(null);

  useEffect(() => {
    initSDK({
      androidKey: 'your-android-api-key',
      iosKey: 'your-ios-api-key',
    });
  }, []);

  const handleMoveCamera = async () => {
    await mapRef.current?.moveCamera(
      {
        target: { latitude: 40.0, longitude: 116.5 },
        zoom: 15,
      },
      1000
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10,
        }}
        myLocationEnabled={true}
        followUserLocation={false}
        trafficEnabled={true}
        onMapPress={(e) => console.log('点击地图', e)}
        onLoad={() => console.log('地图加载完成')}
      >
        {/* 圆形覆盖物 */}
        <Circle
          center={{ latitude: 39.9, longitude: 116.4 }}
          radius={1000}
          fillColor="#8800FF00"
          strokeColor="#FFFF0000"
          strokeWidth={2}
        />

        {/* 标记点 */}
        <Marker
          position={{ latitude: 39.95, longitude: 116.45 }}
          title="这是一个标记"
          draggable={true}
        />

        {/* 折线 */}
        <Polyline
          points={[
            { latitude: 39.9, longitude: 116.4 },
            { latitude: 39.95, longitude: 116.45 },
            { latitude: 40.0, longitude: 116.5 },
          ]}
          strokeWidth={5}
          strokeColor="#FF0000FF"
        />

        {/* 多边形 */}
        <Polygon
          points={[
            { latitude: 39.85, longitude: 116.35 },
            { latitude: 39.85, longitude: 116.45 },
            { latitude: 39.75, longitude: 116.40 },
          ]}
          fillColor="#880000FF"
          strokeColor="#FFFF0000"
          strokeWidth={2}
        />
      </MapView>

      <View style={styles.controls}>
        <Button title="移动相机" onPress={handleMoveCamera} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
```

## 定位追踪应用

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { 
  MapView,
  initSDK,
  configure,
  start,
  stop,
  getCurrentLocation,
  addLocationListener,
  type Location,
} from 'expo-gaode-map';

export default function LocationApp() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // 初始化 SDK
    initSDK({
      androidKey: 'your-android-api-key',
      iosKey: 'your-ios-api-key',
    });

    // 配置定位参数
    configure({
      withReGeocode: true,
      mode: 0,
      interval: 2000,
    });

    // 监听位置更新
    const subscription = addLocationListener((loc) => {
      console.log('位置更新:', loc);
      setLocation(loc);
    });

    return () => subscription.remove();
  }, []);

  const handleStartTracking = () => {
    start();
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    stop();
    setIsTracking(false);
  };

  const handleGetLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (error) {
      console.error('获取位置失败:', error);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        myLocationEnabled={true}
        followUserLocation={isTracking}
        initialCameraPosition={{
          target: { 
            latitude: location?.latitude || 39.9, 
            longitude: location?.longitude || 116.4 
          },
          zoom: 15,
        }}
      />

      {location && (
        <View style={styles.info}>
          <Text style={styles.infoText}>
            纬度: {location.latitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>
            经度: {location.longitude.toFixed(6)}
          </Text>
          <Text style={styles.infoText}>
            精度: {location.accuracy.toFixed(2)} 米
          </Text>
          {location.address && (
            <Text style={styles.infoText}>
              地址: {location.address}
            </Text>
          )}
        </View>
      )}

      <View style={styles.controls}>
        <Button 
          title="获取位置" 
          onPress={handleGetLocation} 
        />
        <View style={{ height: 10 }} />
        <Button 
          title={isTracking ? '停止追踪' : '开始追踪'}
          onPress={isTracking ? handleStopTracking : handleStartTracking}
          color={isTracking ? '#FF3B30' : '#007AFF'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  info: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});
```

## 覆盖物示例

### Circle (圆形)

**声明式用法:**
```tsx
<MapView style={{ flex: 1 }}>
  <Circle
    center={{ latitude: 39.9, longitude: 116.4 }}
    radius={1000}
    fillColor="#8800FF00"
    strokeColor="#FFFF0000"
    strokeWidth={2}
    onPress={() => console.log('点击圆形')}
  />
</MapView>
```

**命令式用法:**
```tsx
const mapRef = useRef<MapViewRef>(null);

await mapRef.current?.addCircle('circle1', {
  center: { latitude: 39.9, longitude: 116.4 },
  radius: 1000,
  fillColor: 0x8800FF00,
  strokeColor: 0xFFFF0000,
  strokeWidth: 2,
});

await mapRef.current?.updateCircle('circle1', {
  radius: 2000,
});

await mapRef.current?.removeCircle('circle1');
```

### Marker (标记点)

**声明式用法:**
```tsx
<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="标题"
    description="描述信息"
    draggable={true}
    onPress={() => console.log('点击标记')}
    onDragEnd={(e) => console.log('拖动结束', e)}
  />
</MapView>
```

**命令式用法:**
```tsx
await mapRef.current?.addMarker('marker1', {
  position: { latitude: 39.9, longitude: 116.4 },
  title: '标题',
  draggable: true,
});

await mapRef.current?.updateMarker('marker1', {
  position: { latitude: 40.0, longitude: 116.5 },
});

await mapRef.current?.removeMarker('marker1');
```

### Polyline (折线)

**声明式用法 - 普通折线:**
```tsx
<MapView style={{ flex: 1 }}>
  <Polyline
    points={[
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.95, longitude: 116.45 },
      { latitude: 40.0, longitude: 116.5 },
    ]}
    width={5}
    color="#FFFF0000"
    onPress={() => console.log('点击折线')}
  />
</MapView>
```

**声明式用法 - 纹理折线:**
```tsx
import { Image } from 'react-native';

const iconUri = Image.resolveAssetSource(require('./assets/arrow.png')).uri;

<MapView style={{ flex: 1 }}>
  <Polyline
    points={[
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.95, longitude: 116.45 },
      { latitude: 40.0, longitude: 116.5 },
    ]}
    width={20}
    color="#FFFF0000"
    texture={iconUri}
    onPress={() => console.log('点击纹理折线')}
  />
</MapView>
```

**命令式用法:**
```tsx
// 普通折线
await mapRef.current?.addPolyline('polyline1', {
  points: [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 40.0, longitude: 116.5 },
  ],
  width: 5,
  color: '#FFFF0000',
});

// 纹理折线
await mapRef.current?.addPolyline('polyline2', {
  points: [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 40.0, longitude: 116.5 },
  ],
  width: 20,
  color: '#FFFF0000',
  texture: iconUri,
});

// 分段纹理示例（使用多个 Polyline）
const point1 = { latitude: 39.9, longitude: 116.4 };
const point2 = { latitude: 39.95, longitude: 116.45 };
const point3 = { latitude: 40.0, longitude: 116.5 };

// 第一段：红色箭头
await mapRef.current?.addPolyline('segment1', {
  points: [point1, point2],
  width: 20,
  color: '#FFFF0000',
  texture: redArrowUri,
});

// 第二段：蓝色箭头
await mapRef.current?.addPolyline('segment2', {
  points: [point2, point3],
  width: 20,
  color: '#FF0000FF',
  texture: blueArrowUri,
});
```

> **注意**：
> - 颜色格式使用 ARGB（`#AARRGGBB`），例如 `#FFFF0000` 表示不透明红色
> - `texture` 支持网络图片（http/https）和本地文件（file://）
> - 纹理图片会沿着折线方向平铺显示
> - 建议纹理折线使用较大的 `width` 值（如 20）以获得更好的显示效果
> - **分段纹理限制**：单个 Polyline 只能设置一个纹理。如需不同线段使用不同纹理，请创建多个 Polyline 组件

### Polygon (多边形)

**声明式用法:**
```tsx
<MapView style={{ flex: 1 }}>
  <Polygon
    points={[
      { latitude: 39.9, longitude: 116.3 },
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.8, longitude: 116.4 },
    ]}
    fillColor="#8800FF00"
    strokeColor="#FFFF0000"
    strokeWidth={2}
    onPress={() => console.log('点击多边形')}
  />
</MapView>
```

**命令式用法:**
```tsx
await mapRef.current?.addPolygon('polygon1', {
  points: [
    { latitude: 39.9, longitude: 116.3 },
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.8, longitude: 116.4 },
  ],
  fillColor: 0x8800FF00,
  strokeColor: 0xFFFF0000,
  strokeWidth: 2,
});
```

## 高级用法

### 自定义定位蓝点

```tsx
import { Image } from 'react-native';

const iconUri = Image.resolveAssetSource(require('./assets/location-icon.png')).uri;

<MapView
  myLocationEnabled={true}
  userLocationRepresentation={{
    showsAccuracyRing: true,
    fillColor: '#4285F4',
    strokeColor: '#1967D2',
    lineWidth: 2,
    image: iconUri,
    imageWidth: 40,
    imageHeight: 40,
  }}
/>
```

### 批量操作覆盖物

```tsx
const mapRef = useRef<MapViewRef>(null);

const addMultipleOverlays = async () => {
  await mapRef.current?.addCircle('circle1', {
    center: { latitude: 39.9, longitude: 116.4 },
    radius: 1000,
    fillColor: 0x8800FF00,
  });
  
  await mapRef.current?.addCircle('circle2', {
    center: { latitude: 40.0, longitude: 116.5 },
    radius: 500,
    fillColor: 0x880000FF,
  });
  
  await mapRef.current?.addMarker('marker1', {
    position: { latitude: 39.95, longitude: 116.45 },
    title: '北京',
  });
};

const clearAll = async () => {
  await mapRef.current?.removeCircle('circle1');
  await mapRef.current?.removeCircle('circle2');
  await mapRef.current?.removeMarker('marker1');
};
```

### 缩放级别限制

```tsx
<MapView
  maxZoom={18}
  minZoom={5}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
/>
```

### 方向更新 (iOS)

```tsx
import { startUpdatingHeading, stopUpdatingHeading } from 'expo-gaode-map';

// 开始方向更新
startUpdatingHeading();

// 停止方向更新
stopUpdatingHeading();