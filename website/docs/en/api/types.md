# Type Definitions

expo-gaode-map provides complete TypeScript type definitions.

## Common Types

### LatLng
Geographic coordinate

```typescript
interface LatLng {
  latitude: number;  // Latitude
  longitude: number; // Longitude
}
```

### Point
Screen coordinate point

```typescript
interface Point {
  x: number;
  y: number;
}
```

### CameraPosition
Map camera position

```typescript
interface CameraPosition {
  target?: LatLng;   // Center coordinate
  zoom?: number;     // Zoom level (3-20)
  bearing?: number;  // Rotation angle (0-360 degrees)
  tilt?: number;     // Tilt angle (0-60 degrees)
}
```

### LatLngBounds
Rectangle coordinate bounds

```typescript
interface LatLngBounds {
  southwest: LatLng; // Southwest coordinate
  northeast: LatLng; // Northeast coordinate
}
```

### MapPoi
Map point of interest (POI)

```typescript
interface MapPoi {
  id: string;        // POI ID
  name: string;      // POI name
  position: LatLng;  // POI coordinate
}
```

### MapType
Map type enum

```typescript
enum MapType {
  Standard = 0,   // Standard map
  Satellite = 1,  // Satellite map
  Night = 2,      // Night map
  Navi = 3,       // Navigation map
  Bus = 4,        // Bus map (Android only)
}
```

### ColorValue
Color value type

```typescript
type ColorValue = string | number;
// Supports:
// - Hex string: '#AARRGGBB' or '#RRGGBB'
// - Number format: 0xAARRGGBB
```

## Map View Types

### MapViewProps
Map view properties, see [MapView Props](/en/api/mapview)

### MapViewRef
Map view reference methods

```typescript
interface MapViewRef {
  moveCamera(position: CameraPosition, duration?: number): Promise<void>;
  getLatLng(point: Point): Promise<LatLng>;
  setCenter(center: LatLng, animated?: boolean): Promise<void>;
  setZoom(zoom: number, animated?: boolean): Promise<void>;
  getCameraPosition(): Promise<CameraPosition>;
}
```

## Location Types

### Coordinates
Basic coordinate information

```typescript
interface Coordinates extends LatLng {
  altitude: number;   // Altitude (meters)
  accuracy: number;   // Horizontal accuracy (meters)
  heading: number;    // Direction (degrees)
  speed: number;      // Speed (m/s)
  timestamp: number;  // Timestamp
  address?: string;   // Formatted address (with reverse geocoding)
}
```

### ReGeocode
Reverse geocoding information

```typescript
interface ReGeocode extends Coordinates {
  address: string;      // Formatted address
  country: string;      // Country
  province: string;     // Province
  city: string;         // City
  district: string;     // District
  cityCode: string;     // City code
  adCode: string;       // Area code
  street: string;       // Street
  streetNumber: string; // Street number
  poiName: string;      // POI name
  aoiName: string;      // AOI name
}
```

### LocationOptions
Location configuration options

```typescript
interface LocationOptions {
  withReGeocode?: boolean;                    // Return reverse geocoding
  accuracy?: LocationAccuracy;                // Accuracy (iOS)
  mode?: LocationMode;                        // Mode (Android)
  onceLocation?: boolean;                     // Single location (Android)
  interval?: number;                          // Interval (ms, Android)
  timeout?: number;                           // Timeout (s, iOS)
  distanceFilter?: number;                    // Min update distance (m, iOS)
  geoLanguage?: GeoLanguage;                  // Reverse geocoding language
  allowsBackgroundLocationUpdates?: boolean;  // Background location
  // ... more options
}
```

### LocationAccuracy
Location accuracy enum (iOS)

```typescript
enum LocationAccuracy {
  BestForNavigation = 0,  // Best for navigation
  Best = 1,               // Best accuracy (~10m)
  NearestTenMeters = 2,   // 10m accuracy
  HundredMeters = 3,      // 100m accuracy (recommended)
  Kilometer = 4,          // 1km accuracy
  ThreeKilometers = 5,    // 3km accuracy
}
```

### LocationMode
Location mode enum (Android)

```typescript
enum LocationMode {
  HighAccuracy = 1,    // High accuracy (network + GPS)
  BatterySaving = 2,   // Battery saving (network only)
  DeviceSensors = 3,   // Device sensors (GPS only)
}
```

### CoordinateType
Coordinate system type enum

