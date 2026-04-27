import { Platform } from 'react-native';

import type {
  Coordinates,
  CoordinateType,
  GeoLanguage,
  HeadingListener,
  LatLng,
  LatLngPoint,
  LocationListener,
  ReGeocode,
} from '../types';
import type { PermissionStatus } from '../types/common.types';
import { ErrorHandler, ErrorLogger } from '../utils/ErrorHandler';
import { normalizeLatLng } from '../utils/GeoUtils';
import { getNativeModule } from './nativeModule';
import {
  normalizeCoordinateType,
  normalizeGeoLanguage,
  normalizeHeadingEvent,
  normalizeLocationResult,
  normalizePermissionStatus,
} from './normalizers';
import { assertPrivacyReady } from './privacy';

export const locationMethods = {
  start(): void {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule(true);
    if (!nativeModule) return;
    try {
      nativeModule.start();
    } catch (error) {
      ErrorLogger.warn('start 失败', { error });
    }
  },

  stop(): void {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule(true);
    if (!nativeModule) return;
    try {
      nativeModule.stop();
    } catch (error) {
      ErrorLogger.warn('stop 失败', { error });
    }
  },

  isStarted(): Promise<boolean> {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule(true);
    if (!nativeModule) return Promise.resolve(false);
    try {
      return nativeModule.isStarted();
    } catch (error) {
      ErrorLogger.warn('isStarted 失败', { error });
      return Promise.resolve(false);
    }
  },

  async getCurrentLocation(): Promise<Coordinates | ReGeocode> {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      const location = await nativeModule.getCurrentLocation();
      return normalizeLocationResult(location);
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '获取当前位置');
    }
  },

  async coordinateConvert(coordinate: LatLngPoint, type: CoordinateType): Promise<LatLng> {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      const normalizedCoordinate = normalizeLatLng(coordinate);
      const normalizedType = normalizeCoordinateType(type);

      if (normalizedType === null) {
        return normalizedCoordinate;
      }

      return await nativeModule.coordinateConvert(normalizedCoordinate, normalizedType);
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '坐标转换');
    }
  },

  setGeoLanguage(language: GeoLanguage | string): void {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule(true);
    if (!nativeModule) return;
    try {
      nativeModule.setGeoLanguage(normalizeGeoLanguage(language));
    } catch (error) {
      ErrorLogger.warn('setGeoLanguage 失败', { language, error });
    }
  },

  setLocatingWithReGeocode(isReGeocode: boolean): void {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule(true);
    if (!nativeModule) return;
    try {
      nativeModule.setLocatingWithReGeocode(isReGeocode);
    } catch (error) {
      ErrorLogger.warn('setLocatingWithReGeocode 失败', { isReGeocode, error });
    }
  },

  get isBackgroundLocationEnabled(): boolean {
    const nativeModule = getNativeModule(true);
    if (!nativeModule) return false;
    return nativeModule.isBackgroundLocationEnabled === true;
  },

  /**
   * 检查位置权限状态
   */
  async checkLocationPermission(): Promise<PermissionStatus> {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return normalizePermissionStatus(await nativeModule.checkLocationPermission());
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '检查权限');
    }
  },

  /**
   * 请求前台位置权限（增强版）
   */
  async requestLocationPermission(): Promise<PermissionStatus> {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      const result = normalizePermissionStatus(await nativeModule.requestLocationPermission());
      if (!result.granted) {
        ErrorLogger.warn('前台位置权限未授予', result);
      }
      return result;
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '请求前台权限');
    }
  },

  /**
   * 请求后台位置权限
   * 注意：必须在前台权限已授予后才能请求
   */
  async requestBackgroundLocationPermission(): Promise<PermissionStatus> {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      const result = normalizePermissionStatus(await nativeModule.requestBackgroundLocationPermission());
      if (!result.granted) {
        ErrorLogger.warn('后台位置权限未授予', result);
      }
      return result;
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '请求后台权限');
    }
  },

  /**
   * 打开应用设置页面
   * 引导用户手动授予权限
   */
  openAppSettings(): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      nativeModule.openAppSettings();
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '打开设置');
    }
  },

  setAllowsBackgroundLocationUpdates(allows: boolean): void {
    assertPrivacyReady('sdk');
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }

    if (
      Platform.OS === 'ios' &&
      allows &&
      nativeModule &&
      nativeModule.isBackgroundLocationEnabled === false
    ) {
      ErrorLogger.warn(
        '⚠️ [ExpoGaodeMap] iOS 后台定位未正确配置，setAllowsBackgroundLocationUpdates(true) 可能不会生效，请检查 Info.plist 是否包含 UIBackgroundModes: location，或者在 app.json 中配置 enableBackgroundLocation: true，然后重新执行 npx expo prebuild',
      );
    }

    if (
      Platform.OS === 'android' &&
      allows &&
      nativeModule &&
      nativeModule.checkLocationPermission
    ) {
      nativeModule
        .checkLocationPermission()
        .then((status: PermissionStatus) => {
          if (!status.backgroundLocation) {
            ErrorLogger.warn(
              '⚠️ [ExpoGaodeMap] Android 后台位置权限未授予，setAllowsBackgroundLocationUpdates(true) 可能不会生效，请先通过 requestBackgroundLocationPermission 或系统设置授予后台定位权限,或者检查是否在 app.json 中配置了 enableBackgroundLocation: true，然后重新执行 npx expo prebuild',
            );
          }
        })
        .catch(() => {
          // 忽略检查失败，只影响日志，不影响功能
        });
    }

    nativeModule.setAllowsBackgroundLocationUpdates(allows);
  },

  /**
   * 添加定位监听器（便捷方法）
   * 自动订阅 onLocationUpdate 事件，提供容错处理
   * @param listener 定位回调函数
   * @returns 订阅对象，调用 remove() 取消监听
   * 注意：如果使用 Config Plugin 配置了 API Key，无需调用 initSDK()
   */
  addLocationListener(listener: LocationListener): { remove: () => void } {
    assertPrivacyReady('sdk');
    const module = getNativeModule();
    if (!module) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    if (!module.addListener) {
      ErrorLogger.warn('Native module does not support events');
      return {
        remove: () => { },
      };
    }

    return module.addListener('onLocationUpdate', (location) => {
      listener(normalizeLocationResult(location));
    }) || {
      remove: () => { },
    };
  },

  /**
   * 添加方向监听器（iOS）
   * 自动归一化 heading 事件字段，兼容旧版原生返回结构
   */
  addHeadingListener(listener: HeadingListener): { remove: () => void } {
    assertPrivacyReady('sdk');
    const module = getNativeModule();
    if (!module) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    if (!module.addListener) {
      ErrorLogger.warn('Native module does not support events');
      return {
        remove: () => { },
      };
    }

    return module.addListener('onHeadingUpdate', (heading) => {
      listener(normalizeHeadingEvent(heading));
    }) || {
      remove: () => { },
    };
  },
};
