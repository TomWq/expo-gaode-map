import * as React from 'react';
import type { CircleProps } from '../../types';
import { normalizeLatLng } from '../../utils/GeoUtils';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';

const getNativeCircleView = createLazyNativeViewManager<CircleProps>('CircleView');

/**
 * 高德地图圆形覆盖物组件（声明式）
 *
 *
 * @param props 圆形组件的属性配置
 * @returns 渲染原生圆形组件
 */
function Circle(props: CircleProps) {
  const NativeCircleView = React.useMemo(() => getNativeCircleView(), []);
  const { center, ...restProps } = props;
  const normalizedCenter = normalizeLatLng(center);
  
  return (
    <NativeCircleView 
      center={normalizedCenter}
      {...restProps} 
    />
  );
}

export default React.memo(Circle);
