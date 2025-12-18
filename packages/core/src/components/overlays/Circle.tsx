import * as React from 'react';
import { requireNativeViewManager } from 'expo-modules-core';
import type { CircleProps } from '../../types';

const NativeCircleView = requireNativeViewManager<CircleProps>('CircleView');

/**
 * 高德地图圆形覆盖物组件（声明式）
 *
 *
 * @param props 圆形组件的属性配置
 * @returns 渲染原生圆形组件
 */
function Circle(props: CircleProps) {
  return <NativeCircleView {...props} />;
}

/**
 * 🔑 性能优化：浅比较关键属性
 */
function arePropsEqual(prevProps: CircleProps, nextProps: CircleProps): boolean {
  // 比较中心点坐标
  if (prevProps.center.latitude !== nextProps.center.latitude ||
      prevProps.center.longitude !== nextProps.center.longitude) {
    return false;
  }
  
  // 比较半径
  if (prevProps.radius !== nextProps.radius) {
    return false;
  }
  
  // 比较样式属性
  if (prevProps.strokeWidth !== nextProps.strokeWidth ||
      prevProps.strokeColor !== nextProps.strokeColor ||
      prevProps.fillColor !== nextProps.fillColor ||
      prevProps.zIndex !== nextProps.zIndex) {
    return false;
  }
  
  // 比较回调
  if (prevProps.onCirclePress !== nextProps.onCirclePress) {
    return false;
  }
  
  return true;
}

// 导出优化后的组件
export default React.memo(Circle, arePropsEqual);
