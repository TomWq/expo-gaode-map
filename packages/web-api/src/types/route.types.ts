/**
 * 高德地图路径规划 API 类型定义
 * 文档：https://lbs.amap.com/api/webservice/guide/api/newroute
 */

/**
 * 坐标类型
 */
export type Coordinate = string | { longitude: number; latitude: number };

/**
 * 通用路径规划请求参数基类
 */
export interface BaseRouteParams {
  /**
   * 数字签名
   * 若用户申请的key为签名校验型key，则需要传递此参数
   */
  sig?: string;
  /**
   * 返回数据格式类型
   * 可选值：JSON、XML
   * @default 'JSON'
   */
  output?: 'JSON' | 'XML';
  /**
   * 回调函数
   * callback值是用户定义的函数名称，此参数只在output参数设置为JSON时有效
   */
  callback?: string;

  /**
   * API 版本
   * @default 'v5'
   */
  version?: 'v3' | 'v5';
  /**
   * AbortSignal 用于取消请求
   */
  signal?: AbortSignal;
}

/**
 * 驾车路径规划策略（新版 V5 API）
 */
export enum DrivingStrategy {
  /** 速度优先（只返回一条路线，此路线不一定距离最短） */
  SPEED_FIRST = 0,
  /** 费用优先（只返回一条路线，不走收费路段，且耗时最少） */
  COST_FIRST = 1,
  /** 常规最快（只返回一条路线，综合距离/耗时规划结果） */
  REGULAR_FASTEST = 2,
  /** 默认，高德推荐，同高德地图APP默认 */
  DEFAULT = 32,
  /** 躲避拥堵 */
  AVOID_JAM = 33,
  /** 高速优先 */
  HIGHWAY_FIRST = 34,
  /** 不走高速 */
  NO_HIGHWAY = 35,
  /** 少收费 */
  LESS_TOLL = 36,
  /** 大路优先 */
  MAIN_ROAD_FIRST = 37,
  /** 速度最快 */
  FASTEST = 38,
  /** 躲避拥堵 + 高速优先 */
  AVOID_JAM_HIGHWAY_FIRST = 39,
  /** 躲避拥堵 + 不走高速 */
  AVOID_JAM_NO_HIGHWAY = 40,
  /** 躲避拥堵 + 少收费 */
  AVOID_JAM_LESS_TOLL = 41,
  /** 少收费 + 不走高速 */
  LESS_TOLL_NO_HIGHWAY = 42,
  /** 躲避拥堵 + 少收费 + 不走高速 */
  AVOID_JAM_LESS_TOLL_NO_HIGHWAY = 43,
  /** 躲避拥堵 + 大路优先 */
  AVOID_JAM_MAIN_ROAD = 44,
  /** 躲避拥堵 + 速度最快 */
  AVOID_JAM_FASTEST = 45,
}

/**
 * 驾车路径规划请求参数（新版 V5 API）
 */
export interface DrivingRouteParams extends BaseRouteParams {
  /** 出发点坐标，格式："经度,纬度" 或 {longitude, latitude} */
  origin: Coordinate;
  /** 目的地坐标，格式："经度,纬度" 或 {longitude, latitude} */
  destination: Coordinate;
  /**
   * 终点的 POI 类别
   * 当用户知道终点 POI 的类别时候，建议填充此值
   */
  destination_type?: string;
  /**
   * 起点 POI ID
   * 起点为 POI 时，建议填充此值，可提升路线规划准确性
   */
  origin_id?: string;
  /**
   * 目的地 POI ID
   * 目的地为 POI 时，建议填充此值，可提升路径规划准确性
   */
  destination_id?: string;
  /**
   * 驾车选择策略
   * @default DrivingStrategy.DEFAULT (32)
   */
  strategy?: DrivingStrategy;
  /**
   * 途经点坐标
   * 默认支持1个有序途径点，最大支持16个途经点
   * 格式："经度1,纬度1;经度2,纬度2;..." 或数组
   */
  waypoints?: Coordinate | Coordinate[];
  /**
   * 避让区域
   * 默认支持1个避让区域，每个区域最多可有16个顶点
   * 多个区域坐标用"|"分隔，最大支持32个避让区域
   * 每个避让区域不能超过81平方公里
   * 格式："经度1,纬度1;经度2,纬度2|经度3,纬度3;经度4,纬度4"
   */
  avoidpolygons?: string;
  /**
   * 车牌号
   * 如：京AHA322，支持6位传统车牌和7位新能源车牌
   * 用于判断限行相关
   */
  plate?: string;
  /**
   * 车辆类型
   * 0：普通燃油汽车（默认）
   * 1：纯电动汽车
   * 2：插电式混动汽车
   * @default 0
   */
  cartype?: 0 | 1 | 2;
  /**
   * 是否使用轮渡
   * 0：使用渡轮（默认）
   * 1：不使用渡轮
   * @default 0
   */
  ferry?: 0 | 1;
  /**
   * 返回结果控制
   * 用来筛选 response 结果中可选字段
   * 多个字段间采用","进行分割
   * 可选值：cost, tmcs, navi, cities, polyline
   * 未设置时，只返回基础信息
   */
  show_fields?: string;
}

