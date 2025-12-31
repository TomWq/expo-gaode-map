import * as React from 'react';
import type { MapViewRef } from '../types';

/**
 * 地图上下文
 * 用于在子组件中访问地图实例的方法
 */
export const MapContext = React.createContext<MapViewRef | null>(null);

/**
 * Hook: 获取地图实例引用
 * 只能在 ExpoGaodeMapView 的子组件中使用
 */
export function useMap(): MapViewRef {
  const context = React.useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a ExpoGaodeMapView component');
  }
  return context;
}
