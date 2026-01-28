# 核心参考: 导航 (Navigation)

提供路径规划（驾车、步行、骑行、货车）及原生导航界面。

## 快速参考

### 路径规划 (calculateRoute)
```ts
import { calculateDriveRoute, calculateTruckRoute, RouteType, DriveStrategy, TruckSize } from 'expo-gaode-map-navigation';

// 驾车规划
const result = await calculateDriveRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.AVOID_CONGESTION,
  carNumber: '京A88888' // 限行规避
});

// 货车规划 (Truck)
const truckResult = await calculateTruckRoute({
  from: start, to: end,
  size: TruckSize.MEDIUM, // 中型货车
  height: 3.5, // 3.5米
  load: 10,    // 10吨
  axis: 2      // 2轴
});
```

### 原生导航界面 (NaviView)

`NaviView` 提供了丰富的 UI 定制属性：

```tsx
<NaviView
  style={{ flex: 1 }}
  naviType={0} // 0: GPS 导航, 1: 模拟导航
  
  // 显示模式配置
  showMode={1} // 1: 锁车态 (推荐)
  naviMode={0} // 0: 车头朝上
  autoLockCar={true} // 自动回正
  
  // UI 元素控制
  showTrafficButton={true}    // 路况按钮
  showBrowseRouteButton={true}// 全览按钮
  showTrafficBar={true}       // 路况光柱 (iOS)
  realCrossDisplay={true}     // 路口放大图
  showCamera={true}           // 电子眼
  
  // Android 特有增强
  carOverlayVisible={true}    // 自车图标
  showDriveCongestion={true}  // 拥堵气泡
  showTrafficLightView={true} // 红绿灯倒计时
  
  // 导航信息回调
  onNaviInfoUpdate={(e) => {
    const { pathRetainDistance, nextRoadName, iconType } = e.nativeEvent;
    console.log(`剩余 ${pathRetainDistance}米, 下一条路: ${nextRoadName}`);
  }}
/>
```

### 控制导航 (NaviView Methods)
通过 `ref` 调用 `NaviView` 的方法：
```tsx
const naviRef = useRef<ExpoGaodeMapNaviViewRef>(null);

// 开始导航
naviRef.current?.startNavigation(
  null, // 起点（null 表示当前位置）
  { latitude: 39.9, longitude: 116.4 }, // 终点
  0 // 导航类型 (0: GPS, 1: 模拟)
);

// 停止导航
naviRef.current?.stopNavigation();
```

### 独立路径规划 (IndependentRoute)
用于行前选路（Preview Mode）：

#### 示例：完整独立算路流程
```ts
import { independentDriveRoute, selectIndependentRoute, clearIndependentRoute, startNaviWithIndependentPath, DriveStrategy } from 'expo-gaode-map-navigation';

// 1. 计算并显示备选路线
const result = await independentDriveRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.AVOID_CONGESTION
});

// 2. 选择其中一条路线（通过索引，需要传入 result.token）
await selectIndependentRoute({ token: result.token, routeIndex: 1 });

// 3. (可选) 使用该路线开始导航
await startNaviWithIndependentPath({ token: result.token, naviType: 0 });

// 4. 退出页面时清理资源
await clearIndependentRoute({ token: result.token });
```

## 深度挖掘

### 导航策略 (Strategy)
- **驾车**: `FASTEST`, `FEE_FIRST`, `SHORTEST`, `AVOID_CONGESTION`。
- **摩托车**: 通过 `calculateMotorcycleRoute` 调用，需提供 `motorcycleCC` (排量)。
- **电动车**: `calculateEBikeRoute`，支持 `usePoi` 参数优化终点吸附。

### 常见陷阱
1. **并发计算**: 高德 SDK 不支持同时进行多个路径计算。务必使用 `destroyAllCalculators` 清理。
2. **语音播报**: `NaviView` 默认开启语音播报，可设置 `enableVoice={false}` 关闭。
3. **Android 状态栏**: 可通过 `androidStatusBarPaddingTop` 调整导航栏顶部间距，适配沉浸式状态栏。
