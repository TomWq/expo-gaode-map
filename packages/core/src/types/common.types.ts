/**
 * 高德地图通用类型定义
 * 基于 Expo Modules API
 */

/**
 * 点坐标（屏幕坐标）
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 地理坐标
 */
export interface LatLng {
  /**
   * 纬度
   */
  latitude: number;

  /**
   * 经度
   */
  longitude: number;
}

/**
 * 地图标注点（POI）
 */
export interface MapPoi {
  /**
   * 标注点 ID
   */
  id: string;

  /**
   * 标注点名称
   */
  name: string;

  /**
   * 标注点坐标
   */
  position: LatLng;
}

/**
 * 矩形坐标边界
 */
export interface LatLngBounds {
  /**
   * 西南坐标
   */
  southwest: LatLng;

  /**
   * 东北坐标
   */
  northeast: LatLng;
}

/**
 * 地图相机位置
 */
export interface CameraPosition {
  /**
   * 中心坐标
   */
  target?: LatLng;

  /**
   * 缩放级别（3-20）
   */
  zoom?: number;

  /**
   * 朝向、旋转角度（0-360度）
   */
  bearing?: number;

  /**
   * 倾斜角度（0-60度）
   */
  tilt?: number;
}

/**
 * 地图类型
 */
export enum MapType {
  /**
   * 标准地图
   */
  Standard = 0,

  /**
   * 卫星地图
   */
  Satellite = 1,

  /**
   * 夜间地图
   */
  Night = 2,

  /**
   * 导航地图
   */
  Navi = 3,

  /**
   * 公交地图
   * @platform android
   */
  Bus = 4,
}

/**
 * 颜色值类型
 * 支持：
 * - 十六进制字符串: '#AARRGGBB' 或 '#RRGGBB'
 * - 数字格式: 0xAARRGGBB (用于 Android)
 */
export type ColorValue = string | number;
