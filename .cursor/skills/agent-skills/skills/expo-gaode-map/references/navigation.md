---
title: Navigation
impact: HIGH
tags: navigation, route-calculation, navi-view, drive, walk, ride
---

# Skill: Navigation

提供路径规划（驾车、步行、骑行、货车）及原生导航界面。

## 快速参考

### 路径规划 (calculateRoute)
```ts
import { calculateDriveRoute, RouteType, DriveStrategy } from 'expo-gaode-map-navigation';

// 驾车路径规划
const result = await calculateDriveRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST,
  waypoints: [{ latitude: 39.905, longitude: 116.405 }]
});

console.log(`Found ${result.paths.length} routes`);
```

### 原生导航界面 (NaviView)
```tsx
import { NaviView } from 'expo-gaode-map-navigation';

<NaviView
  style={{ flex: 1 }}
  naviType={0} // 0: GPS 导航, 1: 模拟导航
  onNaviStart={() => console.log('Navigation started')}
  onNaviInfoUpdate={(event) => {
    const { currentRoadName, pathRetainDistance } = event.nativeEvent;
    console.log(`Next: ${currentRoadName}, Left: ${pathRetainDistance}m`);
  }}
  onNaviArrive={() => console.log('Arrived!')}
/>
```

### 独立路径管理 (IndependentRoute)
用于在地图上绘制多条备选路线：
```ts
import { IndependentRouteManager } from 'expo-gaode-map-navigation';

// 计算并显示备选路线
await IndependentRouteManager.calculateDriveRoute({
  from: start,
  to: end,
  strategy: DriveStrategy.AVOID_CONGESTION
});

// 选择其中一条路线
await IndependentRouteManager.selectRoute(0);

// 清除路线
await IndependentRouteManager.clearRoute();
```

## 快速模式

### ✅ 正确：在导航前初始化
```ts
import { initNavigation } from 'expo-gaode-map-navigation';

// 在 App 入口或导航页面挂载时调用
initNavigation();
```

### ✅ 正确：及时销毁计算器
```ts
import { destroyAllCalculators } from 'expo-gaode-map-navigation';

// 页面卸载时释放资源，避免 "Another route calculation is in progress" 错误
useEffect(() => {
  return () => destroyAllCalculators();
}, []);
```

### ❌ 错误：在非原生环境下使用 NaviView
`NaviView` 是原生组件，无法在 Expo Go 中直接运行，必须在 Development Build 环境下使用。

## 何时使用

- 实现应用内的一键导航功能。
- 展示复杂的路径规划结果（多方案对比）。
- 实时监听导航状态（剩余距离、当前路名、语音播报文本）。

## 深度挖掘

### 导航策略 (Strategy)
- **驾车**: `FASTEST` (时间最短), `FEE_FIRST` (费用优先), `SHORTEST` (距离最短), `AVOID_CONGESTION` (避堵)。
- **骑行**: `DEFAULT`, `FASTEST`, `SHORTEST`。

### 常见陷阱
1. **并发计算**: 高德 SDK 不支持同时进行多个路径计算。如果上一个计算未完成就发起下一个，会报错。务必使用 `destroyAllCalculators` 或等待 Promise 返回。
2. **语音播报**: `NaviView` 默认开启语音播报，如需自定义播放逻辑，可监听 `onPlayVoice` 事件并设置 `enableVoice={false}`。
3. **货车导航**: 货车路径规划需要提供车辆信息（重量、轴数、高度等），否则结果可能不准确或无法规划。
