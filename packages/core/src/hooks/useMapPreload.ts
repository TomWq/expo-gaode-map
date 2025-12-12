/**
 * 地图预加载 Hook
 * 提供便捷的 React Hook 来管理地图预加载
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapPreloader, PreloadConfig, PreloadStatus } from '../utils/MapPreloader';

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
 * 地图预加载 Hook
 * 
 * @param config 预加载配置
 * @param autoStart 是否自动开始预加载，默认为 true
 * @returns 预加载状态和控制方法
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { status, isReady, startPreload } = useMapPreload({
 *     poolSize: 2,
 *     delay: 1000,
 *   });
 * 
 *   return (
 *     <View>
 *       <Text>预加载状态: {status}</Text>
 *       {isReady && <MapView />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useMapPreload(
  config?: PreloadConfig,
  autoStart: boolean = true
): UseMapPreloadReturn {
  const [status, setStatus] = useState<PreloadStatus>(() => MapPreloader.getStatus());
  const [stats, setStats] = useState(() => MapPreloader.getStats());
  const configRef = useRef(config);
  const autoStartRef = useRef(autoStart);

  // 更新配置引用
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // 更新自动启动引用
  useEffect(() => {
    autoStartRef.current = autoStart;
  }, [autoStart]);

  // 更新统计信息
  const updateStats = useCallback(() => {
    setStats(MapPreloader.getStats());
  }, []);

  // 监听状态变化
  useEffect(() => {
    const unsubscribe = MapPreloader.addListener((newStatus) => {
      setStatus(newStatus);
      updateStats();
    });

    return () => {
      unsubscribe();
    };
  }, [updateStats]);

  // 配置并自动启动预加载
  useEffect(() => {
    if (configRef.current) {
      MapPreloader.configure(configRef.current);
    }

    if (autoStartRef.current) {
      MapPreloader.startPreload();
    }

    // 组件卸载时清理
    return () => {
      if (autoStartRef.current) {
        MapPreloader.stopPreload();
      }
    };
  }, []); // 只在挂载时执行一次

  // 手动开始预加载
  const startPreload = useCallback(() => {
    if (configRef.current) {
      MapPreloader.configure(configRef.current);
    }
    MapPreloader.startPreload();
  }, []);

  // 停止预加载
  const stopPreload = useCallback(() => {
    MapPreloader.stopPreload();
  }, []);

  // 清理预加载实例
  const clearInstances = useCallback(() => {
    MapPreloader.clearPreloadedInstances();
    updateStats();
  }, [updateStats]);

  // 获取预加载实例
  const getPreloadedInstance = useCallback(() => {
    const instance = MapPreloader.getPreloadedInstance();
    updateStats();
    return instance;
  }, [updateStats]);

  return {
    status,
    isLoading: status === 'loading',
    isReady: status === 'ready',
    hasError: status === 'error',
    stats,
    startPreload,
    stopPreload,
    clearInstances,
    getPreloadedInstance,
  };
}

/**
 * 简化版 Hook - 只返回预加载状态
 * 
 * @param config 预加载配置
 * @returns 预加载状态
 * 
 * @example
 * ```tsx
 * function App() {
 *   const isReady = useMapPreloadStatus({ poolSize: 1 });
 * 
 *   if (!isReady) {
 *     return <LoadingScreen />;
 *   }
 * 
 *   return <MapView />;
 * }
 * ```
 */
export function useMapPreloadStatus(config?: PreloadConfig): boolean {
  const { isReady } = useMapPreload(config, true);
  return isReady;
}