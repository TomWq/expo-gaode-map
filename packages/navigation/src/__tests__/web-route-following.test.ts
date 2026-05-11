import { followWebPlannedRoute } from '../web-route-following';

describe('web-route-following', () => {
  const nativeMocks = (global as any).__navigationNativeMocks as {
    core: {
      distanceBetweenCoordinates: jest.Mock;
      simplifyPolyline: jest.Mock;
      getNearestPointOnPath: jest.Mock;
      calculatePathLength: jest.Mock;
    };
    navigation: {
      independentDriveRoute: jest.Mock;
      startNaviWithIndependentPath: jest.Mock;
      clearIndependentRoute: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    nativeMocks.core.distanceBetweenCoordinates.mockImplementation((pointA, pointB) => {
      if (
        pointA?.latitude === pointB?.latitude &&
        pointA?.longitude === pointB?.longitude
      ) {
        return 0;
      }
      return 1000;
    });
    nativeMocks.core.simplifyPolyline.mockImplementation((points) => points);
    nativeMocks.core.getNearestPointOnPath.mockImplementation(() => undefined);
    nativeMocks.core.calculatePathLength.mockReturnValue(300);
    nativeMocks.navigation.startNaviWithIndependentPath.mockResolvedValue(true);
    nativeMocks.navigation.clearIndependentRoute.mockResolvedValue(true);
  });

  it('会在原生路线偏差过大时只返回预览结果', async () => {
    nativeMocks.navigation.independentDriveRoute.mockResolvedValue({
      independent: true,
      token: 301,
      count: 1,
      mainPathIndex: 0,
      routeIds: [11],
      routes: [
        {
          id: 11,
          start: { latitude: 39.9, longitude: 116.4 },
          end: { latitude: 39.91, longitude: 116.41 },
          distance: 1000,
          duration: 600,
          segments: [],
          polyline: [
            { latitude: 40.2, longitude: 116.8 },
            { latitude: 40.21, longitude: 116.81 },
            { latitude: 40.22, longitude: 116.82 },
          ],
        },
      ],
    });

    const result = await followWebPlannedRoute({
      from: { latitude: 39.9, longitude: 116.4 },
      to: { latitude: 39.91, longitude: 116.41 },
      webRoute: {
        polyline: [
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.905, longitude: 116.405 },
          { latitude: 39.91, longitude: 116.41 },
        ],
      },
      startNavigation: true,
      maxDeviationMeters: 120,
    });

    expect(nativeMocks.navigation.independentDriveRoute).toHaveBeenCalledTimes(1);
    expect(nativeMocks.navigation.startNaviWithIndependentPath).not.toHaveBeenCalled();
    expect(nativeMocks.navigation.clearIndependentRoute).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: 'preview_only',
      token: 301,
      navigationStarted: false,
      navigationUsesAnchorWaypoints: true,
      selectedRouteId: 11,
    });
    expect(result.anchorWaypoints).toEqual([
      { latitude: 39.905, longitude: 116.405 },
    ]);
    expect(result.candidateMatches).toHaveLength(1);
    expect(result.averageDeviationMeters).toBeGreaterThan(120);
  });

  it('会在 Web 线路点数不足时直接报错', async () => {
    await expect(
      followWebPlannedRoute({
        from: { latitude: 39.9, longitude: 116.4 },
        to: { latitude: 39.91, longitude: 116.41 },
        webRoute: {
          polyline: [{ latitude: 39.9, longitude: 116.4 }],
        },
      })
    ).rejects.toThrow('webRoute.polyline 至少需要 2 个点');
  });
});
