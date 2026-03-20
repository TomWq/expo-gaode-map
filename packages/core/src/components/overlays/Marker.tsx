import * as React from 'react';
import type { MarkerProps } from '../../types';
import { normalizeLatLng, normalizeLatLngList } from '../../utils/GeoUtils';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';

type NativeMarkerViewProps = Omit<MarkerProps, 'position'> & {
  latitude: number;
  longitude: number;
};

const getNativeMarkerView = createLazyNativeViewManager<NativeMarkerViewProps>('MarkerView');

/**
 * Marker 组件 - 完全声明式 API
 *
 * 支持：
 * - 自定义图标（icon）
 * - 自定义内容（children）- 自动测量尺寸
 * - 大头针样式（pinColor）
 * - 拖拽功能
 * - 所有事件回调
 */
function Marker(props: MarkerProps) {
  const NativeMarkerView = React.useMemo(() => getNativeMarkerView(), []);
  // 从 props 中排除 position 属性，避免传递到原生层
  const { position, customViewWidth, customViewHeight, iconWidth, iconHeight, children, smoothMovePath, ...restProps } = props;
  
  // 归一化坐标处理
  const normalizedPosition = normalizeLatLng(position);
  const normalizedSmoothMovePath = smoothMovePath ? normalizeLatLngList(smoothMovePath) : undefined;

  // 根据是否有 children 来决定使用哪个尺寸属性
  const hasChildren = !!children;
  
  // 智能尺寸计算
  const finalIconWidth = hasChildren
    ? (customViewWidth && customViewWidth > 0 ? customViewWidth : 0)
    : (iconWidth && iconWidth > 0 ? iconWidth : 40);
    
  const finalIconHeight = hasChildren
    ? (customViewHeight && customViewHeight > 0 ? customViewHeight : 0)
    : (iconHeight && iconHeight > 0 ? iconHeight : 40);
  
  return (
    <NativeMarkerView
      latitude={normalizedPosition.latitude}
      longitude={normalizedPosition.longitude}
      iconWidth={finalIconWidth}
      iconHeight={finalIconHeight}
      customViewWidth={finalIconWidth}
      customViewHeight={finalIconHeight}
      smoothMovePath={normalizedSmoothMovePath}
      {...restProps}
    >
      {children}
    </NativeMarkerView>
  );
}

/**
 * 🔑 性能优化：极简比较函数
 * 只检查最常变化的关键属性,减少 JS 线程开销
 */
function arePropsEqual(prevProps: MarkerProps, nextProps: MarkerProps): boolean {
  // 快速路径：比较 position (最常变化)
  const prevPos = normalizeLatLng(prevProps.position);
  const nextPos = normalizeLatLng(nextProps.position);

  if (
    prevPos.latitude !== nextPos.latitude ||
    prevPos.longitude !== nextPos.longitude
  ) {
    return false;
  }
  
  // 比较 cacheKey (如果提供了 cacheKey,其他属性理论上不会变)
  if (prevProps.cacheKey !== nextProps.cacheKey) {
    return false;
  }
  
  // 比较 children (如果有 children)
  if (prevProps.children !== nextProps.children) {
    return false;
  }
  
  // 比较 smoothMovePath (平滑移动路径)
  if (JSON.stringify(prevProps.smoothMovePath) !== JSON.stringify(nextProps.smoothMovePath)) {
    return false;
  }
  
  // 比较 smoothMoveDuration (平滑移动时长)
  if (prevProps.smoothMoveDuration !== nextProps.smoothMoveDuration) {
    return false;
  }
  
  // 其他属性相同,不重新渲染
  return true;
}

// 导出优化后的组件
export default React.memo(Marker, arePropsEqual);
