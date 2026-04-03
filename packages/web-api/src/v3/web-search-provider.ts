import type { ClientConfig } from '../utils/client';
import type { POIInfo, POISearchResponse } from '../types/poi.types';
import type { InputTip, InputTipsResponse } from '../types/inputtips.types';
import {
  createWebSearchApiAdapter,
  type WebSearchApiAdapter,
} from './web-service-adapter';
import type {
  InputTipsParams,
  SearchProvider,
} from './contracts';
import type {
  Coordinates,
  SearchPOI,
  SearchPage,
  SearchSuggestion,
} from './domain';

export interface WebProviderFactoryOptions {
  api?: WebSearchApiAdapter;
  config?: ClientConfig;
}

function getApi(options: WebProviderFactoryOptions = {}): WebSearchApiAdapter {
  if (options.api) {
    // 外部注入（测试或高级自定义）优先。
    return options.api;
  }

  // 默认走轻量 service adapter，避免依赖 legacy `GaodeWebAPI` class。
  return createWebSearchApiAdapter(options.config);
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

function toSearchPoi(poi: POIInfo): SearchPOI {
  return {
    id: poi.id,
    name: poi.name,
    address: poi.address,
    location: parseLocation(poi.location),
    typeCode: poi.typecode,
    typeName: poi.type,
    distanceMeters: poi.distance ? Number(poi.distance) : undefined,
    cityCode: poi.citycode,
    cityName: poi.cityname,
    districtCode: poi.adcode,
    districtName: poi.adname,
    provinceName: poi.pname,
    source: 'web',
  };
}

function toSearchSuggestion(tip: InputTip): SearchSuggestion {
  return {
    id: tip.id,
    name: tip.name,
    address: tip.address,
    location: parseLocation(tip.location),
    districtName: tip.district,
    typeCode: tip.typecode,
    source: 'web',
  };
}

function toSearchPage(response: POISearchResponse): SearchPage<SearchPOI> {
  return {
    items: response.pois.map(toSearchPoi),
    total: Number(response.count),
    page: null,
    pageSize: null,
    raw: response,
  };
}

function toInputTipsPage(response: InputTipsResponse): SearchPage<SearchSuggestion> {
  return {
    items: response.tips.map(toSearchSuggestion),
    total: Number(response.count),
    page: null,
    pageSize: null,
    raw: response,
  };
}

export function createWebSearchProvider(options: WebProviderFactoryOptions = {}): SearchProvider {
  const api = getApi(options);

  return {
    kind: 'web-search',
    async searchKeyword(params) {
      const response = await api.poi.search(params.keyword, {
        region: params.city,
        city_limit: params.cityLimit,
        types: params.types,
        page_num: params.page,
        page_size: params.pageSize,
      });
      return toSearchPage(response);
    },
    async searchNearby(params) {
      const response = await api.poi.searchAround(params.center, {
        keywords: params.keyword,
        radius: params.radius,
        types: params.types,
        page_num: params.page,
        page_size: params.pageSize,
        sortrule: 'distance',
      });
      return toSearchPage(response);
    },
    async searchPolygon(params) {
      const polygon = params.polygon
        .map((point) => `${point.longitude},${point.latitude}`)
        .join('|');
      const response = await api.poi.searchPolygon(polygon, {
        keywords: params.keyword,
        types: params.types,
        page_num: params.page,
        page_size: params.pageSize,
      });
      return toSearchPage(response);
    },
    async getInputTips(params: InputTipsParams) {
      const response = await api.inputTips.getTips(params.keyword, {
        city: params.city,
        type: params.types,
        datatype: params.datatype,
        citylimit: params.cityLimit,
        location: params.location
          ? `${params.location.longitude},${params.location.latitude}`
          : undefined,
      });
      return toInputTipsPage(response);
    },
    async getPoiDetail(id: string) {
      const response = await api.poi.getDetail(id);
      const [poi] = response.pois ?? [];
      return poi ? toSearchPoi(poi) : null;
    },
  };
}
