import ExpoGaodeMapNavigationModule from './ExpoGaodeMapNavigationModule';
import { ErrorType, GaodeMapError } from './map/utils/ErrorHandler';

// 重新导出地图模块的所有内容
export * from './map';
import {
  RouteType,
  DriveStrategy,
  WalkStrategy,
  RideStrategy,
  TruckSize,
  TravelStrategy,
  type TransitRouteOptions,
} from './types';
import type {
  NaviPoint,
  RouteOptions,
  DriveRouteOptions,
  WalkRouteOptions,
  RideRouteOptions,
  EBikeRouteOptions,
  TransitRouteOptions as TransitRouteOptionsType,
  TruckRouteOptions,
  RouteResult,
  DriveRouteResult,
  IndependentRouteResult,
  IndependentDriveRouteOptions,
  IndependentTruckRouteOptions,
  IndependentWalkRouteOptions,
  IndependentRideRouteOptions,
  SelectIndependentRouteOptions,
  StartNaviWithIndependentPathOptions,
  ClearIndependentRouteOptions,
  MotorcycleRouteOptions,
  IndependentMotorcycleRouteOptions,
} from './types';

interface TransitRoutePlanLike {
  distanceMeters?: number;
  durationSeconds?: number;
  path?: NaviPoint[];
  raw?: unknown;
}

interface TransitRouteProviderLike {
  calculateTransitRoutes?(params: {
    origin: NaviPoint;
    destination: NaviPoint;
    city1: string;
    city2: string;
    strategy?: number;
    alternativeRoute?: 1 | 2 | 3;
  }): Promise<TransitRoutePlanLike[]>;
}

function extractTransitFee(raw: unknown): number {
  const transitFee =
    (raw as { cost?: { transit_fee?: number | string } } | undefined)?.cost
      ?.transit_fee;
  const parsed = Number(transitFee ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function loadWebApiTransitFallbackProvider(): Promise<TransitRouteProviderLike> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const webApi = require('expo-gaode-map-web-api');

    if (typeof webApi?.createWebRouteProvider === 'function') {
      const provider = webApi.createWebRouteProvider();
      if (typeof provider?.calculateTransitRoutes === 'function') {
        return provider as TransitRouteProviderLike;
      }
    }

    if (typeof webApi?.createWebRuntime === 'function') {
      const runtime = webApi.createWebRuntime();
      const transitRouteMethod = runtime?.route?.calculateTransitRoutes;
      if (typeof transitRouteMethod === 'function') {
        return {
          calculateTransitRoutes: transitRouteMethod.bind(runtime.route),
        };
      }
    }

    throw new GaodeMapError({
      code: 'TRANSIT_FALLBACK_INVALID_EXPORT',
      type: ErrorType.INVALID_PARAMETER,
      message:
        'expo-gaode-map-web-api 未导出可用的公交算路 provider（createWebRouteProvider/createWebRuntime）',
      retryable: false,
      solution:
        '请升级 expo-gaode-map-web-api 到 v3 兼容版本，并确认导出了 createWebRouteProvider 或 createWebRuntime。',
    });
  } catch (error) {
    if (error instanceof GaodeMapError) {
      throw error;
    }

    throw new GaodeMapError({
      code: 'TRANSIT_FALLBACK_UNAVAILABLE',
      type: ErrorType.INVALID_PARAMETER,
      message:
        '公交路径规划依赖 expo-gaode-map-web-api。请安装该包，并在 ExpoGaodeMapModule.initSDK 中提供 webKey。',
      retryable: false,
      cause: error,
      solution:
        '安装 expo-gaode-map-web-api 并配置 webKey 后重试；若已安装，请检查打包产物是否包含该包。',
    });
  }
}

