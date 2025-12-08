import type { RouteResult } from './route.types';

/**
 * 独立路径规划返回结构（不会影响当前导航状态）
 *
 * - routes: 可直接用于路线预览（与普通算路的 RouteResult 结构一致）
 * - mainPathIndex: 主路线索引（调用 startNaviWithPath 前可选路）
 */
export interface IndependentRouteResult {
  independent: true;
  token: number;
  count: number;
  mainPathIndex: number;
  routeIds: number[];
  routes: RouteResult[];
}

/**
 * 独立驾车路径规划参数
 *
 * 说明：
 * - strategy 仍使用 DriveStrategy 即可；也可改用布尔组合标志（下方四个），原生会在未传 strategy 时走 strategyConvert
 * - restriction：是否考虑限行（与 carNumber 搭配）
 */
export interface IndependentDriveRouteOptions {
  /** 起点坐标 */
  from: {
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  };
  /** 终点坐标 */
  to: {
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  };
  /** 途经点列表 */
  waypoints?: Array<{
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  }>;
  /** 驾车策略 */
  strategy?: number;
  /** 避免拥堵 */
  avoidCongestion?: boolean;
  /** 避免高速 */
  avoidHighway?: boolean;
  /** 避免收费 */
  avoidCost?: boolean;
  /** 优先高速 */
  prioritiseHighway?: boolean;
  /** 车牌号 */
  carNumber?: string;
  /** 是否考虑限行 */
  restriction?: boolean;
}

/**
 * 独立货车路径规划参数
 *
 * 说明：
 * - 默认 carType=1，支持 carNumber / restriction；可在原生侧扩展轴数/长宽高/载重等
 * - 同样支持布尔组合标志以计算策略
 */
export interface IndependentTruckRouteOptions {
  /** 起点坐标 */
  from: {
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  };
  /** 终点坐标 */
  to: {
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  };
  /** 途经点列表 */
  waypoints?: Array<{
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  }>;
  /** 驾车策略 */
  strategy?: number;
  /** 避免拥堵 */
  avoidCongestion?: boolean;
  /** 避免高速 */
  avoidHighway?: boolean;
  /** 避免收费 */
  avoidCost?: boolean;
  /** 优先高速 */
  prioritiseHighway?: boolean;
  /** 车牌号 */
  carNumber?: string;
  /** 是否考虑限行 */
  restriction?: boolean;
}

/**
 * 摩托车路径规划参数
 *
 * 说明：
 * - 与驾车算路一致，但需在原生侧设置 AMapCarInfo.carType=11，并可传 motorcycleCC（排量）
 * - carNumber 可用于限行策略参考
 */
export interface MotorcycleRouteOptions {
  /** 起点坐标 */
  from: {
    latitude: number;
    longitude: number;
  };
  /** 终点坐标 */
  to: {
    latitude: number;
    longitude: number;
  };
  /** 途经点列表 */
  waypoints?: Array<{
    latitude: number;
    longitude: number;
  }>;
  /** 驾车策略 */
  strategy?: number;
  /** 避免拥堵 */
  avoidCongestion?: boolean;
  /** 避免高速 */
  avoidHighway?: boolean;
  /** 避免收费 */
  avoidCost?: boolean;
  /** 优先高速 */
  prioritiseHighway?: boolean;
  /** 车牌号（可选） */
  carNumber?: string;
  /** 摩托车排量（单位：cc，可选） */
  motorcycleCC?: number;
}

/**
 * 独立摩托车路径规划参数
 *
 * 说明：
 * - 与独立驾车一致，但需在原生侧设置 carType=11，并可传 motorcycleCC
 */
export interface IndependentMotorcycleRouteOptions {
  /** 起点坐标 */
  from: {
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  };
  /** 终点坐标 */
  to: {
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  };
  /** 途经点列表 */
  waypoints?: Array<{
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  }>;
  /** 驾车策略 */
  strategy?: number;
  /** 避免拥堵 */
  avoidCongestion?: boolean;
  /** 避免高速 */
  avoidHighway?: boolean;
  /** 避免收费 */
  avoidCost?: boolean;
  /** 优先高速 */
  prioritiseHighway?: boolean;
  /** 车牌号（可选） */
  carNumber?: string;
  /** 摩托车排量（单位：cc，可选） */
  motorcycleCC?: number;
}

/**
 * 独立步行路径规划参数
 *
 * 说明：
 * - 通过 travelStrategy 指定 SINGLE/MULTIPLE；或使用 multiple=true 开启多路线
 */
export interface IndependentWalkRouteOptions {
  /** 起点坐标 */
  from: {
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  };
  /** 终点坐标 */
  to: {
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  };
  /** 途经点列表 */
  waypoints?: Array<{
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  }>;
  /** 出行策略（单路线/多路线），对齐原生 TravelStrategy：1000/1001 */
  travelStrategy?: number;
  /** 是否返回多路线（等价于 travelStrategy=TravelStrategy.MULTIPLE） */
  multiple?: boolean;
}

/**
 * 独立骑行路径规划参数
 *
 * 说明：
 * - 通过 travelStrategy 指定 SINGLE/MULTIPLE；或使用 multiple=true 开启多路线
 */
export interface IndependentRideRouteOptions {
  /** 起点坐标 */
  from: {
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  };
  /** 终点坐标 */
  to: {
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  };
  /** 途经点列表 */
  waypoints?: Array<{
    latitude: number;
    longitude: number;
    name?: string;
    poiId?: string;
  }>;
  /** 出行策略（单路线/多路线），对齐原生 TravelStrategy：1000/1001 */
  travelStrategy?: number;
  /** 是否返回多路线（等价于 travelStrategy=TravelStrategy.MULTIPLE） */
  multiple?: boolean;
}

/**
 * 选择独立路径组中的主路线参数
 * - token: 独立算路返回的 token
 * - routeId/routeIndex: 选路（优先使用 routeId；未提供则保持当前主路线）
 */
export interface SelectIndependentRouteOptions {
  token: number;
  routeId?: number;
  routeIndex?: number;
}

/**
 * 使用独立路径组启动导航参数
 * - token: 独立算路返回的 token
 * - naviType: 0=GPS; 1=EMULATOR（默认 0）
 * - routeId/routeIndex: 启动前可选路
 */
export interface StartNaviWithIndependentPathOptions {
  token: number;
  naviType?: number;
  routeId?: number;
  routeIndex?: number;
}

/**
 * 清理独立路径组
 */
export interface ClearIndependentRouteOptions {
  token: number;
}