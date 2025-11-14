# API 文档

完整的 API 参考文档。

## 目录

- [MapView Props](#mapview-props)
- [MapView 方法](#mapview-方法)
- [定位 API](#定位-api)
- [类型定义](#类型定义)

## MapView Props

### 基础配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mapType` | `MapType` | `0` | 地图类型（0: 标准, 1: 卫星, 2: 夜间, 3: 导航, 4: 公交） |
| `initialCameraPosition` | `CameraPosition` | - | 初始相机位置 |
| `style` | `ViewStyle` | - | 组件样式 |

### 定位相关

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `myLocationEnabled` | `boolean` | `false` | 是否显示定位点 |
| `followUserLocation` | `boolean` | `false` | 是否跟随用户位置 |
| `userLocationRepresentation` | `object` | - | 定位蓝点样式配置 |

#### userLocationRepresentation 配置

| 属性 | 类型 | 平台 | 默认值 | 说明 |
|------|------|------|--------|------|
| `showsAccuracyRing` | `boolean` | 全平台 | `true` | 是否显示精度圈 |
| `fillColor` | `string \| number` | 全平台 | - | 精度圈填充颜色 |
| `strokeColor` | `string \| number` | 全平台 | - | 精度圈边线颜色 |
| `lineWidth` | `number` | 全平台 | `0` | 精度圈边线宽度 |
| `image` | `string` | 全平台 | - | 自定义定位图标 |
| `imageWidth` | `number` | 全平台 | - | 图标宽度（dp/pt） |
| `imageHeight` | `number` | 全平台 | - | 图标高度（dp/pt） |
| `showsHeadingIndicator` | `boolean` | 仅 iOS | `true` | 是否显示方向指示 |
| `enablePulseAnimation` | `boolean` | 仅 iOS | `true` | 蓝点律动效果 |
| `locationDotBgColor` | `string \| number` | 仅 iOS | `'white'` | 定位点背景色 |
| `locationDotFillColor` | `string \| number` | 仅 iOS | `'blue'` | 定位点颜色 |

### 控件显示

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `zoomControlsEnabled` | `boolean` | `true` | 是否显示缩放控件（Android） |
| `compassEnabled` | `boolean` | `true` | 是否显示指南针 |
| `scaleControlsEnabled` | `boolean` | `true` | 是否显示比例尺 |

### 手势控制

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `zoomGesturesEnabled` | `boolean` | `true` | 是否启用缩放手势 |
| `scrollGesturesEnabled` | `boolean` | `true` | 是否启用滑动手势 |
| `rotateGesturesEnabled` | `boolean` | `true` | 是否启用旋转手势 |
| `tiltGesturesEnabled` | `boolean` | `true` | 是否启用倾斜手势 |

### 缩放控制

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxZoom` | `number` | `20` | 最大缩放级别 (3-20) |
| `minZoom` | `number` | `3` | 最小缩放级别 (3-20) |

### 图层显示

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trafficEnabled` | `boolean` | `false` | 是否显示路况信息 |
| `buildingsEnabled` | `boolean` | `true` | 是否显示3D建筑 |
| `indoorViewEnabled` | `boolean` | `false` | 是否显示室内地图 |

### 事件回调

| 事件 | 参数 | 说明 |
|------|------|------|
| `onPress` | `(event: LatLng) => void` | 点击地图事件 |
| `onLongPress` | `(event: LatLng) => void` | 长按地图事件 |
| `onLoad` | `() => void` | 地图加载完成事件 |

## MapView 方法

通过 Ref 调用:

```tsx
interface MapViewRef {
  // 相机控制
  moveCamera(position: CameraPosition, duration?: number): Promise<void>;
  setCenter(center: LatLng, animated?: boolean): Promise<void>;
  setZoom(zoom: number, animated?: boolean): Promise<void>;
  getCameraPosition(): Promise<CameraPosition>;
  getLatLng(point: Point): Promise<LatLng>;
  
  // Circle 操作
  addCircle(id: string, props: CircleProps): Promise<void>;
  removeCircle(id: string): Promise<void>;
  updateCircle(id: string, props: Partial<CircleProps>): Promise<void>;
  
  // Marker 操作
  addMarker(id: string, props: MarkerProps): Promise<void>;
  removeMarker(id: string): Promise<void>;
  updateMarker(id: string, props: Partial<MarkerProps>): Promise<void>;
  
  // Polyline 操作
  addPolyline(id: string, props: PolylineProps): Promise<void>;
  removePolyline(id: string): Promise<void>;
  updatePolyline(id: string, props: Partial<PolylineProps>): Promise<void>;
  
  // Polygon 操作
  addPolygon(id: string, props: PolygonProps): Promise<void>;
  removePolygon(id: string): Promise<void>;
  updatePolygon(id: string, props: Partial<PolygonProps>): Promise<void>;
}
```

## 定位 API

### 定位控制

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `initSDK` | `{androidKey, iosKey}` | `void` | 初始化 SDK |
| `start` | - | `void` | 开始连续定位 |
| `stop` | - | `void` | 停止定位 |
| `isStarted` | - | `Promise<boolean>` | 检查是否正在定位 |
| `getCurrentLocation` | - | `Promise<Location>` | 获取当前位置 |

### 定位配置

#### configure() 统一配置

```tsx
import { configure } from 'expo-gaode-map';

configure({
  withReGeocode: true,
  mode: 0,
  interval: 2000,
  // ... 更多配置
});
```

#### 单独配置方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `setLocatingWithReGeocode` | `boolean` | 是否返回逆地理信息 |
| `setLocationMode` | `0 \| 1 \| 2` | 定位模式 |
| `setInterval` | `number` | 定位间隔（毫秒） |
| `setOnceLocation` | `boolean` | 是否单次定位 |
| `setSensorEnable` | `boolean` | 是否使用设备传感器 |
| `setWifiScan` | `boolean` | 是否允许 WiFi 扫描 |
| `setGpsFirst` | `boolean` | 是否 GPS 优先 |
| `setGeoLanguage` | `string` | 逆地理语言 |
| `setLocationCacheEnable` | `boolean` | 是否使用缓存策略（Android） |
| `setHttpTimeOut` | `number` | 网络请求超时（Android） |

#### iOS 特有配置

| 方法 | 参数 | 说明 |
|------|------|------|
| `setLocationTimeout` | `number` | 定位超时时间（秒） |
| `setReGeocodeTimeout` | `number` | 逆地理超时时间（秒） |
| `setDesiredAccuracy` | `number` | 期望精度（米） |
| `setPausesLocationUpdatesAutomatically` | `boolean` | 是否自动暂停定位更新 |
| `setAllowsBackgroundLocationUpdates` | `boolean` | 是否允许后台定位 |

### 方向更新（iOS）

| 方法 | 说明 |
|------|------|
| `startUpdatingHeading` | 开始方向更新 |
| `stopUpdatingHeading` | 停止方向更新 |

### 坐标转换

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `coordinateConvert` | `coordinate, type` | `Promise<LatLng>` | 坐标转换为高德坐标 |

## 类型定义

### MapType

```typescript
enum MapType {
  NORMAL = 0,      // 标准地图
  SATELLITE = 1,   // 卫星地图
  NIGHT = 2,       // 夜间地图
  NAVI = 3,        // 导航地图
  BUS = 4,         // 公交地图
}
```

### CameraPosition

```typescript
interface CameraPosition {
  target: LatLng;    // 目标位置
  zoom: number;      // 缩放级别 (3-20)
  tilt?: number;     // 倾斜角度 (0-60)
  bearing?: number;  // 旋转角度 (0-360)
}
```

### LatLng

```typescript
interface LatLng {
  latitude: number;   // 纬度
  longitude: number;  // 经度
}
```

### Location

```typescript
interface Location {
  // 基础位置信息
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  bearing: number;
  speed: number;
  
  // 地址信息（需要开启逆地理）
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
  
  // 其他信息
  provider?: string;
  timestamp?: number;
}