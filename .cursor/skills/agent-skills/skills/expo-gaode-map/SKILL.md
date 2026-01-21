---
name: expo-gaode-map
description: 核心高德地图功能指南，涵盖地图视图控制、覆盖物管理、定位服务、离线地图及底层 C++ 引擎。适用于使用 Expo Gaode Map 进行地图开发、性能优化和功能扩展的任务。
license: MIT
metadata:
  author: Expo Gaode Map Team
  tags: react-native, expo, gaode-map, android, ios, native-modules
---

# Expo Gaode Map

## 概览

`expo-gaode-map` 是一个为 Expo 和 React Native 深度定制的高德地图库，采用 Expo Modules API 构建，集成了高性能的 C++ 聚合引擎和全功能的地图能力。

## 技能格式

每个参考文件都遵循以下混合格式，以便快速查询和深入理解：

- **快速模式 (Quick Pattern)**: 提供正确/错误的示例代码，用于快速模式匹配。
- **快速命令 (Quick Command)**: 用于构建、调试或管理的 Shell 命令。
- **快速配置 (Quick Config)**: 用于初始化或插件配置的代码段。
- **快速参考 (Quick Reference)**: 核心 API 或概念的摘要表。
- **深度挖掘 (Deep Dive)**: 包含使用场景、先决条件、步骤和常见陷阱的完整上下文。

## 何时应用

在以下场景中参考这些指南：
- 初始化地图并配置基本 UI (如缩放级别、地图类型)
- 实现高性能的标记 (Marker) 和点聚合 (Clustering)
- 绘制几何图形 (折线、多边形、圆形)
- 集成高德定位服务及前台服务 (Android)
- 管理离线地图下载和加载
- 调试底层 C++ 聚合引擎或原生地图性能问题

## 优先级排序的指南

| 优先级 | 类别 | 关键组件/模块 | 前缀 |
|----------|----------|--------|--------|
| 1 | 基础地图视图 | `ExpoGaodeMapView`, `MapViewRef` | `map-view-*` |
| 2 | 标记与聚合 | `Marker`, `Cluster`, `ClusterEngine` | `marker-*` |
| 3 | 几何覆盖物 | `Polyline`, `Polygon`, `Circle` | `geometry-overlays` |
| 4 | 几何计算工具 | `coordinateConvert`, `distanceBetween` | `geometry-utils` |
| 5 | 定位与追踪 | `LocationManager`, `LocationForegroundService` | `location-*` |
| 6 | 路线与导航 | `NaviView`, `calculateDriveRoute` | `navigation-*` |
| 7 | 搜索与 POI | `searchPOI`, `searchNearby` | `search-*` |
| 8 | Web 服务 | `GaodeWebAPI`, `GeocodeService` | `web-api-*` |
| 9 | 离线地图 | `ExpoGaodeMapOfflineModule` | `offline-*` |
| 10 | 高级覆盖物 | `HeatMap`, `MultiPoint` | `advanced-*` |
| 11 | 设备适配 | `FoldableMapView`, `PlatformDetector` | `device-*` |
| 12 | 原生底层 | `ClusterEngine`, `JNI`, `Bridging` | `native-*` |

## 快速参考

### 基础初始化

**App 插件配置:**
```json
// app.json
{
  "expo": {
    "plugins": [
      ["expo-gaode-map", {
        "androidKey": "YOUR_ANDROID_KEY",
        "iosKey": "YOUR_IOS_KEY",
        "enableLocation": true,
        "locationDescription": "我们需要访问您的位置信息以提供地图服务",
        "enableBackgroundLocation": false
      }]
    ]
  }
}
```

**地图使用:**
```tsx
import { ExpoGaodeMapView, MapType } from 'expo-gaode-map';

<ExpoGaodeMapView
  style={{ flex: 1 }}
  mapType={MapType.Standard}
  myLocationEnabled={true}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 15
  }}
/>
```

### 核心 API 调用

**相机控制:**
```ts
const mapRef = useRef<MapViewRef>(null);

// 移动相机 (支持 Promise)
await mapRef.current?.moveCamera({
  target: { latitude: 39.9, longitude: 116.4 },
  zoom: 10
}, 1000);
```

### 扩展包使用 (Navigation/Search/Web API)

**导航路径规划:**
```ts
import { calculateDriveRoute, DriveStrategy } from 'expo-gaode-map-navigation';
const result = await calculateDriveRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST
});
```

**POI 搜索:**
```ts
import { searchPOI } from 'expo-gaode-map-search';
const result = await searchPOI({ keyword: '酒店', city: '北京' });
```

**Web API (地理编码):**
```ts
import { GaodeWebAPI } from 'expo-gaode-map-web-api';
const api = new GaodeWebAPI();
const geo = await api.geocode.geocode('北京市朝阳区阜通东大街6号');
```

### 性能建议

- **聚合:** 对于大量数据点，务必使用 `<Cluster />` 组件，它底层调用 C++ QuadTree 引擎，比纯 JS 聚合快数倍。
- **坐标格式**: `LatLngPoint` 支持 `{ latitude, longitude }` 对象或 `[longitude, latitude]` 数组。
- **内存:** 在 Android 上，如果频繁切换地图页面，注意观察内存占用，合理利用 `cacheKey` 优化 Marker 图标性能。
- **定位:** 如果需要后台持续定位，需申请 `requestBackgroundLocationPermission` 并配置插件参数。
