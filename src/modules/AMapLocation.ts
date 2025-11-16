//高德地图定位模块

import { EventSubscription } from 'expo-modules-core';
import ExpoGaodeMapModule from '../ExpoGaodeMapModule';
import type {
  Coordinates,
  ReGeocode,
  LocationOptions,
  LocationListener,
  LatLng,
  CoordinateType,
} from '../types';

/**
 * 配置高德地图定位服务的各项参数
 * @param {LocationOptions} options - 定位配置选项对象
 * @param {boolean} [options.withReGeocode] - 是否返回逆地理编码信息
 * @param {number} [options.accuracy] - 定位精度设置
 * @param {string} [options.mode] - 定位模式
 * @param {boolean} [options.onceLocation] - 是否单次定位
 * @param {number} [options.interval] - 定位间隔(毫秒)
 * @param {number} [options.timeout] - 定位超时时间(毫秒)
 * @param {number} [options.reGeocodeTimeout] - 逆地理编码超时时间(毫秒)
 * @param {number} [options.distanceFilter] - 位置更新最小距离(米)
 * @param {boolean} [options.sensorEnable] - 是否启用传感器
 * @param {boolean} [options.wifiScan] - 是否开启WiFi扫描
 * @param {boolean} [options.gpsFirst] - 是否优先使用GPS
 * @param {boolean} [options.onceLocationLatest] - 是否获取最近3秒内最精确的位置
 * @param {string} [options.geoLanguage] - 地理编码语言
 * @param {boolean} [options.allowsBackgroundLocationUpdates] - 是否允许后台定位
 * @param {boolean} [options.pausesLocationUpdatesAutomatically] - 是否自动暂停定位
 * @param {boolean} [options.locationCacheEnable] - 是否启用定位缓存
 * @param {number} [options.httpTimeout] - 网络请求超时时间(毫秒)
 * @param {string} [options.protocol] - 定位协议
 */
export function configure(options: LocationOptions): void {
  if (options.withReGeocode !== undefined) {
    ExpoGaodeMapModule.setLocatingWithReGeocode?.(options.withReGeocode);
  }
  if (options.accuracy !== undefined) {
    ExpoGaodeMapModule.setDesiredAccuracy?.(options.accuracy);
  }
  if (options.mode !== undefined) {
    ExpoGaodeMapModule.setLocationMode?.(options.mode);
  }
  if (options.onceLocation !== undefined) {
    ExpoGaodeMapModule.setOnceLocation?.(options.onceLocation);
  }
  if (options.interval !== undefined) {
    ExpoGaodeMapModule.setInterval?.(options.interval);
  }
  if (options.timeout !== undefined) {
    ExpoGaodeMapModule.setLocationTimeout?.(options.timeout);
  }
  if (options.reGeocodeTimeout !== undefined) {
    ExpoGaodeMapModule.setReGeocodeTimeout?.(options.reGeocodeTimeout);
  }
  if (options.distanceFilter !== undefined) {
    ExpoGaodeMapModule.setDistanceFilter?.(options.distanceFilter);
  }
  if (options.sensorEnable !== undefined) {
    ExpoGaodeMapModule.setSensorEnable?.(options.sensorEnable);
  }
  if (options.wifiScan !== undefined) {
    ExpoGaodeMapModule.setWifiScan?.(options.wifiScan);
  }
  if (options.gpsFirst !== undefined) {
    ExpoGaodeMapModule.setGpsFirst?.(options.gpsFirst);
  }
  if (options.onceLocationLatest !== undefined) {
    ExpoGaodeMapModule.setOnceLocationLatest?.(options.onceLocationLatest);
  }
  if (options.geoLanguage !== undefined) {
    ExpoGaodeMapModule.setGeoLanguage?.(options.geoLanguage);
  }
  if (options.allowsBackgroundLocationUpdates !== undefined) {
    ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates?.(options.allowsBackgroundLocationUpdates);
  }
  if (options.pausesLocationUpdatesAutomatically !== undefined) {
    ExpoGaodeMapModule.setPausesLocationUpdatesAutomatically?.(options.pausesLocationUpdatesAutomatically);
  }
  if (options.locationCacheEnable !== undefined) {
    ExpoGaodeMapModule.setLocationCacheEnable?.(options.locationCacheEnable);
  }
  if (options.httpTimeout !== undefined) {
    ExpoGaodeMapModule.setHttpTimeOut?.(options.httpTimeout);
  }
  if (options.protocol !== undefined) {
    ExpoGaodeMapModule.setLocationProtocol?.(options.protocol);
  }
}


