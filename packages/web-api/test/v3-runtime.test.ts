import { describe, expect, it, jest } from 'bun:test';

import {
  assembleRuntimeProviders,
  createCapabilityRuntime,
  GaodeProviderError,
  createGaodeRuntime,
  createRouteClient,
  createSearchClient,
  createWebCapabilityAdapter,
  createWebDataRuntime,
  createWebRuntime,
} from '../src/v3';

describe('v3 runtime', () => {
  it('createSearchClient should fallback to the next provider on failure', async () => {
    const first = {
      kind: 'native-search',
      searchKeyword: jest.fn().mockRejectedValue(new Error('native failed')),
      searchNearby: jest.fn(),
      getInputTips: jest.fn(),
    };
    const second = {
      kind: 'web-search',
      searchKeyword: jest.fn().mockResolvedValue({
        items: [{ name: 'Coffee', source: 'web' }],
        total: 1,
        page: 1,
        pageSize: 20,
        raw: {},
      }),
      searchNearby: jest.fn(),
      getInputTips: jest.fn(),
    };

    const onProviderError = jest.fn();
    const client = createSearchClient([first as any, second as any], {
      continueOnError: true,
      onProviderError,
    });

    const result = await client.searchKeyword({ keyword: 'coffee' });

    expect(result.items[0].name).toBe('Coffee');
    expect(onProviderError).toHaveBeenCalledTimes(1);
    expect(second.searchKeyword).toHaveBeenCalledTimes(1);
  });

  it('createSearchClient should throw when no provider supports an optional method', async () => {
    const client = createSearchClient(
      [
        {
          kind: 'native-search',
          searchKeyword: jest.fn(),
          searchNearby: jest.fn(),
          getInputTips: jest.fn(),
        } as any,
      ],
      { continueOnError: true }
    );

    await expect(
      client.searchPolygon({
        keyword: 'park',
        polygon: [
          { latitude: 39.9, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.4 },
          { latitude: 39.91, longitude: 116.41 },
        ],
      })
    ).rejects.toBeInstanceOf(GaodeProviderError);
  });

  it('createRouteClient should stop immediately when continueOnError is false', async () => {
    const first = {
      kind: 'web-route',
      calculateDrivingRoute: jest.fn().mockRejectedValue(new Error('route failed')),
    };
    const second = {
      kind: 'backup-route',
      calculateDrivingRoute: jest.fn().mockResolvedValue({}),
    };

    const client = createRouteClient([first as any, second as any], {
      continueOnError: false,
    });

    await expect(
      client.calculateDrivingRoute({
        origin: { latitude: 39.9, longitude: 116.4 },
        destination: { latitude: 39.91, longitude: 116.41 },
      })
    ).rejects.toBeInstanceOf(GaodeProviderError);

    expect(second.calculateDrivingRoute).not.toHaveBeenCalled();
  });

  it('createGaodeRuntime should expose composed clients', async () => {
    const runtime = createGaodeRuntime({
      continueOnError: true,
      searchProviders: [
        {
          kind: 'web-search',
          searchKeyword: jest.fn().mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            pageSize: 20,
            raw: {},
          }),
          searchNearby: jest.fn(),
          getInputTips: jest.fn(),
        } as any,
      ],
      geocodeProviders: [
        {
          kind: 'web-geocode',
          reverseGeocode: jest.fn().mockResolvedValue({
            formattedAddress: '北京市',
            location: { latitude: 39.9, longitude: 116.4 },
            pois: [],
            raw: {},
          }),
        } as any,
      ],
      routeProviders: [
        {
          kind: 'web-route',
          calculateDrivingRoute: jest.fn().mockResolvedValue({
            distanceMeters: 100,
            durationSeconds: 10,
            path: [],
            source: 'web',
            raw: {},
          }),
        } as any,
      ],
    });

    const geocode = await runtime.geocode.reverseGeocode({
      location: { latitude: 39.9, longitude: 116.4 },
    });
    const route = await runtime.route.calculateDrivingRoute({
      origin: { latitude: 39.9, longitude: 116.4 },
      destination: { latitude: 39.91, longitude: 116.41 },
    });

    expect(runtime.providers.search).toHaveLength(1);
    expect(geocode.formattedAddress).toBe('北京市');
    expect(route.durationSeconds).toBe(10);
  });

  it('createWebDataRuntime should compose search and geocode providers only', () => {
    const api = {
      poi: {
        search: jest.fn(),
        searchAround: jest.fn(),
        searchPolygon: jest.fn(),
        getDetail: jest.fn(),
      },
      inputTips: {
        getTips: jest.fn(),
      },
      geocode: {
        regeocode: jest.fn(),
      },
    };

    const runtime = createWebDataRuntime({
      search: { api: api as any },
      geocode: { api: api as any },
    });

    expect(runtime.providers.search).toHaveLength(1);
    expect(runtime.providers.geocode).toHaveLength(1);
    expect(runtime.providers.route).toHaveLength(0);
  });

  it('createWebRuntime should register a route provider', () => {
    const api = {
      poi: {
        search: jest.fn(),
        searchAround: jest.fn(),
        searchPolygon: jest.fn(),
        getDetail: jest.fn(),
      },
      inputTips: {
        getTips: jest.fn(),
      },
      geocode: {
        regeocode: jest.fn(),
      },
      route: {
        driving: jest.fn(),
        walking: jest.fn(),
        bicycling: jest.fn(),
        electricBike: jest.fn(),
        transit: jest.fn(),
      },
    };

    const runtime = createWebRuntime({
      search: { api: api as any },
      geocode: { api: api as any },
      route: { api: api as any },
    });

    expect(runtime.providers.search).toHaveLength(1);
    expect(runtime.providers.geocode).toHaveLength(1);
    expect(runtime.providers.route).toHaveLength(1);
  });

  it('assembleRuntimeProviders should honor priority and dedupe provider kind', () => {
    const providers = assembleRuntimeProviders({
      adapters: [
        {
          source: 'low-priority',
          priority: 10,
          searchProviders: [{ kind: 'shared-search' } as any],
        },
        {
          source: 'high-priority',
          priority: 0,
          searchProviders: [
            { kind: 'shared-search' } as any,
            { kind: 'backup-search' } as any,
          ],
        },
      ],
      dedupeByKind: true,
    });

    expect(providers.searchProviders.map((provider) => provider.kind)).toEqual([
      'shared-search',
      'backup-search',
    ]);
  });

  it('createCapabilityRuntime should compose adapters into runtime providers', () => {
    const api = {
      poi: {
        search: jest.fn(),
        searchAround: jest.fn(),
        searchPolygon: jest.fn(),
        getDetail: jest.fn(),
      },
      inputTips: {
        getTips: jest.fn(),
      },
      geocode: {
        regeocode: jest.fn(),
      },
      route: {
        driving: jest.fn(),
        walking: jest.fn(),
        bicycling: jest.fn(),
        electricBike: jest.fn(),
        transit: jest.fn(),
      },
    };

    const runtime = createCapabilityRuntime({
      adapters: [
        createWebCapabilityAdapter({
          source: 'web-main',
          search: { api: api as any },
          geocode: { api: api as any },
          route: { api: api as any },
        }),
      ],
      dedupeByKind: true,
    });

    expect(runtime.providers.search).toHaveLength(1);
    expect(runtime.providers.geocode).toHaveLength(1);
    expect(runtime.providers.route).toHaveLength(1);
  });
});
