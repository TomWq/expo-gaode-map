import * as React from 'react';
import type { ClusterProps } from '../../types';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';

const getNativeCluster = createLazyNativeViewManager<ClusterProps>('ClusterView');

/**
 * 高德地图点聚合组件
 *
 * @param props 点聚合组件的属性配置
 * @returns 渲染原生点聚合组件
 */
function Cluster(props: ClusterProps) {
  const NativeCluster = React.useMemo(() => getNativeCluster(), []);
  return <NativeCluster {...props} />;
}

export default React.memo(Cluster);
