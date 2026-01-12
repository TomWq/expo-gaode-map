
# 导航 API

`expo-gaode-map-navigation` 包提供完整的路径规划和实时导航能力。

## 概述

导航包是**独立的一体化解决方案**，内置了地图渲染和导航功能：
- ✅ **包含地图能力**：内置 MapView 和所有覆盖物组件
- ✅ **路径规划**：驾车、步行、骑行、货车、摩托车等多种方式
- ✅ **实时导航**：NaviView 组件提供完整的导航界面
- ❌ **不可与 `expo-gaode-map` 共存**：会产生 SDK 冲突

::: warning 重要提示
安装 `expo-gaode-map-navigation` 后，**不要**同时安装 `expo-gaode-map`。导航包已包含所有地图功能。
:::

## 安装

```bash
bun add expo-gaode-map-navigation
# 或
yarn add expo-gaode-map-navigation
# 或
npm install expo-gaode-map-navigation
```

## 初始化

在应用启动时初始化 SDK：

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

// 使用 Config Plugin 时，原生 Key 已自动配置，可传空对象
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // 仅在使用 Web API 时需要
});

// 不使用 Config Plugin 时，需要手动传入原生 Key
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key', // 可选
});
```

::: tip Config Plugin 自动配置
推荐使用 Config Plugin，它会自动将 API Key 配置到原生项目中，更安全且无需在代码中硬编码。
:::

## 路径规划 API

### calculateDriveRoute - 驾车路径规划

```typescript
import { calculateDriveRoute, DriveStrategy } from 'expo-gaode-map-navigation';

const result = await calculateDriveRoute({
  type: 'drive',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST, // 速度优先
  waypoints: [                      // 途经点（可选）
    { latitude: 39.905, longitude: 116.405 },
  ],
  carNumber: '京A12345',             // 车牌号（可选，用于限行）
  avoidPolygons: [                  // 避让区域（可选）
    [
      { latitude: 39.92, longitude: 116.42 },
      { latitude: 39.93, longitude: 116.43 },
    ],
  ],
});

// 返回 DriveRouteResult
console.log(result.count);          // 路线数量
console.log(result.mainPathIndex);  // 主路线索引
result.routes.forEach((route) => {
  console.log(`距离: ${route.distance}米`);
  console.log(`时间: ${route.duration}秒`);
  console.log(`收费: ${route.tollCost}元`);
  console.log(`红绿灯: ${route.trafficLightCount}个`);
});
```

**DriveStrategy 策略枚举：**

```typescript
enum DriveStrategy {
  FASTEST = 0,                         // 速度优先（时间最短）
  FEE_FIRST = 1,                       // 费用优先（不走收费）
  SHORTEST = 2,                        // 距离优先
  NO_EXPRESSWAYS = 3,                  // 不走快速路
  AVOID_CONGESTION = 4,                // 躲避拥堵
  NO_HIGHWAY = 5,                      // 不走高速
  NO_HIGHWAY_AVOID_CONGESTION = 6,     // 不走高速且避免拥堵
  AVOID_COST_CONGESTION = 7,           // 躲避收费和拥堵
  NO_HIGHWAY_AVOID_COST_CONGESTION = 8,// 不走高速且躲避收费拥堵
  AVOID_CONGESTION_COST = 9,           // 躲避拥堵和收费
}
```

### calculateWalkRoute - 步行路径规划

```typescript
import { calculateWalkRoute, TravelStrategy } from 'expo-gaode-map-navigation';

const result = await calculateWalkRoute({
  type: 'walk',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  travelStrategy: TravelStrategy.MULTIPLE, // 多路线
  // 或使用：multiple: true
});

console.log(`步行距离: ${result.distance}米`);
console.log(`预计时间: ${Math.floor(result.duration / 60)}分钟`);
```

### calculateRideRoute - 骑行路径规划

```typescript
import { calculateRideRoute, RideStrategy } from 'expo-gaode-map-navigation';

const result = await calculateRideRoute({
  type: 'ride',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: RideStrategy.FASTEST, // 速度优先
  multiple: true,
});
```

**RideStrategy 策略枚举：**

```typescript
enum RideStrategy {
  DEFAULT = 0,   // 推荐路线
  FASTEST = 1,   // 速度优先
  SHORTEST = 2,  // 距离优先
}
```

### calculateTruckRoute - 货车路径规划

```typescript
import { calculateTruckRoute, TruckSize } from 'expo-gaode-map-navigation';

