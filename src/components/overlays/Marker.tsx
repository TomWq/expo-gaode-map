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
export default function Marker(props: MarkerProps) {
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

