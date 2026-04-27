import type { LatLng, LatLngPoint } from '../types';
import { ErrorHandler, ErrorLogger } from '../utils/ErrorHandler';
import { normalizeLatLng, normalizeLatLngList } from '../utils/GeoUtils';
import { nativeModule } from './nativeModule';

export const geometryMethods = {


  /**
   * 计算两个坐标点之间的距离
   * @param coordinate1 第一个坐标点
   * @param coordinate2 第二个坐标点
   * @returns 两点之间的距离（单位：米）
   */
  distanceBetweenCoordinates(coordinate1: LatLngPoint, coordinate2: LatLngPoint): number {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.distanceBetweenCoordinates(
        normalizeLatLng(coordinate1),
        normalizeLatLng(coordinate2)
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '计算距离');
    }
  },

  /**
   * 根据多个坐标点计算可同时可见的推荐缩放级别
   * @param points 坐标点集合（至少 1 个）
   * @param options 视口与缩放边界选项
   * @returns 推荐 zoom
   */
  calculateFitZoom(
    points: LatLngPoint[],
    options: {
      viewportWidthPx?: number;
      viewportHeightPx?: number;
      paddingPx?: number;
      minZoom?: number;
      maxZoom?: number;
    } = {}
  ): number {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }

    const normalized = normalizeLatLngList(points);
    const minZoom = options.minZoom ?? 3;
    const maxZoom = options.maxZoom ?? 20;
    if (normalized.length === 0) {
      return minZoom;
    }

    try {
      return nativeModule.calculateFitZoom(
        normalized,
        options.viewportWidthPx ?? 390,
        options.viewportHeightPx ?? 844,
        options.paddingPx ?? 48,
        minZoom,
        maxZoom
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '计算拟合缩放级别');
    }
  },

  /**
   * 判断点是否在圆内
   * @param point 要判断的点
   * @param center 圆心坐标
   * @param radius 圆半径（单位：米）
   * @returns 是否在圆内
   */
  isPointInCircle(point: LatLngPoint, center: LatLngPoint, radius: number): boolean {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.isPointInCircle(
        normalizeLatLng(point),
        normalizeLatLng(center),
        radius
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '判断点是否在圆内');
    }
  },

  /**
   * 判断点是否在多边形内
   * @param point 要判断的点
   * @param polygon 多边形的顶点坐标数组，支持嵌套数组（多边形空洞）
   * @returns 是否在多边形内
   */
  isPointInPolygon(point: LatLngPoint, polygon: LatLngPoint[] | LatLngPoint[][]): boolean {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.isPointInPolygon(
        normalizeLatLng(point),
        normalizeLatLngList(polygon)
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '判断点是否在多边形内');
    }
  },

  /**
   * 计算多边形面积
   * @param polygon 多边形的顶点坐标数组，支持嵌套数组（多边形空洞）
   * @returns 面积（单位：平方米）
   */
  calculatePolygonArea(polygon: LatLngPoint[] | LatLngPoint[][]): number {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.calculatePolygonArea(normalizeLatLngList(polygon));
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '计算多边形面积');
    }
  },

  /**
   * 计算矩形面积
   * @param southWest 西南角坐标
   * @param northEast 东北角坐标
   * @returns 面积（单位：平方米）
   */
  calculateRectangleArea(southWest: LatLngPoint, northEast: LatLngPoint): number {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.calculateRectangleArea(
        normalizeLatLng(southWest),
        normalizeLatLng(northEast)
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '计算矩形面积');
    }
  },

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
  } | null {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.getNearestPointOnPath(
        normalizeLatLngList(path),
        normalizeLatLng(target)
      );
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '获取最近点');
    }
  },

  /**
   * 计算多边形质心
   * @param polygon 多边形顶点坐标数组，支持嵌套数组
   * @returns 质心坐标
   */
  calculateCentroid(polygon: LatLngPoint[] | LatLngPoint[][]): LatLng | null {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.calculateCentroid(normalizeLatLngList(polygon));
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '计算质心');
    }
  },

  /**
   * 计算路径边界和中心点
   * @param points 路径点集合
   * @returns 边界信息，包含 north, south, east, west 和 center
   */
  calculatePathBounds(points: LatLngPoint[]): {
    north: number;
    south: number;
    east: number;
    west: number;
    center: LatLngPoint;
  } | null {
    if (!nativeModule) return null;
    try {
      const normalized = normalizeLatLngList(points);
      if (normalized.length === 0) return null;
      return nativeModule.calculatePathBounds(normalized);
    } catch (error) {
      ErrorLogger.warn('calculatePathBounds 失败', { pointsCount: points.length, error });
      return null;
    }
  },

  /**
   * GeoHash 编码
   * @param coordinate 坐标点
   * @param precision 精度 (1-12)
   * @returns GeoHash 字符串
   */
  encodeGeoHash(coordinate: LatLngPoint, precision: number): string {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.encodeGeoHash(normalizeLatLng(coordinate), precision);
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, 'GeoHash 编码');
    }
  },

  /**
   * 轨迹抽稀 (RDP 算法)
   * @param points 原始轨迹点
   * @param tolerance 允许误差(米)
   * @returns 简化后的轨迹点
   */
  simplifyPolyline(points: LatLngPoint[], tolerance: number): LatLng[] {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.simplifyPolyline(normalizeLatLngList(points), tolerance);
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '轨迹抽稀');
    }
  },

  /**
   * 计算路径总长度
   * @param points 路径点
   * @returns 长度(米)
   */
  calculatePathLength(points: LatLngPoint[]): number {
    if (!nativeModule) return 0;
    try {
      return nativeModule.calculatePathLength(normalizeLatLngList(points));
    } catch (error) {
      ErrorLogger.warn('calculatePathLength 失败', { pointsCount: points.length, error });
      return 0;
    }
  },

  /**
   * 解析高德地图 API 返回的 Polyline 字符串
   * 格式: "lng,lat;lng,lat;..."
   * @param polylineStr 高德原始 polyline 字符串，或包含 polyline 属性的对象
   * @returns 解析后的点集
   */
  parsePolyline(polylineStr: string | { polyline: string }): LatLng[] {
    if (!nativeModule || !polylineStr) return [];
    try {
      // 兼容性处理：如果传入的是对象 { polyline: '...' }，自动提取字符串
      let finalStr: string = '';
      if (typeof polylineStr === 'object' && polylineStr !== null && 'polyline' in polylineStr) {
        finalStr = polylineStr.polyline || '';
      } else if (typeof polylineStr === 'string') {
        finalStr = polylineStr;
      }

      if (!finalStr) return [];
      return nativeModule.parsePolyline(finalStr);
    } catch (error) {
      ErrorLogger.warn('解析 Polyline 失败', { polylineStr, error });
      return [];
    }
  },

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
  } | null {
    if (!nativeModule) {
      throw ErrorHandler.nativeModuleUnavailable();
    }
    try {
      return nativeModule.getPointAtDistance(normalizeLatLngList(points), distance);
    } catch (error) {
      throw ErrorHandler.wrapNativeError(error, '获取路径上的点');
    }
  },

  /**
   * 经纬度转换为地图瓦片坐标
   * @param coordinate 经纬度点
   * @param zoom 缩放级别
   * @returns 瓦片坐标(x, y, z)
   */
  latLngToTile(coordinate: LatLngPoint, zoom: number): { x: number; y: number; z: number } | null {
    if (!nativeModule) return null;
    try {
      return nativeModule.latLngToTile(normalizeLatLng(coordinate), zoom);
    } catch (error) {
      ErrorLogger.warn('latLngToTile 失败', { coordinate, zoom, error });
      return null;
    }
  },

  /**
   * 地图瓦片坐标转换为经纬度
   * @param tile 瓦片坐标(x, y, z)
   * @returns 经纬度点
   */
  tileToLatLng(tile: { x: number; y: number; z: number }): LatLng | null {
    if (!nativeModule) return null;
    try {
      return nativeModule.tileToLatLng(tile);
    } catch (error) {
      ErrorLogger.warn('tileToLatLng 失败', { tile, error });
      return null;
    }
  },

  /**
   * 经纬度转换为地图像素坐标
   * @param coordinate 经纬度点
   * @param zoom 缩放级别
   * @returns 像素坐标(x, y)
   */
  latLngToPixel(coordinate: LatLngPoint, zoom: number): { x: number; y: number } | null {
    if (!nativeModule) return null;
    try {
      return nativeModule.latLngToPixel(normalizeLatLng(coordinate), zoom);
    } catch (error) {
      ErrorLogger.warn('latLngToPixel 失败', { coordinate, zoom, error });
      return null;
    }
  },

  /**
   * 地图像素坐标转换为经纬度
   * @param pixel 像素坐标(x, y)
   * @param zoom 缩放级别
   * @returns 经纬度点
   */
  pixelToLatLng(pixel: { x: number; y: number }, zoom: number): LatLng | null {
    if (!nativeModule) return null;
    try {
      return nativeModule.pixelToLatLng(pixel, zoom);
    } catch (error) {
      ErrorLogger.warn('pixelToLatLng 失败', { pixel, zoom, error });
      return null;
    }
  },

  /**
   * 批量地理围栏检测
   * @param point 待检查的点
   * @param polygons 多边形数组，格式为 LatLngPoint[][] 或 LatLngPoint[][][]
   * @returns 包含点索引的数组（-1 表示不在任何多边形内）
   */
  findPointInPolygons(point: LatLngPoint, polygons: LatLngPoint[][] | LatLngPoint[][][]): number {
    if (!nativeModule) return -1;
    try {
      const normalizedPoint = normalizeLatLng(point);

      // 处理三维数组 (LatLngPoint[][][]) 和二维数组 (LatLngPoint[][])
      if (Array.isArray(polygons[0]) && Array.isArray(polygons[0][0])) {
        const normalizedMultiPolygons = (polygons as LatLngPoint[][][]).map((polygonRings) =>
          normalizeLatLngList(polygonRings)
        );

        for (let index = 0; index < normalizedMultiPolygons.length; index += 1) {
          if (nativeModule.isPointInPolygon(normalizedPoint, normalizedMultiPolygons[index])) {
            return index;
          }
        }

        return -1;
      }

      const normalizedPolygons = polygons as LatLngPoint[][];
      const processedPolygons = normalizedPolygons.map((p) => normalizeLatLngList(p));
      return nativeModule.findPointInPolygons(normalizedPoint, processedPolygons);
    } catch (error) {
      ErrorLogger.warn('findPointInPolygons 失败', { point, error });
      return -1;
    }
  },

  /**
   * 生成网格聚合数据 (常用于展示网格聚合图或大规模点数据处理)
   * @param points 包含经纬度和权重的点数组
   * @param gridSizeMeters 网格大小（米）
   * @returns 包含经纬度和强度的网格点数组
   */
  generateHeatmapGrid(
    points: Array<LatLngPoint & { weight?: number }>,
    gridSizeMeters: number
  ): Array<{ latitude: number; longitude: number; intensity: number }> {
    if (!nativeModule || points.length === 0) return [];
    try {
      return nativeModule.generateHeatmapGrid(points, gridSizeMeters);
    } catch (error) {
      ErrorLogger.warn('generateHeatmapGrid 失败', { pointsCount: points.length, gridSizeMeters, error });
      return [];
    }
  },
};
