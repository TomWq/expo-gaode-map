
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

/**
 * 在加载 Web API 模块前，强制校验“基础地图提供者”是否已安装。
 * 支持以下任一包：
 *  - expo-gaode-map（核心地图包）
 *  - expo-gaode-map-navigation（导航包，内置地图能力）
 * 这样可避免导航与核心包 SDK 冲突时无法使用的问题。
 */

import { GaodeWebAPIClient, ClientConfig, resolveWebKey } from './utils/client';
import { GeocodeService } from './services/GeocodeService';
import { RouteService } from './services/RouteService';
import { POIService } from './services/POIService';
import { InputTipsService } from './services/InputTipsService';

// 导出类型
export * from './types/geocode.types';
export * from './types/route.types';
export * from './types/inputtips.types';

// POI 类型导出 - 使用具名导出避免与 geocode.types 中的 POI 冲突
export type {
  POISearchParams,
  POIAroundParams,
  POIPolygonParams,
  POIDetailParams,
  POIInfo,
  POISearchResponse,
} from './types/poi.types';


function ensureBaseInstalled() {
  let installed = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('expo-gaode-map');
    installed = true;
  } catch (_) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('expo-gaode-map-navigation');
      installed = true;
    } catch (_) {
      installed = false;
    }
  }

  if (!installed) {
    const msg =
      '[expo-gaode-map-web-api] 需要先安装基础地图组件，支持以下任一包：\n' +
      '  - expo-gaode-map（核心地图包），或\n' +
      '  - expo-gaode-map-navigation（导航包，内置地图能力）\n' +
      '请先安装并完成原生配置后再重试。';
    throw new Error(msg);
  }
}

ensureBaseInstalled();

// 客户端配置和错误类型导出
export type { ClientConfig, APIError } from './utils/client';
export { GaodeAPIError } from './utils/client';

// 错误码相关导出
export { getErrorInfo, isSuccess, ERROR_CODE_MAP } from './utils/errorCodes';
export type { InfoCode, ErrorInfo } from './utils/errorCodes';

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
  
  /** 输入提示服务 */
  public inputTips: InputTipsService;

  /**
   * 创建高德地图 Web API 实例
   *
   * @param config 配置选项（可选）
   *
   */
 constructor(config: ClientConfig = {}) {
   const webKey = resolveWebKey();
   if (!webKey) {
     throw new Error(
       '[expo-gaode-map-web-api] 必须先通过 ExpoGaodeMapModule.initSDK({ webKey }) 初始化并提供 Web API Key。\n' +
       '请在应用启动时调用：\n' +
       "  import { ExpoGaodeMapModule } from 'expo-gaode-map';\n" +
       '  ExpoGaodeMapModule.initSDK({ webKey: \"your-web-api-key\", iosKey, androidKey });\n' +
       '随后再创建 GaodeWebAPI 实例使用 Web API 能力。'
     );
   }
   // 强制使用核心模块中的 webKey，避免直接在此处绕过初始化约束
   const effectiveConfig: ClientConfig = { ...config, key: webKey };

   this.client = new GaodeWebAPIClient(effectiveConfig);
   this.geocode = new GeocodeService(this.client);
   this.route = new RouteService(this.client);
   this.poi = new POIService(this.client);
   this.inputTips = new InputTipsService(this.client);
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

export default GaodeWebAPI;