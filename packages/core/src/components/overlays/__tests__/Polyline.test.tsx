/**
 * Polyline 组件测试
 * 测试折线覆盖物组件的基本功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Polyline from '../Polyline';

const mockNativePolyline = jest.fn(() => null);

jest.mock('../../../utils/lazyNativeViewManager', () => ({
  createLazyNativeViewManager: jest.fn(() => () => mockNativePolyline),
}));

describe('Polyline 覆盖物组件', () => {
  beforeEach(() => {
    mockNativePolyline.mockClear();
  });

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

  it('应该归一化坐标并透传给原生组件', () => {
    render(
      <Polyline
        points={[
          [116.4, 39.9],
          [116.41, 39.91],
        ]}
      />
    );

    expect(mockNativePolyline).toHaveBeenCalledWith(
      expect.objectContaining({
        points: [
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.41 },
        ],
      }),
      undefined
    );
  });

  it('相同关键属性重渲染时不应重复渲染', () => {
    const onPolylinePress = jest.fn();
    const colors = ['#f00', '#0f0'];
    const { rerender } = render(
      <Polyline
        points={points}
        strokeWidth={5}
        strokeColor="#f00"
        zIndex={1}
        geodesic
        dotted
        gradient
        simplificationTolerance={0}
        texture="demo"
        colors={colors}
        onPolylinePress={onPolylinePress}
      />
    );

    rerender(
      <Polyline
        points={points}
        strokeWidth={5}
        strokeColor="#f00"
        zIndex={1}
        geodesic
        dotted
        gradient
        simplificationTolerance={0}
        texture="demo"
        colors={colors}
        onPolylinePress={onPolylinePress}
      />
    );

    expect(mockNativePolyline).toHaveBeenCalledTimes(1);
  });

  it('关键属性变化时应重新渲染', () => {
    const { rerender } = render(<Polyline points={points} strokeWidth={5} />);

    rerender(<Polyline points={[...points]} strokeWidth={5} />);

    expect(mockNativePolyline).toHaveBeenCalledTimes(2);
  });
});
