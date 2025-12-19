/**
 * 离线地图便捷 API
 * 提供更友好的 API 接口和事件监听
 */

import ExpoGaodeMapOfflineModule from './OfflineMapModule';
import type {
  OfflineMapInfo,
  OfflineMapDownloadConfig,
  OfflineMapDownloadEvent,
  OfflineMapCompleteEvent,
  OfflineMapErrorEvent,
  OfflineMapPausedEvent,
  OfflineMapCancelledEvent,
  OfflineMapStorageInfo,
} from './types/offline.types';

/**
 * 离线地图管理类
 */
export class OfflineMapManager {
  // ==================== 地图列表管理 ====================
  
  /**
   * 获取所有可下载的城市列表
   */
  static async getAvailableCities(): Promise<OfflineMapInfo[]> {
    return ExpoGaodeMapOfflineModule.getAvailableCities();
  }
  
  /**
   * 获取所有省份列表
   */
  static async getAvailableProvinces(): Promise<OfflineMapInfo[]> {
    return ExpoGaodeMapOfflineModule.getAvailableProvinces();
  }
  
  /**
   * 根据省份代码获取城市列表
   */
  static async getCitiesByProvince(provinceCode: string): Promise<OfflineMapInfo[]> {
    return ExpoGaodeMapOfflineModule.getCitiesByProvince(provinceCode);
  }
  
  /**
   * 获取已下载的地图列表
   */
  static async getDownloadedMaps(): Promise<OfflineMapInfo[]> {
    return ExpoGaodeMapOfflineModule.getDownloadedMaps();
  }
  
  // ==================== 下载管理 ====================
  
  /**
   * 开始下载离线地图
   */
  static async startDownload(config: OfflineMapDownloadConfig): Promise<void> {
    return ExpoGaodeMapOfflineModule.startDownload(config);
  }
  
  /**
   * 暂停下载
   */
  static async pauseDownload(cityCode: string): Promise<void> {
    return ExpoGaodeMapOfflineModule.pauseDownload(cityCode);
  }
  
  /**
   * 恢复下载
   */
  static async resumeDownload(cityCode: string): Promise<void> {
    return ExpoGaodeMapOfflineModule.resumeDownload(cityCode);
  }
  
  /**
   * 取消下载
   */
  static async cancelDownload(cityCode: string): Promise<void> {
    return ExpoGaodeMapOfflineModule.cancelDownload(cityCode);
  }
  
  /**
   * 删除离线地图
   */
  static async deleteMap(cityCode: string): Promise<void> {
    return ExpoGaodeMapOfflineModule.deleteMap(cityCode);
  }
  
  /**
   * 更新离线地图
   */
  static async updateMap(cityCode: string): Promise<void> {
    return ExpoGaodeMapOfflineModule.updateMap(cityCode);
  }
  
  /**
   * 检查是否有可用更新
   */
  static async checkUpdate(cityCode: string): Promise<boolean> {
    return ExpoGaodeMapOfflineModule.checkUpdate(cityCode);
  }
  
  // ==================== 状态查询 ====================
  
  /**
   * 检查地图是否已下载
   */
  static async isMapDownloaded(cityCode: string): Promise<boolean> {
    return ExpoGaodeMapOfflineModule.isMapDownloaded(cityCode);
  }
  
  /**
   * 获取地图下载状态
   */
  static async getMapStatus(cityCode: string): Promise<OfflineMapInfo> {
    return ExpoGaodeMapOfflineModule.getMapStatus(cityCode);
  }
  
  /**
   * 获取所有下载任务的总进度
   */
  static async getTotalProgress(): Promise<number> {
    return ExpoGaodeMapOfflineModule.getTotalProgress();
  }
  
  /**
   * 获取当前正在下载的城市列表
   */
  static async getDownloadingCities(): Promise<string[]> {
    return ExpoGaodeMapOfflineModule.getDownloadingCities();
  }
  
  // ==================== 存储管理 ====================
  
