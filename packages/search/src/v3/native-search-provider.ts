import ExpoGaodeMapSearchModule from '../ExpoGaodeMapSearchModule';
import type {
  Coordinates as NativeCoordinates,
  InputTip,
  POI,
  ReGeocodeResult as NativeReGeocodeResult,
  SearchResult,
} from '../ExpoGaodeMapSearch.types';
import type {
  GeocodeProvider,
  InputTipsParams,
  SearchProvider,
} from './contracts';
import type {
  Coordinates,
  ReverseGeocodeResult,
  SearchPOI,
  SearchPage,
  SearchSuggestion,
} from './domain';

function toCoordinates(location?: NativeCoordinates): Coordinates | null {
  if (!location) {
    return null;
  }

  return {
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

function toSearchPoi(poi: POI): SearchPOI {
  return {
    id: poi.id,
    name: poi.name,
    address: poi.address,
    location: toCoordinates(poi.location),
    typeCode: poi.typeCode,
    typeName: poi.typeDes,
    distanceMeters: poi.distance,
    cityCode: poi.cityCode,
    cityName: poi.cityName,
    districtCode: poi.adCode,
    districtName: poi.adName,
    provinceName: poi.provinceName,
    source: 'native',
  };
}

function toSearchSuggestion(tip: InputTip): SearchSuggestion {
  return {
    id: tip.id,
    name: tip.name,
    address: tip.address,
    location: toCoordinates(tip.location),
    districtName: tip.adName,
    cityName: tip.cityName,
    typeCode: tip.typeCode,
    source: 'native',
  };
}

function toSearchPage(result: SearchResult): SearchPage<SearchPOI> {
  return {
    items: result.pois.map(toSearchPoi),
    total: result.total,
    page: result.pageNum,
    pageSize: result.pageSize,
    raw: result,
  };
}

function toReverseGeocodeResult(result: NativeReGeocodeResult, location: Coordinates): ReverseGeocodeResult {
  return {
    formattedAddress: result.formattedAddress,
    location,
    pois: result.pois.map(toSearchPoi),
    raw: result,
  };
}

export function createNativeSearchProvider(): SearchProvider {
  return {
    kind: 'native-search',
    async searchKeyword(params) {
      const result = await ExpoGaodeMapSearchModule.searchPOI({
        keyword: params.keyword,
        city: params.city,
        types: params.types,
        pageNum: params.page,
        pageSize: params.pageSize,
        center: params.location,
      });
      return toSearchPage(result);
    },
    async searchNearby(params) {
      const result = await ExpoGaodeMapSearchModule.searchNearby({
        keyword: params.keyword,
        center: params.center,
        radius: params.radius,
        types: params.types,
        pageNum: params.page,
        pageSize: params.pageSize,
      });
      return toSearchPage(result);
    },
    async searchAlong(params) {
      const result = await ExpoGaodeMapSearchModule.searchAlong({
        keyword: params.keyword,
        polyline: params.polyline,
        range: params.range,
      });
      return toSearchPage(result);
    },
    async searchPolygon(params) {
      const result = await ExpoGaodeMapSearchModule.searchPolygon({
        keyword: params.keyword,
        polygon: params.polygon,
        pageNum: params.page,
        pageSize: params.pageSize,
      });
      return toSearchPage(result);
    },
    async getInputTips(params: InputTipsParams) {
      const result = await ExpoGaodeMapSearchModule.getInputTips({
        keyword: params.keyword,
        city: params.city,
      });

      return {
        items: result.tips.map(toSearchSuggestion),
        total: result.tips.length,
        page: null,
        pageSize: null,
        raw: result,
      };
    },
    async getPoiDetail(id: string) {
      const poi = await ExpoGaodeMapSearchModule.getPoiDetail(id);
      return poi ? toSearchPoi(poi) : null;
    },
  };
}

export function createNativeGeocodeProvider(): GeocodeProvider {
  return {
    kind: 'native-geocode',
    async reverseGeocode(params) {
      const result = await ExpoGaodeMapSearchModule.reGeocode({
        location: params.location,
        radius: params.radius,
        requireExtension: params.extensions === 'all',
      });

      return toReverseGeocodeResult(result, params.location);
    },
  };
}
