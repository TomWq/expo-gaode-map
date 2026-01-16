# 类型定义

expo-gaode-map 提供了完整的 TypeScript 类型定义。

## 通用类型

### LatLng
地理坐标

```typescript
interface LatLng {
  latitude: number;  // 纬度
  longitude: number; // 经度
}
```

### Point
屏幕坐标点

```typescript
interface Point {
  x: number;
  y: number;
}
```

### CameraPosition
地图相机位置

```typescript
interface CameraPosition {
  target?: LatLng;   // 中心坐标
  zoom?: number;     // 缩放级别（3-20）
  bearing?: number;  // 朝向、旋转角度（0-360度）
  tilt?: number;     // 倾斜角度（0-60度）
}
```

### LatLngBounds
矩形坐标边界

```typescript
interface LatLngBounds {
  southwest: LatLng; // 西南坐标
  northeast: LatLng; // 东北坐标
}
```

### MapPoi
地图标注点（POI）

```typescript
interface MapPoi {
  id: string;        // 标注点 ID
  name: string;      // 标注点名称
  position: LatLng;  // 标注点坐标
}
```

### MapType
地图类型枚举

```typescript
enum MapType {
  Standard = 0,   // 标准地图
  Satellite = 1,  // 卫星地图
  Night = 2,      // 夜间地图
  Navi = 3,       // 导航地图
  Bus = 4,        // 公交地图（仅 Android）
}
```

### ColorValue
颜色值类型

```typescript
type ColorValue = string | number;
// 支持：
// - 十六进制字符串: '#AARRGGBB' 或 '#RRGGBB'
// - 数字格式: 0xAARRGGBB
```

## 地图视图类型

### MapViewProps
地图视图属性，详见 [MapView Props](/api/mapview)

### MapViewRef
地图视图引用方法

```typescript
interface MapViewRef {
  moveCamera(position: CameraPosition, duration?: number): Promise<void>;
  getLatLng(point: Point): Promise<LatLng>;
  setCenter(center: LatLng, animated?: boolean): Promise<void>;
  setZoom(zoom: number, animated?: boolean): Promise<void>;
  getCameraPosition(): Promise<CameraPosition>;
}
```

## 定位类型

### Coordinates
基础坐标信息

```typescript
interface Coordinates extends LatLng {
  altitude: number;   // 海拔高度（米）
  accuracy: number;   // 水平精度（米）
  heading: number;    // 移动方向（度）
  speed: number;      // 移动速度（米/秒）
  timestamp: number;  // 时间戳
  address?: string;   // 格式化地址（启用逆地理编码时）
}
```

### ReGeocode
逆地理编码信息

```typescript
interface ReGeocode extends Coordinates {
  address: string;      // 格式化地址
  country: string;      // 国家
  province: string;     // 省/直辖市
  city: string;         // 市
  district: string;     // 区
  cityCode: string;     // 城市编码
  adCode: string;       // 区域编码
  street: string;       // 街道名称
  streetNumber: string; // 门牌号
  poiName: string;      // 兴趣点名称
  aoiName: string;      // 所属兴趣点名称
}
```

### LocationOptions
定位配置选项

```typescript
interface LocationOptions {
  withReGeocode?: boolean;                    // 是否返回逆地理信息
  accuracy?: LocationAccuracy;                // 定位精度（iOS）
  mode?: LocationMode;                        // 定位模式（Android）
  onceLocation?: boolean;                     // 是否单次定位（Android）
  interval?: number;                          // 定位间隔（毫秒，Android）
  timeout?: number;                           // 定位超时（秒，iOS）
  distanceFilter?: number;                    // 最小更新距离（米，iOS）
  geoLanguage?: GeoLanguage;                  // 逆地理语言
  allowsBackgroundLocationUpdates?: boolean;  // 是否允许后台定位
  // ... 更多选项
}
```

### LocationAccuracy
定位精度枚举（iOS）

```typescript
enum LocationAccuracy {
  BestForNavigation = 0,  // 最适合导航
  Best = 1,               // 最高精度（约10米）
  NearestTenMeters = 2,   // 10米精度
  HundredMeters = 3,      // 100米精度（推荐）
  Kilometer = 4,          // 1公里精度
  ThreeKilometers = 5,    // 3公里精度
}
```

### LocationMode
定位模式枚举（Android）

```typescript
enum LocationMode {
  HighAccuracy = 1,    // 高精度模式（网络+卫星）
  BatterySaving = 2,   // 低功耗模式（仅网络）
  DeviceSensors = 3,   // 仅设备模式（仅卫星）
}
```

### CoordinateType
坐标系类型枚举

```typescript
enum CoordinateType {
  AMap = -1,     // 高德坐标系
  Baidu = 0,     // 百度坐标系
  MapBar = 1,    // MapBar坐标系
  MapABC = 2,    // MapABC坐标系
  SoSoMap = 3,   // 搜搜地图坐标系
  AliYun = 4,    // 阿里云坐标系
  Google = 5,    // 谷歌坐标系
  GPS = 6,       // GPS坐标系
}
```

