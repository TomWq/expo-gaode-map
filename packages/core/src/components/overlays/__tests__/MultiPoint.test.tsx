
/**
 * MultiPoint 组件测试
 * 测试海量点标记组件的基本功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import MultiPoint from '../MultiPoint';

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(() => {
    return (props: any) => null;
  }),
}));

describe('MultiPoint 海量点组件', () => {
  const items = [
    { latitude: 39.9, longitude: 116.4, id: 1, data: { name: 'Point 1' } },
    { latitude: 39.91, longitude: 116.41, id: 2, data: { name: 'Point 2' } },
    { latitude: 39.92, longitude: 116.42, id: 3, data: { name: 'Point 3' } },
  ];

  it('应该能够渲染', () => {
    const result = render(
      <MultiPoint items={items} />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受自定义图标', () => {
    const result = render(
      <MultiPoint
        items={items}
        icon={require('./test-icon.png')}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受空数组', () => {
    const result = render(
      <MultiPoint items={[]} />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持大量数据点', () => {
    const largeItems = Array.from({ length: 1000 }, (_, i) => ({
      latitude: 39.9 + Math.random() * 0.1,
      longitude: 116.4 + Math.random() * 0.1,
      id: i,
    }));

    const result = render(
      <MultiPoint items={largeItems} />
    );
    expect(result).toBeTruthy();
  });
});