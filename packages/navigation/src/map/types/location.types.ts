/**
 * 高德地图定位相关类型定义
 * 基于 Expo Modules API
 */

import type { LatLng } from './common.types';

/**
 * 坐标信息（基础定位）
 */
export interface Coordinates extends LatLng {
  /**
   * 海拔高度（米）
   */
  altitude: number;

  /**
   * 水平精度（米）
   */
  accuracy: number;

  /**
   * 移动方向（度，需要 GPS）
   */
  heading: number;

  /**
   * 移动速度（米/秒，需要 GPS）
   */
  speed: number;

  /**
   * 时间戳
   */
  timestamp: number;

  /**
   * 是否有可用坐标
   * @platform ios
   */
  isAvailableCoordinate?: boolean;

  /**
   * 格式化地址（仅在启用逆地理编码时可用）
   */
  address?: string;
}

/**
 * 逆地理编码信息
 */
export interface ReGeocode extends Coordinates {
  /**
   * 格式化地址
   */
  address: string;

  /**
   * 国家
   */
  country: string;

  /**
   * 省/直辖市，如 `湖北省`
   */
  province: string;

  /**
   * 市，如 `武汉市`
   */
  city: string;

  /**
   * 区，如 `武昌区`
   */
  district: string;

  /**
   * 城市编码
   */
  cityCode: string;

  /**
   * 区域编码
   */
  adCode: string;

  /**
   * 街道名称
   */
  street: string;

  /**
   * 门牌号
   */
  streetNumber: string;

  /**
   * 兴趣点名称
   */
  poiName: string;

  /**
   * 所属兴趣点名称
   */
  aoiName: string;

  /**
   * 定位信息描述
   * @platform android
   */
  description?: string;

  /**
   * 坐标系类型
   * @platform android
   */
  coordType?: 'GCJ02' | 'WGS84';

  /**
   * 室内定位建筑物ID
   * @platform android
   */
  buildingId?: string;
}

/**
 * 定位精度级别
 * @platform ios
 */
export enum LocationAccuracy {
  /**
   * 最适合导航
   */
  BestForNavigation = 0,

  /**
   * 最高精度（约10米，耗时约10秒）
   */
  Best = 1,

  /**
   * 10米精度
   */
  NearestTenMeters = 2,

  /**
   * 100米精度（推荐）
   */
  HundredMeters = 3,

  /**
   * 1公里精度
   */
  Kilometer = 4,

  /**
   * 3公里精度
   */
  ThreeKilometers = 5,
}

/**
 * 定位模式
 * @platform android
 */
export enum LocationMode {
  /**
   * 高精度模式（网络+卫星）
   */
  HighAccuracy = 1,

  /**
   * 低功耗模式（仅网络）
   */
  BatterySaving = 2,

  /**
   * 仅设备模式（仅卫星）
   */
  DeviceSensors = 3,
}

/**
 * 坐标系类型
 */
export enum CoordinateType {
  /**
   * 高德坐标系
   */
  AMap = -1,

  /**
   * 百度坐标系
   */
  Baidu = 0,

  /**
   * MapBar坐标系
   */
  MapBar = 1,

  /**
   * MapABC坐标系
   */
  MapABC = 2,

  /**
   * 搜搜地图坐标系
   */
  SoSoMap = 3,

  /**
   * 阿里云坐标系
   */
  AliYun = 4,

  /**
   * 谷歌坐标系
   */
  Google = 5,

  /**
   * GPS坐标系
   */
  GPS = 6,
}

/**
 * 地理语言
 */
export type GeoLanguage = 'DEFAULT' | 'EN' | 'ZH';

/**
 * 网络协议
 * @platform android
 */
export type LocationProtocol = 'HTTP' | 'HTTPS';

/**
 * 定位配置选项
 */
export interface LocationOptions {
  /**
   * 是否返回逆地理信息
   * @default true
   */
  withReGeocode?: boolean;

  /**
   * 定位精度
   * @platform ios
   */
  accuracy?: LocationAccuracy;

  /**
   * 定位模式
   * @platform android
   */
  mode?: LocationMode;

  /**
   * 是否单次定位
   * @platform android
   * @default false
   */
  onceLocation?: boolean;

  /**
   * 定位间隔（毫秒）
   * @platform android
   * @default 2000
   */
  interval?: number;

  /**
   * 定位超时时间（秒）
   * @platform ios
   * @default 10
   */
  timeout?: number;

  /**
   * 逆地理编码超时时间（秒）
   * @platform ios
   * @default 2
   */
  reGeocodeTimeout?: number;

  /**
   * 最小更新距离（米）
   * @platform ios
   */
  distanceFilter?: number;

  /**
   * 是否启用设备传感器
   * @platform android
   * @default false
   */
  sensorEnable?: boolean;

  /**
   * 是否允许WIFI刷新
   * @platform android
   * @default true
   */
  wifiScan?: boolean;

  /**
   * 是否GPS优先
   * @platform android
   * @default false
   */
  gpsFirst?: boolean;

  /**
   * 是否等待WIFI列表刷新
   * 定位精度会更高，但是定位速度会变慢1-3秒
   * @platform android
   * @default false
   */
  onceLocationLatest?: boolean;

  /**
   * 逆地理语言
   */
  geoLanguage?: GeoLanguage;

  /**
   * 是否允许后台定位
   * @default false
   */
  allowsBackgroundLocationUpdates?: boolean;

  /**
   * 是否自动暂停定位
   * @platform ios
   * @default false
   */
  pausesLocationUpdatesAutomatically?: boolean;

  /**
   * 是否使用缓存策略
   * @platform android
   * @default true
   */
  locationCacheEnable?: boolean;

  /**
   * 网络请求超时时间（毫秒）
   * @platform android
   * @default 30000
   */
  httpTimeout?: number;

  /**
   * 网络协议
   * @platform android
   * @default 'HTTP'
   */
  protocol?: LocationProtocol;
}

/**
 * 定位事件监听器
 */
export type LocationListener = (location: Coordinates | ReGeocode) => void;
