import {
  clearIndependentRoute,
  independentDriveRoute,
  selectIndependentRoute,
  startNaviWithIndependentPath,
} from '../index';

describe('independent route chain', () => {
  const nativeMocks = (global as any).__navigationNativeMocks as {
    navigation: {
      independentDriveRoute: jest.Mock;
      selectIndependentRoute: jest.Mock;
      startNaviWithIndependentPath: jest.Mock;
      clearIndependentRoute: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    nativeMocks.navigation.independentDriveRoute.mockResolvedValue({
      independent: true,
      token: 777,
      count: 1,
      mainPathIndex: 0,
      routeIds: [12],
      routes: [
        {
          id: 12,
          start: { latitude: 39.9, longitude: 116.4 },
          end: { latitude: 39.91, longitude: 116.41 },
          distance: 1400,
          duration: 900,
          segments: [],
          polyline: [
            { latitude: 39.9, longitude: 116.4 },
            { latitude: 39.905, longitude: 116.405 },
            { latitude: 39.91, longitude: 116.41 },
          ],
        },
      ],
    });
    nativeMocks.navigation.selectIndependentRoute.mockResolvedValue(true);
    nativeMocks.navigation.startNaviWithIndependentPath.mockResolvedValue(true);
    nativeMocks.navigation.clearIndependentRoute.mockResolvedValue(true);
  });

  it('会把独立算路、选主路、启动导航和清理串成同一条链路', async () => {
    const routeResult = await independentDriveRoute({
      from: { latitude: 39.9, longitude: 116.4 },
      to: { latitude: 39.91, longitude: 116.41 },
      strategy: 0,
      carNumber: '京A12345',
      restriction: true,
      waypoints: [{ latitude: 39.905, longitude: 116.405 }],
    });

    await selectIndependentRoute({
      token: routeResult.token,
      routeId: routeResult.routes[0].id,
    });

    await startNaviWithIndependentPath({
      token: routeResult.token,
      routeId: routeResult.routes[0].id,
      naviType: 1,
    });

    await clearIndependentRoute({
      token: routeResult.token,
    });

    expect(nativeMocks.navigation.independentDriveRoute).toHaveBeenCalledWith({
      from: { latitude: 39.9, longitude: 116.4 },
      to: { latitude: 39.91, longitude: 116.41 },
      strategy: 0,
      carNumber: '京A12345',
      restriction: true,
      waypoints: [{ latitude: 39.905, longitude: 116.405 }],
    });
    expect(nativeMocks.navigation.selectIndependentRoute).toHaveBeenCalledWith({
      token: 777,
      routeId: 12,
    });
    expect(nativeMocks.navigation.startNaviWithIndependentPath).toHaveBeenCalledWith({
      token: 777,
      routeId: 12,
      naviType: 1,
    });
    expect(nativeMocks.navigation.clearIndependentRoute).toHaveBeenCalledWith({
      token: 777,
    });
  });
});
