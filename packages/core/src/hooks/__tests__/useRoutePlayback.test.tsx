import * as React from 'react';
import { act, render } from '@testing-library/react-native';

jest.mock('../../ExpoGaodeMapModule', () => ({
  __esModule: true,
  default: {
    calculatePathLength: jest.fn(() => 100),
    getPointAtDistance: jest.fn((_path: unknown, distance: number) => ({
      latitude: 39.9 + distance / 1000,
      longitude: 116.4 + distance / 1000,
      angle: distance / 10,
    })),
    simplifyPolyline: jest.fn((path: unknown) => path),
  },
}));

jest.mock('../../utils/RouteUtils', () => ({
  fitCameraToCoordinates: jest.fn(() => Promise.resolve()),
}));

import { MapContext } from '../../components/MapContext';
import { useRoutePlayback } from '../useRoutePlayback';

const mockExpoGaodeMapModule = jest.requireMock('../../ExpoGaodeMapModule').default as {
  calculatePathLength: jest.Mock;
  getPointAtDistance: jest.Mock;
  simplifyPolyline: jest.Mock;
};

const { fitCameraToCoordinates: mockFitCameraToCoordinates } = jest.requireMock(
  '../../utils/RouteUtils'
) as {
  fitCameraToCoordinates: jest.Mock;
};

describe('useRoutePlayback', () => {
  let latestController: ReturnType<typeof useRoutePlayback>;

  const points = [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
  ];

  function Harness({
    playbackOptions,
  }: {
    playbackOptions?: Parameters<typeof useRoutePlayback>[1];
  }) {
    latestController = useRoutePlayback(points, playbackOptions);
    return null;
  }

  function renderHarness({
    playbackOptions,
    map,
  }: {
    playbackOptions?: Parameters<typeof useRoutePlayback>[1];
    map?: React.ContextType<typeof MapContext>;
  }) {
    return render(
      <MapContext.Provider value={map ?? null}>
        <Harness playbackOptions={playbackOptions} />
      </MapContext.Provider>
    );
  }

  async function flushPlayback(ms = 0) {
    await act(async () => {
      if (ms > 0) {
        jest.advanceTimersByTime(ms);
      }
      await Promise.resolve();
    });
  }

  beforeEach(() => {
    jest.useFakeTimers();
    latestController = undefined as never;
    mockFitCameraToCoordinates.mockClear();
    mockExpoGaodeMapModule.calculatePathLength.mockClear();
    mockExpoGaodeMapModule.getPointAtDistance.mockClear();
    mockExpoGaodeMapModule.simplifyPolyline.mockClear();
    mockExpoGaodeMapModule.calculatePathLength.mockReturnValue(100);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('默认不自动跟随相机，也不自动 fit 路线', async () => {
    const map = {
      moveCamera: jest.fn(() => Promise.resolve()),
      getCameraPosition: jest.fn(() => Promise.resolve({ zoom: 12 })),
    };

    renderHarness({
      playbackOptions: {
        updateIntervalMs: 100,
      },
      map,
    });

    await act(async () => {
      latestController.start();
      await Promise.resolve();
    });
    await flushPlayback(300);

    expect(mockFitCameraToCoordinates).not.toHaveBeenCalled();
    expect(map.moveCamera).not.toHaveBeenCalled();
  });

  it('调整倍速时应保持当前播放进度并继续播放', async () => {
    renderHarness({
      playbackOptions: {
        baseSpeedMps: 10,
        updateIntervalMs: 100,
      },
    });

    await act(async () => {
      latestController.start();
      await Promise.resolve();
    });
    await flushPlayback(2000);

    const progressBeforeSpeedChange = latestController.progress;

    await act(async () => {
      latestController.setSpeedMultiplier(2);
      await Promise.resolve();
    });
    await flushPlayback();

    expect(latestController.isPlaying).toBe(true);
    expect(latestController.durationSeconds).toBe(5);
    expect(latestController.progress).toBeCloseTo(progressBeforeSpeedChange, 2);

    await flushPlayback(1000);

    expect(latestController.progress).toBeGreaterThan(progressBeforeSpeedChange);
    expect(latestController.currentPosition).not.toEqual(points[0]);
  });
});
