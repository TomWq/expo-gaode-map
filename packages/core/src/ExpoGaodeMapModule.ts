/**
 * 高德地图原生模块
 * 提供 SDK 初始化、定位、权限管理等功能
 */

import { NativeModule, requireNativeModule } from 'expo';

import type {
  LatLng,
  CoordinateType,
  Coordinates,
  ReGeocode,
  LocationMode,
  LocationAccuracy,
  LocationListener,
} from './types';
import { ErrorHandler, ErrorLogger } from './utils/ErrorHandler';
import { ExpoGaodeMapModuleEvents } from './types/map-view.types';
import { SDKConfig, PermissionStatus } from './types/common.types';


/**
 * 高德地图原生模块类声明
 */
declare class ExpoGaodeMapModule extends NativeModule<ExpoGaodeMapModuleEvents> {
  // ==================== 隐私合规管理 ====================

  /**
   * 更新隐私合规状态
   * 必须在用户同意隐私协议后调用
   * @param hasAgreed 用户是否已同意隐私协议
   * @deprecated 已经弃用，原生里默认为已同意,不再需要调用
   */
  updatePrivacyCompliance(hasAgreed: boolean): void;

  // ==================== SDK 初始化 ====================

  /**
   * 初始化高德地图 SDK
   * @param config SDK 配置参数，包含 Android 和 iOS 的 API Key
   */
  initSDK(config: SDKConfig): void;

  /**
   * 获取高德地图 SDK 版本号
   * @returns SDK 版本字符串
   */
  getVersion(): string;


  // ==================== 定位控制 ====================

  /**
   * 开始连续定位
   * 启动后会持续接收位置更新，通过 onLocationUpdate 事件回调
   */
  start(): void;

  /**
   * 停止定位
   * 停止接收位置更新
   */
  stop(): void;

  /**
   * 检查是否正在定位
   * @returns Promise<boolean> 是否正在定位
   */
  isStarted(): Promise<boolean>;

  /**
   * 获取当前位置（单次定位）
   * @returns Promise<Coordinates | ReGeocode> 位置信息，包含坐标和可选的逆地理编码信息
   */
  getCurrentLocation(): Promise<Coordinates | ReGeocode>;

  /**
   * 坐标转换
   * 将其他坐标系的坐标转换为高德地图使用的 GCJ-02 坐标系
   * @param coordinate 需要转换的坐标
   * @param type 原坐标系类型
   * @returns Promise<LatLng> 转换后的 GCJ-02 坐标
   */
  coordinateConvert(coordinate: LatLng, type: CoordinateType): Promise<LatLng>;

  // ==================== 定位配置 ====================

  /**
   * 设置是否返回逆地理编码信息
   * @param isReGeocode true: 返回地址信息; false: 只返回坐标
   */
  setLocatingWithReGeocode(isReGeocode: boolean): void;

  /**
   * 设置定位模式（Android）
   * @param mode 定位模式：0-低功耗, 1-仅设备, 2-高精度
   */
  setLocationMode(mode: LocationMode): void;

  /**
   * 设置定位间隔（毫秒）
   * @param interval 定位间隔时间，单位毫秒，默认 2000ms
   */
  setInterval(interval: number): void;

  /**
   * 设置是否单次定位（Android）
   * @param isOnceLocation true: 单次定位; false: 连续定位
   */
  setOnceLocation(isOnceLocation: boolean): void;

  /**
   * 设置是否使用设备传感器（Android）
   * @param sensorEnable true: 使用传感器; false: 不使用
   */
  setSensorEnable(sensorEnable: boolean): void;

  /**
   * 设置是否允许 WiFi 扫描（Android）
   * @param wifiScan true: 允许; false: 不允许
   */
  setWifiScan(wifiScan: boolean): void;

  /**
   * 设置是否 GPS 优先（Android）
   * @param gpsFirst true: GPS 优先; false: 网络优先
   */
  setGpsFirst(gpsFirst: boolean): void;

  /**
   * 设置是否等待 WiFi 列表刷新（Android）
   * @param onceLocationLatest true: 等待; false: 不等待
   */
  setOnceLocationLatest(onceLocationLatest: boolean): void;

