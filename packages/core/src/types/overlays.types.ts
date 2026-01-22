/**
 * 高德地图覆盖物相关类型定义
 * 基于 Expo Modules API
 */

import type { ImageSourcePropType, ViewStyle, NativeSyntheticEvent, TextStyle } from 'react-native';
import type { ColorValue, LatLng, LatLngPoint, Point } from './common.types';

/**
 * 标记点属性
 */
export interface MarkerProps {
  /**
   * 坐标
   * 支持对象 {latitude, longitude} 或数组 [longitude, latitude]
   */
  position: LatLngPoint;

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
   * @default false
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
   * 缓存 key 建议使用 提高性能
   */
  cacheKey?: string;

  /**
   * 是否开启生长动画
   * @default false
   */
  growAnimation?: boolean;

  /**
   * 点击事件
   */
  onMarkerPress?: (event: NativeSyntheticEvent<LatLng>) => void;

  /**
   * 拖拽开始事件
   */
  onMarkerDragStart?: (event: NativeSyntheticEvent<LatLng>) => void;

  /**
   * 拖拽中事件
   */
  onMarkerDrag?: (event: NativeSyntheticEvent<LatLng>) => void;

  /**
   * 拖拽结束事件
   */
  onMarkerDragEnd?: (event: NativeSyntheticEvent<LatLng>) => void;

  /**
   * 平滑移动轨迹点数组
   * 设置后，Marker 会沿着轨迹平滑移动
   */
  smoothMovePath?: LatLng[];

  /**
   * 平滑移动总时长（秒）
   * @default 10
   */
  smoothMoveDuration?: number;
}

/**
 * 折线属性
 */
export interface PolylineProps {
  /**
   * 节点坐标数组
   * 支持对象 {latitude, longitude} 或数组 [longitude, latitude]
   */
  points: LatLngPoint[];

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
   * 轨迹抽稀容差（米）
   * 设置大于 0 的值时启用 RDP 算法简化轨迹点
   * 建议值为 1.0 - 5.0，值越大简化程度越高
   */
  simplificationTolerance?: number;

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
   * 支持对象 {latitude, longitude} 或数组 [longitude, latitude]
   * 同时也支持嵌套数组格式 [[p1, p2, ...], [p3, p4, ...]]，用于定义带孔的多边形
   * 其中第一个数组为外轮廓，后续数组为内孔
   */
  points: LatLngPoint[] | LatLngPoint[][];

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

  /**
   * 轨迹抽稀容差（米）
   * 设置大于 0 的值时启用 RDP 算法简化多边形边界
   * 建议值为 1.0 - 5.0，值越大简化程度越高
   */
  simplificationTolerance?: number;

  /**
   * 简化完成事件
   */
  onPolygonSimplified?: (event: NativeSyntheticEvent<{ originalCount: number; simplifiedCount: number }>) => void;
}

/**
 * 圆形属性
 */
export interface CircleProps {
  /**
   * 圆心坐标
   * 支持对象 {latitude, longitude} 或数组 [longitude, latitude]
   */
  center: LatLngPoint;

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
 * 热力图渐变配置
 */
export interface HeatMapGradient {
  /**
   * 颜色数组
   * 支持 '#RRGGBB', 'rgba()', 'red' 等
   */
  colors: ColorValue[];
  
  /**
   * 颜色起始点数组 [0-1]
   * 必须递增，例如 [0.2, 0.5, 0.9]
   */
  startPoints: number[];
}

/**
 * 热力图属性
 */
export interface HeatMapProps {
  /**
   * 热力点数据
   * 支持对象 {latitude, longitude} 或数组 [longitude, latitude]
   */
  data: LatLngPoint[];

  /**
   * 是否显示热力图（用于避免频繁卸载/重建导致卡顿）
   */
  visible?: boolean;

  /**
   * 热力半径（米）
   */
  radius?: number;

  /**
   * 透明度 [0, 1]
   */
  opacity?: number;

  /**
   * 热力图渐变配置
   */
  gradient?: HeatMapGradient;

  /**
   * 是否开启高清热力图（Retina适配）
   * @platform ios
   */
  allowRetinaAdapting?: boolean;
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
  data?: unknown;
}

/**
 * 海量点属性
 */
export interface MultiPointProps {
  /**
   * 点集合
   */
  points: MultiPointItem[];

  /**
   * 图标
   */
  icon?: string | ImageSourcePropType; 

  /**
   * 图标宽度
   */
  iconWidth?: number;

  /**
   * 图标高度
   */
  iconHeight?: number;

  /**
   * 点击事件
   */
  onMultiPointPress?: (event: NativeSyntheticEvent<{ index: number; item: MultiPointItem }>) => void;
}

/**
 * 聚合点参数
 */
export interface ClusterParams {
  /**
   * 包含的标记点数量
   */
  count: number;

  /**
   * 纬度
   */
  latitude: number;

  /**
   * 经度
   */
  longitude: number;

  /**
   * 包含的点数据列表
   */
  pois?: ClusterPoint[];

  /**
   * 唯一标识 (兼容性保留)
   */
  id?: number;

  /**
   * 聚合点坐标 (兼容性保留)
   */
  position?: LatLng;
}

/**
 * 聚合点项
 */
export interface ClusterPoint {
  /**
   * 纬度（原生 Cluster 使用）
   */
  latitude?: number;
  
  /**
   * 经度（原生 Cluster 使用）
   */
  longitude?: number;

  /**
   * 坐标（JS ClusterLayer 使用）
   */
  position?: LatLngPoint;

  /**
   * 自定义数据
   */
  properties?: Record<string, unknown>;
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
   * 最小聚合数量
   */
  minClusterSize?: number;

  /**
   * 聚合点样式
   */
  clusterStyle?: ViewStyle;

  /**
   * 分级聚合样式配置
   * 根据聚合数量动态设置样式
   */
  clusterBuckets?: ({ minPoints: number } & ViewStyle)[];

  /**
   * 聚合点文本样式
   */
  clusterTextStyle?: TextStyle;

  /**
   * 坐标点列表
   */
  points: ClusterPoint[];

  /**
   * 暂未实现，请勿使用
   */
  renderMarker?: (item: ClusterPoint) => React.ReactNode;

  /**
   * 暂未实现，请勿使用
   */
  renderCluster?: (params: ClusterParams) => React.ReactNode;

  /**
   * 聚合点点击事件
   */
  onClusterPress?: (event: NativeSyntheticEvent<ClusterParams>) => void;
}
