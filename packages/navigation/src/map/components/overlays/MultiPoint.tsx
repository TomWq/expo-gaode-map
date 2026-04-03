// This file is generated from internal/core-nav-source. Run `yarn sync:core-nav-shared` after editing the source files.
import * as React from 'react';
import type { MultiPointProps } from '../../types';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';

const getNativeMultiPoint = createLazyNativeViewManager<MultiPointProps>('MultiPointView');


/**
 * 高德地图多点标记组件
 * 
 * @param props 多点标记的配置属性，继承自MultiPointProps接口
 * @returns 渲染原生高德地图多点标记组件
 */
export default function MultiPoint(props: MultiPointProps) {
  const NativeMultiPoint = React.useMemo(() => getNativeMultiPoint(), []);
  return <NativeMultiPoint {...props} />;
}
