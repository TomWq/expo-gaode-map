
/**
 * Polygon 组件测试
 * 测试多边形覆盖物组件的基本功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Polygon from '../Polygon';

// Mock expo-modules-core
jest.mock('expo-modules-core', () => ({
  requireNativeViewManager: jest.fn(() => {
    return (props: any) => null;
  }),
}));

describe('Polygon 覆盖物组件', () => {
  const points = [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.9, longitude: 116.41 },
  ];

  it('应该能够渲染', () => {
    const result = render(
      <Polygon
        points={points}
        strokeColor="#FF0000"
        fillColor="#0000FF"
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受坐标数组属性', () => {
    const result = render(
      <Polygon points={points} />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受边线和填充颜色', () => {
    const result = render(
      <Polygon
        points={points}
        strokeColor="#FF0000"
        strokeWidth={2}
        fillColor="#00FF00"
      />
    );
    expect(result).toBeTruthy();
  });

  it('应该接受 zIndex 属性', () => {
    const result = render(
      <Polygon
        points={points}
        zIndex={5}
      />
    );
    expect(result).toBeTruthy();
  });
});