function normalizeTransitRouteResult(
  options: TransitRouteOptions,
  plans: TransitRoutePlanLike[]
): DriveRouteResult {
  const routes = (plans ?? []).map((plan, index) => ({
    id: index,
    start: options.from,
    end: options.to,
    distance: Number(plan?.distanceMeters ?? 0),
    duration: Number(plan?.durationSeconds ?? 0),
    segments: [],
    polyline: Array.isArray(plan?.path) ? plan.path : [],
    tollDistance: 0,
    tollCost: extractTransitFee(plan?.raw),
    strategy: options.strategy,
  }));

  return {
    count: routes.length,
    mainPathIndex: 0,
    routes,
  };
}

function hasStrategyOption(
  options: RouteOptions
): options is WalkRouteOptions | RideRouteOptions {
  return 'strategy' in options;
}

function isMotorcycleRouteOptions(
  options: RouteOptions | MotorcycleRouteOptions
): options is MotorcycleRouteOptions {
  return 'motorcycleCC' in options;
}

// 导出官方导航界面组件
export { 
  ExpoGaodeMapNaviView, 
  type ExpoGaodeMapNaviViewRef,
  // 兼容旧版本名称
  ExpoGaodeMapNaviView as NaviView,
  type ExpoGaodeMapNaviViewRef as NaviViewRef 
} from './ExpoGaodeMapNaviView';

/**
 * 初始化导航模块（可选）
 */
export const initNavigation = () => ExpoGaodeMapNavigationModule.initNavigation();

/**
 * 销毁所有路径计算器实例
 * 用于页面切换时释放资源，避免"Another route calculation is in progress"错误
 */
export const destroyAllCalculators = () => ExpoGaodeMapNavigationModule.destroyAllCalculators();

/**
 * 路径规划（通用方法）
 */
export async function calculateRoute(
  options: RouteOptions
): Promise<RouteResult | DriveRouteResult> {
  if ('type' in options && options.type === RouteType.TRANSIT) {
    return calculateTransitRoute(options as TransitRouteOptions);
  }

  // 1. 货车
  if ('size' in options) {
    return calculateTruckRoute(options as TruckRouteOptions);
  }
  
  // 2. 步行、骑行、电动车
  if ('multiple' in options || 'travelStrategy' in options) {
    if ('usePoi' in options) return calculateEBikeRoute(options as EBikeRouteOptions);
    
    // 策略判断：0 或 1 通常为骑行策略，其余默认步行
    const strategy = hasStrategyOption(options) ? options.strategy : undefined;
    if (strategy === 0 || strategy === 1) {
      return calculateRideRoute(options as RideRouteOptions);
    }
    return calculateWalkRoute(options as WalkRouteOptions);
  }

  // 3. 摩托车 (通过 carType 或 motorcycleCC 判断)
  if (isMotorcycleRouteOptions(options)) {
    return calculateMotorcycleRoute(options as MotorcycleRouteOptions);
  }

  // 4. 默认驾车
  return calculateDriveRoute(options as DriveRouteOptions);
}

/**
 * 驾车路径规划
 */