## 覆盖物类型

### MarkerProps
标记点属性

```typescript
interface MarkerProps {
  position: LatLng;              // 坐标
  icon?: string | ImageSourcePropType;  // 图标
  iconWidth?: number;            // 图标宽度（像素）
  iconHeight?: number;           // 图标高度（像素）
  title?: string;                // 标题
  snippet?: string;              // 描述
  draggable?: boolean;           // 是否可拖拽
  opacity?: number;              // 透明度 [0, 1]（Android）
  zIndex?: number;               // 层级（Android）
  children?: React.ReactNode;    // 自定义视图
  customViewWidth?: number;      // 自定义视图宽度
  customViewHeight?: number;     // 自定义视图高度
  onMarkerPress?: (event: NativeSyntheticEvent<LatLng>) => void;
  onMarkerDragEnd?: (event: NativeSyntheticEvent<LatLng>) => void;
}
```

### PolylineProps
折线属性

```typescript
interface PolylineProps {
  points: LatLng[];          // 节点坐标数组
  strokeWidth?: number;      // 线宽
  strokeColor?: ColorValue;  // 线条颜色
  colors?: ColorValue[];     // 分段颜色
  gradient?: boolean;        // 是否使用渐变色（Android）
  geodesic?: boolean;        // 是否绘制大地线（Android）
  dotted?: boolean;          // 是否绘制虚线（Android）
  texture?: string;          // 纹理图片
  zIndex?: number;           // 层级
  onPolylinePress?: (event: NativeSyntheticEvent<{}>) => void;
}
```

### PolygonProps
多边形属性

```typescript
interface PolygonProps {
  points: LatLng[];          // 节点坐标数组
  strokeWidth?: number;      // 边线宽度
  strokeColor?: ColorValue;  // 边线颜色
  fillColor?: ColorValue;    // 填充颜色
  zIndex?: number;           // 层级
  onPolygonPress?: (event: NativeSyntheticEvent<{}>) => void;
}
```

### CircleProps
圆形属性

```typescript
interface CircleProps {
  center: LatLng;            // 圆心坐标
  radius: number;            // 半径（米）
  strokeWidth?: number;      // 边线宽度
  strokeColor?: ColorValue;  // 边线颜色
  fillColor?: ColorValue;    // 填充颜色
  zIndex?: number;           // 层级
  onCirclePress?: (event: NativeSyntheticEvent<{}>) => void;
}
```

### HeatMapProps
热力图属性

```typescript
interface HeatMapPoint {
  latitude: number;
  longitude: number;
  count: number; // 权重
}

interface HeatMapProps {
  data: HeatMapPoint[];    // 热力点数据
  radius?: number;         // 热力半径（米）
  opacity?: number;        // 透明度 [0, 1]
  gradient?: {             // 渐变色配置
    colors: string[];      // 颜色数组
    startPoints: number[]; // 起始点数组 [0-1]
  };
}
```

### MultiPointProps
海量点属性

```typescript
interface MultiPointItem {
  latitude: number;
  longitude: number;
  title?: string;
  subtitle?: string;
  [key: string]: any;
}

interface MultiPointProps {
  points: MultiPointItem[];    // 点集合
  icon?: string;               // 图标 URI
  iconWidth?: number;          // 图标宽度
  iconHeight?: number;         // 图标高度
  onMultiPointPress?: (event: NativeSyntheticEvent<{
    index: number;
  }>) => void;
}
```

