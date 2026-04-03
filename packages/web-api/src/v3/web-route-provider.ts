import { extractRoutePoints, extractTransitRoutePoints } from '../utils/normalizers';
import type { ClientConfig } from '../utils/client';
import {
  createWebRouteApiAdapter,
  type WebRouteApiAdapter,
} from './web-service-adapter';
import type {
  BicyclingRouteResponse,
  DrivingRouteResponse,
  ElectricBikeRouteResponse,
  TransitRouteResponse,
  WalkingRouteResponse,
} from '../types/route.types';
import type { DrivingRouteParams, RouteProvider, TransitRouteParams } from './contracts';
import type { Coordinates, RoutePlan } from './domain';

export interface WebRouteProviderFactoryOptions {
  api?: WebRouteApiAdapter;
  config?: ClientConfig;
}

function getApi(options: WebRouteProviderFactoryOptions = {}): WebRouteApiAdapter {
  if (options.api) {
    // 外部注入（测试或高级自定义）优先。
    return options.api;
  }

  // 默认走轻量 service adapter，避免依赖 legacy `GaodeWebAPI` class。
  return createWebRouteApiAdapter(options.config);
}

function normalizeSinglePlan(
  response:
    | DrivingRouteResponse
    | WalkingRouteResponse
    | BicyclingRouteResponse
    | ElectricBikeRouteResponse
): RoutePlan {
  const firstPath = response.route?.paths?.[0];
  return {
    distanceMeters: Number(firstPath?.distance ?? 0),
    durationSeconds: Number(firstPath?.cost?.duration ?? firstPath?.duration ?? 0),
    path: extractRoutePoints(response),
    source: 'web',
    raw: response,
  };
}

function normalizeTransitPlans(response: TransitRouteResponse): RoutePlan[] {
  const paths = extractTransitRoutePoints(response);
  const transits = response.route?.transits ?? [];

  return paths.map((path, index) => ({
    distanceMeters: Number(transits[index]?.distance ?? 0),
    durationSeconds: Number(transits[index]?.cost?.duration ?? 0),
    path,
    source: 'web',
    raw: transits[index] ?? response,
  }));
}

function toCoordinateString(point: Coordinates): string {
  return `${point.longitude},${point.latitude}`;
}

export function createWebRouteProvider(options: WebRouteProviderFactoryOptions = {}): RouteProvider {
  const api = getApi(options);

  return {
    kind: 'web-route',
    async calculateDrivingRoute(params: DrivingRouteParams) {
      const response = await api.route.driving(params.origin, params.destination, {
        show_fields: 'cost,polyline',
        strategy:
          typeof params.strategy === 'number' ? params.strategy : undefined,
        waypoints: params.waypoints?.map(toCoordinateString),
      });
      return normalizeSinglePlan(response);
    },
    async calculateWalkingRoute(params: DrivingRouteParams) {
      const response = await api.route.walking(params.origin, params.destination, {
        show_fields: 'cost,polyline',
      });
      return normalizeSinglePlan(response);
    },
    async calculateBicyclingRoute(params: DrivingRouteParams) {
      const response = await api.route.bicycling(params.origin, params.destination, {
        show_fields: 'cost,polyline',
      });
      return normalizeSinglePlan(response);
    },
    async calculateElectricBikeRoute(params: DrivingRouteParams) {
      const response = await api.route.electricBike(params.origin, params.destination, {
        show_fields: 'cost,polyline',
      });
      return normalizeSinglePlan(response);
    },
    async calculateTransitRoutes(params: TransitRouteParams) {
      const response = await api.route.transit(
        params.origin,
        params.destination,
        params.city1,
        params.city2,
        {
          strategy:
            typeof params.strategy === 'number' ? params.strategy : undefined,
          AlternativeRoute: params.alternativeRoute,
          show_fields: 'cost,polyline',
        }
      );
      return normalizeTransitPlans(response);
    },
  };
}
