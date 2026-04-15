# 基础地图应用

展示如何创建一个基础的地图应用。

> ⚠️ 以下示例默认你已经在首次安装时完成过隐私同意；同意后原生会自动持久化并在后续冷启动恢复。

## 简单地图

最简单的地图显示：

```tsx
import { MapView } from 'expo-gaode-map';

export default function SimpleMap() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    />
  );
}
```

## 带定位的地图

显示用户位置：

```tsx
import { MapView, ExpoGaodeMapModule } from 'expo-gaode-map';
import { useEffect } from 'react';

export default function MapWithLocation() {
  useEffect(() => {
    if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
      ExpoGaodeMapModule.setPrivacyConfig({
        hasShow: true,
        hasContainsPrivacy: true,
        hasAgree: true,
      });
    }
    // 仅在使用 Web API 时调用
    // ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });
  }, []);

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      myLocationEnabled={true}
    />
  );
}
```

## 完整功能地图

包含覆盖物和相机控制：

```tsx
import { useRef } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import {
  MapView,
  Circle,
  Marker,
  Polyline,
  type MapViewRef
} from 'expo-gaode-map';

export default function FullFeaturedMap() {
  const mapRef = useRef<MapViewRef | null>(null);

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
        trafficEnabled={true}
        onMapPress={(e) => console.log('点击地图', e.nativeEvent)}
      >
        <Circle
          center={{ latitude: 39.9, longitude: 116.4 }}
          radius={1000}
          fillColor="#8800FF00"
        />

        <Marker
          position={{ latitude: 39.95, longitude: 116.45 }}
          title="标记点"
        />

        <Polyline
          points={[
            { latitude: 39.9, longitude: 116.4 },
            { latitude: 39.95, longitude: 116.45 },
          ]}
          strokeWidth={5}
          strokeColor="#FFFF0000"
        />
      </MapView>

      <View style={styles.controls}>
        <Button title="移动相机" onPress={handleMoveCamera} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
```

## 相关文档

- [MapView API](/api/mapview)
- [定位追踪](/examples/location-tracking)
- [覆盖物](/examples/overlays)
