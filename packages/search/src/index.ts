import ExpoGaodeMapSearchModule from './ExpoGaodeMapSearchModule';
import type {
  SearchType,
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
} from './ExpoGaodeMapSearch.types';

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
 */
export async function searchPOI(options: POISearchOptions): Promise<SearchResult> {
  return await ExpoGaodeMapSearchModule.searchPOI(options);
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
 */
export async function searchNearby(options: NearbySearchOptions): Promise<SearchResult> {
  return await ExpoGaodeMapSearchModule.searchNearby(options);
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
 */
export async function searchAlong(options: AlongSearchOptions): Promise<SearchResult> {
  return await ExpoGaodeMapSearchModule.searchAlong(options);
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
 */
export async function searchPolygon(options: PolygonSearchOptions): Promise<SearchResult> {
  return await ExpoGaodeMapSearchModule.searchPolygon(options);
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
 */
export async function getInputTips(options: InputTipsOptions): Promise<InputTipsResult> {
  return await ExpoGaodeMapSearchModule.getInputTips(options);
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
 */
export async function reGeocode(options: ReGeocodeOptions): Promise<ReGeocodeResult> {
  return await ExpoGaodeMapSearchModule.reGeocode(options);
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
 */
export async function getPoiDetail(id: string): Promise<POI> {
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

// 默认导出
export default {
  initSearch,
  searchPOI,
  searchNearby,
  searchAlong,
  searchPolygon,
  getInputTips,
  reGeocode,
};