// 导出类型定义
export * from './ExpoGaodeMap.types';
export * from './types';

// 导出原生模块 - 直接使用，无需封装
export { default as ExpoGaodeMapModule } from './ExpoGaodeMapModule';

// 从 ExpoGaodeMapModule 重新导出类型，方便使用
export type { SDKConfig, PermissionStatus } from './ExpoGaodeMapModule';

// 导出地图视图组件
export { default as MapView } from './ExpoGaodeMapView';
export type { MapViewRef } from './ExpoGaodeMapView';

// 导出覆盖物组件
export {
  Marker,
  Polyline,
  Polygon,
  Circle,
  HeatMap,
  MultiPoint,
  Cluster,
} from './components/overlays';

// 默认导出原生模块
export { default } from './ExpoGaodeMapModule';
