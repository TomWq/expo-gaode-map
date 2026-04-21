import { ViewProps, NativeSyntheticEvent, ImageSourcePropType } from "react-native";

export type NaviColorValue = string | number;
export type NaviImageSource = string | ImageSourcePropType;
export type NaviMapViewModeType = 0 | 1 | 2 | 3;

export interface NaviRect {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface NaviTrafficBarColors {
  unknown?: NaviColorValue;
  smooth?: NaviColorValue;
  fineOpen?: NaviColorValue;
  slow?: NaviColorValue;
  jam?: NaviColorValue;
  seriousJam?: NaviColorValue;
  defaultRoad?: NaviColorValue;
}

// 导航信息更新事件
export interface NaviInfoUpdateEvent {
  naviMode?: number;
  pathRetainDistance: number;
  pathRetainTime: number;
  curStepRetainDistance?: number;
  curStepRetainTime?: number;
  currentRoadName: string;
  nextRoadName: string;
  currentSpeed?: number;
  iconType?: number;
  nextIconType?: number;
  /** 当前导航动作的原生转向图标 URI，优先级高于 iconType */
  turnIconImage?: string;
  /** 下一导航动作的原生转向图标 URI；Android 当前通常为空 */
  nextTurnIconImage?: string;
  iconDirection?: number;
  currentSegmentIndex?: number;
  currentLinkIndex?: number;
  currentPointIndex?: number;
  routeRemainTrafficLightCount?: number;
  driveDistance?: number;
  driveTime?: number;
}

export interface NaviVisualStateEvent {
  /** 是否正在显示实景路口放大图 */
  isCrossVisible: boolean;
  /** 是否正在显示 3D 路口模型；当前仅 Android 支持，iOS 恒为 false */
  isModeCrossVisible: boolean;
  isLaneInfoVisible: boolean;
}

export interface NaviLaneInfoEvent {
  laneCount: number;
  backgroundLane: number[];
  frontLane: number[];
}

/** 导航路线的连续路况分段，供统一自绘光柱消费 */
export interface NaviTrafficStatusItem {
  /** 路况状态值，跨平台统一对齐高德原始 status 枚举 */
  status: number;
  /** 该路况分段长度，单位米 */
  length: number;
  /** iOS 细粒度路况值；Android 当前无此字段 */
  fineStatus?: number;
}

/** 当前整条引导路线的路况快照 */
export interface NaviTrafficStatusesEvent {
  /** 当前整条路线长度，单位米 */
  totalLength?: number;
  /** 当前剩余距离，单位米 */
  retainDistance?: number;
  /** 当前路线的连续路况分段数组 */
  items: NaviTrafficStatusItem[];
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

export interface NaviEdgePadding {
  top?: number;
  left?: number;
  bottom?: number;
  right?: number;
}

export interface NaviAnchorPoint {
  x?: number;
  y?: number;
}

export interface NaviImageSize {
  width?: number;
  height?: number;
}

// 路线重算事件
export interface RouteRecalculateEvent {
  reason: string;
}

/**
 * 导航视图属性
 */
export interface ExpoGaodeMapNaviViewProps extends ViewProps {
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
   * 是否显示实时交通路况线
   * 说明：Android 对应 `isTrafficLine`，iOS 对应 `mapShowTraffic`
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
   * @deprecated 建议改用 `mapViewModeType`，跨平台表达力更完整
   * 说明：Android 映射 `setNaviNight`（并关闭 `setAutoNaviViewNightMode`），
   * iOS 映射 `mapViewModeType = Night/Day`；若同时传 `mapViewModeType`，以后者为准
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
   * 自定义导航车标图片
   * @platform android ios
   * 说明：iOS 对应 `setCarImage`，Android 对应 `AMapNaviViewOptions.setCarBitmap`
   */
  carImage?: NaviImageSource;

  /**
   * 自定义导航车标尺寸
   * @platform android ios
   * 说明：单位为 RN 逻辑像素（dp/pt），需同时传 `width` 与 `height` 才会生效
   */
  carImageSize?: NaviImageSize;

  /**
   * 自定义车标四角朝向图
   * @platform android
   * 说明：对应 `AMapNaviViewOptions.setFourCornersBitmap`
   */
  fourCornersImage?: NaviImageSource;