```typescript
enum CoordinateType {
  AMap = -1,     // AMap coordinate system
  Baidu = 0,     // Baidu coordinate system
  MapBar = 1,    // MapBar coordinate system
  MapABC = 2,    // MapABC coordinate system
  SoSoMap = 3,   // SoSo Map coordinate system
  AliYun = 4,    // AliYun coordinate system
  Google = 5,    // Google coordinate system
  GPS = 6,       // GPS coordinate system
}
```

## Overlay Types

### MarkerProps
Marker properties

```typescript
interface MarkerProps {
  position: LatLng;                          // Coordinate
  icon?: string | ImageSourcePropType;       // Icon
  iconWidth?: number;                        // Icon width (pixels)
  iconHeight?: number;                       // Icon height (pixels)
  title?: string;                            // Title
  snippet?: string;                          // Description
  draggable?: boolean;                       // Draggable
  opacity?: number;                          // Opacity [0, 1] (Android)
  zIndex?: number;                           // Z-index (Android)
  children?: React.ReactNode;                // Custom view
  customViewWidth?: number;                  // Custom view width
  customViewHeight?: number;                 // Custom view height
  onMarkerPress?: (event: NativeSyntheticEvent<LatLng>) => void;
  onMarkerDragEnd?: (event: NativeSyntheticEvent<LatLng>) => void;
}
```

### PolylineProps
Polyline properties

```typescript
interface PolylineProps {
  points: LatLng[];          // Coordinate array
  strokeWidth?: number;      // Line width
  strokeColor?: ColorValue;  // Line color
  colors?: ColorValue[];     // Segment colors
  gradient?: boolean;        // Use gradient (Android)
  geodesic?: boolean;        // Geodesic line (Android)
  dotted?: boolean;          // Dotted line (Android)
  texture?: string;          // Texture image
  zIndex?: number;           // Z-index
  onPolylinePress?: (event: NativeSyntheticEvent<{}>) => void;
}
```

### PolygonProps
Polygon properties

```typescript
interface PolygonProps {
  points: LatLng[];          // Vertex array
  strokeWidth?: number;      // Stroke width
  strokeColor?: ColorValue;  // Stroke color
  fillColor?: ColorValue;    // Fill color
  zIndex?: number;           // Z-index
  onPolygonPress?: (event: NativeSyntheticEvent<{}>) => void;
}
```

### CircleProps
Circle properties

```typescript
interface CircleProps {
  center: LatLng;            // Center coordinate
  radius: number;            // Radius (meters)
  strokeWidth?: number;      // Stroke width
  strokeColor?: ColorValue;  // Stroke color
  fillColor?: ColorValue;    // Fill color
  zIndex?: number;           // Z-index
  onCirclePress?: (event: NativeSyntheticEvent<{}>) => void;
}
```

### HeatMapProps
Heat Map Properties

```typescript
interface HeatMapPoint {
  latitude: number;
  longitude: number;
  count: number; // Weight
}

interface HeatMapProps {
  data: HeatMapPoint[];    // Heat map data
  radius?: number;         // Heat radius (meters)
  opacity?: number;        // Opacity [0, 1]
  gradient?: {             // Gradient config
    colors: string[];      // Colors array
    startPoints: number[]; // Start points array [0-1]
  };
}
```

### MultiPointProps
MassPoint Properties

```typescript
interface MultiPointItem {
  latitude: number;
  longitude: number;
  title?: string;
  subtitle?: string;
  [key: string]: any;
}

interface MultiPointProps {
  points: MultiPointItem[];    // Points list
  icon?: string;               // Icon URI
  iconWidth?: number;          // Icon width
  iconHeight?: number;         // Icon height
  onMultiPointPress?: (event: NativeSyntheticEvent<{
    index: number;
  }>) => void;
}
```

### ClusterProps
Cluster Properties

```typescript
interface ClusterPoint {
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface ClusterStyle extends ViewStyle {
  width?: number;
  height?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

interface ClusterBucket {
  minPoints: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

interface ClusterProps {
  points: ClusterPoint[];      // Point list
  radius?: number;             // Cluster radius
  minClusterSize?: number;     // Min cluster size
  clusterStyle?: ClusterStyle; // Base cluster style
  clusterTextStyle?: TextStyle;// Cluster text style
  clusterBuckets?: ClusterBucket[]; // Tiered style
  onClusterPress?: (event: NativeSyntheticEvent<{
    count: number;
    pois: ClusterPoint[];
  }>) => void;
}
```

## Native Module Types

### ExpoGaodeMapModule

The native module instance type that defines all available native methods.
It corresponds to `src/types/native-module.types.ts` and is exported from the
package entry.

