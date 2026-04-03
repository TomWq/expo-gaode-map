import type { Regeocode, RegeocodeResponse } from '../types/geocode.types';
import type { ClientConfig } from '../utils/client';
import {
  createWebGeocodeApiAdapter,
  type WebGeocodeApiAdapter,
} from './web-service-adapter';
import type { GeocodeProvider } from './contracts';
import type { Coordinates, ReverseGeocodeResult, SearchPOI } from './domain';

export interface WebGeocodeProviderFactoryOptions {
  api?: WebGeocodeApiAdapter;
  config?: ClientConfig;
}

function getApi(options: WebGeocodeProviderFactoryOptions = {}): WebGeocodeApiAdapter {
  if (options.api) {
    // 外部注入（测试或高级自定义）优先。
    return options.api;
  }

  // 默认走轻量 service adapter，避免依赖 legacy `GaodeWebAPI` class。
  return createWebGeocodeApiAdapter(options.config);
}

function parseLocation(location?: string): Coordinates | null {
  if (!location) {
    return null;
  }

  const [longitude, latitude] = location.split(',').map((value) => Number(value.trim()));
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function normalizePois(regeocode: Regeocode): SearchPOI[] {
  return (regeocode.pois ?? []).map((poi) => ({
    id: poi.id,
    name: poi.name,
    address: poi.address,
    location: parseLocation(poi.location),
    typeName: poi.type,
    distanceMeters: poi.distance ? Number(poi.distance) : undefined,
    source: 'web',
  }));
}

function toReverseGeocodeResult(
  response: RegeocodeResponse,
  location: Coordinates
): ReverseGeocodeResult {
  return {
    formattedAddress: response.regeocode?.formatted_address ?? '',
    location,
    pois: response.regeocode ? normalizePois(response.regeocode) : [],
    raw: response,
  };
}

export function createWebGeocodeProvider(
  options: WebGeocodeProviderFactoryOptions = {}
): GeocodeProvider {
  const api = getApi(options);

  return {
    kind: 'web-geocode',
    async reverseGeocode(params) {
      const response = await api.geocode.regeocode(params.location, {
        radius: params.radius,
        extensions: params.extensions ?? 'all',
      });

      return toReverseGeocodeResult(response, params.location);
    },
  };
}
