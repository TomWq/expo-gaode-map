import {
  fitCameraToCoordinates,
  getRouteBounds,
  parseMultiRingPolyline,
} from '../RouteUtils';

describe('RouteUtils', () => {
  it('getRouteBounds 应返回中心点、边界和推荐缩放', () => {
    const result = getRouteBounds([
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.91, longitude: 116.42 },
    ]);

    expect(result).toEqual(
      expect.objectContaining({
        center: {
          latitude: 39.905,
          longitude: 116.41,
        },
        bounds: {
          north: 39.91,
          south: 39.9,
          east: 116.42,
          west: 116.4,
        },
      })
    );
    expect(result?.recommendedZoom).toBeGreaterThan(0);
  });

  it('parseMultiRingPolyline 应支持多环', () => {
    const result = parseMultiRingPolyline(
      '116.1,39.1;116.2,39.2|116.15,39.15;116.16,39.16'
    );

    expect(result.rings).toHaveLength(2);
    expect(result.rings[0][0]).toEqual({ latitude: 39.1, longitude: 116.1 });
    expect(result.bounds).toEqual({
      southwest: { latitude: 39.1, longitude: 116.1 },
      northeast: { latitude: 39.2, longitude: 116.2 },
    });
  });

  it('fitCameraToCoordinates 应基于点集更新相机', async () => {
    const moveCamera = jest.fn(() => Promise.resolve());
    const getCameraPosition = jest.fn(() => Promise.resolve({ zoom: 10, bearing: 30, tilt: 15 }));

    await fitCameraToCoordinates(
      { moveCamera, getCameraPosition },
      [
        { latitude: 39.9, longitude: 116.4 },
        { latitude: 39.91, longitude: 116.42 },
      ],
      { duration: 300 }
    );

    expect(moveCamera).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          latitude: 39.905,
          longitude: 116.41,
        }),
        bearing: 30,
        tilt: 15,
      }),
      300
    );
  });
});
