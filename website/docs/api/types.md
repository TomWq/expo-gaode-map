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
interface HeatMapProps {
  data: LatLng[];    // 热力点数据
  radius?: number;   // 热力半径（米）
  opacity?: number;  // 透明度 [0, 1]
}
```

### MultiPointProps
海量点属性

```typescript
interface MultiPointItem extends LatLng {
  id?: string | number;  // 唯一标识
  data?: any;            // 自定义数据
}

interface MultiPointProps {
  items: MultiPointItem[];   // 点集合
  icon?: ImageSourcePropType;  // 图标
  onPress?: (event: NativeSyntheticEvent<{
    index: number;
    item: MultiPointItem;
  }>) => void;
}
```

### ClusterProps
聚合图层属性

```typescript
interface ClusterPoint {
  position: LatLng;     // 坐标
  properties?: any;     // 自定义数据
}

interface ClusterParams {
  id: number;           // 唯一标识
  count: number;        // 包含的标记点数量
  position: LatLng;     // 聚合点坐标
}

interface ClusterProps {
  radius?: number;                           // 聚合半径
  points: ClusterPoint[];                    // 坐标点列表
  renderMarker: (item: ClusterPoint) => React.ReactNode;
  renderCluster?: (params: ClusterParams) => React.ReactNode;
  onPress?: (event: NativeSyntheticEvent<ClusterParams>) => void;
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