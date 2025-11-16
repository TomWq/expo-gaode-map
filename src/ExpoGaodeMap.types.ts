

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
 */
export type ExpoGaodeMapModuleEvents = {
  /**
   * 定位更新事件
   */
  onLocationUpdate: (location: any) => void;
  
  /**
   * 定位错误事件
   */
  onLocationError: (error: { code: number; message: string }) => void;
};

/**
 * Expo 地图视图属性（用于主视图组件）
 */
export type { MapViewProps as ExpoGaodeMapViewProps } from './types';
