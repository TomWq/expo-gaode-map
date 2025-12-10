/**
 * 高德地图视图相关类型定义
 * 基于 Expo Modules API
 */

import type { StyleProp, ViewStyle, NativeSyntheticEvent } from 'react-native';
import type { CameraPosition, LatLng, LatLngBounds, MapPoi, MapType, Point } from './common.types';

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
   */
  onCameraMove?: (event: NativeSyntheticEvent<CameraEvent>) => void;

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
  moveCamera(cameraPosition: CameraPosition, duration?: number): void;

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
  setCenter(center: LatLng, animated?: boolean): void;

  /**
   * 设置地图缩放级别
   * @param zoom 缩放级别
   * @param animated 是否启用动画
   */
  setZoom(zoom: number, animated?: boolean): void;

  /**
   * 获取相机位置
   * @returns 相机位置
   */
  getCameraPosition(): Promise<CameraPosition>;

  
}

/**
 * MapView Ref 公开接口（用户使用）
 */
export interface MapViewRef {
  moveCamera(position: CameraPosition, duration?: number): Promise<void>;
  getLatLng(point: Point): Promise<LatLng>;
  setCenter(center: LatLng, animated?: boolean): Promise<void>;
  setZoom(zoom: number, animated?: boolean): Promise<void>;
  getCameraPosition(): Promise<CameraPosition>;

}

