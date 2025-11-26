import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { NativeSyntheticEvent } from 'react-native';
import { EventManager } from './utils/EventManager';
import type {
  MapViewProps,
  MapViewRef,
  CameraPosition,
  LatLng,
  Point,
  CircleProps,
  MarkerProps,
  PolylineProps,
  PolygonProps,
} from './types';

export type { MapViewRef } from './types';

const NativeView: React.ComponentType<MapViewProps & { ref?: React.Ref<MapViewRef> }> = requireNativeViewManager('ExpoGaodeMapView');

export const MapContext = React.createContext<React.RefObject<MapViewRef | null> | null>(null);

type MarkerEventCallbacks = {
  onPress?: (event: NativeSyntheticEvent<{}>) => void;
  onDragStart?: (event: NativeSyntheticEvent<LatLng>) => void;
  onDrag?: (event: NativeSyntheticEvent<LatLng>) => void;
  onDragEnd?: (event: NativeSyntheticEvent<LatLng>) => void;
};

type OverlayEventCallbacks = {
  onPress?: (event: NativeSyntheticEvent<{}>) => void;
};

export const MarkerEventContext = React.createContext<EventManager<MarkerEventCallbacks> | null>(null);
export const CircleEventContext = React.createContext<EventManager<OverlayEventCallbacks> | null>(null);
export const PolygonEventContext = React.createContext<EventManager<OverlayEventCallbacks> | null>(null);
export const PolylineEventContext = React.createContext<EventManager<OverlayEventCallbacks> | null>(null);

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
  const nativeRef = React.useRef<MapViewRef>(null);
  const internalRef = React.useRef<MapViewRef | null>(null);
  const markerEventManager = React.useMemo(() => new EventManager<MarkerEventCallbacks>(), []);
  const circleEventManager = React.useMemo(() => new EventManager<OverlayEventCallbacks>(), []);
  const polygonEventManager = React.useMemo(() => new EventManager<OverlayEventCallbacks>(), []);
  const polylineEventManager = React.useMemo(() => new EventManager<OverlayEventCallbacks>(), []);
  const handleMarkerPress = (event: any) => {
    const markerId = event.nativeEvent?.markerId;
    if (markerId) markerEventManager.trigger(markerId, 'onPress', event);
    props.onMarkerPress?.(event);
  };
  
  const handleMarkerDragStart = (event: any) => {
    const markerId = event.nativeEvent?.markerId;
    if (markerId) markerEventManager.trigger(markerId, 'onDragStart', event);
    props.onMarkerDragStart?.(event);
  };
  
  const handleMarkerDrag = (event: any) => {
    const markerId = event.nativeEvent?.markerId;
    if (markerId) markerEventManager.trigger(markerId, 'onDrag', event);
    props.onMarkerDrag?.(event);
  };
  
  const handleMarkerDragEnd = (event: any) => {
    const markerId = event.nativeEvent?.markerId;
    if (markerId) {
      markerEventManager.trigger(markerId, 'onDragEnd', event);
    }
    props.onMarkerDragEnd?.(event);
  };
  
  const handleCirclePress = (event: any) => {
    const circleId = event.nativeEvent?.circleId;
    if (circleId) circleEventManager.trigger(circleId, 'onPress', event);
    props.onCirclePress?.(event);
  };
  
  const handlePolygonPress = (event: any) => {
    const polygonId = event.nativeEvent?.polygonId;
    if (polygonId) polygonEventManager.trigger(polygonId, 'onPress', event);
    props.onPolygonPress?.(event);
  };
  
  const handlePolylinePress = (event: any) => {
    const polylineId = event.nativeEvent?.polylineId;
    if (polylineId) polylineEventManager.trigger(polylineId, 'onPress', event);
    props.onPolylinePress?.(event);
  };

  const apiRef: MapViewRef = React.useMemo(() => ({
    /**
     * 移动地图相机到指定位置
     * @param position 相机位置参数对象，包含目标经纬度、缩放级别等信息
     * @param duration 动画持续时间（毫秒），默认300毫秒
     * @throws 如果地图视图未初始化则抛出错误
     * @returns Promise<void> 异步操作完成后的Promise
     */
    moveCamera: async (position: CameraPosition, duration: number = 300) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.moveCamera(position, duration);
    },
    /**
     * 将屏幕坐标点转换为地理坐标（经纬度）
     * @param point 屏幕坐标点 {x: number, y: number}
     * @returns 返回Promise，解析为对应的地理坐标 {latitude: number, longitude: number}
     * @throws 如果地图视图未初始化，抛出错误 'MapView not initialized'
     */
    getLatLng: async (point: Point) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.getLatLng(point);
    },
    /**
     * 设置地图中心点坐标
     * @param center 要设置的中心点坐标(LatLng格式)
     * @param animated 是否使用动画效果移动地图(默认为false)
     * @throws 如果地图视图未初始化则抛出错误
     */
    setCenter: async (center: LatLng, animated: boolean = false) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.setCenter(center, animated);
    },
    /**
     * 设置地图的缩放级别
     * @param zoom 目标缩放级别
     * @param animated 是否使用动画过渡效果，默认为false
     * @throws 如果地图视图未初始化，抛出错误
     */
    setZoom: async (zoom: number, animated: boolean = false) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.setZoom(zoom, animated);
    },
    /**
     * 获取当前地图的相机位置（视角中心点、缩放级别、倾斜角度等）
     * @returns 返回一个Promise，解析为当前相机位置的对象
     * @throws 如果地图视图未初始化，则抛出错误
     */
    getCameraPosition: async () => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.getCameraPosition();
    },
    /**
     * 在地图上添加圆形覆盖物
     * @param id - 圆形覆盖物的唯一标识符
     * @param props - 圆形覆盖物的属性配置
     * @returns Promise<void> 添加操作的异步结果
     * @throws 如果地图视图未初始化，抛出错误'MapView not initialized'
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    addCircle: async (id: string, props: CircleProps) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.addCircle(id, props);
    },
    /**
     * 从地图上移除指定的圆形覆盖物
     * @param id - 要移除的圆形覆盖物的唯一标识符
     * @throws 如果地图视图未初始化，抛出错误
     * @returns Promise<void> 异步操作完成
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    removeCircle: async (id: string) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.removeCircle(id);
    },
    /**
     * 更新地图上的圆形覆盖物
     * @param id 要更新的圆形覆盖物的唯一标识符
     * @param props 要更新的圆形属性（部分属性）
     * @throws 如果地图视图未初始化，抛出错误
     * @returns Promise<void> 表示更新操作完成
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    updateCircle: async (id: string, props: Partial<CircleProps>) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.updateCircle(id, props);
    },
    /**
     * 添加一个标记点到地图上
     * @param id 标记点的唯一标识符
     * @param props 标记点的配置属性
     * @returns Promise<void> 添加操作完成后的Promise
     * @throws 如果地图视图未初始化则抛出错误
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    addMarker: async (id: string, props: MarkerProps) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.addMarker(id, props);
    },
    /**
     * 从地图上移除指定ID的标记点
     * @param id 要移除的标记点ID
     * @throws 如果地图视图未初始化则抛出错误
     * @returns Promise<void> 异步操作完成
     *  @deprecated 该方法已被弃用，请使用声明式添加
     */
    removeMarker: async (id: string) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.removeMarker(id);
    },
    /**
     * 更新地图上指定ID的标记点属性
     * @param id - 要更新的标记点唯一标识符
     * @param props - 需要更新的标记点属性对象（部分属性）
     * @throws 如果地图视图未初始化则抛出错误
     * @returns Promise对象，表示异步更新操作
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    updateMarker: async (id: string, props: Partial<MarkerProps>) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.updateMarker(id, props);
    },
    /**
     * 添加折线覆盖物到地图
     * @param id - 折线的唯一标识符
     * @param props - 折线的配置属性
     * @returns Promise<void> 添加操作的异步结果
     * @throws 如果地图视图未初始化则抛出错误
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    addPolyline: async (id: string, props: PolylineProps) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.addPolyline(id, props);
    },
    /**
     * 移除地图上的指定折线
     * @param id - 要移除的折线的唯一标识符
     * @throws 如果地图视图未初始化，抛出错误
     * @returns Promise<void>
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    removePolyline: async (id: string) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.removePolyline(id);
    },
    /**
     * 更新地图上的折线覆盖物
     * 
     * @param id 要更新的折线覆盖物的唯一标识符
     * @param props 要更新的折线属性，包含部分PolylineProps属性
     * @returns Promise<void> 异步操作结果
     * @throws 如果地图视图未初始化，抛出错误
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    updatePolyline: async (id: string, props: Partial<PolylineProps>) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.updatePolyline(id, props);
    },
    /**
     * 向地图添加多边形覆盖物
     * @param id - 多边形的唯一标识符
     * @param props - 多边形的配置属性
     * @returns Promise<void> 添加操作的异步结果
     * @throws 如果地图视图未初始化则抛出错误
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    addPolygon: async (id: string, props: PolygonProps) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.addPolygon(id, props);
    },
    /**
     * 移除地图上的多边形覆盖物
     * @param id - 要移除的多边形覆盖物的唯一标识符
     * @throws 如果地图视图未初始化，抛出错误 'MapView not initialized'
     * @returns Promise<void> 异步操作完成
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    removePolygon: async (id: string) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.removePolygon(id);
    },
    /**
     * 更新多边形覆盖物的属性
     * 
     * @param id - 要更新的多边形覆盖物的唯一标识符
     * @param props - 要更新的多边形属性对象，包含需要更新的部分属性
     * @throws {Error} 当地图视图未初始化时抛出错误
     * @returns Promise<void> 异步操作完成后的Promise
     * @deprecated 该方法已被弃用，请使用声明式添加
     */
    updatePolygon: async (id: string, props: Partial<PolygonProps>) => {
      if (!nativeRef.current) throw new Error('MapView not initialized');
      return nativeRef.current.updatePolygon(id, props);
    },
  }), []);

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

  return (
    <MapContext.Provider value={internalRef}>
      <MarkerEventContext.Provider value={markerEventManager}>
        <CircleEventContext.Provider value={circleEventManager}>
          <PolygonEventContext.Provider value={polygonEventManager}>
            <PolylineEventContext.Provider value={polylineEventManager}>
              <NativeView
                ref={nativeRef}
                {...props}
                onMarkerPress={handleMarkerPress}
                onMarkerDragStart={handleMarkerDragStart}
                onMarkerDrag={handleMarkerDrag}
                onMarkerDragEnd={handleMarkerDragEnd}
                onCirclePress={handleCirclePress}
                onPolygonPress={handlePolygonPress}
                onPolylinePress={handlePolylinePress}
              >
                {props.children}
              </NativeView>
            </PolylineEventContext.Provider>
          </PolygonEventContext.Provider>
        </CircleEventContext.Provider>
      </MarkerEventContext.Provider>
    </MapContext.Provider>
  );
});

ExpoGaodeMapView.displayName = 'ExpoGaodeMapView';

export default ExpoGaodeMapView;