  /**
   * 获取离线地图占用的存储空间（字节）
   */
  static async getStorageSize(): Promise<number> {
    return ExpoGaodeMapOfflineModule.getStorageSize();
  }
  
  /**
   * 获取详细的存储信息
   */
  static async getStorageInfo(): Promise<OfflineMapStorageInfo> {
    return ExpoGaodeMapOfflineModule.getStorageInfo();
  }
  
  /**
   * 清理所有离线地图
   */
  static async clearAllMaps(): Promise<void> {
    return ExpoGaodeMapOfflineModule.clearAllMaps();
  }
  
  /**
   * 设置离线地图存储路径
   */
  static setStoragePath(path: string): void {
    ExpoGaodeMapOfflineModule.setStoragePath(path);
  }
  
  /**
   * 获取离线地图存储路径
   */
  static async getStoragePath(): Promise<string> {
    return ExpoGaodeMapOfflineModule.getStoragePath();
  }
  
  // ==================== 批量操作 ====================
  
  /**
   * 批量下载地图
   */
  static async batchDownload(cityCodes: string[], allowCellular = false): Promise<void> {
    return ExpoGaodeMapOfflineModule.batchDownload(cityCodes, allowCellular);
  }
  
  /**
   * 批量删除地图
   */
  static async batchDelete(cityCodes: string[]): Promise<void> {
    return ExpoGaodeMapOfflineModule.batchDelete(cityCodes);
  }
  
  /**
   * 批量更新地图
   */
  static async batchUpdate(cityCodes: string[]): Promise<void> {
    return ExpoGaodeMapOfflineModule.batchUpdate(cityCodes);
  }
  
  /**
   * 暂停所有下载任务
   */
  static async pauseAllDownloads(): Promise<void> {
    return ExpoGaodeMapOfflineModule.pauseAllDownloads();
  }
  
  /**
   * 恢复所有下载任务
   */
  static async resumeAllDownloads(): Promise<void> {
    return ExpoGaodeMapOfflineModule.resumeAllDownloads();
  }
  
  // ==================== 事件监听 ====================
  
  /**
   * 监听下载进度事件
   */
  static addDownloadProgressListener(
    listener: (event: OfflineMapDownloadEvent) => void
  ): { remove: () => void } {
    return ExpoGaodeMapOfflineModule.addListener('onDownloadProgress', listener);
  }
  
  /**
   * 监听下载完成事件
   */
  static addDownloadCompleteListener(
    listener: (event: OfflineMapCompleteEvent) => void
  ): { remove: () => void } {
    return ExpoGaodeMapOfflineModule.addListener('onDownloadComplete', listener);
  }
  
  /**
   * 监听下载错误事件
   */
  static addDownloadErrorListener(
    listener: (event: OfflineMapErrorEvent) => void
  ): { remove: () => void } {
    return ExpoGaodeMapOfflineModule.addListener('onDownloadError', listener);
  }
  
  /**
   * 监听下载暂停事件
   */
  static addDownloadPausedListener(
    listener: (event: OfflineMapPausedEvent) => void
  ): { remove: () => void } {
    return ExpoGaodeMapOfflineModule.addListener('onDownloadPaused', listener);
  }
  
  /**
   * 监听下载取消事件
   */
  static addDownloadCancelledListener(
    listener: (event: OfflineMapCancelledEvent) => void
  ): { remove: () => void } {
    return ExpoGaodeMapOfflineModule.addListener('onDownloadCancelled', listener);
  }
  
  /**
   * 移除所有监听器
   */
  static removeAllListeners(): void {
    ExpoGaodeMapOfflineModule.removeAllListeners('onDownloadProgress');
    ExpoGaodeMapOfflineModule.removeAllListeners('onDownloadComplete');
    ExpoGaodeMapOfflineModule.removeAllListeners('onDownloadError');
    ExpoGaodeMapOfflineModule.removeAllListeners('onDownloadPaused');
    ExpoGaodeMapOfflineModule.removeAllListeners('onDownloadCancelled');
  }
}

/**
 * 默认导出管理类
 */
export default OfflineMapManager;