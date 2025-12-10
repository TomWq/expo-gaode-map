import type { Coordinates } from './coordinates.types';

/**
 * 路径规划类型
 */
export enum RouteType {
  /** 驾车路径规划 */
  DRIVE = 'drive',
  /** 步行路径规划 */
  WALK = 'walk',
  /** 骑行路径规划 */
  RIDE = 'ride',
  /** 货车路径规划 */
  TRUCK = 'truck',
}

/**
 * 驾车路径规划策略
 */
export enum DriveStrategy {
  /** 速度优先（时间最短） */
  FASTEST = 0,
  /** 费用优先（不走收费路段的最快路线） */
  FEE_FIRST = 1,
  /** 距离优先（距离最短） */
  SHORTEST = 2,
  /** 不走快速路（不走快速路的最快路线） */
  NO_EXPRESSWAYS = 3,
  /** 结合实时交通（躲避拥堵） */
  AVOID_CONGESTION = 4,
  /** 不走高速 */
  NO_HIGHWAY = 5,
  /** 不走高速且避免收费 */
  NO_HIGHWAY_AVOID_CONGESTION = 6,
  /** 躲避收费和拥堵 */
  AVOID_COST_CONGESTION = 7,
  /** 不走高速且躲避收费和拥堵 */
  NO_HIGHWAY_AVOID_COST_CONGESTION = 8,
  /** 躲避拥堵和收费 */
  AVOID_CONGESTION_COST = 9,
}

/**
 * 步行路径规划策略
 */
export enum WalkStrategy {
  /** 推荐路线 */
  DEFAULT = 0,
}

/**
 * 骑行路径规划策略
 */
export enum RideStrategy {
  /** 推荐路线 */
  DEFAULT = 0,
  /** 速度优先 */
  FASTEST = 1,
  /** 距离优先 */
  SHORTEST = 2,
}

/**
 * 货车路径规划大小
 */
export enum TruckSize {
  /** 微型货车 */
  MINI = 1,
  /** 轻型货车 */
  LIGHT = 2,
  /** 中型货车 */
  MEDIUM = 3,
  /** 重型货车 */
  HEAVY = 4,
}

/**
 * 步行/骑行 Travel 策略（对齐原生：1000 单路线 / 1001 多路线）
 */
export enum TravelStrategy {
  SINGLE = 1000,
  MULTIPLE = 1001,
}

/**
 * 基础路径规划选项
 */
export interface BaseRouteOptions {
  /** 起点坐标 */
  from: Coordinates;
  /** 终点坐标 */
  to: Coordinates;
  /** 途经点列表（可选） */
  waypoints?: Coordinates[];
}

/**
 * 驾车路径规划选项
 */
export interface DriveRouteOptions extends BaseRouteOptions {
  type: RouteType.DRIVE;
  /** 驾车策略，默认速度优先 */
  strategy?: DriveStrategy;
  /** 车牌号（用于限行策略，可选） */
  carNumber?: string;
  /** 避让区域（可选） */
  avoidPolygons?: Coordinates[][];
  /** 避让道路（道路名称，可选） */
  avoidRoad?: string;
}

/**
 * 步行路径规划选项
 */
export interface WalkRouteOptions extends BaseRouteOptions {
  type: RouteType.WALK;
  /** 步行策略 */
  strategy?: WalkStrategy;
  /** 出行策略（单路线/多路线），对齐原生 TravelStrategy：1000/1001 */
  travelStrategy?: TravelStrategy;
  /** 是否返回多路线（等价于 travelStrategy=TravelStrategy.MULTIPLE） */
  multiple?: boolean;
}

/**
 * 骑行路径规划选项
 */
export interface RideRouteOptions extends BaseRouteOptions {
  type: RouteType.RIDE;
  /** 骑行策略 */
  strategy?: RideStrategy;
  /** 出行策略（单路线/多路线），对齐原生 TravelStrategy：1000/1001 */
  travelStrategy?: TravelStrategy;
  /** 是否返回多路线（等价于 travelStrategy=TravelStrategy.MULTIPLE） */
  multiple?: boolean;
}

/**
 * 骑行电动车路径规划选项
 */
export interface EBikeRouteOptions extends BaseRouteOptions {
  /** 出行策略（单路线/多路线），对齐原生 TravelStrategy：1000/1001 */
  travelStrategy?: TravelStrategy;
  /** 是否返回多路线（等价于 travelStrategy=TravelStrategy.MULTIPLE） */
  multiple?: boolean;
  /** 强制使用 POI 算路（若提供 name 或 poiId 时会自动使用） */
  usePoi?: boolean;
}

