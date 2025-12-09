/**
 * 高德地图 Web API - 输入提示服务
 * 
 */

import { GaodeWebAPIClient } from '../utils/client';
import type {
  InputTipsParams,
  InputTipsResponse,
} from '../types/inputtips.types';

/**
 * 输入提示服务
 * 提供根据用户输入的关键词查询返回建议列表
 */
export class InputTipsService {
  constructor(private client: GaodeWebAPIClient) {}

  /**
   * 获取输入提示
   * 根据用户输入的关键词返回建议列表
   *
   * @param keywords 查询关键词
   * @param options 可选参数
   * @returns 输入提示结果
   *
   * @example
   * ```typescript
   * // 基础搜索
   * const result = await inputTips.getTips('肯德基');
   *
   * // 指定城市搜索
   * const result = await inputTips.getTips('肯德基', {
   *   city: '北京',
   *   citylimit: true
   * });
   *
   * // 指定位置和类型
   * const result = await inputTips.getTips('银行', {
   *   location: '116.481488,39.990464',
   *   type: '150100',
   *   city: '010'
   * });
   *
   * // 搜索公交站点
   * const result = await inputTips.getTips('天安门', {
   *   city: '北京',
   *   datatype: 'bus'
   * });
   *
   * // 搜索公交线路
   * const result = await inputTips.getTips('1路', {
   *   city: '北京',
   *   datatype: 'busline'
   * });
   * ```
   */
  async getTips(
    keywords: string,
    options?: Omit<InputTipsParams, 'keywords'>
  ): Promise<InputTipsResponse> {
    const params: InputTipsParams = {
      keywords,
      ...options,
    };

    return this.client.request<InputTipsResponse>('/v3/assistant/inputtips', params);
  }

  /**
   * 获取 POI 输入提示
   * 仅返回 POI 类型的建议
   *
   * @param keywords 查询关键词
   * @param options 可选参数
   * @returns 输入提示结果
   *
   * @example
   * ```typescript
   * const result = await inputTips.getPOITips('餐厅', {
   *   city: '北京',
   *   type: '050000'
   * });
   * ```
   */
  async getPOITips(
    keywords: string,
    options?: Omit<InputTipsParams, 'keywords' | 'datatype'>
  ): Promise<InputTipsResponse> {
    return this.getTips(keywords, {
      ...options,
      datatype: 'poi',
    });
  }

  /**
   * 获取公交站点输入提示
   * 仅返回公交站点类型的建议
   *
   * @param keywords 查询关键词
   * @param options 可选参数
   * @returns 输入提示结果
   *
   * @example
   * ```typescript
   * const result = await inputTips.getBusTips('天安门', {
   *   city: '北京'
   * });
   * ```
   */
  async getBusTips(
    keywords: string,
    options?: Omit<InputTipsParams, 'keywords' | 'datatype'>
  ): Promise<InputTipsResponse> {
    return this.getTips(keywords, {
      ...options,
      datatype: 'bus',
    });
  }

  /**
   * 获取公交线路输入提示
   * 仅返回公交线路类型的建议
   *
   * @param keywords 查询关键词
   * @param options 可选参数
   * @returns 输入提示结果
   *
   * @example
   * ```typescript
   * const result = await inputTips.getBuslineTips('1路', {
   *   city: '北京'
   * });
   * ```
   */
  async getBuslineTips(
    keywords: string,
    options?: Omit<InputTipsParams, 'keywords' | 'datatype'>
  ): Promise<InputTipsResponse> {
    return this.getTips(keywords, {
      ...options,
      datatype: 'busline',
    });
  }
}