```typescript
interface ExpoGaodeMapModule extends NativeModule<ExpoGaodeMapModuleEvents> {
  addListener(
    eventName: keyof ExpoGaodeMapModuleEvents | string,
    listener: (...args: any[]) => void,
  ): { remove: () => void };



  initSDK(config: SDKConfig): void;

  setLoadWorldVectorMap(enabled: boolean): void;

  getVersion(): string;

  start(): void;

  stop(): void;

  isStarted(): Promise<boolean>;

  getCurrentLocation(): Promise<Coordinates | ReGeocode>;

  coordinateConvert(coordinate: LatLng, type: CoordinateType): Promise<LatLng>;

  setLocatingWithReGeocode(isReGeocode: boolean): void;

  setLocationMode(mode: LocationMode): void;

  setInterval(interval: number): void;

  setOnceLocation(isOnceLocation: boolean): void;

  setSensorEnable(sensorEnable: boolean): void;

  setWifiScan(wifiScan: boolean): void;

  setGpsFirst(gpsFirst: boolean): void;

  setOnceLocationLatest(onceLocationLatest: boolean): void;

  setGeoLanguage(language: string): void;

  setLocationCacheEnable(locationCacheEnable: boolean): void;

  setHttpTimeOut(httpTimeOut: number): void;

  setDesiredAccuracy(accuracy: LocationAccuracy): void;

  setLocationTimeout(timeout: number): void;

  setReGeocodeTimeout(timeout: number): void;

  setDistanceFilter(distance: number): void;

  setPausesLocationUpdatesAutomatically(pauses: boolean): void;

  setAllowsBackgroundLocationUpdates(allows: boolean): void;

  isBackgroundLocationEnabled: boolean;

  setLocationProtocol(protocol: string): void;

  startUpdatingHeading(): void;

  stopUpdatingHeading(): void;

  checkLocationPermission(): Promise<PermissionStatus>;

  requestLocationPermission(): Promise<PermissionStatus>;

  requestBackgroundLocationPermission(): Promise<PermissionStatus>;

  openAppSettings(): void;

  isNativeSDKConfigured(): boolean;

  addLocationListener(listener: LocationListener): { remove: () => void };

  distanceBetweenCoordinates(coordinate1: LatLng, coordinate2: LatLng): number;

  isPointInCircle(point: LatLng, center: LatLng, radius: number): boolean;

  isPointInPolygon(point: LatLng, polygon: LatLng[] | LatLng[][]): boolean;

  calculatePolygonArea(polygon: LatLng[] | LatLng[][]): number;

  calculateRectangleArea(southWest: LatLng, northEast: LatLng): number;

  calculateCentroid(polygon: LatLng[] | LatLng[][]): LatLng | null;

  encodeGeoHash(coordinate: LatLng, precision: number): string;

  simplifyPolyline(points: LatLng[], tolerance: number): LatLng[];

  calculatePathLength(points: LatLng[]): number;

  getNearestPointOnPath(path: LatLng[], target: LatLng): {
    latitude: number;
    longitude: number;
    index: number;
    distanceMeters: number;
  } | null;

  getPointAtDistance(points: LatLng[], distance: number): {
    latitude: number;
    longitude: number;
    angle: number;
  } | null;
}
```

## Usage Examples

### Import Types

```typescript
import type {
  LatLng,
  CameraPosition,
  MapViewRef,
  LocationOptions,
  MarkerProps,
} from 'expo-gaode-map';

import {
  MapType,
  LocationAccuracy,
  CoordinateType,
} from 'expo-gaode-map';
```

### Use MapViewRef

```typescript
import { useRef } from 'react';
import { MapView } from 'expo-gaode-map';
import type { MapViewRef, LatLng } from 'expo-gaode-map';

function MyMap() {
  const mapRef = useRef<MapViewRef>(null);
  
  const moveToLocation = (location: LatLng) => {
    mapRef.current?.setCenter(location, true);
  };
  
  return <MapView ref={mapRef} style={{ flex: 1 }} />;
}
```

### Type-Safe Location Config

```typescript
import type { LocationOptions } from 'expo-gaode-map';
import { LocationAccuracy, LocationMode } from 'expo-gaode-map';

const locationOptions: LocationOptions = {
  withReGeocode: true,
  accuracy: LocationAccuracy.HundredMeters,
  mode: LocationMode.HighAccuracy,
  interval: 2000,
};
```

## Related Documentation

- [MapView API](/en/api/mapview)
- [Location API](/en/api/location)
- [Overlays API](/en/api/overlays)
