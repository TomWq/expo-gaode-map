/**
 * 高德地图 Expo 模块类型定义
 */

import type { Coordinates, ReGeocode } from './types';

// 导出所有类型定义
export * from './types';

// 重新导出常用类型，方便直接从主模块导入
export type {
  // 通用类型
  LatLng,
  Point,
  CameraPosition,
  LatLngBounds,
  MapPoi,
  
  // 地图视图
  MapViewProps,
  CameraEvent,
  
  // 定位
  Coordinates,
  ReGeocode,
  LocationOptions,
  LocationListener,
  
  // 覆盖物
  MarkerProps,
  PolylineProps,
  PolygonProps,
  CircleProps,
  HeatMapProps,
  MultiPointProps,
  ClusterProps,
} from './types';

export {
  MapType,
  LocationMode,
  LocationAccuracy,
  CoordinateType,
} from './types';

/**
 * Expo 模块事件类型
 * 定义了原生模块可以触发的事件
 */
export type ExpoGaodeMapModuleEvents = {
  /**
   * 定位更新事件
   * 当位置发生变化时触发
   * @param location 位置信息，包含坐标和可选的逆地理编码信息
   */
  onLocationUpdate: (location: Coordinates | ReGeocode) => void;
  
  /**
   * 方向更新事件（iOS）
   * 当设备方向发生变化时触发
   * @param heading 方向信息
   */
  onHeadingUpdate: (heading: {
    /** 磁北方向角度 (0-359.9) */
    magneticHeading: number;
    /** 真北方向角度 (0-359.9) */
    trueHeading: number;
    /** 方向精度 */
    headingAccuracy: number;
    /** X 轴原始数据 */
    x: number;
    /** Y 轴原始数据 */
    y: number;
    /** Z 轴原始数据 */
    z: number;
    /** 时间戳 */
    timestamp: number;
  }) => void;
};

/**
 * Expo 地图视图属性（用于主视图组件）
 */
export type { MapViewProps as ExpoGaodeMapViewProps } from './types';
