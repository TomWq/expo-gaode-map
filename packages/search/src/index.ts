import ExpoGaodeMapSearchModule from './ExpoGaodeMapSearchModule';
export * as V3 from './v3';
export { GaodeSearchError } from './search-error';
export type { SearchErrorType, SearchUnifiedError } from './search-error';
import {
  createNativeGeocodeProvider,
  createNativeSearchProvider,
} from './v3/native-search-provider';
export {
  createNativeGeocodeProvider,
  createNativeSearchProvider,
} from './v3/native-search-provider';
import {
  createNativeSearchCapabilityAdapter,
  createNativeSearchRuntime,
} from './v3/runtime-factories';
export {
  createNativeSearchCapabilityAdapter,
  createNativeSearchRuntime,
} from './v3/runtime-factories';
import { createNativeSearchRuntime as createNativeSearchRuntimeFactory } from './v3/runtime-factories';
export type {
  NativeSearchCapabilityAdapterOptions,
  NativeSearchRuntimeOptions,
} from './v3/runtime-factories';
import type {
  Coordinates,
  POI,
  POISearchOptions,
  NearbySearchOptions,
  AlongSearchOptions,
  PolygonSearchOptions,
  InputTipsOptions,
  InputTip,
  SearchResult,
  InputTipsResult,
  ReGeocodeOptions,
  ReGeocodeResult,
  AddressComponent,
  Road,
  RoadCross,
  AOI,
  ReGeocodeResult as NativeReGeocodeResult,
  SearchResult as NativeSearchResult,
  InputTipsResult as NativeInputTipsResult,
} from './ExpoGaodeMapSearch.types';
import type {
  ReverseGeocodeResult as V3ReverseGeocodeResult,
  SearchPage as V3SearchPage,
  SearchPOI as V3SearchPOI,
  SearchSuggestion as V3SearchSuggestion,
} from './v3/domain';

let legacyRuntime: ReturnType<typeof createNativeSearchRuntimeFactory> | null = null;

