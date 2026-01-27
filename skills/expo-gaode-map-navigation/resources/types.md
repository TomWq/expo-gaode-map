---
title: Navigation Types Reference
impact: HIGH
tags: types, typescript, interfaces, enums, navigation
---

# 导航参考: 类型定义 (Types)

`expo-gaode-map-navigation` 提供了导航相关的类型定义。

## 1. 路径规划请求

### 驾车/货车规划参数
```typescript
/**
 * 驾车路径规划参数
 */
export interface DriveRouteOptions {
    from?: LatLng;          // 起点 (不填则为当前位置)
    to: LatLng;             // 终点
    strategy?: DriveStrategy;// 算路策略
    waypoints?: LatLng[];   // 途经点
    avoidPolygons?: LatLng[][]; // 避让区域
    carNumber?: string;     // 车牌号 (限行用)
}

/**
 * 货车路径规划参数
 */
export interface TruckRouteOptions extends DriveRouteOptions {
    size: TruckSize;        // 货车大小
    height: number;         // 高度 (米)
    width: number;          // 宽度 (米)
    load: number;           // 载重 (吨)
    weight: number;         // 自重 (吨)
    axis: number;           // 轴数
}
```

### 策略枚举
```typescript
export enum DriveStrategy {
    FASTEST = 0,            // 速度优先
    FEE_FIRST = 1,          // 费用优先
    SHORTEST = 2,           // 距离最短
    AVOID_CONGESTION = 4,   // 躲避拥堵
    NO_HIGHWAY = 8,         // 不走高速
    AVOID_COST = 16         // 避免收费
    // 可组合使用
}

export enum TruckSize {
    MINI = 1,               // 微型
    LIGHT = 2,              // 轻型
    MEDIUM = 3,             // 中型
    HEAVY = 4               // 重型
}
```

## 2. 独立算路 (Independent Route)

### 算路结果
```typescript
/**
 * 独立算路结果
 */
export interface IndependentRouteResult {
    token: string;          // 算路会话 Token (用于后续操作)
    routeCount: number;     // 方案数量
    routes: RouteInfo[];    // 路线详情列表
}

export interface RouteInfo {
    routeId: number;
    distance: number;       // 距离 (米)
    time: number;           // 时间 (秒)
    toll: number;           // 费用
    trafficLights: number;  // 红绿灯数
    strategy: string;       // 策略标签
}
```

## 3. 导航视图 (NaviView)

### 组件属性
```typescript
export interface NaviViewProps extends ViewProps {
    naviType?: NaviType;    // 导航类型
    showMode?: NaviShowMode;// 显示模式
    naviMode?: NaviMode;    // 导航视角
    
    // UI 开关
    enableVoice?: boolean;
    showCrossImage?: boolean; // 路口放大图
    showTrafficButton?: boolean;
    showBrowseRouteButton?: boolean;
    showMoreButton?: boolean;
    
    // 事件
    onNaviInfoUpdate?: (event: { nativeEvent: NaviInfo }) => void;
    onArrive?: () => void;
    onCalculateRouteSuccess?: () => void;
    onCalculateRouteFailure?: (event: { nativeEvent: { code: number } }) => void;
}

export enum NaviType {
    GPS = 0,
    EMULATOR = 1
}
```

### 导航信息更新
```typescript
export interface NaviInfo {
    routeRemainDistance: number; // 剩余总距离
    routeRemainTime: number;     // 剩余总时间
    currentRoadName: string;     // 当前路名
    nextRoadName: string;        // 下一条路名
    iconType: number;            // 导航转向图标ID
    stepRemainDistance: number;  // 当前路段剩余距离
}
```
