/**
 * 搜索类型
 */
export enum SearchType {
  /** POI 搜索 */
  POI = 'poi',
  /** 周边搜索 */
  NEARBY = 'nearby',
  /** 沿途搜索 */
  ALONG = 'along',
  /** 多边形搜索 */
  POLYGON = 'polygon',
  /** 输入提示 */
  INPUT_TIPS = 'inputTips',
}

/**
 * 坐标点
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * POI 信息
 */
export interface POI {
  /** POI ID */
  id: string;
  /** 名称 */
  name: string;
  /** 地址 */
  address: string;
  /** 坐标 */
  location: Coordinates;
  /** 类型编码 */
  typeCode: string;
  /** 类型描述 */
  typeDes: string;
  /** 电话 */
  tel?: string;
  /** 距离（米），仅周边搜索返回 */
  distance?: number;
  /** 城市名称 */
  cityName?: string;
  /** 城市编码 */
  cityCode?: string;
  /** 省份名称 */
  provinceName?: string;
  /** 区域名称 */
  adName?: string;
  /** 区域编码 */
  adCode?: string;
}

/**
 * POI 搜索选项
 */
export interface POISearchOptions {
  /** 搜索关键词 */
  keyword: string;
  /** 城市名称或城市编码（可选） */
  city?: string;
  /** POI 类型（可选），多个类型用 | 分隔 */
  types?: string;
  /** 每页记录数，默认 20，最大 50 */
  pageSize?: number;
  /** 当前页码，从 1 开始，默认 1 */
  pageNum?: number;
  /** 是否按照距离排序，需要设置中心点 */
  sortByDistance?: boolean;
  /** 中心点坐标，用于距离排序或周边搜索 */
  center?: Coordinates;
}

/**
 * 周边搜索选项
 */
export interface NearbySearchOptions {
  /** 搜索关键词 */
  keyword: string;
  /** 中心点坐标 */
  center: Coordinates;
  /** 搜索半径，单位：米，默认 1000，最大 50000 */
  radius?: number;
  /** POI 类型（可选），多个类型用 | 分隔 */
  types?: string;
  /** 每页记录数，默认 20，最大 50 */
  pageSize?: number;
  /** 当前页码，从 1 开始，默认 1 */
  pageNum?: number;
}

/**
 * 沿途搜索选项
 */
export interface AlongSearchOptions {
  /** 搜索关键词 */
  keyword: string;
  /** 路线坐标点数组 */
  polyline: Coordinates[];
  /** 搜索范围，单位：米，默认 500，最大 1000 */
  range?: number;
  /** POI 类型（可选），多个类型用 | 分隔 */
  types?: string;
}

/**
 * 多边形搜索选项
 */
export interface PolygonSearchOptions {
  /** 搜索关键词 */
  keyword: string;
  /** 多边形顶点坐标数组 */
  polygon: Coordinates[];
  /** POI 类型（可选），多个类型用 | 分隔 */
  types?: string;
  /** 每页记录数，默认 20，最大 50 */
  pageSize?: number;
  /** 当前页码，从 1 开始，默认 1 */
  pageNum?: number;
}

/**
 * 输入提示选项
 */
export interface InputTipsOptions {
  /** 关键词 */
  keyword: string;
  /** 城市名称或城市编码（可选） */
  city?: string;
  /** POI 类型（可选），多个类型用 | 分隔 */
  types?: string;
}

/**
 * 输入提示结果
 */
export interface InputTip {
  /** 提示 ID */
  id: string;
  /** 名称 */
  name: string;
  /** 地址 */
  address: string;
  /** 坐标（可能为空） */
  location?: Coordinates;
  /** 类型编码 */
  typeCode?: string;
  /** 城市名称 */
  cityName?: string;
  /** 区域名称 */
  adName?: string;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** POI 列表 */
  pois: POI[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  pageNum: number;
  /** 每页记录数 */
  pageSize: number;
  /** 总页数 */
  pageCount: number;
}

/**
 * 输入提示结果
 */
export interface InputTipsResult {
  /** 提示列表 */
  tips: InputTip[];
}