/**
 * 步行路径规划请求参数（新版 V5 API）
 */
export interface WalkingRouteParams extends BaseRouteParams {
  /** 起点信息，经度在前，纬度在后 */
  origin: Coordinate;
  /** 目的地信息，经度在前，纬度在后 */
  destination: Coordinate;
  /**
   * 起点 POI ID
   * 起点为 POI 时，建议填充此值，可提升路线规划准确性
   */
  origin_id?: string;
  /**
   * 目的地 POI ID
   * 目的地为 POI 时，建议填充此值，可提升路线规划准确性
   */
  destination_id?: string;
  /**
   * 返回路线条数
   * 1：多备选路线中第一条路线
   * 2：多备选路线中前两条路线
   * 3：多备选路线中三条路线
   * 不传则默认返回一条路线方案
   */
  alternative_route?: 1 | 2 | 3;
  /**
   * 返回结果控制
   * 用来筛选 response 结果中可选字段
   * 多个字段间采用","进行分割
   * 可选值：cost, navi, polyline
   * 未设置时，只返回基础信息
   */
  show_fields?: string;
  /**
   * 是否需要室内算路
   * 0：不需要（默认）
   * 1：需要
   * @default 0
   */
  isindoor?: 0 | 1;
}

/**
 * 骑行路径规划请求参数
 */
export interface BicyclingRouteParams extends BaseRouteParams {
  /** 起点经纬度，格式："经度,纬度" 或 { longitude, latitude } */
  origin: Coordinate;
  /** 终点经纬度，格式："经度,纬度" 或 { longitude, latitude } */
  destination: Coordinate;
  /**
   * 返回结果控制
   * 可选值：cost（成本信息）, navi（导航信息）, polyline（坐标点串）
   * 多个字段用英文逗号分隔，如："cost,navi,polyline"
   * 未设置时，只返回基础信息
   */
  show_fields?: string;
  /**
   * 返回方案条数
   * 1：返回第一条路线
   * 2：返回前两条路线
   * 3：返回三条路线
   * 不传则默认返回一条路线方案
   */
  alternative_route?: 1 | 2 | 3;
}

/**
 * 电动车路径规划参数
 */
export interface ElectricBikeRouteParams extends BaseRouteParams {
  /** 起点经纬度，格式："经度,纬度" 或 { longitude, latitude } */
  origin: Coordinate;
  /** 终点经纬度，格式："经度,纬度" 或 { longitude, latitude } */
  destination: Coordinate;
  /**
   * 返回结果控制
   * 可选值：cost（成本信息）, navi（导航信息）, polyline（坐标点串）
   * 多个字段用英文逗号分隔，如："cost,navi,polyline"
   * 未设置时，只返回基础信息
   */
  show_fields?: string;
  /**
   * 返回方案条数
   * 1：返回第一条路线
   * 2：返回前两条路线
   * 3：返回三条路线
   * 不传则默认返回一条路线方案
   */
  alternative_route?: 1 | 2 | 3;
}

