# MapView API

MapView is the core component for displaying maps.

## Props

### Basic Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mapType` | `MapType` | `0` | Map type (0: Standard, 1: Satellite, 2: Night, 3: Navi, 4: Bus) |
| `worldMapSwitchEnabled` | `boolean` | `false` | Whether to enable automatic switching between domestic and foreign maps (iOS) |
| `initialCameraPosition` | `CameraPosition` | - | Initial camera position |
| `style` | `ViewStyle` | - | Component style |

### Location Related

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `myLocationEnabled` | `boolean` | `false` | Whether to show location dot |
| `followUserLocation` | `boolean` | `false` | Whether to follow user location |

### Control Display

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `zoomControlsEnabled` | `boolean` | `true` | Whether to show zoom controls (Android) |
| `compassEnabled` | `boolean` | `true` | Whether to show compass |
| `scaleControlsEnabled` | `boolean` | `true` | Whether to show scale controls |

### Gesture Control

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `zoomGesturesEnabled` | `boolean` | `true` | Enable zoom gestures |
| `scrollGesturesEnabled` | `boolean` | `true` | Enable scroll gestures |
| `rotateGesturesEnabled` | `boolean` | `true` | Enable rotate gestures |
| `tiltGesturesEnabled` | `boolean` | `true` | Enable tilt gestures |

### Zoom Control

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxZoom` | `number` | `20` | Maximum zoom level (3-20) |
| `minZoom` | `number` | `3` | Minimum zoom level (3-20) |

### Layer Display

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `trafficEnabled` | `boolean` | `false` | Whether to show traffic |
| `buildingsEnabled` | `boolean` | `true` | Whether to show 3D buildings |
| `indoorViewEnabled` | `boolean` | `false` | Whether to show indoor map |

### Event Callbacks

| Event | Parameters | Description |
|-------|------------|-------------|
| `onMapPress` | `(event: NativeSyntheticEvent<LatLng>) => void` | Map press event |
| `onMapLongPress` | `(event: NativeSyntheticEvent<LatLng>) => void` | Map long press event |
| `onLoad` | `(event: NativeSyntheticEvent<{}>) => void` | Map load complete event |

## MapView Methods

Called via Ref:

```tsx
interface MapViewRef {
  // Camera control
  moveCamera(position: CameraPosition, duration?: number): Promise<void>;
  setCenter(center: LatLng, animated?: boolean): Promise<void>;
  setZoom(zoom: number, animated?: boolean): Promise<void>;
  getCameraPosition(): Promise<CameraPosition>;
  getLatLng(point: Point): Promise<LatLng>;
  /**
   * Take a snapshot of the map
   * @returns Path to the snapshot image file
   */
  takeSnapshot(): Promise<string>;
}
```

## Components and Hooks

### useMap

```tsx
import { useMap } from "expo-gaode-map";

function ZoomInButton() {
  const map = useMap();
  return (
    <Button
      title="Zoom In"
      onPress={async () => {
        const current = await map.getCameraPosition();
        await map.setZoom((current.zoom ?? 10) + 1, true);
      }}
    />
  );
}
```

### MapUI

A container component for placing UI elements on top of the map.

**Features:**
- Renders above the map layer.
- Events (press, scroll) are not intercepted by the map.
- **Snapshot Support**: On Android, components inside `MapUI` are included when taking a snapshot using `MapView.takeSnapshot()`.

```tsx
import { MapUI, MapView } from "expo-gaode-map";

<MapView style={{ flex: 1 }}>
  <MapUI>
    <Text>Overlay UI</Text>
  </MapUI>
</MapView>;
```

## Usage Examples

### Basic Usage

```tsx
import { MapView } from 'expo-gaode-map';

<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  myLocationEnabled={true}
  onLoad={() => console.log('Map loaded')}
/>
```

### Using Ref to Control Camera

```tsx
import { useRef } from 'react';
import { MapView, type MapViewRef } from 'expo-gaode-map';

const mapRef = useRef<MapViewRef>(null);

const handleMoveCamera = async () => {
  await mapRef.current?.moveCamera(
    {
      target: { latitude: 40.0, longitude: 116.5 },
      zoom: 15,
    },
    1000
  );
};

<MapView
  ref={mapRef}
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
/>
```

### Snapshot

Use `takeSnapshot` method to capture the current map screen.

**Features:**
- **Android**: Supports capturing floating components inside `<MapUI>` (e.g., custom buttons, legends). The snapshot will include both the map base and these UI elements.
- **iOS**: Supports capturing map content and has optimized rendering for transparent background components.

```tsx
const handleSnapshot = async () => {
  try {
    const uri = await mapRef.current?.takeSnapshot();
    console.log('Snapshot saved:', uri);
  } catch (e) {
    console.error('Snapshot failed:', e);
  }
};
```

## Type Definitions

### CameraPosition

```typescript
interface CameraPosition {
  target: LatLng;    // Target location
  zoom: number;      // Zoom level (3-20)
  tilt?: number;     // Tilt angle (0-60)
  bearing?: number;  // Rotation angle (0-360)
}
```

### LatLng

```typescript
interface LatLng {
  latitude: number;   // Latitude
  longitude: number;  // Longitude
}
```

## Related Documentation

- [Location API](/en/api/location)
- [Overlays](/en/api/overlays)
- [Examples](/en/examples/)
