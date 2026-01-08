# Overlays API

Overlay components are used to display various graphic elements on the map.

## Circle

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `center` | `LatLng` | - | Circle center coordinate (required) |
| `radius` | `number` | - | Radius (meters) |
| `fillColor` | `string` | - | Fill color |
| `strokeColor` | `string` | - | Stroke color |
| `strokeWidth` | `number` | `1` | Stroke width |

### Example

```tsx
<MapView>
  <Circle
    center={{ latitude: 39.9, longitude: 116.4 }}
    radius={1000}
    fillColor="#8800FF00"
    strokeColor="#FFFF0000"
    strokeWidth={2}
    onPress={() => console.log('Circle pressed')}
  />
</MapView>
```

## Marker

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `position` | `LatLng` | - | Marker coordinate (required) |
| `title` | `string` | - | Title |
| `snippet` | `string` | - | Description |
| `draggable` | `boolean` | `false` | Whether draggable |
| `icon` | `string` | - | Custom icon |
| `iconWidth` | `number` | `40` | Icon width |
| `iconHeight` | `number` | `40` | Icon height |

### Example

```tsx
<MapView>
  <Marker
    position={{ latitude: 39.9, longitude: 116.4 }}
    title="Beijing"
    snippet="Capital of China"
    draggable={true}
    onPress={() => console.log('Marker pressed')}
    onDragEnd={(e) => console.log('Drag ended', e.nativeEvent)}
  />
</MapView>
```

### Custom Icon

```tsx
import { Image } from 'react-native';

const iconUri = Image.resolveAssetSource(require('./marker.png')).uri;

<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  icon={iconUri}
  iconWidth={50}
  iconHeight={50}
/>
```

### Custom View

```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
>
  <View style={{ backgroundColor: '#fff', padding: 8, borderRadius: 8 }}>
    <Text>Custom Content</Text>
  </View>
</Marker>
```

## Polyline

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `LatLng[]` | - | Polyline coordinate array (required) |
| `width` | `number` | `5` | Line width |
| `color` | `string` | - | Line color |
| `texture` | `string` | - | Texture image URL |

### Example

```tsx
<MapView>
  <Polyline
    points={[
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.95, longitude: 116.45 },
      { latitude: 40.0, longitude: 116.5 },
    ]}
    width={5}
    color="#FFFF0000"
    onPress={() => console.log('Polyline pressed')}
  />
</MapView>
```

## Polygon

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `LatLng[]` | - | Polygon vertex array (required) |
| `fillColor` | `string` | - | Fill color |
| `strokeColor` | `string` | - | Stroke color |
| `strokeWidth` | `number` | `1` | Stroke width |

### Example

```tsx
<MapView>
  <Polygon
    points={[
      { latitude: 39.9, longitude: 116.3 },
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.8, longitude: 116.4 },
    ]}
    fillColor="#8800FF00"
    strokeColor="#FFFF0000"
    strokeWidth={2}
    onPress={() => console.log('Polygon pressed')}
  />
</MapView>
```

## Color Format

Overlay colors use ARGB format: `#AARRGGBB`

- `AA`: Alpha (00-FF)
- `RR`: Red (00-FF)
- `GG`: Green (00-FF)
- `BB`: Blue (00-FF)

Examples:
- `#FFFF0000` - Opaque red
- `#8800FF00` - 50% transparent green
- `#FF0000FF` - Opaque blue

## Complete Example

```tsx
import { MapView, Circle, Marker, Polyline, Polygon } from 'expo-gaode-map';

export default function OverlaysExample() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    >
      {/* Circle */}
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        fillColor="#8800FF00"
        strokeColor="#FFFF0000"
      />

      {/* Marker */}
      <Marker
        position={{ latitude: 39.95, longitude: 116.45 }}
        title="Marker"
      />

      {/* Polyline */}
      <Polyline
        points={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.95, longitude: 116.45 },
        ]}
        width={5}
        color="#FF0000FF"
      />

      {/* Polygon */}
      <Polygon
        points={[
          { latitude: 39.85, longitude: 116.35 },
          { latitude: 39.85, longitude: 116.45 },
          { latitude: 39.75, longitude: 116.40 },
        ]}
        fillColor="#880000FF"
      />
    </MapView>
  );
}
```

## Cluster

Used to display large amounts of point data, automatically clustering nearby points.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `ClusterPoint[]` | - | Cluster point data array (required) |
| `radius` | `number` | `30` | Cluster radius |
| `minClusterSize` | `number` | `1` | Minimum cluster size (count >= this value shows cluster style) |
| `clusterStyle` | `ViewStyle` | - | Base cluster style (backgroundColor, borderColor, borderWidth, width, height) |
| `clusterTextStyle` | `TextStyle` | - | Cluster text style (color, fontSize, fontWeight) |
| `clusterBuckets` | `Bucket[]` | - | Tiered style configuration |
| `onClusterPress` | `function` | - | Press event |

### Tiered Style (clusterBuckets)

The `clusterBuckets` property allows displaying different colors based on the cluster count.

```tsx
clusterBuckets={[
  { minPoints: 1, backgroundColor: '#00BFFF' }, // 1: Blue
  { minPoints: 2, backgroundColor: '#32CD32' }, // 2-4: Green
  { minPoints: 5, backgroundColor: '#FFA500' }, // 5-9: Orange
  { minPoints: 10, backgroundColor: '#FF4500' } // 10+: Red
]}
```

### Example

```tsx
<Cluster
  points={data}
  radius={30}
  minClusterSize={1}
  clusterBuckets={[
    { minPoints: 1, backgroundColor: '#00BFFF' },
    { minPoints: 5, backgroundColor: '#FFA500' }
  ]}
  clusterStyle={{
    width: 40,
    height: 40,
    borderColor: 'white',
    borderWidth: 2,
  }}
  onClusterPress={(e) => console.log(e.nativeEvent)}
/>
```

## MultiPoint (MassPoint)

Used to display thousands of points on the map, with better performance than standard Markers.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `points` | `MultiPointItem[]` | - | Point data array (required) |
| `icon` | `string` | - | Icon resource URI |
| `iconWidth` | `number` | - | Icon width |
| `iconHeight` | `number` | - | Icon height |
| `onMultiPointPress` | `function` | - | Press event |

### Example

```tsx
import { Image } from 'react-native';
const iconUri = Image.resolveAssetSource(require('./point.png')).uri;

<MultiPoint
  points={points}
  icon={iconUri}
  iconWidth={30}
  iconHeight={30}
  onMultiPointPress={(e) => console.log('Clicked index:', e.nativeEvent.index)}
/>
```

## HeatMap

Used to display data density distribution.

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `data` | `HeatMapPoint[]` | - | Heat map data (lat, lng, count) |
| `radius` | `number` | `12` | Heat radius |
| `opacity` | `number` | `0.6` | Opacity (0-1) |
| `gradient` | `object` | - | Gradient configuration |

### Example

```tsx
<HeatMap
  data={points}
  radius={30}
  opacity={0.5}
  gradient={{
    colors: ['blue', 'green', 'red'],
    startPoints: [0.2, 0.5, 0.9]
  }}
/>
```

## Related Documentation

- [MapView API](/en/api/mapview)
- [Overlay Examples](/en/examples/overlays)