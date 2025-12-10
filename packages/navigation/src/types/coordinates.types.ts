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

// 为了向后兼容，导出 NaviPoint 作为 Coordinates 别名
export type Coordinates = NaviPoint;