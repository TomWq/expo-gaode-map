# 导航 API 参考

**源文件**: `packages/navigation/src`

提供高德导航的核心组件与功能模块，涵盖 UI 展示、路径规划及高级算路能力。

## 1. ExpoGaodeMapNaviView (导航组件)

直接嵌入式导航 UI 组件，提供高度可定制的导航界面。

### 核心属性 (Props)

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `naviType` | `number` | `0` | `0`: GPS 导航, `1`: 模拟导航 |
| `showMode` | `number` | `1` | `1`: 锁车态, `2`: 全览态, `3`: 普通态 |
| `naviMode` | `number` | `0` | `0`: 车头朝上, `1`: 正北朝上 |
| `enableVoice` | `boolean` | `true` | 是否启用语音播报 |
| `showCamera` | `boolean` | `true` | 是否显示电子眼 |
| `showTrafficButton` | `boolean` | `true` | 是否显示实时路况按钮 |
| `showTrafficBar` | `boolean` | `true` | 是否显示路况光柱 |
| `autoLockCar` | `boolean` | `true` | 操作地图后是否自动回正锁车 |
| `isNightMode` | `boolean` | `false` | 是否开启夜间模式 |

### 核心事件 (Events)

| 事件名 | 说明 | 数据结构示例 |
| :--- | :--- | :--- |
| `onNaviInfoUpdate` | 导航信息更新 | `{ pathRetainDistance: 100, currentRoadName: '长安街', iconType: 2 }` |
| `onArrive` | 到达目的地 | `{ arrived: true }` |
| `onCalculateRouteSuccess` | 算路成功 | `{ routeIds: [1, 2], success: true }` |
| `onCalculateRouteFailure` | 算路失败 | `{ error: '网络异常', errorCode: 12 }` |

### 方法 (Ref)

```ts
// 需通过 ref 调用
ref.current.startNavigation(startPoint, endPoint, naviType);
ref.current.stopNavigation();
```

## 2. 路径规划 (Route Functions)

提供多种出行方式的路径计算能力。

### 支持类型
- **驾车**: `calculateDriveRoute` (支持多策略、限行、避让区域)
- **步行**: `calculateWalkRoute`
- **骑行**: `calculateRideRoute`
- **货车**: `calculateTruckRoute` (支持车型、载重、轴数配置)
- **摩托车**: `calculateMotorcycleRoute` (支持排量配置)

### 策略枚举 (DriveStrategy)
- `FASTEST` (速度优先)
- `AVOID_CONGESTION` (躲避拥堵)
- `SHORTEST` (距离最短)
- `NO_HIGHWAY` (不走高速)
- ...更多组合策略

## 3. 独立算路 (Independent Route)

**高级特性**：用于“行前选路”或“多方案对比”场景，计算结果不影响当前导航状态。

### 核心流程
1. **计算**: `independentDriveRoute(options)` -> 返回 `token` 和路线列表。
2. **选择**: `selectIndependentRoute({ token, routeIndex })` -> 在地图上高亮选中路线。
3. **导航**: `startNaviWithIndependentPath({ token })` -> 使用选定路线开始导航。
4. **清理**: `clearIndependentRoute({ token })` -> 释放资源。

### 应用场景
- 路线预览页面
- 出行方案对比（时间 vs 距离 vs 费用）
- 复杂路线规划（设置途经点、避让区域）
