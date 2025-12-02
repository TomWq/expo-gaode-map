# 覆盖物示例

展示各种覆盖物的使用方法。

## Circle (圆形)

```tsx
import { MapView, Circle } from 'expo-gaode-map';

export default function CircleExample() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    >
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        fillColor="#8800FF00"
        strokeColor="#FFFF0000"
        strokeWidth={2}
        onPress={() => console.log('圆形被点击')}
      />
    </MapView>
  );
}
```

## Marker (标记点)

### 基础标记

```tsx
import { MapView, Marker } from 'expo-gaode-map';

export default function MarkerExample() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    >
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        title="北京"
        snippet="中国首都"
        draggable={true}
        onPress={() => console.log('标记被点击')}
      />
    </MapView>
  );
}
```

### 自定义图标

```tsx
import { MapView, Marker } from 'expo-gaode-map';
import { Image } from 'react-native';

const iconUri = Image.resolveAssetSource(require('./marker.png')).uri;

export default function CustomIconMarker() {
  return (
    <MapView style={{ flex: 1 }}>
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        icon={iconUri}
        iconWidth={50}
        iconHeight={50}
      />
    </MapView>
  );
}
```

### 自定义视图

```tsx
import { MapView, Marker } from 'expo-gaode-map';
import { View, Text, StyleSheet } from 'react-native';

export default function CustomViewMarker() {
  return (
    <MapView style={{ flex: 1 }}>
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        customViewWidth={120}
        customViewHeight={40}
      >
        <View style={styles.markerView}>
          <Text style={styles.markerText}>自定义标记</Text>
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  markerView: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  markerText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
```

## Polyline (折线)

```tsx
import { MapView, Polyline } from 'expo-gaode-map';

export default function PolylineExample() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    >
      <Polyline
        points={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.95, longitude: 116.45 },
          { latitude: 40.0, longitude: 116.5 },
        ]}
        width={5}
        color="#FFFF0000"
        onPress={() => console.log('折线被点击')}
      />
    </MapView>
  );
}
```

## Polygon (多边形)

```tsx
import { MapView, Polygon } from 'expo-gaode-map';

export default function PolygonExample() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    >
      <Polygon
        points={[
          { latitude: 39.9, longitude: 116.3 },
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.8, longitude: 116.4 },
        ]}
        fillColor="#8800FF00"
        strokeColor="#FFFF0000"
        strokeWidth={2}
        onPress={() => console.log('多边形被点击')}
      />
    </MapView>
  );
}
```

## 组合使用

```tsx
import { MapView, Circle, Marker, Polyline, Polygon } from 'expo-gaode-map';

export default function CombinedOverlays() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    >
      {/* 圆形 */}
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        fillColor="#8800FF00"
        strokeColor="#FFFF0000"
      />

      {/* 标记点 */}
      <Marker
        position={{ latitude: 39.95, longitude: 116.45 }}
        title="标记点"
      />

      {/* 折线 */}
      <Polyline
        points={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.95, longitude: 116.45 },
        ]}
        width={5}
        color="#FF0000FF"
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
      />
    </MapView>
  );
}
```

## 相关文档

- [覆盖物 API](/api/overlays)
- [MapView API](/api/mapview)
- [基础地图](/examples/basic-map)