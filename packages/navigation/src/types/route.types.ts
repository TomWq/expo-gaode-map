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
  /** 公交换乘 */
  TRANSIT = 'transit',
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

export interface TransitRouteOptions extends BaseRouteOptions {
  type: RouteType.TRANSIT;
  city1: string;
  city2: string;
  strategy?: number;
  alternativeRoute?: 1 | 2 | 3;
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
 * 官方导航页参数（Android: AmapNaviPage.showRouteActivity）
 */
export interface OfficialNaviPageOptions {
  /** 起点（可选，不传则由 SDK 使用当前位置） */
  from?: Coordinates & {
    name?: string;
    poiId?: string;
  };
  /** 终点（必填） */
  to: Coordinates & {
    name?: string;
    poiId?: string;
  };
  /** 途经点（可选） */
  waypoints?: Array<
    Coordinates & {
      name?: string;
      poiId?: string;
    }
  >;
  /** 页面类型：`ROUTE` 路线页 / `NAVI` 导航页 */
  pageType?: 'ROUTE' | 'NAVI' | string;
  /** 算路类型：`DRIVER` / `WALK` / `RIDE` / `MOTORCYCLE`（当前主要用于驾车） */
  officialNaviType?: 'DRIVER' | 'WALK' | 'RIDE' | 'MOTORCYCLE' | string;
  /** 组件主题：`BLUE`（默认）/ `WHITE` / `BLACK` */
  theme?: 'BLUE' | 'WHITE' | 'BLACK' | string;
  /** 组件算路策略（参考 PathPlanningStrategy 常量） */
  routeStrategy?: number;
  /** 是否直接进入导航页（iOS 对应 `setStartNaviDirectly`） */
  startNaviDirectly?: boolean;
  /** 直接导航模式（仅直接进导航页时生效）：1 实时 / 2 模拟（iOS 官方组件当前不支持模拟） */
  naviMode?: number;
  needCalculateRouteWhenPresent?: boolean;
  /** 退出导航页时是否销毁 DriveManager 实例，默认 false */
  needDestroyDriveManagerInstanceWhenNaviExit?: boolean;
  /** 是否显示退出导航弹窗，默认 true */
  showExitNaviDialog?: boolean;
  /** 是否使用内置语音，默认 true（6.1.0+ 默认 true） */
  useInnerVoice?: boolean;
  /** 路况开关是否打开（默认 false） */
  trafficEnabled?: boolean;
  /** 是否显示路口放大图 */
  showCrossImage?: boolean;
  /** 是否显示“路径偏好策略”页面 */
  showRouteStrategyPreferenceView?: boolean;
  /** 是否显示“下下个路口”引导 */
  secondActionVisible?: boolean;
  /** 是否展示语音设置项（文档原方法名 `setShowVoiceSetings`） */
  showVoiceSettings?: boolean;
  /** 驾车多路线模式（true 多路线 / false 单路线） */
  multipleRouteNaviMode?: boolean;
  /** 货车多路线模式（付费能力） */
  truckMultipleRouteNaviMode?: boolean;
  /** 是否显示鹰眼小地图 */
  showEagleMap?: boolean;
  /** iOS 是否显示电子眼距离（7.7.0+，具体以 SDK 版本为准） */
  showCameraDistanceEnable?: boolean;
  /** iOS 地图缩放比例（7.7.0+，具体以 SDK 版本为准） */
  scaleFactor?: number;
  /** 比例尺智能缩放是否开启 */
  scaleAutoChangeEnable?: boolean;
  /** 昼夜模式：0 自动 / 1 白天 / 2 夜间 */
  dayAndNightMode?: 0 | 1 | 2 | number;
  /** iOS 地图样式类型（覆盖 dayAndNightMode） */
  mapViewModeType?: number;
  /** 播报模式：1 简洁 / 2 详细 / 3 静音 */
  broadcastMode?: 1 | 2 | 3 | number;
  /** iOS 播报类型（覆盖 broadcastMode） */
  broadcastType?: number;
  /** 导航视角：1 正北向上 / 2 车头向上 */
  carDirectionMode?: 1 | 2 | number;
  /** iOS 跟随模式（覆盖 carDirectionMode） */
  trackingMode?: number;
  /** 是否显示“随后转向”图标（iOS） */
  showNextRoadInfo?: boolean;
  /** 多路线模式下是否显示备选路线（iOS） */
  showBackupRoute?: boolean;
  /** 网约车模式（iOS） */
  onlineCarHailingType?: number;
  /** 是否显示限行图层（iOS，付费能力） */
  showRestrictareaEnable?: boolean;
  /** 到达目的地后是否移除路线和牵引线（iOS） */
  removePolylineAndVectorlineWhenArrivedDestination?: boolean;
  /** 车辆信息（用于尾号限行/货车导航） */
  carInfo?: {
    /** 车辆类型：如 `0` 小客车 / `1` 货车 / `11` 摩托车 */
    carType?: string;
    /** 车牌号 */
    carNumber?: string;
    /** 是否考虑限行 */
    restriction?: boolean;
    /** 摩托车排量 */
    motorcycleCC?: number;
    /** 货车轴数 */
    vehicleAxis?: string;
    /** 货车高度（米） */
    vehicleHeight?: string;
    /** 货车长度（米） */
    vehicleLength?: string;
    /** 货车宽度（米） */
    vehicleWidth?: string;
    /** 货车尺寸等级 */
    vehicleSize?: string;
    /** 货车载重（吨） */
    vehicleLoad?: string;
    /** 货车总重（吨） */
    vehicleWeight?: string;
    /** 是否开启载重参数 */
    vehicleLoadSwitch?: boolean;
    /** 算路时是否忽略货车重量（iOS） */
    isLoadIgnore?: boolean;
  };
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
  /** 路线ID（兼容旧版原生返回） */
  routeId?: number;
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
  | TransitRouteOptions
  | TruckRouteOptions;
