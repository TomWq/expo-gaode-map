/**
 * 导航模块坐标类型定义
 * 简化版本，仅包含导航所需的基础坐标
 */

/**
 * 导航坐标点（简化版）
 */
export interface NaviPoint {
  latitude: number;
  longitude: number;
}

/**
 * 带名称的坐标点（POI）
 */
export interface NamedCoordinates extends NaviPoint {
  /** 名称 */
  name?: string;
  /** POI ID */
  poiId?: string;
}

/**
 * @deprecated 请使用 `NaviPoint`
 */
export type Coordinates = NaviPoint;
