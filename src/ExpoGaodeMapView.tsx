import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import type {
  MapViewProps,
  MapViewRef,
  CameraPosition,
  LatLng,
  Point,

} from './types';

export type { MapViewRef } from './types';

const NativeView: React.ComponentType<MapViewProps & { ref?: React.Ref<MapViewRef> }> = requireNativeViewManager('ExpoGaodeMapView');



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
    <NativeView
        ref={nativeRef}
          {...props}>
          {props.children}
        </NativeView>
  );
});

ExpoGaodeMapView.displayName = 'ExpoGaodeMapView';

export default ExpoGaodeMapView;
