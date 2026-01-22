
import { createPermissionHook } from 'expo-modules-core';
import ExpoGaodeMapModuleWithHelpers from './ExpoGaodeMapModule';

// 导出类型定义（包含所有通用类型）
export * from './types';
// 导出原生模块
export { default as ExpoGaodeMapModule } from './ExpoGaodeMapModule';

// 导出地图视图组件
export { default as MapView } from './ExpoGaodeMapView';
export { useMap } from './components/MapContext';
export { MapUI } from './components/MapUI';

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

// 导出离线地图 API
export { OfflineMapManager as ExpoGaodeMapOfflineModule } from './utils/OfflineMapManager';

export type {
  OfflineMapInfo,
  OfflineMapStatus,
  OfflineMapDownloadConfig,
  OfflineMapDownloadEvent,
  OfflineMapCompleteEvent,
  OfflineMapErrorEvent,
  OfflineMapPausedEvent,
  OfflineMapCancelledEvent,
  OfflineMapStorageInfo,
  OfflineMapEvents,
} from './types/offline.types';

const requestPermissionsAsync = ExpoGaodeMapModuleWithHelpers.requestLocationPermission
const getPermissionsAsync = ExpoGaodeMapModuleWithHelpers.checkLocationPermission


/**
 * Check or request permissions to access the location.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useLocationPermissions();
 * ```
 */
export const useLocationPermissions = createPermissionHook({
  getMethod: getPermissionsAsync,
  requestMethod: requestPermissionsAsync,
})

// 导出便捷读取的 SDK 配置与 webKey
export { getSDKConfig, getWebKey } from './ExpoGaodeMapModule';
