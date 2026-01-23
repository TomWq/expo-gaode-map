---
title: Map View Core
impact: CRITICAL
tags: map-view, camera, ui-settings, gestures
---

# 核心参考: Map View

管理 `MapView` 的生命周期、相机控制、基本 UI 设置和地图类型。

## 快速参考

### 核心属性 (Props)

| 属性 | 类型 | 说明 |
|----------|----------|--------------|
| `mapType` | `MapType` (Enum) | 地图底图类型: `Standard(0)`, `Satellite(1)`, `Night(2)`, `Navi(3)`, `Bus(4)` |
| `initialCameraPosition` | `CameraPosition` | 初始显示的中心点、缩放级别(3-20)、旋转角度、倾斜角度 |
| `myLocationEnabled` | `boolean` | 是否显示定位蓝点 |
| `trafficEnabled` | `boolean` | 是否开启实时路况 |
| `buildingsEnabled` | `boolean` | 是否显示3D建筑 |
| `labelsEnabled` | `boolean` | 是否显示标注 |
| `compassEnabled` | `boolean` | 是否显示指南针 |
| `zoomControlsEnabled`| `boolean` | 是否显示缩放按钮 (@platform android) |
| `scaleControlsEnabled`| `boolean` | 是否显示比例尺 |
| `customMapStyle` | `object` | 自定义地图样式（支持 `styleId` 或本地 `styleDataPath`） |

### 核心事件 (Events)

| 事件 | 参数类型 | 说明 |
|----------|----------|--------------|
| `onLoad` | `{}` | 地图加载完成 |
| `onMapPress` | `LatLng` | 点击地图 |
| `onMapLongPress` | `LatLng` | 长按地图 |
| `onCameraMove` | `CameraEvent` | 地图状态改变 (实时) |
| `onCameraIdle` | `CameraEvent` | 地图状态改变完成 |
| `onLocation` | `LocationEvent` | 定位更新 |
| `onPressPoi` | `MapPoi` | 点击标注点 (POI) |

### 相机控制 (MapViewRef)

```ts
const mapRef = useRef<MapViewRef>(null);

// 移动相机
await mapRef.current?.moveCamera({
  target: { latitude: 39.9, longitude: 116.4 },
  zoom: 10,
  tilt: 45,
  bearing: 90
}, 1000); // 1000ms 动画

// 获取屏幕坐标对应的经纬度
const latLng = await mapRef.current?.getLatLng({ x: 100, y: 100 });

// 截图
const snapshotPath = await mapRef.current?.takeSnapshot();
```

## 深度挖掘

### CameraPosition 详解
`CameraPosition` 包含四个维度：
1. `target`: 中心点坐标 `{ latitude, longitude }`。
2. `zoom`: 缩放级别，范围通常为 3-20。
3. `bearing`: 朝向角度，0 表示正北，顺时针旋转。
4. `tilt`: 倾斜角度，0 表示垂直俯视，最大约 60 度。

### 自定义样式 (Custom Map Style)
支持在线样式和离线样式：
- **在线**: `customMapStyle={{ styleId: 'your_style_id' }}`
- **离线**: `customMapStyle={{ styleDataPath: 'path/to/data', extraStyleDataPath: '...' }}`

### 手势控制
可以通过 `zoomGesturesEnabled`、`scrollGesturesEnabled`、`rotateGesturesEnabled` 和 `tiltGesturesEnabled` 分别控制各种交互行为。

### 常见陷阱
1. **坐标系转换**: 库内方法（如 `coordinateConvert`）可用于将 GPS 坐标转换为高德 GCJ-02 坐标。
2. **异步执行**: `MapViewRef` 的方法返回 Promise，确保在调用前地图已加载（可通过 `onLoad` 事件确认）。
