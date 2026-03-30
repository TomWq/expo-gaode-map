import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

import {
  LatLng,
  Coordinates,
  ReGeocode,
  LocationListener,
  HeadingListener,
  HeadingUpdate,
  LatLngPoint,
  CoordinateType,
  GeoLanguage,
} from './types';
import type { ExpoGaodeMapModule as NativeExpoGaodeMapModule } from './types/native-module.types';
import { ErrorHandler, ErrorLogger } from './utils/ErrorHandler';
import { PrivacyConfig, PrivacyStatus, SDKConfig, PermissionStatus } from './types/common.types';
import { normalizeLatLng, normalizeLatLngList } from './utils/GeoUtils';

let nativeModuleCache: NativeExpoGaodeMapModule | null = null;

function normalizeCoordinateType(type: CoordinateType): number | null {
  switch (type) {
    case CoordinateType.AMap:
      return null;
    case CoordinateType.MapBar:
      return 1;
    case CoordinateType.Baidu:
      return 2;
    case CoordinateType.MapABC:
    case CoordinateType.SoSoMap:
      return 3;
    case CoordinateType.Google:
    case CoordinateType.GPS:
      return 0;
    default:
      throw ErrorHandler.invalidParameter(
        'type',
        'CoordinateType.AMap | MapBar | Baidu | MapABC | SoSoMap | Google | GPS',
        type
      );
  }
}

function normalizeGeoLanguage(language: GeoLanguage | string): GeoLanguage {
  const normalized = String(language).trim().toUpperCase();

  switch (normalized) {
    case 'DEFAULT':
      return 'DEFAULT';
    case 'EN':
    case 'EN-US':
    case 'EN_US':
    case 'EN-GB':
    case 'EN_GB':
      return 'EN';
    case 'ZH':
    case 'ZH-CN':
    case 'ZH_CN':
    case 'ZH-HANS':
    case 'ZH_HANS':
      return 'ZH';
    default:
      throw ErrorHandler.invalidParameter(
        'language',
        "'DEFAULT' | 'EN' | 'ZH' | 常见别名（如 'en', 'zh-CN'）",
        language
      );
  }
}

function normalizeLocationResult<T extends Coordinates | ReGeocode>(location: T): T {
  const rawLocation = location as T & { bearing?: number; heading?: number };
  const heading = rawLocation.heading ?? rawLocation.bearing ?? 0;

  return {
    ...rawLocation,
    heading,
  };
}

function normalizeHeadingEvent(payload: HeadingUpdate | Record<string, unknown>): HeadingUpdate {
  const raw = payload as Record<string, unknown>;
  const fallbackHeading = Number(raw.heading ?? raw.trueHeading ?? raw.magneticHeading ?? 0);
  const fallbackAccuracy = Number(raw.accuracy ?? raw.headingAccuracy ?? 0);

  return {
    magneticHeading: Number(raw.magneticHeading ?? fallbackHeading),
    trueHeading: Number(raw.trueHeading ?? fallbackHeading),
    headingAccuracy: fallbackAccuracy,
    x: Number(raw.x ?? 0),
    y: Number(raw.y ?? 0),
    z: Number(raw.z ?? 0),
    timestamp: Number(raw.timestamp ?? Date.now()),
  };
}

function normalizePermissionStatus(permission: PermissionStatus | Record<string, unknown>): PermissionStatus {
  const raw = permission as Partial<PermissionStatus> & Record<string, unknown>;
  const rawStatus = String(raw.status ?? '');

  let status: 'granted' | 'denied' | 'undetermined';
  switch (rawStatus) {
    case 'granted':
    case 'authorizedAlways':
    case 'authorizedWhenInUse':
      status = 'granted';
      break;
    case 'denied':
    case 'restricted':
      status = 'denied';
      break;
    case 'notDetermined':
    case 'undetermined':
    case 'unknown':
    case '':
    default:
      status = 'undetermined';
      break;
  }

  const granted = Boolean(raw.granted ?? (status === 'granted'));
  const shouldShowRationale =
    typeof raw.shouldShowRationale === 'boolean' ? raw.shouldShowRationale : undefined;
  const explicitPermanent =
    typeof raw.isPermanentlyDenied === 'boolean' ? raw.isPermanentlyDenied : undefined;

  const canAskAgain =
    typeof raw.canAskAgain === 'boolean'
      ? raw.canAskAgain
      : granted
        ? true
        : typeof shouldShowRationale === 'boolean'
          ? shouldShowRationale
          : explicitPermanent === true
            ? false
            : status === 'undetermined';

  const isPermanentlyDenied =
    explicitPermanent ??
    (!granted && status === 'denied' && canAskAgain === false);

  return {
    ...raw,
    expires: raw.expires ?? 'never',
    granted,
    status: status as unknown as PermissionStatus['status'],
    canAskAgain,
    isPermanentlyDenied,
  };
}

