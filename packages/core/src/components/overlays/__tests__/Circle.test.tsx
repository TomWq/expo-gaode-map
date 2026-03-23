/**
 * Circle 组件测试
 * 测试圆形覆盖物组件的基本功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Circle from '../Circle';

const mockNativeCircle = jest.fn(() => null);

jest.mock('../../../utils/lazyNativeViewManager', () => ({
  createLazyNativeViewManager: jest.fn(() => () => mockNativeCircle),
}));

describe('Circle 覆盖物组件', () => {
  beforeEach(() => {
    mockNativeCircle.mockClear();
  });

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

  it('应该归一化中心点并透传给原生组件', () => {
    render(
      <Circle
        center={[116.4, 39.9]}
        radius={1000}
      />
    );

    expect(mockNativeCircle).toHaveBeenCalledWith(
      expect.objectContaining({
        center: { latitude: 39.9, longitude: 116.4 },
        radius: 1000,
      }),
      undefined
    );
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

  it('相同关键属性重渲染时不应重复渲染原生组件', () => {
    const onCirclePress = jest.fn();
    const { rerender } = render(
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        strokeColor="#FF0000"
        fillColor="#00FF00"
        strokeWidth={2}
        zIndex={1}
        onCirclePress={onCirclePress}
      />
    );

    expect(mockNativeCircle).toHaveBeenCalledTimes(1);

    rerender(
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        strokeColor="#FF0000"
        fillColor="#00FF00"
        strokeWidth={2}
        zIndex={1}
        onCirclePress={onCirclePress}
      />
    );

    expect(mockNativeCircle).toHaveBeenCalledTimes(1);
  });

  it('关键属性变化时应该重新渲染原生组件', () => {
    const { rerender } = render(
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
      />
    );

    expect(mockNativeCircle).toHaveBeenCalledTimes(1);

    rerender(
      <Circle
        center={{ latitude: 39.9, longitude: 116.401 }}
        radius={1200}
      />
    );

    expect(mockNativeCircle).toHaveBeenCalledTimes(2);
  });
});
