# Overlays API

Overlay components must be rendered as children of `MapView`. They let you draw points, lines, polygons, circles, heatmaps, massive point sets, and clusters.

> ⚠️ Overlays depend on the map instance. Make sure privacy compliance is completed on fresh install before rendering `MapView`. After consent is granted once, native code restores it automatically on later cold starts.

## Coordinate formats

All overlay coordinates support:

- object form: `{ latitude, longitude }`
- array form: `[longitude, latitude]`

---

## Marker

### Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `position` | `LatLngPoint` | - | Marker coordinate, required |
| `icon` | `string \| ImageSourcePropType` | - | Custom icon |
| `iconWidth` | `number` | `40` | Icon width, only used with `icon` |
| `iconHeight` | `number` | `40` | Icon height, only used with `icon` |
| `title` | `string` | - | Title |
| `snippet` | `string` | - | Subtitle / description |
| `opacity` | `number` | - | Opacity between `0 ~ 1`, Android only |
| `draggable` | `boolean` | `false` | Whether the marker is draggable |
| `flat` | `boolean` | `false` | Lay marker flat on the map, Android only |
| `zIndex` | `number` | - | Z index, Android only |
| `anchor` | `Point` | - | Anchor ratio, Android only |
| `centerOffset` | `Point` | - | View offset, iOS only |
| `animatesDrop` | `boolean` | `false` | Drop animation, iOS only |
| `pinColor` | `'red' \| 'orange' \| 'yellow' \| 'green' \| 'cyan' \| 'blue' \| 'violet' \| 'magenta' \| 'rose' \| 'purple'` | - | Default pin color |
| `children` | `React.ReactNode` | - | Custom marker content, measured automatically from layout |
| `cacheKey` | `string` | - | Cache key for custom marker rendering |
| `growAnimation` | `boolean` | `false` | Grow animation on Android / iOS |
| `smoothMovePath` | `LatLng[]` | - | Path for smooth movement |
| `smoothMoveDuration` | `number` | `10` | Total movement duration in seconds |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onMarkerPress` | `NativeSyntheticEvent<LatLng>` | Marker tap |
| `onMarkerDragStart` | `NativeSyntheticEvent<LatLng>` | Drag start |
| `onMarkerDrag` | `NativeSyntheticEvent<LatLng>` | Dragging |
| `onMarkerDragEnd` | `NativeSyntheticEvent<LatLng>` | Drag end |

### Example

```tsx
<MapView style={{ flex: 1 }}>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="Beijing"
    snippet="Capital of China"
    draggable
    onMarkerPress={(e) => console.log('Marker pressed', e.nativeEvent)}
    onMarkerDragEnd={(e) => console.log('Drag end', e.nativeEvent)}
  />
</MapView>
```

### Custom view

```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  cacheKey="custom-marker-1"
>
  <View style={{ backgroundColor: '#fff', padding: 8, borderRadius: 8 }}>
    <Text>Custom Content</Text>
  </View>
</Marker>
```

### Smooth movement

```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  smoothMovePath={[
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.92, longitude: 116.42 },
    { latitude: 39.93, longitude: 116.43 },
  ]}
  smoothMoveDuration={5}
/>
```

---

## Polyline

### Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `LatLngPoint[]` | - | Polyline coordinates, required |
| `strokeWidth` | `number` | - | Line width |
| `strokeColor` | `ColorValue` | - | Line color |
| `zIndex` | `number` | - | Z index |
| `colors` | `ColorValue[]` | - | Segment colors |
| `gradient` | `boolean` | `false` | Gradient line, Android only |
| `geodesic` | `boolean` | `false` | Geodesic line, Android only |
| `simplificationTolerance` | `number` | - | Path simplification tolerance in meters |
| `dotted` | `boolean` | `false` | Dotted line, Android only |
| `texture` | `string` | - | Texture image |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onPolylinePress` | `NativeSyntheticEvent<{}>` | Polyline tap |

### Example

