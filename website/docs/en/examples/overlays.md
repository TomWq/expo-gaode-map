# Overlays

Examples for drawing circles, markers, lines, polygons, clusters, and heatmaps.

> ⚠️ These examples assume privacy compliance has already been completed and `MapView` can be rendered safely.

## Circle

```tsx
import { Circle, MapView } from 'expo-gaode-map';

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
        onCirclePress={() => console.log('Circle pressed')}
      />
    </MapView>
  );
}
```

## Marker

### Basic marker

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
        title="Beijing"
        snippet="Capital of China"
        draggable
        onMarkerPress={() => console.log('Marker pressed')}
      />
    </MapView>
  );
}
```

### Custom icon

```tsx
import { Image } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';

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

### Custom view

```tsx
import { View, Text, StyleSheet } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';

export default function CustomViewMarker() {
  return (
    <MapView style={{ flex: 1 }}>
      <Marker
        position={{ latitude: 39.9, longitude: 116.4 }}
        customViewWidth={120}
        customViewHeight={40}
      >
        <View style={styles.markerView}>
          <Text style={styles.markerText}>Custom Marker</Text>
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

## Polyline

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
        strokeWidth={5}
        strokeColor="#FFFF0000"
        onPolylinePress={() => console.log('Polyline pressed')}
      />
    </MapView>
  );
}
```

## Polygon

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
        onPolygonPress={() => console.log('Polygon pressed')}
      />
    </MapView>
  );
}
```

## Cluster

```tsx
import { Cluster, MapView } from 'expo-gaode-map';

export default function ClusterExample() {
  const points = Array.from({ length: 100 }).map((_, i) => ({
    latitude: 39.9 + (Math.random() - 0.5) * 0.1,
    longitude: 116.4 + (Math.random() - 0.5) * 0.1,
    properties: { id: i },
  }));

  return (
    <MapView style={{ flex: 1 }}>
      <Cluster
        points={points}
        radius={30}
        minClusterSize={1}
        clusterBuckets={[
          { minPoints: 1, backgroundColor: '#00BFFF' },
          { minPoints: 5, backgroundColor: '#FFA500' },
          { minPoints: 10, backgroundColor: '#FF4500' },
        ]}
        onClusterPress={(e) => console.log(e.nativeEvent)}
      />
    </MapView>
  );
}
```

## MultiPoint

```tsx
import { Image } from 'react-native';
import { MapView, MultiPoint } from 'expo-gaode-map';

const iconUri = Image.resolveAssetSource(require('./point.png')).uri;

export default function MultiPointExample() {
  const points = Array.from({ length: 1000 }).map((_, i) => ({
    id: i,
    latitude: 39.9 + (Math.random() - 0.5) * 0.2,
    longitude: 116.4 + (Math.random() - 0.5) * 0.2,
    data: { name: `Point ${i}` },
  }));

  return (
    <MapView style={{ flex: 1 }}>
      <MultiPoint
        points={points}
        icon={iconUri}
        iconWidth={20}
        iconHeight={20}
        onMultiPointPress={(e) => console.log('Pressed:', e.nativeEvent.index)}
      />
    </MapView>
  );
}
```

## HeatMap

```tsx
import { HeatMap, MapView } from 'expo-gaode-map';

export default function HeatMapExample() {
  const points = Array.from({ length: 500 }).map(() => ({
    latitude: 39.9 + (Math.random() - 0.5) * 0.1,
    longitude: 116.4 + (Math.random() - 0.5) * 0.1,
  }));

  return (
    <MapView style={{ flex: 1 }}>
      <HeatMap
        data={points}
        radius={40}
        opacity={0.7}
        gradient={{
          colors: ['#0000FF', '#00FF00', '#FF0000'],
          startPoints: [0.1, 0.5, 0.9],
        }}
      />
    </MapView>
  );
}
```

## Combined usage

```tsx
import { Circle, MapView, Marker, Polygon, Polyline } from 'expo-gaode-map';

export default function CombinedOverlays() {
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
      />

      <Marker
        position={{ latitude: 39.95, longitude: 116.45 }}
        title="Marker"
      />

      <Polyline
        points={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.95, longitude: 116.45 },
        ]}
        strokeWidth={5}
        strokeColor="#FF0000FF"
      />

      <Polygon
        points={[
          { latitude: 39.85, longitude: 116.35 },
          { latitude: 39.85, longitude: 116.45 },
          { latitude: 39.75, longitude: 116.4 },
        ]}
        fillColor="#880000FF"
        strokeColor="#FFFF0000"
      />
    </MapView>
  );
}
```

## Related

- [Overlays API](/en/api/overlays)
- [MapView API](/en/api/mapview)
- [Basic Map](/en/examples/basic-map)