function getNativeModule(optional = false): NativeExpoGaodeMapModule | null {
  if (nativeModuleCache) {
    return nativeModuleCache;
  }

  try {
    nativeModuleCache = requireNativeModule<NativeExpoGaodeMapModule>('ExpoGaodeMap');
    return nativeModuleCache;
  } catch (error) {
    if (optional) {
      return null;
    }
    const moduleError = ErrorHandler.nativeModuleUnavailable();
    ErrorLogger.log(moduleError);
    throw moduleError;
  }
}

function getBoundNativeValue(
  module: NativeExpoGaodeMapModule,
  prop: PropertyKey
): unknown {
  const value = Reflect.get(module as object, prop, module as object);
  if (typeof value === 'function') {
    return (...args: unknown[]) =>
      (value as (...fnArgs: unknown[]) => unknown).apply(module, args);
  }
  return value;
}

const nativeModule = new Proxy({} as NativeExpoGaodeMapModule, {
  get(_target, prop) {
    const module = getNativeModule(true);
    return module ? getBoundNativeValue(module, prop) : undefined;
  },
});

// 记录最近一次 initSDK 的配置（含 webKey）
let _sdkConfig: SDKConfig | null = null;
let _isSDKInitialized = false;

const privacySensitiveMethodNames = new Set<string>([
  'start',
  'stop',
  'isStarted',
  'getCurrentLocation',
  'coordinateConvert',
  'setLocatingWithReGeocode',
  'setLocationMode',
  'setInterval',
  'setOnceLocation',
  'setSensorEnable',
  'setWifiScan',
  'setGpsFirst',
  'setOnceLocationLatest',
  'setGeoLanguage',
  'setLocationCacheEnable',
  'setHttpTimeOut',
  'setDesiredAccuracy',
  'setLocationTimeout',
  'setReGeocodeTimeout',
  'setDistanceFilter',
  'setPausesLocationUpdatesAutomatically',
  'setAllowsBackgroundLocationUpdates',
  'setLocationProtocol',
  'startUpdatingHeading',
  'stopUpdatingHeading',
  'checkLocationPermission',
  'requestLocationPermission',
  'requestBackgroundLocationPermission',
  'addLocationListener',
]);

function assertPrivacyReady(scene: 'map' | 'sdk' = 'sdk'): void {
  const nativeModule = getNativeModule();
  if (!nativeModule) {
    throw ErrorHandler.nativeModuleUnavailable();
  }
  const status = nativeModule.getPrivacyStatus();
  if (!status.isReady) {
    throw ErrorHandler.privacyNotAgreed(scene);
  }
}

