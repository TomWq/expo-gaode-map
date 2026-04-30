# MapView API

`MapView` 是地图显示的核心组件，支持地图渲染、定位蓝点、相机控制、事件监听和截图。

> ⚠️ **隐私要求**
>
> 在渲染 `MapView` 或调用任何地图/定位能力前，首次安装必须先完成隐私合规。
> 用户同意后，原生层会自动持久化并在后续冷启动恢复隐私状态。
>
> 如果未完成，JS 层会直接抛出明确错误，避免原生 SDK 因隐私校验失败而异常。

## Props

### 基础配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mapType` | `MapType` | `MapType.Standard` | 地图类型 |
| `initialCameraPosition` | `CameraPosition` | - | 初始相机位置 |
| `style` | `StyleProp<ViewStyle>` | - | 地图样式，通常需要 `flex: 1` |
| `worldMapSwitchEnabled` | `boolean` | `false` | 是否启用国内外地图自动切换，仅 iOS |
| `customMapStyle` | `{ styleId?: string; styleDataPath?: string; extraStyleDataPath?: string }` | - | 自定义地图样式 |

### 定位相关

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `myLocationEnabled` | `boolean` | `false` | 是否显示定位蓝点 |
| `followUserLocation` | `boolean` | `false` | 是否跟随用户位置 |
| `userLocationRepresentation` | `UserLocationRepresentation` | - | 定位蓝点样式配置 |
| `distanceFilter` | `number` | - | 最小定位更新距离（米），仅 iOS |
| `headingFilter` | `number` | - | 最小方向更新角度（度），仅 iOS |

#### UserLocationRepresentation

**通用属性**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showMyLocation` | `boolean` | `true` | 是否显示蓝点 |
| `showsAccuracyRing` | `boolean` | `true` | 是否显示精度圈 |
| `fillColor` | `string \| number` | - | 精度圈填充色 |
| `strokeColor` | `string \| number` | - | 精度圈边线颜色 |
| `lineWidth` | `number` | `0` | 精度圈边线宽度 |
| `image` | `string` | - | 自定义定位图标 |
| `imageWidth` | `number` | - | 图标宽度 |
| `imageHeight` | `number` | - | 图标高度 |

**iOS 专用**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showsHeadingIndicator` | `boolean` | `true` | 是否显示朝向扇形 |
| `enablePulseAnimation` | `boolean` | `true` | 是否启用律动效果 |
| `locationDotBgColor` | `string \| number` | `'white'` | 定位点背景色 |
| `locationDotFillColor` | `string \| number` | `'blue'` | 定位点填充色 |

**Android 专用**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `anchorU` | `number` | - | 图标锚点 U 坐标 |
| `anchorV` | `number` | - | 图标锚点 V 坐标 |
| `locationType` | `'SHOW' \| 'LOCATE' \| 'FOLLOW' \| 'MAP_ROTATE' \| 'LOCATION_ROTATE' \| 'LOCATION_ROTATE_NO_CENTER' \| 'FOLLOW_NO_CENTER' \| 'MAP_ROTATE_NO_CENTER'` | `'LOCATION_ROTATE_NO_CENTER'` | 蓝点展现模式 |

#### Android `locationType` 说明

- `'SHOW'`：只定位一次
- `'LOCATE'`：定位一次并移动到中心
- `'FOLLOW'`：连续定位，跟随移动，图标不旋转
- `'MAP_ROTATE'`：地图跟随设备方向旋转
- `'LOCATION_ROTATE'`：定位点跟随设备方向旋转，并移动到中心
- `'LOCATION_ROTATE_NO_CENTER'`：定位点跟随设备方向旋转，但不移动到中心
- `'FOLLOW_NO_CENTER'`：连续定位，但不移动到中心
- `'MAP_ROTATE_NO_CENTER'`：地图旋转，但不移动到中心

显式设置 `locationType` 时，会覆盖 `followUserLocation` 的默认模式选择。

