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

// 导出优化后的组件
export default React.memo(Circle);