  /**
   * 设置逆地理编码语言
   * @param language 语言代码，如 "zh-CN", "en"
   */
  setGeoLanguage(language: string): void;

  /**
   * 设置是否使用缓存策略（Android）
   * @param locationCacheEnable true: 使用缓存; false: 不使用
   */
  setLocationCacheEnable(locationCacheEnable: boolean): void;

  /**
   * 设置网络请求超时时间（Android）
   * @param httpTimeOut 超时时间，单位毫秒
   */
  setHttpTimeOut(httpTimeOut: number): void;

  /**
   * 设置期望的定位精度（iOS）
   * @param accuracy 精度级别：0-最佳, 1-10米, 2-100米, 3-1公里, 4-3公里
   */
  setDesiredAccuracy(accuracy: LocationAccuracy): void;

  /**
   * 设置定位超时时间（秒）
   * @param timeout 超时时间，单位秒，默认 10 秒
   */
  setLocationTimeout(timeout: number): void;

  /**
   * 设置逆地理编码超时时间（秒）
   * @param timeout 超时时间，单位秒，默认 5 秒
   */
  setReGeocodeTimeout(timeout: number): void;

  /**
   * 设置距离过滤器（米）（iOS）
   * 只有移动超过指定距离才会更新位置
   * @param distance 距离阈值，单位米
   */
  setDistanceFilter(distance: number): void;

  /**
   * 设置是否自动暂停位置更新（iOS）
   * @param pauses true: 自动暂停; false: 不暂停
   */
  setPausesLocationUpdatesAutomatically(pauses: boolean): void;

  /**
   * 设置是否允许后台定位（iOS）
   * @param allows true: 允许; false: 不允许
   */
  setAllowsBackgroundLocationUpdates(allows: boolean): void;

  /**
   * 设置定位协议
   * @param protocol 协议类型
   */
  setLocationProtocol(protocol: string): void;

  // ==================== 方向更新 (iOS) ====================

  /**
   * 开始更新设备方向（罗盘朝向）
   * 通过 onHeadingUpdate 事件接收方向更新
   * @platform ios
   */
  startUpdatingHeading(): void;

  /**
   * 停止更新设备方向
   * @platform ios
   */
  stopUpdatingHeading(): void;

  // ==================== 权限管理（增强版） ====================

  /**
   * 检查前台位置权限状态（增强版，支持 Android 14+ 适配）
   * @returns Promise<PermissionStatus> 详细的权限状态信息
   */
  checkLocationPermission(): Promise<PermissionStatus>;

  /**
   * 请求前台位置权限（增强版，支持 Android 14+ 适配）
   * @returns Promise<PermissionStatus> 请求后的权限状态
   */
  requestLocationPermission(): Promise<PermissionStatus>;

  /**
   * 请求后台位置权限（Android 10+、iOS）
   * 注意：必须在前台权限已授予后才能请求
   * @returns Promise<PermissionStatus> 请求后的权限状态
   */
  requestBackgroundLocationPermission(): Promise<PermissionStatus>;

  /**
   * 打开应用设置页面
   * 引导用户手动授予权限（当权限被永久拒绝时使用）
   */
  openAppSettings(): void;

  // ==================== 地图预加载 ====================

  /**
   * 开始预加载地图实例
   * 在后台预先初始化地图视图，提升首次显示速度，一般不用主动调用
   * @param config 预加载配置对象
   * @param config.poolSize 预加载的地图实例数量，默认 2
   */
  startMapPreload(config: { poolSize?: number }): void;

  /**
   * 获取预加载状态
   * @returns 预加载状态信息，包含池大小、是否正在预加载等，一般不用主动调用
   */
  getMapPreloadStatus(): {
    poolSize: number;
    isPreloading: boolean;
    maxPoolSize: number;
  };

  /**
   * 清空预加载池
   * 释放所有预加载的地图实例，一般不用主动调用
   */
  clearMapPreloadPool(): void;

  /**
   * 检查是否有可用的预加载实例
   * @returns 是否有可用的预加载地图实例，一般不用主动调用
   */
  hasPreloadedMapView(): boolean;

