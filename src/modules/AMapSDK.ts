/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-11-13 14:41:55
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-11-14 16:15:20
 * @FilePath     : /expo-gaode-map/src/modules/AMapSDK.ts
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */
/**
 * 高德地图 SDK 模块
 * 基于 Expo Modules 实现
 */

import ExpoGaodeMapModule from '../ExpoGaodeMapModule';
import type { SDKConfig } from '../types';

/**
 * 初始化高德地图 SDK
 * @param config SDK 配置
 */
export function initSDK(config: SDKConfig): void {
  ExpoGaodeMapModule.initSDK?.(config);
}

/**
 * 获取 SDK 版本号
 * @returns SDK 版本
 */
export async function getVersion(): Promise<string> {
  return ExpoGaodeMapModule.getVersion?.() || Promise.resolve('unknown');
}

export default {
  initSDK,
  getVersion,
};
