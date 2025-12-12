/**
 * 高德地图原生模块
 * 提供 SDK 初始化、定位、权限管理等功能
 */

import { NativeModule, requireNativeModule } from 'expo';
import type { ExpoGaodeMapModuleEvents } from './ExpoGaodeMap.types';
import type {
  LatLng,
  CoordinateType,
  Coordinates,
  ReGeocode,
  LocationMode,
  LocationAccuracy,
  LocationListener,
} from './types';

/**
 * SDK 配置参数
 */
export interface SDKConfig {
  /** Android 平台的高德地图 API Key */
  androidKey?: string;
  /** iOS 平台的高德地图 API Key */
  iosKey?: string;
  /** web api key：若要使用 web-api 相关功能，建议在初始化时提供 */
  webKey?: string;
}

/**
 * 权限状态
 */
export interface PermissionStatus {
  /** 是否已授权 */
  granted: boolean;
  /** iOS 权限状态字符串 */
  status?: 'notDetermined' | 'restricted' | 'denied' | 'authorizedAlways' | 'authorizedWhenInUse' | 'unknown';
  /** Android 精确位置权限 */
  fineLocation?: boolean;
  /** Android 粗略位置权限 */
  coarseLocation?: boolean;
}

/**
 * 高德地图原生模块类声明
 */
declare class ExpoGaodeMapModule extends NativeModule<ExpoGaodeMapModuleEvents> {
  // ==================== 隐私合规管理 ====================
  
  /**
   * 更新隐私合规状态
   * 必须在用户同意隐私协议后调用
   * @param hasAgreed 用户是否已同意隐私协议
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
  
  // ==================== 权限管理 ====================
  
  /**
   * 检查位置权限状态
   * @returns Promise<PermissionStatus> 权限状态
   */
  checkLocationPermission(): Promise<PermissionStatus>;
  
  /**
   * 请求位置权限
   * @returns Promise<PermissionStatus> 请求后的权限状态
   */
  requestLocationPermission(): Promise<PermissionStatus>;
  
  // ==================== 便捷方法 ====================
  
  /**
   * 添加定位监听器（便捷方法）
   * 封装了 addListener，提供更简洁的 API
   * @param listener 定位回调函数
   * @returns 订阅对象，调用 remove() 取消监听
   */
  addLocationListener(listener: LocationListener): { remove: () => void };
}

// 获取原生模块实例 - 添加容错处理
let nativeModule: ExpoGaodeMapModule | null = null;

try {
  nativeModule = requireNativeModule<ExpoGaodeMapModule>('NaviMap');
} catch (error) {
  // 原生模块加载失败时的静默处理
  // 这是正常的，因为 navigation 包可以独立使用，不一定需要完整的地图功能
  if (__DEV__) {
    console.warn('[expo-gaode-map-navigation] NaviMap 原生模块未加载，地图相关功能将不可用');
  }
}

// 记录最近一次 initSDK 的配置（含 webKey）
let _sdkConfig: SDKConfig | null = null;

// 扩展原生模块，添加便捷方法
const ExpoGaodeMapModuleWithHelpers = {
 ...(nativeModule || {}),

 /**
  * 初始化 SDK，并缓存配置（包含 webKey）
  */
 initSDK(config: SDKConfig): void {
   _sdkConfig = config ?? null;
   nativeModule?.initSDK?.(config);
 },

 /**
  * 添加定位监听器（便捷方法）
  * 自动订阅 onLocationUpdate 事件，提供容错处理
  * @param listener 定位回调函数
  * @returns 订阅对象，调用 remove() 取消监听
  * @throws 如果底层模块不可用，返回一个空操作的订阅对象
  */
 addLocationListener(listener: LocationListener): { remove: () => void } {
   // 使用可选链和空值合并，确保即使模块不可用也不会崩溃
   return nativeModule?.addListener?.('onLocationUpdate', listener) || {
     remove: () => {},
   };
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

export default ExpoGaodeMapModuleWithHelpers as ExpoGaodeMapModule;
