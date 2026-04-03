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

/**
 * 🔑 性能优化：浅比较关键属性
 */
function arePropsEqual(prevProps: PolylineProps, nextProps: PolylineProps): boolean {
  // 比较 points 数组引用（最常变化）
  if (prevProps.points !== nextProps.points) {
    return false;
  }
  
  // 比较样式属性
  if (prevProps.strokeWidth !== nextProps.strokeWidth ||
      prevProps.strokeColor !== nextProps.strokeColor ||
      prevProps.zIndex !== nextProps.zIndex ||
      prevProps.geodesic !== nextProps.geodesic ||
      prevProps.dotted !== nextProps.dotted ||
      prevProps.gradient !== nextProps.gradient ||
      prevProps.simplificationTolerance !== nextProps.simplificationTolerance ||
      prevProps.texture !== nextProps.texture) {
    return false;
  }

  // 比较 colors 数组
  if (prevProps.colors !== nextProps.colors) {
    return false;
  }
  
  // 比较回调
  if (prevProps.onPolylinePress !== nextProps.onPolylinePress) {
    return false;
  }
  
  return true;
}

// 导出优化后的组件
export default React.memo(Polyline, arePropsEqual);
