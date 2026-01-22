
import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import type { MultiPointProps } from '../../types';

const NativeMultiPoint = requireNativeViewManager('MultiPointView');


/**
 * 高德地图多点标记组件
 * 
 * @param props 多点标记的配置属性，继承自MultiPointProps接口
 * @returns 渲染原生高德地图多点标记组件
 */
export default function MultiPoint(props: MultiPointProps) {
  return <NativeMultiPoint {...props} />;
}
