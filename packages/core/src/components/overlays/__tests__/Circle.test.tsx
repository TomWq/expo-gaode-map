/**
 * Circle 组件测试
 * 测试圆形覆盖物组件的基本功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Circle from '../Circle';

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(() => {
    return (props: any) => null;
  }),
}));

describe('Circle 覆盖物组件', () => {
  it('应该能够渲染', () => {
    const result = render(
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        strokeColor="#FF0000"
        fillColor="#0000FF"
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受中心点坐标属性', () => {
    const center = { latitude: 39.9, longitude: 116.4 };
    const result = render(
      <Circle center={center} radius={500} />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受半径属性', () => {
    const result = render(
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={2000}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受颜色属性', () => {
    const result = render(
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        strokeColor="#FF0000"
        fillColor="#00FF00"
        strokeWidth={2}
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受 zIndex 属性', () => {
    const result = render(
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        zIndex={10}
      />
    );
    expect(result).toBeTruthy();
  });
});