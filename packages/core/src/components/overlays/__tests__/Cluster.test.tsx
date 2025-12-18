
/**
 * Cluster 组件测试
 * 测试点聚合组件的基本功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Cluster from '../Cluster';
import { Text } from 'react-native';

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(() => {
    return (props: any) => null;
  }),
}));

describe('Cluster 点聚合组件', () => {
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
});