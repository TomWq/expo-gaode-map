import { describe, expect, test } from 'bun:test';

import {
  extractAOIBoundary,
  extractRoutePoints,
  extractTransitRoutePoints,
  normalizeDrivingRoute,
} from '../src/utils/normalizers';

describe('normalizers', () => {
  test('extractRoutePoints should flatten route steps', () => {
    const points = extractRoutePoints({
      status: '1',
      info: 'OK',
      infocode: '10000',
      count: '1',
      route: {
        origin: '116.1,39.1',
        destination: '116.2,39.2',
        paths: [
          {
            distance: '100',
            steps: [
              { instruction: 'A', step_distance: '50', polyline: '116.1,39.1;116.15,39.15' },
              { instruction: 'B', step_distance: '50', polyline: '116.15,39.15;116.2,39.2' },
            ],
          },
        ],
      },
    } as any);

    expect(points).toEqual([
      { latitude: 39.1, longitude: 116.1 },
      { latitude: 39.15, longitude: 116.15 },
      { latitude: 39.2, longitude: 116.2 },
    ]);
  });

  test('normalizeDrivingRoute should return summary fields', () => {
    const result = normalizeDrivingRoute({
      status: '1',
      info: 'OK',
      infocode: '10000',
      count: '1',
      route: {
        origin: '116.1,39.1',
        destination: '116.2,39.2',
        taxi_cost: '18.5',
        paths: [
          {
            distance: '100',
            duration: '30',
            steps: [{ instruction: 'A', step_distance: '100', polyline: '116.1,39.1;116.2,39.2' }],
          },
        ],
      },
    } as any);

    expect(result).toEqual({
      distance: 100,
      duration: 30,
      taxiCost: 18.5,
      points: [
        { latitude: 39.1, longitude: 116.1 },
        { latitude: 39.2, longitude: 116.2 },
      ],
    });
  });

  test('extractAOIBoundary should support multi ring polygons', () => {
    const result = extractAOIBoundary({
      status: '1',
      info: 'OK',
      infocode: '10000',
      aois: {
        id: 'a1',
        name: 'AOI',
        polyline: '116.1,39.1;116.2,39.2|116.15,39.15;116.16,39.16',
      },
    } as any);

    expect(result.id).toBe('a1');
    expect(result.rings).toHaveLength(2);
  });

  test('extractTransitRoutePoints should flatten walking and bus segments', () => {
    const result = extractTransitRoutePoints({
      status: '1',
      info: 'OK',
      infocode: '10000',
      count: '1',
      route: {
        origin: '116.1,39.1',
        destination: '116.2,39.2',
        transits: [
          {
            distance: '100',
            cost: { duration: '50' },
            nightflag: '0',
            walking_distance: '20',
            segments: [
              {
                walking: {
                  origin: '116.1,39.1',
                  destination: '116.15,39.15',
                  distance: '20',
                  duration: '10',
                  steps: [
                    { instruction: 'walk', step_distance: '20', polyline: '116.1,39.1;116.15,39.15' },
                  ],
                },
              },
              {
                bus: {
                  buslines: [
                    {
                      name: 'Line 1',
                      id: 'b1',
                      type: 'bus',
                      departure_stop: { name: 'A', location: '116.15,39.15' },
                      arrival_stop: { name: 'B', location: '116.2,39.2' },
                      via_num: '1',
                      cost: '2',
                      distance: '80',
                      duration: '40',
                      polyline: '116.15,39.15;116.2,39.2',
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    } as any);

    expect(result[0]).toEqual([
      { latitude: 39.1, longitude: 116.1 },
      { latitude: 39.15, longitude: 116.15 },
      { latitude: 39.2, longitude: 116.2 },
    ]);
  });
});
