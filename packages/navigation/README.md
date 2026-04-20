# expo-gaode-map-navigation

高德地图“导航一体化”模块。内置地图渲染能力与导航能力，提供从地图展示到路径规划、实时导航的完整解决方案。

## 特性

- 🗺️ **地图渲染**：内置完整地图能力，支持 Marker、Polyline、Polygon、Circle、Cluster、HeatMap 等覆盖物。
- 🚗 **多模式路径规划**：支持驾车、步行、骑行、电动车、货车、摩托车等多种出行方式。
- 🧭 **实时导航 UI**：提供 `NaviView` 官方嵌入视图，并暴露完整事件与原生参数，方便你自行定制导航界面。
- 🛣️ **独立路径规划**：支持“先算路、再导航”的高级模式，可实现多路线对比与选择。
- ⚙️ **策略丰富**：支持速度优先、避让拥堵、少收费、不走高速等多种算路策略。
- ✅ **开箱即用**：封装了 Android/iOS 原生导航 SDK，统一 JS 接口。

## 安装

本模块已包含地图与导航的所有能力，**不需要**、也不应同时安装 `expo-gaode-map`。

```bash
# bun
bun add expo-gaode-map-navigation

# yarn
yarn add expo-gaode-map-navigation

# npm
npm install expo-gaode-map-navigation
```

**⚠️ 重要提示：**
如果项目中已安装 `expo-gaode-map`，请务必先卸载，否则会导致 Android 端二进制冲突（`3dmap` vs `navi-3dmap`）。`expo-gaode-map` 和 `expo-gaode-map-navigation` 由于 SDK 冲突不能同时安装，二选一使用。


### Config Plugin 配置（推荐）

在 `app.json` 中配置，自动设置原生 API Key 和权限：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map-navigation", 
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key"
        }
      ]
    ]
  }
}
```
配置后重新构建：

```bash
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```

## 示例工程

仓库内提供了可直接运行的 [`example-navigation`](/Volumes/xinxin/expo-gaode-map/example-navigation/README.md) 示例工程，专门用于验证导航能力。

推荐场景：

- 调试 `NaviView` 与示例工程里的自定义 HUD / 车道 HUD / 路况光柱
- 对比官方黑盒页、官方嵌入式页、自绘嵌入式页
- 验证独立算路、多路线选择、近似跟线导航

快速运行：

```bash
cd example-navigation
cp .env.example .env
npm install
npx expo run:android
```

如需 iOS：

```bash
cd example-navigation
cp .env.example .env
npm install
npx pod-install ios
npx expo run:ios
```


## 快速开始

### 1. 显示地图

使用内置的 `MapView` 组件显示地图：

```tsx
import React from 'react';
import { View } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map-navigation';

export default function BasicMapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialCameraPosition={{
          target: { latitude: 39.909186, longitude: 116.397411 },
          zoom: 15,
        }}
      >
        <Marker
          position={{ latitude: 39.909186, longitude: 116.397411 }}
          title="天安门"
        />
      </MapView>
    </View>
  );
}
```

### 2. 嵌入导航视图

使用 `NaviView` 组件直接嵌入导航界面：

```tsx
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { NaviView, type NaviViewRef } from 'expo-gaode-map-navigation';

