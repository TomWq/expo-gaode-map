import React from 'react';
import { Platform, Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { jest } from '@jest/globals';

const mockNativeMarker = jest.fn((props: any) => <>{props.children}</>);

jest.mock('../../../utils/lazyNativeViewManager', () => ({
  createLazyNativeViewManager: jest.fn(() => () => mockNativeMarker),
}));

jest.mock('../../../ExpoGaodeMapModule', () => ({
  __esModule: true,
  default: {
    calculatePathLength: jest.fn(() => 100),
    getPointAtDistance: jest.fn((_points: unknown, distance: number) => ({
      latitude: 39.9 + distance / 10000,
      longitude: 116.4 + distance / 10000,
      angle: distance / 10,
    })),
  },
}));

import Marker from '../Marker';

describe('Marker 组件', () => {
  const defaultProps = {
    position: { latitude: 39.9, longitude: 116.4 },
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockNativeMarker.mockClear();
    (Platform as any).OS = 'ios';
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('应该正确渲染默认图标尺寸', () => {
    render(<Marker {...defaultProps} />);

    expect(mockNativeMarker).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 39.9,
        longitude: 116.4,
        iconWidth: 40,
        iconHeight: 40,
        contentWidth: 0,
        contentHeight: 0,
      }),
      undefined
    );
  });

  it('应该归一化数组坐标并支持图标尺寸', () => {
    render(
      <Marker
        position={[116.5, 40.0]}
        icon="custom-icon"
        iconWidth={50}
        iconHeight={60}
      />
    );

    expect(mockNativeMarker).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 40.0,
        longitude: 116.5,
        icon: 'custom-icon',
        iconWidth: 50,
        iconHeight: 60,
        contentWidth: 0,
        contentHeight: 0,
      }),
      undefined
    );
  });

  it('iOS 下 children 应包裹测量容器并在 onLayout 后更新尺寸', () => {
    const result = render(
      <Marker {...defaultProps}>
        <Text>自定义内容</Text>
      </Marker>
    );

    expect(mockNativeMarker).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        iconWidth: 0,
        iconHeight: 0,
        contentWidth: 0,
        contentHeight: 0,
      }),
      undefined
    );

    const measureView = result.UNSAFE_getByType(require('react-native').View);
    fireEvent(measureView, 'layout', {
      nativeEvent: {
        layout: {
          width: 88.2,
          height: 42.4,
        },
      },
    });

    expect(mockNativeMarker).toHaveBeenLastCalledWith(
      expect.objectContaining({
        iconWidth: 89,
        iconHeight: 43,
        contentWidth: 89,
        contentHeight: 43,
      }),
      undefined
    );
  });

  it('Android 下 children 也应在 onLayout 后更新尺寸', () => {
    (Platform as any).OS = 'android';

    const result = render(
      <Marker {...defaultProps}>
        <Text>Android 内容</Text>
      </Marker>
    );

    expect(mockNativeMarker).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        iconWidth: 0,
        iconHeight: 0,
        contentWidth: 0,
        contentHeight: 0,
      }),
      undefined
    );

    const measureView = result.UNSAFE_getByType(require('react-native').View);
    fireEvent(measureView, 'layout', {
      nativeEvent: {
        layout: {
          width: 96.1,
          height: 54.6,
        },
      },
    });

    expect(mockNativeMarker).toHaveBeenLastCalledWith(
      expect.objectContaining({
        iconWidth: 97,
        iconHeight: 55,
        contentWidth: 97,
        contentHeight: 55,
      }),
      undefined
    );
  });

  it('应该归一化 smoothMovePath 并透传', () => {
    render(
      <Marker
        {...defaultProps}
        smoothMovePath={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.41 },
        ]}
        smoothMoveDuration={12}
      />
    );

    expect(mockNativeMarker).toHaveBeenCalledWith(
      expect.objectContaining({
        smoothMovePath: [
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.41 },
        ],
        smoothMoveDuration: 12,
      }),
      undefined
    );
  });

  it('相同 props 引用重渲染时不应重复渲染', () => {
    const child = <Text>内容</Text>;
    const smoothMovePath = [
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.91, longitude: 116.41 },
    ];
    const { rerender } = render(
      <Marker
        {...defaultProps}
        cacheKey="k1"
        children={child}
        icon="marker"
        iconWidth={20}
        iconHeight={20}
        smoothMovePath={smoothMovePath}
        smoothMoveDuration={10}
      />
    );

    rerender(
      <Marker
        {...defaultProps}
        cacheKey="k1"
        children={child}
        icon="marker"
        iconWidth={20}
        iconHeight={20}
        smoothMovePath={smoothMovePath}
        smoothMoveDuration={10}
      />
    );

    expect(mockNativeMarker).toHaveBeenCalledTimes(1);
  });

  it('cacheKey 稳定时，新的 children JSX 引用也应触发重新渲染', () => {
    const { rerender } = render(
      <Marker {...defaultProps} cacheKey="k1">
        <Text>内容 1</Text>
      </Marker>
    );

    rerender(
      <Marker {...defaultProps} cacheKey="k1">
        <Text>内容 1</Text>
      </Marker>
    );

    expect(mockNativeMarker).toHaveBeenCalledTimes(2);
  });

  it('位置、cacheKey 或 smoothMovePath 变化时应重新渲染', () => {
    const { rerender } = render(
      <Marker
        {...defaultProps}
        cacheKey="k1"
        smoothMovePath={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.41 },
        ]}
      />
    );

    rerender(
      <Marker
        position={{ latitude: 40.0, longitude: 116.5 }}
        cacheKey="k2"
        smoothMovePath={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.92, longitude: 116.42 },
        ]}
      />
    );

    expect(mockNativeMarker).toHaveBeenCalledTimes(2);
  });

  it('zIndex、opacity 和 anchor 变化时应重新渲染', () => {
    const { rerender } = render(
      <Marker
        {...defaultProps}
        zIndex={10}
        opacity={1}
        anchor={{ x: 0.5, y: 1 }}
      />
    );

    rerender(
      <Marker
        {...defaultProps}
        zIndex={20}
        opacity={0.8}
        anchor={{ x: 0.5, y: 0.5 }}
      />
    );

    expect(mockNativeMarker).toHaveBeenCalledTimes(2);
  });

  it('应触发平滑移动进度和结束事件', () => {
    const onSmoothMoveProgress = jest.fn();
    const onSmoothMoveEnd = jest.fn();

    render(
      <Marker
        {...defaultProps}
        smoothMovePath={[
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.41 },
        ]}
        smoothMoveDuration={1}
        onSmoothMoveProgress={onSmoothMoveProgress}
        onSmoothMoveEnd={onSmoothMoveEnd}
      />
    );

    jest.advanceTimersByTime(1100);

    expect(onSmoothMoveProgress).toHaveBeenCalled();
    expect(onSmoothMoveEnd).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: expect.objectContaining({
          totalDistance: 100,
        }),
      })
    );
  });
});