function getLegacyRuntime(): ReturnType<typeof createNativeSearchRuntimeFactory> {
  if (!legacyRuntime) {
    legacyRuntime = createNativeSearchRuntimeFactory();
  }
  return legacyRuntime;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asNativeSearchResult(raw: unknown): NativeSearchResult | null {
  if (!isRecord(raw) || !Array.isArray(raw.pois)) {
    return null;
  }

  return raw as unknown as NativeSearchResult;
}

function asNativeInputTipsResult(raw: unknown): NativeInputTipsResult | null {
  if (!isRecord(raw) || !Array.isArray(raw.tips)) {
    return null;
  }

  return raw as unknown as NativeInputTipsResult;
}

function asNativeReGeocodeResult(raw: unknown): NativeReGeocodeResult | null {
  if (!isRecord(raw) || typeof raw.formattedAddress !== 'string') {
    return null;
  }

  return raw as unknown as NativeReGeocodeResult;
}

function toLegacyPOI(poi: V3SearchPOI): POI {
  return {
    id: poi.id ?? '',
    name: poi.name,
    address: poi.address ?? '',
    location: poi.location ?? { latitude: 0, longitude: 0 },
    typeCode: poi.typeCode ?? '',
    typeDes: poi.typeName ?? '',
    distance: poi.distanceMeters,
    cityName: poi.cityName,
    cityCode: poi.cityCode,
    provinceName: poi.provinceName,
    adName: poi.districtName,
    adCode: poi.districtCode,
  };
}

function toLegacySearchResult(page: V3SearchPage<V3SearchPOI>): SearchResult {
  const total = page.total ?? page.items.length;
  const pageNum = page.page ?? 1;
  const pageSize = page.pageSize ?? Math.max(page.items.length, 1);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return {
    pois: page.items.map(toLegacyPOI),
    total,
    pageNum,
    pageSize,
    pageCount,
  };
}

function toLegacyInputTip(item: V3SearchSuggestion): InputTip {
  return {
    id: item.id ?? '',
    name: item.name,
    address: item.address ?? '',
    location: item.location ?? undefined,
    typeCode: item.typeCode,
    cityName: item.cityName,
    adName: item.districtName,
  };
}

function toLegacyInputTipsResult(
  page: V3SearchPage<V3SearchSuggestion>
): InputTipsResult {
  return {
    tips: page.items.map(toLegacyInputTip),
  };
}

function createEmptyAddressComponent(): AddressComponent {
  return {
    province: '',
    city: '',
    district: '',
    township: '',
    neighborhood: '',
    building: '',
    cityCode: '',
    adCode: '',
    streetNumber: {
      street: '',
      number: '',
      direction: '',
      distance: 0,
    },
    businessAreas: [],
  };
}

function toLegacyReGeocodeResult(result: V3ReverseGeocodeResult): ReGeocodeResult {
  return {
    formattedAddress: result.formattedAddress,
    addressComponent: createEmptyAddressComponent(),
    pois: result.pois.map(toLegacyPOI),
    roads: [] as Road[],
    roadCrosses: [] as RoadCross[],
    aois: [] as AOI[],
  };
}

/**
 * 初始化搜索模块（可选）
 *
 * 如果 API Key 已通过以下方式设置，则无需调用此方法：
 * 1. app.json 的 plugins 中配置了 iosKey（推荐）
 * 2. 调用了 ExpoGaodeMap.initSDK()
 * 3. 在 AppDelegate 中手动设置
 *
 * 此方法会在首次调用搜索功能时自动执行，手动调用可以提前检测配置问题。
 *
 * @example
 * ```typescript
 * import { initSearch } from '@expo-gaode-map/search';
 *
 * // 可选：提前初始化以检测问题
 * initSearch();
 * ```
 *
 * @deprecated 建议迁移到 v3 provider/runtime：`createNativeSearchProvider` 或 `createNativeSearchRuntime`
 */
export function initSearch(): void {
  ExpoGaodeMapSearchModule.initSearch();
}

/**
 * POI 搜索
 * 
 * @param options 搜索选项
 * @returns 搜索结果
 * 
 * @example
 * ```typescript
 * const result = await searchPOI({
 *   keyword: '酒店',
 *   city: '北京',
 *   pageSize: 20,
 *   pageNum: 1,
 * });
 * console.log('找到', result.total, '个结果');
 * result.pois.forEach(poi => {
 *   console.log(poi.name, poi.address);
 * });
 * ```
 *
 * @deprecated 建议迁移到 v3 provider/runtime：`createNativeSearchProvider` 或 `createNativeSearchRuntime`
 */
export async function searchPOI(options: POISearchOptions): Promise<SearchResult> {
  const runtime = getLegacyRuntime();
  const page = await runtime.search.searchKeyword({
    keyword: options.keyword,
    city: options.city,
    types: options.types,
    page: options.pageNum,
    pageSize: options.pageSize,
    location: options.center,
  });
  return asNativeSearchResult(page.raw) ?? toLegacySearchResult(page);
}

/**
 * 周边搜索
 * 
 * @param options 搜索选项
 * @returns 搜索结果
 * 
 * @example
 * ```typescript
 * const result = await searchNearby({
 *   keyword: '餐厅',
 *   center: { latitude: 39.9, longitude: 116.4 },
 *   radius: 1000,
 * });
 * ```
 *
 * @deprecated 建议迁移到 v3 provider/runtime：`createNativeSearchProvider` 或 `createNativeSearchRuntime`
 */
export async function searchNearby(options: NearbySearchOptions): Promise<SearchResult> {
  const runtime = getLegacyRuntime();
  const page = await runtime.search.searchNearby({
    keyword: options.keyword,
    center: options.center,
    radius: options.radius,
    types: options.types,
    page: options.pageNum,
    pageSize: options.pageSize,
  });
  return asNativeSearchResult(page.raw) ?? toLegacySearchResult(page);
}

/**
 * 沿途搜索
 * 
 * @param options 搜索选项
 * @returns 搜索结果
 * 
 * @example
 * ```typescript
 * const result = await searchAlong({
 *   keyword: '加油站',
 *   polyline: [
 *     { latitude: 39.9, longitude: 116.4 },
 *     { latitude: 39.91, longitude: 116.41 },
 *   ],
 *   range: 500,
 * });
 * ```
 *
 * @deprecated 建议迁移到 v3 provider/runtime：`createNativeSearchProvider` 或 `createNativeSearchRuntime`
 */
export async function searchAlong(options: AlongSearchOptions): Promise<SearchResult> {
  const runtime = getLegacyRuntime();
  const page = await runtime.search.searchAlong({
    keyword: options.keyword,
    polyline: options.polyline,
    range: options.range,
    page: undefined,
    pageSize: undefined,
  });
  return asNativeSearchResult(page.raw) ?? toLegacySearchResult(page);
}

/**
 * 多边形搜索
 * 
 * @param options 搜索选项
 * @returns 搜索结果
 * 
 * @example
 * ```typescript
 * const result = await searchPolygon({
 *   keyword: '学校',
 *   polygon: [
 *     { latitude: 39.9, longitude: 116.4 },
 *     { latitude: 39.91, longitude: 116.4 },
 *     { latitude: 39.91, longitude: 116.41 },
 *   ],
 * });
 * ```
 *
 * @deprecated 建议迁移到 v3 provider/runtime：`createNativeSearchProvider` 或 `createNativeSearchRuntime`
 */
export async function searchPolygon(options: PolygonSearchOptions): Promise<SearchResult> {
  const runtime = getLegacyRuntime();
  const page = await runtime.search.searchPolygon({
    keyword: options.keyword,
    polygon: options.polygon,
    types: options.types,
    page: options.pageNum,
    pageSize: options.pageSize,
  });
  return asNativeSearchResult(page.raw) ?? toLegacySearchResult(page);
}

/**
 * 输入提示
 * 
 * @param options 搜索选项
 * @returns 提示结果
 * 
 * @example
 * ```typescript
 * const result = await getInputTips({
 *   keyword: '天安门',
 *   city: '北京',
 * });
 * result.tips.forEach(tip => {
 *   console.log(tip.name, tip.address);
 * });
 * ```
 *
 * @deprecated 建议迁移到 v3 provider/runtime：`createNativeSearchProvider` 或 `createNativeSearchRuntime`
 */
export async function getInputTips(options: InputTipsOptions): Promise<InputTipsResult> {
  const runtime = getLegacyRuntime();
  const page = await runtime.search.getInputTips({
    keyword: options.keyword,
    city: options.city,
    types: options.types,
  });
  return asNativeInputTipsResult(page.raw) ?? toLegacyInputTipsResult(page);
}

/**
 * 逆地理编码（坐标转地址）
 * 
 * @param options 逆地理编码选项
 * @returns 逆地理编码结果
 * 
 * @example
 * ```typescript
 * const result = await reGeocode({
 *   location: { latitude: 39.9, longitude: 116.4 },
 *   radius: 1000,
 * });
 * console.log(result.formattedAddress);
 * ```
 *
 * @deprecated 建议迁移到 v3 provider/runtime：`createNativeGeocodeProvider` 或 `createNativeSearchRuntime`
 */
export async function reGeocode(options: ReGeocodeOptions): Promise<ReGeocodeResult> {
  const runtime = getLegacyRuntime();
  const result = await runtime.geocode.reverseGeocode({
    location: options.location,
    radius: options.radius,
    extensions: options.requireExtension ? 'all' : 'base',
  });
  return asNativeReGeocodeResult(result.raw) ?? toLegacyReGeocodeResult(result);
}

/**
 * POI 详情查询
 * 
 * @param id POI ID
 * @returns POI 详情
 * 
 * @example
 * ```typescript
 * const poi = await getPoiDetail('B000A83M61');
 * console.log(poi.name, poi.address);
 * ```
 *
 * @deprecated 建议迁移到 v3 provider/runtime：`createNativeSearchProvider` 或 `createNativeSearchRuntime`
 */
export async function getPoiDetail(id: string): Promise<POI> {
  const runtime = getLegacyRuntime();
  const poi = await runtime.search.getPoiDetail(id);
  if (poi) {
    return toLegacyPOI(poi);
  }
  return await ExpoGaodeMapSearchModule.getPoiDetail(id);
}

// 导出类型和枚举
export type {
  Coordinates,
  POI,
  POISearchOptions,
  NearbySearchOptions,
  AlongSearchOptions,
  PolygonSearchOptions,
  InputTipsOptions,
  InputTip,
  SearchResult,
  InputTipsResult,
  ReGeocodeOptions,
  ReGeocodeResult,
  AddressComponent,
  Road,
  RoadCross,
  AOI,
};

export { SearchType } from './ExpoGaodeMapSearch.types';

/**
 * Legacy 函数式 API 兼容层。
 * @deprecated 建议迁移到 v3 provider/runtime：`createNativeSearchRuntime`
 */
export const LegacySearch = {
  initSearch,
  searchPOI,
  searchNearby,
  searchAlong,
  searchPolygon,
  getInputTips,
  reGeocode,
  getPoiDetail,
};

/**
 * @deprecated 建议迁移到 v3 provider/runtime：`createNativeSearchRuntime`
 */
export type LegacySearchAPI = typeof LegacySearch;

/**
 * v3 provider/runtime API 聚合导出。
 */
export const V3Search = {
  createNativeSearchProvider,
  createNativeGeocodeProvider,
  createNativeSearchCapabilityAdapter,
  createNativeSearchRuntime,
};

/**
 * 兼容默认导出（legacy 函数式 API）。
 */
export default LegacySearch;
