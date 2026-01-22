/**
 * 高德地图离线地图类型定义
 */

/**
 * 离线地图下载状态
 */
export type OfflineMapStatus = 
  | 'not_downloaded'  // 未下载
  | 'downloading'     // 下载中
  | 'downloaded'      // 已下载
  | 'paused'          // 已暂停
  | 'failed'          // 下载失败
  | 'updating'        // 更新中
  | 'unzipping';      // 解压中

/**
 * 离线地图信息
 */
export interface OfflineMapInfo {
  /** 城市代码 */
  cityCode: string;
  
  /** 城市名称 */
  cityName: string;
  
  /** 地图大小（字节） */
  size: number;
  
  /** 下载状态 */
  status: OfflineMapStatus;
  
  /** 下载进度 (0-100) */
  progress: number;
  
  /** 版本号 */
  version: string;
  
  /** 是否有更新 */
  hasUpdate?: boolean;
  
  /** 省份名称 */
  provinceName?: string;
  
  /** 省份代码 */
  provinceCode?: string;
  
  /** 已下载大小（字节） */
  downloadedSize?: number;
}

/**
 * 离线地图下载配置
 */
export interface OfflineMapDownloadConfig {
  /** 城市代码 */
  cityCode: string;
  
  /** 是否允许移动网络下载 @default false */
  allowCellular?: boolean;
}

/**
 * 离线地图下载进度事件
 */
export interface OfflineMapDownloadEvent {
  /** 城市代码 */
  cityCode: string;
  
  /** 城市名称 */
  cityName: string;
  
  /** 下载进度 (0-100) */
  progress: number;
  
  /** 已下载大小（字节） */
  downloadedSize: number;
  
  /** 总大小（字节） */
  totalSize: number;
  
  /** 下载状态 */
  status: OfflineMapStatus;
  
  /** 当前状态描述 */
  statusMessage?: string;
}

/**
 * 离线地图完成事件
 */
export interface OfflineMapCompleteEvent {
  /** 城市代码 */
  cityCode: string;
  
  /** 城市名称 */
  cityName: string;
  
  /** 是否成功 */
  success: boolean;
}

/**
 * 离线地图暂停事件
 */
export interface OfflineMapPausedEvent {
  /** 城市代码 */
  cityCode: string;
  
  /** 城市名称 */
  cityName: string;
}

/**
 * 离线地图取消事件
 */
export interface OfflineMapCancelledEvent {
  /** 城市代码 */
  cityCode: string;
  
  /** 城市名称 */
  cityName: string;
}

/**
 * 离线地图错误事件
 */
export interface OfflineMapErrorEvent {
  /** 城市代码 */
  cityCode: string;
  
  /** 城市名称 */
  cityName: string;
  
  /** 错误信息 */
  error: string;
  
  /** 错误代码 */
  errorCode?: number;
}

/**
 * 离线地图存储信息
 */
export interface OfflineMapStorageInfo {
  /** 总存储空间（字节） */
  totalSpace: number;
  
  /** 已使用空间（字节） */
  usedSpace: number;
  
  /** 可用空间（字节） */
  availableSpace: number;
  
  /** 离线地图占用空间（字节） */
  offlineMapSize: number;
}

/**
 * 离线地图事件类型
 */
export type OfflineMapEvents = {
  /** 下载进度更新 */
  onDownloadProgress: (event: OfflineMapDownloadEvent) => void;
  
  /** 下载完成 */
  onDownloadComplete: (event: OfflineMapCompleteEvent) => void;
  
  /** 下载错误 */
  onDownloadError: (event: OfflineMapErrorEvent) => void;
  
  /** 解压进度更新 */
  onUnzipProgress: (event: OfflineMapDownloadEvent) => void;
  
  /** 下载暂停 */
  onDownloadPaused: (event: OfflineMapPausedEvent) => void;
  
  /** 下载取消 */
  onDownloadCancelled: (event: OfflineMapCancelledEvent) => void;
};