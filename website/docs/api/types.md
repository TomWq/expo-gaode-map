# 类型定义

`expo-gaode-map` 提供了完整的 TypeScript 类型定义。这里整理最常用、最容易查阅的核心类型，完整导出请以 `packages/core/src/types` 为准。

## 通用类型

### `LatLng`

```ts
interface LatLng {
  latitude: number;
  longitude: number;
}
```

### `LatLngPoint`

覆盖物和定位相关 API 普遍支持这两种坐标输入：

```ts
type LatLngPoint = LatLng | [number, number] | number[];
```

### `Point`

```ts
interface Point {
  x: number;
  y: number;
}
```

### `CameraPosition`

```ts
interface CameraPosition {
  target?: LatLng;
  zoom?: number;
  bearing?: number;
  tilt?: number;
}
```

### `CameraUpdate`

```ts
interface CameraUpdate {
  target?: LatLng;
  zoom?: number;
  bearing?: number;
  tilt?: number;
}
```

### `LatLngBounds`

```ts
interface LatLngBounds {
  southwest: LatLng;
  northeast: LatLng;
}
```

### `MapPoi`

```ts
interface MapPoi {
  id: string;
  name: string;
  position: LatLng;
}
```

### `MapType`

```ts
enum MapType {
  Standard = 0,
  Satellite = 1,
  Night = 2,
  Navi = 3,
  Bus = 4, // Android
}
```

### `ColorValue`

```ts
type ColorValue = string | number;
```

### `SDKConfig`

```ts
interface SDKConfig {
  androidKey?: string;
  iosKey?: string;
  webKey?: string;
}
```

### `PrivacyStatus`

```ts
interface PrivacyStatus {
  hasShow: boolean;
  hasContainsPrivacy: boolean;
  hasAgree: boolean;
  isReady: boolean;
  privacyVersion?: string | null;
  agreedPrivacyVersion?: string | null;
  restoredFromStorage?: boolean;
}
```

## 地图类型

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

### `MapViewRef`

```ts
interface MapViewRef {
  moveCamera(position: CameraUpdate, duration?: number): Promise<void>;
  getLatLng(point: Point): Promise<LatLng>;
  setCenter(center: LatLngPoint, animated?: boolean): Promise<void>;
  setZoom(zoom: number, animated?: boolean): Promise<void>;
  getCameraPosition(): Promise<CameraPosition>;
  takeSnapshot(): Promise<string>;
}
```

### `MapViewProps`

常用字段如下，更完整说明见 `/api/mapview`：

```ts
interface MapViewProps {
  mapType?: MapType;
  initialCameraPosition?: CameraPosition;
  myLocationEnabled?: boolean;
  followUserLocation?: boolean;
  indoorViewEnabled?: boolean;
  buildingsEnabled?: boolean;
  labelsEnabled?: boolean;
  compassEnabled?: boolean;
  zoomControlsEnabled?: boolean;
  scaleControlsEnabled?: boolean;
  myLocationButtonEnabled?: boolean;
  trafficEnabled?: boolean;
  maxZoom?: number;
  minZoom?: number;
  zoomGesturesEnabled?: boolean;
  scrollGesturesEnabled?: boolean;
  rotateGesturesEnabled?: boolean;
  tiltGesturesEnabled?: boolean;
  distanceFilter?: number;
  headingFilter?: number;
  worldMapSwitchEnabled?: boolean;
  customMapStyle?: {
    styleId?: string;
    styleDataPath?: string;
    extraStyleDataPath?: string;
  };
   cameraEventThrottleMs?: number;
  onMapPress?: (event: NativeSyntheticEvent<LatLng>) => void;
  onPressPoi?: (event: NativeSyntheticEvent<MapPoi>) => void;
  onMapLongPress?: (event: NativeSyntheticEvent<LatLng>) => void;
  onCameraMove?: (event: NativeSyntheticEvent<CameraEvent>) => void;
  onCameraIdle?: (event: NativeSyntheticEvent<CameraEvent>) => void;
  onLoad?: (event: NativeSyntheticEvent<{}>) => void;
  onLocation?: (event: NativeSyntheticEvent<LocationEvent>) => void;
}
```

## 定位类型

### `Coordinates`

```ts
interface Coordinates extends LatLng {
  altitude: number;
  accuracy: number;
  heading: number;
  speed: number;
  timestamp: number;
  isAvailableCoordinate?: boolean;
  address?: string;
}
```

### `ReGeocode`

```ts
interface ReGeocode extends Coordinates {
  address: string;
  country: string;
  province: string;
  city: string;
  district: string;
  cityCode: string;
  adCode: string;
  street: string;
  streetNumber: string;
  poiName: string;
  aoiName: string;
  description?: string;
  coordType?: 'GCJ02' | 'WGS84';
  buildingId?: string;
}
```

### `LocationAccuracy`

```ts
enum LocationAccuracy {
  BestForNavigation = 0,
  Best = 1,
  NearestTenMeters = 2,
  HundredMeters = 3,
  Kilometer = 4,
  ThreeKilometers = 5,
}
```

### `LocationMode`

```ts
enum LocationMode {
  HighAccuracy = 1,
  BatterySaving = 2,
  DeviceSensors = 3,
}
```

### `CoordinateType`

```ts
enum CoordinateType {
  AMap = -1,
  Baidu = 0,
  MapBar = 1,
  MapABC = 2,
  SoSoMap = 3,
  AliYun = 4,
  Google = 5,
  GPS = 6,
}
```

