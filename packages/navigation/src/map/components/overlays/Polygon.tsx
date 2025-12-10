
import * as React from 'react';
import type { PolygonProps } from '../../types';

import { requireNativeViewManager } from 'expo-modules-core';
const NativePolygonView = requireNativeViewManager<PolygonProps>('NaviPolygonView');

/**
 * 渲染一个高德地图多边形覆盖物组件
 *
 * @param props - 多边形属性配置，继承自PolygonProps类型
 * @returns 高德地图原生多边形视图组件
 */
function Polygon(props: PolygonProps) {
  return <NativePolygonView {...props} />;
}

// 导出优化后的组件
export default React.memo(Polygon);