  /**
   * 自定义自车罗盘图
   * @platform ios
   * 说明：对应 `setCarCompassImage`
   */
  carCompassImage?: NaviImageSource;

  /**
   * 自定义起点标注图片
   * @platform android ios
   * 说明：iOS 对应 `setStartPointImage`，Android 对应 `setStartPointBitmap`
   */
  startPointImage?: NaviImageSource;

  /**
   * 自定义途经点标注图片
   * @platform android ios
   * 说明：iOS 对应 `setWayPointImage`，Android 对应 `setWayPointBitmap`
   */
  wayPointImage?: NaviImageSource;

  /**
   * 自定义终点标注图片
   * @platform android ios
   * 说明：iOS 对应 `setEndPointImage`，Android 对应 `setEndPointBitmap`
   */
  endPointImage?: NaviImageSource;

  /**
   * 自定义摄像头图标
   * @platform ios
   * 说明：对应 `setCameraImage`
   */
  cameraImage?: NaviImageSource;

  
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
   * 是否显示车道信息
   * @platform android
   * @default true
   */
  laneInfoVisible?: boolean;

  /**
   * 是否显示 3D 路口模型
   * @platform android
   * 说明：当前仅 Android 高德导航 SDK 提供该能力，iOS 会忽略此参数
   * @default true
   */
  modeCrossDisplay?: boolean;

  /**
   * 是否显示鹰眼路口图
   * @platform android
   * @default true
   */
  eyrieCrossDisplay?: boolean;

  /**
   * 是否显示辅助操作区域
   * @platform android
   * @default true
   */
  secondActionVisible?: boolean;

  /**
   * 是否显示备用路线覆盖物
   * @platform android
   * @default true
   */
  backupOverlayVisible?: boolean;
  
  /**
   * 是否显示拥堵气泡
   * @default true
   * @since Android 10.0.5 / iOS 10.0.900
   */
  showDriveCongestion?: boolean;
  
  /**
   * 是否显示红绿灯倒计时气泡
   * @default true
   * 提示：iOS 需开通红绿灯倒计时服务
   * @since Android 10.0.5 / iOS 10.0.900
   */
  showTrafficLightView?: boolean;


  /**
   * 导航界面顶部与状态栏的间距（单位：dp）
   * @platform android
   * 说明：当显示官方原生顶部信息区且未显式传值时，封装会自动补系统状态栏高度；
   * 若你需要关闭这层自动补偿，可显式传 `0`
   */
  androidStatusBarPaddingTop?: number;

  /**
   * 是否启用导航状态栏
   * @platform android
   * 说明：使用高德官方导航状态栏，而不是封装层手动偏移顶部 UI
   */
  naviStatusBarEnabled?: boolean;

  /**
   * 锁车态缩放级别
   * @platform android
   * @default 18
   */
  lockZoom?: number;

  /**
   * 锁车态倾斜角度
   * @platform android
   * @default 35
   */
  lockTilt?: number;

  /**
   * 是否显示鹰眼小地图
   * @platform android
   * @default false
   */
  eagleMapVisible?: boolean;

  /**
   * Android 锁车态自车锚点位置
   * @platform android
   * 说明：取值范围 `(0,1]`，传 `0` 时回退 SDK 默认值
   */
  pointToCenter?: NaviAnchorPoint;

  /**
   * 是否隐藏 Android 原生顶部导航信息卡片
   * @platform android
   * 说明：用于只保留地图/车道/路口图，自行绘制顶部 HUD
   * @default false
   */
  hideNativeTopInfoLayout?: boolean;

  /**
   * 是否在 Android 应用进入后台后显示导航常驻通知
   * @platform android
   * 说明：默认关闭；开启后会在后台通过前台服务持续更新导航进度通知
   * @default false
   */
  androidBackgroundNavigationNotificationEnabled?: boolean;

  /**
   * 是否启用 iOS 导航 Live Activity（锁屏/灵动岛）
   * @platform ios
   * 说明：开启后会在导航信息更新时自动请求/更新 Live Activity；需同时在 Info.plist 开启 `NSSupportsLiveActivities`
   * @default false
   */
  iosLiveActivityEnabled?: boolean;

  /**
   * 是否隐藏 iOS 原生车道信息条
   * @platform ios
   * 说明：用于保留官方地图/路况等元素，但把车道信息交给 RN 自绘 HUD 统一展示
   * @default false
   */
  hideNativeLaneInfoLayout?: boolean;
  
