# API Documentation

English | [简体中文](./API.md)

Complete API reference documentation.

> ⚠️ **Permission and Privacy Compliance Warning**
>
> Before using map and location features, ensure:
> 1. ✅ Required permission declarations configured in native projects
> 2. ✅ Runtime user authorization requested
> 3. ✅ Compliance with privacy laws (e.g., PIPL in China)
> 4. ✅ AMap SDK privacy compliance interface configured
>
> For detailed configuration, see [README.md](../README.md#permission-configuration)

## Table of Contents

- [MapView Props](#mapview-props)
- [MapView Methods](#mapview-methods)
- [Location API](#location-api)
- [Type Definitions](#type-definitions)

## MapView Props

### Basic Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mapType` | `MapType` | `0` | Map type (0: Normal, 1: Satellite, 2: Night, 3: Navigation, 4: Bus) |
| `initialCameraPosition` | `CameraPosition` | - | Initial camera position |
| `style` | `ViewStyle` | - | Component style |

### Location Related

> ⚠️ **Permission Required**: Location features require user authorization
> - Android: `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION`
> - iOS: `NSLocationWhenInUseUsageDescription` (Info.plist)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `myLocationEnabled` | `boolean` | `false` | Show user location |
| `followUserLocation` | `boolean` | `false` | Follow user location |
| `userLocationRepresentation` | `object` | - | User location style configuration |

#### userLocationRepresentation Configuration

| Property | Type | Platform | Default | Description |
|----------|------|----------|---------|-------------|
| `showsAccuracyRing` | `boolean` | All | `true` | Show accuracy ring |
| `fillColor` | `string \| number` | All | - | Accuracy ring fill color |
| `strokeColor` | `string \| number` | All | - | Accuracy ring stroke color |
| `lineWidth` | `number` | All | `0` | Accuracy ring stroke width |
| `image` | `string` | All | - | Custom location icon |
| `imageWidth` | `number` | All | - | Icon width (dp/pt) |
| `imageHeight` | `number` | All | - | Icon height (dp/pt) |
| `showsHeadingIndicator` | `boolean` | iOS only | `true` | Show heading indicator |
| `enablePulseAnimation` | `boolean` | iOS only | `true` | Enable pulse animation |
| `locationDotBgColor` | `string \| number` | iOS only | `'white'` | Location dot background color |
| `locationDotFillColor` | `string \| number` | iOS only | `'blue'` | Location dot fill color |

### UI Controls

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `zoomControlsEnabled` | `boolean` | `true` | Show zoom controls (Android) |
| `compassEnabled` | `boolean` | `true` | Show compass |
| `scaleControlsEnabled` | `boolean` | `true` | Show scale controls |

### Gesture Controls

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `zoomGesturesEnabled` | `boolean` | `true` | Enable zoom gestures |
| `scrollGesturesEnabled` | `boolean` | `true` | Enable scroll gestures |
| `rotateGesturesEnabled` | `boolean` | `true` | Enable rotate gestures |
| `tiltGesturesEnabled` | `boolean` | `true` | Enable tilt gestures |

### Zoom Controls

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxZoom` | `number` | `20` | Maximum zoom level (3-20) |
| `minZoom` | `number` | `3` | Minimum zoom level (3-20) |

### Layer Display

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `trafficEnabled` | `boolean` | `false` | Show traffic layer |
| `buildingsEnabled` | `boolean` | `true` | Show 3D buildings |
| `indoorViewEnabled` | `boolean` | `false` | Show indoor maps |

### Event Callbacks

| Event | Parameters | Description |
|-------|------------|-------------|
| `onMapPress` | `(event: LatLng) => void` | Map press event |
| `onMapLongPress` | `(event: LatLng) => void` | Map long press event |
| `onLoad` | `() => void` | Map load complete event |

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
  
  // Circle operations
  addCircle(id: string, props: CircleProps): Promise<void>;
  removeCircle(id: string): Promise<void>;
  updateCircle(id: string, props: Partial<CircleProps>): Promise<void>;
  
  // Marker operations
  addMarker(id: string, props: MarkerProps): Promise<void>;
  removeMarker(id: string): Promise<void>;
  updateMarker(id: string, props: Partial<MarkerProps>): Promise<void>;
  
  // Polyline operations
  addPolyline(id: string, props: PolylineProps): Promise<void>;
  removePolyline(id: string): Promise<void>;
  updatePolyline(id: string, props: Partial<PolylineProps>): Promise<void>;
  
  // Polygon operations
  addPolygon(id: string, props: PolygonProps): Promise<void>;
  removePolygon(id: string): Promise<void>;
  updatePolygon(id: string, props: Partial<PolygonProps>): Promise<void>;
}
```

## Location API

> ⚠️ **Permission Required**: All location APIs require location permission
>
> Call `checkLocationPermission()` and `requestLocationPermission()` before use
>
> Details: [INITIALIZATION.md](./INITIALIZATION.md)

### Location Control

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `initSDK` | `{androidKey, iosKey}` | `void` | Initialize SDK |
| `start` | - | `void` | Start continuous location |
| `stop` | - | `void` | Stop location |
| `isStarted` | - | `Promise<boolean>` | Check if locating |
| `getCurrentLocation` | - | `Promise<Location>` | Get current location |

### Location Configuration

#### configure() Unified Configuration

```tsx
import { configure } from 'expo-gaode-map';

configure({
  withReGeocode: true,
  mode: 0,
  interval: 2000,
  // ... more options
});
```

#### Individual Configuration Methods

> **Platform Support**: Some configuration methods are platform-specific, others will be silently ignored

##### Common Configuration (All Platforms)

| Method | Parameters | Description |
|--------|------------|-------------|
| `setLocatingWithReGeocode` | `boolean` | Return reverse geocoding info |
| `setInterval` | `number` | Location interval (ms) / distance filter (m) |
| `setGeoLanguage` | `string` | Reverse geocoding language |

##### Android-Specific Configuration

| Method | Parameters | Description |
|--------|------------|-------------|
| `setLocationMode` | `0 \| 1 \| 2` | Location mode (0: High accuracy, 1: Battery saving, 2: Device only) |
| `setOnceLocation` | `boolean` | Single location |
| `setSensorEnable` | `boolean` | Use device sensors |
| `setWifiScan` | `boolean` | Allow WiFi scanning |
| `setGpsFirst` | `boolean` | GPS priority |
| `setOnceLocationLatest` | `boolean` | Wait for WiFi list refresh |
| `setLocationCacheEnable` | `boolean` | Use cache strategy |
| `setHttpTimeOut` | `number` | Network request timeout (ms) |

##### iOS-Specific Configuration

| Method | Parameters | Description |
|--------|------------|-------------|
| `setLocationTimeout` | `number` | Location timeout (seconds, default 2s) |
| `setReGeocodeTimeout` | `number` | Reverse geocoding timeout (seconds, default 2s) |
| `setDesiredAccuracy` | `number` | Desired accuracy (0-5, default 3: 100m accuracy) |
| `setDistanceFilter` | `number` | Distance filter (meters, default 10m) |
| `setPausesLocationUpdatesAutomatically` | `boolean` | Auto pause location updates (default false) |

**iOS Default Location Configuration:**

Based on AMap official recommendations, this library uses the following default configuration for fast location:
- **Accuracy**: `kCLLocationAccuracyHundredMeters` (100m accuracy, level 3)
- **Location Timeout**: 2 seconds
- **Reverse Geocoding Timeout**: 2 seconds
- **Distance Filter**: 10 meters

> **Accuracy Notes**:
> - **100m Accuracy** (Recommended): Get results in 2-3 seconds, suitable for most scenarios
> - **High Accuracy**: Use `setDesiredAccuracy(1)` to switch to `kCLLocationAccuracyBest`, requires `setLocationTimeout(10)` and `setReGeocodeTimeout(10)`, takes ~10 seconds for 10m accuracy
> - Apple's initial location result is coarse, high accuracy requires more time

**Accuracy Level Reference:**

| Level | Constant | Description | Recommended Timeout |
|-------|----------|-------------|---------------------|
| 0 | `kCLLocationAccuracyBestForNavigation` | Best for navigation | 10s |
| 1 | `kCLLocationAccuracyBest` | Best accuracy (~10m) | 10s |
| 2 | `kCLLocationAccuracyNearestTenMeters` | 10m accuracy | 5s |
| 3 | `kCLLocationAccuracyHundredMeters` | 100m accuracy (default) | 2-3s |
| 4 | `kCLLocationAccuracyKilometer` | 1km accuracy | 1s |
| 5 | `kCLLocationAccuracyThreeKilometers` | 3km accuracy | 1s |

##### Background Location Configuration (All Platforms)

| Method | Parameters | Description |
|--------|------------|-------------|
| `setAllowsBackgroundLocationUpdates` | `boolean` | Allow background location |

> **Background Location Notes**:
> - **iOS**: Requires `NSLocationAlwaysAndWhenInUseUsageDescription` and `UIBackgroundModes` (including `location`) in Info.plist
> - **Android**: Automatically starts foreground service, requires `ACCESS_BACKGROUND_LOCATION` permission (Android 10+)
> - Background location increases battery consumption, use with caution

### Heading Updates (iOS)

| Method | Description |
|--------|-------------|
| `startUpdatingHeading` | Start heading updates |
| `stopUpdatingHeading` | Stop heading updates |

### Coordinate Conversion

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `coordinateConvert` | `coordinate, type` | `Promise<LatLng>` | Convert to AMap coordinates |

## Overlay Components

> **Event Callback Note**: Event callbacks (e.g., `onPress`) for all overlays only work in **declarative usage**. Overlays added via imperative APIs (e.g., `addCircle`, `addMarker`) cannot trigger these events.

### Circle

#### Properties

| Property | Type | Platform | Default | Description |
|----------|------|----------|---------|-------------|
| `center` | `LatLng` | All | - | Circle center (required) |
| `radius` | `number` | All | - | Radius (meters) |
| `fillColor` | `string` | All | - | Fill color (ARGB format: `#AARRGGBB`) |
| `strokeColor` | `string` | All | - | Stroke color (ARGB format: `#AARRGGBB`) |
| `strokeWidth` | `number` | All | `1` | Stroke width (pt/dp) |

#### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onPress` | `() => void` | Circle press |

### Polyline

#### Properties

| Property | Type | Platform | Default | Description |
|----------|------|----------|---------|-------------|
| `points` | `LatLng[]` | All | - | Polyline points (required) |
| `width` | `number` | All | `5` | Line width (pt/dp) |
| `color` | `string` | All | - | Line color (ARGB format: `#AARRGGBB`) |
| `texture` | `string` | All | - | Texture image URL |
| `dotted` | `boolean` | Android only | `false` | Draw dashed line |
| `geodesic` | `boolean` | Android only | `false` | Draw geodesic line |
| `zIndex` | `number` | All | `0` | Z-index |

#### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onPress` | `() => void` | Polyline press |

> **Texture Notes**:
> - Supports network images (http/https) and local files (use `Image.resolveAssetSource()`)
> - Texture tiles along the polyline direction
> - Recommend larger `width` values (e.g., 20) for better texture display
> - **Segment Texture Limitation**: Single Polyline can only have one texture. For different textures on segments, create multiple Polyline components

### Polygon

#### Properties

| Property | Type | Platform | Default | Description |
|----------|------|----------|---------|-------------|
| `points` | `LatLng[]` | All | - | Polygon vertices (required) |
| `fillColor` | `string` | All | - | Fill color (ARGB format: `#AARRGGBB`) |
| `strokeColor` | `string` | All | - | Stroke color (ARGB format: `#AARRGGBB`) |
| `strokeWidth` | `number` | All | `1` | Stroke width (pt/dp) |

#### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onPress` | `() => void` | Polygon press |

### Marker

#### Properties

| Property | Type | Platform | Default | Description |
|----------|------|----------|---------|-------------|
| `position` | `LatLng` | All | - | Marker position (required) |
| `title` | `string` | All | - | Title |
| `snippet` | `string` | All | - | Description |
| `draggable` | `boolean` | All | `false` | Draggable |
| `icon` | `string \| ImageSourcePropType` | All | - | Custom icon |
| `iconWidth` | `number` | All | `40` | Icon width (pt/dp), only for `icon` property |
| `iconHeight` | `number` | All | `40` | Icon height (pt/dp), only for `icon` property |
| `customViewWidth` | `number` | All | `80` | Custom view width (pt/dp), only for `children` property |
| `customViewHeight` | `number` | All | `30` | Custom view height (pt/dp), only for `children` property |
| `opacity` | `number` | Android only | `1.0` | Opacity [0, 1] |
| `flat` | `boolean` | Android only | `false` | Flat on map |
| `zIndex` | `number` | Android only | `0` | Z-index |
| `anchor` | `Point` | Android only | `{x: 0.5, y: 1.0}` | Anchor ratio |
| `centerOffset` | `Point` | iOS only | - | Center offset |
| `animatesDrop` | `boolean` | iOS only | `false` | Drop animation |
| `pinColor` | `'red' \| 'green' \| 'purple'` | iOS only | `'red'` | Pin color |

#### Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `onPress` | `() => void` | Marker press |
| `onDragStart` | `() => void` | Drag start |
| `onDrag` | `() => void` | Dragging |
| `onDragEnd` | `(event: { nativeEvent: LatLng }) => void` | Drag end |

> **⚠️ Important**: Event callbacks only work in **declarative usage**. Markers added via imperative API (`addMarker`) cannot trigger these events.

#### Usage Notes

**Custom Icon (icon property):**
- **Icon Format**: Supports network images (http/https), local files (use `Image.resolveAssetSource()`)
- **Size Control**: Use `iconWidth` and `iconHeight` to control icon size
- **Size Unit**: Uses points (pt/dp), auto-scales on different density screens
- **Anchor**: `anchor` defines icon position relative to coordinate, `{x: 0.5, y: 1.0}` means bottom-center aligned

**Custom View (children property):**
- **Size Control**: Use `customViewWidth` and `customViewHeight` to control custom view size
- **Default Size**: 80x30 pt/dp
- **Important**: `iconWidth/iconHeight` only apply to `icon` property, not `children`
- Recommend explicitly setting size to ensure consistent display across devices

## Type Definitions

### MapType

```typescript
enum MapType {
  NORMAL = 0,      // Normal map
  SATELLITE = 1,   // Satellite map
  NIGHT = 2,       // Night map
  NAVI = 3,        // Navigation map
  BUS = 4,         // Bus map
}
```

### CameraPosition

```typescript
interface CameraPosition {
  target: LatLng;    // Target position
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

### Location

```typescript
interface Location {
  // Basic location info
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  bearing: number;
  speed: number;
  
  // Address info (requires reverse geocoding)
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  streetNumber?: string;
  country?: string;
  cityCode?: string;
  adCode?: string;
  poiName?: string;
  aoiName?: string;
  
  // Other info
  provider?: string;
  timestamp?: number;
}