export default function NavigationScreen() {
  const naviRef = useRef<NaviViewRef>(null);

  useEffect(() => {
    // 延迟 1 秒后开始导航
    const timer = setTimeout(() => {
      if (naviRef.current) {
        naviRef.current.startNavigation(
          { latitude: 39.909186, longitude: 116.397411 }, // 起点
          { latitude: 39.99, longitude: 116.47 },         // 终点
          0 // 0: GPS导航, 1: 模拟导航
        );
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NaviView
        ref={naviRef}
        style={{ flex: 1 }}
        showCamera={true} // 显示摄像头
        enableVoice={true} // 开启语音
      />
    </View>
  );
}
```

### 3. 自定义嵌入式导航 UI

如果你要做“嵌入在自己页面里的导航页”，库本身提供的是底层 `NaviView`、导航事件和原生参数；完整的自定义 HUD / 车道 HUD / 路况光柱参考实现，已经迁移到仓库内的 [`example-navigation`](/Volumes/xinxin/expo-gaode-map/example-navigation/README.md)。

建议做法：

- 用 `NaviView` 负责底层导航地图、语音、车道事件、路况事件、路口大图事件
- 用 `onNaviInfoUpdate`、`onLaneInfoUpdate`、`onTrafficStatusesUpdate`、`onNaviVisualStateChange` 在业务侧自绘 HUD
- 直接参考 `example-navigation/lib/navigation-ui/EmbeddedNaviView.tsx` 及配套 UI 文件，按你的产品需求裁剪

注意：

- Android 官方嵌入式 `NaviView` 在部分 React Native / Expo 宿主中，顶部信息区、车道条、路口大图联动效果可能与高德官方 Demo 不完全一致
- 如果你要验证官方嵌入式 UI 本身，请直接跑 `example-navigation` 里的 `official-embedded` 示例页
- 如果你要交付稳定的嵌入式导航页，建议以示例工程里的“自定义 UI 导航界面”作为起点

## 详细用法

### 路径规划 (API)

使用 `calculateRoute` 方法进行路径计算，不涉及 UI 显示，适合用于获取距离、时间或绘制路线。

#### 驾车路径规划

```typescript
import { calculateRoute, RouteType, DriveStrategy } from 'expo-gaode-map-navigation';

const result = await calculateRoute({
  type: RouteType.DRIVE,
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST, // 速度优先
  avoidRoad: '京通快速路', // 避让道路名称
  avoidPolygons: [
    [
      { latitude: 39.905, longitude: 116.395 },
      { latitude: 39.905, longitude: 116.405 },
      { latitude: 39.915, longitude: 116.405 },
      { latitude: 39.915, longitude: 116.395 },
    ],
  ],
});

console.log(`总距离: ${result.routes[0].distance}米`);
console.log(`预计耗时: ${result.routes[0].duration}秒`);
```

说明：

- 当传入 `avoidRoad` 或 `avoidPolygons` 时，`calculateRoute` / `calculateDriveRoute` 会优先尝试通过 `expo-gaode-map-web-api` 获取官方“规避后路线预览”结果。
- 该回退仅用于路线预览与地图绘制；Web API 返回的是 polyline，不是导航 SDK 可直接启动的 `routeGroup/path`。
- 如果未安装 `expo-gaode-map-web-api`，则保持原有原生驾车算路逻辑不变。Android 仍可能命中底层 SDK 的避让重载；iOS 则没有官方导航 SDK 接口可直接消费任意规避道路/区域。

#### 步行/骑行路径规划

```typescript
import { calculateRoute, RouteType, RideStrategy } from 'expo-gaode-map-navigation';

// 骑行
const rideResult = await calculateRoute({
  type: RouteType.RIDE,
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: RideStrategy.FASTEST,
});

// 步行
const walkResult = await calculateRoute({
  type: RouteType.WALK,
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  multiple: true, // 返回多条路线
});
```

#### 货车路径规划

```typescript
import { calculateRoute, RouteType, TruckSize } from 'expo-gaode-map-navigation';

const truckResult = await calculateRoute({
  type: RouteType.TRUCK,
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  size: TruckSize.MEDIUM, // 中型货车
  height: 3.5, // 高度 3.5m
  load: 10,    // 载重 10吨
});
```

### 独立路径规划 (Advanced)

“独立路径规划”允许你先计算路线，并在地图上展示多条方案，用户选择其中一条后再开始导航。这通常比直接开始导航体验更好。

注意：`independentDriveRoute` 仍然依赖导航 SDK 自身的独立算路能力，因此这里不接 Web API 的规避预览结果。若你需要“规避道路/区域后再开始导航”，建议先用 `calculateRoute` 做预览与确认，再按终点重新发起原生导航。

```typescript
import {
  independentDriveRoute,
  selectIndependentRoute,
  startNaviWithIndependentPath,
  DriveStrategy
} from 'expo-gaode-map-navigation';

// 1. 发起算路（不会自动开始导航）
const result = await independentDriveRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.AVOID_CONGESTION,
});

// 2. 选择某一条路线（例如 index=1 的路线）
// 这通常配合地图上的点击事件，高亮显示某条路线
await selectIndependentRoute({
  routeId: result.routes[1].id
});

// 3. 使用当前选中的路线开始导航
await startNaviWithIndependentPath({
  emulator: true, // 开启模拟导航
});
```

### 近似跟线导航（第一版）

当你已经通过 Web API 拿到一条想要的路线，但导航 SDK 不能直接吃这条 `polyline` 时，可以使用 `followWebPlannedRoute`。

它会：

- 从 Web 路线提炼一组途经锚点
- 用这些锚点重新发起原生独立算路
- 选择最接近 Web 路线的一条原生路线
- 仅在匹配足够接近时才启动导航

```typescript
import { followWebPlannedRoute } from 'expo-gaode-map-navigation';

const result = await followWebPlannedRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  webRoute: {
    polyline: webResult.routes[0].polyline ?? [],
  },
  maxViaPoints: 8,
  maxDeviationMeters: 120,
  startNavigation: true,
  naviType: 1, // 1 = 模拟导航
});