  // ========== iOS 特有属性 ==========
  
  /**
   * 是否显示路线
   * @platform ios
   * @default true
   */
  showRoute?: boolean;
  

  /**
   * 是否显示路况光柱
   * @default true
   */
  showTrafficBar?: boolean;

  /**
   * 路况光柱图位置
   * @platform ios
   * 说明：基于 `AMapNaviDriveView.tmcRouteFrame`，单位为 pt
   */
  trafficBarFrame?: NaviRect;

  /**
   * 路况光柱图颜色
   * @platform ios
   * 说明：基于 `AMapNaviDriveView.tmcRouteColor`，可分别配置不同路况颜色
   */
  trafficBarColors?: NaviTrafficBarColors;
  
  /**
   * 是否显示全览按钮
   * 
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
   * 说明：Android 对应交通图层开关按钮，iOS 对应官方交通按钮
   *
   * @default true
   */
  showTrafficButton?: boolean;
  
  /**
   * 是否显示界面元素（设为false可完全自定义界面）
   * 说明：Android / iOS 均已实现；iOS 会在导航视图就绪后应用
   * @default true
   */
  showUIElements?: boolean;
  
  /**
   * 走过的路线是否置灰
   * 
   * @default false
   */
  showGreyAfterPass?: boolean;
  
  /**
   * 是否显示牵引线（起点到终点的飞线）
   * 
   * @default true
   */
  showVectorline?: boolean;

  /**
   * 设置是否为骑步行视图
   * @platform android
   * @default false
   */
  isNaviTravelView?:boolean

  /**
   * 是否显示指南针
   * 说明：Android 默认显示；iOS 仅在显式传值时覆盖官方默认行为
   */
  showCompassEnabled?: boolean;
  
  /**
   * 是否显示红绿灯图标
   * @default true
   */
  showTrafficLights?: boolean;
  
  /**
   * 地图样式类型
   * - 0: 白天模式 (day)
   * - 1: 黑夜模式 (night)
   * - 2: 根据日出日落自动切换 (dayNightAuto)
   * - 3: 自定义地图样式 (custom)
   * 说明：Android 对应 `setNaviNight` / `setAutoNaviViewNightMode`；当前 Android 的 `3`（custom）需要额外样式路径支持，未配置时会降级为 day
   * @default 0
   */
  mapViewModeType?: NaviMapViewModeType;
  
  /**
   * 路线polyline的宽度，设置0恢复默认宽度
   * @platform ios
   */
  lineWidth?: number;

  /**
   * iOS 导航内容边距
   * @platform ios
   * 说明：用于调整导航 HUD 和地图可视区域的边距
   */
  driveViewEdgePadding?: NaviEdgePadding;

  /**
   * iOS 地图视图锚点
   * @platform ios
   * 说明：取值范围 `[0,1]`；仅在 `showUIElements=false` 时生效
   */
  screenAnchor?: NaviAnchorPoint;

  /**
   * 是否显示备选路线
   * @platform ios
   * @default true
   */
  showBackupRoute?: boolean;

  /**
   * 是否显示鹰眼小地图
   * @platform ios
   */
  showEagleMap?: boolean;
  
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

  /**
   * 导航视觉状态回调
   * 说明：用于感知路口大图 / 3D 路口 / 车道线显示状态，便于自绘 HUD 收窄或调整布局
   */
  onNaviVisualStateChange?: (event: NativeSyntheticEvent<NaviVisualStateEvent>) => void;

  /**
   * 车道信息更新回调
   * @platform android ios
   * 说明：用于自绘车道条。Android 直接对齐高德 `AMapLaneInfo` 核心字段；
   * iOS 则将 `showLaneBackInfo/laneSelectInfo` 解析为同结构数据。
   */
  onLaneInfoUpdate?: (event: NativeSyntheticEvent<NaviLaneInfoEvent>) => void;

  /**
   * 路况光柱分段数据更新回调
   * @platform android ios
   * 说明：用于自绘路况光柱。Android 基于 `getTrafficStatuses(0, 0)`，
   * iOS 基于 `updateTrafficStatus` 回调，对齐为统一结构。
   */
  onTrafficStatusesUpdate?: (event: NativeSyntheticEvent<NaviTrafficStatusesEvent>) => void;
}
