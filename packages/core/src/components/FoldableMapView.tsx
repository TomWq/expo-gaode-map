import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import ExpoGaodeMapView from '../ExpoGaodeMapView';

import { PlatformDetector, DeviceInfo, FoldState } from '../utils/PlatformDetector';
import { MapViewProps } from '../types';

/**
 * 折叠屏适配配置
 */
export interface FoldableConfig {
  /** 折叠时是否自动调整缩放级别 */
  autoAdjustZoom?: boolean;
  /** 展开时的缩放级别增量 */
  unfoldedZoomDelta?: number;
  /** 是否在折叠/展开时保持中心点 */
  keepCenterOnFold?: boolean;
  /** 折叠状态变化回调 */
  onFoldStateChange?: (state: FoldState, deviceInfo: DeviceInfo) => void;
  /** 是否启用调试日志 */
  debug?: boolean;
}

/**
 * 折叠屏地图视图组件
 * 
 * 自动适配折叠屏设备的展开/折叠状态变化
 */
export interface FoldableMapViewProps extends MapViewProps {
  /** 折叠屏适配配置 */
  foldableConfig?: FoldableConfig;
}

export const FoldableMapView: React.FC<FoldableMapViewProps> = ({
  foldableConfig,
  ...mapProps
}) => {
  const mapRef = useRef<any>(null);
  const [currentFoldState, setCurrentFoldState] = useState<FoldState>(FoldState.UNKNOWN);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(PlatformDetector.getDeviceInfo());

  const config: Required<FoldableConfig> = {
    autoAdjustZoom: true,
    unfoldedZoomDelta: 1,
    keepCenterOnFold: true,
    onFoldStateChange: () => {},
    debug: false,
    ...foldableConfig,
  };

  useEffect(() => {
    // 仅在 Android 折叠屏设备上启用
    if (Platform.OS !== 'android' || !deviceInfo.isFoldable) {
      if (config.debug) {
        console.log('[FoldableMapView] 非折叠屏设备，跳过适配');
      }
      return;
    }

    if (config.debug) {
      console.log('[FoldableMapView] 初始化折叠屏适配');
      console.log('设备信息:', deviceInfo);
      console.log('初始折叠状态:', currentFoldState);
    }

    // 监听屏幕尺寸变化
    const removeListener = PlatformDetector.addDimensionChangeListener(
      async (newInfo: DeviceInfo) => {
        const newFoldState = PlatformDetector.getFoldState();
        
        if (config.debug) {
          console.log('[FoldableMapView] 屏幕尺寸变化');
          console.log('新设备信息:', newInfo);
          console.log('新折叠状态:', newFoldState);
        }

        // 折叠状态变化时的处理
        if (newFoldState !== currentFoldState && currentFoldState !== FoldState.UNKNOWN) {
          await handleFoldStateChange(currentFoldState, newFoldState, newInfo);
        }

        setCurrentFoldState(newFoldState);
        setDeviceInfo(newInfo);
        
        // 触发回调
        config.onFoldStateChange(newFoldState, newInfo);
      }
    );

    // 设置初始状态
    const initialState = PlatformDetector.getFoldState();
    setCurrentFoldState(initialState);

    return () => {
      removeListener();
    };
  }, []);

  /**
   * 处理折叠状态变化
   */
  const handleFoldStateChange = async (
    oldState: FoldState,
    newState: FoldState,
    newInfo: DeviceInfo
  ) => {
    if (!mapRef.current) {
      return;
    }

    try {
      // 获取当前地图状态
      const currentCamera = await mapRef.current.getCameraPosition?.();
      
      if (!currentCamera) {
        if (config.debug) {
          console.warn('[FoldableMapView] 无法获取相机位置');
        }
        return;
      }

      const isUnfolding = newState === FoldState.UNFOLDED && oldState === FoldState.FOLDED;
      const isFolding = newState === FoldState.FOLDED && oldState === FoldState.UNFOLDED;

      if (config.debug) {
        console.log('[FoldableMapView] 折叠状态变化:', {
          oldState,
          newState,
          isUnfolding,
          isFolding,
          currentZoom: currentCamera.zoom,
        });
      }

      // 展开时增加缩放级别，折叠时减少
      if (config.autoAdjustZoom && (isUnfolding || isFolding)) {
        const zoomDelta = isUnfolding ? config.unfoldedZoomDelta : -config.unfoldedZoomDelta;
        const newZoom = Math.max(3, Math.min(20, currentCamera.zoom + zoomDelta));

        if (config.debug) {
          console.log('[FoldableMapView] 调整缩放:', {
            oldZoom: currentCamera.zoom,
            newZoom,
            delta: zoomDelta,
          });
        }

        // 保持中心点，只调整缩放
        await mapRef.current.animateToCamera?.({
          center: config.keepCenterOnFold ? currentCamera.target : undefined,
          zoom: newZoom,
          duration: 300,
        });
      }
    } catch (error) {
      if (config.debug) {
        console.error('[FoldableMapView] 处理折叠状态变化失败:');
      }
    }
  };

  

  return (
    <ExpoGaodeMapView
      ref={mapRef}
      {...mapProps}
    />
  );
};

/**
 * 折叠屏适配 Hook
 * 
 * 用于在现有地图组件中添加折叠屏适配功能
 */
export function useFoldableMap(
  mapRef: React.RefObject<any>,
  config?: FoldableConfig
) {
  const [foldState, setFoldState] = useState<FoldState>(FoldState.UNKNOWN);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(PlatformDetector.getDeviceInfo());

  const mergedConfig: Required<FoldableConfig> = {
    autoAdjustZoom: true,
    unfoldedZoomDelta: 1,
    keepCenterOnFold: true,
    onFoldStateChange: () => {},
    debug: false,
    ...config,
  };

  useEffect(() => {
    if (Platform.OS !== 'android' || !deviceInfo.isFoldable) {
      return;
    }

    const removeListener = PlatformDetector.addDimensionChangeListener(
      async (newInfo: DeviceInfo) => {
        const newFoldState = PlatformDetector.getFoldState();
        
        if (newFoldState !== foldState && foldState !== FoldState.UNKNOWN) {
          // 处理折叠状态变化
          if (mapRef.current && mergedConfig.autoAdjustZoom) {
            try {
              const currentCamera = await mapRef.current.getCameraPosition?.();
              if (currentCamera) {
                const isUnfolding = newFoldState === FoldState.UNFOLDED && foldState === FoldState.FOLDED;
                const zoomDelta = isUnfolding ? mergedConfig.unfoldedZoomDelta : -mergedConfig.unfoldedZoomDelta;
                const newZoom = Math.max(3, Math.min(20, currentCamera.zoom + zoomDelta));

                await mapRef.current.animateToCamera?.({
                  center: mergedConfig.keepCenterOnFold ? currentCamera.target : undefined,
                  zoom: newZoom,
                  duration: 300,
                });
              }
            } catch (error) {
              if (mergedConfig.debug) {
                console.error('[useFoldableMap] 调整失败:');
              }
            }
          }
        }

        setFoldState(newFoldState);
        setDeviceInfo(newInfo);
        mergedConfig.onFoldStateChange(newFoldState, newInfo);
      }
    );

    const initialState = PlatformDetector.getFoldState();
    setFoldState(initialState);

    return () => {
      removeListener();
    };
  }, [foldState, deviceInfo.isFoldable]);

  return {
    foldState,
    deviceInfo,
    isFoldable: deviceInfo.isFoldable,
  };
}