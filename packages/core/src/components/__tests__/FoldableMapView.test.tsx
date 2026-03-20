import React from 'react';
import { act, render } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { FoldableMapView, useFoldableMap, type FoldableConfig } from '../FoldableMapView';
import { PlatformDetector, DeviceInfo, DeviceType, FoldState } from '../../utils/PlatformDetector';
import type { MapViewRef } from '../../types';

const mockMapMethods: jest.Mocked<MapViewRef> = {
  moveCamera: jest.fn(),
  getLatLng: jest.fn(),
  setCenter: jest.fn(),
  setZoom: jest.fn(),
  getCameraPosition: jest.fn(),
  takeSnapshot: jest.fn(),
};

jest.mock('../../ExpoGaodeMapView', () => {
  const React = require('react');

  const MockExpoGaodeMapView = React.forwardRef((_props: unknown, ref: React.ForwardedRef<MapViewRef>) => {
    React.useImperativeHandle(ref, () => mockMapMethods);
    return null;
  });

  MockExpoGaodeMapView.displayName = 'MockExpoGaodeMapView';

  return {
    __esModule: true,
    default: MockExpoGaodeMapView,
  };
});

const foldableDeviceInfo: DeviceInfo = {
  type: DeviceType.FOLDABLE,
  isTablet: false,
  isFoldable: true,
  screenSize: {
    width: 900,
    height: 1200,
    scale: 2,
    fontScale: 1,
  },
  aspectRatio: 1.33,
  isLandscape: false,
};

describe('FoldableMapView', () => {
  const originalPlatformOS = Platform.OS;
  let dimensionChangeHandler: ((info: DeviceInfo) => void | Promise<void>) | null = null;
  let currentFoldState = FoldState.FOLDED;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    currentFoldState = FoldState.FOLDED;
    dimensionChangeHandler = null;

    mockMapMethods.getCameraPosition.mockResolvedValue({
      target: { latitude: 31.2304, longitude: 121.4737 },
      zoom: 10,
      bearing: 0,
      tilt: 0,
    });
    mockMapMethods.moveCamera.mockResolvedValue(undefined);
    mockMapMethods.getLatLng.mockResolvedValue({ latitude: 0, longitude: 0 });
    mockMapMethods.setCenter.mockResolvedValue(undefined);
    mockMapMethods.setZoom.mockResolvedValue(undefined);
    mockMapMethods.takeSnapshot.mockResolvedValue('snapshot.png');

    jest.spyOn(PlatformDetector, 'getDeviceInfo').mockReturnValue(foldableDeviceInfo);
    jest.spyOn(PlatformDetector, 'getFoldState').mockImplementation(() => currentFoldState);
    jest.spyOn(PlatformDetector, 'addDimensionChangeListener').mockImplementation((callback) => {
      dimensionChangeHandler = callback;
      return jest.fn();
    });
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
    jest.restoreAllMocks();
  });

  it('在配置更新后仍使用最新的缩放参数处理折叠状态变化', async () => {
    const onFoldStateChange = jest.fn();

    const { rerender } = render(
      <FoldableMapView foldableConfig={{ unfoldedZoomDelta: 1 }} />
    );

    rerender(
      <FoldableMapView
        foldableConfig={{
          unfoldedZoomDelta: 3,
          onFoldStateChange,
        }}
      />
    );

    currentFoldState = FoldState.UNFOLDED;

    await act(async () => {
      await dimensionChangeHandler?.({
        ...foldableDeviceInfo,
        aspectRatio: 1.2,
      });
    });

    expect(mockMapMethods.moveCamera).toHaveBeenCalledWith({
      target: { latitude: 31.2304, longitude: 121.4737 },
      zoom: 13,
    }, 300);
    expect(onFoldStateChange).toHaveBeenCalledWith(
      FoldState.UNFOLDED,
      expect.objectContaining({ isFoldable: true })
    );
  });

  it('非折叠屏设备不应注册尺寸变化监听', () => {
    jest.spyOn(PlatformDetector, 'getDeviceInfo').mockReturnValue({
      ...foldableDeviceInfo,
      type: DeviceType.PHONE,
      isFoldable: false,
    });

    render(<FoldableMapView />);

    expect(PlatformDetector.addDimensionChangeListener).not.toHaveBeenCalled();
  });
});

describe('useFoldableMap', () => {
  const originalPlatformOS = Platform.OS;
  let dimensionChangeHandler: ((info: DeviceInfo) => void | Promise<void>) | null = null;
  let currentFoldState = FoldState.FOLDED;
  let latestHookValue:
    | {
        foldState: FoldState;
        deviceInfo: DeviceInfo;
        isFoldable: boolean;
      }
    | undefined;

  function HookHarness({
    mapRef,
    config,
  }: {
    mapRef: React.RefObject<MapViewRef>;
    config?: FoldableConfig;
  }) {
    latestHookValue = useFoldableMap(mapRef, config);
    return null;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    currentFoldState = FoldState.FOLDED;
    dimensionChangeHandler = null;
    latestHookValue = undefined;

    mockMapMethods.getCameraPosition.mockResolvedValue({
      target: { latitude: 39.9042, longitude: 116.4074 },
      zoom: 12,
      bearing: 0,
      tilt: 0,
    });
    mockMapMethods.moveCamera.mockResolvedValue(undefined);

    jest.spyOn(PlatformDetector, 'getDeviceInfo').mockReturnValue(foldableDeviceInfo);
    jest.spyOn(PlatformDetector, 'getFoldState').mockImplementation(() => currentFoldState);
    jest.spyOn(PlatformDetector, 'addDimensionChangeListener').mockImplementation((callback) => {
      dimensionChangeHandler = callback;
      return jest.fn();
    });
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
    jest.restoreAllMocks();
  });

  it('Hook 在配置更新后也应使用最新的缩放参数', async () => {
    const mapRef = {
      current: mockMapMethods,
    } as React.RefObject<MapViewRef>;

    const { rerender } = render(
      <HookHarness mapRef={mapRef} config={{ unfoldedZoomDelta: 1 }} />
    );

    rerender(
      <HookHarness mapRef={mapRef} config={{ unfoldedZoomDelta: 2 }} />
    );

    currentFoldState = FoldState.UNFOLDED;

    await act(async () => {
      await dimensionChangeHandler?.({
        ...foldableDeviceInfo,
        aspectRatio: 1.1,
      });
    });

    expect(mockMapMethods.moveCamera).toHaveBeenCalledWith({
      target: { latitude: 39.9042, longitude: 116.4074 },
      zoom: 14,
    }, 300);
    expect(latestHookValue?.foldState).toBe(FoldState.UNFOLDED);
    expect(latestHookValue?.isFoldable).toBe(true);
  });
});
