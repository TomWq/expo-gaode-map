
/**
 * Cluster 组件测试
 * 测试点聚合组件的基本功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Cluster from '../Cluster';
import { Text } from 'react-native';

const mockNativeCluster = jest.fn(() => null);

jest.mock('../../../utils/lazyNativeViewManager', () => ({
  createLazyNativeViewManager: jest.fn(() => () => mockNativeCluster),
}));

describe('Cluster 点聚合组件', () => {
  beforeEach(() => {
    mockNativeCluster.mockClear();
  });

  const points = [
    { position: { latitude: 39.9, longitude: 116.4 }, properties: { id: 1 } },
    { position: { latitude: 39.91, longitude: 116.41 }, properties: { id: 2 } },
    { position: { latitude: 39.92, longitude: 116.42 }, properties: { id: 3 } },
  ];

  const renderMarker = (item: any) => <Text>Marker {item.properties.id}</Text>;

  it('应该能够渲染', () => {
    const result = render(
      <Cluster
        points={points}
        renderMarker={renderMarker}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受半径属性', () => {
    const result = render(
      <Cluster
        points={points}
        renderMarker={renderMarker}
        radius={100}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持基础图标配置', () => {
    const result = render(
      <Cluster
        points={points}
        icon="cluster_pin"
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持自定义聚合点渲染', () => {
    const renderCluster = (params: any) => (
      <Text>Cluster: {params.count}</Text>
    );

    const result = render(
      <Cluster
        points={points}
        renderMarker={renderMarker}
        renderCluster={renderCluster}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受空数组', () => {
    const result = render(
      <Cluster
        points={[]}
        renderMarker={renderMarker}
      />
    );
    expect(result).toBeTruthy();
  });

  it('相同关键属性重渲染时不应重复渲染', () => {
    const clusterStyle = { backgroundColor: '#f00' };
    const clusterTextStyle = { color: '#fff' };
    const clusterBuckets = [{ minPoints: 10, backgroundColor: '#0f0' }];
    const onClusterPress = jest.fn();

    const { rerender } = render(
      <Cluster
        points={points}
        radius={80}
        icon="cluster_pin"
        minClusterSize={2}
        clusterStyle={clusterStyle}
        clusterTextStyle={clusterTextStyle}
        clusterBuckets={clusterBuckets}
        onClusterPress={onClusterPress}
      />
    );

    rerender(
      <Cluster
        points={points}
        radius={80}
        icon="cluster_pin"
        minClusterSize={2}
        clusterStyle={clusterStyle}
        clusterTextStyle={clusterTextStyle}
        clusterBuckets={clusterBuckets}
        onClusterPress={onClusterPress}
      />
    );

    expect(mockNativeCluster).toHaveBeenCalledTimes(1);
  });

  it('关键属性变化时应重新渲染', () => {
    const { rerender } = render(<Cluster points={points} radius={80} />);

    rerender(<Cluster points={[...points]} radius={80} />);

    expect(mockNativeCluster).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['radius', { radius: 80 }, { radius: 100 }],
    ['icon', { icon: 'cluster_a' }, { icon: 'cluster_b' }],
    ['minClusterSize', { minClusterSize: 2 }, { minClusterSize: 3 }],
    ['clusterStyle', { clusterStyle: { backgroundColor: '#f00' } }, { clusterStyle: { backgroundColor: '#0f0' } }],
    ['clusterTextStyle', { clusterTextStyle: { color: '#fff' } }, { clusterTextStyle: { color: '#000' } }],
    ['clusterBuckets', { clusterBuckets: [{ minPoints: 10, backgroundColor: '#f00' }] }, { clusterBuckets: [{ minPoints: 20, backgroundColor: '#0f0' }] }],
    ['onClusterPress', { onClusterPress: jest.fn() }, { onClusterPress: jest.fn() }],
  ])('当 %s 变化时应重新渲染', (_label, baseProps, nextProps) => {
    const { rerender } = render(
      <Cluster
        points={points}
        {...baseProps}
      />
    );

    rerender(
      <Cluster
        points={points}
        {...baseProps}
        {...nextProps}
      />
    );

    expect(mockNativeCluster).toHaveBeenCalledTimes(2);
  });
});
