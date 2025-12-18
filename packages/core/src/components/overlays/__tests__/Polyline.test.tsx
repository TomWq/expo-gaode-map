/**
 * Polyline 组件测试
 * 测试折线覆盖物组件的基本功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Polyline from '../Polyline';

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(() => {
    return (props: any) => null;
  }),
}));

describe('Polyline 覆盖物组件', () => {
  const points = [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.92, longitude: 116.42 },
  ];

  it('应该能够渲染', () => {
    const result = render(
      <Polyline
        points={points}
        strokeColor="#FF0000"
        strokeWidth={5}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受坐标数组属性', () => {
    const result = render(
      <Polyline points={points} />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受颜色和宽度属性', () => {
    const result = render(
      <Polyline
        points={points}
        strokeColor="#0000FF"
        strokeWidth={10}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受 zIndex 属性', () => {
    const result = render(
      <Polyline
        points={points}
        zIndex={5}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持虚线样式', () => {
    const result = render(
      <Polyline
        points={points}
        strokeColor="#FF0000"
        strokeWidth={5}
        dotted
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该支持渐变色', () => {
    const result = render(
      <Polyline
        points={points}
        colors={['#FF0000', '#00FF00', '#0000FF']}
        gradient
      />
    );
    expect(result).toBeTruthy();
  });
});