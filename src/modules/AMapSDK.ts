/**
 * 高德地图 SDK 模块
 * 基于 Expo Modules 实现
 */

import ExpoGaodeMapModule from '../ExpoGaodeMapModule';
import type { SDKConfig } from '../types';


/**
 * 初始化高德地图SDK
 * @param {SDKConfig} config - SDK配置参数
 * @throws 如果初始化失败会抛出异常
 */
export function initSDK(config: SDKConfig): void {
  ExpoGaodeMapModule.initSDK?.(config);
}


/**
 * 获取高德地图SDK的版本号
 * @returns {Promise<string>} 返回一个Promise，解析为高德地图SDK的版本字符串，如果获取失败则返回'unknown'
 */
export async function getVersion(): Promise<string> {
  return ExpoGaodeMapModule.getVersion?.() || Promise.resolve('unknown');
}

export default {
  initSDK,
  getVersion,
};
