jest.mock(
  'expo-gaode-map-web-api',
  () => ({
    GaodeWebAPI: jest.fn(),
    TransitStrategy: {
      RECOMMENDED: 7,
    },
  }),
  { virtual: true }
);

import {
  calculateDriveRouteWithAvoidPreview,
  calculateTransitRouteWithWebApi,
  shouldUseAvoidPreviewFallback,
} from '../web-api-fallback';
import { DriveStrategy } from '../types';
import { GaodeWebAPI, TransitStrategy } from 'expo-gaode-map-web-api';

describe('web-api-fallback helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (GaodeWebAPI as jest.Mock).mockReset();
  });

  it('shouldUseAvoidPreviewFallback 只在规避道路或区域时返回 true', () => {
    expect(
      shouldUseAvoidPreviewFallback({
        type: 'drive',
        from: { latitude: 39.9, longitude: 116.4 },
        to: { latitude: 39.91, longitude: 116.41 },
      } as any)
    ).toBe(false);

    expect(
      shouldUseAvoidPreviewFallback({
        type: 'drive',
        from: { latitude: 39.9, longitude: 116.4 },
        to: { latitude: 39.91, longitude: 116.41 },
        avoidRoad: '朝阳路',
      } as any)
    ).toBe(true);

    expect(
      shouldUseAvoidPreviewFallback({
        type: 'drive',
        from: { latitude: 39.9, longitude: 116.4 },
        to: { latitude: 39.91, longitude: 116.41 },
        avoidPolygons: [[{ latitude: 39.8, longitude: 116.2 }]],
      } as any)
    ).toBe(true);
  });

  it('calculateDriveRouteWithAvoidPreview 会把 Web API 返回映射成路线结构', async () => {
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
            restriction: 1,
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

    const result = await calculateDriveRouteWithAvoidPreview({
      type: 'drive' as any,
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
      ],
      carNumber: '京A12345',
    } as any);

    expect(driving).toHaveBeenCalledWith(
      '116.4,39.9',
      '116.41,39.91',
      expect.objectContaining({
        strategy: 43,
        waypoints: ['116.405,39.905'],
        avoidroad: '朝阳路',
        avoidpolygons: '116.2,39.8;116.21,39.81',
        plate: '京A12345',
        show_fields: 'cost,navi,polyline',
      })
    );
    expect(result).toMatchObject({
      count: 1,
      taxiCost: 18,
      routes: [
        {
          distance: 1200,
          duration: 800,
          tollCost: 6,
          restrictionCode: 1,
          restrictionInfo: '限行无法规避',
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

  it('calculateTransitRouteWithWebApi 会把公交结果映射为统一路线结构', async () => {
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

    const result = await calculateTransitRouteWithWebApi({
      type: 'transit' as any,
      from: { latitude: 39.9, longitude: 116.4 },
      to: { latitude: 39.95, longitude: 116.45 },
      city1: '北京',
      city2: '北京',
      alternativeRoute: 2,
    } as any);

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
});
