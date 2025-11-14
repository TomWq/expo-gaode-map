/**
 * 高德地图覆盖物相关类型定义
 * 基于 Expo Modules API
 */

import type { ImageSourcePropType, ViewStyle } from 'react-native';
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
  icon?: ImageSourcePropType;

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
   */
  opacity?: number;

  /**
   * 是否可拖拽
   */
  draggable?: boolean;

  /**
   * 是否平贴地图
   * @platform android
   */
  flat?: boolean;

  /**
   * 层级
   */
  zIndex?: number;

  /**
   * 覆盖物锚点比例
   * @platform android
   */
  anchor?: Point;

  /**
   * 覆盖物偏移位置
   * @platform ios
   */
  centerOffset?: Point;

  /**
   * 自定义视图
   */
  children?: React.ReactNode;

  /**
   * 点击事件
   */
  onPress?: () => void;

  /**
   * 拖拽开始事件
   */
  onDragStart?: () => void;

  /**
   * 拖拽中事件
   */
  onDrag?: () => void;

  /**
   * 拖拽结束事件
   */
  onDragEnd?: (event: { nativeEvent: LatLng }) => void;
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
  width?: number;

  /**
   * 线条颜色
   */
  color?: ColorValue;

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
   */
  gradient?: boolean;

  /**
   * 是否绘制大地线
   */
  geodesic?: boolean;

  /**
   * 是否绘制虚线
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
  onPress?: () => void;
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
  onPress?: () => void;
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
  onPress?: () => void;
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
  onPress?: (event: { nativeEvent: { index: number; item: MultiPointItem } }) => void;
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
  onPress?: (params: ClusterParams) => void;
}
