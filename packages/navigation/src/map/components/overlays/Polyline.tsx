
import * as React from 'react';
import type { PolylineProps } from '../../types';

import { requireNativeViewManager } from 'expo-modules-core';
const NativePolylineView = requireNativeViewManager<PolylineProps>('NaviPolylineView');

/**
 * 渲染高德地图上的折线覆盖物组件
 *
 * @param props - 折线属性配置，继承自PolylineProps类型
 * @returns 高德地图原生折线视图组件
 */
function Polyline(props: PolylineProps) {
  return <NativePolylineView {...props} />;
}

// 导出优化后的组件
export default React.memo(Polyline);