console.log(result.mode); // matched | approximate | preview_only
console.log(result.anchorWaypoints);
console.log(result.candidateMatches);
```

说明：

- 这不是“强制按 Web 线导航”，而是“尽量贴近 Web 线”。
- 若返回 `preview_only`，说明原生导航 SDK 算出的路线与 Web 线路偏差过大，建议仅做预览，不要直接开导航。
- 若你只想拿锚点，不立即导航，可以单独使用 `buildAnchorWaypointsFromWebRoute`。

如果你希望继续使用嵌入式官方导航 UI，可以先完成近似跟线选路，再通过 `ExpoGaodeMapNaviView` 的 ref 使用独立路径启动：

```typescript
const matchResult = await followWebPlannedRoute({
  from,
  to,
  webRoute,
  startNavigation: false,
});

if (matchResult.mode !== 'preview_only') {
  await naviRef.current?.startNavigationWithIndependentPath(matchResult.token, {
    routeId: matchResult.selectedRouteId,
    routeIndex: matchResult.selectedRouteIndex,
    naviType: 1,
  });
}
```

### 官方导航页（openOfficialNaviPage）

新增支持直接调起高德官方导航组件（Android: `AmapNaviPage`，iOS: `AMapNaviCompositeManager`）。

```typescript
import { openOfficialNaviPage } from 'expo-gaode-map-navigation';

await openOfficialNaviPage({
  to: { latitude: 39.908823, longitude: 116.39747, name: '终点' }, // 必填
  pageType: 'NAVI',               // ROUTE | NAVI
  startNaviDirectly: true,
  naviMode: 2,                    // 1=实时导航, 2=模拟导航（iOS 官方组件不支持模拟）
  theme: 'BLUE',                  // BLUE | WHITE | BLACK
  trafficEnabled: true,
  showCrossImage: true,
});
```

说明：

- 支持 Android / iOS 平台差异参数（如 `dayAndNightMode`、`broadcastMode`、`mapViewModeType`、`trackingMode` 等）。
- iOS 直接进导航页时需开启后台定位 `UIBackgroundModes: location`。
- iOS 官方导航组件模式不支持模拟导航；若传 `naviMode: 2` 会直接返回错误提示。
- Android 依赖 `AmapRouteActivity`，Config Plugin 会自动注入 Manifest。

### 地图组件 (Map)

模块导出了完整的地图组件，与 `expo-gaode-map` API 保持一致。

```tsx
import { MapView, Circle, Polygon } from 'expo-gaode-map-navigation';

<MapView style={{ flex: 1 }}>
  {/* 圆形覆盖物 */}
  <Circle
    center={{ latitude: 39.9, longitude: 116.4 }}
    radius={1000}
    fillColor="rgba(0,0,255, 0.3)"
    strokeColor="rgba(0,0,255, 0.5)"
  />
  
  {/* 多边形 */}
  <Polygon
    points={[
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.91, longitude: 116.41 },
      { latitude: 39.92, longitude: 116.42 },
    ]}
    strokeWidth={2}
  />
</MapView>
```

### 视口控制

导航包的 `MapViewRef` 同样支持：

- `moveCamera(position, duration?)`
- `getCameraPosition()`
- `fitToCoordinates(points, options?)`

```tsx
await mapRef.current?.fitToCoordinates(routePoints, {
  duration: 500,
  paddingFactor: 0.2,
  maxZoom: 18,
});
```

注意：

- 这里的用户层 API 形状尽量和 `expo-gaode-map` 保持一致
- 但底层地图实现仍然绑定导航 SDK，不与 `core` 共用同一套 MapView 实现

### 公交算路 fallback（回退）

`calculateTransitRoute` 会在运行时回退到 `expo-gaode-map-web-api`：

```ts
import { calculateTransitRoute, RouteType } from 'expo-gaode-map-navigation';