/**
 * 公交换乘策略（新版 V5 API）
 */
export enum TransitStrategy {
  /** 推荐模式，综合权重，同高德APP默认 */
  RECOMMENDED = 0,
  /** 最经济模式，票价最低 */
  CHEAPEST = 1,
  /** 最少换乘模式，换乘次数少 */
  LEAST_TRANSFER = 2,
  /** 最少步行模式，尽可能减少步行距离 */
  LEAST_WALK = 3,
  /** 最舒适模式，尽可能乘坐空调车 */
  MOST_COMFORTABLE = 4,
  /** 不乘地铁模式，不乘坐地铁路线 */
  NO_SUBWAY = 5,
  /** 地铁图模式，起终点都是地铁站（此模式下 originpoi 及 destinationpoi 为必填项） */
  SUBWAY_MAP = 6,
  /** 地铁优先模式，步行距离不超过4KM */
  SUBWAY_FIRST = 7,
  /** 时间短模式，方案花费总时间最少 */
  TIME_FIRST = 8,
}

/**
 * 公交路径规划请求参数（新版 V5 API）
 */
export interface TransitRouteParams extends BaseRouteParams {
  /** 起点经纬度，格式："经度,纬度" 或 { longitude, latitude } */
  origin: Coordinate;
  /** 终点经纬度，格式："经度,纬度" 或 { longitude, latitude } */
  destination: Coordinate;
  /**
   * 起点 POI ID
   * 1、起点 POI ID 与起点经纬度均填写时，服务使用起点 POI ID
   * 2、该字段必须和目的地 POI ID 成组使用
   * 3、地铁图模式(strategy=6)下此参数为必填项
   */
  originpoi?: string;
  /**
   * 目的地 POI ID
   * 1、目的地 POI ID 与目的地经纬度均填写时，服务使用目的地 POI ID
   * 2、该字段必须和起点 POI ID 成组使用
   * 3、地铁图模式(strategy=6)下此参数为必填项
   */
  destinationpoi?: string;
  /**
   * 起点所在行政区域编码
   * 仅支持 adcode
   */
  ad1?: string;
  /**
   * 终点所在行政区域编码
   * 仅支持 adcode
   */
  ad2?: string;
  /**
   * 起点所在城市（必填）
   * 仅支持 citycode，相同时代表同城，不同时代表跨城
   */
  city1: string;
  /**
   * 目的地所在城市（必填）
   * 仅支持 citycode，相同时代表同城，不同时代表跨城
   */
  city2: string;
  /**
   * 公交换乘策略
   * @default TransitStrategy.RECOMMENDED (0)
   */
  strategy?: TransitStrategy;
  /**
   * 返回方案条数
   * 可传入1-10的阿拉伯数字，代表返回的不同条数
   * @default 5
   */
  AlternativeRoute?: number;
  /**
   * 地铁出入口数量
   * 0：只返回一个地铁出入口
   * 1：返回全部地铁出入口
   * @default 0
   */
  multiexport?: 0 | 1;
  /**
   * 考虑夜班车
   * 0：不考虑夜班车
   * 1：考虑夜班车
   * @default 0
   */
  nightflag?: 0 | 1;
  /**
   * 请求日期
   * 格式：YYYY-MM-DD，例如：2013-10-28
   */
  date?: string;
  /**
   * 请求时间
   * 格式：HH:MM 或 H-MM，例如：9:54 或 9-54
   */
  time?: string;
  /**
   * 返回结果控制
   * 用来筛选 response 结果中可选字段
   * 多个字段间采用","进行分割
   * 可选值：cost, navi, polyline
   * 未设置时，只返回基础信息
   */
  show_fields?: string;
}

/**
 * 路径规划步骤（基础信息）
 */
export interface Step {
  /** 行驶/步行指示 */
  instruction: string;
  /** 进入道路方向 */
  orientation?: string;
  /** 分段道路名称 */
  road_name?: string;
  /** 分段距离信息，单位：米 */
  step_distance: string;
  
