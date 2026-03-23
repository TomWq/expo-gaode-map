import React from 'react';
import { render } from '@testing-library/react-native';

const mockNativeHeatMap = jest.fn(() => null);

jest.mock('../../../utils/lazyNativeViewManager', () => ({
  createLazyNativeViewManager: jest.fn(() => () => mockNativeHeatMap),
}));

import HeatMap from '../HeatMap';

describe('HeatMap 热力图组件', () => {
  const data = [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.92, longitude: 116.42 },
  ];

  beforeEach(() => {
    mockNativeHeatMap.mockClear();
  });

  it('应该归一化数据并附加隐藏样式属性', () => {
    render(
      <HeatMap
        data={[
          [116.4, 39.9],
          [116.41, 39.91],
        ]}
        radius={50}
        opacity={0.6}
      />
    );

    expect(mockNativeHeatMap).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.41 },
        ],
        radius: 50,
        opacity: 0.6,
        collapsable: false,
        pointerEvents: 'none',
        style: expect.objectContaining({
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
        }),
      }),
      undefined
    );
  });

  it('应该支持空数组和大量数据点', () => {
    const largeData = Array.from({ length: 500 }, (_, index) => ({
      latitude: 39.9 + index * 0.0001,
      longitude: 116.4 + index * 0.0001,
    }));

    render(<HeatMap data={[]} />);
    render(<HeatMap data={largeData} radius={30} opacity={0.8} />);

    expect(mockNativeHeatMap).toHaveBeenCalledTimes(2);
  });

  it('相同关键属性重渲染时不应重复渲染', () => {
    const { rerender } = render(
      <HeatMap
        data={data}
        visible
        radius={20}
        opacity={0.5}
      />
    );

    rerender(
      <HeatMap
        data={data}
        visible
        radius={20}
        opacity={0.5}
      />
    );

    expect(mockNativeHeatMap).toHaveBeenCalledTimes(1);
  });

  it('data、visible、radius 或 opacity 变化时应重新渲染', () => {
    const { rerender } = render(
      <HeatMap
        data={data}
        visible
        radius={20}
        opacity={0.5}
      />
    );

    rerender(
      <HeatMap
        data={[...data]}
        visible={false}
        radius={30}
        opacity={0.8}
      />
    );

    expect(mockNativeHeatMap).toHaveBeenCalledTimes(2);
  });
});
