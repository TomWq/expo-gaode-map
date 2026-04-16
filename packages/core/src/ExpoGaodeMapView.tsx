import * as React from 'react';

import type {
  MapViewProps,
  MapViewRef,
  CameraPosition,
  CameraUpdate,
  LatLng,
  Point,
  LatLngPoint,
  MarkerProps,
  PolylineProps,
  PolygonProps,
  CircleProps,
} from './types';
import ExpoGaodeMapModule, { getSDKConfig } from './ExpoGaodeMapModule';

import { ErrorHandler } from './utils/ErrorHandler';
import { MapContext } from './components/MapContext';
import { MapUI } from './components/MapUI';
import { createLazyNativeViewManager } from './utils/lazyNativeViewManager';
import { View, StyleSheet, Platform, UIManager, findNodeHandle } from 'react-native';
import { normalizeLatLng, normalizeLatLngList } from './utils/GeoUtils';
import type { FitToCoordinatesOptions } from './types/route-playback.types';
import { fitCameraToCoordinates } from './utils/RouteUtils';
import { warnHarmonyOverlayPropUnsupported } from './components/overlays/harmonyOverlayFallback';

export type { MapViewRef } from './types';

type HarmonyNativeMapViewProps = MapViewProps & {
  harmonyApiKey?: string;
  harmonyMarkers?: HarmonyMarkerOverlayDescriptor[];
  harmonyPolylines?: HarmonyPolylineOverlayDescriptor[];
  harmonyPolygons?: HarmonyPolygonOverlayDescriptor[];
  harmonyCircles?: HarmonyCircleOverlayDescriptor[];
  onCommandResult?: (event: {
    nativeEvent?: {
      type?: string;
      command?: string;
      requestId?: string;
      status?: string;
      latitude?: number;
      longitude?: number;
      snapshotPath?: string;
      message?: string;
    };
  }) => void;
  onHarmonyMarkerPress?: (event: {
    nativeEvent?: {
      type?: string;
      overlayId?: string;
      latitude?: number;
      longitude?: number;
    };
  }) => void;
  onHarmonyMarkerDragStart?: (event: {
    nativeEvent?: {
      type?: string;
      overlayId?: string;
      latitude?: number;
      longitude?: number;
    };
  }) => void;
  onHarmonyMarkerDrag?: (event: {
    nativeEvent?: {
      type?: string;
      overlayId?: string;
      latitude?: number;
      longitude?: number;
    };
  }) => void;
  onHarmonyMarkerDragEnd?: (event: {
    nativeEvent?: {
      type?: string;
      overlayId?: string;
      latitude?: number;
      longitude?: number;
    };
  }) => void;
  onHarmonyPolylinePress?: (event: {
    nativeEvent?: {
      type?: string;
      overlayId?: string;
    };
  }) => void;
  ref?: React.Ref<MapViewRef>;
};
const getNativeView = createLazyNativeViewManager<HarmonyNativeMapViewProps>('ExpoGaodeMapView');
const isHarmonyPlatform = (): boolean => (Platform.OS as string) === 'harmony';

type OverlayKind = 'Marker' | 'Polyline' | 'Polygon' | 'Circle' | 'HeatMap' | 'MultiPoint' | 'Cluster';

type OverlayComponentLike = {
  expoGaodeOverlayType?: OverlayKind;
  type?: {
    expoGaodeOverlayType?: OverlayKind;
  };
  isMapUI?: boolean;
};

type HarmonyMarkerOverlayDescriptor = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  snippet?: string;
  draggable?: boolean;
  flat?: boolean;
  zIndex?: number;
  anchorX?: number;
  anchorY?: number;
  alpha?: number;
  icon?: string;
};

type HarmonyPolylineOverlayDescriptor = {
  id: string;
  points: LatLng[];
  strokeWidth?: number;
  strokeColor?: string | number;
  zIndex?: number;
  colors?: Array<string | number>;
  gradient?: boolean;
  geodesic?: boolean;
  dotted?: boolean;
};

type HarmonyPolygonOverlayDescriptor = {
  id: string;
  rings: LatLng[][];
  strokeWidth?: number;
  strokeColor?: string | number;
  fillColor?: string | number;
  zIndex?: number;
};

