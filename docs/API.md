# API 文档

[English](./API.en.md) | 简体中文

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
| `onMapPress` | `(event: NativeSyntheticEvent<LatLng>) => void` | 点击地图事件 |
| `onMapLongPress` | `(event: NativeSyntheticEvent<LatLng>) => void` | 长按地图事件 |
| `onLoad` | `(event: NativeSyntheticEvent<{}>) => void` | 地图加载完成事件 |

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

}
```

## 定位 API

> ⚠️ **权限要求**：所有定位 API 都需要定位权限
>
> 使用前请先调用 `ExpoGaodeMapModule.checkLocationPermission()` 和 `ExpoGaodeMapModule.requestLocationPermission()`
>
> 详细说明: [INITIALIZATION.md](./INITIALIZATION.md)

### 定位控制

所有定位 API 通过 `ExpoGaodeMapModule` 调用：

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 初始化 SDK
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});

// 开始连续定位
ExpoGaodeMapModule.start();

// 停止定位
ExpoGaodeMapModule.stop();

// 检查是否正在定位
const isStarted = await ExpoGaodeMapModule.isStarted();

// 获取当前位置
const location = await ExpoGaodeMapModule.getCurrentLocation();
```

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `ExpoGaodeMapModule.initSDK` | `{androidKey, iosKey}` | `void` | 初始化 SDK |
| `ExpoGaodeMapModule.start` | - | `void` | 开始连续定位 |
| `ExpoGaodeMapModule.stop` | - | `void` | 停止定位 |
| `ExpoGaodeMapModule.isStarted` | - | `Promise<boolean>` | 检查是否正在定位 |
| `ExpoGaodeMapModule.getCurrentLocation` | - | `Promise<Location>` | 获取当前位置 |

### 定位配置

#### 配置方法

所有配置方法通过 `ExpoGaodeMapModule` 调用：

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 配置定位参数
ExpoGaodeMapModule.setLocatingWithReGeocode(true);  // 返回地址信息
ExpoGaodeMapModule.setLocationMode(0);              // 高精度模式
ExpoGaodeMapModule.setInterval(2000);               // 2秒更新一次
ExpoGaodeMapModule.setDesiredAccuracy(3);           // iOS 精度级别
```

#### 单独配置方法列表

> **平台支持说明**：部分配置方法仅在特定平台有效，其他平台会静默忽略

##### 通用配置（全平台支持）

| 方法 | 参数 | 说明 |
|------|------|------|
| `ExpoGaodeMapModule.setLocatingWithReGeocode` | `boolean` | 是否返回逆地理信息 |
| `ExpoGaodeMapModule.setInterval` | `number` | 定位间隔（毫秒）/ 距离过滤（米） |
| `ExpoGaodeMapModule.setGeoLanguage` | `number` | 逆地理语言 |

##### Android 专用配置

| 方法 | 参数 | 说明 |
|------|------|------|
| `ExpoGaodeMapModule.setLocationMode` | `0 \| 1 \| 2` | 定位模式（0: 高精度, 1: 省电, 2: 仅设备） |
| `ExpoGaodeMapModule.setOnceLocation` | `boolean` | 是否单次定位 |
| `ExpoGaodeMapModule.setSensorEnable` | `boolean` | 是否使用设备传感器 |
| `ExpoGaodeMapModule.setWifiScan` | `boolean` | 是否允许 WiFi 扫描 |
| `ExpoGaodeMapModule.setGpsFirst` | `boolean` | 是否 GPS 优先 |
| `ExpoGaodeMapModule.setOnceLocationLatest` | `boolean` | 是否等待 WiFi 列表刷新 |
| `ExpoGaodeMapModule.setLocationCacheEnable` | `boolean` | 是否使用缓存策略 |
| `ExpoGaodeMapModule.setHttpTimeOut` | `number` | 网络请求超时（毫秒） |

##### iOS 专用配置

| 方法 | 参数 | 说明 |
|------|------|------|
| `ExpoGaodeMapModule.setLocationTimeout` | `number` | 定位超时时间（秒，默认 2 秒） |
| `ExpoGaodeMapModule.setReGeocodeTimeout` | `number` | 逆地理超时时间（秒，默认 2 秒） |
| `ExpoGaodeMapModule.setDesiredAccuracy` | `number` | 期望精度（0-5，默认 3: 100米精度） |
| `ExpoGaodeMapModule.setDistanceFilter` | `number` | 距离过滤器（米，默认 10 米） |
| `ExpoGaodeMapModule.setPausesLocationUpdatesAutomatically` | `boolean` | 是否自动暂停定位更新（默认 false） |

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
| `ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates` | `boolean` | 是否允许后台定位 |

> **后台定位说明**:
> - **iOS**: 需要在 Info.plist 中配置 `NSLocationAlwaysAndWhenInUseUsageDescription` 和 `UIBackgroundModes` (包含 `location`)
> - **Android**: 自动启动前台服务，需要 `ACCESS_BACKGROUND_LOCATION` 权限（Android 10+）
> - 后台定位会增加电量消耗，请谨慎使用

### 方向更新（iOS）

| 方法 | 说明 |
|------|------|
| `ExpoGaodeMapModule.startUpdatingHeading` | 开始方向更新 |
| `ExpoGaodeMapModule.stopUpdatingHeading` | 停止方向更新 |

### 坐标转换

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `ExpoGaodeMapModule.coordinateConvert` | `coordinate, type` | `Promise<LatLng>` | 坐标转换为高德坐标 |

### 事件监听

使用 `addListener` 方法监听定位和方向更新事件：

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 监听位置更新
const locationSubscription = ExpoGaodeMapModule.addLocationListener('onLocationUpdate', (location) => {
  console.log('位置更新:', location);
});

// 监听方向更新（iOS）
const headingSubscription = ExpoGaodeMapModule.onHeadingUpdate('onHeadingUpdate', (heading) => {
  console.log('方向更新:', heading);
});

// 取消监听
locationSubscription.remove();
headingSubscription.remove();
```

