/**
 * 高德地图离线地图原生模块
 */

import { NativeModule, requireNativeModule } from 'expo';
import type {
  OfflineMapInfo,
  OfflineMapDownloadConfig,
  OfflineMapStorageInfo,
  OfflineMapEvents,
} from './types/offline.types';

/**
 * 离线地图原生模块接口
 */
declare class ExpoGaodeMapOfflineModule extends NativeModule<OfflineMapEvents> {
  // ==================== 地图列表管理 ====================
  
  /**
   * 获取所有可下载的城市列表
   * @returns Promise<OfflineMapInfo[]> 城市列表
   */
  getAvailableCities(): Promise<OfflineMapInfo[]>;
  
  /**
   * 获取所有省份列表
   * @returns Promise<OfflineMapInfo[]> 省份列表
   */
  getAvailableProvinces(): Promise<OfflineMapInfo[]>;
  
  /**
   * 根据省份代码获取城市列表
   * @param provinceCode 省份代码
   * @returns Promise<OfflineMapInfo[]> 该省份下的城市列表
   */
  getCitiesByProvince(provinceCode: string): Promise<OfflineMapInfo[]>;
  
  /**
   * 获取已下载的地图列表
   * @returns Promise<OfflineMapInfo[]> 已下载的地图列表
   */
  getDownloadedMaps(): Promise<OfflineMapInfo[]>;
  
  // ==================== 下载管理 ====================
  
  /**
   * 开始下载离线地图
   * @param config 下载配置
   */
  startDownload(config: OfflineMapDownloadConfig): Promise<void>;
  
  /**
   * 暂停下载
   * @param cityCode 城市代码
   */
  pauseDownload(cityCode: string): Promise<void>;
  
  /**
   * 恢复下载
   * @param cityCode 城市代码
   */
  resumeDownload(cityCode: string): Promise<void>;
  
  /**
   * 取消下载
   * @param cityCode 城市代码
   */
  cancelDownload(cityCode: string): Promise<void>;
  
  /**
   * 删除离线地图
   * @param cityCode 城市代码
   */
  deleteMap(cityCode: string): Promise<void>;
  
  /**
   * 更新离线地图
   * @param cityCode 城市代码
   */
  updateMap(cityCode: string): Promise<void>;
  
  /**
   * 检查是否有可用更新
   * @param cityCode 城市代码
   * @returns Promise<boolean> 是否有更新
   */
  checkUpdate(cityCode: string): Promise<boolean>;
  
  // ==================== 状态查询 ====================
  
  /**
   * 检查地图是否已下载
   * @param cityCode 城市代码
   * @returns Promise<boolean> 是否已下载
   */
  isMapDownloaded(cityCode: string): Promise<boolean>;
  
  /**
   * 获取地图下载状态
   * @param cityCode 城市代码
   * @returns Promise<OfflineMapInfo> 地图信息
   */
  getMapStatus(cityCode: string): Promise<OfflineMapInfo>;
  
  /**
   * 获取所有下载任务的总进度
   * @returns Promise<number> 总进度 (0-100)
   */
  getTotalProgress(): Promise<number>;
  
  /**
   * 获取当前正在下载的城市列表
   * @returns Promise<string[]> 城市代码列表
   */
  getDownloadingCities(): Promise<string[]>;
  
  // ==================== 存储管理 ====================
  
  /**
   * 获取离线地图占用的存储空间（字节）
   * @returns Promise<number> 存储空间大小
   */
  getStorageSize(): Promise<number>;
  
  /**
   * 获取详细的存储信息
   * @returns Promise<OfflineMapStorageInfo> 存储信息
   */
  getStorageInfo(): Promise<OfflineMapStorageInfo>;
  
  /**
   * 清理所有离线地图
   */
  clearAllMaps(): Promise<void>;
  
  /**
   * 设置离线地图存储路径
   * @param path 存储路径
   */
  setStoragePath(path: string): void;
  
  /**
   * 获取离线地图存储路径
   * @returns Promise<string> 存储路径
   */
  getStoragePath(): Promise<string>;
  
  // ==================== 批量操作 ====================
  
  /**
   * 批量下载地图
   * @param cityCodes 城市代码列表
   * @param allowCellular 是否允许移动网络
   */
  batchDownload(cityCodes: string[], allowCellular?: boolean): Promise<void>;
  
  /**
   * 批量删除地图
   * @param cityCodes 城市代码列表
   */
  batchDelete(cityCodes: string[]): Promise<void>;
  
  /**
   * 批量更新地图
   * @param cityCodes 城市代码列表
   */
  batchUpdate(cityCodes: string[]): Promise<void>;
  
  /**
   * 暂停所有下载任务
   */
  pauseAllDownloads(): Promise<void>;
  
  /**
   * 恢复所有下载任务
   */
  resumeAllDownloads(): Promise<void>;
}

// 获取原生模块实例
export default requireNativeModule<ExpoGaodeMapOfflineModule>('ExpoGaodeMapOffline');