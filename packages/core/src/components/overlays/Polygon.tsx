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

/**
 * 🔑 性能优化：浅比较关键属性
 */
function arePropsEqual(prevProps: PolygonProps, nextProps: PolygonProps): boolean {
  // 比较 points 数组引用（最常变化）
  if (prevProps.points !== nextProps.points) {
    return false;
  }
  
  // 比较样式属性
  if (prevProps.strokeWidth !== nextProps.strokeWidth ||
      prevProps.strokeColor !== nextProps.strokeColor ||
      prevProps.fillColor !== nextProps.fillColor ||
      prevProps.zIndex !== nextProps.zIndex ||
      prevProps.simplificationTolerance !== nextProps.simplificationTolerance) {
    return false;
  }
  
  // 比较回调
  if (prevProps.onPolygonPress !== nextProps.onPolygonPress ||
      prevProps.onPolygonSimplified !== nextProps.onPolygonSimplified) {
    return false;
  }
  
  return true;
}

// 导出优化后的组件
export default React.memo(Polygon, arePropsEqual);