type HarmonyCircleOverlayDescriptor = {
  id: string;
  center: LatLng;
  radius: number;
  strokeWidth?: number;
  strokeColor?: string | number;
  fillColor?: string | number;
  zIndex?: number;
};

type HarmonyMarkerCallbackRecord = {
  onMarkerPress?: MarkerProps['onMarkerPress'];
  onMarkerDragStart?: MarkerProps['onMarkerDragStart'];
  onMarkerDrag?: MarkerProps['onMarkerDrag'];
  onMarkerDragEnd?: MarkerProps['onMarkerDragEnd'];
};

type HarmonyOverlayParseResult = {
  overlaysToRender: React.ReactNode[];
  uiControls: React.ReactNode[];
  markers: HarmonyMarkerOverlayDescriptor[];
  polylines: HarmonyPolylineOverlayDescriptor[];
  polygons: HarmonyPolygonOverlayDescriptor[];
  circles: HarmonyCircleOverlayDescriptor[];
  markerCallbacks: Map<string, HarmonyMarkerCallbackRecord>;
  polylinePressCallbacks: Map<string, PolylineProps['onPolylinePress']>;
};

function getOverlayKind(childType: unknown): OverlayKind | undefined {
  const component = childType as OverlayComponentLike | undefined;
  if (!component) {
    return undefined;
  }
  return component.expoGaodeOverlayType ?? component.type?.expoGaodeOverlayType;
}

function getOverlayStableId(kind: OverlayKind, childKey: string | number | null, index: number): string {
  if (childKey != null && childKey !== '') {
    return `${kind}:${String(childKey)}`;
  }
  return `${kind}:idx-${index}`;
}

function isNestedLatLngArray(value: LatLng[] | LatLng[][]): value is LatLng[][] {
  if (value.length === 0) {
    return false;
  }
  return Array.isArray(value[0]);
}


/**
 * 高德地图视图组件，提供地图操作API和覆盖物管理功能
 * 
 * @param props - 组件属性
 * @param ref - 外部ref引用，用于访问地图API方法
 * @returns 返回包含地图视图和上下文提供者的React组件
 * 
 * @remarks
 * 该组件内部维护两个ref：
 * - nativeRef: 指向原生地图视图的引用
 * - internalRef: 内部使用的API引用，通过MapContext共享
 * 
 * 提供的主要API功能包括：
 * - 相机控制（移动、缩放、获取当前位置）
 * - 覆盖物管理（添加/删除/更新标记、折线、多边形、圆形等）
 * 
 * 所有API方法都会检查地图是否已初始化，未初始化时抛出错误
 */