const result = await calculateTruckRoute({
  type: 'truck',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  size: TruckSize.MEDIUM,  // 货车尺寸
  height: 3.5,             // 高度（米）
  width: 2.5,              // 宽度（米）
  load: 5,                 // 载重（吨）
  weight: 10,              // 总重（吨）
  axis: 2,                 // 轴数
});
```

**TruckSize 尺寸枚举：**

```typescript
enum TruckSize {
  MINI = 1,    // 微型货车
  LIGHT = 2,   // 轻型货车
  MEDIUM = 3,  // 中型货车
  HEAVY = 4,   // 重型货车
}
```

### calculateMotorcycleRoute - 摩托车路径规划

```typescript
import { calculateMotorcycleRoute } from 'expo-gaode-map-navigation';

const result = await calculateMotorcycleRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  motorcycleCC: 250,          // 排量（cc）
  carNumber: '京A12345',       // 车牌号（可选）
  strategy: DriveStrategy.FASTEST,
});
```

### calculateEBikeRoute - 电动车路径规划

```typescript
import { calculateEBikeRoute } from 'expo-gaode-map-navigation';

const result = await calculateEBikeRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  multiple: true,
});
```

## 独立路径规划 API

独立路径规划**不会影响当前导航状态**，适用于路线预览、对比和切换场景。

### independentDriveRoute - 独立驾车路径

```typescript
import { independentDriveRoute } from 'expo-gaode-map-navigation';

const result = await independentDriveRoute({
  from: {
    latitude: 39.9,
    longitude: 116.4,
    name: '起点名称',      // 可选
    poiId: 'B000A8VE1H',  // 可选，POI ID
  },
  to: {
    latitude: 39.91,
    longitude: 116.41,
    name: '终点名称',
    poiId: 'B000A8VE2I',
  },
  waypoints: [
    { latitude: 39.905, longitude: 116.405, name: '途经点1' },
  ],
  strategy: DriveStrategy.FASTEST,
  carNumber: '京A12345',
  restriction: true, // 考虑限行
});

// 返回 IndependentRouteResult
console.log(result.token);         // 用于后续操作的 token
console.log(result.count);         // 路线数量
console.log(result.mainPathIndex); // 主路线索引
console.log(result.routeIds);      // 路线ID列表
console.log(result.routes);        // 路线数组
```

### independentTruckRoute - 独立货车路径

```typescript
const result = await independentTruckRoute({
  from: { latitude: 39.9, longitude: 116.4, name: '起点' },
  to: { latitude: 39.91, longitude: 116.41, name: '终点' },
  strategy: DriveStrategy.FASTEST,
});
```

### independentWalkRoute - 独立步行路径

```typescript
const result = await independentWalkRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  multiple: true,
});
```

### independentRideRoute - 独立骑行路径

```typescript
const result = await independentRideRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  multiple: true,
});
```

### independentMotorcycleRoute - 独立摩托车路径

```typescript
const result = await independentMotorcycleRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  motorcycleCC: 250,
});
```

### selectIndependentRoute - 选择独立路线

```typescript
import { selectIndependentRoute } from 'expo-gaode-map-navigation';

// 方式1：使用路线索引
await selectIndependentRoute({
  token: result.token,
  routeIndex: 1, // 从0开始
});

// 方式2：使用路线ID
await selectIndependentRoute({
  token: result.token,
  routeId: result.routeIds[1],
});
```

### startNaviWithIndependentPath - 使用独立路线启动导航

```typescript
import { startNaviWithIndependentPath } from 'expo-gaode-map-navigation';

await startNaviWithIndependentPath({
  token: result.token,
  naviType: 0,      // 0=GPS导航, 1=模拟导航
  routeIndex: 0,    // 可选，不传则使用当前主路线
});
```

### clearIndependentRoute - 清理独立路线

```typescript
import { clearIndependentRoute } from 'expo-gaode-map-navigation';

await clearIndependentRoute({
  token: result.token,
});
```

### 完整示例：路线预览与切换

```typescript
// 1. 规划多条路线
const routes = await independentDriveRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
});

// 2. 展示路线列表
routes.routes.forEach((route, index) => {
  console.log(`路线 ${index + 1}:`);
  console.log(`  距离: ${(route.distance / 1000).toFixed(2)}公里`);
  console.log(`  时间: ${Math.floor(route.duration / 60)}分钟`);
  console.log(`  收费: ${route.tollCost}元`);
});

// 3. 用户选择路线2
await selectIndependentRoute({
  token: routes.token,
  routeIndex: 1,
});

// 4. 启动导航
await startNaviWithIndependentPath({
  token: routes.token,
  naviType: 0, // GPS导航
});

