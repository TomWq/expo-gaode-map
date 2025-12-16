import * as React from 'react';
import { requireNativeViewManager } from 'expo-modules-core';
import type { MarkerProps } from '../../types';

const NativeMarkerView = requireNativeViewManager('MarkerView');

/**
 * Marker 组件 - 完全声明式 API
 *
 * 支持：
 * - 自定义图标（icon）
 * - 自定义内容（children）
 * - 大头针样式（pinColor）
 * - 拖拽功能
 * - 所有事件回调
 */
function Marker(props: MarkerProps) {
  // 从 props 中排除 position 属性，避免传递到原生层
  const { position, customViewWidth, customViewHeight, iconWidth, iconHeight, children, ...restProps } = props;
  
  // 🔑 性能优化：使用常量避免重复计算
  // 根据是否有 children 来决定使用哪个尺寸属性
  const hasChildren = !!children;
  const finalIconWidth = hasChildren
    ? (customViewWidth && customViewWidth > 0 ? customViewWidth : 200)
    : (iconWidth && iconWidth > 0 ? iconWidth : 40);
  const finalIconHeight = hasChildren
    ? (customViewHeight && customViewHeight > 0 ? customViewHeight : 40)
    : (iconHeight && iconHeight > 0 ? iconHeight : 40);
  
  return (
    <NativeMarkerView
      latitude={position.latitude}
      longitude={position.longitude}
      iconWidth={finalIconWidth}
      iconHeight={finalIconHeight}
      customViewWidth={finalIconWidth}
      customViewHeight={finalIconHeight}
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
  if (
    prevProps.position.latitude !== nextProps.position.latitude ||
    prevProps.position.longitude !== nextProps.position.longitude
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
  
  // 其他属性相同,不重新渲染
  return true;
}

// 导出优化后的组件
export default React.memo(Marker, arePropsEqual);