/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-12-03 14:27:06
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-05 16:21:15
 * @FilePath     : /expo-gaode-map/packages/navigation/src/map/components/overlays/MultiPoint.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */

import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import type { MultiPointProps } from '../../types';

const NativeMultiPoint = requireNativeViewManager('NaviMultiPointView');


/**
 * 高德地图多点标记组件
 * 
 * @param props 多点标记的配置属性，继承自MultiPointProps接口
 * @returns 渲染原生高德地图多点标记组件
 */
export default function MultiPoint(props: MultiPointProps) {
  return <NativeMultiPoint {...props} />;
}