/**
 * 货车路径规划选项
 */
export interface TruckRouteOptions extends BaseRouteOptions {
  type: RouteType.TRUCK;
  /** 货车大小 */
  size: TruckSize;
  /** 货车高度（米） */
  height?: number;
  /** 货车宽度（米） */
  width?: number;
  /** 货车载重（吨） */
  load?: number;
  /** 货车重量（吨） */
  weight?: number;
  /** 货车轴数 */
  axis?: number;
}

/**
 * 路径步骤动作类型
 */
export enum StepAction {
  /** 直行 */
  STRAIGHT = 0,
  /** 左转 */
  LEFT = 1,
  /** 右转 */
  RIGHT = 2,
  /** 左前方转弯 */
  LEFT_FRONT = 3,
  /** 右前方转弯 */
  RIGHT_FRONT = 4,
  /** 左后方转弯 */
  LEFT_BACK = 5,
  /** 右后方转弯 */
  RIGHT_BACK = 6,
  /** 左转掉头 */
  LEFT_U_TURN = 7,
  /** 到达目的地 */
  ARRIVE = 8,
  /** 进入环岛 */
  ENTER_ROUNDABOUT = 9,
  /** 驶出环岛 */
  EXIT_ROUNDABOUT = 10,
}

/**
 * 道路类型
 */
export enum RoadType {
  /** 高速公路 */
  HIGHWAY = 0,
  /** 国道 */
  NATIONAL_ROAD = 1,
  /** 省道 */
  PROVINCIAL_ROAD = 2,
  /** 县道 */
  COUNTY_ROAD = 3,
  /** 乡镇道路 */
  TOWNSHIP_ROAD = 4,
  /** 城市主干道 */
  MAIN_ROAD = 5,
  /** 城市次干道 */
  SECONDARY_ROAD = 6,
  /** 城市普通道路 */
  NORMAL_ROAD = 7,
  /** 其他道路 */
  OTHER = 8,
}

/**
 * 路径步骤信息
 */
export interface RouteStep {
  /** 步骤说明 */
  instruction: string;
  /** 方向说明 */
  orientation?: string;
  /** 道路名称 */
  road?: string;
  /** 距离（米） */
  distance: number;
  /** 预计时间（秒） */
  duration: number;
  /** 路径坐标点 */
  polyline: Coordinates[];
  /** 动作类型 */
  action?: StepAction;
  /** 辅助动作（可选） */
  assistantAction?: string;
  /** 收费距离（米） */
  tollDistance?: number;
  /** 收费金额（元） */
  tollCost?: number;
  /** 道路类型 */
  roadType?: RoadType;
}

/**
 * 路径规划结果
 */
export interface RouteResult {
  /** 路线ID */
  id: number;
  /** 起点坐标 */
  start: Coordinates;
  /** 终点坐标 */
  end: Coordinates;
  /** 总距离（米） */
  distance: number;
  /** 预计时间（秒） */
  duration: number;
  /** 路径步骤 */
  segments?: RouteStep[];
  /** 路径坐标点（所有步骤的完整路径） */
  polyline?: Coordinates[];
  /** 收费距离（米），驾车时有效 */
  tollDistance?: number;
  /** 收费金额（元），驾车时有效 */
  tollCost?: number;
  /** 红绿灯数量，驾车时有效 */
  trafficLightCount?: number;
  /** 限行状态码，驾车时有效 */
  restrictionCode?: number;
  /** 限行状态说明，驾车时有效 */
  restrictionInfo?: string;
  /** 策略值 */
  strategy?: number;
}

/**
 * 驾车路径规划结果（包含多条路线）
 */
export interface DriveRouteResult {
  /** 路径数量 */
  count: number;
  /** 主路线索引 */
  mainPathIndex: number;
  /** 路线ID列表 */
  routeIds?: number[];
  /** 路径列表，按策略返回1-3条路线 */
  routes: RouteResult[];
  /** 出租车费用（元） */
  taxiCost?: number;
}

/**
 * 路径规划选项联合类型
 */
export type RouteOptions =
  | DriveRouteOptions
  | WalkRouteOptions
  | RideRouteOptions
  | EBikeRouteOptions
  | TruckRouteOptions;