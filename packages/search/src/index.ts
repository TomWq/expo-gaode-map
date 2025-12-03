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
} from './ExpoGaodeMapSearch.types';

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
};

export { SearchType } from './ExpoGaodeMapSearch.types';

// 默认导出
export default {
  searchPOI,
  searchNearby,
  searchAlong,
  searchPolygon,
  getInputTips,
};