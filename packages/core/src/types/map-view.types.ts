/**
 * 高德地图视图相关类型定义
 * 基于 Expo Modules API
 */

import type { StyleProp, ViewStyle, NativeSyntheticEvent } from 'react-native';
import type { CameraPosition, CameraUpdate, LatLng, LatLngBounds, MapPoi, MapType, Point, LatLngPoint } from './common.types';
import type { Coordinates, ReGeocode, HeadingUpdate } from './location.types';

/**
 * 定位事件数据
 */
export interface LocationEvent {
  /**
   * 纬度
   */
  latitude: number;
  
  /**
   * 经度
   */
  longitude: number;
  
  /**
   * 定位精度（米）
   */
  accuracy: number;
}


/**
 * 地图相机事件
 */
export interface CameraEvent {
  /**
   * 相机位置
   */
  cameraPosition: CameraPosition;

  /**
   * 可见区域边界
   */
  latLngBounds: LatLngBounds;
}

/**
 * 地图视图属性
 */
export interface MapViewProps {
  /**
   * 地图类型
   */
  mapType?: MapType;

  /**
   * 初始相机位置
   */
  initialCameraPosition?: CameraPosition;

  /**
   * 是否显示当前定位
   */
  myLocationEnabled?: boolean;

  /**
   * 是否跟随用户位置
   * @default false
   */
  followUserLocation?: boolean;

  /**
   * 定位蓝点配置
   */
  userLocationRepresentation?: {
    /** 精度圈是否显示 @default true */
    showsAccuracyRing?: boolean;
    /** 是否显示方向指示 @default true @platform ios */
    showsHeadingIndicator?: boolean;
    /** 精度圈填充颜色 支持 '#RRGGBB'、'red' 或 ARGB 数字 */
    fillColor?: string | number;
    /** 精度圈边线颜色 */
    strokeColor?: string | number;
    /** 精度圈边线宽度 @default 0 */
    lineWidth?: number;
    /** 内部蓝色圆点是否使用律动效果 @default true @platform ios */
    enablePulseAnimation?: boolean;
    /** 定位点背景色 @default 'white' @platform ios */
    locationDotBgColor?: string | number;
    /** 定位点蓝色圆点颜色 @default 'blue' @platform ios */
    locationDotFillColor?: string | number;
    /** 定位图标 支持网络图片(http/https)、本地文件(file://)或资源名称 */
    image?: string;
    /** 定位图标宽度(像素) */
    imageWidth?: number;
    /** 定位图标高度(像素) */
    imageHeight?: number;
    /**
     * 是否显示定位蓝点 @default true
     * - iOS: 对应 mapView.showsUserLocation
     * - Android: 对应 MyLocationStyle.showMyLocation() (5.1.0+)
     */
    showMyLocation?: boolean;
    /** 定位图标锚点 U 坐标 (0.0-1.0) @platform android */
    anchorU?: number;
    /** 定位图标锚点 V 坐标 (0.0-1.0) @platform android */
    anchorV?: number;
    /**
     * 定位蓝点展现模式 @platform android
     * @default 'LOCATION_ROTATE' (连续定位、定位点旋转、移动到中心)
     *
     * 🧭 **方向指示说明**：
     * - Android 通过 locationType 实现方向指示（定位点依照设备方向旋转）
     * - iOS 通过 showsHeadingIndicator 实现方向指示（显示扇形方向指示器）
     *
     * 📱 **Android 方向指示模式**（推荐使用以下两种）：
     * - 'LOCATION_ROTATE': 定位点依照设备方向旋转，视角跟随移动到中心（默认）⭐
     * - 'LOCATION_ROTATE_NO_CENTER': 定位点依照设备方向旋转，视角不移动到中心 ⭐
     *
     * 🗺️ **其他模式**：
     * - 'SHOW': 只定位一次
     * - 'LOCATE': 定位一次，且将视角移动到地图中心点
     * - 'FOLLOW': 连续定位、跟随移动，但定位点不旋转
     * - 'MAP_ROTATE': 地图依照设备方向旋转（而非定位点旋转）
     * - 'FOLLOW_NO_CENTER': 连续定位、不移动到中心，定位点不旋转
     * - 'MAP_ROTATE_NO_CENTER': 地图依照设备方向旋转，不移动到中心
     */
    locationType?: 'SHOW' | 'LOCATE' | 'FOLLOW' | 'MAP_ROTATE' | 'LOCATION_ROTATE' |
                   'LOCATION_ROTATE_NO_CENTER' | 'FOLLOW_NO_CENTER' | 'MAP_ROTATE_NO_CENTER';
  };

  /**
   * 是否显示室内地图
   * 
   */
  indoorViewEnabled?: boolean;

  /**
   * 是否显示3D建筑
   */
  buildingsEnabled?: boolean;

  /**
   * 是否显示标注
   * @platform android
   * @note iOS 暂不支持
   */
  labelsEnabled?: boolean;

  /**
   * 是否显示指南针
   */
  compassEnabled?: boolean;

  /**
   * 是否显示缩放按钮
   * @platform android
   */
  zoomControlsEnabled?: boolean;

  /**
   * 是否显示比例尺
   */
  scaleControlsEnabled?: boolean;

  /**
   * 是否显示定位按钮
   * @platform android
   */
  myLocationButtonEnabled?: boolean;

  /**
   * 是否显示路况
   */
  trafficEnabled?: boolean;