### ClusterProps
聚合图层属性

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
  points: ClusterPoint[];      // 坐标点列表
  radius?: number;             // 聚合半径
  minClusterSize?: number;     // 最小聚合数量
  clusterStyle?: ClusterStyle; // 聚合点基础样式
  clusterTextStyle?: TextStyle;// 聚合文字样式
  clusterBuckets?: ClusterBucket[]; // 分级样式
  onClusterPress?: (event: NativeSyntheticEvent<{
    count: number;
    pois: ClusterPoint[];
  }>) => void;
}
```

## 原生模块类型

### ExpoGaodeMapModule

原生模块实例类型，封装了 SDK 初始化、定位控制、权限管理、几何计算等能力。
下面是与源码 `src/types/native-module.types.ts` 对齐的完整接口定义：

```typescript
interface ExpoGaodeMapModule extends NativeModule<ExpoGaodeMapModuleEvents> {
  // 事件监听添加函数
  addListener(
    eventName: keyof ExpoGaodeMapModuleEvents | string,
    listener: (...args: any[]) => void,
  ): { remove: () => void };
  // 更新隐私合规状态(不需要主动调用，已经废弃)
  updatePrivacyCompliance(hasAgreed: boolean): void;
  // 初始化 SDK
  initSDK(config: SDKConfig): void;
  // 设置是否加载世界矢量地图(按需调用，默认不加载)
  setLoadWorldVectorMap(enabled: boolean): void;
  // 获取 SDK 版本号
  getVersion(): string;
  // 启动连续定位服务
  start(): void;
  // 停止连续定位服务
  stop(): void;
  // 查询定位服务是否已启动
  isStarted(): Promise<boolean>;
  // 获取当前定位信息
  getCurrentLocation(): Promise<Coordinates | ReGeocode>;
  // 坐标转换
  coordinateConvert(coordinate: LatLng, type: CoordinateType): Promise<LatLng>;
  // 设置是否返回定位地址信息
  setLocatingWithReGeocode(isReGeocode: boolean): void;
  // 设置定位模式
  setLocationMode(mode: LocationMode): void;
  // 设置定位更新间隔（毫秒）
  setInterval(interval: number): void;
  // 设置是否单次定位
  setOnceLocation(isOnceLocation: boolean): void;
  // 设置是否开启传感器
  setSensorEnable(sensorEnable: boolean): void;
  // 设置是否开启 Wi-Fi 扫描
  setWifiScan(wifiScan: boolean): void;
  // 设置是否优先使用 GPS 定位
  setGpsFirst(gpsFirst: boolean): void;
  // 设置是否返回最新定位信息
  setOnceLocationLatest(onceLocationLatest: boolean): void;
  // 设置定位语言
  setGeoLanguage(language: string): void;
  // 设置是否开启定位缓存
  setLocationCacheEnable(locationCacheEnable: boolean): void;
  // 设置 HTTP 请求超时时间（毫秒）
  setHttpTimeOut(httpTimeOut: number): void;
  // 设置定位精度
  setDesiredAccuracy(accuracy: LocationAccuracy): void;
  // 设置定位超时时间（毫秒）
  setLocationTimeout(timeout: number): void;
  // 设置逆地理编码超时时间（毫秒）
  setReGeocodeTimeout(timeout: number): void;
  // 设置定位距离过滤（米）
  setDistanceFilter(distance: number): void;
  // 设置是否暂停定位更新
  setPausesLocationUpdatesAutomatically(pauses: boolean): void;
  // 设置是否允许后台定位更新
  setAllowsBackgroundLocationUpdates(allows: boolean): void;
  // 查询是否开启后台定位更新
  isBackgroundLocationEnabled: boolean;
  // 设置定位协议（http/https）
  setLocationProtocol(protocol: string): void;
  // 启动定位方向更新
  startUpdatingHeading(): void;
  // 停止定位方向更新
  stopUpdatingHeading(): void;
  // 查询定位权限状态
  checkLocationPermission(): Promise<PermissionStatus>;
  // 请求定位权限
  requestLocationPermission(): Promise<PermissionStatus>;
  // 请求后台定位权限
  requestBackgroundLocationPermission(): Promise<PermissionStatus>;
  // 打开应用设置
  openAppSettings(): void;
  // 启动地图预加载(一般不用主动调用，地图会在需要时自动预加载)
  startMapPreload(config: { poolSize?: number }): void;
  // 获取地图预加载状态(一般不用主动调用)
  getMapPreloadStatus(): {
    poolSize: number;
    isPreloading: boolean;
    maxPoolSize: number;
  };
  // 清除地图预加载池(一般不用主动调用，地图会在需要时自动清除)
  clearMapPreloadPool(): void;
  // 查询是否已预加载地图视图(一般不用主动调用)
  hasPreloadedMapView(): boolean;
  // 查询是否已配置原生 SDK(一般不用主动调用)
  isNativeSDKConfigured(): boolean;
  // 添加定位更新监听器
  addLocationListener(listener: LocationListener): { remove: () => void };
  // 计算两个坐标点之间的距离（米）
  distanceBetweenCoordinates(coordinate1: LatLng, coordinate2: LatLng): Promise<number>;
  // 查询点是否在圆内(一般不用主动调用)
  isPointInCircle(point: LatLng, center: LatLng, radius: number): Promise<boolean>;
  // 查询点是否在多边形内(一般不用主动调用)
  isPointInPolygon(point: LatLng, polygon: LatLng[]): Promise<boolean>;
  // 计算多边形面积（平方米）(一般不用主动调用)
  calculatePolygonArea(polygon: LatLng[]): Promise<number>;
  // 计算矩形面积（平方米）(一般不用主动调用)
  calculateRectangleArea(southWest: LatLng, northEast: LatLng): Promise<number>;
}
```

## 使用示例

### 导入类型

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

### 使用 MapViewRef

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

### 类型安全的定位配置

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

## 相关文档

- [MapView API](/api/mapview)
- [定位 API](/api/location)
- [覆盖物 API](/api/overlays)