const result = await calculateTransitRoute({
  type: RouteType.TRANSIT,
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  city1: '010',
  city2: '010',
});
```

使用前请确认：

- 已安装 `expo-gaode-map-web-api`
- 已在 `ExpoGaodeMapModule.initSDK({ webKey })` 中提供 `webKey`

如果缺少依赖或 `webKey`，运行时会抛出明确错误。

### API 边界

- 导航包内置地图能力，但地图实现与 `expo-gaode-map` 独立维护
- 用户层输入输出会尽量与核心包保持一致，例如 `LatLngPoint`、`fitToCoordinates`
- 可共享的范围仅限纯 TS 的 route / AOI 数据适配工具、文档和测试思路
- 原生地图桥接、overlay 宿主逻辑、MapView facade 不会和核心包合并

## API 参考

### DriveStrategy (驾车策略)

| 值 | 说明 |
|---|---|
| `FASTEST` (0) | 速度优先（时间最短） |
| `FEE_FIRST` (1) | 费用优先（少收费） |
| `SHORTEST` (2) | 距离优先 |
| `NO_HIGHWAY` (5) | 不走高速 |
| `AVOID_CONGESTION` (4) | 躲避拥堵 |
| ... | 更多策略请参考类型定义 |

### 自定义嵌入式 UI 参考实现

库不再直接导出 `EmbeddedNaviView` 这类成品 UI 组件；这部分实现现在放在示例工程里，便于你直接查看和复制。

参考文件：

- `example-navigation/lib/navigation-ui/EmbeddedNaviView.tsx`
- `example-navigation/lib/navigation-ui/EmbeddedNaviHud.tsx`
- `example-navigation/lib/navigation-ui/EmbeddedNaviLaneView.tsx`
- `example-navigation/lib/navigation-ui/EmbeddedNaviTrafficBar.tsx`

这套示例实现演示了：

- 默认 `showUIElements={false}` 的完整自定义 UI 模式
- 基于 `driveViewEdgePadding` / `screenAnchor` 的嵌入式地图可视区域管理
- 基于 `onNaviInfoUpdate` 的顶部 HUD
- 基于 `onLaneInfoUpdate` 的自绘车道 HUD
- 基于 `onTrafficStatusesUpdate` 的自绘路况光柱
- “全览 / 锁车”与路况开关等浮层控制按钮

### NaviView Props

| 属性 | 类型 | 说明 |
|---|---|---|
| `naviType` | number | 导航类型（0: GPS, 1: 模拟） |
| `realCrossDisplay` | boolean | 是否显示路口放大图 |
| `showCamera` | boolean | 是否显示摄像头 |
| `carImage` | string \| ImageSourcePropType | 自定义导航车标；iOS 映射 `setCarImage`，Android 映射 `setCarBitmap` |
| `startPointImage` | string \| ImageSourcePropType | 自定义起点标注图 |
| `wayPointImage` | string \| ImageSourcePropType | 自定义途经点标注图 |
| `endPointImage` | string \| ImageSourcePropType | 自定义终点标注图 |
| `trafficLayerEnabled` | boolean | 是否显示实时交通路况线 |
| `showTrafficButton` | boolean | 是否显示交通按钮/交通图层开关 |
| `showDriveCongestion` | boolean | 是否显示拥堵气泡 |
| `showTrafficLightView` | boolean | 是否显示红绿灯倒计时气泡 |
| `showUIElements` | boolean | Android / iOS 均支持整体 UI 显隐 |
| `laneInfoVisible` | boolean | Android 是否显示官方车道信息 |
| `hideNativeLaneInfoLayout` | boolean | iOS 是否隐藏官方车道信息条，交给 RN 自绘 |
| `modeCrossDisplay` | boolean | Android 是否显示 3D 路口模型；iOS 当前不支持，会忽略 |
| `eyrieCrossDisplay` | boolean | Android 是否显示鹰眼路口图 |
| `secondActionVisible` | boolean | Android 是否显示辅助操作区域 |
| `backupOverlayVisible` | boolean | Android 是否显示备用路线覆盖物 |
| `androidStatusBarPaddingTop` | number | Android 顶部额外间距；若显示官方原生顶部信息区且未显式传值，封装会自动补系统状态栏高度 |
| `naviStatusBarEnabled` | boolean | Android 是否启用高德官方导航状态栏；若当前 AMap SDK 不支持该接口，则自动降级为 no-op |
| `lockZoom` | number | Android 锁车态缩放级别 |
| `lockTilt` | number | Android 锁车态倾斜角度 |
| `eagleMapVisible` | boolean | Android 是否显示鹰眼小地图 |
| `pointToCenter` | object | Android 锁车态自车锚点位置 |
| `driveViewEdgePadding` | object | iOS 导航内容边距 |
| `screenAnchor` | object | iOS 地图视图锚点 |
| `showBackupRoute` | boolean | iOS 是否显示备选路线 |
| `showEagleMap` | boolean | iOS 是否显示鹰眼小地图 |
| `enableVoice` | boolean | 是否开启语音播报 |
| `onArrive` | function | 到达目的地回调 |
| `onNaviInfoUpdate` | function | 导航信息更新（剩余距离、时间等） |
| `onLaneInfoUpdate` | function | Android / iOS 车道信息更新，用于自绘车道 HUD |

### NaviView UI 能力清单

已开放且两端都有实现：

- `showCamera`
- `autoLockCar`
- `autoChangeZoom`
- `trafficLayerEnabled`
- `realCrossDisplay`
- `naviMode`
- `showMode`
- `isNightMode`
- `showTrafficBar`
- `showTrafficButton`
- `showUIElements`
- `showGreyAfterPass`
- `showVectorline`
- `showCompassEnabled`
- `showDriveCongestion`
- `showTrafficLightView`

仅 Android 已开放：

- `carOverlayVisible`
- `fourCornersImage`
- `routeMarkerVisible`
- `naviArrowVisible`
- `laneInfoVisible`
- `modeCrossDisplay`
- `eyrieCrossDisplay`
- `secondActionVisible`
- `backupOverlayVisible`
- `androidStatusBarPaddingTop`
- `naviStatusBarEnabled`
- `lockZoom`
- `lockTilt`
- `eagleMapVisible`
- `pointToCenter`
- `isNaviTravelView`

仅 iOS 已开放：

- `hideNativeLaneInfoLayout`
- `showRoute`
- `carCompassImage`
- `cameraImage`
- `trafficBarFrame`
- `trafficBarColors`
- `showMoreButton`
- `mapViewModeType`
- `lineWidth`
- `driveViewEdgePadding`
- `screenAnchor`

关于 iOS 路口放大图能力：

- iOS 官方公开的是 `showCrossImage / hideCrossImage`
- 因此库里的 `realCrossDisplay` 对应 iOS 实景路口放大图显示控制
- Android 的 `modeCrossDisplay` 没有 iOS 对等公开接口，传入 iOS 时会被忽略
- `showBackupRoute`
- `showEagleMap`

当前这份清单里此前列出的“剩余代表项”已全部开放。

如果后续还要继续往下包，更适合继续补的是更底层的样式类配置，而不是核心导航 UI 能力。

## 注意事项

1.  **二进制冲突**：严禁与 `expo-gaode-map` 共存。本模块已包含 `3dmap` SDK。
2.  **Web API**：如果需要更灵活的 HTTP 算路（如公交跨城规划、Web端展示），推荐配合 `expo-gaode-map-web-api` 使用。
3.  **权限**：使用导航功能前，请确保应用已获取定位权限（`ACCESS_FINE_LOCATION`）。
4.  **Android 状态栏兼容性**：`naviStatusBarEnabled` 依赖高德 Android 导航 SDK 某些版本才提供的 `AMapNaviViewOptions.setNaviStatusBarEnabled(...)`。当前封装已做兼容处理：若宿主工程解析到的 SDK 不包含该方法，则不会再编译失败，而是在运行时跳过该设置并输出 warning。此时该 prop 在 Android 上等价于 no-op。
5.  **嵌入式 UI 边界**：库导出的是底层 `NaviView` 能力；完整自定义导航界面请参考 `example-navigation` 里的示例实现，它也不是高德官方黑盒导航页的 UI 替代品。


## 📚 文档与资源

- [在线文档](https://tomwq.github.io/expo-gaode-map/api/navigation.html)
- [GitHub 仓库](https://github.com/TomWq/expo-gaode-map/packages/navigation)
- [示例项目(导航)](https://github.com/TomWq/expo-gaode-map-navigation-example)
- [高德地图开放平台](https://lbs.amap.com/)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## License

MIT License
