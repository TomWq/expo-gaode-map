import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import ExpoGaodeMapView from '../ExpoGaodeMapView';

import { useEventCallback } from '../hooks/useEventCallback';
import { PlatformDetector, DeviceInfo, FoldState } from '../utils/PlatformDetector';
import { MapViewProps, MapViewRef } from '../types';

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

const DEFAULT_FOLDABLE_CONFIG: Required<FoldableConfig> = {
  autoAdjustZoom: true,
  unfoldedZoomDelta: 1,
  keepCenterOnFold: true,
  onFoldStateChange: () => {},
  debug: false,
};

function clampZoomLevel(zoom: number): number {
  return Math.max(3, Math.min(20, zoom));
}

function createFoldableConfig(config?: FoldableConfig): Required<FoldableConfig> {
  return {
    ...DEFAULT_FOLDABLE_CONFIG,
    ...config,
  };
}

async function applyFoldStateCameraAdjustment(
  mapRef: React.RefObject<MapViewRef | null>,
  oldState: FoldState,
  newState: FoldState,
  config: Required<FoldableConfig>,
  debugPrefix: 'FoldableMapView' | 'useFoldableMap'
): Promise<void> {
  if (!mapRef.current || !config.autoAdjustZoom) {
    return;
  }

  const currentCamera = await mapRef.current.getCameraPosition();
  if (!currentCamera) {
    if (config.debug) {
      console.warn(`[${debugPrefix}] 无法获取相机位置`);
    }
    return;
  }

  const isUnfolding = newState === FoldState.UNFOLDED && oldState === FoldState.FOLDED;
  const isFolding = newState === FoldState.FOLDED && oldState === FoldState.UNFOLDED;

  if (config.debug) {
    console.log(`[${debugPrefix}] 折叠状态变化:`, {
      oldState,
      newState,
      isUnfolding,
      isFolding,
      currentZoom: currentCamera.zoom,
    });
  }

  if (!isUnfolding && !isFolding) {
    return;
  }

  const currentZoom = currentCamera.zoom ?? 15;
  const zoomDelta = isUnfolding ? config.unfoldedZoomDelta : -config.unfoldedZoomDelta;
  const nextZoom = clampZoomLevel(currentZoom + zoomDelta);

  if (config.debug) {
    console.log(`[${debugPrefix}] 调整缩放:`, {
      oldZoom: currentZoom,
      newZoom: nextZoom,
      delta: zoomDelta,
    });
  }

  await mapRef.current.moveCamera({
    target: config.keepCenterOnFold ? currentCamera.target : undefined,
    zoom: nextZoom,
  }, 300);
}

export const FoldableMapView: React.FC<FoldableMapViewProps> = ({
  foldableConfig,
  ...mapProps
}) => {
  const mapRef = useRef<MapViewRef>(null);
  const [currentFoldState, setCurrentFoldState] = useState<FoldState>(FoldState.UNKNOWN);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(PlatformDetector.getDeviceInfo());
  const config = useMemo(() => createFoldableConfig(foldableConfig), [foldableConfig]);
  const foldStateRef = useRef(currentFoldState);

  const handleFoldStateChange = useEventCallback(
    async (newInfo: DeviceInfo, debugPrefix: 'FoldableMapView' | 'useFoldableMap') => {
      const newFoldState = PlatformDetector.getFoldState();
      const previousFoldState = foldStateRef.current;

      if (config.debug) {
        console.log(`[${debugPrefix}] 屏幕尺寸变化`);
        console.log('新设备信息:', newInfo);
        console.log('新折叠状态:', newFoldState);
      }

      if (newFoldState !== previousFoldState && previousFoldState !== FoldState.UNKNOWN) {
        try {
          await applyFoldStateCameraAdjustment(
            mapRef,
            previousFoldState,
            newFoldState,
            config,
            debugPrefix
          );
        } catch (error) {
          if (config.debug) {
            console.error(`[${debugPrefix}] 处理折叠状态变化失败:`, error);
          }
        }
      }

      foldStateRef.current = newFoldState;
      setCurrentFoldState(newFoldState);
      setDeviceInfo(newInfo);
      config.onFoldStateChange(newFoldState, newInfo);
    }
  );

  useEffect(() => {
    foldStateRef.current = currentFoldState;
  }, [currentFoldState]);

  useEffect(() => {
    const latestDeviceInfo = PlatformDetector.getDeviceInfo();
    setDeviceInfo(latestDeviceInfo);
  }, []);

  useEffect(() => {
    // 仅在 Android 折叠屏设备上启用
    if (Platform.OS !== 'android' || !deviceInfo.isFoldable) {
      if (config.debug) {
        console.log('[FoldableMapView] 非折叠屏设备，跳过适配');
      }
      return;
    }

    const initialState = PlatformDetector.getFoldState();
    foldStateRef.current = initialState;
    setCurrentFoldState(initialState);

    if (config.debug) {
      console.log('[FoldableMapView] 初始化折叠屏适配');
      console.log('设备信息:', deviceInfo);
      console.log('初始折叠状态:', initialState);
    }

    // 监听屏幕尺寸变化
    const removeListener = PlatformDetector.addDimensionChangeListener(
      async (newInfo: DeviceInfo) => {
        await handleFoldStateChange(newInfo, 'FoldableMapView');
      }
    );

    return () => {
      removeListener();
    };
  }, [config.debug, deviceInfo.isFoldable, handleFoldStateChange]);

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
  mapRef: React.RefObject<MapViewRef>,
  config?: FoldableConfig
) {
  const [foldState, setFoldState] = useState<FoldState>(FoldState.UNKNOWN);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(PlatformDetector.getDeviceInfo());
  const mergedConfig = useMemo(() => createFoldableConfig(config), [config]);
  const foldStateRef = useRef(foldState);

  useEffect(() => {
    foldStateRef.current = foldState;
  }, [foldState]);

  const handleFoldStateChange = useEventCallback(async (newInfo: DeviceInfo) => {
    const newFoldState = PlatformDetector.getFoldState();
    const previousFoldState = foldStateRef.current;

    if (newFoldState !== previousFoldState && previousFoldState !== FoldState.UNKNOWN) {
      try {
        await applyFoldStateCameraAdjustment(
          mapRef,
          previousFoldState,
          newFoldState,
          mergedConfig,
          'useFoldableMap'
        );
      } catch (error) {
        if (mergedConfig.debug) {
          console.error('[useFoldableMap] 调整失败:', error);
        }
      }
    }

    foldStateRef.current = newFoldState;
    setFoldState(newFoldState);
    setDeviceInfo(newInfo);
    mergedConfig.onFoldStateChange(newFoldState, newInfo);
  });

  useEffect(() => {
    if (Platform.OS !== 'android' || !deviceInfo.isFoldable) {
      return;
    }

    const initialState = PlatformDetector.getFoldState();
    foldStateRef.current = initialState;
    setFoldState(initialState);

    const removeListener = PlatformDetector.addDimensionChangeListener(
      async (newInfo: DeviceInfo) => {
        await handleFoldStateChange(newInfo);
      }
    );

    return () => {
      removeListener();
    };
  }, [deviceInfo.isFoldable, handleFoldStateChange, mapRef]);

  return {
    foldState,
    deviceInfo,
    isFoldable: deviceInfo.isFoldable,
  };
}
