/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-11-13 14:45:15
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-11-14 16:15:52
 * @FilePath     : /expo-gaode-map/src/index.ts
 * @Description  : 高德地图 Expo Module 主导出文件
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */

// 导出类型定义
export * from './ExpoGaodeMap.types';
export * from './types';

// 导出原生模块
export { default as ExpoGaodeMapModule } from './ExpoGaodeMapModule';

// 导出 SDK 模块
export { default as AMapSDK, initSDK, getVersion } from './modules/AMapSDK';

// 导出定位模块
export {
  default as AMapLocation,
  configure,
  start,
  stop,
  isStarted,
  getCurrentLocation,
  addLocationListener,
  coordinateConvert,
  startUpdatingHeading,
  stopUpdatingHeading,
} from './modules/AMapLocation';

// 地图视图控制已移至 MapView 的 ref 调用
// 使用方式: const mapRef = useRef<MapViewRef>(null); mapRef.current.moveCamera() 等

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

// 默认导出：直接重新导出所有模块
export { default } from './ExpoGaodeMapModule';
