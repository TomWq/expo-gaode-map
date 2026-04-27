import * as React from 'react';
import type { PolygonProps } from '../../types';
import { normalizeLatLngList } from '../../utils/GeoUtils';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';
const getNativePolygonView = createLazyNativeViewManager<PolygonProps>('PolygonView');

/**
 * 渲染一个高德地图多边形覆盖物组件
 *
 * @param props - 多边形属性配置，继承自PolygonProps类型
 * @returns 高德地图原生多边形视图组件
 */
function Polygon(props: PolygonProps) {
  const NativePolygonView = React.useMemo(() => getNativePolygonView(), []);
  const { points, ...restProps } = props;
  // 归一化坐标数组
  const normalizedPoints = normalizeLatLngList(points);

  return <NativePolygonView points={normalizedPoints} {...restProps} />;
}

export default React.memo(Polygon);
