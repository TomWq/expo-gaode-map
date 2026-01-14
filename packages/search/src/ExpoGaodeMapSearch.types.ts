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
  /** 逆地理编码 */
  RE_GEOCODE = 'reGeocode',
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
  /** 
   * 深度信息 (Android SDK V9.4.0+ 新增)
   * 包含评分、营业时间、人均消费等扩展信息
   */
  business?: {
    opentime?: string;
    opentimeToday?: string;
    rating?: string;
    cost?: string;
    parkingType?: string;
    tag?: string;
    tel?: string;
    alias?: string;
    businessArea?: string;
  };
  /**
   * 图片信息
   */
  photos?: Array<{
    title?: string;
    url?: string;
  }>;
  /** 室内地图信息 */
  indoor?: {
    /** 楼层 */
    floor?: string;
    /** 楼层名称 */
    floorName?: string;
    /** POI ID */
    poiId?: string;
    /** 是否有室内地图 */
    hasIndoorMap?: boolean;
  };
}

/**
 * 商圈信息
 */
export interface BusinessArea {
  /** 名称 */
  name: string;
  /** 中心坐标 */
  location: Coordinates;
}

/**
 * 地址组成要素
 */
export interface AddressComponent {
  /** 省名称 */
  province: string;
  /** 市名称 */
  city: string;
  /** 区名称 */
  district: string;
  /** 乡镇名称 */
  township: string;
  /** 社区名称 */
  neighborhood: string;
  /** 建筑名称 */
  building: string;
  /** 城市编码 */
  cityCode: string;
  /** 区域编码 */
  adCode: string;
  /** 门牌信息 */
  streetNumber: {
    /** 街道名称 */
    street: string;
    /** 门牌号 */
    number: string;
    /** 坐标点 */
    location?: Coordinates;
    /** 方向 */
    direction: string;
    /** 距离 */
    distance: number;
  };
  /** 商圈列表 */
  businessAreas?: BusinessArea[];
}

/**
 * 道路信息
 */
export interface Road {
  /** 道路ID */
  id: string;
  /** 道路名称 */
  name: string;
  /** 距离 */
  distance: number;
  /** 方向 */
  direction: string;
  /** 坐标点 */
  location: Coordinates;
}

/**
 * 道路交叉口信息
 */
export interface RoadCross {
  /** 距离 */
  distance: number;
  /** 方向 */
  direction: string;
  /** 交叉口坐标 */
  location: Coordinates;
  /** 第一条道路ID */
  firstId: string;
  /** 第一条道路名称 */
  firstName: string;
  /** 第二条道路ID */
  secondId: string;
  /** 第二条道路名称 */
  secondName: string;
}

/**
 * 兴趣区域信息
 */
export interface AOI {
  /** AOI ID */
  id: string;
  /** AOI 名称 */
  name: string;
  /** 区域编码 */
  adCode: string;
  /** 中心点坐标 */
  location: Coordinates;
  /** 面积 */
  area: number;
}

/**
 * 逆地理编码选项
 */
export interface ReGeocodeOptions {
  /** 经纬度坐标 */
  location: Coordinates;
  /** 搜索半径，默认 1000 米 */
  radius?: number;
  /** 是否返回扩展信息，默认 true */
  requireExtension?: boolean;
}

/**
 * 逆地理编码结果
 */
export interface ReGeocodeResult {
  /** 格式化地址 */
  formattedAddress: string;
  /** 地址组成要素 */
  addressComponent: AddressComponent;
  /** 兴趣点列表 */
  pois: POI[];
  /** 道路列表 */
  roads: Road[];
  /** 道路交叉口列表 */
  roadCrosses: RoadCross[];
  /** 兴趣区域列表 */
  aois: AOI[];
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