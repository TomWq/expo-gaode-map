import * as React from 'react';

import type {
  MapViewProps,
  MapViewRef,
  CameraPosition,
  CameraUpdate,
  LatLng,
  Point,
  LatLngPoint,
} from './types';
import ExpoGaodeMapModule from './ExpoGaodeMapModule';
import { normalizeLatLng } from './utils/GeoUtils';
import { ErrorHandler } from './utils/ErrorHandler';
import { MapContext } from './components/MapContext';
import { MapUI } from './components/MapUI';
import { createLazyNativeViewManager } from './utils/lazyNativeViewManager';
import { View, StyleSheet } from 'react-native';
import type { FitToCoordinatesOptions } from './types/route-playback.types';

export type { MapViewRef } from './types';

const getNativeView = createLazyNativeViewManager<MapViewProps & { ref?: React.Ref<MapViewRef> }>('ExpoGaodeMapView');
const MIN_ZOOM = 3;
const MAX_ZOOM = 20;

function estimateZoom(latitudeDelta: number, longitudeDelta: number, options?: FitToCoordinatesOptions) {
  const span = Math.max(latitudeDelta, longitudeDelta, 0.0001);
  const rawZoom = Math.log2(360 / span);
  return Math.max(options?.minZoom ?? MIN_ZOOM, Math.min(options?.maxZoom ?? MAX_ZOOM, Number(rawZoom.toFixed(2))));
}

function splitMapChildren(children: React.ReactNode) {
  const overlays: React.ReactNode[] = [];
  const uiControls: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (
      React.isValidElement(child) &&
      (child.type === MapUI || (child.type as { isMapUI?: boolean })?.isMapUI)
    ) {
      uiControls.push(child);
    } else {
      overlays.push(child);
    }
  });

  return { overlays, uiControls };
}

/**
 * 高德地图视图组件，提供地图操作API和覆盖物管理功能
 * 
 * @param props - 组件属性
 * @param ref - 外部ref引用，用于访问地图API方法
 * @returns 返回包含地图视图和上下文提供者的React组件
 * 
 * @remarks
 * 该组件内部维护 nativeRef，用于将 JS ref API 转发到原生地图视图。
 * MapContext 会向子组件共享同一组地图 API 方法。
 * 
 * 提供的主要API功能包括：
 * - 相机控制（移动、缩放、获取当前位置）
 * - 屏幕坐标转换、截图、根据坐标集合拟合相机
 * 
 * 所有API方法都会检查地图是否已初始化，未初始化时抛出错误
 */
