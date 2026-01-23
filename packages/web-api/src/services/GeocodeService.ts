/**
 * 高德地图 Web API - 地理编码服务
 */

import { GaodeWebAPIClient } from '../utils/client';
import type {
  RegeocodeParams,
  RegeocodeResponse,
  BatchRegeocodeResponse,
  GeocodeParams,
  GeocodeResponse,
} from '../types/geocode.types';
import { validateCoordinate, validateCoordinates } from '../utils/validators';

/**
 * 地理编码服务
 */
export class GeocodeService {
  constructor(private client: GaodeWebAPIClient) {}

  /**
   * 逆地理编码
   * 将经纬度坐标转换为地址信息
   * 
   * @param location 经纬度坐标，格式：经度,纬度 或 { longitude, latitude }
   * @param options 可选参数
   * @returns 地址信息
   * 
   * @example
   * ```typescript
   * // 方式1：使用字符串
   * const result = await geocode.regeocode('116.481028,39.989643');
   * 
   * // 方式2：使用对象
   * const result = await geocode.regeocode({
   *   longitude: 116.481028,
   *   latitude: 39.989643
   * });
   * 
   * // 方式3：带可选参数
   * const result = await geocode.regeocode('116.481028,39.989643', {
   *   extensions: 'all',
   *   radius: 1000
   * });
   * 
   * console.log(result.regeocode.formatted_address);
   * // 输出：北京市朝阳区阜通东大街6号
   * ```
   */
  async regeocode(
    location: string | { longitude: number; latitude: number },
    options?: Omit<RegeocodeParams, 'location'>
  ): Promise<RegeocodeResponse> {
    // 处理坐标参数
    let locationStr: string;
    if (typeof location === 'string') {
      locationStr = location;
    } else {
      locationStr = `${location.longitude},${location.latitude}`;
    }

    // 构建请求参数
    const { signal, ...rest } = options || {};
    const params: RegeocodeParams = {
      location: locationStr,
      ...rest,
    };

    // 校验坐标
    validateCoordinate(locationStr);

    // 发起请求
    return this.client.request<RegeocodeResponse>('/v3/geocode/regeo', { params, signal });
  }

  /**
   * 地理编码
   * 将地址转换为经纬度坐标
   * 
   * @param address 地址
   * @param city 可选，指定查询的城市
   * @returns 坐标信息
   * 
   * @example
   * ```typescript
   * // 基础用法
   * const result = await geocode.geocode('北京市朝阳区阜通东大街6号');
   * console.log(result.geocodes[0].location);
   * // 输出：116.481028,39.989643
   * 
   * // 指定城市
   * const result = await geocode.geocode('阜通东大街6号', '北京');
   * ```
   */
  async geocode(address: string, city?: string, options?: { signal?: AbortSignal }): Promise<GeocodeResponse> {
    const params: GeocodeParams = {
      address,
      city,
    };

    return this.client.request<GeocodeResponse>('/v3/geocode/geo', { params, signal: options?.signal });
  }

  /**
   * 批量逆地理编码
   * 
   * @param locations 坐标列表
   * @param options 可选参数
   * @returns 地址信息列表
   * 
   * @example
   * ```typescript
   * // 方式1：使用字符串数组
   * const result = await geocode.batchRegeocode([
   *   '116.481028,39.989643',
   *   '116.434446,39.90816'
   * ]);
   * ```
   */
  async batchRegeocode(
    locations: string[],
    options?: Omit<RegeocodeParams, 'location' | 'batch'>
  ): Promise<BatchRegeocodeResponse> {
    // 检查是否有任何输入包含分隔符
    if (locations.some(loc => loc.includes('|'))) {
      throw new Error('Invalid location: Individual locations cannot contain the "|" separator.');
    }

    const locationStr = locations.join('|');
    
    // 校验坐标
    validateCoordinates(locationStr);

    const { signal, ...rest } = options || {};
    const params: RegeocodeParams = {
      location: locationStr,
      batch: true,
      ...rest,
    };

    return this.client.request<BatchRegeocodeResponse>('/v3/geocode/regeo', { params, signal });
  }

  /**
   * 批量地理编码
   * 
   * @param addresses 地址列表
   * @param city 可选，指定查询的城市
   * @returns 坐标信息列表
   * 
   * @example
   * ```typescript
   * const result = await geocode.batchGeocode([
   *   '北京市朝阳区阜通东大街6号',
   *   '北京市朝阳区望京SOHO'
   * ], '北京');
   * ```
   */
  async batchGeocode(addresses: string[], city?: string, options?: { signal?: AbortSignal }): Promise<GeocodeResponse> {
    // 检查是否有任何输入包含分隔符
    if (addresses.some(addr => addr.includes('|'))) {
       throw new Error('Invalid address: Individual addresses cannot contain the "|" separator.');
    }
    
    const params: GeocodeParams = {
      address: addresses.join('|'),
      batch: true,
      city,
    };

    return this.client.request<GeocodeResponse>('/v3/geocode/geo', { params, signal: options?.signal });
  }
}