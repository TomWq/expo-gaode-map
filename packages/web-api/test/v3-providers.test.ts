import { describe, expect, it, jest } from 'bun:test';

import { createWebGeocodeProvider, createWebRouteProvider, createWebSearchProvider } from '../src/v3';

describe('v3 providers', () => {
  it('createWebSearchProvider should normalize POI search and input tips', async () => {
    const api = {
      poi: {
        search: jest.fn().mockResolvedValue({
          count: '1',
          pois: [
            {
              id: 'poi-1',
              name: 'Coffee Shop',
              type: '餐饮服务',
              typecode: '050000',
              address: 'Chaoyang',
              location: '116.4,39.9',
              distance: '12',
              cityname: '北京',
              citycode: '010',
              adname: '朝阳区',
              adcode: '110105',
              pname: '北京市',
            },
          ],
        }),
        searchAround: jest.fn().mockResolvedValue({
          count: '0',
          pois: [],
        }),
        searchPolygon: jest.fn().mockResolvedValue({
          count: '0',
          pois: [],
        }),
        getDetail: jest.fn().mockResolvedValue({
          pois: [],
        }),
      },
      inputTips: {
        getTips: jest.fn().mockResolvedValue({
          count: '1',
          tips: [
            {
              id: 'tip-1',
              name: 'Coffee',
              district: '朝阳区',
              adcode: '110105',
              location: '116.41,39.91',
              address: 'Somewhere',
              typecode: '050000',
            },
          ],
        }),
      },
    };

    const provider = createWebSearchProvider({ api: api as any });
    const keywordResult = await provider.searchKeyword({ keyword: 'coffee', city: '北京' });
    const tipsResult = await provider.getInputTips({ keyword: 'cof' });

    expect(keywordResult.items[0]).toEqual({
      id: 'poi-1',
      name: 'Coffee Shop',
      address: 'Chaoyang',
      location: {
        latitude: 39.9,
        longitude: 116.4,
      },
      typeCode: '050000',
      typeName: '餐饮服务',
      distanceMeters: 12,
      cityCode: '010',
      cityName: '北京',
      districtCode: '110105',
      districtName: '朝阳区',
      provinceName: '北京市',
      source: 'web',
    });
    expect(tipsResult.items[0]).toEqual({
      id: 'tip-1',
      name: 'Coffee',
      address: 'Somewhere',
      location: {
        latitude: 39.91,
        longitude: 116.41,
      },
      districtName: '朝阳区',
      typeCode: '050000',
      source: 'web',
    });
  });

  it('createWebGeocodeProvider should normalize reverse geocode results', async () => {
    const api = {
      geocode: {
        regeocode: jest.fn().mockResolvedValue({
          regeocode: {
            formatted_address: '北京市朝阳区',
            pois: [
              {
                id: 'poi-1',
                name: 'Office',
                type: '商务住宅',
                address: '望京',
                location: '116.5,39.99',
                distance: '30',
              },
            ],
          },
        }),
      },
    };

    const provider = createWebGeocodeProvider({ api: api as any });
    const result = await provider.reverseGeocode({
      location: { latitude: 39.99, longitude: 116.5 },
      radius: 1000,
      extensions: 'all',
    });

    expect(result.formattedAddress).toBe('北京市朝阳区');
    expect(result.pois[0]).toEqual({
      id: 'poi-1',
      name: 'Office',
      address: '望京',
      location: {
        latitude: 39.99,
        longitude: 116.5,
      },
      typeName: '商务住宅',
      distanceMeters: 30,
      source: 'web',
    });
  });

  it('createWebRouteProvider should normalize driving and transit routes', async () => {
    const api = {
      route: {
        driving: jest.fn().mockResolvedValue({
          route: {
            paths: [
              {
                distance: '1200',
                duration: '300',
                cost: { duration: '320' },
                steps: [
                  { polyline: '116.4,39.9;116.41,39.91' },
                ],
              },
            ],
          },
        }),
        walking: jest.fn(),
        bicycling: jest.fn(),
        electricBike: jest.fn(),
        transit: jest.fn().mockResolvedValue({
          route: {
            transits: [
              {
                distance: '5000',
                cost: { duration: '1800' },
                segments: [
                  {
                    walking: {
                      steps: [{ polyline: '116.4,39.9;116.41,39.91' }],
                    },
                    bus: {
                      buslines: [{ polyline: '116.41,39.91;116.42,39.92' }],
                    },
                  },
                ],
              },
            ],
          },
        }),
      },
    };

    const provider = createWebRouteProvider({ api: api as any });
    const driving = await provider.calculateDrivingRoute({
      origin: { latitude: 39.9, longitude: 116.4 },
      destination: { latitude: 39.91, longitude: 116.41 },
    });
    const transit = await provider.calculateTransitRoutes?.({
      origin: { latitude: 39.9, longitude: 116.4 },
      destination: { latitude: 39.92, longitude: 116.42 },
      city1: '010',
      city2: '010',
    });

    expect(driving.distanceMeters).toBe(1200);
    expect(driving.durationSeconds).toBe(320);
    expect(driving.path).toEqual([
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.91, longitude: 116.41 },
    ]);
    expect(transit?.[0].path).toEqual([
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.91, longitude: 116.41 },
      { latitude: 39.92, longitude: 116.42 },
    ]);
  });
});
