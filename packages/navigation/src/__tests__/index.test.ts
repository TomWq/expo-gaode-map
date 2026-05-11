jest.mock('expo-gaode-map-web-api', () => ({
  GaodeWebAPI: jest.fn(),
  TransitStrategy: {
    RECOMMENDED: 7,
  },
}), { virtual: true });

import {
  buildAnchorWaypointsFromWebRoute,
  calculateDriveRoute,
  calculateTransitRoute,
  followWebPlannedRoute,
  DriveStrategy,
  RouteType,
} from '../index';
import { GaodeWebAPI, TransitStrategy } from 'expo-gaode-map-web-api';

describe('navigation exports', () => {
  const nativeMocks = (global as any).__navigationNativeMocks as {
    core: {
      distanceBetweenCoordinates: jest.Mock;
      calculatePathLength: jest.Mock;
      simplifyPolyline: jest.Mock;
      getNearestPointOnPath: jest.Mock;
    };
    navigation: {
      calculateDriveRoute: jest.Mock;
      independentDriveRoute: jest.Mock;
      startNaviWithIndependentPath: jest.Mock;
      clearIndependentRoute: jest.Mock;
    };
  };

  const basePolyline = [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.901, longitude: 116.401 },
    { latitude: 39.902, longitude: 116.402 },
    { latitude: 39.903, longitude: 116.403 },
    { latitude: 39.904, longitude: 116.404 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (GaodeWebAPI as jest.Mock).mockReset();
    nativeMocks.core.distanceBetweenCoordinates.mockImplementation((pointA, pointB) => {
      if (
        pointA?.latitude === pointB?.latitude &&
        pointA?.longitude === pointB?.longitude
      ) {
        return 0;
      }
      return 1000;
    });
    nativeMocks.core.calculatePathLength.mockReturnValue(300);
    nativeMocks.core.simplifyPolyline.mockImplementation((points) => points);
    nativeMocks.core.getNearestPointOnPath.mockReturnValue({ distanceMeters: 0 });
    nativeMocks.navigation.calculateDriveRoute.mockResolvedValue({
      route: { paths: [] },
      count: 0,
      mainPathIndex: 0,
      routeIds: [],
      routes: [],
    });
    nativeMocks.navigation.independentDriveRoute.mockReset();
    nativeMocks.navigation.startNaviWithIndependentPath.mockResolvedValue(true);
    nativeMocks.navigation.clearIndependentRoute.mockResolvedValue(true);
  });

  it('buildAnchorWaypointsFromWebRoute 会在间距过大时退回中点锚点', () => {
    const result = buildAnchorWaypointsFromWebRoute({
      webRoute: {
        polyline: basePolyline,
      },
      minSpacingMeters: 5000,
      maxViaPoints: 8,
    });

    expect(result).toEqual([basePolyline[2]]);
  });

  it('calculateDriveRoute 会在规避预览场景下走 Web API 并归一化参数', async () => {
    const driving = jest.fn().mockResolvedValue({
      route: {
        taxi_cost: 18,
        paths: [
          {
            distance: 1200,
            cost: {
              duration: 800,
              toll_distance: 50,
              tolls: 6,
              traffic_lights: 3,
            },
            restriction: 0,
            steps: [
              {
                instruction: '直行',
                orientation: 'north',
                road_name: '测试路',
                step_distance: 600,
                cost: {
                  duration: 300,
                  toll_distance: 20,
                  tolls: 3,
                },
                polyline: '116.4,39.9;116.405,39.905',
                assistant_action: 'straight',
              },
              {
                instruction: '左转',
                road_name: '后半段',
                step_distance: 600,
                cost: {
                  duration: 500,
                  toll_distance: 30,
                  tolls: 3,
                },
                polyline: '116.405,39.905;116.41,39.91',
              },
            ],
          },
        ],
      },
    });

    (GaodeWebAPI as jest.Mock).mockImplementation(() => ({
      route: {
        driving,
      },
    }));

    const result = await calculateDriveRoute({
      type: RouteType.DRIVE,
      from: { latitude: 39.9, longitude: 116.4 },
      to: { latitude: 39.91, longitude: 116.41 },
      strategy: DriveStrategy.NO_HIGHWAY_AVOID_COST_CONGESTION,
      waypoints: [{ latitude: 39.905, longitude: 116.405 }],
      avoidRoad: '朝阳路',
      avoidPolygons: [
        [
          { latitude: 39.8, longitude: 116.2 },
          { latitude: 39.81, longitude: 116.21 },
        ],
        [
          { latitude: 39.9, longitude: 116.3 },
          { latitude: 39.91, longitude: 116.31 },
        ],
      ],
      carNumber: '京A12345',
    });

    expect(driving).toHaveBeenCalledWith(
      '116.4,39.9',
      '116.41,39.91',
      expect.objectContaining({
        strategy: 43,
        waypoints: ['116.405,39.905'],
        avoidroad: '朝阳路',
        avoidpolygons: '116.2,39.8;116.21,39.81|116.3,39.9;116.31,39.91',
        plate: '京A12345',
        show_fields: 'cost,navi,polyline',
      })
    );
    expect(nativeMocks.navigation.calculateDriveRoute).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      count: 1,
      taxiCost: 18,
      routes: [
        {
          distance: 1200,
          duration: 800,
          tollCost: 6,
          trafficLightCount: 3,
          restrictionCode: 0,
          restrictionInfo: '限行已规避或未限行',
        },
      ],
    });
    expect(result.routes[0].polyline).toEqual([
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.905, longitude: 116.405 },
      { latitude: 39.905, longitude: 116.405 },
      { latitude: 39.91, longitude: 116.41 },
    ]);
  });

  it('calculateTransitRoute 会将 Web 公交换乘结果映射为路线结构', async () => {
    const transit = jest.fn().mockResolvedValue({
      route: {
        transits: [
          {
            distance: 1234,
            cost: {
              duration: 1800,
              transit_fee: 5,
            },
            segments: [
              {
                walking: {
                  steps: [
                    { polyline: '116.1,39.1;116.2,39.2' },
                  ],
                },
                bus: {
                  buslines: [
                    { polyline: '116.2,39.2;116.3,39.3' },
                  ],
                },
                railway: {
                  buslines: [
                    { polyline: '116.3,39.3;116.4,39.4' },
                  ],
                },
              },
            ],
          },
        ],
      },
    });

    (GaodeWebAPI as jest.Mock).mockImplementation(() => ({
      route: {
        transit,
      },
    }));

    const result = await calculateTransitRoute({
      type: RouteType.TRANSIT,
      from: { latitude: 39.9, longitude: 116.4 },
      to: { latitude: 39.95, longitude: 116.45 },
      city1: '北京',
      city2: '北京',
      alternativeRoute: 2,
    });

    expect(transit).toHaveBeenCalledWith(
      '116.4,39.9',
      '116.45,39.95',
      '北京',
      '北京',
      expect.objectContaining({
        strategy: TransitStrategy.RECOMMENDED,
        AlternativeRoute: 2,
        show_fields: 'cost,polyline',
      })
    );
    expect(result).toMatchObject({
      count: 1,
      routes: [
        {
          distance: 1234,
          duration: 1800,
          tollCost: 5,
        },
      ],
    });
    expect(result.routes[0].polyline).toEqual([
      { latitude: 39.1, longitude: 116.1 },
      { latitude: 39.2, longitude: 116.2 },
      { latitude: 39.2, longitude: 116.2 },
      { latitude: 39.3, longitude: 116.3 },
      { latitude: 39.3, longitude: 116.3 },
      { latitude: 39.4, longitude: 116.4 },
    ]);
  });

  it('followWebPlannedRoute 会在更优直连结果出现时切换并启动导航', async () => {
    const webRoute = { polyline: basePolyline.slice(0, 3) };

    const makeIndependentResult = (token: number) => ({
      independent: true,
      token,
      count: 1,
      mainPathIndex: 0,
      routeIds: [7],
      routes: [
        {
          id: 7,
          start: { latitude: 39.9, longitude: 116.4 },
          end: { latitude: 39.902, longitude: 116.402 },
          distance: 300,
          duration: 600,
          segments: [],
          polyline: webRoute.polyline,
        },
      ],
    });

    nativeMocks.navigation.independentDriveRoute
      .mockResolvedValueOnce(makeIndependentResult(101))
      .mockResolvedValueOnce(makeIndependentResult(202));

    const result = await followWebPlannedRoute({
      webRoute,
      from: { latitude: 39.9, longitude: 116.4 },
      to: { latitude: 39.902, longitude: 116.402 },
      startNavigation: true,
      naviType: 1,
      maxDeviationMeters: 120,
      minSpacingMeters: 5000,
    });

    expect(nativeMocks.navigation.independentDriveRoute).toHaveBeenCalledTimes(2);
    expect(nativeMocks.navigation.clearIndependentRoute).toHaveBeenCalledWith({ token: 101 });
    expect(nativeMocks.navigation.startNaviWithIndependentPath).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 202,
        naviType: 1,
        routeId: 7,
      })
    );
    expect(result).toMatchObject({
      mode: 'matched',
      token: 202,
      selectedRouteId: 7,
      navigationStarted: true,
      navigationUsesAnchorWaypoints: false,
    });
    expect(result.anchorWaypoints).toEqual([{ latitude: 39.901, longitude: 116.401 }]);
  });
});