export const calculateDriveRoute = (options: DriveRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateDriveRoute(options);

/**
 * 步行路径规划
 */
export const calculateWalkRoute = (options: WalkRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateWalkRoute(options);

/**
 * 骑行路径规划
 */
export const calculateRideRoute = (options: RideRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateRideRoute(options);

/**
 * 骑行电动车路径规划
 */
export const calculateEBikeRoute = (options: EBikeRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateEBikeRoute(options);

/**
 * 货车路径规划
 */
export const calculateTruckRoute = (options: TruckRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateTruckRoute(options);

/**
 * 摩托车路径规划（车类型为 11，支持传入排量）
 */
export const calculateMotorcycleRoute = (options: MotorcycleRouteOptions) => 
  ExpoGaodeMapNavigationModule.calculateMotorcycleRoute(options);

/**
 * 公交换乘路径规划（运行时 fallback 到 Web API）
 */
export async function calculateTransitRoute(options: TransitRouteOptions): Promise<DriveRouteResult> {
  // 运行时按需加载，避免把 navigation 包和 web-api 包在构建期强绑定。
  const provider = await loadWebApiTransitFallbackProvider();

  if (typeof provider.calculateTransitRoutes !== 'function') {
    throw new GaodeMapError({
      code: 'TRANSIT_FALLBACK_INVALID_PROVIDER',
      type: ErrorType.INVALID_PARAMETER,
      message: '未找到可用的公交路径规划方法 calculateTransitRoutes',
      retryable: false,
      solution:
        '请升级 expo-gaode-map-web-api 到 v3 兼容版本，并确认 createWebRouteProvider/createWebRuntime 返回了 route.calculateTransitRoutes。',
    });
  }

  const plans = await provider.calculateTransitRoutes({
    origin: options.from,
    destination: options.to,
    city1: options.city1,
    city2: options.city2,
    strategy: options.strategy,
    alternativeRoute: options.alternativeRoute,
  });

  return normalizeTransitRouteResult(options, plans);
}

/**
* 独立路径规划（不会影响当前导航；适合路线预览/行前选路）
*/
export const independentDriveRoute = (options: IndependentDriveRouteOptions) => 
  ExpoGaodeMapNavigationModule.independentDriveRoute(options);

export const independentTruckRoute = (options: IndependentTruckRouteOptions) => 
  ExpoGaodeMapNavigationModule.independentTruckRoute(options);

export const independentWalkRoute = (options: IndependentWalkRouteOptions) => 
  ExpoGaodeMapNavigationModule.independentWalkRoute(options);

export const independentRideRoute = (options: IndependentRideRouteOptions) => 
  ExpoGaodeMapNavigationModule.independentRideRoute(options);

/**
 * 独立摩托车路径规划（不干扰当前导航）
 */
export const independentMotorcycleRoute = (options: IndependentMotorcycleRouteOptions) => 
  ExpoGaodeMapNavigationModule.independentMotorcycleRoute(options);

/**
 * 独立路径组：选主路线
 */
export const selectIndependentRoute = (options: SelectIndependentRouteOptions) => 
  ExpoGaodeMapNavigationModule.selectIndependentRoute(options);

/**
 * 独立路径组：使用指定路线启动导航
 */
export const startNaviWithIndependentPath = (options: StartNaviWithIndependentPathOptions) => 
  ExpoGaodeMapNavigationModule.startNaviWithIndependentPath(options);

/**
 * 独立路径组：清理
 */
export const clearIndependentRoute = (options: ClearIndependentRouteOptions) => 
  ExpoGaodeMapNavigationModule.clearIndependentRoute(options);

// 导出导航相关类型与枚举（Coordinates 从 map 模块导出）
export type {
  NaviPoint,
  RouteOptions,
  DriveRouteOptions,
  WalkRouteOptions,
  RideRouteOptions,
  EBikeRouteOptions,
  TransitRouteOptionsType as TransitRouteOptions,
  TruckRouteOptions,
  RouteResult,
  DriveRouteResult,
  IndependentRouteResult,
  IndependentDriveRouteOptions,
  IndependentTruckRouteOptions,
  IndependentWalkRouteOptions,
  IndependentRideRouteOptions,
  SelectIndependentRouteOptions,
  StartNaviWithIndependentPathOptions,
  ClearIndependentRouteOptions,
  MotorcycleRouteOptions,
  IndependentMotorcycleRouteOptions,
};

export {
  RouteType,
  DriveStrategy,
  WalkStrategy,
  RideStrategy,
  TruckSize,
  TravelStrategy,
};

// 精简后的默认导出
export default {
  // 初始化
  initNavigation,
  destroyAllCalculators,

  // 路径规划
  calculateRoute,
  calculateDriveRoute,
  calculateWalkRoute,
  calculateRideRoute,
  calculateEBikeRoute,
  calculateTransitRoute,
  calculateTruckRoute,
  calculateMotorcycleRoute,

  // 独立路径规划
  independentDriveRoute,
  independentTruckRoute,
  independentWalkRoute,
  independentRideRoute,
  independentMotorcycleRoute,

  // 独立路径组操作
  selectIndependentRoute,
  startNaviWithIndependentPath,
  clearIndependentRoute,
};

export {
  ExpoGaodeMapNavigationModule,
}