  /**
   * 检查原生 SDK 是否已配置 API Key
   * @returns 是否已配置
   */
  isNativeSDKConfigured(): boolean;

  // ==================== 便捷方法 ====================

  /**
   * 添加定位监听器（便捷方法）
   * 封装了 addListener，提供更简洁的 API
   * @param listener 定位回调函数
   * @returns 订阅对象，调用 remove() 取消监听
   */
  addLocationListener(listener: LocationListener): { remove: () => void };


  // ==================== 几何计算 ====================

  /**
  * 计算两个坐标点之间的距离
  * @param coordinate1 第一个坐标点
  * @param coordinate2 第二个坐标点
  * @returns 两点之间的距离（单位：米）
  */
  distanceBetweenCoordinates(coordinate1: LatLng,coordinate2: LatLng): Promise<number>;


  /**
   * 判断点是否在圆内
   * @param point 要判断的点
   * @param center 圆心坐标
   * @param radius 圆半径（单位：米）
   * @returns 是否在圆内
   */
  isPointInCircle(point: LatLng,center: LatLng,radius: number): Promise<boolean>;

  /**
   * 判断点是否在多边形内
   * @param point 要判断的点
   * @param polygon 多边形的顶点坐标数组
   * @returns 是否在多边形内
   */
  isPointInPolygon(point: LatLng,polygon: LatLng[]): Promise<boolean>;

  /**
   * 计算多边形面积
   * @param polygon 多边形的顶点坐标数组
   * @returns 面积（单位：平方米）
   */
  calculatePolygonArea(polygon: LatLng[]): Promise<number>;

  /**
   * 计算矩形面积
   * @param southWest 西南角坐标
   * @param northEast 东北角坐标
   * @returns 面积（单位：平方米）
   */
  calculateRectangleArea(southWest: LatLng,northEast: LatLng): Promise<number>;


}

// 获取原生模块实例 - 添加容错处理
let nativeModule: ExpoGaodeMapModule | null = null;

try {
  nativeModule = requireNativeModule<ExpoGaodeMapModule>('ExpoGaodeMap');
} catch (error) {
  const moduleError = ErrorHandler.nativeModuleUnavailable();
  ErrorLogger.log(moduleError);
}

// 记录最近一次 initSDK 的配置（含 webKey）
let _sdkConfig: SDKConfig | null = null;
let _isSDKInitialized = false;

