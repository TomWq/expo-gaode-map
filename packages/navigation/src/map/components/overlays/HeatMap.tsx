/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-12-03 14:27:06
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-05 16:21:04
 * @FilePath     : /expo-gaode-map/packages/navigation/src/map/components/overlays/HeatMap.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */

import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import type { HeatMapProps } from '../../types';

const NativeHeatMap = requireNativeViewManager('NaviHeatMapView');


/**
 * 高德地图热力图组件
 * 
 * @param props - 热力图配置属性，继承自NativeHeatMap组件的属性
 * @returns 渲染高德地图原生热力图组件
 */
export default function HeatMap(props: HeatMapProps) {
  return <NativeHeatMap {...props} />;
}
