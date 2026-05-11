import {
  buildAnchorWaypointsFromWebRoute,
  dedupeAdjacentPoints,
  normalizeWebRoutePolyline,
  parsePolyline,
} from '../route-geometry';

describe('route-geometry helpers', () => {
  const nativeMocks = (global as any).__navigationNativeMocks as {
    core: {
      distanceBetweenCoordinates: jest.Mock;
      simplifyPolyline: jest.Mock;
    };
  };

  const routePoints = [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.901, longitude: 116.401 },
    { latitude: 39.902, longitude: 116.402 },
    { latitude: 39.903, longitude: 116.403 },
  ];

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
  });

  it('parsePolyline 会跳过非法片段并保留有效坐标', () => {
    expect(parsePolyline('116.4,39.9; invalid ; 116.5,39.95')).toEqual([
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.95, longitude: 116.5 },
    ]);
  });

  it('normalizeWebRoutePolyline 会优先使用主折线，必要时回退到 steps', () => {
    expect(
      normalizeWebRoutePolyline({
        polyline: [
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.41 },
        ],
      })
    ).toEqual([
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.91, longitude: 116.41 },
    ]);

    expect(
      normalizeWebRoutePolyline({
        polyline: [],
        steps: [
          {
            polyline: [
              { latitude: 39.9, longitude: 116.4 },
              { latitude: 39.9, longitude: 116.4 },
            ],
          },
          {
            polyline: [
              { latitude: 39.91, longitude: 116.41 },
              { latitude: 39.92, longitude: 116.42 },
            ],
          },
        ],
      })
    ).toEqual([
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.91, longitude: 116.41 },
      { latitude: 39.92, longitude: 116.42 },
    ]);
  });

  it('buildAnchorWaypointsFromWebRoute 会保留间距足够的中间锚点', () => {
    expect(
      buildAnchorWaypointsFromWebRoute({
        webRoute: {
          polyline: routePoints,
        },
        minSpacingMeters: 800,
      })
    ).toEqual([
      { latitude: 39.901, longitude: 116.401 },
      { latitude: 39.902, longitude: 116.402 },
    ]);
  });

  it('dedupeAdjacentPoints 会去掉连续重复点', () => {
    expect(
      dedupeAdjacentPoints([
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.91, longitude: 116.41 },
        { latitude: 39.91, longitude: 116.41 },
      ])
    ).toEqual([
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.91, longitude: 116.41 },
    ]);
  });
});
