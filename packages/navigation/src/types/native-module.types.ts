import type { NativeModule } from 'expo';
import { DriveRouteOptions, DriveRouteResult, EBikeRouteOptions, RideRouteOptions, RouteResult, TruckRouteOptions, WalkRouteOptions } from './route.types';
import { 
  MotorcycleRouteOptions, 
  IndependentDriveRouteOptions, 
  IndependentTruckRouteOptions, 
  IndependentWalkRouteOptions, 
  IndependentRideRouteOptions,
  IndependentMotorcycleRouteOptions,
  IndependentRouteResult,
  SelectIndependentRouteOptions,
  StartNaviWithIndependentPathOptions,
  ClearIndependentRouteOptions
} from './independent.types';

export interface ExpoGaodeMapNavigationModule extends NativeModule {
    /**
     * 初始化导航模块
     */
    initNavigation: () => void
    /**
     * 销毁所有路径规划器
     */
    destroyAllCalculators: () => void
    /**
     * 驾车路径规划
     */
    calculateDriveRoute: (options: DriveRouteOptions) => Promise<DriveRouteResult>
    /**
     * 步行路径规划
     */
    calculateWalkRoute: (options: WalkRouteOptions) => Promise<RouteResult>
    /**
     * 骑行路径规划
     */
    calculateRideRoute: (options: RideRouteOptions) => Promise<RouteResult>
    /**
     * 骑行电动车路径规划
     */
    calculateEBikeRoute: (options: EBikeRouteOptions) => Promise<RouteResult>
    /**
     * 货车路径规划
     */
    calculateTruckRoute: (options: TruckRouteOptions) => Promise<DriveRouteResult>
    /**
     * 摩托车路径规划（车类型为 11，支持传入排量）
     */ 
    calculateMotorcycleRoute: (options: MotorcycleRouteOptions) => Promise<DriveRouteResult>
    
    /**
     * 独立路径规划（不会影响当前导航；适合路线预览/行前选路）
     */
    independentDriveRoute: (options: IndependentDriveRouteOptions) => Promise<IndependentRouteResult>
    /**
     * 独立货车路径规划（不会影响当前导航；适合路线预览/行前选路）
     */
    independentTruckRoute: (options: IndependentTruckRouteOptions) => Promise<IndependentRouteResult>
    /**
     * 独立步行路径规划（不会影响当前导航；适合路线预览/行前选路）
     */
    independentWalkRoute: (options: IndependentWalkRouteOptions) => Promise<IndependentRouteResult>
    /**
     * 独立骑行路径规划（不会影响当前导航；适合路线预览/行前选路）
     */
    independentRideRoute: (options: IndependentRideRouteOptions) => Promise<IndependentRouteResult>
    /**
     * 独立摩托车路径规划（不会影响当前导航；适合路线预览/行前选路）
     */ 
    independentMotorcycleRoute: (options: IndependentMotorcycleRouteOptions) => Promise<IndependentRouteResult>
    
    /**
     * 选择独立路径（会影响当前导航）
     */
    selectIndependentRoute: (options: SelectIndependentRouteOptions) => Promise<boolean>
    /**
     * 启动独立路径导航（会影响当前导航）
     */
    startNaviWithIndependentPath: (options: StartNaviWithIndependentPathOptions) => Promise<boolean>
    /**
     * 清除独立路径（会影响当前导航）
     */
    clearIndependentRoute: (options: ClearIndependentRouteOptions) => Promise<boolean>
}