### 地图显示与控件

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `indoorViewEnabled` | `boolean` | `false` | 是否显示室内地图 |
| `buildingsEnabled` | `boolean` | `true` | 是否显示 3D 建筑 |
| `labelsEnabled` | `boolean` | `true` | 是否显示地图标注 |
| `compassEnabled` | `boolean` | `true` | 是否显示指南针 |
| `zoomControlsEnabled` | `boolean` | `true` | 是否显示缩放控件，仅 Android |
| `scaleControlsEnabled` | `boolean` | `true` | 是否显示比例尺 |
| `myLocationButtonEnabled` | `boolean` | `false` | 是否显示定位按钮，仅 Android |
| `trafficEnabled` | `boolean` | `false` | 是否显示路况 |

### 手势与缩放

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `maxZoom` | `number` | `20` | 最大缩放级别 |
| `minZoom` | `number` | `3` | 最小缩放级别 |
| `zoomGesturesEnabled` | `boolean` | `true` | 是否启用缩放手势 |
| `scrollGesturesEnabled` | `boolean` | `true` | 是否启用平移手势 |
| `rotateGesturesEnabled` | `boolean` | `true` | 是否启用旋转手势 |
| `tiltGesturesEnabled` | `boolean` | `true` | 是否启用倾斜手势 |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onMapPress` | `NativeSyntheticEvent<LatLng>` | 点击地图空白区域 |
| `onPressPoi` | `NativeSyntheticEvent<MapPoi>` | 点击地图 POI |
| `onMapLongPress` | `NativeSyntheticEvent<LatLng>` | 长按地图 |
| `onCameraMove` | `NativeSyntheticEvent<CameraEvent>` | 相机移动中持续触发 |
| `onCameraIdle` | `NativeSyntheticEvent<CameraEvent>` | 相机移动结束 |
| `onLoad` | `NativeSyntheticEvent<{}>` | 地图加载完成 |
| `onLocation` | `NativeSyntheticEvent<LocationEvent>` | 地图蓝点位置更新 |

### 相机事件节流

- 通过 `cameraEventThrottleMs?: number` 控制原生 `onCameraMove` 事件的节流间隔（毫秒）
- 默认值为 `32`，传入 `0` 表示不开启节流，所有相机移动事件都会派发到 JS

## MapViewRef 方法

通过 `ref` 调用：

```tsx
interface MapViewRef {
  moveCamera(position: CameraUpdate, duration?: number): Promise<void>;
  getLatLng(point: Point): Promise<LatLng>;
  setCenter(center: LatLngPoint, animated?: boolean): Promise<void>;
  setZoom(zoom: number, animated?: boolean): Promise<void>;
  getCameraPosition(): Promise<CameraPosition>;
  takeSnapshot(): Promise<string>;
  fitToCoordinates(points: LatLngPoint[], options?: FitToCoordinatesOptions): Promise<void>;
}
```

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `moveCamera` | `(position, duration?)` | `Promise<void>` | 移动相机 |
| `getLatLng` | `(point)` | `Promise<LatLng>` | 屏幕坐标转经纬度 |
| `setCenter` | `(center, animated?)` | `Promise<void>` | 设置地图中心点 |
| `setZoom` | `(zoom, animated?)` | `Promise<void>` | 设置缩放级别 |
| `getCameraPosition` | - | `Promise<CameraPosition>` | 获取当前相机状态 |
| `takeSnapshot` | - | `Promise<string>` | 截取地图快照，返回图片文件路径 |
| `fitToCoordinates` | `(points, options?)` | `Promise<void>` | 根据点集自动调整视口 |

### fitToCoordinates

`fitToCoordinates(points, options?)` 用于把一组坐标完整放进当前视口，适合路线预览、批量覆盖物框选、AOI 展示等场景。

```tsx
await mapRef.current?.fitToCoordinates(routePoints, {
  duration: 500,
  paddingFactor: 0.2,
  minZoom: 5,
  maxZoom: 18,
  singlePointZoom: 16,
  preserveBearing: true,
});
```

#### FitToCoordinatesOptions

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `duration` | `number` | `300` | 相机动画时长，单位毫秒 |
| `paddingFactor` | `number` | `0.18` | 在计算边界后额外留白的比例 |
| `minZoom` | `number` | - | 允许缩到的最小级别 |
| `maxZoom` | `number` | - | 允许放大的最大级别 |
| `singlePointZoom` | `number` | `16` | 只有一个点时使用的缩放级别 |
| `bearing` | `number` | - | 强制使用指定朝向 |
| `tilt` | `number` | - | 强制使用指定俯仰角 |
| `preserveBearing` | `boolean` | `false` | 保留当前相机朝向 |
| `preserveTilt` | `boolean` | `false` | 保留当前相机俯仰角 |

#### 行为说明

- 空数组不会抛错，但不会触发相机更新
- 单点场景会回退到 `singlePointZoom`
- 输入支持对象坐标和 `[longitude, latitude]` 数组坐标混用
- 底层实现位于各自包内部；`expo-gaode-map` 与 `expo-gaode-map-navigation` 都暴露了同名方法，但地图实现相互独立

## 使用示例

### 基础地图

```tsx
import { ExpoGaodeMapModule, MapType, MapView } from 'expo-gaode-map';

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
      mapType={MapType.Standard}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      onLoad={() => console.log('地图加载完成')}
    />
  );
}
```

### 使用 Ref 控制地图

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
      <Button title="移动相机" onPress={handleMoveCamera} />
    </View>
  );
}
```