// 扩展原生模块，添加便捷方法
const ExpoGaodeMapModuleWithHelpers = {
  ...(nativeModule || {}),

  /**
   * 初始化 SDK，并缓存配置（包含 webKey）
   * 注意：允许不提供任何 API Key，因为原生端可能已通过 Config Plugin 配置
   */
  initSDK(config: SDKConfig): void {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {

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
    } catch (error: any) {
      _isSDKInitialized = false;
      throw ErrorHandler.wrapNativeError(error, 'SDK 初始化');
    }
  },

  /**
   * 检查 SDK 是否已通过 JS 调用 initSDK() 初始化
   * 注意：即使返回 false，原生端可能已通过 Config Plugin 自动初始化
   */
  isSDKInitialized(): boolean {
    return _isSDKInitialized;
  },

  /**
   * 开始连续定位
   * 注意：如果使用 Config Plugin 配置了 API Key，无需调用 initSDK()
   */
  start(): void {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      nativeModule.start();
    } catch (error: any) {
      throw ErrorHandler.wrapNativeError(error, '开始定位');
    }
  },

  /**
   * 停止定位
   */
  stop(): void {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      nativeModule.stop();
    } catch (error: any) {
      throw ErrorHandler.wrapNativeError(error, '停止定位');
    }
  },

  /**
   * 获取当前位置（单次定位）
   * 注意：如果使用 Config Plugin 配置了 API Key，无需调用 initSDK()
   */
  async getCurrentLocation(): Promise<Coordinates | ReGeocode> {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return await nativeModule.getCurrentLocation();
    } catch (error: any) {
      throw ErrorHandler.locationFailed(error?.message);
    }
  },

  /**
   * 检查位置权限状态
   */
  async checkLocationPermission(): Promise<PermissionStatus> {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return await nativeModule.checkLocationPermission();
    } catch (error: any) {
      throw ErrorHandler.wrapNativeError(error, '检查权限');
    }
  },

  /**
   * 请求前台位置权限（增强版）
   */
  async requestLocationPermission(): Promise<PermissionStatus> {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      const result = await nativeModule.requestLocationPermission();
      if (!result.granted) {
        ErrorLogger.warn('前台位置权限未授予', result);
      }
      return result;
    } catch (error: any) {
      throw ErrorHandler.wrapNativeError(error, '请求前台权限');
    }
  },

  /**
   * 请求后台位置权限
   * 注意：必须在前台权限已授予后才能请求
   */
  async requestBackgroundLocationPermission(): Promise<PermissionStatus> {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      const result = await nativeModule.requestBackgroundLocationPermission();
      if (!result.granted) {
        ErrorLogger.warn('后台位置权限未授予', result);
      }
      return result;
    } catch (error: any) {
      throw ErrorHandler.wrapNativeError(error, '请求后台权限');
    }
  },

  /**
   * 打开应用设置页面
   * 引导用户手动授予权限
   */
  openAppSettings(): void {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      nativeModule.openAppSettings();
    } catch (error: any) {
      throw ErrorHandler.wrapNativeError(error, '打开设置');
    }
  },

  /**
   * 添加定位监听器（便捷方法）
   * 自动订阅 onLocationUpdate 事件，提供容错处理
   * @param listener 定位回调函数
   * @returns 订阅对象，调用 remove() 取消监听
   * 注意：如果使用 Config Plugin 配置了 API Key，无需调用 initSDK()
   */
  addLocationListener(listener: LocationListener): { remove: () => void } {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    if (!nativeModule?.addListener) {
      ErrorLogger.warn('Native module does not support events');
    }
    // 使用可选链和空值合并，确保即使模块不可用也不会崩溃
    return nativeModule?.addListener?.('onLocationUpdate', listener) || {
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
  async distanceBetweenCoordinates(coordinate1: LatLng, coordinate2: LatLng): Promise<number> {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return await nativeModule.distanceBetweenCoordinates(coordinate1, coordinate2);
    } catch (error: any) {
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
  async isPointInCircle(point: LatLng, center: LatLng, radius: number): Promise<boolean> {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return await nativeModule.isPointInCircle(point, center, radius);
    } catch (error: any) {
      throw ErrorHandler.wrapNativeError(error, '判断点是否在圆内');
    }
  },

  /**
   * 判断点是否在多边形内
   * @param point 要判断的点
   * @param polygon 多边形的顶点坐标数组
   * @returns 是否在多边形内
   */
  async isPointInPolygon(point: LatLng, polygon: LatLng[]): Promise<boolean> {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return await nativeModule.isPointInPolygon(point, polygon);
    } catch (error: any) {
      throw ErrorHandler.wrapNativeError(error, '判断点是否在多边形内');
    }
  },

  /**
   * 计算多边形面积
   * @param polygon 多边形的顶点坐标数组
   * @returns 面积（单位：平方米）
   */
  async calculatePolygonArea(polygon: LatLng[]): Promise<number> {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return await nativeModule.calculatePolygonArea(polygon);
    } catch (error: any) {
      throw ErrorHandler.wrapNativeError(error, '计算多边形面积');
    }
  },

  /**
   * 计算矩形面积
   * @param southWest 西南角坐标
   * @param northEast 东北角坐标
   * @returns 面积（单位：平方米）
   */
  async calculateRectangleArea(southWest: LatLng, northEast: LatLng): Promise<number> {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return await nativeModule.calculateRectangleArea(southWest, northEast);
    } catch (error: any) {
      throw ErrorHandler.wrapNativeError(error, '计算矩形面积');
    }
  },
};

/**
* 获取最近一次 initSDK 的配置
*/
export function getSDKConfig(): SDKConfig | null {
  return _sdkConfig;
}

/**
* 获取用于 Web API 的 webKey（若未初始化或未提供则返回 undefined）
*/
export function getWebKey(): string | undefined {
  return _sdkConfig?.webKey;
}

export default ExpoGaodeMapModuleWithHelpers as unknown as ExpoGaodeMapModule;