  /** 以下字段需要通过 show_fields 参数设置才返回 */
  cost?: PathCost;
  /** 导航主要动作指令（需要 show_fields=navi） */
  action?: string;
  /** 导航辅助动作指令（需要 show_fields=navi） */
  assistant_action?: string;
  /**
   * 道路类型（步行路径特有，需要 show_fields=navi）
   * 0-普通道路, 1-人行横道, 3-地下通道, 4-过街天桥,
   * 5-地铁通道, 6-公园, 7-广场, 8-扶梯, 9-直梯,
   * 10-索道, 11-空中通道, 12-建筑物穿越通道,
   * 13-行人通道, 14-游船路线, 15-观光车路线, 16-滑道,
   * 18-扩路, 19-道路附属连接线, 20-阶梯, 21-斜坡,
   * 22-桥, 23-隧道, 30-轮渡
   */
  walk_type?: string;
  /** 分路段坐标点串，两点间用";"分隔（需要 show_fields=polyline） */
  polyline?: string;
  
  /** 路况信息（驾车路径特有，需要 show_fields=tmcs） */
  tmcs?: Array<{
    /** 路况信息：未知、畅通、缓行、拥堵、严重拥堵 */
    tmc_status: string;
    /** 从当前坐标点开始 step 中路况相同的距离，单位：米 */
    tmc_distance: string;
    /** 此段路况涉及的道路坐标点串，点间用","分隔 */
    tmc_polyline: string;
  }>;
  
  /** 途径城市信息（驾车路径特有，需要 show_fields=cities） */
  cities?: Array<{
    /** 途径区域编码 */
    adcode: string;
    /** 途径城市编码 */
    citycode: string;
    /** 途径城市名称 */
    city: string;
    /** 途径区县信息 */
    district?: Array<{
      /** 途径区县名称 */
      name: string;
      /** 途径区县 adcode */
      adcode: string;
    }>;
  }>;
}

/**
 * 路径成本信息（需要 show_fields=cost）
 */
export interface PathCost {
  /** 线路耗时，单位：秒 */
  duration?: string;
  /** 此路线道路收费，单位：元（仅驾车） */
  tolls?: string;
  /** 收费路段里程，单位：米（仅驾车） */
  toll_distance?: string;
  /** 主要收费道路（仅驾车） */
  toll_road?: string;
  /** 方案中红绿灯个数，单位：个（仅驾车） */
  traffic_lights?: string;
}

/**
 * 路径信息
 */
export interface Path {
  /** 方案距离，单位：米 */
  distance: string;
  /** 限行结果：0-限行已规避或未限行，1-限行无法规避（仅驾车） */
  restriction?: string;
  /** 路线分段 */
  steps: Step[];
  
  /** 以下字段需要通过 show_fields 参数设置才返回 */
  
  /** 成本信息（需要 show_fields=cost）- 作为对象返回 */
  cost?: PathCost;
  
  /** 预估打车费用，单位：元（仅步行路径，且方案级别才有，steps 中不返回） */
  taxi?: string;
  
  /** 以下字段为向后兼容保留，实际 API 返回在 cost 对象中 */
  /** @deprecated 使用 cost.duration 代替 */
  duration?: string;
  /** @deprecated 使用 cost.tolls 代替 */
  tolls?: string;
  /** @deprecated 使用 cost.toll_distance 代替 */
  toll_distance?: string;
  /** @deprecated 使用 cost.toll_road 代替 */
  toll_road?: string;
  /** @deprecated 使用 cost.traffic_lights 代替 */
  traffic_lights?: string;
}

/**
 * 路线规划结果
 */
export interface Route {
  /** 起点坐标 */
  origin: string;
  /** 终点坐标 */
  destination: string;
  /** 出租车费用，单位：元 */
  taxi_cost?: string;
  /** 路径规划方案列表 */
  paths: Path[];
}

/**
 * 驾车路径规划响应
 */
export interface DrivingRouteResponse {
  /** 状态码：1-成功，0-失败 */
  status: string;
  /** 状态说明 */
  info: string;
  /** 状态码说明 */
  infocode: string;
  /** 路线规划结果数量 */
  count: string;
  /** 路线规划方案 */
  route: Route;
}

