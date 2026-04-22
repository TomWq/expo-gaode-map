import type { Coordinates } from './coordinates.types';
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

export interface WebPlannedRouteStep {
  /** Web 路线分段点集 */
  polyline?: Coordinates[];
  /** 主动作（可选） */
  action?: string;
  /** 辅助动作（可选） */
  assistantAction?: string;
}

export interface WebPlannedRoute {
  /** Web 规划出的完整折线 */
  polyline: Coordinates[];
  /** 可选步骤信息 */
  steps?: WebPlannedRouteStep[];
}

export interface BuildAnchorWaypointsOptions {
  /** Web 路线 */
  webRoute: WebPlannedRoute;
  /** 最大途经点数量（不含起终点） */
  maxViaPoints?: number;
  /** 抽稀容差（米） */
  simplifyTolerance?: number;
  /** 相邻锚点的最小间距（米） */
  minSpacingMeters?: number;
}

export interface FollowWebPlannedRouteOptions extends BuildAnchorWaypointsOptions {
  /** 起点 */
  from: Coordinates;
  /** 终点 */
  to: Coordinates;
  /** 驾车策略 */
  strategy?: number;
  /** 车牌号 */
  carNumber?: string;
  /** 是否考虑限行 */
  restriction?: boolean;
  /** 避让区域元信息（可选）。当前 followWebPlannedRoute 的原生匹配阶段不会再次直接透传该参数。 */
  avoidPolygons?: Coordinates[][];
  /** 避让道路元信息（可选）。当前 followWebPlannedRoute 的原生匹配阶段不会再次直接透传该参数。 */
  avoidRoad?: string;
  /** 判定“最大允许偏差”的阈值（米） */
  maxDeviationMeters?: number;
  /** 是否在匹配成功后直接启动导航 */
  startNavigation?: boolean;
  /** 导航类型：0 GPS / 1 模拟 */
  naviType?: number;
}

export interface FollowWebPlannedRouteCandidate {
  /** 路线 ID（若可用） */
  routeId?: number;
  /** 路线索引 */
  routeIndex: number;
  /** 平均偏差（米） */
  averageDeviationMeters: number;
  /** 最大偏差（米） */
  maxDeviationMeters: number;
  /** 未命中的锚点数量 */
  missedAnchorCount: number;
  /** 综合评分，越小越接近 */
  score: number;
}

export interface FollowWebPlannedRouteResult {
  /** 匹配模式 */
  mode: 'matched' | 'approximate' | 'preview_only';
  /** 独立算路 token */
  token: number;
  /** 提炼出的锚点 */
  anchorWaypoints: Coordinates[];
  /** Web 路线长度 */
  webDistance: number;
  /** 选中原生路线长度 */
  nativeDistance?: number;
  /** 选中路线 ID */
  selectedRouteId?: number;
  /** 选中路线索引 */
  selectedRouteIndex?: number;
  /** 选中路线平均偏差 */
  averageDeviationMeters?: number;
  /** 选中路线最大偏差 */
  maxDeviationMeters?: number;
  /** 是否已启动导航 */
  navigationStarted: boolean;
  /** 最终用于导航的路线是否仍依赖锚点途经点 */
  navigationUsesAnchorWaypoints: boolean;
  /** 原生独立算路结果 */
  independentResult: IndependentRouteResult;
  /** 候选路线匹配结果 */
  candidateMatches: FollowWebPlannedRouteCandidate[];
  /** 说明 */
  reason?: string;
}

/**
 * 独立驾车路径规划参数
 *
 * 说明：
 * - strategy 仍使用 DriveStrategy 即可；也可改用布尔组合标志（下方四个），原生会在未传 strategy 时走 strategyConvert
 * - restriction：是否考虑限行（与 carNumber 搭配）
 */
export interface IndependentDriveRouteOptions {
  /** 起点坐标（可选；不传时由原生 SDK 使用当前位置） */
  from?: {
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
 * - 这是“独立算路”参数：只负责生成可预览/可选路的独立路径组，不会自动开始导航
 * - 通过 travelStrategy 指定 SINGLE/MULTIPLE；或使用 multiple=true 开启多路线
 * - 生成结果后，可继续调用模块级 startNaviWithIndependentPath，或在嵌入式导航视图 ref 上调用 startNavigationWithIndependentPath
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
  /** 途经点列表。是否生效取决于当前原生端对应场景的支持情况。 */
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
 * - 这是“独立算路”参数：只负责生成可预览/可选路的独立路径组，不会自动开始导航
 * - 通过 travelStrategy 指定 SINGLE/MULTIPLE；或使用 multiple=true 开启多路线
 * - 生成结果后，可继续调用模块级 startNaviWithIndependentPath，或在嵌入式导航视图 ref 上调用 startNavigationWithIndependentPath
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
  /** 途经点列表。是否生效取决于当前原生端对应场景的支持情况。 */
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
 * - 仅切换独立路径组里的“当前主路线”，本身不会开始导航
 */
export interface SelectIndependentRouteOptions {
  token: number;
  routeId?: number;
  routeIndex?: number;
}

/**
 * 使用独立路径组启动导航参数（模块级 API）
 * - token: 独立算路返回的 token
 * - naviType: 0=GPS; 1=EMULATOR（默认 0）
 * - routeId/routeIndex: 启动前可选路
 *
 * 说明：
 * - 这是模块级启动入口，不依赖某个 ExpoGaodeMapNaviView 实例
 * - 若你已经持有嵌入式导航视图 ref，更适合调用 ref.startNavigationWithIndependentPath(...)
 */
export interface StartNaviWithIndependentPathOptions {
  token: number;
  naviType?: number;
  routeId?: number;
  routeIndex?: number;
}

/**
 * 清理独立路径组
 * - token: 独立算路返回的 token
 * - 当页面只需要预览、不再需要后续选路/导航时，建议主动清理
 */
export interface ClearIndependentRouteOptions {
  token: number;
}
