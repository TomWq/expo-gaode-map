/**
 * 高德地图 Web API - POI 搜索服务
 */

import { GaodeWebAPIClient } from '../utils/client';
import type {
  POISearchParams,
  POIAroundParams,
  POIPolygonParams,
  POIDetailParams,
  POISearchResponse,
} from '../types/poi.types';

/**
 * POI 搜索服务
 */
export class POIService {
  constructor(private client: GaodeWebAPIClient) {}

  /**
   * 关键字搜索
   * 根据关键字搜索POI
   *
   * @param keywords 查询关键字（keywords 或 types 二选一必填）
   * @param options 可选参数
   * @returns POI 搜索结果
   *
   * @example
   * ```typescript
   * // 基础搜索
   * const result = await poi.search('肯德基', { region: '北京市' });
   *
   * // 限制城市
   * const result = await poi.search('肯德基', {
   *   region: '北京市',
   *   city_limit: true,
   *   page_size: 20,
   *   page_num: 1
   * });
   *
   * // 指定类型搜索
   * const result = await poi.search('', {
   *   types: '050000',  // 餐饮服务
   *   region: '北京市',
   *   show_fields: 'children,business,photos'
   * });
   * ```
   */
  async search(
    keywords?: string,
    options?: Omit<POISearchParams, 'keywords'>
  ): Promise<POISearchResponse> {
    const params: POISearchParams = {
      keywords,
      ...options,
    };

    return this.client.request<POISearchResponse>('/v5/place/text', params);
  }

  /**
   * 周边搜索
   * 搜索指定位置周边的POI
   *
   * @param location 中心点坐标，格式：经度,纬度
   * @param options 可选参数
   * @returns POI 搜索结果
   *
   * @example
   * ```typescript
   * // 搜索周边所有POI
   * const result = await poi.searchAround('116.473168,39.993015', {
   *   radius: 1000
   * });
   *
   * // 搜索周边特定类型POI
   * const result = await poi.searchAround('116.473168,39.993015', {
   *   keywords: '餐厅',
   *   radius: 500,
   *   sortrule: 'distance'
   * });
   *
   * // 搜索周边肯德基
   * const result = await poi.searchAround('116.473168,39.993015', {
   *   keywords: '肯德基',
   *   types: '050301',  // 中餐厅
   *   radius: 2000,
   *   page_size: 10,
   *   show_fields: 'business,photos'
   * });
   * ```
   */
  async searchAround(
    location: string | { longitude: number; latitude: number },
    options?: Omit<POIAroundParams, 'location'>
  ): Promise<POISearchResponse> {
    // 处理坐标参数
    let locationStr: string;
    if (typeof location === 'string') {
      locationStr = location;
    } else {
      locationStr = `${location.longitude},${location.latitude}`;
    }

    const params: POIAroundParams = {
      location: locationStr,
      ...options,
    };

    return this.client.request<POISearchResponse>('/v5/place/around', params);
  }

  /**
   * 多边形搜索
   * 搜索指定多边形区域内的POI
   * 
   * @param polygon 多边形坐标，格式：经度1,纬度1|经度2,纬度2|...
   * @param options 可选参数
   * @returns POI 搜索结果
   * 
   * @example
   * ```typescript
   * const result = await poi.searchPolygon(
   *   '116.460656,39.996059|116.469543,39.996059|116.469543,39.989723',
   *   {
   *     keywords: '酒店',
   *     offset: 20
   *   }
   * );
   * ```
   */
  async searchPolygon(
    polygon: string,
    options?: Omit<POIPolygonParams, 'polygon'>
  ): Promise<POISearchResponse> {
    const params: POIPolygonParams = {
      polygon,
      ...options,
    };

    return this.client.request<POISearchResponse>('/v5/place/polygon', params);
  }

  /**
   * POI详情查询
   * 根据POI ID查询详细信息
   *
   * @param id POI ID（最多可以传入10个 id，多个 id 之间用"|"分隔）
   * @param show_fields 返回结果控制，可选值：children, business, indoor, navi, photos
   * @returns POI 详情
   *
   * @example
   * ```typescript
   * // 单个POI详情
   * const result = await poi.getDetail('B000A8VE1H', 'business,photos');
   * console.log(result.pois[0].name);
   *
   * // 批量查询（最多10个）
   * const result = await poi.getDetail('B000A8VE1H|B0FFKEPXS2', 'business,photos');
   * ```
   */
  async getDetail(
    id: string,
    show_fields?: string
  ): Promise<POISearchResponse> {
    const params: POIDetailParams = {
      id,
      show_fields,
    };

    return this.client.request<POISearchResponse>('/v5/place/detail', params);
  }

  /**
   * 批量查询POI详情
   *
   * @param ids POI ID列表（最多10个）
   * @param show_fields 返回结果控制
   * @returns POI 详情列表
   *
   * @example
   * ```typescript
   * const result = await poi.batchGetDetail([
   *   'B000A8VE1H',
   *   'B000A8VE2I'
   * ], 'business,photos');
   * ```
   */
  async batchGetDetail(
    ids: string[],
    show_fields?: string
  ): Promise<POISearchResponse> {
    if (ids.length > 10) {
      throw new Error('批量查询最多支持10个POI ID');
    }

    const params: POIDetailParams = {
      id: ids.join('|'),
      show_fields,
    };

    return this.client.request<POISearchResponse>('/v5/place/detail', params);
  }
}