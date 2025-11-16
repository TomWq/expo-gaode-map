/*
 * ⚠️ 警告: 此模块中的方法已不推荐使用
 * 请使用 MapView 的 ref 方式调用这些方法
 * 
 * 示例:
 * const mapRef = useRef<MapViewRef>(null);
 * mapRef.current?.moveCamera({ target: { latitude: 39.9, longitude: 116.4 }, zoom: 10 });
 * 
 */

import ExpoGaodeMapModule from '../ExpoGaodeMapModule';
import type { CameraPosition, Point, LatLng } from '../types';

/**
 * 移动地图相机到指定位置
 * @deprecated 不推荐使用,请使用 MapView ref 的 moveCamera 方法
 * @param cameraPosition 相机位置参数
 * @param duration 动画时长(毫秒),默认为0(无动画)
 */
export function moveCamera(cameraPosition: CameraPosition, duration = 0): void {
  ExpoGaodeMapModule.moveCamera?.(cameraPosition, duration);
}

/**
 * 将屏幕坐标转换为地理坐标
 * @deprecated 不推荐使用,请使用 MapView ref 的 getLatLng 方法
 * @param point 屏幕坐标点
 * @returns 地理坐标
 */
export async function getLatLng(point: Point): Promise<LatLng> {
  return ExpoGaodeMapModule.getLatLng?.(point) || Promise.resolve({ latitude: 0, longitude: 0 });
}

/**
 * 设置地图中心点
 * @deprecated 不推荐使用,请使用 MapView ref 的 setCenter 方法
 * @param center 中心点坐标
 * @param animated 是否使用动画
 */
export function setCenter(center: LatLng, animated = true): void {
  ExpoGaodeMapModule.setCenter?.(center, animated);
}

/**
 * 设置地图缩放级别
 * @deprecated 不推荐使用,请使用 MapView ref 的 setZoom 方法
 * @param zoom 缩放级别(3-20)
 * @param animated 是否使用动画
 */
export function setZoom(zoom: number, animated = true): void {
  ExpoGaodeMapModule.setZoom?.(zoom, animated);
}

/**
 * 获取当前地图状态
 * @deprecated 不推荐使用,请使用 MapView ref 的 getCameraPosition 方法
 * @returns 当前相机位置
 */
export async function getCameraPosition(): Promise<CameraPosition> {
  return ExpoGaodeMapModule.getCameraPosition?.() || Promise.resolve({
    target: { latitude: 0, longitude: 0 },
    zoom: 10,
  });
}

export default {
  moveCamera,
  getLatLng,
  setCenter,
  setZoom,
  getCameraPosition,
};
