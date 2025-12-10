
import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import type { HeatMapProps } from '../../types';

const NativeHeatMap = requireNativeViewManager('HeatMapView');


/**
 * 高德地图热力图组件
 * 
 * @param props - 热力图配置属性，继承自NativeHeatMap组件的属性
 * @returns 渲染高德地图原生热力图组件
 */
export default function HeatMap(props: HeatMapProps) {
  return <NativeHeatMap {...props} />;
}
