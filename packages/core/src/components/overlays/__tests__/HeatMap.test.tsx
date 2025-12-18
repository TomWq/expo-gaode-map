
/**
 * HeatMap 组件测试
 * 测试热力图组件的基本功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import HeatMap from '../HeatMap';

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(() => {
    return (props: any) => null;
  }),
}));

describe('HeatMap 热力图组件', () => {
  const data = [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.92, longitude: 116.42 },
    { latitude: 39.93, longitude: 116.43 },
  ];

  it('应该能够渲染', () => {
    const result = render(
      <HeatMap data={data} />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受半径属性', () => {
    const result = render(
      <HeatMap
        data={data}
        radius={50}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受透明度属性', () => {
    const result = render(
      <HeatMap
        data={data}
        opacity={0.6}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受空数组', () => {
    const result = render(
      <HeatMap data={[]} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持大量数据点', () => {
    const largeData = Array.from({ length: 500 }, (_, i) => ({
      latitude: 39.9 + Math.random() * 0.1,
      longitude: 116.4 + Math.random() * 0.1,
    }));

    const result = render(
      <HeatMap data={largeData} radius={30} opacity={0.8} />
    );
    expect(result).toBeTruthy();
  });
});