  /**
   * 最大缩放级别
   */
  maxZoom?: number;

  /**
   * 最小缩放级别
   */
  minZoom?: number;

  /**
   * 是否启用缩放手势
   */
  zoomGesturesEnabled?: boolean;

  /**
   * 是否启用滑动手势
   */
  scrollGesturesEnabled?: boolean;

  /**
   * 是否启用旋转手势
   */
  rotateGesturesEnabled?: boolean;

  /**
   * 是否启用倾斜手势
   */
  tiltGesturesEnabled?: boolean;

  /**
   * 定位的最小更新距离（米）
   * @platform ios
   */
  distanceFilter?: number;

  /**
   * 最小更新角度（度）
   * @platform ios
   */
  headingFilter?: number;

  /**
   * 是否启用国内外地图自动切换
   * - true: 当中心点在国外时自动切换到苹果地图（iOS），国内时切换回高德地图
   * - false: 始终使用高德地图
   * @platform ios 当前仅支持 iOS 安卓因为需要使用 Google Maps SDK和谷歌服务
   * @default false
   */
  worldMapSwitchEnabled?: boolean;

  /**
   * 自定义地图样式
   *
   * 支持两种方式：
   * 1. 在线样式：提供 styleId（从高德开放平台获取）
   * 2. 本地样式：提供 styleDataPath 和可选的 extraStyleDataPath
   *
   * @example
   * // 使用在线样式
   * customMapStyle={{ styleId: "your-style-id" }}
   *
   * @example
   * // 使用本地样式文件
   * customMapStyle={{
   *   styleDataPath: "path/to/style.data",
   *   extraStyleDataPath: "path/to/extra.data"
   * }}
   */
  customMapStyle?: {
    /** 在线样式ID（从高德开放平台获取） */
    styleId?: string;
    /** 本地样式文件路径 */
    styleDataPath?: string;
    /** 额外样式文件路径（可选） */
    extraStyleDataPath?: string;
  };

  /**
   * 样式
   */
  style?: StyleProp<ViewStyle>;

  /**
   * 点击地图事件
   */
  onMapPress?: (event: NativeSyntheticEvent<LatLng>) => void;

  /**
   * 点击标注点事件
   */
  onPressPoi?: (event: NativeSyntheticEvent<MapPoi>) => void;

  /**
   * 长按地图事件
   */
  onMapLongPress?: (event: NativeSyntheticEvent<LatLng>) => void;

  /**
   * 地图状态改变事件（实时触发）
   * 可配合 `cameraEventThrottleMs` 控制事件频率
   */
  onCameraMove?: (event: NativeSyntheticEvent<CameraEvent>) => void;

  /**
   * 地图移动事件节流间隔（毫秒）
   * `0` 表示不节流
   * @default 32
   */
  cameraEventThrottleMs?: number;

  /**
   * 地图状态改变完成事件
   */
  onCameraIdle?: (event: NativeSyntheticEvent<CameraEvent>) => void;

  /**
   * 地图加载完成事件
   */
  onLoad?: (event: NativeSyntheticEvent<{}>) => void;

  /**
   * 地图定位更新事件
   */
  onLocation?: (event: NativeSyntheticEvent<LocationEvent>) => void;

  /**
   * 子组件
   */
  children?: React.ReactNode;
}


/**
 * 地图视图方法
 */
export interface MapViewMethods {
  /**
   * 移动相机
   * @param cameraPosition 目标相机位置
   * @param duration 动画时长（毫秒）
   */
  moveCamera(cameraPosition: CameraUpdate, duration?: number): Promise<void>;

  /**
   * 将屏幕坐标转换为地理坐标
   * @param point 屏幕坐标
   * @returns 地理坐标
   */
  getLatLng(point: Point): Promise<LatLng>;

  /**
   * 设置地图中心点
   * @param center 中心点
   * @param animated 是否启用动画
   */
  setCenter(center: LatLngPoint, animated?: boolean): Promise<void>;

  /**
   * 设置地图缩放级别
   * @param zoom 缩放级别
   * @param animated 是否启用动画
   */
  setZoom(zoom: number, animated?: boolean): Promise<void>;

  /**
   * 获取相机位置
   * @returns 相机位置
   */
  getCameraPosition(): Promise<CameraPosition>;

  /**
   * 截取地图快照
   * @returns 快照图片文件路径
   */
  takeSnapshot(): Promise<string>;
}

/**
 * MapView Ref 公开接口（用户使用）
 */
export interface MapViewRef {
  moveCamera(position: CameraUpdate, duration?: number): Promise<void>;
  getLatLng(point: Point): Promise<LatLng>;
  setCenter(center: LatLngPoint, animated?: boolean): Promise<void>;
  setZoom(zoom: number, animated?: boolean): Promise<void>;
  getCameraPosition(): Promise<CameraPosition>;
  takeSnapshot(): Promise<string>;
}

/**
 * Expo 模块事件类型
 * 定义了原生模块可以触发的事件
 */
export type ExpoGaodeMapModuleEvents = {
  /**
   * 定位更新事件
   * 当位置发生变化时触发
   * @param location 位置信息，包含坐标和可选的逆地理编码信息
   */
  onLocationUpdate: (location: Coordinates | ReGeocode) => void;
  
  /**
   * 方向更新事件（iOS）
   * 当设备方向发生变化时触发
   * @param heading 方向信息
   */
  onHeadingUpdate: (heading: HeadingUpdate) => void;
};
