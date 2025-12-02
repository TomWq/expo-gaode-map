
import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import type { ClusterProps } from '../../types';

const NativeCluster = requireNativeViewManager('ClusterView');

/**
 * 高德地图点聚合组件
 * 
 * @param props 点聚合组件的属性配置
 * @returns 渲染原生点聚合组件
 */
export default function Cluster(props: ClusterProps) {
  return <NativeCluster {...props} />;
}
