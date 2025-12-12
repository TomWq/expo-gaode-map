/**
 * 地图预加载组件
 * 在后台渲染隐藏的地图视图以实现预加载
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import ExpoGaodeMapView from '../ExpoGaodeMapView';
import { MapPreloader, PreloadConfig } from '../utils/MapPreloader';
import type { MapViewProps } from '../types';

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

/**
 * 地图预加载组件
 * 
 * 在应用启动时渲染隐藏的地图视图，提前初始化地图引擎，
 * 当用户真正需要显示地图时可以获得更快的加载速度
 * 
 * @example
 * ```tsx
 * // 在 App 根组件中使用
 * function App() {
 *   return (
 *     <>
 *       <MapPreloader
 *         config={{ poolSize: 1, delay: 2000 }}
 *         onPreloadComplete={() => console.log('地图预加载完成')}
 *       />
 *       <YourAppContent />
 *     </>
 *   );
 * }
 * ```
 */
export const MapPreloaderComponent: React.FC<MapPreloaderProps> = ({
  config,
  mapProps = {},
  enabled = true,
  onPreloadComplete,
  onPreloadError,
}) => {
  const hasInitialized = useRef(false);


  useEffect(() => {
    if (!enabled || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    // 配置预加载
    if (config) {
      MapPreloader.configure(config);
    }

    // 启动预加载，并处理可能的错误
    const startPreloadAsync = async () => {
      try {
        MapPreloader.startPreload();
      } catch (error) {
        console.error("地图预加载失败", error);
        onPreloadError?.(error as Error);
      }
    };

    startPreloadAsync();

    // 监听预加载状态
    // 监听预加载状态
    const unsubscribe = MapPreloader.addListener((status) => {
      if (status === 'ready') {
        onPreloadComplete?.();
      } else if (status === 'error') {
        onPreloadError?.(new Error('地图预加载失败'));
      }
    });


    // 启动预加载
    // MapPreloader.startPreload();

    return () => {
      unsubscribe();
      // 组件卸载时不清理预加载实例，因为它们可能被其他地方使用
    };
  }, [config, enabled, onPreloadComplete, onPreloadError]);

  // 如果未启用，不渲染任何内容
  if (!enabled) {
    return null;
  }

  const poolSize = config?.poolSize || 1;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: poolSize }).map((_, index) => (
        <View key={`preload-${index}`} style={styles.hiddenMap}>
          <ExpoGaodeMapView
            style={styles.mapView}
            initialCameraPosition={{
              target: { latitude: 39.9042, longitude: 116.4074 },
              zoom: 10,
            }}
            {...mapProps}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
  },
  hiddenMap: {
    width: 1,
    height: 1,
  },
  mapView: {
    width: 1,
    height: 1,
  },
});

MapPreloaderComponent.displayName = 'MapPreloader';

export default MapPreloaderComponent;