/**
 * 步行路径规划响应
 */
export interface WalkingRouteResponse {
  /** 状态码：1-成功，0-失败 */
  status: string;
  /** 状态说明 */
  info: string;
  /** 状态码说明 */
  infocode: string;
  /** 路线规划结果数量 */
  count: string;
  /** 路线规划方案 */
  route: Route;
}

/**
 * 骑行路径规划响应
 */
export interface BicyclingRouteResponse {
  /** 状态码：1-成功，0-失败 */
  status: string;
  /** 状态说明 */
  info: string;
  /** 状态码说明 */
  infocode: string;
  /** 路线规划结果数量 */
  count: string;
  /** 路线规划方案 */
  route: Route;
}

/**
 * 电动车路径规划响应
 */
export interface ElectricBikeRouteResponse {
  /** 状态码：1-成功，0-失败 */
  status: string;
  /** 状态说明 */
  info: string;
  /** 状态码说明 */
  infocode: string;
  /** 路线规划结果数量 */
  count: string;
  /** 路线规划方案 */
  route: Route;
}

/**
 * 公交线路
 */
export interface BusLine {
  /** 公交线路名称 */
  name: string;
  /** 公交线路ID */
  id: string;
  /** 公交类型 */
  type: string;
  /** 上车站 */
  departure_stop: {
    /** 站点名称 */
    name: string;
    /** 站点坐标 */
    location: string;
  };
  /** 下车站 */
  arrival_stop: {
    /** 站点名称 */
    name: string;
    /** 站点坐标 */
    location: string;
  };
  /** 途经站数 */
  via_num: string;
  /** 票价，单位：元 */
  cost: string;
  /** 乘坐距离，单位：米 */
  distance: string;
  /** 预计时间，单位：秒 */
  duration: string;
  /** 路径坐标点串 */
  polyline: string;
}

/**
 * 公交换乘段
 */
export interface TransitSegment {
  /** 步行 */
  walking?: {
    /** 起点坐标 */
    origin: string;
    /** 终点坐标 */
    destination: string;
    /** 步行距离，单位：米 */
    distance: string;
    /** 步行时间，单位：秒 */
    duration: string;
    /** 步行路径坐标 */
    steps: Step[];
  };
  /** 公交 */
  bus?: {
    /** 公交线路列表 */
    buslines: BusLine[];
  };
  /** 地铁 */
  railway?: {
    /** 地铁线路列表 */
    buslines: BusLine[];
  };
  /** 出租车 */
  taxi?: {
    /** 起点坐标 */
    origin: string;
    /** 终点坐标 */
    destination: string;
    /** 行驶距离，单位：米 */
    distance: string;
    /** 预计时间，单位：秒 */
    duration: string;
    /** 出租车费用，单位：元 */
    sname: string;
    /** 目的地名称 */
    tname: string;
  };
}

/**
 * 公交换乘成本信息
 */
export interface TransitCost {
  /** 线路耗时，单位：秒 */
  duration?: string;
  /** 公交费用，单位：元 */
  transit_fee?: string;
}

/**
 * 公交换乘方案
 */
export interface Transit {
  /** 换乘距离，单位：米 */
  distance: string;
  /** 换乘成本信息（包含时间和费用） */
  cost: TransitCost;
  /** 是否夜班车 */
  nightflag: string;
  /** 步行距离，单位：米 */
  walking_distance: string;
  /** 换乘路段列表 */
  segments: TransitSegment[];
}

/**
 * 公交路径规划响应
 */
export interface TransitRouteResponse {
  /** 状态码：1-成功，0-失败 */
  status: string;
  /** 状态说明 */
  info: string;
  /** 状态码说明 */
  infocode: string;
  /** 路线规划结果数量 */
  count: string;
  /** 路线规划方案 */
  route: {
    /** 起点坐标 */
    origin: string;
    /** 终点坐标 */
    destination: string;
    /** 公交换乘方案列表 */
    transits: Transit[];
  };
}