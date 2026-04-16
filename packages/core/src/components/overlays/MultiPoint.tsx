import * as React from 'react';
import type { MultiPointProps } from '../../types';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';
import { isHarmonyPlatform, warnHarmonyOverlayUnsupported } from './harmonyOverlayFallback';

const getNativeMultiPoint = createLazyNativeViewManager<MultiPointProps>('MultiPointView');


/**
 * 高德地图多点标记组件
 * 
 * @param props 多点标记的配置属性，继承自MultiPointProps接口
 * @returns 渲染原生高德地图多点标记组件
 */
function MultiPoint(props: MultiPointProps) {
  if (isHarmonyPlatform()) {
    warnHarmonyOverlayUnsupported('MultiPoint');
    return null;
  }

  const NativeMultiPoint = React.useMemo(() => getNativeMultiPoint(), []);
  return <NativeMultiPoint {...props} />;
}

const MemoizedMultiPoint = React.memo(MultiPoint) as React.ComponentType<MultiPointProps> & {
  expoGaodeOverlayType?: string;
};
MemoizedMultiPoint.expoGaodeOverlayType = 'MultiPoint';
export default MemoizedMultiPoint;
