
/*
 * 高德地图权限管理模块
 */

import ExpoGaodeMapModule from '../ExpoGaodeMapModule';

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
 * 检查当前应用是否具有位置权限
 * @returns {Promise<PermissionStatus>} 返回一个Promise，解析为位置权限状态
 */
export async function checkLocationPermission(): Promise<PermissionStatus> {
  return await ExpoGaodeMapModule.checkLocationPermission();
}

/**
 * 请求位置权限
 * @returns {Promise<PermissionStatus>} 返回一个Promise，解析为位置权限状态
 */
export async function requestLocationPermission(): Promise<PermissionStatus> {
  return await ExpoGaodeMapModule.requestLocationPermission();
}

export default {
  checkLocationPermission,
  requestLocationPermission,
};