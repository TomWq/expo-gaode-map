
/**
 * 高德地图 Web API 模块
 *
 * 提供基于高德地图 Web API 的各种服务，包括：
 * - 地理编码/逆地理编码
 * - 路径规划（驾车、步行、骑行、电动车、公交）
 * - POI 搜索（关键字搜索、周边搜索、多边形搜索）
 * - 天气查询（待实现）
 *
 * @example
 * ```typescript
 * import { GaodeWebAPI } from 'expo-gaode-map-web-api';
 *
 * // 创建实例
 * const api = new GaodeWebAPI({ key: 'your-web-api-key' });
 *
 * // 逆地理编码
 * const result = await api.geocode.regeocode('116.481028,39.989643');
 * console.log(result.regeocode.formatted_address);
 *
 * // 地理编码
 * const result = await api.geocode.geocode('北京市朝阳区阜通东大街6号');
 * console.log(result.geocodes[0].location);
 *
 * // 驾车路径规划
 * const route = await api.route.driving('116.481028,39.989643', '116.434446,39.90816');
 * console.log(`距离：${route.route.paths[0].distance}米`);
 *
 * // POI 搜索
 * const pois = await api.poi.search('肯德基', { city: '北京' });
 * console.log(`找到 ${pois.count} 个结果`);
 * ```
 */

import { GaodeWebAPIClient, ClientConfig } from './utils/client';
import { GeocodeService } from './services/GeocodeService';
import { RouteService } from './services/RouteService';
import { POIService } from './services/POIService';

// 导出类型
export * from './types/geocode.types';
export * from './types/route.types';

// POI 类型导出 - 使用具名导出避免与 geocode.types 中的 POI 冲突
export type {
  POISearchParams,
  POIAroundParams,
  POIPolygonParams,
  POIDetailParams,
  POIInfo,
  POISearchResponse,
} from './types/poi.types';

export type { ClientConfig, APIError } from './utils/client';

/**
 * 高德地图 Web API 主类
 */
export class GaodeWebAPI {
  private client: GaodeWebAPIClient;
  
  /** 地理编码服务 */
  public geocode: GeocodeService;
  
  /** 路径规划服务 */
  public route: RouteService;
  
  /** POI 搜索服务 */
  public poi: POIService;

  /**
   * 创建高德地图 Web API 实例
   *
   * @param config 配置选项
   *
   * @example
   * ```typescript
   * const api = new GaodeWebAPI({
   *   key: 'your-web-api-key',
   *   timeout: 10000
   * });
   * ```
   */
  constructor(config: ClientConfig) {
    this.client = new GaodeWebAPIClient(config);
    this.geocode = new GeocodeService(this.client);
    this.route = new RouteService(this.client);
    this.poi = new POIService(this.client);
  }

  /**
   * 更新 API Key
   */
  setKey(key: string): void {
    this.client.setKey(key);
  }

  /**
   * 获取当前 API Key
   */
  getKey(): string {
    return this.client.getKey();
  }
}

/**
 * 创建默认导出，方便使用
 */
export default GaodeWebAPI;