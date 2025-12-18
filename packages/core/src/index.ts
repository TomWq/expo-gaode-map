
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

// 导出模块检测工具
export {
  requireModule,
  OptionalModules,
  getInstalledModules,
  printModuleInfo,
  createLazyLoader,
} from './utils/ModuleLoader';

// 导出错误处理工具
export {
  ErrorHandler,
  ErrorLogger,
  GaodeMapError,
  ErrorType,
} from './utils/ErrorHandler';
export type { ErrorDetails } from './utils/ErrorHandler';

// 导出平台检测工具
export {
  PlatformDetector,
  DeviceType,
  FoldState,
  isAndroid14Plus,
  isiOS17Plus,
  isTablet,
  isFoldable,
  isIPad,
} from './utils/PlatformDetector';
export type { DeviceInfo, SystemVersion } from './utils/PlatformDetector';

// 导出权限工具类（仅提供文案和诊断，实际权限请求使用 ExpoGaodeMapModule）
export {
  PermissionUtils,
  PermissionManager, // 向后兼容的别名
  LocationPermissionType,
} from './utils/PermissionUtils';

// 导出折叠屏适配组件
export {
  FoldableMapView,
  useFoldableMap,
} from './components/FoldableMapView';
export type {
  FoldableMapViewProps,
  FoldableConfig,
} from './components/FoldableMapView';

// 导出便捷读取的 SDK 配置与 webKey
export { getSDKConfig, getWebKey } from './ExpoGaodeMapModule';

// 默认导出原生模块
export { default } from './ExpoGaodeMapModule';