### 路线视口控制

`fitToCoordinates` 常和 `RouteOverlay`、`useRoutePlayback` 配合使用，在算路完成后先框选整条路径，再进入回放或跟车模式。

```tsx
const points = extractRoutePoints(routeResult);

await mapRef.current?.fitToCoordinates(points, {
  duration: 500,
  paddingFactor: 0.24,
});
```

### 监听 POI / 相机 / 位置

```tsx
<MapView
  style={{ flex: 1 }}
  myLocationEnabled
  onPressPoi={(e) => console.log('POI', e.nativeEvent)}
  onCameraMove={(e) => console.log('移动中', e.nativeEvent.cameraPosition)}
  onCameraIdle={(e) => console.log('移动结束', e.nativeEvent.latLngBounds)}
  onLocation={(e) => console.log('蓝点位置', e.nativeEvent)}
/>
```

### 截图

`takeSnapshot()` 会返回图片文件路径；如果页面里配合 `MapUI` 渲染悬浮层，截图也会包含这些 UI。

```tsx
const uri = await mapRef.current?.takeSnapshot();
console.log('截图路径:', uri);
```

## 类型补充

### CameraPosition

```ts
interface CameraPosition {
  target?: LatLng;
  zoom?: number;
  tilt?: number;
  bearing?: number;
}
```

### LocationEvent

```ts
interface LocationEvent {
  latitude: number;
  longitude: number;
  accuracy: number;
}
```

### CameraEvent

```ts
interface CameraEvent {
  cameraPosition: CameraPosition;
  latLngBounds: LatLngBounds;
}
```

## 相关路线增强能力

以下能力虽然不直接属于 `MapView` Props，但通常会和 `MapViewRef` 一起使用：

- `useRoutePlayback(points, options)`
  轨迹回放控制器，提供 `start / pause / resume / stop / seek / setSpeedMultiplier`
- `RouteOverlay`
  标准路线展示组件，负责渲染折线、起点、终点
- `AreaMaskOverlay`
  区域遮罩组件，适合 AOI / 园区 / 行政区高亮

这三项 API 的详细说明见：

- [覆盖物 API / RouteOverlay](./overlays#routeoverlay-路线展示)
- [覆盖物 API / AreaMaskOverlay](./overlays#areamaskoverlay-区域遮罩)
- [覆盖物 API / Marker 平滑移动事件](./overlays#marker-平滑移动事件)