// 扩展原生模块，添加便捷方法
const helperMethods = {

  /**
   * 初始化 SDK，并缓存配置（包含 webKey）
   * 注意：允许不提供任何 API Key，因为原生端可能已通过 Config Plugin 配置
   */
  initSDK(config: SDKConfig): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw ErrorHandler.nativeModuleUnavailable();
    try {
      const privacyStatus = nativeModule.getPrivacyStatus();
      if (!privacyStatus.isReady) {
        throw ErrorHandler.privacyNotAgreed('sdk');
      }

       // 检查是否有任何 key 被提供
    const hasJSKeys = !!(config.androidKey || config.iosKey);
    const hasWebKey = !!config.webKey;
     // 如果 JS 端没有提供 androidKey/iosKey,检查原生端是否已配置
       if (!hasJSKeys) {
        const isNativeConfigured =  nativeModule.isNativeSDKConfigured();
        if (!isNativeConfigured && !hasWebKey){
          throw ErrorHandler.invalidApiKey('both');
        }
         // 如果原生已配置,或者只提供了 webKey,继续初始化
          ErrorLogger.warn(
            isNativeConfigured
              ? 'SDK 使用原生端配置的 API Key'
              : 'SDK 初始化仅使用 webKey',
            { config }
          );
       }
      _sdkConfig = config ?? null;
      nativeModule.initSDK(config);
      _isSDKInitialized = true;
      ErrorLogger.warn('SDK 初始化成功', { config });
    } catch (error) {
      _isSDKInitialized = false;
      throw ErrorHandler.wrapNativeError(error, 'SDK 初始化');
    }
  },

  isSDKInitialized(): boolean {
    return _isSDKInitialized;
  },

  /**
   * 设置是否显示隐私政策弹窗
   * @deprecated 请优先使用 `setPrivacyConfig`
   */
  setPrivacyShow(hasShow: boolean, hasContainsPrivacy?: boolean): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw ErrorHandler.nativeModuleUnavailable();
    nativeModule.setPrivacyShow(hasShow, hasContainsPrivacy ?? hasShow);
  },

  /**
   * 设置用户是否同意隐私政策
   * @deprecated 请优先使用 `setPrivacyConfig`
   */
  setPrivacyAgree(hasAgree: boolean): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw ErrorHandler.nativeModuleUnavailable();
    nativeModule.setPrivacyAgree(hasAgree);
  },

  /**
   * 设置当前隐私协议版本
   * 当版本号变化时，之前的同意状态会失效
   */
  setPrivacyVersion(version: string): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw ErrorHandler.nativeModuleUnavailable();
    nativeModule.setPrivacyVersion(version);
  },

  /**
   * 清空已持久化的隐私同意状态
   */
  resetPrivacyConsent(): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw ErrorHandler.nativeModuleUnavailable();
    nativeModule.resetPrivacyConsent();
  },

  /**
   * 一次性同步完整的隐私状态
   * 推荐业务层只调用这个方法
   */
  setPrivacyConfig(config: PrivacyConfig): void {
    const nativeModule = getNativeModule();
    if (!nativeModule) throw ErrorHandler.nativeModuleUnavailable();
    if (typeof config.privacyVersion === 'string') {
      nativeModule.setPrivacyVersion(config.privacyVersion);
    }
    nativeModule.setPrivacyShow(
      config.hasShow,
      config.hasContainsPrivacy ?? config.hasShow
    );
    nativeModule.setPrivacyAgree(config.hasAgree);
  },

  getPrivacyStatus(): PrivacyStatus {
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      return {
        hasShow: false,
        hasContainsPrivacy: false,
        hasAgree: false,
        isReady: false,
        privacyVersion: null,
        agreedPrivacyVersion: null,
        restoredFromStorage: false,
      };
    }
    return nativeModule.getPrivacyStatus();
  },

  calculateDistanceBetweenPoints(p1: LatLngPoint, p2: LatLngPoint): number {
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    return nativeModule.distanceBetweenCoordinates(
      normalizeLatLng(p1),
      normalizeLatLng(p2)
    );
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const nativeModule = getNativeModule();
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    return nativeModule.distanceBetweenCoordinates(
      { latitude: lat1, longitude: lon1 },
      { latitude: lat2, longitude: lon2 }
    );
  },

  setLoadWorldVectorMap(enabled: boolean): void {
    const nativeModule = getNativeModule(true);
    if (!nativeModule) return;
    try {
      nativeModule.setLoadWorldVectorMap(enabled);
    } catch (error) {
      ErrorLogger.warn('setLoadWorldVectorMap 失败', { enabled, error });
    }
  },

  getVersion(): string {
    const nativeModule = getNativeModule(true);
    if (!nativeModule) return '0.0.0';
    try {
      return nativeModule.getVersion();
    } catch (error) {
      ErrorLogger.warn('getVersion 失败', { error });
      return '0.0.0';
    }
  },

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

  // ==================== 几何计算方法 ====================

  /**
   * 计算两个坐标点之间的距离
   * @param coordinate1 第一个坐标点
   * @param coordinate2 第二个坐标点
   * @returns 两点之间的距离（单位：米）
   */
  distanceBetweenCoordinates(coordinate1: LatLngPoint, coordinate2: LatLngPoint): number {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.distanceBetweenCoordinates(
        normalizeLatLng(coordinate1),
        normalizeLatLng(coordinate2)
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '计算距离');
    }
  },

  /**
   * 判断点是否在圆内
   * @param point 要判断的点
   * @param center 圆心坐标
   * @param radius 圆半径（单位：米）
   * @returns 是否在圆内
   */
  isPointInCircle(point: LatLngPoint, center: LatLngPoint, radius: number): boolean {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.isPointInCircle(
        normalizeLatLng(point),
        normalizeLatLng(center),
        radius
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '判断点是否在圆内');
    }
  },

  /**
   * 判断点是否在多边形内
   * @param point 要判断的点
   * @param polygon 多边形的顶点坐标数组，支持嵌套数组（多边形空洞）
   * @returns 是否在多边形内
   */
  isPointInPolygon(point: LatLngPoint, polygon: LatLngPoint[] | LatLngPoint[][]): boolean {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.isPointInPolygon(
        normalizeLatLng(point),
        normalizeLatLngList(polygon)
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '判断点是否在多边形内');
    }
  },

  /**
   * 计算多边形面积
   * @param polygon 多边形的顶点坐标数组，支持嵌套数组（多边形空洞）
   * @returns 面积（单位：平方米）
   */
  calculatePolygonArea(polygon: LatLngPoint[] | LatLngPoint[][]): number {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.calculatePolygonArea(normalizeLatLngList(polygon));
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '计算多边形面积');
    }
  },

  /**
   * 计算矩形面积
   * @param southWest 西南角坐标
   * @param northEast 东北角坐标
   * @returns 面积（单位：平方米）
   */
  calculateRectangleArea(southWest: LatLngPoint, northEast: LatLngPoint): number {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.calculateRectangleArea(
        normalizeLatLng(southWest),
        normalizeLatLng(northEast)
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '计算矩形面积');
    }
  },

  /**
   * 获取路径上距离目标点最近的点
   * @param path 路径点集合
   * @param target 目标点
   * @returns 最近点信息，包含坐标、索引和距离
   */
  getNearestPointOnPath(path: LatLngPoint[], target: LatLngPoint): {
    latitude: number;
    longitude: number;
    index: number;
    distanceMeters: number;
  } | null {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.getNearestPointOnPath(
        normalizeLatLngList(path),
        normalizeLatLng(target)
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '获取最近点');
    }
  },

  /**
   * 计算多边形质心
   * @param polygon 多边形顶点坐标数组
   * @returns 质心坐标
   */
  calculateCentroid(polygon: LatLngPoint[]): LatLng | null {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.calculateCentroid(normalizeLatLngList(polygon));
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '计算质心');
    }
  },

  /**
   * 计算路径边界和中心点
   * @param points 路径点集合
   * @returns 边界信息，包含 north, south, east, west 和 center
   */
  calculatePathBounds(points: LatLngPoint[]): {
    north: number;
    south: number;
    east: number;
    west: number;
    center: LatLngPoint;
  } | null {
    if (!nativeModule) return null;
    try {
      const normalized = normalizeLatLngList(points);
      if (normalized.length === 0) return null;
      return nativeModule.calculatePathBounds(normalized);
    } catch (error) {
      ErrorLogger.warn('calculatePathBounds 失败', { pointsCount: points.length, error });
      return null;
    }
  },

  /**
   * GeoHash 编码
   * @param coordinate 坐标点
   * @param precision 精度 (1-12)
   * @returns GeoHash 字符串
   */
  encodeGeoHash(coordinate: LatLngPoint, precision: number): string {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.encodeGeoHash(normalizeLatLng(coordinate), precision);
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, 'GeoHash 编码');
    }
  },

  /**
   * 轨迹抽稀 (RDP 算法)
   * @param points 原始轨迹点
   * @param tolerance 允许误差(米)
   * @returns 简化后的轨迹点
   */
  simplifyPolyline(points: LatLngPoint[], tolerance: number): LatLng[] {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.simplifyPolyline(normalizeLatLngList(points), tolerance);
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '轨迹抽稀');
    }
  },

  /**
   * 计算路径总长度
   * @param points 路径点
   * @returns 长度(米)
   */
  calculatePathLength(points: LatLngPoint[]): number {
    if (!nativeModule) return 0;
    try {
      return nativeModule.calculatePathLength(normalizeLatLngList(points));
    } catch (error) {
      ErrorLogger.warn('calculatePathLength 失败', { pointsCount: points.length, error });
      return 0;
    }
  },

  /**
   * 解析高德地图 API 返回的 Polyline 字符串
   * 格式: "lng,lat;lng,lat;..."
   * @param polylineStr 高德原始 polyline 字符串，或包含 polyline 属性的对象
   * @returns 解析后的点集
   */
  parsePolyline(polylineStr: string | { polyline: string }): LatLng[] {
    if (!nativeModule || !polylineStr) return [];
    try {
      // 兼容性处理：如果传入的是对象 { polyline: '...' }，自动提取字符串
      let finalStr: string = '';
      if (typeof polylineStr === 'object' && polylineStr !== null && 'polyline' in polylineStr) {
        finalStr = polylineStr.polyline || '';
      } else if (typeof polylineStr === 'string') {
        finalStr = polylineStr;
      }

      if (!finalStr) return [];
      return nativeModule.parsePolyline(finalStr);
    } catch (error) {
      ErrorLogger.warn('解析 Polyline 失败', { polylineStr, error });
      return [];
    }
  },

  /**
   * 获取路径上指定距离的点
   * @param points 路径点
   * @param distance 距离起点的米数
   * @returns 点信息(坐标+角度)
   */
  getPointAtDistance(points: LatLngPoint[], distance: number): {
    latitude: number;
    longitude: number;
    angle: number;
  } | null {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.getPointAtDistance(normalizeLatLngList(points), distance);
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '获取路径上的点');
    }
  },

  /**
   * 经纬度转换为地图瓦片坐标
   * @param coordinate 经纬度点
   * @param zoom 缩放级别
   * @returns 瓦片坐标(x, y, z)
   */
  latLngToTile(coordinate: LatLngPoint, zoom: number): { x: number; y: number; z: number } | null {
    if (!nativeModule) return null;
    try {
      return nativeModule.latLngToTile(normalizeLatLng(coordinate), zoom);
    } catch (error) {
      ErrorLogger.warn('latLngToTile 失败', { coordinate, zoom, error });
      return null;
    }
  },

  /**
   * 地图瓦片坐标转换为经纬度
   * @param tile 瓦片坐标(x, y, z)
   * @returns 经纬度点
   */
  tileToLatLng(tile: { x: number; y: number; z: number }): LatLng | null {
    if (!nativeModule) return null;
    try {
      return nativeModule.tileToLatLng(tile);
    } catch (error) {
      ErrorLogger.warn('tileToLatLng 失败', { tile, error });
      return null;
    }
  },

  /**
   * 经纬度转换为地图像素坐标
   * @param coordinate 经纬度点
   * @param zoom 缩放级别
   * @returns 像素坐标(x, y)
   */
  latLngToPixel(coordinate: LatLngPoint, zoom: number): { x: number; y: number } | null {
    if (!nativeModule) return null;
    try {
      return nativeModule.latLngToPixel(normalizeLatLng(coordinate), zoom);
    } catch (error) {
      ErrorLogger.warn('latLngToPixel 失败', { coordinate, zoom, error });
      return null;
    }
  },

  /**
   * 地图像素坐标转换为经纬度
   * @param pixel 像素坐标(x, y)
   * @param zoom 缩放级别
   * @returns 经纬度点
   */
  pixelToLatLng(pixel: { x: number; y: number }, zoom: number): LatLng | null {
    if (!nativeModule) return null;
    try {
      return nativeModule.pixelToLatLng(pixel, zoom);
    } catch (error) {
      ErrorLogger.warn('pixelToLatLng 失败', { pixel, zoom, error });
      return null;
    }
  },

  /**
   * 批量地理围栏检测
   * @param point 待检查的点
   * @param polygons 多边形数组，格式为 LatLngPoint[][] 或 LatLngPoint[][][]
   * @returns 包含点索引的数组（-1 表示不在任何多边形内）
   */
  findPointInPolygons(point: LatLngPoint, polygons: LatLngPoint[][] | LatLngPoint[][][]): number {
    if (!nativeModule) return -1;
    try {
      const normalizedPoint = normalizeLatLng(point);
      let normalizedPolygons: LatLngPoint[][];
      let ringToPolygonIndex: number[] | null = null;

      // 处理三维数组 (LatLngPoint[][][]) 和二维数组 (LatLngPoint[][])
      if (Array.isArray(polygons[0]) && Array.isArray(polygons[0][0])) {
        // LatLngPoint[][][] -> 扁平化为 LatLngPoint[][] 用于 C++ 遍历
        // 同时记录每个 Ring 对应的原始多边形索引
        normalizedPolygons = [];
        ringToPolygonIndex = [];
        (polygons as LatLngPoint[][][]).forEach((polygonRings, index) => {
          polygonRings.forEach((ring) => {
            normalizedPolygons.push(ring);
            (ringToPolygonIndex as number[]).push(index);
          });
        });
      } else {
        normalizedPolygons = polygons as LatLngPoint[][];
      }

      const processedPolygons = normalizedPolygons.map((p) => normalizeLatLngList(p));
      const resultIndex = nativeModule.findPointInPolygons(normalizedPoint, processedPolygons);

      // 如果未命中，返回 -1
      if (resultIndex === -1) {
        return -1;
      }

      // 如果存在映射关系（带孔多边形），将 Ring 索引映射回 Polygon 索引
      if (ringToPolygonIndex) {
        return ringToPolygonIndex[resultIndex];
      }

      // 简单多边形直接返回索引
      return resultIndex;
    } catch (error) {
      ErrorLogger.warn('findPointInPolygons 失败', { point, error });
      return -1;
    }
  },

  /**
   * 生成网格聚合数据 (常用于展示网格聚合图或大规模点数据处理)
   * @param points 包含经纬度和权重的点数组
   * @param gridSizeMeters 网格大小（米）
   * @returns 包含经纬度和强度的网格点数组
   */
  generateHeatmapGrid(
    points: Array<LatLngPoint & { weight?: number }>,
    gridSizeMeters: number
  ): Array<{ latitude: number; longitude: number; intensity: number }> {
    if (!nativeModule || points.length === 0) return [];
    try {
      return nativeModule.generateHeatmapGrid(points, gridSizeMeters);
    } catch (error) {
      ErrorLogger.warn('generateHeatmapGrid 失败', { pointsCount: points.length, gridSizeMeters, error });
      return [];
    }
  },
};