const ExpoGaodeMapView = React.forwardRef<MapViewRef, MapViewProps>((props, ref) => {
  const privacyStatus = ExpoGaodeMapModule.getPrivacyStatus();
  if (!privacyStatus.isReady) {
    throw ErrorHandler.privacyNotAgreed('map');
  }

  const nativeRef = React.useRef<MapViewRef>(null);
  const internalRef = React.useRef<MapViewRef | null>(null);
  const latestCameraPositionRef = React.useRef<CameraPosition | null>(props.initialCameraPosition ?? null);
  const pendingGetLatLngResolversRef = React.useRef(new Map<string, {
    resolve: (value: LatLng) => void;
    reject: (reason: unknown) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }>());
  const pendingTakeSnapshotResolversRef = React.useRef(new Map<string, {
    resolve: (value: string) => void;
    reject: (reason: unknown) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }>());
  const harmonyMarkerCallbacksRef = React.useRef(new Map<string, HarmonyMarkerCallbackRecord>());
  const harmonyPolylinePressCallbacksRef = React.useRef(new Map<string, PolylineProps['onPolylinePress']>());
  const nextCommandRequestIdRef = React.useRef(1);
  const NativeView = React.useMemo(() => getNativeView(), []);

  const dispatchHarmonyCommand = React.useCallback((
    command: 'moveCamera' | 'getLatLng' | 'takeSnapshot',
    args: unknown[]
  ): boolean => {
    if (!isHarmonyPlatform()) {
      return false;
    }

    const target = nativeRef.current as unknown as object | null;
    if (!target) {
      return false;
    }

    const reactTag = findNodeHandle(target as Parameters<typeof findNodeHandle>[0]);
    if (reactTag == null) {
      return false;
    }

    const dispatch = (UIManager as unknown as {
      dispatchViewManagerCommand?: (tag: number, commandId: string | number, commandArgs?: unknown[]) => void;
    }).dispatchViewManagerCommand;

    if (!dispatch) {
      return false;
    }

    dispatch(reactTag, command, args);
    return true;
  }, []);

  const handleHarmonyCommandResult = React.useCallback((event: {
    nativeEvent?: {
      command?: string;
      requestId?: string;
      status?: string;
      latitude?: number;
      longitude?: number;
      snapshotPath?: string;
      message?: string;
    };
  }) => {
    const payload = event.nativeEvent;
    if (!payload?.command) {
      return;
    }

    if (payload.command === 'getLatLng') {
      const requestId = payload.requestId;
      if (!requestId) {
        return;
      }

      const pending = pendingGetLatLngResolversRef.current.get(requestId);
      if (!pending) {
        return;
      }

      pendingGetLatLngResolversRef.current.delete(requestId);
      clearTimeout(pending.timeoutId);

      if (payload.status === 'success') {
        const latitude = Number(payload.latitude);
        const longitude = Number(payload.longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          pending.resolve({ latitude, longitude });
          return;
        }
      }

      pending.reject(new Error(payload.message ?? 'getLatLng failed on Harmony native side'));
      return;
    }

    if (payload.command === 'takeSnapshot') {
      const requestId = payload.requestId;
      if (!requestId) {
        return;
      }

      const pending = pendingTakeSnapshotResolversRef.current.get(requestId);
      if (!pending) {
        return;
      }

      pendingTakeSnapshotResolversRef.current.delete(requestId);
      clearTimeout(pending.timeoutId);

      if (payload.status === 'success' && payload.snapshotPath) {
        pending.resolve(payload.snapshotPath);
        return;
      }

      pending.reject(new Error(payload.message ?? 'takeSnapshot failed on Harmony native side'));
    }
  }, []);

  const handleHarmonyMarkerPress = React.useCallback((event: {
    nativeEvent?: {
      overlayId?: string;
      latitude?: number;
      longitude?: number;
    };
  }) => {
    const payload = event.nativeEvent;
    const overlayId = payload?.overlayId;
    if (!overlayId) {
      return;
    }

    const callbackRecord = harmonyMarkerCallbacksRef.current.get(overlayId);
    if (!callbackRecord?.onMarkerPress) {
      return;
    }

    const latitude = Number(payload.latitude ?? 0);
    const longitude = Number(payload.longitude ?? 0);
    callbackRecord.onMarkerPress({
      nativeEvent: { latitude, longitude },
    } as Parameters<NonNullable<MarkerProps['onMarkerPress']>>[0]);
  }, []);

  const handleHarmonyMarkerDragStart = React.useCallback((event: {
    nativeEvent?: {
      overlayId?: string;
      latitude?: number;
      longitude?: number;
    };
  }) => {
    const payload = event.nativeEvent;
    const overlayId = payload?.overlayId;
    if (!overlayId) {
      return;
    }

    const callbackRecord = harmonyMarkerCallbacksRef.current.get(overlayId);
    if (!callbackRecord?.onMarkerDragStart) {
      return;
    }

    callbackRecord.onMarkerDragStart({
      nativeEvent: {
        latitude: Number(payload.latitude ?? 0),
        longitude: Number(payload.longitude ?? 0),
      },
    } as Parameters<NonNullable<MarkerProps['onMarkerDragStart']>>[0]);
  }, []);

  const handleHarmonyMarkerDrag = React.useCallback((event: {
    nativeEvent?: {
      overlayId?: string;
      latitude?: number;
      longitude?: number;
    };
  }) => {
    const payload = event.nativeEvent;
    const overlayId = payload?.overlayId;
    if (!overlayId) {
      return;
    }

    const callbackRecord = harmonyMarkerCallbacksRef.current.get(overlayId);
    if (!callbackRecord?.onMarkerDrag) {
      return;
    }

    callbackRecord.onMarkerDrag({
      nativeEvent: {
        latitude: Number(payload.latitude ?? 0),
        longitude: Number(payload.longitude ?? 0),
      },
    } as Parameters<NonNullable<MarkerProps['onMarkerDrag']>>[0]);
  }, []);

  const handleHarmonyMarkerDragEnd = React.useCallback((event: {
    nativeEvent?: {
      overlayId?: string;
      latitude?: number;
      longitude?: number;
    };
  }) => {
    const payload = event.nativeEvent;
    const overlayId = payload?.overlayId;
    if (!overlayId) {
      return;
    }

    const callbackRecord = harmonyMarkerCallbacksRef.current.get(overlayId);
    if (!callbackRecord?.onMarkerDragEnd) {
      return;
    }

    callbackRecord.onMarkerDragEnd({
      nativeEvent: {
        latitude: Number(payload.latitude ?? 0),
        longitude: Number(payload.longitude ?? 0),
      },
    } as Parameters<NonNullable<MarkerProps['onMarkerDragEnd']>>[0]);
  }, []);

  const handleHarmonyPolylinePress = React.useCallback((event: {
    nativeEvent?: {
      overlayId?: string;
    };
  }) => {
    const overlayId = event.nativeEvent?.overlayId;
    if (!overlayId) {
      return;
    }

    const callback = harmonyPolylinePressCallbacksRef.current.get(overlayId);
    callback?.({ nativeEvent: {} } as Parameters<NonNullable<PolylineProps['onPolylinePress']>>[0]);
  }, []);

  React.useEffect(() => {
    return () => {
      pendingGetLatLngResolversRef.current.forEach((pending) => {
        clearTimeout(pending.timeoutId);
        pending.reject(new Error('MapView unmounted before getLatLng completed'));
      });
      pendingGetLatLngResolversRef.current.clear();

      pendingTakeSnapshotResolversRef.current.forEach((pending) => {
        clearTimeout(pending.timeoutId);
        pending.reject(new Error('MapView unmounted before takeSnapshot completed'));
      });
      pendingTakeSnapshotResolversRef.current.clear();
    };
  }, []);

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
      if (isHarmonyPlatform() && methodName === 'moveCamera') {
        const dispatched = dispatchHarmonyCommand('moveCamera', args as unknown[]);
        if (dispatched) {
          return Promise.resolve() as ReturnType<T>;
        }
      }

      throw new Error(`Method '${methodName}' is not available on native view. Make sure the native module is linked and rebuilt.`);
    }

    return (nativeMethod as (...methodArgs: Parameters<T>) => ReturnType<T>).apply(
      nativeRef.current,
      args
    );
  }, [dispatchHarmonyCommand]);
  
  /**
   * 🔑 性能优化：通用 API 方法包装器
   * 统一处理初始化检查和错误处理，减少重复代码
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

  const getCameraPosition = React.useCallback(async (): Promise<CameraPosition> => {
    if (isHarmonyPlatform()) {
      const cached = latestCameraPositionRef.current;
      if (cached) {
        return cached;
      }
      return {
        target: props.initialCameraPosition?.target ?? { latitude: 39.9, longitude: 116.4 },
        zoom: props.initialCameraPosition?.zoom ?? 16,
        bearing: props.initialCameraPosition?.bearing ?? 0,
        tilt: props.initialCameraPosition?.tilt ?? 0,
      };
    }
    return callNativeMethod<() => Promise<CameraPosition>>('getCameraPosition');
  }, [callNativeMethod, props.initialCameraPosition]);

  const handleCameraMove = React.useCallback((event: { nativeEvent?: { cameraPosition?: CameraPosition } }) => {
    const cameraPosition = event.nativeEvent?.cameraPosition;
    if (cameraPosition) {
      latestCameraPositionRef.current = cameraPosition;
    }
    props.onCameraMove?.(event as Parameters<NonNullable<MapViewProps['onCameraMove']>>[0]);
  }, [props]);

  const handleCameraIdle = React.useCallback((event: { nativeEvent?: { cameraPosition?: CameraPosition } }) => {
    const cameraPosition = event.nativeEvent?.cameraPosition;
    if (cameraPosition) {
      latestCameraPositionRef.current = cameraPosition;
    }
    props.onCameraIdle?.(event as Parameters<NonNullable<MapViewProps['onCameraIdle']>>[0]);
  }, [props]);

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
    getLatLng: (point: Point) => {
      try {
        if (isHarmonyPlatform()) {
          const requestId = `getLatLng_${nextCommandRequestIdRef.current++}`;
          return new Promise<LatLng>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              pendingGetLatLngResolversRef.current.delete(requestId);
              reject(new Error('getLatLng timeout on Harmony'));
            }, 3000);

            pendingGetLatLngResolversRef.current.set(requestId, {
              resolve,
              reject,
              timeoutId,
            });

            const dispatched = dispatchHarmonyCommand('getLatLng', [
              requestId,
              { x: Number(point.x), y: Number(point.y) },
            ]);

            if (!dispatched) {
              pendingGetLatLngResolversRef.current.delete(requestId);
              clearTimeout(timeoutId);
              reject(new Error("Method 'getLatLng' is not available on native view"));
            }
          });
        }

        return callNativeMethod<(screenPoint: Point) => Promise<LatLng>>('getLatLng', point);
      } catch (error) {
        throw ErrorHandler.wrapNativeError(error, 'getLatLng');
      }
    },
    setCenter: (center: LatLngPoint, animated?: boolean) => {
      try {
        if (isHarmonyPlatform()) {
          return callNativeMethod<(cameraPosition: CameraUpdate, animationDuration: number) => Promise<void>>(
            'moveCamera',
            { target: normalizeLatLng(center) },
            animated ? 300 : 0
          );
        }

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
        if (isHarmonyPlatform()) {
          return callNativeMethod<(cameraPosition: CameraUpdate, animationDuration: number) => Promise<void>>(
            'moveCamera',
            { zoom },
            animated ? 300 : 0
          );
        }

        return callNativeMethod<(zoomLevel: number, animatedFlag: boolean) => Promise<void>>(
          'setZoom',
          zoom,
          animated ?? false
        );
      } catch (error) {
        throw ErrorHandler.wrapNativeError(error, 'setZoom');
      }
    },
    getCameraPosition: () => getCameraPosition(),
    takeSnapshot: () => {
      try {
        if (isHarmonyPlatform()) {
          const requestId = `takeSnapshot_${nextCommandRequestIdRef.current++}`;
          return new Promise<string>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              pendingTakeSnapshotResolversRef.current.delete(requestId);
              reject(new Error('takeSnapshot timeout on Harmony'));
            }, 5000);

            pendingTakeSnapshotResolversRef.current.set(requestId, {
              resolve,
              reject,
              timeoutId,
            });

            const dispatched = dispatchHarmonyCommand('takeSnapshot', [requestId]);
            if (!dispatched) {
              pendingTakeSnapshotResolversRef.current.delete(requestId);
              clearTimeout(timeoutId);
              reject(new Error("Method 'takeSnapshot' is not available on native view"));
            }
          });
        }

        return callNativeMethod<() => Promise<string>>('takeSnapshot');
      } catch (error) {
        throw ErrorHandler.wrapNativeError(error, 'takeSnapshot');
      }
    },
    fitToCoordinates: async (points: LatLngPoint[], options?: FitToCoordinatesOptions) => {
      try {
        await fitCameraToCoordinates(
          {
            moveCamera: (position, duration) =>
              callNativeMethod<(cameraPosition: CameraUpdate, animationDuration: number) => Promise<void>>(
                'moveCamera',
                position,
                duration ?? 0
              ),
            getCameraPosition,
          },
          points,
          options
        );
      } catch (error) {
        throw ErrorHandler.wrapNativeError(error, 'fitToCoordinates');
      }
    },
  }), [callNativeMethod, createApiMethod, dispatchHarmonyCommand, getCameraPosition]);

  /**
   * 将传入的apiRef赋值给internalRef.current
   * 用于在组件内部保存对地图API实例的引用
   */
  React.useEffect(() => {
    internalRef.current = apiRef;
  }, [apiRef]);

  /**
   * 获取当前地图实例的API引用
   * @returns 返回地图API的引用对象，可用于调用地图相关方法
   */
  React.useImperativeHandle(ref, () => apiRef, [apiRef]);

  // 分离 children：区分原生覆盖物和普通 UI 组件
  const { children, style, ...otherProps } = props;
  const harmonyOverlayParseResult = React.useMemo<HarmonyOverlayParseResult>(() => {
    const result: HarmonyOverlayParseResult = {
      overlaysToRender: [],
      uiControls: [],
      markers: [],
      polylines: [],
      polygons: [],
      circles: [],
      markerCallbacks: new Map<string, HarmonyMarkerCallbackRecord>(),
      polylinePressCallbacks: new Map<string, PolylineProps['onPolylinePress']>(),
    };

    React.Children.forEach(children, (child, index) => {
      if (!React.isValidElement(child)) {
        result.overlaysToRender.push(child);
        return;
      }

      const childType = child.type as OverlayComponentLike;
      if (child.type === MapUI || childType?.isMapUI) {
        result.uiControls.push(child);
        return;
      }

      if (!isHarmonyPlatform()) {
        result.overlaysToRender.push(child);
        return;
      }

      const overlayKind = getOverlayKind(child.type);
      if (!overlayKind) {
        result.overlaysToRender.push(child);
        return;
      }

      const overlayId = getOverlayStableId(overlayKind, child.key, index);

      if (overlayKind === 'Marker') {
        const markerProps = child.props as MarkerProps;
        const normalizedPosition = normalizeLatLng(markerProps.position);
        const icon = typeof markerProps.icon === 'string' ? markerProps.icon : undefined;

        if (markerProps.children != null) {
          warnHarmonyOverlayPropUnsupported('Marker', ['children']);
        }
        if (markerProps.smoothMovePath != null || markerProps.smoothMoveDuration != null) {
          warnHarmonyOverlayPropUnsupported('Marker', ['smoothMovePath', 'smoothMoveDuration']);
        }
        if (markerProps.iconWidth != null || markerProps.iconHeight != null) {
          warnHarmonyOverlayPropUnsupported('Marker', ['iconWidth', 'iconHeight']);
        }
        if (markerProps.icon != null && typeof markerProps.icon !== 'string') {
          warnHarmonyOverlayPropUnsupported('Marker', ['icon(ImageSource)']);
        }
        if (markerProps.pinColor != null) {
          warnHarmonyOverlayPropUnsupported('Marker', ['pinColor']);
        }

        result.markers.push({
          id: overlayId,
          latitude: normalizedPosition.latitude,
          longitude: normalizedPosition.longitude,
          title: markerProps.title,
          snippet: markerProps.snippet,
          draggable: markerProps.draggable,
          flat: markerProps.flat,
          zIndex: markerProps.zIndex,
          anchorX: markerProps.anchor?.x,
          anchorY: markerProps.anchor?.y,
          alpha: markerProps.opacity,
          icon,
        });

        result.markerCallbacks.set(overlayId, {
          onMarkerPress: markerProps.onMarkerPress,
          onMarkerDragStart: markerProps.onMarkerDragStart,
          onMarkerDrag: markerProps.onMarkerDrag,
          onMarkerDragEnd: markerProps.onMarkerDragEnd,
        });
        return;
      }

      if (overlayKind === 'Polyline') {
        const polylineProps = child.props as PolylineProps;
        const normalizedPoints = normalizeLatLngList(polylineProps.points) as LatLng[];
        if (polylineProps.texture != null) {
          warnHarmonyOverlayPropUnsupported('Polyline', ['texture']);
        }

        result.polylines.push({
          id: overlayId,
          points: normalizedPoints,
          strokeWidth: polylineProps.strokeWidth,
          strokeColor: polylineProps.strokeColor,
          zIndex: polylineProps.zIndex,
          colors: polylineProps.colors as Array<string | number> | undefined,
          gradient: polylineProps.gradient,
          geodesic: polylineProps.geodesic,
          dotted: polylineProps.dotted,
        });

        if (polylineProps.onPolylinePress) {
          result.polylinePressCallbacks.set(overlayId, polylineProps.onPolylinePress);
        }
        return;
      }

      if (overlayKind === 'Polygon') {
        const polygonProps = child.props as PolygonProps;
        const normalizedPoints = normalizeLatLngList(
          polygonProps.points as LatLngPoint[] | LatLngPoint[][]
        ) as LatLng[] | LatLng[][];
        const rings = isNestedLatLngArray(normalizedPoints) ? normalizedPoints : [normalizedPoints];

        if (polygonProps.onPolygonPress) {
          warnHarmonyOverlayPropUnsupported('Polygon', ['onPolygonPress']);
        }
        if (polygonProps.onPolygonSimplified) {
          warnHarmonyOverlayPropUnsupported('Polygon', ['onPolygonSimplified']);
        }
        if (polygonProps.simplificationTolerance != null) {
          warnHarmonyOverlayPropUnsupported('Polygon', ['simplificationTolerance']);
        }

        result.polygons.push({
          id: overlayId,
          rings,
          strokeWidth: polygonProps.strokeWidth,
          strokeColor: polygonProps.strokeColor,
          fillColor: polygonProps.fillColor,
          zIndex: polygonProps.zIndex,
        });
        return;
      }

      if (overlayKind === 'Circle') {
        const circleProps = child.props as CircleProps;
        if (circleProps.onCirclePress) {
          warnHarmonyOverlayPropUnsupported('Circle', ['onCirclePress']);
        }

        result.circles.push({
          id: overlayId,
          center: normalizeLatLng(circleProps.center),
          radius: Number(circleProps.radius),
          strokeWidth: circleProps.strokeWidth,
          strokeColor: circleProps.strokeColor,
          fillColor: circleProps.fillColor,
          zIndex: circleProps.zIndex,
        });
        return;
      }

      // HeatMap / MultiPoint / Cluster 暂不支持，保留原组件路径用于输出兼容告警
      result.overlaysToRender.push(child);
    });

    return result;
  }, [children]);

  React.useEffect(() => {
    harmonyMarkerCallbacksRef.current = harmonyOverlayParseResult.markerCallbacks;
    harmonyPolylinePressCallbacksRef.current = harmonyOverlayParseResult.polylinePressCallbacks;
  }, [harmonyOverlayParseResult.markerCallbacks, harmonyOverlayParseResult.polylinePressCallbacks]);

  const sdkConfig = getSDKConfig();
  const harmonyApiKey = isHarmonyPlatform()
    ? (sdkConfig?.harmonyKey ?? sdkConfig?.androidKey ?? sdkConfig?.webKey ?? sdkConfig?.iosKey)
    : undefined;
  const harmonyInternalEventProps = isHarmonyPlatform()
    ? {
      onCommandResult: handleHarmonyCommandResult,
      onHarmonyMarkerPress: handleHarmonyMarkerPress,
      onHarmonyMarkerDragStart: handleHarmonyMarkerDragStart,
      onHarmonyMarkerDrag: handleHarmonyMarkerDrag,
      onHarmonyMarkerDragEnd: handleHarmonyMarkerDragEnd,
      onHarmonyPolylinePress: handleHarmonyPolylinePress,
      harmonyMarkers: harmonyOverlayParseResult.markers,
      harmonyPolylines: harmonyOverlayParseResult.polylines,
      harmonyPolygons: harmonyOverlayParseResult.polygons,
      harmonyCircles: harmonyOverlayParseResult.circles,
    }
    : undefined;

  return (
    <MapContext.Provider value={apiRef}>
      <View style={[{ flex: 1, position: 'relative', overflow: 'hidden' ,}, style]}>
        <NativeView
          ref={nativeRef}
          style={StyleSheet.absoluteFill}
          harmonyApiKey={harmonyApiKey}
          {...otherProps}
          {...harmonyInternalEventProps}
          onCameraMove={handleCameraMove}
          onCameraIdle={handleCameraIdle}
        >
          {harmonyOverlayParseResult.overlaysToRender}
        </NativeView>
        {harmonyOverlayParseResult.uiControls}
      </View>
    </MapContext.Provider>
  );
});

ExpoGaodeMapView.displayName = 'ExpoGaodeMapView';

export default ExpoGaodeMapView;
