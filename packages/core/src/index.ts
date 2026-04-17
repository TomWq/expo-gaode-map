import * as React from 'react';
import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import ExpoGaodeMapModuleWithHelpers from './ExpoGaodeMapModule';

// 导出类型定义（包含所有通用类型）
export * from './types';
// 导出原生模块
export { default as ExpoGaodeMapModule } from './ExpoGaodeMapModule';

// 导出地图视图组件
export { default as MapView } from './ExpoGaodeMapView';
export { useMap } from './components/MapContext';
export { MapUI } from './components/MapUI';
export { RouteOverlay } from './components/RouteOverlay';
export { AreaMaskOverlay } from './components/AreaMaskOverlay';
export { useRoutePlayback } from './hooks/useRoutePlayback';

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
export { default as ExpoGaodeMapOfflineModule } from './utils/OfflineMapManager';

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

type PermissionHookOptions<TGetResult, TRequestResult> = {
  getMethod: () => Promise<TGetResult>;
  requestMethod: () => Promise<TRequestResult>;
};

const isHarmonyPlatform = (): boolean => {
  const os = (Platform.OS as string).toLowerCase();
  return os === 'harmony' || os === 'ohos';
};

function createHarmonyPermissionHook<TGetResult, TRequestResult>(
  options: PermissionHookOptions<TGetResult, TRequestResult>
): () => readonly [
  TGetResult | null,
  () => Promise<TRequestResult>,
  () => Promise<TGetResult>
] {
  const { getMethod, requestMethod } = options;

  const getFallbackPermissionStatus = () =>
    ({
      granted: false,
      status: 'undetermined',
      canAskAgain: true,
      isPermanentlyDenied: false,
      backgroundLocation: false,
      expires: 'never',
    });

  const isHarmonyNativeModuleReady = (): boolean => {
    let turboModule = null;
    try {
      turboModule = TurboModuleRegistry.get('ExpoGaodeMap');
    } catch {
      turboModule = null;
    }
    const legacyModule = NativeModules.ExpoGaodeMap;
    return !!(turboModule || legacyModule);
  };

  return () => {
    const [status, setStatus] = React.useState<TGetResult | null>(null);

    const getPermission = React.useCallback(async (): Promise<TGetResult> => {
      if (!isHarmonyNativeModuleReady()) {
        const fallback = getFallbackPermissionStatus() as unknown as TGetResult;
        setStatus(fallback);
        return fallback;
      }

      try {
        const nextStatus = await getMethod();
        setStatus(nextStatus);
        return nextStatus;
      } catch (error) {
        const fallback = getFallbackPermissionStatus() as unknown as TGetResult;
        console.warn(`[expo-gaode-map] Harmony getPermission fallback: ${JSON.stringify(error)}`);
        setStatus(fallback);
        return fallback;
      }
    }, [getMethod]);

    const requestPermission = React.useCallback(async (): Promise<TRequestResult> => {
      if (!isHarmonyNativeModuleReady()) {
        const fallback = getFallbackPermissionStatus() as unknown as TRequestResult;
        console.warn('[expo-gaode-map] Harmony requestPermission skipped: native module not ready');
        await getPermission();
        return fallback;
      }

      try {
        const nextStatus = await requestMethod();
        await getPermission();
        return nextStatus;
      } catch (error) {
        console.warn(`[expo-gaode-map] Harmony requestPermission fallback: ${JSON.stringify(error)}`);
        const fallback = getFallbackPermissionStatus() as unknown as TRequestResult;
        await getPermission();
        return fallback;
      }
    }, [getPermission, requestMethod]);

    React.useEffect(() => {
      void getPermission();
    }, [getPermission]);

    return [status, requestPermission, getPermission] as const;
  };
}

function createLegacyPermissionHook<TGetResult, TRequestResult>(
  options: PermissionHookOptions<TGetResult, TRequestResult>
): () => readonly [
  TGetResult | null,
  () => Promise<TRequestResult>,
  () => Promise<TGetResult>
] {
  const { getMethod, requestMethod } = options;

  return () => {
    const [status, setStatus] = React.useState<TGetResult | null>(null);

    const getPermission = React.useCallback(async (): Promise<TGetResult> => {
      const nextStatus = await getMethod();
      setStatus(nextStatus);
      return nextStatus;
    }, [getMethod]);

    const requestPermission = React.useCallback(async (): Promise<TRequestResult> => {
      const requestStatus = await requestMethod();
      await getPermission();
      return requestStatus;
    }, [getPermission, requestMethod]);

    React.useEffect(() => {
      void getPermission();
    }, [getPermission]);

    return [status, requestPermission, getPermission] as const;
  };
}

function createPermissionHookCompat<TGetResult, TRequestResult>(
  options: PermissionHookOptions<TGetResult, TRequestResult>
) {
  if (isHarmonyPlatform()) {
    return createHarmonyPermissionHook(options);
  }

  return createLegacyPermissionHook(options);
}


/**
 * Check or request permissions to access the location.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = useLocationPermissions();
 * ```
 */
export const useLocationPermissions = createPermissionHookCompat({
  getMethod: getPermissionsAsync,
  requestMethod: requestPermissionsAsync,
})

// 导出便捷读取的 SDK 配置与 webKey
export { getSDKConfig, getWebKey } from './ExpoGaodeMapModule';
export {
  buildLatLngBounds,
  fitCameraToCoordinates,
  getRouteBounds,
  parseMultiRingPolyline,
} from './utils/RouteUtils';

// 默认导出原生模块
export { default } from './ExpoGaodeMapModule';
