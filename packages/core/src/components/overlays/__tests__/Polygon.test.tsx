
/**
 * Polygon 组件测试
 * 测试多边形覆盖物组件的基本功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Polygon from '../Polygon';

const mockNativePolygon = jest.fn(() => null);

jest.mock('../../../utils/lazyNativeViewManager', () => ({
  createLazyNativeViewManager: jest.fn(() => () => mockNativePolygon),
}));

describe('Polygon 覆盖物组件', () => {
  beforeEach(() => {
    mockNativePolygon.mockClear();
  });

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

  it('应该归一化嵌套坐标并透传给原生组件', () => {
    const nestedPoints = [
      [
        [116.4, 39.9],
        [116.41, 39.9],
        [116.41, 39.91],
      ],
    ] as const;

    render(<Polygon points={nestedPoints as any} />);

    expect(mockNativePolygon).toHaveBeenCalledWith(
      expect.objectContaining({
        points: [[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.9, longitude: 116.41 },
          { latitude: 39.91, longitude: 116.41 },
        ]],
      }),
      undefined
    );
  });

  it('points 引用不变时不应重复渲染', () => {
    const onPolygonPress = jest.fn();
    const onPolygonSimplified = jest.fn();
    const { rerender } = render(
      <Polygon
        points={points}
        strokeWidth={2}
        strokeColor="#f00"
        fillColor="#0f0"
        zIndex={1}
        simplificationTolerance={0}
        onPolygonPress={onPolygonPress}
        onPolygonSimplified={onPolygonSimplified}
      />
    );

    rerender(
      <Polygon
        points={points}
        strokeWidth={2}
        strokeColor="#f00"
        fillColor="#0f0"
        zIndex={1}
        simplificationTolerance={0}
        onPolygonPress={onPolygonPress}
        onPolygonSimplified={onPolygonSimplified}
      />
    );

    expect(mockNativePolygon).toHaveBeenCalledTimes(1);
  });

  it('points 或关键属性变化时应重新渲染', () => {
    const { rerender } = render(<Polygon points={points} />);
    const nextPoints = [...points];

    rerender(<Polygon points={nextPoints} />);

    expect(mockNativePolygon).toHaveBeenCalledTimes(2);
  });
});
