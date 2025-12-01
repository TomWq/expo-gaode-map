
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
 *
 * 🔑 使用 React.memo 优化性能，避免不必要的重新渲染
 */
function Marker(props: MarkerProps) {
  // 根据是否有 children 来决定使用哪个尺寸属性
  // 有 children：使用 customViewWidth/customViewHeight（默认 200x40）
  // 无 children：使用 iconWidth/iconHeight（用于自定义图标，默认 40x40）
  const containerWidth = props.children
    ? (props.customViewWidth && props.customViewWidth > 0 ? props.customViewWidth : 200)
    : (props.iconWidth && props.iconWidth > 0 ? props.iconWidth : 40);
  const containerHeight = props.children
    ? (props.customViewHeight && props.customViewHeight > 0 ? props.customViewHeight : 40)
    : (props.iconHeight && props.iconHeight > 0 ? props.iconHeight : 40);
  
  // 从 props 中排除 position 属性，避免传递到原生层
  const { position, ...restProps } = props;
  
  return (
    <NativeMarkerView
      latitude={position.latitude}
      longitude={position.longitude}
      iconWidth={containerWidth}
      iconHeight={containerHeight}
      customViewWidth={containerWidth}
      customViewHeight={containerHeight}
      {...restProps}
    >
      {props.children}
    </NativeMarkerView>
  );
}

/**
 * 自定义比较函数
 * 深度比较 position 和其他关键属性
 */
function arePropsEqual(prevProps: MarkerProps, nextProps: MarkerProps): boolean {
  // 比较 position
  if (
    prevProps.position.latitude !== nextProps.position.latitude ||
    prevProps.position.longitude !== nextProps.position.longitude
  ) {
    return false;
  }
  
  // 比较基础属性
  if (
    prevProps.title !== nextProps.title ||
    prevProps.snippet !== nextProps.snippet ||
    prevProps.icon !== nextProps.icon ||
    prevProps.pinColor !== nextProps.pinColor ||
    prevProps.draggable !== nextProps.draggable ||
    prevProps.animatesDrop !== nextProps.animatesDrop ||
    prevProps.iconWidth !== nextProps.iconWidth ||
    prevProps.iconHeight !== nextProps.iconHeight ||
    prevProps.customViewWidth !== nextProps.customViewWidth ||
    prevProps.customViewHeight !== nextProps.customViewHeight
  ) {
    return false;
  }
  
  // 比较 children（简单比较，可根据需要深度比较）
  if (prevProps.children !== nextProps.children) {
    return false;
  }
  
  // 其他属性相同，不需要重新渲染
  return true;
}

// 导出优化后的组件
export default React.memo(Marker, arePropsEqual);

