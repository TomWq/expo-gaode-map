/**
 * 高德地图原生模块类型定义
 */

import type { NativeModule } from 'expo';

import type {
  LatLng,
  SDKConfig,
  PermissionStatus,
  LatLngPoint,
} from './common.types';
import type {
  CoordinateType,
  Coordinates,
  ReGeocode,
  LocationMode,
  LocationAccuracy,
  LocationListener,
} from './location.types';
import type { ExpoGaodeMapModuleEvents } from './map-view.types';

export interface ExpoGaodeMapModule extends NativeModule<ExpoGaodeMapModuleEvents> {
  /**
   * 原生事件订阅方法
   */
  addListener(
    eventName: keyof ExpoGaodeMapModuleEvents | string,
    listener: (...args: any[]) => void,
  ): { remove: () => void };


  /**
   * 初始化高德地图 SDK
   * @param config SDK 配置参数，包含 Android 和 iOS 的 API Key
   */
  initSDK(config: SDKConfig): void;

  /**
   * 设置是否加载世界向量地图（海外地图）
   * 必须在地图初始化之前调用
   * 世界地图为高级服务，需要开通相关权限
   */
  setLoadWorldVectorMap(enabled: boolean): void;

  /**
   * 获取高德地图 SDK 版本号
   * @returns SDK 版本字符串
   */
  getVersion(): string;

  /**
   * 开始连续定位
   * 启动后会持续接收位置更新，通过 onLocationUpdate 事件回调
   */
  start(): void;

  /**
   * 停止定位
   * 停止接收位置更新
   */
  stop(): void;

  /**
   * 检查是否正在定位
   * @returns 是否正在定位
   */
  isStarted(): Promise<boolean>;

  /**
   * 获取当前位置（单次定位）
   * @returns 位置信息，包含坐标和可选的逆地理编码信息
   */
  getCurrentLocation(): Promise<Coordinates | ReGeocode>;

  /**
   * 坐标转换
   * 将其他坐标系的坐标转换为高德地图使用的 GCJ-02 坐标系
   * @param coordinate 需要转换的坐标
   * @param type 原坐标系类型
   */
  coordinateConvert(coordinate: LatLngPoint, type: CoordinateType): Promise<LatLng>;


  /**
   * 设置是否返回逆地理编码信息
   * @param isReGeocode true: 返回地址信息; false: 只返回坐标
   */
  setLocatingWithReGeocode(isReGeocode: boolean): void;

  /**
   * 设置定位模式（Android）
   * @param mode 定位模式：高精度/低功耗/仅设备
   */
  setLocationMode(mode: LocationMode): void;

  /**
   * 设置定位间隔（毫秒）
   * @param interval 定位间隔时间，单位毫秒，默认 2000ms
   */
  setInterval(interval: number): void;

  /**
   * 设置是否单次定位（Android）
   * @param isOnceLocation true: 单次定位; false: 连续定位
   */
  setOnceLocation(isOnceLocation: boolean): void;

  /**
   * 设置是否使用设备传感器（Android）
   * @param sensorEnable true: 使用传感器; false: 不使用
   */
  setSensorEnable(sensorEnable: boolean): void;

  /**
   * 设置是否允许 WiFi 扫描（Android）
   * @param wifiScan true: 允许; false: 不允许
   */
  setWifiScan(wifiScan: boolean): void;

  /**
   * 设置是否 GPS 优先（Android）
   * @param gpsFirst true: GPS 优先; false: 网络优先
   */
  setGpsFirst(gpsFirst: boolean): void;

  /**
   * 设置是否等待 WiFi 列表刷新（Android）
   * @param onceLocationLatest true: 等待; false: 不等待
   */
  setOnceLocationLatest(onceLocationLatest: boolean): void;

  /**
   * 设置逆地理编码语言
   * @param language 语言代码，如 "zh-CN", "en"
   */
  setGeoLanguage(language: string): void;

  /**
   * 设置是否使用缓存策略（Android）
   * @param locationCacheEnable true: 使用缓存; false: 不使用
   */
  setLocationCacheEnable(locationCacheEnable: boolean): void;

  /**
   * 设置网络请求超时时间（Android）
   * @param httpTimeOut 超时时间，单位毫秒
   */
  setHttpTimeOut(httpTimeOut: number): void;

  /**
   * 设置期望的定位精度（iOS）
   * @param accuracy 精度级别：最佳/10米/100米/1公里/3公里
   */
  setDesiredAccuracy(accuracy: LocationAccuracy): void;

  /**
   * 设置定位超时时间（秒）
   * @param timeout 超时时间，单位秒，默认 10 秒
   */
  setLocationTimeout(timeout: number): void;

  /**
   * 设置逆地理编码超时时间（秒）
   * @param timeout 超时时间，单位秒，默认 5 秒
   */
  setReGeocodeTimeout(timeout: number): void;

  /**
   * 设置距离过滤器（米）（iOS）
   * 只有移动超过指定距离才会更新位置
   * @param distance 距离阈值，单位米
   */
  setDistanceFilter(distance: number): void;

  /**
   * 设置是否自动暂停位置更新（iOS）
   * @param pauses true: 自动暂停; false: 不暂停
   */
  setPausesLocationUpdatesAutomatically(pauses: boolean): void;

