import ExpoGaodeMapNavigationModule from './ExpoGaodeMapNavigationModule';
import {
  calculateDriveRouteWithAvoidPreview,
  calculateTransitRouteWithWebApi,
  shouldUseAvoidPreviewFallback,
} from './web-api-fallback';
import type {
  ClearIndependentRouteOptions,
  DriveRouteOptions,
  DriveRouteResult,
  EBikeRouteOptions,
  IndependentDriveRouteOptions,
  IndependentMotorcycleRouteOptions,
  IndependentRideRouteOptions,
  IndependentTruckRouteOptions,
  IndependentWalkRouteOptions,
  MotorcycleRouteOptions,
  OfficialNaviPageOptions,
  RouteOptions,
  RouteResult,
  SelectIndependentRouteOptions,
  StartNaviWithIndependentPathOptions,
  TransitRouteOptions,
  TruckRouteOptions,
  WalkRouteOptions,
  RideRouteOptions,
} from './types';
import { RouteType } from './types';

export const initNavigation = () => ExpoGaodeMapNavigationModule.initNavigation();

export const destroyAllCalculators = () => ExpoGaodeMapNavigationModule.destroyAllCalculators();

export async function calculateDriveRoute(
  options: DriveRouteOptions
): Promise<DriveRouteResult> {
  // 驾车算路先检查是否需要规避预览；只有在这类场景下才临时回退 Web API。
  if (shouldUseAvoidPreviewFallback(options)) {
    try {
      return await calculateDriveRouteWithAvoidPreview(options);
    } catch {
      // 若未安装 Web API 包，则保持现有原生逻辑不变。
      // 这样不会破坏当前依赖 Android 反射重载的项目。
    }
  }

  return ExpoGaodeMapNavigationModule.calculateDriveRoute(options);
}

export const calculateWalkRoute = (options: WalkRouteOptions) =>
  ExpoGaodeMapNavigationModule.calculateWalkRoute(options);

export const calculateRideRoute = (options: RideRouteOptions) =>
  ExpoGaodeMapNavigationModule.calculateRideRoute(options);

export const calculateEBikeRoute = (options: EBikeRouteOptions) =>
  ExpoGaodeMapNavigationModule.calculateEBikeRoute(options);

export const calculateTruckRoute = (options: TruckRouteOptions) =>
  ExpoGaodeMapNavigationModule.calculateTruckRoute(options);

export const calculateMotorcycleRoute = (options: MotorcycleRouteOptions) =>
  ExpoGaodeMapNavigationModule.calculateMotorcycleRoute(options);

export async function calculateTransitRoute(options: TransitRouteOptions): Promise<DriveRouteResult> {
  return calculateTransitRouteWithWebApi(options);
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

export async function calculateRoute(
  options: RouteOptions
): Promise<RouteResult | DriveRouteResult> {
  // 这里是统一入口，按“最明确的类型特征”逐层分流。
  // 顺序很重要：先看显式 type，再看货车 / 步骑 / 摩托车，最后才回到默认驾车。
  if ('type' in options && options.type === RouteType.TRANSIT) {
    return calculateTransitRoute(options as TransitRouteOptions);
  }

  if ('size' in options) {
    return calculateTruckRoute(options as TruckRouteOptions);
  }

  if ('multiple' in options || 'travelStrategy' in options) {
    // 电动车 / 步行 / 骑行这几类在 JS 层会共享部分字段，先用 usePoi 做电动车识别。
    if ('usePoi' in options) return ExpoGaodeMapNavigationModule.calculateEBikeRoute(options as EBikeRouteOptions);

    // 骑行和步行的区分主要看 strategy 值；其余情况默认按步行处理。
    const strategy = hasStrategyOption(options) ? options.strategy : undefined;
    if (strategy === 0 || strategy === 1) {
      return calculateRideRoute(options as RideRouteOptions);
    }
    return calculateWalkRoute(options as WalkRouteOptions);
  }

  if (isMotorcycleRouteOptions(options)) {
    return calculateMotorcycleRoute(options as MotorcycleRouteOptions);
  }

  return calculateDriveRoute(options as DriveRouteOptions);
}

export const independentDriveRoute = (options: IndependentDriveRouteOptions) =>
  ExpoGaodeMapNavigationModule.independentDriveRoute(options);

export const independentTruckRoute = (options: IndependentTruckRouteOptions) =>
  ExpoGaodeMapNavigationModule.independentTruckRoute(options);

export const independentWalkRoute = (options: IndependentWalkRouteOptions) =>
  ExpoGaodeMapNavigationModule.independentWalkRoute(options);

export const independentRideRoute = (options: IndependentRideRouteOptions) =>
  ExpoGaodeMapNavigationModule.independentRideRoute(options);

export const independentMotorcycleRoute = (options: IndependentMotorcycleRouteOptions) =>
  ExpoGaodeMapNavigationModule.independentMotorcycleRoute(options);

export const selectIndependentRoute = (options: SelectIndependentRouteOptions) =>
  ExpoGaodeMapNavigationModule.selectIndependentRoute(options);

export const startNaviWithIndependentPath = (options: StartNaviWithIndependentPathOptions) =>
  ExpoGaodeMapNavigationModule.startNaviWithIndependentPath(options);

export const openOfficialNaviPage = (options: OfficialNaviPageOptions) =>
  ExpoGaodeMapNavigationModule.openOfficialNaviPage(options);

export const clearIndependentRoute = (options: ClearIndependentRouteOptions) =>
  ExpoGaodeMapNavigationModule.clearIndependentRoute(options);
