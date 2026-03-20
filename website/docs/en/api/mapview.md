# MapView API

`MapView` is the core component for map rendering, user location display, camera control, event callbacks, and snapshots.

> ⚠️ **Privacy requirement**
>
> Before rendering `MapView` or calling any map / location capability, a fresh install must complete privacy compliance first.
> Once granted, privacy state is persisted natively and auto-restored on later cold starts.
>
> If privacy is not ready, the JS layer throws a clear error before the native SDK can fail.

## Props

### Basic configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mapType` | `MapType` | `MapType.Standard` | Map type |
| `initialCameraPosition` | `CameraPosition` | - | Initial camera position |
| `style` | `StyleProp<ViewStyle>` | - | Map style; usually requires `flex: 1` |
| `worldMapSwitchEnabled` | `boolean` | `false` | Automatically switch between domestic and world map, iOS only |
| `customMapStyle` | `{ styleId?: string; styleDataPath?: string; extraStyleDataPath?: string }` | - | Custom map style |

### Location-related

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `myLocationEnabled` | `boolean` | `false` | Show user location |
| `followUserLocation` | `boolean` | `false` | Follow user location |
| `userLocationRepresentation` | `UserLocationRepresentation` | - | Blue-dot appearance configuration |
| `distanceFilter` | `number` | - | Minimum location update distance in meters, iOS only |
| `headingFilter` | `number` | - | Minimum heading change in degrees, iOS only |

#### `UserLocationRepresentation`

**Shared properties**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showMyLocation` | `boolean` | `true` | Whether to show the location dot |
| `showsAccuracyRing` | `boolean` | `true` | Whether to show the accuracy ring |
| `fillColor` | `string \| number` | - | Accuracy ring fill color |
| `strokeColor` | `string \| number` | - | Accuracy ring stroke color |
| `lineWidth` | `number` | `0` | Accuracy ring stroke width |
| `image` | `string` | - | Custom location icon |
| `imageWidth` | `number` | - | Icon width |
| `imageHeight` | `number` | - | Icon height |

**iOS only**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `showsHeadingIndicator` | `boolean` | `true` | Show heading cone |
| `enablePulseAnimation` | `boolean` | `true` | Enable pulse animation |
| `locationDotBgColor` | `string \| number` | `'white'` | Location dot background color |
| `locationDotFillColor` | `string \| number` | `'blue'` | Location dot fill color |

**Android only**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `anchorU` | `number` | - | Icon anchor U |
| `anchorV` | `number` | - | Icon anchor V |
| `locationType` | `'SHOW' \| 'LOCATE' \| 'FOLLOW' \| 'MAP_ROTATE' \| 'LOCATION_ROTATE' \| 'LOCATION_ROTATE_NO_CENTER' \| 'FOLLOW_NO_CENTER' \| 'MAP_ROTATE_NO_CENTER'` | `'LOCATION_ROTATE'` | Blue-dot display mode |

#### Android `locationType`

- `'SHOW'`: locate once
- `'LOCATE'`: locate once and move camera to center
- `'FOLLOW'`: continuous updates, follows user, icon does not rotate
- `'MAP_ROTATE'`: rotate the map based on device heading
- `'LOCATION_ROTATE'`: rotate the location icon and keep it centered
- `'LOCATION_ROTATE_NO_CENTER'`: rotate the location icon without re-centering
- `'FOLLOW_NO_CENTER'`: continuous updates without re-centering
- `'MAP_ROTATE_NO_CENTER'`: rotate the map without re-centering

### Map display and controls

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `indoorViewEnabled` | `boolean` | `false` | Show indoor map |
| `buildingsEnabled` | `boolean` | `true` | Show 3D buildings |
| `labelsEnabled` | `boolean` | `true` | Show map labels |
| `compassEnabled` | `boolean` | `true` | Show compass |
| `zoomControlsEnabled` | `boolean` | `true` | Show zoom controls, Android only |
| `scaleControlsEnabled` | `boolean` | `true` | Show scale bar |
| `myLocationButtonEnabled` | `boolean` | `false` | Show my-location button, Android only |
| `trafficEnabled` | `boolean` | `false` | Show traffic layer |

### Gestures and zoom

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxZoom` | `number` | `20` | Maximum zoom level |
| `minZoom` | `number` | `3` | Minimum zoom level |
| `zoomGesturesEnabled` | `boolean` | `true` | Enable pinch zoom |
| `scrollGesturesEnabled` | `boolean` | `true` | Enable pan gestures |
| `rotateGesturesEnabled` | `boolean` | `true` | Enable rotate gestures |
| `tiltGesturesEnabled` | `boolean` | `true` | Enable tilt gestures |

### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onMapPress` | `NativeSyntheticEvent<LatLng>` | Tap empty map area |
| `onPressPoi` | `NativeSyntheticEvent<MapPoi>` | Tap a POI |
| `onMapLongPress` | `NativeSyntheticEvent<LatLng>` | Long press on map |
| `onCameraMove` | `NativeSyntheticEvent<CameraEvent>` | Fires continuously while camera moves |
| `onCameraIdle` | `NativeSyntheticEvent<CameraEvent>` | Fires after camera movement ends |
| `onLoad` | `NativeSyntheticEvent<{}>` | Map finished loading |
| `onLocation` | `NativeSyntheticEvent<LocationEvent>` | Blue-dot location update |

### Camera event throttling

- Use `cameraEventThrottleMs?: number` to control the native `onCameraMove` event frequency in milliseconds
- Default is `32`; pass `0` to disable throttling and receive all move events in JS

## `MapViewRef`

Use a ref to call:

```tsx
interface MapViewRef {
  moveCamera(position: CameraUpdate, duration?: number): Promise<void>;
  getLatLng(point: Point): Promise<LatLng>;
  setCenter(center: LatLngPoint, animated?: boolean): Promise<void>;
  setZoom(zoom: number, animated?: boolean): Promise<void>;
  getCameraPosition(): Promise<CameraPosition>;
  takeSnapshot(): Promise<string>;
}
```

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `moveCamera` | `(position, duration?)` | `Promise<void>` | Move the camera |
| `getLatLng` | `(point)` | `Promise<LatLng>` | Convert screen point to geo coordinate |
| `setCenter` | `(center, animated?)` | `Promise<void>` | Set map center |
| `setZoom` | `(zoom, animated?)` | `Promise<void>` | Set zoom level |
| `getCameraPosition` | - | `Promise<CameraPosition>` | Get current camera state |
| `takeSnapshot` | - | `Promise<string>` | Capture a snapshot and return the image file path |

## Usage examples

### Basic map

```tsx
import { ExpoGaodeMapModule, MapView } from 'expo-gaode-map';

if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
  });
}

export default function App() {
  return (
    <MapView
      style={{ flex: 1 }}
      mapType={0}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      onLoad={() => console.log('Map loaded')}
    />
  );
}
```

### Control camera with ref

```tsx
import { useRef } from 'react';
import { Button, View } from 'react-native';
import { MapView, type MapViewRef } from 'expo-gaode-map';

export default function CameraExample() {
  const mapRef = useRef<MapViewRef | null>(null);

  const handleMoveCamera = async () => {
    await mapRef.current?.moveCamera(
      {
        target: { latitude: 40.0, longitude: 116.5 },
        zoom: 15,
        tilt: 30,
      },
      1000
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10,
        }}
      />
      <Button title="Move Camera" onPress={handleMoveCamera} />
    </View>
  );
}
```

### Listen to POI / camera / location

```tsx
<MapView
  style={{ flex: 1 }}
  myLocationEnabled
  onPressPoi={(e) => console.log('POI', e.nativeEvent)}
  onCameraMove={(e) => console.log('Moving', e.nativeEvent.cameraPosition)}
  onCameraIdle={(e) => console.log('Idle', e.nativeEvent.latLngBounds)}
  onLocation={(e) => console.log('Blue dot', e.nativeEvent)}
/>
```

### Snapshot

`takeSnapshot()` returns an image file path. If you render floating UI inside `MapUI`, those UI elements are also included in the snapshot.

```tsx
const uri = await mapRef.current?.takeSnapshot();
console.log('Snapshot path:', uri);
```

## Extra types

### `CameraPosition`

```ts
interface CameraPosition {
  target?: LatLng;
  zoom?: number;
  tilt?: number;
  bearing?: number;
}
```

### `LocationEvent`

```ts
interface LocationEvent {
  latitude: number;
  longitude: number;
  accuracy: number;
}
```

### `CameraEvent`

```ts
interface CameraEvent {
  cameraPosition: CameraPosition;
  latLngBounds: LatLngBounds;
}
```
