import { ViewProps, NativeSyntheticEvent } from "react-native";

// 导航信息更新事件
export interface NaviInfoUpdateEvent {
  pathRetainDistance: number;
  pathRetainTime: number;
  currentRoadName: string;
  nextRoadName: string;
  currentSpeed: number;
  iconType: number;
  iconDirection: number;
}

// 导航开始事件
export interface NaviStartEvent {
  type?: number;
  loaded?: boolean;
}

// 导航结束事件
export interface NaviEndEvent {
  reason: string;
}

// 到达目的地事件
export interface NaviArriveEvent {
  arrived: boolean;
}

// 路径规划成功事件
export interface CalculateRouteSuccessEvent {
  routeIds?: number[];
  success?: boolean;
}

// 路径规划失败事件
export interface CalculateRouteFailureEvent {
  error?: string;
  errorCode?: number;
}

// 重新规划路径事件
export interface ReCalculateEvent {
  reason: string;
}

// 语音播报事件
export interface PlayVoiceEvent {
  text: string;
  type?: number;
}

// GPS信号弱事件
export interface GpsSignalWeakEvent {
  isWeak: boolean;
}

// 路线重算事件
export interface RouteRecalculateEvent {
  reason: string;
}

/**
 * 导航视图属性
 */
export interface NaviViewProps extends ViewProps {
  /**
   * 导航类型
   * - 0: GPS 导航
   * - 1: 模拟导航
   */
  naviType?: number;
  
  /**
   * 是否启用语音播报
   * @default true
   */
  enableVoice?: boolean;
  
  /**
   * 是否显示摄像头
   * @default true
   */
  showCamera?: boolean;
  
  /**
   * 是否自动锁车（非锁车模式7秒后自动切换为锁车模式）
   * @default true
   */
  autoLockCar?: boolean;
  
  /**
   * 是否开启自动缩放（锁车模式下自动缩放地图以预见下一导航动作）
   * @default true
   */
  autoChangeZoom?: boolean;
  
  /**
   * 是否显示交通路况
   * @default true
   */
  trafficLayerEnabled?: boolean;
  
  /**
   * 是否显示路口放大图
   * @default true
   */
  realCrossDisplay?: boolean;
  
  /**
   * 导航视角模式
   * - 0: 车头朝上 (carNorth)
   * - 1: 正北朝上 (mapNorth)
   * @default 0
   */
  naviMode?: number;
  
  /**
   * 导航显示模式
   * - 1: 锁车态 (carPositionLocked) - 自车图标锁定在屏幕固定位置
   * - 2: 全览态 (overview) - 整条路线显示在可见区域内
   * - 3: 普通态 (normal) - 地图不动，自车图标移动
   * @default 1
   */
  showMode?: number;
  
  /**
   * 是否开启夜间模式
   * @default false
   */
  isNightMode?: boolean;
  
  /**
   * 是否显示自车和罗盘
   * @platform android
   * @default true
   * @since 6.2.0
   */
  carOverlayVisible?: boolean;
  
  /**
   * 是否显示交通信号灯
   * @platform android
   * @default true
   * @since 7.4.0
   */
  trafficLightsVisible?: boolean;
  
  /**
   * 路线标记点可见性配置
   * @platform android
   * @since 9.0.0
   */
  routeMarkerVisible?: {
    /** 是否显示起终途点 @default true */
    showStartEndVia?: boolean;
    /** 是否显示步行轮渡扎点 @default true */
    showFootFerry?: boolean;
    /** 是否显示禁行限行封路icon @default true */
    showForbidden?: boolean;
    /** 是否显示路线起点icon @default true @since 9.0.0 */
    showRouteStartIcon?: boolean;
    /** 是否显示路线终点icon @default true @since 9.0.0 */
    showRouteEndIcon?: boolean;
  };
  
  /**
   * 是否显示路线转向箭头
   * @platform android
   * @default true
   * @since 6.3.0
   */
  naviArrowVisible?: boolean;
  
  /**
   * 是否显示拥堵气泡
   * @platform android
   * @default true
   * @since 10.0.5
   */
  showDriveCongestion?: boolean;
  
  /**
   * 是否显示红绿灯倒计时气泡
   * @platform android
   * @default true
   * @since 10.0.5
   */
  showTrafficLightView?: boolean;
  
  // ========== iOS 特有属性 ==========
  
  /**
   * 是否显示路线
   * @platform ios
   * @default true
   */
  showRoute?: boolean;
  
  /**
   * 是否显示转向箭头
   * @platform ios
   * @default true
   */
  showTurnArrow?: boolean;
  
  /**
   * 是否显示路况光柱
   * @platform ios
   * @default true
   */
  showTrafficBar?: boolean;
  
  /**
   * 是否显示全览按钮
   * @platform ios
   * @default true
   */
  showBrowseRouteButton?: boolean;
  
  /**
   * 是否显示更多按钮
   * @platform ios
   * @default true
   */
  showMoreButton?: boolean;
  
  /**
   * 是否显示实时交通按钮
   * @platform ios
   * @default true
   */
  showTrafficButton?: boolean;
  
  /**
   * 是否显示界面元素（设为false可完全自定义界面）
   * @platform ios
   * @default true
   */
  showUIElements?: boolean;
  
  /**
   * 走过的路线是否置灰
   * @platform ios
   * @default false
   */
  showGreyAfterPass?: boolean;
  
  /**
   * 是否显示牵引线（起点到终点的飞线）
   * @platform ios
   * @default true
   */
  showVectorline?: boolean;
  
  /**
   * 是否显示红绿灯图标
   * @platform ios
   * @default true
   */
  showTrafficLights?: boolean;
  
  /**
   * 地图样式类型
   * - 0: 白天模式 (day)
   * - 1: 黑夜模式 (night)
   * - 2: 根据日出日落自动切换 (dayNightAuto)
   * - 3: 自定义地图样式 (custom)
   * @platform ios
   * @default 0
   */
  mapViewModeType?: number;
  
  /**
   * 路线polyline的宽度，设置0恢复默认宽度
   * @platform ios
   */
  lineWidth?: number;
  
  /**
   * 导航信息更新回调
   */
  onNaviInfoUpdate?: (event: NativeSyntheticEvent<NaviInfoUpdateEvent>) => void;
  
  /**
   * 导航开始回调
   */
  onNaviStart?: (event: NativeSyntheticEvent<NaviStartEvent>) => void;
  
  /**
   * 导航结束回调
   */
  onNaviEnd?: (event: NativeSyntheticEvent<NaviEndEvent>) => void;
  
  /**
   * 到达目的地回调
   */
  onArrive?: (event: NativeSyntheticEvent<NaviArriveEvent>) => void;
  
  /**
   * 路径规划成功回调
   */
  onCalculateRouteSuccess?: (event: NativeSyntheticEvent<CalculateRouteSuccessEvent>) => void;
  
  /**
   * 路径规划失败回调
   */
  onCalculateRouteFailure?: (event: NativeSyntheticEvent<CalculateRouteFailureEvent>) => void;
  
  /**
   * 重新规划路径回调
   */
  onReCalculate?: (event: NativeSyntheticEvent<ReCalculateEvent>) => void;
  
  /**
   * 语音播报回调
   */
  onPlayVoice?: (event: NativeSyntheticEvent<PlayVoiceEvent>) => void;
  
  /**
   * GPS信号弱回调
   */
  onGpsSignalWeak?: (event: NativeSyntheticEvent<GpsSignalWeakEvent>) => void;
  
  /**
   * 路线重算回调
   */
  onRouteRecalculate?: (event: NativeSyntheticEvent<RouteRecalculateEvent>) => void;
}

