

/**
 * 高德地图 Expo Module 类型定义统一导出
 * 基于 Expo Modules API 重新设计
 */

// 通用类型
export type {
  Point,
  LatLng,
  MapPoi,
  LatLngBounds,
  CameraPosition,
  ColorValue,
} from './common.types';

export { MapType } from './common.types';

// 地图视图类型
export type {
  LocationEvent,
  CameraEvent,
  MapViewProps,
  MapViewMethods,
  MapViewRef,
} from './map-view.types';

// 定位类型
export type {
  Coordinates,
  ReGeocode,
  LocationOptions,
  LocationListener,
  GeoLanguage,
  LocationProtocol,
} from './location.types';

export {
  LocationAccuracy,
  LocationMode,
  CoordinateType,
} from './location.types';

// 覆盖物类型
export type {
  MarkerProps,
  PolylineProps,
  PolygonProps,
  CircleProps,
  HeatMapProps,
  MultiPointItem,
  MultiPointProps,
  ClusterParams,
  ClusterPoint,
  ClusterProps,
} from './overlays.types';

//预加载类型
export type {
  PreloadConfig,
  PreloadStatus,
  PreloadStrategy,
  PreloadInstance,
  UseMapPreloadReturn,
  MapPreloaderProps
} from './preload.types';