/**
 * 启动高德地图模块,开始连续定位
 * @throws 如果模块未初始化或启动失败时抛出异常
 */
export function start(): void {
  ExpoGaodeMapModule.start?.();
}


/**
 * 停止高德地图相关功能,停止定位
 * @returns {void} 无返回值
 */
export function stop(): void {
  ExpoGaodeMapModule.stop?.();
}


/**
 * 检查高德地图模块是否已启动,是否正在定位
 * @returns {Promise<boolean>} 返回一个Promise，解析为布尔值表示模块是否已启动
 */
export async function isStarted(): Promise<boolean> {
  return ExpoGaodeMapModule.isStarted?.() || Promise.resolve(false);
}


/**
 * 获取设备当前位置信息,单次定位
 * @returns {Promise<Coordinates | ReGeocode>} 返回包含坐标或逆地理编码信息的Promise
 * @throws 如果定位服务不可用或权限被拒绝时抛出错误
 */
export async function getCurrentLocation(): Promise<Coordinates | ReGeocode> {
  return ExpoGaodeMapModule.getCurrentLocation?.();
}


/**
 * 添加位置更新监听器
 * @param {LocationListener} listener - 位置更新时的回调函数
 * @returns {EventSubscription} 事件订阅对象，包含移除监听器的方法
 * @throws 如果底层模块不可用，返回一个空操作的订阅对象
 */
export function addLocationListener(listener: LocationListener): EventSubscription {
  return ExpoGaodeMapModule.addListener?.('onLocationUpdate', listener) || {
    remove: () => {},
  } as EventSubscription;
}


/**
 * 将坐标点转换为指定坐标系下的坐标
 * @param {LatLng} coordinate - 需要转换的原始坐标点
 * @param {CoordinateType} type - 目标坐标系类型
 * @returns {Promise<LatLng>} 转换后的坐标点Promise
 * @throws 如果底层模块不可用，则返回原始坐标
 */
export async function coordinateConvert(
  coordinate: LatLng,
  type: CoordinateType
): Promise<LatLng> {
  return ExpoGaodeMapModule.coordinateConvert?.(coordinate, type) || Promise.resolve(coordinate);
}


/**
 * 开始更新设备方向（罗盘朝向）
 * 调用原生模块方法启动方向更新功能
 * @throws 如果原生模块未实现此方法会抛出异常
 * @platform ios
 */
export function startUpdatingHeading(): void {
  ExpoGaodeMapModule.startUpdatingHeading?.();
}


/**
 * 停止更新设备方向（罗盘朝向）
 * 调用原生模块方法停止监听设备方向变化
 * @throws 如果原生模块未实现此方法会抛出异常
 * @platform ios
 */
export function stopUpdatingHeading(): void {
  ExpoGaodeMapModule.stopUpdatingHeading?.();
}

/**
 * 设置高德地图的API密钥
 * @param {string} key - 高德地图的API密钥
 * @returns {void}
 */
export function setApiKey(key: string): void {
  ExpoGaodeMapModule.setApiKey?.(key);
}

export default {
  configure,
  start,
  stop,
  isStarted,
  getCurrentLocation,
  addLocationListener,
  coordinateConvert,
  startUpdatingHeading,
  stopUpdatingHeading,
  setApiKey,
};
