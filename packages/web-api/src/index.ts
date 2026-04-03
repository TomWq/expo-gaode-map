
/**
 * 高德地图 Web API 模块
 *
 * 提供基于高德地图 Web API 的各种服务，包括：
 * - 地理编码/逆地理编码
 * - 路径规划（驾车、步行、骑行、电动车、公交）
 * - POI 搜索（关键字搜索、周边搜索、多边形搜索）
 * - 输入提示（搜索建议）
 * 
 *
 * @example
 * ```typescript
 * import { GaodeWebAPI } from 'expo-gaode-map-web-api';
 *
 * // 创建实例
 * const api = new GaodeWebAPI();
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
 *
 * // 输入提示
 * const tips = await api.inputTips.getTips('肯德基', { city: '北京' });
 * console.log(`找到 ${tips.count} 个建议`);
 * ```
 */
export * as V3 from './v3';
export {
  createWebCapabilityAdapter,
  createWebDataCapabilityAdapter,
  createWebDataRuntime,
  createWebGeocodeProvider,
  createWebRouteProvider,
  createWebRuntime,
  createWebSearchProvider,
} from './v3';
export type {
  WebCapabilityAdapterOptions,
  WebDataCapabilityAdapterOptions,
  WebDataRuntimeFactoryOptions,
  WebGeocodeProviderFactoryOptions,
  WebProviderFactoryOptions,
  WebRouteProviderFactoryOptions,
  WebRuntimeFactoryOptions,
} from './v3';

import {
  GaodeWebAPIClient,
  GaodeWebApiRuntimeError,
  ClientConfig,
} from './utils/client';
import { GeocodeService } from './services/GeocodeService';
import { RouteService } from './services/RouteService';
import { POIService } from './services/POIService';
import { InputTipsService } from './services/InputTipsService';
import {
  createWebCapabilityAdapter,
  createWebDataCapabilityAdapter,
  createWebDataRuntime,
  createWebGeocodeProvider,
  createWebRouteProvider,
  createWebRuntime,
  createWebSearchProvider,
} from './v3';
import type { GaodeRuntime } from './v3/runtime';

/**
 * 从核心包解析 getWebKey（运行时解析，避免类型导出时序问题）
 */
function resolveWebKey(): string | undefined {
  // 1) 尝试从核心地图包读取
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const core = require('expo-gaode-map');
    const fn = core?.getWebKey;
    if (typeof fn === 'function') {
      return fn();
    }
  } catch {
    // ignore
  }
  // 2) 若未安装核心包，则尝试从导航包读取（导航内置地图）
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nav = require('expo-gaode-map-navigation');
    const fn2 = nav?.getWebKey;
    if (typeof fn2 === 'function') {
      return fn2();
    }
  } catch {
    // ignore
  }
  return undefined;
}

// 导出类型
export * from './types/geocode.types';
export * from './types/route.types';
export * from './types/inputtips.types';

// POI 类型导出 - 使用具名导出避免与 geocode.types 中的 POI 冲突
export type {
  AOIBoundaryInfo,
  AOIBoundaryParams,
  AOIBoundaryResponse,
  POISearchParams,
  POIAroundParams,
  POIPolygonParams,
  POIDetailParams,
  POIInfo,
  POISearchResponse,
} from './types/poi.types';

// 客户端配置和错误类型导出
export type {
  APIError,
  ClientConfig,
  WebApiErrorType,
  WebApiUnifiedError,
} from './utils/client';
export { GaodeAPIError, GaodeWebApiRuntimeError } from './utils/client';

// 错误码相关导出
export { getErrorInfo, isSuccess, ERROR_CODE_MAP } from './utils/errorCodes';
export type { InfoCode, ErrorInfo } from './utils/errorCodes';
export {
  extractAOIBoundary,
  extractRoutePoints,
  extractTransitRoutePoints,
  normalizeDrivingRoute,
} from './utils/normalizers';
export type {
  ExtractedAOIBoundary,
  NormalizedDrivingRoute,
  RoutePoint,
} from './utils/normalizers';

/**
 * 高德地图 Web API 主类
 * @deprecated 建议迁移到 v3 provider/runtime：`createWebRuntime` 或 `createWebDataRuntime`
 */
export class GaodeWebAPI {
  private client: GaodeWebAPIClient;
  private runtime: GaodeRuntime;
  
  /** 地理编码服务 */
  public geocode: GeocodeService;
  
  /** 路径规划服务 */
  public route: RouteService;
  
  /** POI 搜索服务 */
  public poi: POIService;
  
  /** 输入提示服务 */
  public inputTips: InputTipsService;

  /**
   * 创建高德地图 Web API 实例
   *
   * @param config 配置选项（可选）
   *
   * @example
   * ```typescript
   * const api = new GaodeWebAPI({
   *   key: 'your-web-api-key',
   *   timeout: 10000
   * });
   * ```
   */
  constructor(config: ClientConfig = {}) {
    // 优先使用传入的 key，其次尝试从 SDK 配置中解析
    const webKey = config.key || resolveWebKey();

    if (!webKey) {
      throw new GaodeWebApiRuntimeError({
        code: 'WEB_KEY_MISSING',
        type: 'validation_error',
        message:
          '[expo-gaode-map-web-api] 缺少 Web API Key。您可以通过以下两种方式之一提供：\n' +
          '1. 在构造函数中显式传入：new GaodeWebAPI({ key: "your-web-api-key" });\n' +
          '2. 或者先通过 ExpoGaodeMapModule.initSDK({ webKey }) 初始化并提供 Web API Key：\n' +
          "  import { ExpoGaodeMapModule } from 'expo-gaode-map';\n" +
          '  ExpoGaodeMapModule.initSDK({ webKey: "your-web-api-key", iosKey, androidKey });',
        retryable: false,
      });
    }

    // 使用解析出的 key 或传入的 key
    const effectiveConfig: ClientConfig = { ...config, key: webKey };

    this.client = new GaodeWebAPIClient(effectiveConfig);
    this.geocode = new GeocodeService(this.client);
    this.route = new RouteService(this.client);
    this.poi = new POIService(this.client);
    this.inputTips = new InputTipsService(this.client);
    this.runtime = createWebRuntime({
      search: { api: this },
      geocode: { api: this },
      route: { api: this },
    });
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

  /**
   * 返回与当前实例共享配置的 v3 runtime。
   */
  toRuntime(): GaodeRuntime {
    return this.runtime;
  }
}

/**
 * 创建默认导出，方便使用
 */
export const LegacyWebAPI = GaodeWebAPI;

/**
 * @deprecated 建议迁移到 v3 provider/runtime：`createWebRuntime` 或 provider 工厂
 */
export type LegacyWebAPIClass = typeof GaodeWebAPI;

/**
 * v3 provider/runtime API 聚合导出。
 */
export const V3WebAPI = {
  createWebRuntime,
  createWebDataRuntime,
  createWebCapabilityAdapter,
  createWebDataCapabilityAdapter,
  createWebSearchProvider,
  createWebGeocodeProvider,
  createWebRouteProvider,
};

/**
 * 兼容默认导出（legacy class API）。
 */
export default GaodeWebAPI;
