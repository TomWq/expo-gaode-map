import * as React from 'react';
import type { PolylineProps } from '../../types';
import { normalizeLatLngList } from '../../utils/GeoUtils';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';
const getNativePolylineView = createLazyNativeViewManager<PolylineProps>('PolylineView');

/**
 * 渲染高德地图上的折线覆盖物组件
 *
 * @param props - 折线属性配置，继承自PolylineProps类型
 * @returns 高德地图原生折线视图组件
 */
function Polyline(props: PolylineProps) {
  const NativePolylineView = React.useMemo(() => getNativePolylineView(), []);
  const { points, ...restProps } = props;
  // 归一化坐标数组
  const normalizedPoints = normalizeLatLngList(points);
  
  return <NativePolylineView points={normalizedPoints} {...restProps} />;
}

export default React.memo(Polyline);