// 5. 导航结束后清理
await clearIndependentRoute({
  token: routes.token,
});
```

## NaviView 导航组件

`NaviView` 是高德官方提供的完整导航界面组件。

### 基础用法

```typescript
import React, { useRef } from 'react';
import { NaviView, type NaviViewRef } from 'expo-gaode-map-navigation';

function NavigationScreen() {
  const naviViewRef = useRef<NaviViewRef>(null);

  const startNavigation = async () => {
    await naviViewRef.current?.startNavigation(
      { latitude: 39.9, longitude: 116.4 },   // 起点（null=当前位置）
      { latitude: 39.91, longitude: 116.41 }, // 终点
      1  // 0=GPS导航, 1=模拟导航
    );
  };

  const stopNavigation = async () => {
    await naviViewRef.current?.stopNavigation();
  };

  return (
    <NaviView
      ref={naviViewRef}
      style={{ flex: 1 }}
      naviType={1}
      enableVoice={true}
      showCamera={true}
      onNaviStart={(e) => console.log('导航开始')}
      onNaviEnd={(e) => console.log('导航结束')}
      onArrive={(e) => console.log('到达目的地')}
      onNaviInfoUpdate={(e) => {
        const { pathRetainDistance, pathRetainTime } = e.nativeEvent;
        console.log(`剩余: ${pathRetainDistance}米`);
      }}
    />
  );
}
```

### NaviView 属性参考

#### 核心属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `naviType` | `number` | `0` | 导航类型：`0`=GPS导航, `1`=模拟导航 |
| `enableVoice` | `boolean` | `true` | 是否启用语音播报 |
| `showCamera` | `boolean` | `true` | 是否显示摄像头提示 |
| `autoLockCar` | `boolean` | `true` | 是否自动锁车 |
| `autoChangeZoom` | `boolean` | `true` | 是否自动缩放地图 |
| `trafficLayerEnabled` | `boolean` | `true` | 是否显示交通路况 |
| `realCrossDisplay` | `boolean` | `true` | 是否显示路口放大图 |
| `naviMode` | `number` | `0` | 视角模式：`0`=车头朝上, `1`=正北朝上 |
| `showMode` | `number` | `1` | 显示模式：`1`=锁车态, `2`=全览态, `3`=普通态 |
| `isNightMode` | `boolean` | `false` | 是否开启夜间模式 |
| `naviArrowVisible` | `boolean` | `true` | 是否显示路线转向箭头 |
| `showTrafficBar` | `boolean` | `true` | 是否显示路况光柱 |
| `showBrowseRouteButton` | `boolean` | `true` | 是否显示全览按钮 |
| `showTrafficButton` | `boolean` | `true` | 是否显示实时交通按钮 |
| `showUIElements` | `boolean` | `true` | 是否显示界面元素（ios默认不支持，后续支持） |
| `showVectorline` | `boolean` | `true` | 是否显示牵引线 |
| `showGreyAfterPass` | `boolean` | `false` | 走过的路线是否置灰 |
| `showTrafficLights` | `boolean` | `true` | 是否显示红绿灯图标 |

#### Android 特有属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `carOverlayVisible` | `boolean` | `true` | 是否显示自车和罗盘 |
| `showDriveCongestion` | `boolean` | `true` | 是否显示拥堵气泡（v10.0.5+） |
| `showTrafficLightView` | `boolean` | `true` | 是否显示红绿灯倒计时（v10.0.5+） |
| `routeMarkerVisible` | `object` | - | 路线标记点配置（见下文） |
| `isNaviTravelView` | `boolean` | `false` | 设置是否为骑步行视图 |
| `showCompassEnabled` | `boolean` | `true` | 是否显示罗盘 |
| `androidStatusBarPaddingTop` | `number` | `状态栏高度` | 导航试图的顶部 padding 值，用于适配状态栏高度 |

**routeMarkerVisible 配置：**

```typescript
<NaviView
  routeMarkerVisible={{
    showStartEndVia: true,      // 显示起终途点
    showFootFerry: true,         // 显示步行轮渡扎点
    showForbidden: true,         // 显示禁行限行封路icon
    showRouteStartIcon: true,    // 显示路线起点icon（v9.0.0+）
    showRouteEndIcon: true,      // 显示路线终点icon（v9.0.0+）
  }}
/>
```

#### iOS 特有属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showRoute` | `boolean` | `true` | 是否显示路线 |
| `showMoreButton` | `boolean` | `true` | 是否显示更多按钮 |
| `mapViewModeType` | `number` | `0` | 地图样式：`0`=白天, `1`=黑夜, `2`=自动, `3`=自定义 |
| `lineWidth` | `number` | - | 路线polyline宽度（0恢复默认） |