```tsx
<Polyline
  points={[
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.95, longitude: 116.45 },
    { latitude: 40.0, longitude: 116.5 },
  ]}
  strokeWidth={5}
  strokeColor="#FF1677FF"
  simplificationTolerance={2}
  onPolylinePress={() => console.log('Polyline pressed')}
/>
```

---

## Polygon

### Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `LatLngPoint[] \| LatLngPoint[][]` | - | Polygon coordinates, supports holes |
| `strokeWidth` | `number` | - | Stroke width |
| `strokeColor` | `ColorValue` | - | Stroke color |
| `fillColor` | `ColorValue` | - | Fill color |
| `zIndex` | `number` | - | Z index |
| `simplificationTolerance` | `number` | - | Boundary simplification tolerance in meters |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onPolygonPress` | `NativeSyntheticEvent<{}>` | Polygon tap |
| `onPolygonSimplified` | `NativeSyntheticEvent<{ originalCount: number; simplifiedCount: number }>` | Simplification finished |

### Example

```tsx
<Polygon
  points={[
    [
      { latitude: 39.9, longitude: 116.3 },
      { latitude: 39.9, longitude: 116.5 },
      { latitude: 39.8, longitude: 116.5 },
      { latitude: 39.8, longitude: 116.3 },
    ],
    [
      { latitude: 39.87, longitude: 116.37 },
      { latitude: 39.87, longitude: 116.43 },
      { latitude: 39.83, longitude: 116.43 },
      { latitude: 39.83, longitude: 116.37 },
    ],
  ]}
  fillColor="#5533AAFF"
  strokeColor="#FF1677FF"
  strokeWidth={2}
  onPolygonSimplified={(e) => console.log(e.nativeEvent)}
/>
```

---

## Circle

### Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `center` | `LatLngPoint` | - | Center coordinate, required |
| `radius` | `number` | - | Radius in meters, required |
| `strokeWidth` | `number` | - | Stroke width |
| `strokeColor` | `ColorValue` | - | Stroke color |
| `fillColor` | `ColorValue` | - | Fill color |
| `zIndex` | `number` | - | Z index |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onCirclePress` | `NativeSyntheticEvent<{}>` | Circle tap |

### Example

```tsx
<Circle
  center={{ latitude: 39.9, longitude: 116.4 }}
  radius={1000}
  fillColor="#2200FF00"
  strokeColor="#FF00AA00"
  strokeWidth={2}
  onCirclePress={() => console.log('Circle pressed')}
/>
```

---

## HeatMap

### Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `LatLngPoint[]` | - | Heat points, required |
| `visible` | `boolean` | `true` | Whether the heatmap is visible |
| `radius` | `number` | - | Heat radius in meters |
| `opacity` | `number` | - | Opacity between `0 ~ 1` |
| `gradient` | `{ colors: ColorValue[]; startPoints: number[] }` | - | Gradient configuration |
| `allowRetinaAdapting` | `boolean` | `false` | Retina heatmap support, iOS only |

> Android note: `HeatMap` uses AMap's `HeatmapTileProvider`, which may reference legacy support-library classes internally. AndroidX projects must enable Jetifier with `android.enableJetifier=true` in `android/gradle.properties`. The config plugin injects this automatically; add it manually if you do not use the plugin or if you maintain native projects directly.

### Example

```tsx
<HeatMap
  data={[
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.92, longitude: 116.42 },
  ]}
  radius={40}
  opacity={0.7}
  gradient={{
    colors: ['#00F5FF', '#00FF7F', '#FFFF00', '#FF4500'],
    startPoints: [0.2, 0.4, 0.7, 1.0],
  }}
/>
```

---

## MultiPoint

Best for rendering large static point datasets more efficiently than individual `Marker` components.

### `MultiPointItem`

```ts
interface MultiPointItem {
  latitude: number;
  longitude: number;
  id?: string | number;
  data?: unknown;
}
```

### Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `MultiPointItem[]` | - | Massive point list, required |
| `icon` | `string \| ImageSourcePropType` | - | Shared icon |
| `iconWidth` | `number` | - | Icon width |
| `iconHeight` | `number` | - | Icon height |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onMultiPointPress` | `NativeSyntheticEvent<{ index: number; item: MultiPointItem }>` | Tap one point |

### Example

```tsx
<MultiPoint
  points={[
    { id: 1, latitude: 39.9, longitude: 116.4, data: { name: 'A' } },
    { id: 2, latitude: 39.91, longitude: 116.41, data: { name: 'B' } },
  ]}
  icon="https://example.com/pin.png"
  iconWidth={24}
  iconHeight={24}
  onMultiPointPress={(e) => console.log(e.nativeEvent.item)}
/>
```

---

## Cluster

### `ClusterPoint`

```ts
interface ClusterPoint {
  latitude?: number;
  longitude?: number;
  position?: LatLngPoint;
  properties?: Record<string, unknown>;
}
```

### Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `ClusterPoint[]` | - | Cluster points, required |
| `icon` | `string` | - | Base cluster icon. Supports HTTP/HTTPS URL, `file://` path, or bundle image name |
| `radius` | `number` | - | Cluster radius |
| `minClusterSize` | `number` | - | Minimum number of points to form a cluster |
| `clusterStyle` | `ViewStyle` | - | Base cluster style |
| `clusterBuckets` | `({ minPoints: number } & ViewStyle)[]` | - | Tiered cluster style rules |
| `clusterTextStyle` | `TextStyle` | - | Cluster count text style |
| `renderMarker` | `(item: ClusterPoint) => React.ReactNode` | - | Not implemented yet |
| `renderCluster` | `(params: ClusterParams) => React.ReactNode` | - | Not implemented yet |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onClusterPress` | `NativeSyntheticEvent<ClusterParams>` | Tap a cluster |

### `ClusterParams`

```ts
interface ClusterParams {
  count: number;
  latitude: number;
  longitude: number;
  pois?: ClusterPoint[];
  id?: number;
  position?: LatLng;
}
```

### Example

```tsx
<Cluster
  points={[
    { latitude: 39.9, longitude: 116.4, properties: { id: 1 } },
    { latitude: 39.901, longitude: 116.401, properties: { id: 2 } },
    { position: [116.402, 39.902], properties: { id: 3 } },
  ]}
  radius={30}
  minClusterSize={2}
  clusterStyle={{
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1677FF',
    alignItems: 'center',
    justifyContent: 'center',
  }}
  clusterTextStyle={{
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  }}
  clusterBuckets={[
    { minPoints: 1, backgroundColor: '#00BFFF' },
    { minPoints: 10, backgroundColor: '#FFA500' },
    { minPoints: 50, backgroundColor: '#FF4500' },
  ]}
  onClusterPress={(e) => console.log(e.nativeEvent.count)}
/>
```

---

## Color formats

Overlay colors support:

- `'#AARRGGBB'`
- `'#RRGGBB'`
- `'red'` / `'rgba(...)'`
- Android also supports numeric colors such as `0xFF1677FF`

## Combined example

```tsx
import {
  MapView,
  Marker,
  Polyline,
  Polygon,
  Circle,
  HeatMap,
  MultiPoint,
  Cluster,
} from 'expo-gaode-map';

export default function OverlaysExample() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 11,
      }}
    >
      <Circle center={{ latitude: 39.9, longitude: 116.4 }} radius={1000} />
      <Marker position={{ latitude: 39.92, longitude: 116.42 }} title="Marker" />
      <Polyline
        points={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.95, longitude: 116.45 },
        ]}
        strokeWidth={4}
        strokeColor="#1677FF"
      />
      <Polygon
        points={[
          { latitude: 39.85, longitude: 116.35 },
          { latitude: 39.85, longitude: 116.45 },
          { latitude: 39.75, longitude: 116.4 },
        ]}
        fillColor="#2200AAFF"
      />
      <HeatMap
        data={[
          { latitude: 39.91, longitude: 116.38 },
          { latitude: 39.92, longitude: 116.39 },
        ]}
      />
    </MapView>
  );
}
```
