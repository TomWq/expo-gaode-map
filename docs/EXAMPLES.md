# 使用示例

[English](./EXAMPLES.en.md) | 简体中文

完整的使用示例和最佳实践。

> 📖 **推荐阅读**: [初始化指南](./INITIALIZATION.md) - 详细的初始化流程和权限处理

## 目录

- [完整应用示例](#完整应用示例)
- [基础地图应用](#基础地图应用)
- [定位追踪应用](#定位追踪应用)
- [覆盖物示例](#覆盖物示例)
- [高级用法](#高级用法)

## 完整应用示例

包含权限管理、错误处理和加载状态的完整示例:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Alert, Linking, Platform } from 'react-native';
import {
  MapView,
  ExpoGaodeMapModule,
  type LatLng,
} from 'expo-gaode-map';

export default function App() {
  const [initialPosition, setInitialPosition] = useState<{
    target: LatLng;
    zoom: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // 1. 初始化 SDK
        ExpoGaodeMapModule.initSDK({
          androidKey: 'your-android-api-key',
          iosKey: 'your-ios-api-key',
        });
        
        // 2. 检查权限
        const status = await ExpoGaodeMapModule.checkLocationPermission();
        
        // 3. 请求权限（如果需要）
        if (!status.granted) {
          const result = await ExpoGaodeMapModule.requestLocationPermission();
          
          if (!result.granted) {
            // 权限被拒绝
            setInitialPosition({
              target: { latitude: 39.9, longitude: 116.4 },
              zoom: 10
            });
            
            // 引导用户到设置
            Alert.alert(
              '需要定位权限',
              '请在设置中开启定位权限',
              [
                { text: '取消' },
                { text: '去设置', onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }}
              ]
            );
            return;
          }
        }
        
        // 4. 获取位置
        const location = await ExpoGaodeMapModule.getCurrentLocation();
        setInitialPosition({
          target: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          zoom: 15
        });
        
      } catch (err) {
        console.error('初始化失败:', err);
        setError('初始化失败');
        setInitialPosition({
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10
        });
      }
    };

    initialize();
  }, []);

  // 加载状态
  if (!initialPosition && !error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>正在加载地图...</Text>
      </View>
    );
  }

  // 错误状态
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={initialPosition!}
      myLocationEnabled={true}
      onLoad={() => console.log('地图加载完成')}
    />
  );
}
```

## 基础地图应用

```tsx
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Button } from 'react-native';
import {
  MapView,
  ExpoGaodeMapModule,
  Circle,
  Marker,
  Polyline,
  Polygon,
  type MapViewRef
} from 'expo-gaode-map';