  /**
   * 设置是否允许后台定位（iOS）
   * @param allows true: 允许; false: 不允许
   */
  setAllowsBackgroundLocationUpdates(allows: boolean): void;

  /**
   * iOS 是否已启用后台定位配置
   */
  readonly isBackgroundLocationEnabled: boolean;

  /**
   * 设置定位协议
   * @param protocol 协议类型
   */
  setLocationProtocol(protocol: string): void;

  /**
   * 开始更新设备方向（罗盘朝向）（iOS）
   */
  startUpdatingHeading(): void;

  /**
   * 停止更新设备方向（iOS）
   */
  stopUpdatingHeading(): void;

  /**
   * 检查前台位置权限状态（增强版）
   * @returns 详细的权限状态信息
   */
  checkLocationPermission(): Promise<PermissionStatus>;

  /**
   * 请求前台位置权限（增强版）
   * @returns 请求后的权限状态
   */
  requestLocationPermission(): Promise<PermissionStatus>;

  /**
   * 请求后台位置权限（Android 10+、iOS）
   * 注意：必须在前台权限已授予后才能请求
   * @returns 请求后的权限状态
   */
  requestBackgroundLocationPermission(): Promise<PermissionStatus>;

  /**
   * 打开应用设置页面
   * 引导用户手动授予权限（当权限被永久拒绝时使用）
   */
  openAppSettings(): void;

  /**
   * 检查原生 SDK 是否已配置 API Key
   * @returns 是否已配置
   */
  isNativeSDKConfigured(): boolean;

  /**
   * 添加定位监听器（便捷方法）
   * 封装原生事件订阅，返回带 remove 的订阅对象
   */
  addLocationListener(listener: LocationListener): { remove: () => void };

  /**
   * 计算两个坐标点之间的距离
   * @param coordinate1 第一个坐标点
   * @param coordinate2 第二个坐标点
   * @returns 两点之间的距离（单位：米）
   */
  distanceBetweenCoordinates(coordinate1: LatLngPoint, coordinate2: LatLngPoint): number;

   // ==================== 几何计算 ====================

  /**
   * 判断点是否在圆内
   * @param point 要判断的点
   * @param center 圆心坐标
   * @param radius 圆半径（单位：米）
   * @returns 是否在圆内
   */
  isPointInCircle(point: LatLngPoint, center: LatLngPoint, radius: number): boolean;

  /**
   * 判断点是否在多边形内
   * @param point 要判断的点
   * @param polygon 多边形的顶点坐标数组，支持嵌套数组（多边形空洞）
   * @returns 是否在多边形内
   */
  isPointInPolygon(point: LatLngPoint, polygon: LatLngPoint[] | LatLngPoint[][]): boolean;

  /**
   * 计算多边形面积
   * @param polygon 多边形的顶点坐标数组，支持嵌套数组（多边形空洞，会自动展平计算）
   * @returns 面积（单位：平方米）
   */
  calculatePolygonArea(polygon: LatLngPoint[] | LatLngPoint[][]): number;

  /**
   * 计算矩形面积
   * @param southWest 西南角坐标
   * @param northEast 东北角坐标
   * @returns 面积（单位：平方米）
   */
  calculateRectangleArea(southWest: LatLngPoint, northEast: LatLngPoint): number;

  /**
   * 获取路径上距离目标点最近的点
   * @param path 路径点集合
   * @param target 目标点
   * @returns 最近点信息，包含坐标、索引和距离
   */
  getNearestPointOnPath(path: LatLngPoint[], target: LatLngPoint): {
    latitude: number;
    longitude: number;
    index: number;
    distanceMeters: number;
  } | null;

  /**
   * 计算多边形质心
   * @param polygon 多边形顶点坐标数组，支持嵌套数组
   * @returns 质心坐标
   */
  calculateCentroid(polygon: LatLngPoint[] | LatLngPoint[][]): LatLng | null;

  /**
   * 计算路径边界和中心点
   * @param points 路径点
   * @returns 边界和中心点
   */
  calculatePathBounds(points: LatLngPoint[]): {
    north: number;
    south: number;
    east: number;
    west: number;
    center: LatLngPoint;
  } | null;

  /**
   * GeoHash 编码
   * @param coordinate 坐标点
   * @param precision 精度 (1-12)
   * @returns GeoHash 字符串
   */
  encodeGeoHash(coordinate: LatLngPoint, precision: number): string;

  /**
   * 轨迹抽稀 (RDP 算法)
   * @param points 原始轨迹点
   * @param tolerance 允许误差(米)
   * @returns 简化后的轨迹点
   */
  simplifyPolyline(points: LatLngPoint[], tolerance: number): LatLng[];

  /**
   * 计算路径总长度
   * @param points 路径点
   * @returns 长度(米)
   */
  calculatePathLength(points: LatLngPoint[]): number;

  /**
   * 解析高德地图 API 返回的 Polyline 字符串
   * 格式: "lng,lat;lng,lat;..."
   * @param polylineStr 高德原始 polyline 字符串
   * @returns 解析后的点集
   */
  parsePolyline(polylineStr: string): LatLng[];

  /**
   * 获取路径上指定距离的点
   * @param points 路径点
   * @param distance 距离起点的米数
   * @returns 点信息(坐标+角度)
   */
  getPointAtDistance(points: LatLngPoint[], distance: number): {
    latitude: number;
    longitude: number;
    angle: number;
  } | null;
}
