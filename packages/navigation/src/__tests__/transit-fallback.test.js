describe('navigation transit fallback', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('当 web-api 缺少 v3 provider/runtime 导出时应抛统一错误', async () => {
    jest.doMock('expo-gaode-map-web-api', () => ({}), { virtual: true });

    let navigation;
    jest.isolateModules(() => {
      navigation = require('../index');
    });

    await expect(
      navigation.calculateTransitRoute({
        type: navigation.RouteType.TRANSIT,
        from: { latitude: 39.9, longitude: 116.4 },
        to: { latitude: 39.91, longitude: 116.41 },
        city1: '北京',
        city2: '北京',
      })
    ).rejects.toMatchObject({
      name: 'GaodeMapError',
      code: 'TRANSIT_FALLBACK_INVALID_EXPORT',
    });
  });

  it('当 web-api 可用时应完成公交结果归一化', async () => {
    const calculateTransitRoutes = jest.fn(async () => [
      {
        distanceMeters: 1200,
        durationSeconds: 600,
        path: [
          { latitude: 39.1, longitude: 116.1 },
          { latitude: 39.2, longitude: 116.2 },
          { latitude: 39.3, longitude: 116.3 },
        ],
        raw: {
          cost: {
            transit_fee: '3',
          },
        },
      },
    ]);

    jest.doMock(
      'expo-gaode-map-web-api',
      () => ({
        createWebRouteProvider: jest.fn(() => ({
          calculateTransitRoutes,
        })),
      }),
      { virtual: true }
    );

    let navigation;
    jest.isolateModules(() => {
      navigation = require('../index');
    });

    const result = await navigation.calculateTransitRoute({
      type: navigation.RouteType.TRANSIT,
      from: { latitude: 39.9, longitude: 116.4 },
      to: { latitude: 39.91, longitude: 116.41 },
      city1: '北京',
      city2: '北京',
    });

    expect(calculateTransitRoutes).toHaveBeenCalledTimes(1);
    expect(result.routes[0].distance).toBe(1200);
    expect(result.routes[0].duration).toBe(600);
    expect(result.routes[0].polyline).toHaveLength(3);
    expect(result.routes[0].tollCost).toBe(3);
  });
});
