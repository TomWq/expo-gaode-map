/**
 * 高德地图覆盖物相关类型定义
 * 基于 Expo Modules API
 */

import type { ImageSourcePropType, ViewStyle, NativeSyntheticEvent } from 'react-native';
import type { ColorValue, LatLng, Point } from './common.types';

/**
 * 标记点属性
 */
export interface MarkerProps {
  /**
   * 坐标
   */
  position: LatLng;

  /**
   * 图标
   */
  icon?: string | ImageSourcePropType;

  /**
   * 图标宽度（像素）
   * 仅在使用 icon 属性时有效
   */
  iconWidth?: number;

  /**
   * 图标高度（像素）
   * 仅在使用 icon 属性时有效
   */
  iconHeight?: number;

  /**
   * 标题
   */
  title?: string;

  /**
   * 描述
   */
  snippet?: string;

  /**
   * 透明度 [0, 1]
   * @platform android
   * @note iOS 不支持
   */
  opacity?: number;

  /**
   * 是否可拖拽
   */
  draggable?: boolean;

  /**
   * 是否平贴地图
   * @platform android
   * @note iOS 不支持
   */
  flat?: boolean;

  /**
   * 层级
   * @platform android
   * @note iOS 不支持 (使用 displayPriority)
   */
  zIndex?: number;

  /**
   * 覆盖物锚点比例
   * @platform android
   * @note iOS 使用 centerOffset
   */
  anchor?: Point;

  /**
   * 覆盖物偏移位置
   * @platform ios
   */
  centerOffset?: Point;

  /**
   * 是否显示动画
   * @platform ios
   */
  animatesDrop?: boolean;

  /**
   * 大头针颜色
   * Android 支持更多颜色，iOS 只支持 red, green, purple
   */
  pinColor?: 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'violet' | 'magenta' | 'rose' | 'purple';

  /**
   * 自定义视图
   * 当使用 children 时，会将 React Native 组件渲染为图片显示在地图上
   */
  children?: React.ReactNode;

  /**
   * 自定义视图宽度（像素）
   * 仅在使用 children 属性时有效 
   * @default 80
   */
  customViewWidth?: number;

  /**
   * 自定义视图高度（像素）
   * 仅在使用 children 属性时有效
   * @default 30
   */
  customViewHeight?: number;

  /**
   * 点击事件
   */
  onPress?: (event: NativeSyntheticEvent<{}>) => void;

  /**
   * 拖拽开始事件
   */
  onDragStart?: (event: NativeSyntheticEvent<LatLng>) => void;

  /**
   * 拖拽中事件
   */
  onDrag?: (event: NativeSyntheticEvent<LatLng>) => void;

  /**
   * 拖拽结束事件
   */
  onDragEnd?: (event: NativeSyntheticEvent<LatLng>) => void;
}

/**
 * 折线属性
 */
export interface PolylineProps {
  /**
   * 节点坐标数组
   */
  points: LatLng[];

  /**
   * 线宽
   */
  strokeWidth?: number;

  /**
   * 线条颜色
   */
  strokeColor?: ColorValue;

  /**
   * 层级
   */
  zIndex?: number;

  /**
   * 分段颜色
   */
  colors?: ColorValue[];

  /**
   * 是否使用渐变色
   * @platform android
   * @note iOS 不支持
   */
  gradient?: boolean;

  /**
   * 是否绘制大地线
   * @platform android
   * @note iOS 不支持
   */
  geodesic?: boolean;

  /**
   * 是否绘制虚线
   * @platform android
   * @note iOS 不支持
   */
  dotted?: boolean;

  /**
   * 纹理图片
   * 支持网络图片(http/https)、本地文件(file://)或资源名称
   */
  texture?: string;

  /**
   * 点击事件
   */
  onPolylinePress?: (event: NativeSyntheticEvent<{}>) => void;
}

/**
 * 多边形属性
 */
export interface PolygonProps {
  /**
   * 节点坐标数组
   */
  points: LatLng[];

  /**
   * 边线宽度
   */
  strokeWidth?: number;

  /**
   * 边线颜色
   */
  strokeColor?: ColorValue;

  /**
   * 填充颜色
   */
  fillColor?: ColorValue;

  /**
   * 层级
   */
  zIndex?: number;

  /**
   * 点击事件
   */
  onPolygonPress?: (event: NativeSyntheticEvent<{}>) => void;
}

/**
 * 圆形属性
 */
export interface CircleProps {
  /**
   * 圆心坐标
   */
  center: LatLng;

  /**
   * 半径（米）
   */
  radius: number;

  /**
   * 边线宽度
   */
  strokeWidth?: number;

  /**
   * 边线颜色
   */
  strokeColor?: ColorValue;

  /**
   * 填充颜色
   */
  fillColor?: ColorValue;

  /**
   * 层级
   */
  zIndex?: number;

  /**
   * 点击事件
   */
  onCirclePress?: (event: NativeSyntheticEvent<{}>) => void;


}

/**
 * 热力图属性
 */
export interface HeatMapProps {
  /**
   * 热力点数据
   */
  data: LatLng[];

  /**
   * 热力半径（米）
   */
  radius?: number;

  /**
   * 透明度 [0, 1]
   */
  opacity?: number;
}

/**
 * 海量点标记项
 */
export interface MultiPointItem extends LatLng {
  /**
   * 唯一标识
   */
  id?: string | number;

  /**
   * 自定义数据
   */
  data?: any;
}

/**
 * 海量点属性
 */
export interface MultiPointProps {
  /**
   * 点集合
   */
  items: MultiPointItem[];

  /**
   * 图标
   */
  icon?: ImageSourcePropType;

  /**
   * 点击事件
   */
  onPress?: (event: NativeSyntheticEvent<{ index: number; item: MultiPointItem }>) => void;
}

/**
 * 聚合点参数
 */
export interface ClusterParams {
  /**
   * 唯一标识
   */
  id: number;

  /**
   * 包含的标记点数量
   */
  count: number;

  /**
   * 聚合点坐标
   */
  position: LatLng;
}

/**
 * 聚合点项
 */
export interface ClusterPoint {
  /**
   * 坐标
   */
  position: LatLng;

  /**
   * 自定义数据
   */
  properties?: any;
}

/**
 * 聚合图层属性
 */
export interface ClusterProps {
  /**
   * 聚合半径
   */
  radius?: number;

  /**
   * 聚合点样式
   */
  clusterStyle?: ViewStyle;

  /**
   * 聚合点文本样式
   */
  clusterTextStyle?: ViewStyle;

  /**
   * 坐标点列表
   */
  points: ClusterPoint[];

  /**
   * 渲染标记点
   */
  renderMarker: (item: ClusterPoint) => React.ReactNode;

  /**
   * 渲染聚合点
   */
  renderCluster?: (params: ClusterParams) => React.ReactNode;

  /**
   * 聚合点点击事件
   */
  onPress?: (event: NativeSyntheticEvent<ClusterParams>) => void;
}
