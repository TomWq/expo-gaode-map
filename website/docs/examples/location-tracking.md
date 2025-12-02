# 定位追踪应用

展示如何实现定位追踪功能。

## 基础定位

获取当前位置：

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { ExpoGaodeMapModule, type Location } from 'expo-gaode-map';

export default function BasicLocation() {
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    ExpoGaodeMapModule.initSDK({
      androidKey: 'your-android-key',
      iosKey: 'your-ios-key',
    });
  }, []);

  const getLocation = async () => {
    try {
      const loc = await ExpoGaodeMapModule.getCurrentLocation();
      setLocation(loc);
    } catch (error) {
      console.error('获取位置失败:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="获取位置" onPress={getLocation} />
      {location && (
        <Text>
          位置: {location.latitude}, {location.longitude}
        </Text>
      )}
    </View>
  );
}
```

## 连续定位

持续追踪用户位置：

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import { ExpoGaodeMapModule, type Location } from 'expo-gaode-map';

export default function ContinuousLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    ExpoGaodeMapModule.initSDK({
      androidKey: 'your-android-key',
      iosKey: 'your-ios-key',
    });

    // 配置定位
    ExpoGaodeMapModule.setLocatingWithReGeocode(true);
    ExpoGaodeMapModule.setInterval(2000);

    // 监听位置更新
    const subscription = ExpoGaodeMapModule.addLocationListener(
      'onLocationUpdate',
      (loc) => {
        setLocation(loc);
      }
    );

    return () => subscription.remove();
  }, []);

  const startTracking = () => {
    ExpoGaodeMapModule.start();
    setIsTracking(true);
  };

  const stopTracking = () => {
    ExpoGaodeMapModule.stop();
    setIsTracking(false);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button
        title={isTracking ? '停止追踪' : '开始追踪'}
        onPress={isTracking ? stopTracking : startTracking}
      />
      {location && (
        <View>
          <Text>纬度: {location.latitude.toFixed(6)}</Text>
          <Text>经度: {location.longitude.toFixed(6)}</Text>
          <Text>精度: {location.accuracy.toFixed(2)} 米</Text>
          {location.address && <Text>地址: {location.address}</Text>}
        </View>
      )}
    </View>
  );
}
```

## 地图定位追踪

在地图上显示定位追踪：

```tsx
import { useEffect, useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import {
  MapView,
  ExpoGaodeMapModule,
  type Location,
} from 'expo-gaode-map';

export default function MapLocationTracking() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    ExpoGaodeMapModule.initSDK({
      androidKey: 'your-android-key',
      iosKey: 'your-ios-key',
    });

    ExpoGaodeMapModule.setLocatingWithReGeocode(true);
    ExpoGaodeMapModule.setInterval(2000);

    const subscription = ExpoGaodeMapModule.addLocationListener(
      'onLocationUpdate',
      setLocation
    );

    return () => {
      subscription.remove();
      ExpoGaodeMapModule.stop();
    };
  }, []);

  const toggleTracking = () => {
    if (isTracking) {
      ExpoGaodeMapModule.stop();
    } else {
      ExpoGaodeMapModule.start();
    }
    setIsTracking(!isTracking);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialCameraPosition={{
          target: {
            latitude: location?.latitude || 39.9,
            longitude: location?.longitude || 116.4,
          },
          zoom: 15,
        }}
        myLocationEnabled={true}
        followUserLocation={isTracking}
      />

      <View style={styles.controls}>
        <Button
          title={isTracking ? '停止追踪' : '开始追踪'}
          onPress={toggleTracking}
          color={isTracking ? '#FF3B30' : '#007AFF'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
});
```

## 相关文档

- [定位 API](/api/location)
- [初始化指南](/guide/initialization)
- [基础地图](/examples/basic-map)