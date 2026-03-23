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
  let removeDimensionListener: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    currentFoldState = FoldState.FOLDED;
    dimensionChangeHandler = null;
    removeDimensionListener = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

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
      return removeDimensionListener;
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

  it('卸载时应移除尺寸变化监听', () => {
    const { unmount } = render(<FoldableMapView />);

    unmount();

    expect(removeDimensionListener).toHaveBeenCalled();
  });

  it('相机信息为空时不应移动相机，并在 debug 模式下给出提示', async () => {
    const warnSpy = jest.mocked(console.warn);
    mockMapMethods.getCameraPosition.mockResolvedValue(null as never);

    render(<FoldableMapView foldableConfig={{ debug: true }} />);
    currentFoldState = FoldState.UNFOLDED;

    await act(async () => {
      await dimensionChangeHandler?.(foldableDeviceInfo);
    });

    expect(mockMapMethods.moveCamera).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('[FoldableMapView] 无法获取相机位置');
  });

  it('折叠状态未变化时不应调整相机', async () => {
    const onFoldStateChange = jest.fn();

    render(<FoldableMapView foldableConfig={{ onFoldStateChange }} />);
    currentFoldState = FoldState.FOLDED;

    await act(async () => {
      await dimensionChangeHandler?.({
        ...foldableDeviceInfo,
        aspectRatio: 1.25,
      });
    });

    expect(mockMapMethods.moveCamera).not.toHaveBeenCalled();
    expect(onFoldStateChange).toHaveBeenCalledWith(
      FoldState.FOLDED,
      expect.objectContaining({ isFoldable: true })
    );
  });

  it('可禁用自动缩放，并支持不保持中心点', async () => {
    mockMapMethods.getCameraPosition.mockResolvedValue({
      target: { latitude: 31.2304, longitude: 121.4737 },
      zoom: 19,
      bearing: 0,
      tilt: 0,
    });

    const { rerender } = render(
      <FoldableMapView foldableConfig={{ autoAdjustZoom: false }} />
    );

    currentFoldState = FoldState.UNFOLDED;
    await act(async () => {
      await dimensionChangeHandler?.(foldableDeviceInfo);
    });
    expect(mockMapMethods.moveCamera).not.toHaveBeenCalled();

    rerender(
      <FoldableMapView
        foldableConfig={{
          keepCenterOnFold: false,
          unfoldedZoomDelta: 5,
        }}
      />
    );

    currentFoldState = FoldState.FOLDED;
    await act(async () => {
      await dimensionChangeHandler?.({
        ...foldableDeviceInfo,
        aspectRatio: 1.1,
      });
    });

    currentFoldState = FoldState.UNFOLDED;
    await act(async () => {
      await dimensionChangeHandler?.({
        ...foldableDeviceInfo,
        aspectRatio: 1.05,
      });
    });

    expect(mockMapMethods.moveCamera).toHaveBeenLastCalledWith({
      target: undefined,
      zoom: 20,
    }, 300);
  });

  it('debug 模式下应记录初始化、尺寸变化和处理失败日志', async () => {
    const logSpy = jest.mocked(console.log);
    const errorSpy = jest.mocked(console.error);
    mockMapMethods.moveCamera.mockRejectedValueOnce(new Error('move failed'));

    render(<FoldableMapView foldableConfig={{ debug: true }} />);
    currentFoldState = FoldState.UNFOLDED;

    await act(async () => {
      await dimensionChangeHandler?.({
        ...foldableDeviceInfo,
        aspectRatio: 1.15,
      });
    });

    expect(logSpy).toHaveBeenCalledWith('[FoldableMapView] 初始化折叠屏适配');
    expect(logSpy).toHaveBeenCalledWith('[FoldableMapView] 屏幕尺寸变化');
    expect(errorSpy).toHaveBeenCalledWith(
      '[FoldableMapView] 处理折叠状态变化失败:',
      expect.any(Error)
    );
  });
});

describe('useFoldableMap', () => {
  const originalPlatformOS = Platform.OS;
  let dimensionChangeHandler: ((info: DeviceInfo) => void | Promise<void>) | null = null;
  let currentFoldState = FoldState.FOLDED;
  let removeDimensionListener: jest.Mock;
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
    removeDimensionListener = jest.fn();
    latestHookValue = undefined;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

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
      return removeDimensionListener;
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

  it('Hook 在非折叠屏或非 Android 环境下不应注册监听', () => {
    const mapRef = {
      current: mockMapMethods,
    } as React.RefObject<MapViewRef>;

    Platform.OS = 'ios';
    jest.spyOn(PlatformDetector, 'getDeviceInfo').mockReturnValue({
      ...foldableDeviceInfo,
      isFoldable: false,
    });

    render(<HookHarness mapRef={mapRef} />);

    expect(PlatformDetector.addDimensionChangeListener).not.toHaveBeenCalled();
    expect(latestHookValue).toMatchObject({
      foldState: FoldState.UNKNOWN,
      isFoldable: false,
    });
  });

  it('Hook 卸载时应移除监听，并在折叠时应用最小缩放限制', async () => {
    const mapRef = {
      current: mockMapMethods,
    } as React.RefObject<MapViewRef>;

    mockMapMethods.getCameraPosition.mockResolvedValue({
      target: { latitude: 39.9042, longitude: 116.4074 },
      zoom: 4,
      bearing: 0,
      tilt: 0,
    });
    currentFoldState = FoldState.UNFOLDED;

    const { unmount } = render(
      <HookHarness mapRef={mapRef} config={{ unfoldedZoomDelta: 5 }} />
    );

    currentFoldState = FoldState.FOLDED;
    await act(async () => {
      await dimensionChangeHandler?.({
        ...foldableDeviceInfo,
        aspectRatio: 1.4,
      });
    });

    expect(mockMapMethods.moveCamera).toHaveBeenCalledWith({
      target: { latitude: 39.9042, longitude: 116.4074 },
      zoom: 3,
    }, 300);

    unmount();
    expect(removeDimensionListener).toHaveBeenCalled();
  });

  it('Hook debug 模式下应记录调整失败日志', async () => {
    const mapRef = {
      current: mockMapMethods,
    } as React.RefObject<MapViewRef>;
    const errorSpy = jest.mocked(console.error);

    mockMapMethods.moveCamera.mockRejectedValueOnce(new Error('hook move failed'));

    render(
      <HookHarness
        mapRef={mapRef}
        config={{ debug: true }}
      />
    );

    currentFoldState = FoldState.UNFOLDED;
    await act(async () => {
      await dimensionChangeHandler?.({
        ...foldableDeviceInfo,
        aspectRatio: 1.18,
      });
    });

    expect(errorSpy).toHaveBeenCalledWith(
      '[useFoldableMap] 调整失败:',
      expect.any(Error)
    );
  });
});
