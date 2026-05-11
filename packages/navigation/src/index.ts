import ExpoGaodeMapNavigationModule from './ExpoGaodeMapNavigationModule';
import {
  ExpoGaodeMapNaviView,
  type ExpoGaodeMapNaviViewRef,
} from './ExpoGaodeMapNaviView';
export * from './map';
import {
  DriveStrategy,
  RouteType,
  WalkStrategy,
  RideStrategy,
  TruckSize,
  TravelStrategy,
} from './types';
import {
  calculateRoute,
  calculateDriveRoute,
  calculateWalkRoute,
  calculateRideRoute,
  calculateEBikeRoute,
  calculateTransitRoute,
  calculateTruckRoute,
  calculateMotorcycleRoute,
  initNavigation,
  destroyAllCalculators,
  independentDriveRoute,
  independentTruckRoute,
  independentWalkRoute,
  independentRideRoute,
  independentMotorcycleRoute,
  selectIndependentRoute,
  startNaviWithIndependentPath,
  openOfficialNaviPage,
  clearIndependentRoute,
} from './route-planning';
import { buildAnchorWaypointsFromWebRoute } from './route-geometry';
import {
  followWebPlannedRoute,
} from './web-route-following';

export {
  calculateRoute,
  calculateDriveRoute,
  calculateWalkRoute,
  calculateRideRoute,
  calculateEBikeRoute,
  calculateTransitRoute,
  calculateTruckRoute,
  calculateMotorcycleRoute,
  initNavigation,
  destroyAllCalculators,
  independentDriveRoute,
  independentTruckRoute,
  independentWalkRoute,
  independentRideRoute,
  independentMotorcycleRoute,
  selectIndependentRoute,
  startNaviWithIndependentPath,
  openOfficialNaviPage,
  clearIndependentRoute,
};
export { buildAnchorWaypointsFromWebRoute };
export { followWebPlannedRoute };

export { ExpoGaodeMapNavigationModule };

// 导出官方导航界面组件
export { ExpoGaodeMapNaviView, type ExpoGaodeMapNaviViewRef };

/**
 * @deprecated 请使用 `ExpoGaodeMapNaviView`
 */
export const NaviView = ExpoGaodeMapNaviView;

/**
 * @deprecated 请使用 `ExpoGaodeMapNaviViewRef`
 */
export type NaviViewRef = ExpoGaodeMapNaviViewRef;

// 导出导航相关类型与枚举（Coordinates 从 map 模块导出）
export type {
  NaviPoint,
  RouteOptions,
  DriveRouteOptions,
  WalkRouteOptions,
  RideRouteOptions,
  EBikeRouteOptions,
  TransitRouteOptions,
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
  OfficialNaviPageOptions,
  ClearIndependentRouteOptions,
  MotorcycleRouteOptions,
  IndependentMotorcycleRouteOptions,
  BuildAnchorWaypointsOptions,
  FollowWebPlannedRouteOptions,
  FollowWebPlannedRouteResult,
  FollowWebPlannedRouteCandidate,
  WebPlannedRoute,
  NaviInfoUpdateEvent,
  NaviLaneInfoEvent,
  NaviTrafficStatusesEvent,
  NaviVisualStateEvent,
  ExpoGaodeMapNaviViewProps,
} from './types';

export {
  RouteType,
  DriveStrategy,
  WalkStrategy,
  RideStrategy,
  TruckSize,
  TravelStrategy,
};

// 默认导出保留为兼容层，方便老代码一次性挂载整个导航 API。
const ExpoGaodeMapNavigation = {
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
  buildAnchorWaypointsFromWebRoute,
  followWebPlannedRoute,

  // 独立路径规划
  independentDriveRoute,
  independentTruckRoute,
  independentWalkRoute,
  independentRideRoute,
  independentMotorcycleRoute,

  // 独立路径组操作
  selectIndependentRoute,
  startNaviWithIndependentPath,
  openOfficialNaviPage,
  clearIndependentRoute,
};

export default ExpoGaodeMapNavigation;
