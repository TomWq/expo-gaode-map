import * as React from 'react';
import type { MapViewRef } from '../types';
import { ErrorHandler } from '../utils/ErrorHandler';

/**
 * 地图上下文
 * 用于在子组件中访问地图实例的方法
 */
export const MapContext = React.createContext<MapViewRef | null>(null);

/**
 * Hook: 获取地图实例引用
 * 只能在 MapView 的子组件中使用
 */
export function useMap(): MapViewRef {
  const context = React.useContext(MapContext);
  if (!context) {
    throw ErrorHandler.mapViewNotInitialized('useMap');
  }
  return context;
}
