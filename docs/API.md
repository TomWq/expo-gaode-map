# API 文档

完整的 API 参考文档。

> ⚠️ **权限和隐私合规警告**
>
> 使用地图和定位功能前，请确保：
> 1. ✅ 已在原生项目中配置必需的权限声明
> 2. ✅ 在运行时请求用户授权
> 3. ✅ 遵守《个人信息保护法》等隐私法规
> 4. ✅ 配置高德 SDK 隐私合规接口
>
> 详细配置请参考 [README.md](../README.md#权限配置)

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

> ⚠️ **权限要求**：使用定位功能需要用户授权
> - Android: `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION`
> - iOS: `NSLocationWhenInUseUsageDescription` (Info.plist)

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
| `onMapPress` | `(event: LatLng) => void` | 点击地图事件 |
| `onMapLongPress` | `(event: LatLng) => void` | 长按地图事件 |
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

> ⚠️ **权限要求**：所有定位 API 都需要定位权限
>
> 使用前请先调用 `checkLocationPermission()` 和 `requestLocationPermission()`
>
> 详细说明: [INITIALIZATION.md](./INITIALIZATION.md)

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

> **平台支持说明**：部分配置方法仅在特定平台有效，其他平台会静默忽略

##### 通用配置（全平台支持）

| 方法 | 参数 | 说明 |
|------|------|------|
| `setLocatingWithReGeocode` | `boolean` | 是否返回逆地理信息 |
| `setInterval` | `number` | 定位间隔（毫秒）/ 距离过滤（米） |
| `setGeoLanguage` | `string` | 逆地理语言 |

##### Android 专用配置

| 方法 | 参数 | 说明 |
|------|------|------|
| `setLocationMode` | `0 \| 1 \| 2` | 定位模式（0: 高精度, 1: 省电, 2: 仅设备） |
| `setOnceLocation` | `boolean` | 是否单次定位 |
| `setSensorEnable` | `boolean` | 是否使用设备传感器 |
| `setWifiScan` | `boolean` | 是否允许 WiFi 扫描 |
| `setGpsFirst` | `boolean` | 是否 GPS 优先 |
| `setOnceLocationLatest` | `boolean` | 是否等待 WiFi 列表刷新 |
| `setLocationCacheEnable` | `boolean` | 是否使用缓存策略 |
| `setHttpTimeOut` | `number` | 网络请求超时（毫秒） |

##### iOS 专用配置

| 方法 | 参数 | 说明 |
|------|------|------|
| `setLocationTimeout` | `number` | 定位超时时间（秒，默认 2 秒） |
| `setReGeocodeTimeout` | `number` | 逆地理超时时间（秒，默认 2 秒） |
| `setDesiredAccuracy` | `number` | 期望精度（0-5，默认 3: 100米精度） |
| `setDistanceFilter` | `number` | 距离过滤器（米，默认 10 米） |
| `setPausesLocationUpdatesAutomatically` | `boolean` | 是否自动暂停定位更新（默认 false） |

**iOS 默认定位配置：**

根据高德官方推荐，本库采用以下默认配置以实现快速定位：
- **精度**：`kCLLocationAccuracyHundredMeters`（100米精度，级别 3）
- **定位超时**：2 秒
- **逆地理超时**：2 秒
- **距离过滤**：10 米

> **精度说明**：
> - **百米精度**（推荐）：2-3 秒内获取结果，满足大多数应用场景
> - **高精度**：使用 `setDesiredAccuracy(1)` 切换到 `kCLLocationAccuracyBest`，需配合 `setLocationTimeout(10)` 和 `setReGeocodeTimeout(10)`，约 10 秒获取 10 米精度
> - 苹果系统首次定位结果为粗定位，高精度需要更长时间

**精度级别对照表：**

| 级别 | 常量 | 说明 | 推荐超时 |
|------|------|------|----------|
| 0 | `kCLLocationAccuracyBestForNavigation` | 最适合导航 | 10 秒 |
| 1 | `kCLLocationAccuracyBest` | 最佳精度（~10米） | 10 秒 |
| 2 | `kCLLocationAccuracyNearestTenMeters` | 10米精度 | 5 秒 |
| 3 | `kCLLocationAccuracyHundredMeters` | 100米精度（默认） | 2-3 秒 |
| 4 | `kCLLocationAccuracyKilometer` | 1公里精度 | 1 秒 |
| 5 | `kCLLocationAccuracyThreeKilometers` | 3公里精度 | 1 秒 |

##### 后台定位配置（全平台支持）

| 方法 | 参数 | 说明 |
|------|------|------|
| `setAllowsBackgroundLocationUpdates` | `boolean` | 是否允许后台定位 |

> **后台定位说明**:
> - **iOS**: 需要在 Info.plist 中配置 `NSLocationAlwaysAndWhenInUseUsageDescription` 和 `UIBackgroundModes` (包含 `location`)
> - **Android**: 自动启动前台服务，需要 `ACCESS_BACKGROUND_LOCATION` 权限（Android 10+）
> - 后台定位会增加电量消耗，请谨慎使用

### 方向更新（iOS）

| 方法 | 说明 |
|------|------|
| `startUpdatingHeading` | 开始方向更新 |
| `stopUpdatingHeading` | 停止方向更新 |

### 坐标转换

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `coordinateConvert` | `coordinate, type` | `Promise<LatLng>` | 坐标转换为高德坐标 |

## 覆盖物组件

> **事件回调说明**：所有覆盖物的事件回调（如 `onPress`）仅在**声明式用法**中有效。使用命令式 API（如 `addCircle`、`addMarker` 等）添加的覆盖物无法触发这些事件。

### Circle (圆形)

#### 属性

| 属性 | 类型 | 平台 | 默认值 | 说明 |
|------|------|------|--------|------|
| `center` | `LatLng` | 全平台 | - | 圆心坐标（必需） |
| `radius` | `number` | 全平台 | - | 半径（米） |
| `fillColor` | `string` | 全平台 | - | 填充颜色（ARGB 格式：`#AARRGGBB`） |
| `strokeColor` | `string` | 全平台 | - | 边框颜色（ARGB 格式：`#AARRGGBB`） |
| `strokeWidth` | `number` | 全平台 | `1` | 边框宽度（点/dp） |

#### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onPress` | `() => void` | 点击圆形 |

### Polyline (折线)

#### 属性

| 属性 | 类型 | 平台 | 默认值 | 说明 |
|------|------|------|--------|------|
| `points` | `LatLng[]` | 全平台 | - | 折线坐标点数组（必需） |
| `width` | `number` | 全平台 | `5` | 线宽（点/dp） |
| `color` | `string` | 全平台 | - | 线条颜色（ARGB 格式：`#AARRGGBB`） |
| `texture` | `string` | 全平台 | - | 纹理图片 URL |
| `dotted` | `boolean` | 仅 Android | `false` | 是否绘制虚线 |
| `geodesic` | `boolean` | 仅 Android | `false` | 是否绘制大地曲线 |
| `zIndex` | `number` | 全平台 | `0` | 层级 |

#### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onPress` | `() => void` | 点击折线 |

> **纹理说明**：
> - 支持网络图片（http/https）和本地文件（使用 `Image.resolveAssetSource()`）
> - 纹理会沿着折线方向平铺显示
> - 建议纹理折线使用较大的 `width` 值（如 20）以获得更好的显示效果
> - **分段纹理限制**：单个 Polyline 只能设置一个纹理。如需不同线段使用不同纹理，请创建多个 Polyline 组件

### Polygon (多边形)

#### 属性

| 属性 | 类型 | 平台 | 默认值 | 说明 |
|------|------|------|--------|------|
| `points` | `LatLng[]` | 全平台 | - | 多边形顶点坐标数组（必需） |
| `fillColor` | `string` | 全平台 | - | 填充颜色（ARGB 格式：`#AARRGGBB`） |
| `strokeColor` | `string` | 全平台 | - | 边框颜色（ARGB 格式：`#AARRGGBB`） |
| `strokeWidth` | `number` | 全平台 | `1` | 边框宽度（点/dp） |

#### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onPress` | `() => void` | 点击多边形 |

### Marker (标记点)

#### 属性

| 属性 | 类型 | 平台 | 默认值 | 说明 |
|------|------|------|--------|------|
| `position` | `LatLng` | 全平台 | - | 标记点坐标（必需） |
| `title` | `string` | 全平台 | - | 标题 |
| `snippet` | `string` | 全平台 | - | 描述信息 |
| `draggable` | `boolean` | 全平台 | `false` | 是否可拖拽 |
| `icon` | `string \| ImageSourcePropType` | 全平台 | - | 自定义图标 |
| `iconWidth` | `number` | 全平台 | `40` | 图标宽度（点/dp） |
| `iconHeight` | `number` | 全平台 | `40` | 图标高度（点/dp） |
| `opacity` | `number` | 仅 Android | `1.0` | 透明度 [0, 1] |
| `flat` | `boolean` | 仅 Android | `false` | 是否平贴地图 |
| `zIndex` | `number` | 仅 Android | `0` | 层级 |
| `anchor` | `Point` | 仅 Android | `{x: 0.5, y: 1.0}` | 锚点比例 |
| `centerOffset` | `Point` | 仅 iOS | - | 中心偏移 |
| `animatesDrop` | `boolean` | 仅 iOS | `false` | 是否显示掉落动画 |
| `pinColor` | `'red' \| 'green' \| 'purple'` | 仅 iOS | `'red'` | 大头针颜色 |

#### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onPress` | `() => void` | 点击标记点 |
| `onDragStart` | `() => void` | 开始拖拽 |
| `onDrag` | `() => void` | 拖拽中 |
| `onDragEnd` | `(event: { nativeEvent: LatLng }) => void` | 拖拽结束 |

> **⚠️ 重要提示**：事件回调仅在**声明式用法**中有效。使用命令式 API（`addMarker`）添加的标记点无法触发这些事件。

#### 图标说明

- **图标格式**：支持网络图片（http/https）、本地文件（使用 `Image.resolveAssetSource()`）
- **尺寸单位**：`iconWidth` 和 `iconHeight` 使用点(points)作为单位，在不同密度屏幕上会自动缩放
- **锚点**：`anchor` 定义图标相对于坐标点的位置，`{x: 0.5, y: 1.0}` 表示图标底部中心对齐坐标点

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