/**
* 获取最近一次 initSDK 的配置
*/
export function getSDKConfig(): SDKConfig | null {
  return _sdkConfig;
};

export type ExpoGaodeMapModule =
  Omit<NativeExpoGaodeMapModule, keyof typeof helperMethods> & typeof helperMethods;

const ExpoGaodeMapModuleWithHelpers = new Proxy(helperMethods, {
  get(target, prop, receiver) {
    if (Reflect.has(target, prop)) {
      return Reflect.get(target, prop, receiver);
    }
    const nativeModule = getNativeModule(true);
    if (!nativeModule) {
      return undefined;
    }

    const value = Reflect.get(nativeModule as object, prop, nativeModule as object);
    if (
      typeof prop === 'string' &&
      privacySensitiveMethodNames.has(prop) &&
      typeof value === 'function'
    ) {
      return (...args: unknown[]) => {
        assertPrivacyReady('sdk');
        return (value as (...fnArgs: unknown[]) => unknown).apply(nativeModule, args);
      };
    }

    return getBoundNativeValue(nativeModule, prop);
  },
}) as ExpoGaodeMapModule;

/**
* 获取用于 Web API 的 webKey（若未初始化或未提供则返回 undefined）
*/
export function getWebKey(): string | undefined {
  return _sdkConfig?.webKey;
}

export default ExpoGaodeMapModuleWithHelpers;
