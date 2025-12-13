import { MapViewProps } from "./map-view.types";

/**
 * 预加载配置
 */
export interface PreloadConfig {
  /** 预加载的地图数量，默认为 1 */
  poolSize?: number;
  /** 预加载延迟时间（毫秒），默认为 0（立即预加载） */
  delay?: number;
  /** 是否启用预加载，默认为 true */
  enabled?: boolean;
  /** 预加载超时时间（毫秒），默认为 15000（15秒） */
  timeout?: number;
  /** 预加载策略：'native' | 'js' | 'auto' | 'hybrid'，默认为 'auto' */
  strategy?: PreloadStrategy;
  /** 超时后是否自动回退到 JS 预加载，默认为 true */
  fallbackOnTimeout?: boolean;
}

/**
 * 预加载状态
 */
export type PreloadStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * 预加载策略
 * - 'native': 仅使用原生预加载
 * - 'js': 仅使用 JS 层预加载
 * - 'auto': 自动选择（优先原生，不可用时用 JS）
 * - 'hybrid': 同时启动原生和 JS，谁先完成用谁（最快最可靠）
 */
export type PreloadStrategy = 'native' | 'js' | 'auto' | 'hybrid';

/**
 * 预加载实例信息
 */
export interface PreloadInstance {
  id: string;
  status: PreloadStatus;
  timestamp: number;
  error?: Error;
}


/**
 * Hook 返回值
 */
export interface UseMapPreloadReturn {
  /** 当前预加载状态 */
  status: PreloadStatus;
  /** 是否正在预加载 */
  isLoading: boolean;
  /** 是否已准备就绪 */
  isReady: boolean;
  /** 是否发生错误 */
  hasError: boolean;
  /** 预加载统计信息 */
  stats: {
    total: number;
    ready: number;
    loading: number;
    error: number;
  };
  /** 手动开始预加载 */
  startPreload: () => void;
  /** 停止预加载 */
  stopPreload: () => void;
  /** 清理预加载实例 */
  clearInstances: () => void;
  /** 获取一个预加载实例 */
  getPreloadedInstance: () => string | null;
}


/**
 * 预加载组件属性
 */
export interface MapPreloaderProps {
  /** 预加载配置 */
  config?: PreloadConfig;
  /** 预加载的地图视图属性 */
  mapProps?: Partial<MapViewProps>;
  /** 是否启用预加载，默认为 true */
  enabled?: boolean;
  /** 预加载完成回调 */
  onPreloadComplete?: () => void;
  /** 预加载失败回调 */
  onPreloadError?: (error: Error) => void;
}