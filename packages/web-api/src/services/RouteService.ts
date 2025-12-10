import { GaodeWebAPIClient } from '../utils/client';
import type {
  Coordinate,
  DrivingRouteParams,
  DrivingRouteResponse,
  WalkingRouteParams,
  WalkingRouteResponse,
  BicyclingRouteParams,
  BicyclingRouteResponse,
  ElectricBikeRouteParams,
  ElectricBikeRouteResponse,
  TransitRouteParams,
  TransitRouteResponse,
} from '../types/route.types';

/**
 * 路径规划服务
 * 提供驾车、步行、骑行、电动车、公交等多种出行方式的路径规划
 */
export class RouteService {
  constructor(private client: GaodeWebAPIClient) {}

  /**
   * 坐标转换辅助方法
   */
  private formatCoordinate(coord: Coordinate): string {
    if (typeof coord === 'string') {
      return coord;
    }
    return `${coord.longitude},${coord.latitude}`;
  }

  /**
   * 驾车路径规划
   * @param origin 出发点坐标
   * @param destination 目的地坐标
   * @param options 可选参数
   * @returns 驾车路径规划结果
   * 
   * @example
   * ```typescript
   * // 基础用法
   * const result = await api.route.driving(
   *   '116.481028,39.989643',
   *   '116.434446,39.90816'
   * );
   * 
   * // 带途经点和策略（新版 V5 API）
   * const result = await api.route.driving(
   *   { longitude: 116.481028, latitude: 39.989643 },
   *   { longitude: 116.434446, latitude: 39.90816 },
   *   {
   *     waypoints: ['116.45,39.95', '116.46,39.94'],
   *     strategy: DrivingStrategy.AVOID_JAM,
   *     show_fields: 'cost,navi,polyline',
   *     plate: '京AHA322',
   *     cartype: 0
   *   }
   * );
   * ```
   */
  async driving(
    origin: Coordinate,
    destination: Coordinate,
    options?: Omit<DrivingRouteParams, 'origin' | 'destination'>
  ): Promise<DrivingRouteResponse> {
    const params: Record<string, any> = {
      origin: this.formatCoordinate(origin),
      destination: this.formatCoordinate(destination),
      ...options,
    };

    // 处理途经点
    if (options?.waypoints) {
      if (Array.isArray(options.waypoints)) {
        params.waypoints = options.waypoints.map(wp => this.formatCoordinate(wp)).join(';');
      } else {
        params.waypoints = this.formatCoordinate(options.waypoints);
      }
    }

    return this.client.request<DrivingRouteResponse>('/v5/direction/driving', params);
  }

  /**
   * 步行路径规划
   * @param origin 出发点坐标
   * @param destination 目的地坐标
   * @param options 可选参数
   * @returns 步行路径规划结果
   * 
   * @example
   * ```typescript
   * const result = await api.route.walking(
   *   '116.481028,39.989643',
   *   '116.434446,39.90816'
   * );
   * 
   * console.log(`步行距离：${result.route.paths[0].distance}米`);
   * console.log(`预计时间：${result.route.paths[0].duration}秒`);
   * ```
   */
  async walking(
    origin: Coordinate,
    destination: Coordinate,
    options?: Omit<WalkingRouteParams, 'origin' | 'destination'>
  ): Promise<WalkingRouteResponse> {
    const params: Record<string, any> = {
      origin: this.formatCoordinate(origin),
      destination: this.formatCoordinate(destination),
      ...options,
    };

    return this.client.request<WalkingRouteResponse>('/v5/direction/walking', params);
  }

  /**
   * 骑行路径规划
   * @param origin 出发点坐标
   * @param destination 目的地坐标
   * @param options 可选参数
   * @returns 骑行路径规划结果
   * 
   * @example
   * ```typescript
   * const result = await api.route.bicycling(
   *   '116.481028,39.989643',
   *   '116.434446,39.90816',
   *   {
   *     alternative_route: 2,
   *     show_fields: 'cost,navi,polyline'
   *   }
   * );
   * ```
   */
  async bicycling(
    origin: Coordinate,
    destination: Coordinate,
    options?: Omit<BicyclingRouteParams, 'origin' | 'destination'>
  ): Promise<BicyclingRouteResponse> {
    const params: Record<string, any> = {
      origin: this.formatCoordinate(origin),
      destination: this.formatCoordinate(destination),
      ...options,
    };

    return this.client.request<BicyclingRouteResponse>('/v5/direction/bicycling', params);
  }

  /**
   * 电动车路径规划
   * @param origin 出发点坐标
   * @param destination 目的地坐标
   * @param options 可选参数
   * @returns 电动车路径规划结果
   * 
   * @example
   * ```typescript
   * const result = await api.route.electr icBike(
   *   '116.481028,39.989643',
   *   '116.434446,39.90816'
   * );
   * ```
   */
  async electricBike(
    origin: Coordinate,
    destination: Coordinate,
    options?: Omit<ElectricBikeRouteParams, 'origin' | 'destination'>
  ): Promise<ElectricBikeRouteResponse> {
    const params: Record<string, any> = {
      origin: this.formatCoordinate(origin),
      destination: this.formatCoordinate(destination),
      ...options,
    };

    return this.client.request<ElectricBikeRouteResponse>('/v5/direction/electrobike', params);
  }

  /**
   * 公交路径规划（新版 V5 API）
   * @param origin 出发点坐标
   * @param destination 目的地坐标
   * @param city1 起点所在城市（citycode，必填）
   * @param city2 目的地所在城市（citycode，必填）
   * @param options 可选参数
   * @returns 公交路径规划结果
   *
   * @example
   * ```typescript
   * // 同城公交（北京市 citycode: 010）
   * const result = await api.route.transit(
   *   '116.481028,39.989643',
   *   '116.434446,39.90816',
   *   '010',
   *   '010',
   *   {
   *     strategy: TransitStrategy.RECOMMENDED,
   *     show_fields: 'cost,polyline'
   *   }
   * );
   *
   * // 跨城公交（北京到上海，上海 citycode: 021）
   * const result = await api.route.transit(
   *   '116.481028,39.989643',
   *   '121.472644,31.231706',
   *   '010',
   *   '021',
   *   {
   *     strategy: TransitStrategy.TIME_FIRST,
   *     AlternativeRoute: 3
   *   }
   * );
   *
   * // 地铁图模式（起终点都是地铁站，需要提供 POI ID）
   * const result = await api.route.transit(
   *   '116.481028,39.989643',
   *   '116.434446,39.90816',
   *   '010',
   *   '010',
   *   {
   *     strategy: TransitStrategy.SUBWAY_MAP,
   *     originpoi: 'B000A83M2Z',
   *     destinationpoi: 'B000A83M30'
   *   }
   * );
   * ```
   */
  async transit(
    origin: Coordinate,
    destination: Coordinate,
    city1: string,
    city2: string,
    options?: Omit<TransitRouteParams, 'origin' | 'destination' | 'city1' | 'city2'>
  ): Promise<TransitRouteResponse> {
    const params: Record<string, any> = {
      origin: this.formatCoordinate(origin),
      destination: this.formatCoordinate(destination),
      city1,
      city2,
      ...options,
    };

    return this.client.request<TransitRouteResponse>('/v5/direction/transit/integrated', params);
  }
}