const ExpoGaodeMapView = React.forwardRef<MapViewRef, MapViewProps>((props, ref) => {
  const privacyStatus = ExpoGaodeMapModule.getPrivacyStatus();
  if (!privacyStatus.isReady) {
    throw ErrorHandler.privacyNotAgreed('map');
  }

  const nativeRef = React.useRef<MapViewRef>(null);
  const NativeView = React.useMemo(() => getNativeView(), []);

  const callNativeMethod = React.useCallback(<T extends (...args: never[]) => unknown>(
    methodName: keyof MapViewRef,
    ...args: Parameters<T>
  ) => {
    if (!nativeRef.current) {
      throw ErrorHandler.mapViewNotInitialized(methodName as string);
    }

    const nativeMethod = Reflect.get(
      nativeRef.current as object,
      methodName,
      nativeRef.current as object
    );

    if (typeof nativeMethod !== 'function') {
      throw new Error(`Method '${methodName}' is not available on native view. Make sure the native module is linked and rebuilt.`);
    }

    return (nativeMethod as (...methodArgs: Parameters<T>) => ReturnType<T>).apply(
      nativeRef.current,
      args
    );
  }, []);
  
  /**
   * 通用 API 方法包装器，统一处理初始化检查和错误包装。
   */
  const createApiMethod = React.useCallback(<T extends (...args: never[]) => unknown>(
    methodName: keyof MapViewRef
  ) => {
    return ((...args: Parameters<T>) => {
      try {
        return callNativeMethod<T>(methodName, ...args);
      } catch (error) {
        throw ErrorHandler.wrapNativeError(error, methodName as string);
      }
    }) as T;
  }, [callNativeMethod]);

  /**
   * 使用通用包装器创建所有 API 方法
   * 所有方法共享相同的错误处理逻辑
   */
  const apiRef: MapViewRef = React.useMemo(() => ({
    moveCamera: (position: CameraUpdate, duration?: number) => {
      try {
        const normalizedPosition = {
          ...position,
          target: position.target ? normalizeLatLng(position.target) : undefined,
        };
        return callNativeMethod<(cameraPosition: CameraUpdate, animationDuration: number) => Promise<void>>(
          'moveCamera',
          normalizedPosition,
          duration ?? 0
        );
      } catch (error) {
        throw ErrorHandler.wrapNativeError(error, 'moveCamera');
      }
    },
    getLatLng: createApiMethod<(point: Point) => Promise<LatLng>>('getLatLng'),
    setCenter: (center: LatLngPoint, animated?: boolean) => {
      try {
        return callNativeMethod<(normalizedCenter: LatLng, animatedFlag: boolean) => Promise<void>>(
          'setCenter',
          normalizeLatLng(center),
          animated ?? false
        );
      } catch (error) {
        throw ErrorHandler.wrapNativeError(error, 'setCenter');
      }
    },
    setZoom: (zoom: number, animated?: boolean) => {
      try {
        return callNativeMethod<(zoomLevel: number, animatedFlag: boolean) => Promise<void>>(
          'setZoom',
          zoom,
          animated ?? false
        );
      } catch (error) {
        throw ErrorHandler.wrapNativeError(error, 'setZoom');
      }
    },
    getCameraPosition: createApiMethod<() => Promise<CameraPosition>>('getCameraPosition'),
    takeSnapshot: createApiMethod<() => Promise<string>>('takeSnapshot'),
    fitToCoordinates: async (points: LatLngPoint[], options?: FitToCoordinatesOptions) => {
      try {
        const normalized = points.map((point) => normalizeLatLng(point));
        if (normalized.length === 0) {
          return;
        }

        const currentCamera = await callNativeMethod<() => Promise<CameraPosition>>('getCameraPosition');
        if (normalized.length === 1) {
          await callNativeMethod<(cameraPosition: CameraUpdate, animationDuration: number) => Promise<void>>(
            'moveCamera',
            {
              target: normalized[0],
              zoom: options?.singlePointZoom ?? currentCamera.zoom ?? 16,
              bearing: options?.preserveBearing === false ? options?.bearing : currentCamera.bearing ?? options?.bearing,
              tilt: options?.preserveTilt === false ? options?.tilt : currentCamera.tilt ?? options?.tilt,
            },
            options?.duration ?? 0
          );
          return;
        }

        const latitudes = normalized.map((point) => point.latitude);
        const longitudes = normalized.map((point) => point.longitude);
        const paddingFactor = options?.paddingFactor ?? 1.2;
        const north = Math.max(...latitudes);
        const south = Math.min(...latitudes);
        const east = Math.max(...longitudes);
        const west = Math.min(...longitudes);

        await callNativeMethod<(cameraPosition: CameraUpdate, animationDuration: number) => Promise<void>>(
          'moveCamera',
          {
            target: {
              latitude: (north + south) / 2,
              longitude: (east + west) / 2,
            },
            zoom: estimateZoom((north - south) * paddingFactor, (east - west) * paddingFactor, options),
            bearing: options?.preserveBearing === false ? options?.bearing : currentCamera.bearing ?? options?.bearing,
            tilt: options?.preserveTilt === false ? options?.tilt : currentCamera.tilt ?? options?.tilt,
          },
          options?.duration ?? 0
        );
      } catch (error) {
        throw ErrorHandler.wrapNativeError(error, 'fitToCoordinates');
      }
    },
  }), [callNativeMethod, createApiMethod]);

  /**
   * 获取当前地图实例的API引用
   * @returns 返回地图API的引用对象，可用于调用地图相关方法
   */
  React.useImperativeHandle(ref, () => apiRef, [apiRef]);

  // 分离 children：区分原生覆盖物和普通 UI 组件
  const { children, style, ...otherProps } = props;
  const { overlays, uiControls } = React.useMemo(
    () => splitMapChildren(children),
    [children]
  );
  const containerStyle = React.useMemo(
    () => [styles.container, style],
    [style]
  );

  return (
    <MapContext.Provider value={apiRef}>
      <View style={containerStyle}>
        <NativeView
          ref={nativeRef}
          style={StyleSheet.absoluteFill}
          {...otherProps}
        >
          {overlays}
        </NativeView>
        {uiControls}
      </View>
    </MapContext.Provider>
  );
});

ExpoGaodeMapView.displayName = 'ExpoGaodeMapView';

export default ExpoGaodeMapView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
});
