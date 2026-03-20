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

/**
 * 🔑 性能优化：浅比较关键属性
 * 只检查最常变化的属性，避免深度比较开销
 */
function arePropsEqual(prevProps: ClusterProps, nextProps: ClusterProps): boolean {
  // 比较 points 数组引用（最常变化）
  if (prevProps.points !== nextProps.points) {
    return false;
  }
  
  // 比较 radius
  if (prevProps.radius !== nextProps.radius) {
    return false;
  }
  
  // 比较 minClusterSize
  if (prevProps.minClusterSize !== nextProps.minClusterSize) {
    return false;
  }
  
  // 比较 clusterBuckets
  if (prevProps.clusterBuckets !== nextProps.clusterBuckets) {
    return false;
  }
  
  // 比较 onClusterPress 回调
  if (prevProps.onClusterPress !== nextProps.onClusterPress) {
    return false;
  }
  
  // 其他属性相同，不重新渲染
  return true;
}

// 导出优化后的组件
export default React.memo(Cluster, arePropsEqual);