### NaviView 事件

#### onNaviStart - 导航开始

```typescript
onNaviStart={(e) => {
  const { type } = e.nativeEvent;
  console.log(`导航开始，类型: ${type === 1 ? '模拟' : 'GPS'}`);
}}
```

#### onNaviEnd - 导航结束

```typescript
onNaviEnd={(e) => {
  const { reason } = e.nativeEvent;
  console.log(`导航结束: ${reason}`);
}}
```

#### onArrive - 到达目的地

```typescript
onArrive={(e) => {
  console.log('已到达目的地');
}}
```

#### onNaviInfoUpdate - 实时导航信息

```typescript
onNaviInfoUpdate={(e) => {
  const {
    pathRetainDistance,  // 剩余距离（米）
    pathRetainTime,      // 剩余时间（秒）
    currentRoadName,     // 当前道路名称
    nextRoadName,        // 下一道路名称
    currentSpeed,        // 当前速度（米/秒）
    iconType,            // 转向图标类型
    iconDirection,       // 转向方向
  } = e.nativeEvent;
}}
```

#### onCalculateRouteSuccess - 路径规划成功

```typescript
onCalculateRouteSuccess={(e) => {
  const { routeIds } = e.nativeEvent;
  console.log('路径规划成功');
}}
```

#### onCalculateRouteFailure - 路径规划失败

```typescript
onCalculateRouteFailure={(e) => {
  const { error, errorCode } = e.nativeEvent;
  console.error(`规划失败: ${error}`);
}}
```

#### onReCalculate - 路线重算

```typescript
onReCalculate={(e) => {
  const { reason } = e.nativeEvent;
  console.log(`路线重算: ${reason}`);
}}
```

#### onPlayVoice - 语音播报

```typescript
onPlayVoice={(e) => {
  const { text } = e.nativeEvent;
  console.log(`语音: ${text}`);
}}
```

#### onGpsSignalWeak - GPS信号弱

```typescript
onGpsSignalWeak={(e) => {
  const { isWeak } = e.nativeEvent;
  if (isWeak) console.warn('GPS信号弱');
}}
```

## 工具方法

### destroyAllCalculators

销毁所有路径计算器，释放资源。

```typescript
import { destroyAllCalculators } from 'expo-gaode-map-navigation';

// 页面卸载时调用
useEffect(() => {
  return () => {
    destroyAllCalculators();
  };
}, []);
```

## 类型定义

### RouteResult

```typescript
interface RouteResult {
  id: number;
  distance: number;           // 距离（米）
  duration: number;           // 时间（秒）
  start: Coordinates;
  end: Coordinates;
  polyline?: Coordinates[];   // 路径坐标点
  segments?: RouteStep[];     // 路径步骤
  tollCost?: number;          // 收费（元）
  tollDistance?: number;      // 收费距离（米）
  trafficLightCount?: number; // 红绿灯数量
  restrictionInfo?: string;   // 限行说明
}
```

### DriveRouteResult

```typescript
interface DriveRouteResult {
  count: number;
  mainPathIndex: number;
  routes: RouteResult[];
  routeIds?: number[];
  taxiCost?: number;
}
```

## 常见问题

### 1. 与 expo-gaode-map 冲突

**问题：** 同时安装导致编译错误。

**解决：**
```bash
npm uninstall expo-gaode-map
npm install expo-gaode-map-navigation
```

### 2. "Another route calculation is in progress"

**问题：** 连续规划路径时报错。

**解决：** 页面卸载时清理：
```typescript
useEffect(() => {
  return () => destroyAllCalculators();
}, []);
```

### 3. NaviView 启动导航无反应

**问题：** startNavigation 调用后没有效果。

**解决：**
- 确保视图已渲染（使用 setTimeout 延迟）
- 检查坐标是否正确
- 查看 onCalculateRouteFailure 错误信息

```typescript
setShowNavi(true);
setTimeout(async () => {
  await naviViewRef.current?.startNavigation(start, end, 1);
}, 500);
```

### 4. 如何使用当前位置作为起点

```typescript
// 方式1：传 null
await naviViewRef.current?.startNavigation(
  null,  // 使用当前位置
  destination,
  0
);

// 方式2：先获取当前位置
const location = await ExpoGaodeMapModule.getCurrentLocation();
await naviViewRef.current?.startNavigation(
  { latitude: location.latitude, longitude: location.longitude },
  destination,
  0
);
```

## 相关链接

- [地图 API](/api/mapview) - MapView 组件（导航包内置）
- [覆盖物 API](/api/overlays) - 覆盖物组件
- [Web API](/api/web-api) - Web 服务API