### `GeoLanguage` / `LocationProtocol`

```ts
type GeoLanguage = 'DEFAULT' | 'EN' | 'ZH';
type LocationProtocol = 'HTTP' | 'HTTPS';
```

### `PermissionStatus`

```ts
interface PermissionStatus {
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined';
  fineLocation?: boolean;
  coarseLocation?: boolean;
  backgroundLocation?: boolean;
  shouldShowRationale?: boolean;
  isPermanentlyDenied?: boolean;
  isAndroid14Plus?: boolean;
  message?: string;
}
```

## 覆盖物类型

### `MarkerProps`

```ts
interface MarkerProps {
  position: LatLngPoint;
  icon?: string | ImageSourcePropType;
  iconWidth?: number;
  iconHeight?: number;
  title?: string;
  snippet?: string;
  opacity?: number;
  draggable?: boolean;
  flat?: boolean;
  zIndex?: number;
  anchor?: Point;
  centerOffset?: Point;
  animatesDrop?: boolean;
  pinColor?: 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet' | 'magenta' | 'rose' | 'purple';
  children?: React.ReactNode;
  customViewWidth?: number;
  customViewHeight?: number;
  cacheKey?: string;
  growAnimation?: boolean;
  smoothMovePath?: LatLng[];
  smoothMoveDuration?: number;
  onMarkerPress?: (event: NativeSyntheticEvent<LatLng>) => void;
  onMarkerDragStart?: (event: NativeSyntheticEvent<LatLng>) => void;
  onMarkerDrag?: (event: NativeSyntheticEvent<LatLng>) => void;
  onMarkerDragEnd?: (event: NativeSyntheticEvent<LatLng>) => void;
}
```

### `PolylineProps`

```ts
interface PolylineProps {
  points: LatLngPoint[];
  strokeWidth?: number;
  strokeColor?: ColorValue;
  zIndex?: number;
  colors?: ColorValue[];
  gradient?: boolean;
  geodesic?: boolean;
  simplificationTolerance?: number;
  dotted?: boolean;
  texture?: string;
  onPolylinePress?: (event: NativeSyntheticEvent<{}>) => void;
}
```

### `PolygonProps`

```ts
interface PolygonProps {
  points: LatLngPoint[] | LatLngPoint[][];
  strokeWidth?: number;
  strokeColor?: ColorValue;
  fillColor?: ColorValue;
  zIndex?: number;
  simplificationTolerance?: number;
  onPolygonPress?: (event: NativeSyntheticEvent<{}>) => void;
  onPolygonSimplified?: (
    event: NativeSyntheticEvent<{
      originalCount: number;
      simplifiedCount: number;
    }>
  ) => void;
}
```

### `CircleProps`

```ts
interface CircleProps {
  center: LatLngPoint;
  radius: number;
  strokeWidth?: number;
  strokeColor?: ColorValue;
  fillColor?: ColorValue;
  zIndex?: number;
  onCirclePress?: (event: NativeSyntheticEvent<{}>) => void;
}
```

### `HeatMapProps`

```ts
interface HeatMapGradient {
  colors: ColorValue[];
  startPoints: number[];
}

interface HeatMapProps {
  data: LatLngPoint[];
  visible?: boolean;
  radius?: number;
  opacity?: number;
  gradient?: HeatMapGradient;
  allowRetinaAdapting?: boolean;
}
```

### `MultiPointProps`

```ts
interface MultiPointItem {
  latitude: number;
  longitude: number;
  id?: string | number;
  data?: unknown;
}

interface MultiPointProps {
  points: MultiPointItem[];
  icon?: string | ImageSourcePropType;
  iconWidth?: number;
  iconHeight?: number;
  onMultiPointPress?: (
    event: NativeSyntheticEvent<{
      index: number;
      item: MultiPointItem;
    }>
  ) => void;
}
```

### `ClusterProps`

```ts
interface ClusterPoint {
  latitude?: number;
  longitude?: number;
  position?: LatLngPoint;
  properties?: Record<string, unknown>;
}

interface ClusterParams {
  count: number;
  latitude: number;
  longitude: number;
  pois?: ClusterPoint[];
  id?: number;
  position?: LatLng;
}

interface ClusterProps {
  icon?: string;
  radius?: number;
  minClusterSize?: number;
  clusterStyle?: ViewStyle;
  clusterBuckets?: ({ minPoints: number } & ViewStyle)[];
  clusterTextStyle?: TextStyle;
  points: ClusterPoint[];
  renderMarker?: (item: ClusterPoint) => React.ReactNode; // 暂未实现
  renderCluster?: (params: ClusterParams) => React.ReactNode; // 暂未实现
  onClusterPress?: (event: NativeSyntheticEvent<ClusterParams>) => void;
}
```

## 模块事件类型

```ts
type ExpoGaodeMapModuleEvents = {
  onLocationUpdate: (location: Coordinates | ReGeocode) => void;
  onHeadingUpdate: (heading: {
    magneticHeading: number;
    trueHeading: number;
    headingAccuracy: number;
    x: number;
    y: number;
    z: number;
    timestamp: number;
  }) => void;
};
```

## 导入示例

```ts
import type {
  CameraPosition,
  Coordinates,
  LatLng,
  MapViewRef,
  MarkerProps,
  PermissionStatus,
  PolygonProps,
  ReGeocode,
} from 'expo-gaode-map';
```
