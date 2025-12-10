/*
 * @Author       : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @Date         : 2025-12-03 14:27:06
 * @LastEditors  : 尚博信_王强 wangqiang03@sunboxsoft.com
 * @LastEditTime : 2025-12-05 16:21:29
 * @FilePath     : /expo-gaode-map/packages/navigation/src/map/components/overlays/Cluster.tsx
 * @Description  : 
 * 
 * Copyright (c) 2025 by 尚博信_王强, All Rights Reserved. 
 */

import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import type { ClusterProps } from '../../types';

const NativeCluster = requireNativeViewManager('NaviClusterView');

/**
 * 高德地图点聚合组件
 * 
 * @param props 点聚合组件的属性配置
 * @returns 渲染原生点聚合组件
 */
export default function Cluster(props: ClusterProps) {
  return <NativeCluster {...props} />;
}
