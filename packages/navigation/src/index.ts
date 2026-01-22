import ExpoGaodeMapNavigationModule from './ExpoGaodeMapNavigationModule';

// 重新导出地图模块的所有内容
export * from './map';
import {
  RouteType,
  DriveStrategy,
  WalkStrategy,
  RideStrategy,
  TruckSize,
  TravelStrategy,
} from './types';
import type {
  NaviPoint,
  RouteOptions,
  DriveRouteOptions,
  WalkRouteOptions,
  RideRouteOptions,
  EBikeRouteOptions,
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

// 导出官方导航界面组件
export { ExpoGaodeMapNaviView, type ExpoGaodeMapNaviViewRef } from './ExpoGaodeMapNaviView';


/**
 * 初始化导航模块（可选）
 */
export function initNavigation(): void {
  ExpoGaodeMapNavigationModule.initNavigation();
}

/**
 * 销毁所有路径计算器实例
 * 用于页面切换时释放资源，避免"Another route calculation is in progress"错误
 */
export function destroyAllCalculators(): void {
  ExpoGaodeMapNavigationModule.destroyAllCalculators();
}

/**
 * 路径规划（通用方法）
 * 注意：公交路径规划暂未实现
 */
export async function calculateRoute(
  options: RouteOptions
): Promise<RouteResult | DriveRouteResult> {
  // 根据传入的选项类型调用对应的方法
  if ('carNumber' in options || 'avoidPolygons' in options) {
    // 驾车或摩托车
    return await calculateDriveRoute(options as DriveRouteOptions);
  } else if ('size' in options) {
    // 货车
    return await calculateTruckRoute(options as TruckRouteOptions);
  } else if ('multiple' in options || 'travelStrategy' in options) {
    // 步行或骑行
    if ('usePoi' in options) {
      // 电动车
      return await calculateEBikeRoute(options as EBikeRouteOptions);
    } else if ((options as any).strategy === 0 || (options as any).strategy === 1) {
      // 骑行
      return await calculateRideRoute(options as RideRouteOptions);
    } else {
      // 步行
      return await calculateWalkRoute(options as WalkRouteOptions);
    }
  } else {
    // 默认当作驾车处理
    return await calculateDriveRoute(options as DriveRouteOptions);
  }
}

/**
 * 驾车路径规划
 */
export async function calculateDriveRoute(
  options: DriveRouteOptions
): Promise<DriveRouteResult> {
  return await ExpoGaodeMapNavigationModule.calculateDriveRoute(options);
}

/**
 * 步行路径规划
 */
export async function calculateWalkRoute(
  options: WalkRouteOptions
): Promise<RouteResult> {
  return await ExpoGaodeMapNavigationModule.calculateWalkRoute(options);
}

/**
 * 骑行路径规划
 */
export async function calculateRideRoute(
  options: RideRouteOptions
): Promise<RouteResult> {
  return await ExpoGaodeMapNavigationModule.calculateRideRoute(options);
}

/**
 * 骑行电动车路径规划
 */
export async function calculateEBikeRoute(
  options: EBikeRouteOptions
): Promise<RouteResult> {
  return await (ExpoGaodeMapNavigationModule as any).calculateEBikeRoute(options);
}

/**
 * 货车路径规划
 */
export async function calculateTruckRoute(
  options: TruckRouteOptions
): Promise<DriveRouteResult> {
  return await ExpoGaodeMapNavigationModule.calculateTruckRoute(options);
}

/**
 * 摩托车路径规划（车类型为 11，支持传入排量）
 */
export async function calculateMotorcycleRoute(
  options: MotorcycleRouteOptions
): Promise<DriveRouteResult> {
  return await ExpoGaodeMapNavigationModule.calculateMotorcycleRoute(options as any);
}

/**
* 独立路径规划（不会影响当前导航；适合路线预览/行前选路）
*/
export async function independentDriveRoute(
 options: IndependentDriveRouteOptions
): Promise<IndependentRouteResult> {
 return await ExpoGaodeMapNavigationModule.independentDriveRoute(options);
}

export async function independentTruckRoute(
 options: IndependentTruckRouteOptions
): Promise<IndependentRouteResult> {
 return await ExpoGaodeMapNavigationModule.independentTruckRoute(options);
}

export async function independentWalkRoute(
 options: IndependentWalkRouteOptions
): Promise<IndependentRouteResult> {
 return await ExpoGaodeMapNavigationModule.independentWalkRoute(options);
}

export async function independentRideRoute(
  options: IndependentRideRouteOptions
): Promise<IndependentRouteResult> {
  return await ExpoGaodeMapNavigationModule.independentRideRoute(options);
}

/**
 * 独立摩托车路径规划（不干扰当前导航）
 */
export async function independentMotorcycleRoute(
  options: IndependentMotorcycleRouteOptions
): Promise<IndependentRouteResult> {
  return await ExpoGaodeMapNavigationModule.independentMotorcycleRoute(options as any);
}

/**
 * 独立路径组：选主路线
 */
export async function selectIndependentRoute(
  options: SelectIndependentRouteOptions
): Promise<boolean> {
  return await ExpoGaodeMapNavigationModule.selectIndependentRoute(options);
}

/**
 * 独立路径组：使用指定路线启动导航
 */
export async function startNaviWithIndependentPath(
  options: StartNaviWithIndependentPathOptions
): Promise<boolean> {
  return await ExpoGaodeMapNavigationModule.startNaviWithIndependentPath(options);
}

/**
 * 独立路径组：清理
 */
export async function clearIndependentRoute(
  options: ClearIndependentRouteOptions
): Promise<boolean> {
  return await ExpoGaodeMapNavigationModule.clearIndependentRoute(options);
}

// 导出导航相关类型与枚举（Coordinates 从 map 模块导出）
export type {
  NaviPoint,
  RouteOptions,
  DriveRouteOptions,
  WalkRouteOptions,
  RideRouteOptions,
  EBikeRouteOptions,
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