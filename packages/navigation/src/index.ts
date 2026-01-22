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
 * 注意：公交路径规划暂未实现
 */
export async function calculateRoute(
  options: RouteOptions
): Promise<RouteResult | DriveRouteResult> {
  // 1. 货车
  if ('size' in options) {
    return calculateTruckRoute(options as TruckRouteOptions);
  }
  
  // 2. 步行、骑行、电动车
  if ('multiple' in options || 'travelStrategy' in options) {
    if ('usePoi' in options) return calculateEBikeRoute(options as EBikeRouteOptions);
    
    // 策略判断：0 或 1 通常为骑行策略，其余默认步行
    const strategy = (options as any).strategy;
    if (strategy === 0 || strategy === 1) {
      return calculateRideRoute(options as RideRouteOptions);
    }
    return calculateWalkRoute(options as WalkRouteOptions);
  }

  // 3. 摩托车 (通过 carType 或 motorcycleCC 判断)
  if ('motorcycleCC' in options || (options as any).carType === 11) {
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

export {
  ExpoGaodeMapNavigationModule,
}