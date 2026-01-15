# MapView API

MapView 是地图显示的核心组件。

## Props

### 基础配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mapType` | `MapType` | `0` | 地图类型（0: 标准, 1: 卫星, 2: 夜间, 3: 导航, 4: 公交） |
| `worldMapSwitchEnabled` | `boolean` | `false` | 是否启用国内外地图自动切换功能 (iOS) |
| `initialCameraPosition` | `CameraPosition` | - | 初始相机位置 |
| `style` | `ViewStyle` | - | 组件样式 |

### 定位相关

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `myLocationEnabled` | `boolean` | `false` | 是否显示定位点 |
| `followUserLocation` | `boolean` | `false` | 是否跟随用户位置 |
| `userLocationRepresentation` | `UserLocationRepresentation` | - | 定位蓝点样式配置 |

#### UserLocationRepresentation 配置

定位蓝点的外观和行为配置，支持跨平台自定义。

**通用属性（iOS + Android）：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showMyLocation` | `boolean` | `true` | 是否显示定位蓝点 |
| `showsAccuracyRing` | `boolean` | `true` | 是否显示精度圈 |
| `fillColor` | `string \| number` | - | 精度圈填充颜色 |
| `strokeColor` | `string \| number` | - | 精度圈边线颜色 |
| `lineWidth` | `number` | `0` | 精度圈边线宽度 |
| `image` | `string` | - | 自定义定位图标（支持网络图片、本地文件） |
| `imageWidth` | `number` | - | 定位图标宽度（像素） |
| `imageHeight` | `number` | - | 定位图标高度（像素） |

**iOS 专用属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showsHeadingIndicator` | `boolean` | `true` | 是否显示方向指示器（扇形） |
| `enablePulseAnimation` | `boolean` | `true` | 是否启用律动效果 |
| `locationDotBgColor` | `string \| number` | `'white'` | 定位点背景色 |
| `locationDotFillColor` | `string \| number` | `'blue'` | 定位点填充色 |

**Android 专用属性：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `locationType` | `LocationType` | `'LOCATION_ROTATE'` | 定位蓝点展现模式（见下方说明） |
| `anchorU` | `number` | - | 图标锚点 U 坐标 (0.0-1.0) |
| `anchorV` | `number` | - | 图标锚点 V 坐标 (0.0-1.0) |

**Android LocationType 说明：**

🧭 **方向指示模式**（推荐）：
- `'LOCATION_ROTATE'` - 定位点依照设备方向旋转，视角跟随移动到中心（默认）⭐
- `'LOCATION_ROTATE_NO_CENTER'` - 定位点依照设备方向旋转，视角不移动到中心 ⭐

🗺️ **其他模式**：
- `'SHOW'` - 只定位一次
- `'LOCATE'` - 定位一次，且将视角移动到地图中心点
- `'FOLLOW'` - 连续定位、跟随移动，但定位点不旋转
- `'MAP_ROTATE'` - 地图依照设备方向旋转（而非定位点旋转）
- `'FOLLOW_NO_CENTER'` - 连续定位、不移动到中心，定位点不旋转
- `'MAP_ROTATE_NO_CENTER'` - 地图依照设备方向旋转，不移动到中心

::: tip 方向指示的平台差异
- **iOS**: 通过 `showsHeadingIndicator` 显示扇形方向指示器，需要调用 `startUpdatingHeading()` 启用罗盘
- **Android**: 通过 `locationType` 设置为 `LOCATION_ROTATE` 或 `LOCATION_ROTATE_NO_CENTER`，定位图标会自动旋转指向设备朝向

两种方式都能清晰地显示用户的朝向，Android 的实现甚至更加直观（图标直接旋转）！
:::

**示例：**

```tsx
<MapView
  style={{ flex: 1 }}
  myLocationEnabled={true}
  followUserLocation={true}
  userLocationRepresentation={{
    // 通用配置
    showMyLocation: true,
    showsAccuracyRing: true,
    fillColor: '#4400FF00',
    strokeColor: '#FF00FF00',
    lineWidth: 1,
    
    // iOS 方向指示
    showsHeadingIndicator: true,
    enablePulseAnimation: true,
    
    // Android 方向指示
    locationType: 'LOCATION_ROTATE',
    
    // 自定义图标
    image: 'https://example.com/icon.png',
    imageWidth: 40,
    imageHeight: 40,
  }}
/>
```

**启用 iOS 方向指示器：**

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 开始更新设备方向（iOS 专用）
ExpoGaodeMapModule.startUpdatingHeading();

// 停止更新设备方向
ExpoGaodeMapModule.stopUpdatingHeading();
```

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

### 自定义地图样式

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `customMapStyle` | `CustomMapStyle` | - | 自定义地图样式配置 |

#### CustomMapStyle 类型

```typescript
interface CustomMapStyle {
  styleId?: string;              // 在线样式 ID（从高德开放平台获取）
  styleDataPath?: string;        // 本地样式文件路径（.data 文件）
  extraStyleDataPath?: string;   // 额外样式文件路径（.extra 文件，可选）
}
```

**使用方式：**

1. **在线样式**：从[高德开放平台](https://lbs.amap.com/api/javascript-api/guide/create-map/customized-map)创建自定义样式，获取样式 ID
2. **本地样式**：下载样式文件（.data 和 .extra），放入项目资源目录

**示例：**

```tsx
// 使用在线样式
<MapView
  style={{ flex: 1 }}
  customMapStyle={{
    styleId: 'your-style-id'
  }}
/>

// 使用本地样式文件
<MapView
  style={{ flex: 1 }}
  customMapStyle={{
    styleDataPath: 'style.data',
    extraStyleDataPath: 'style.extra'
  }}
/>
```

::: tip 样式持久化
iOS 和 Android 平台都已实现样式持久化机制，地图缩放、移动、切换地图类型时样式会自动保持，无需手动重新应用。
:::

::: warning 注意事项
- 在线样式需要网络连接
- 本地样式文件需要正确放置在资源目录中
- 样式 ID 和本地文件路径不能同时使用
- 切换地图类型后样式会自动重新应用
:::

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
  /**
   * 截取地图快照
   * @returns 快照图片文件路径
   */
  takeSnapshot(): Promise<string>;
}
```

## 使用示例

### 基础使用

```tsx
import { MapView } from 'expo-gaode-map';

<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  myLocationEnabled={true}
  onLoad={() => console.log('地图加载完成')}
/>
```

### 使用 Ref 控制相机

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

## 类型定义

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

## 相关文档

- [定位 API](/api/location)
- [覆盖物](/api/overlays)
- [使用示例](/examples/)