export default function App() {
  const mapRef = useRef<MapViewRef>(null);

  useEffect(() => {
    const initialize = async () => {
      ExpoGaodeMapModule.initSDK({
        androidKey: 'your-android-api-key',
        iosKey: 'your-ios-api-key',
      });
      
      // 检查并请求权限
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        await ExpoGaodeMapModule.requestLocationPermission();
      }
    };
    
    initialize();
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
        onMapPress={(e) => console.log('点击地图', e.nativeEvent)}
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
  ExpoGaodeMapModule,
  type Location,
} from 'expo-gaode-map';

export default function LocationApp() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // 初始化 SDK
      ExpoGaodeMapModule.initSDK({
        androidKey: 'your-android-api-key',
        iosKey: 'your-ios-api-key',
      });

      // 检查并请求权限
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        await ExpoGaodeMapModule.requestLocationPermission();
      }

      // 配置定位参数
      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setLocationMode(0);
      ExpoGaodeMapModule.setInterval(2000);

      // 监听位置更新
      const subscription = ExpoGaodeMapModule.addListener('onLocationUpdate', (loc) => {
        console.log('位置更新:', loc);
        setLocation(loc);
      });

      return () => subscription.remove();
    };

    initialize();
  }, []);

  const handleStartTracking = () => {
    ExpoGaodeMapModule.start();
    setIsTracking(true);
  };

  const handleStopTracking = () => {
    ExpoGaodeMapModule.stop();
    setIsTracking(false);
  };

  const handleGetLocation = async () => {
    try {
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
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
    onPress={(e) => console.log('点击圆形')}
  />
</MapView>
```


### Marker (标记点)

#### 基础用法

**声明式用法:**
```tsx
<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="标题"
    snippet="描述信息"
    draggable={true}
    onPress={(e) => console.log('点击标记')}
    onDragEnd={(e) => console.log('拖动结束', e.nativeEvent)}
  />
</MapView>
```

**命令式用法:**
```tsx
await mapRef.current?.addMarker('marker1', {
  position: { latitude: 39.9, longitude: 116.4 },
  title: '标题',
  snippet: '描述信息',
  draggable: true,
});

await mapRef.current?.updateMarker('marker1', {
  position: { latitude: 40.0, longitude: 116.5 },
});

await mapRef.current?.removeMarker('marker1');
```

> **⚠️ 限制**：命令式 API 添加的 Marker **不支持事件回调**（onPress, onDragEnd 等）和**自定义视图**。如需这些功能，请使用声明式 `<Marker>` 组件。

#### 自定义图标

```tsx
import { Image } from 'react-native';

// 获取本地图片 URI
const iconUri = Image.resolveAssetSource(require('./assets/marker-icon.png')).uri;

<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="自定义图标"
    icon={iconUri}
    iconWidth={50}
    iconHeight={50}
    onPress={(e) => console.log('点击自定义图标标记')}
  />
</MapView>
```

> **注意**：
> - `iconWidth` 和 `iconHeight` 使用点(points)作为单位
> - 在不同密度屏幕上会自动缩放，保持视觉一致性
> - 支持网络图片（http/https）和本地图片

#### 自定义视图 ⭐ 推荐

使用 `children` 属性可以完全自定义标记的外观，支持任意 React Native 组件和样式：

**基础自定义视图:**
```tsx
import { View, Text, StyleSheet } from 'react-native';

<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    customViewWidth={200}
    customViewHeight={50}
    onPress={(e) => Alert.alert('标记', '点击了自定义标记')}
  >
    <View style={styles.markerContainer}>
      <Text style={styles.markerText}>北京市中心</Text>
    </View>
  </Marker>
</MapView>

const styles = StyleSheet.create({
  markerContainer: {
    backgroundColor: '#fff',
    borderColor: '#2196F3',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
```

**带图标的自定义视图:**
```tsx
import { View, Text, Image, StyleSheet } from 'react-native';

<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    iconWidth={150}
    iconHeight={60}
  >
    <View style={styles.customMarker}>
      <Image
        source={require('./assets/location-pin.png')}
        style={styles.markerIcon}
      />
      <View style={styles.markerContent}>
        <Text style={styles.markerTitle}>北京</Text>
        <Text style={styles.markerSubtitle}>中国首都</Text>
      </View>
    </View>
  </Marker>
</MapView>

const styles = StyleSheet.create({
  customMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  markerIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  markerContent: {
    flexDirection: 'column',
  },
  markerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  markerSubtitle: {
    color: '#E8F5E9',
    fontSize: 11,
  },
});
```

**动态内容标记:**
```tsx
import { View, Text, StyleSheet } from 'react-native';

function LocationMarker({ location }: { location: Location }) {
  return (
    <Marker
      position={{
        latitude: location.latitude,
        longitude: location.longitude
      }}
      customViewWidth={220}
      customViewHeight={60}
      onPress={(e) => Alert.alert('位置', location.address)}
    >
      <View style={styles.locationMarker}>
        <Text style={styles.locationTitle} numberOfLines={1}>
          {location.address || '当前位置'}
        </Text>
        <Text style={styles.locationCoords}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  locationMarker: {
    backgroundColor: '#FF5722',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D84315',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  locationCoords: {
    color: '#FFCCBC',
    fontSize: 10,
  },
});
```

**价格标签样式:**
```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  iconWidth={80}
  iconHeight={40}
>
  <View style={styles.priceTag}>
    <Text style={styles.priceText}>¥1280</Text>
    <View style={styles.priceArrow} />
  </View>
</Marker>

const styles = StyleSheet.create({
  priceTag: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    position: 'relative',
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF9800',
  },
});
```

> **自定义视图要点**：
> - ✅ 支持所有 React Native 样式（backgroundColor、borderRadius、flexbox、shadow 等）
> - ✅ 使用 `iconWidth` 和 `iconHeight` 控制最终显示尺寸
> - ✅ 子视图会自动转换为图片显示在地图上
> - ✅ 支持动态内容和复杂布局
> - ⚠️ 仅支持声明式 `<Marker>` 组件
> - ⚠️ 建议明确指定 `iconWidth` 和 `iconHeight` 以确保跨设备一致性
> - ⚠️ iOS 的 shadow 样式可能需要额外配置（shadowColor、shadowOffset 等）

#### Android 特有属性

```tsx
<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="Android 特性"
    opacity={0.8}
    flat={true}
    zIndex={10}
    anchor={{ x: 0.5, y: 1.0 }}
  />
</MapView>
```

#### iOS 特有属性

```tsx
import { Platform } from 'react-native';

<MapView style={{ flex: 1 }}>
  {Platform.OS === 'ios' && (
    <Marker
      position={{ latitude: 39.9, longitude: 116.4 }}
      title="iOS 特性"
      pinColor="green"
      animatesDrop={true}
      centerOffset={{ x: 0, y: -20 }}
    />
  )}
</MapView>
```

#### 拖拽事件处理

> **注意**：事件处理仅在声明式 `<Marker>` 组件中有效

```tsx
<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="可拖拽标记"
    draggable={true}
    onDragStart={(e) => console.log('开始拖拽', e.nativeEvent)}
    onDrag={(e) => console.log('拖拽中', e.nativeEvent)}
    onDragEnd={(e) => {
      const { latitude, longitude } = e.nativeEvent;
      console.log(`拖拽结束: ${latitude}, ${longitude}`);
      Alert.alert('新位置', `纬度: ${latitude.toFixed(6)}\n经度: ${longitude.toFixed(6)}`);
    }}
  />
</MapView>
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
    onPress={(e) => console.log('点击折线')}
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
    onPress={(e) => console.log('点击纹理折线')}
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
    onPress={(e) => console.log('点击多边形')}
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
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 开始方向更新
ExpoGaodeMapModule.startUpdatingHeading();

// 停止方向更新
ExpoGaodeMapModule.stopUpdatingHeading();

// 监听方向更新
const subscription = ExpoGaodeMapModule.addListener('onHeadingUpdate', (heading) => {
  console.log('方向更新:', heading);
});

// 取消监听
subscription.remove();