## 覆盖物组件



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
| `onPress` | `(event: NativeSyntheticEvent<{}>) => void` | 点击圆形 |

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
| `onPress` | `(event: NativeSyntheticEvent<{}>) => void` | 点击折线 |

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
| `onPress` | `(event: NativeSyntheticEvent<{}>) => void` | 点击多边形 |

### Marker (标记点)

#### 属性

| 属性 | 类型 | 平台 | 默认值 | 说明 |
|------|------|------|--------|------|
| `position` | `LatLng` | 全平台 | - | 标记点坐标（必需） |
| `title` | `string` | 全平台 | - | 标题 |
| `snippet` | `string` | 全平台 | - | 描述信息 |
| `draggable` | `boolean` | 全平台 | `false` | 是否可拖拽 |
| `icon` | `string \| ImageSourcePropType` | 全平台 | - | 自定义图标 |
| `iconWidth` | `number` | 全平台 | `40` | 图标宽度（点/dp），仅在使用 `icon` 时有效 |
| `iconHeight` | `number` | 全平台 | `40` | 图标高度（点/dp），仅在使用 `icon` 时有效 |
| `children` | `React.ReactNode` | 全平台 | - | 自定义视图内容 |
| `customViewWidth` | `number` | 全平台 | `80` | 自定义视图宽度（点/dp），仅在使用 `children` 时有效 |
| `customViewHeight` | `number` | 全平台 | `30` | 自定义视图高度（点/dp），仅在使用 `children` 时有效 |
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
| `onPress` | `(event: NativeSyntheticEvent<{}>) => void` | 点击标记点 |
| `onDragStart` | `(event: NativeSyntheticEvent<LatLng>) => void` | 开始拖拽 |
| `onDrag` | `(event: NativeSyntheticEvent<LatLng>) => void` | 拖拽中 |
| `onDragEnd` | `(event: NativeSyntheticEvent<LatLng>) => void` | 拖拽结束 |

> **⚠️ 重要提示**：事件回调仅在**声明式用法**中有效。使用命令式 API（`addMarker`）添加的标记点无法触发这些事件。

#### 使用方式

##### 1. 默认大头针
不传递任何图标属性，显示默认的红色大头针（iOS）或默认标记（Android）。

##### 2. 自定义图标
通过 `icon` 属性指定图标图片：

```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  icon={require('./assets/custom-icon.png')}
  iconWidth={40}
  iconHeight={60}
  title="自定义图标"
/>
```

**自定义图标特点：**
- **图标格式**：支持网络图片（http/https）、本地文件（使用 `Image.resolveAssetSource()`）
- **尺寸控制**：使用 `iconWidth` 和 `iconHeight` 设置图标显示尺寸（点/dp）
- **锚点**：`anchor` 定义图标相对于坐标点的位置，`{x: 0.5, y: 1.0}` 表示图标底部中心对齐坐标点

##### 3. 自定义视图（children）⭐ 推荐
通过 `children` 属性传递自定义 React Native 组件，可以实现完全自定义的标记外观：

```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  customViewWidth={200}
  customViewHeight={50}
>
  <View style={styles.markerContainer}>
    <Text style={styles.markerText}>自定义内容</Text>
  </View>
</Marker>
```

**自定义视图特点：**
- ✅ 支持任意 React Native 组件（View、Text、Image 等）
- ✅ 完全支持样式（backgroundColor、borderRadius、padding、flexbox 等）
- ✅ 使用 `customViewWidth` 和 `customViewHeight` 控制最终渲染尺寸（默认 80x30）
- ✅ 自动将 React 组件转换为图片显示在地图上
- ⚠️ **仅支持声明式用法**（`<Marker>` 组件），不支持命令式 API（`addMarker`）

**尺寸说明：**
- `customViewWidth` 和 `customViewHeight` 定义最终在地图上显示的尺寸
- 子视图会被强制调整为该尺寸并渲染为图片
- 建议明确指定尺寸以确保在不同设备上显示一致
- **注意**：`iconWidth` 和 `iconHeight` 仅用于自定义图标（`icon` 属性），不影响 `children`

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