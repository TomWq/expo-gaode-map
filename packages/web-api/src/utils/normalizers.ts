import type {
  BicyclingRouteResponse,
  DrivingRouteResponse,
  ElectricBikeRouteResponse,
  Step,
  TransitRouteResponse,
  WalkingRouteResponse,
} from '../types/route.types';
import type { AOIBoundaryResponse } from '../types/poi.types';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface NormalizedDrivingRoute {
  distance: number;
  duration: number;
  taxiCost?: number;
  points: RoutePoint[];
}

export interface ExtractedAOIBoundary {
  id?: string;
  name?: string;
  rings: RoutePoint[][];
}

type SupportedRouteResponse =
  | DrivingRouteResponse
  | WalkingRouteResponse
  | BicyclingRouteResponse
  | ElectricBikeRouteResponse;

function parsePolyline(polyline?: string): RoutePoint[] {
  if (!polyline?.trim()) {
    return [];
  }

  return polyline
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const [longitude, latitude] = segment.split(',').map((value) => Number(value.trim()));
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        return null;
      }

      return {
        latitude,
        longitude,
      };
    })
    .filter((point): point is RoutePoint => point !== null);
}

function dedupeAdjacentPoints(points: RoutePoint[]): RoutePoint[] {
  return points.filter((point, index) => {
    if (index === 0) {
      return true;
    }

    const previous = points[index - 1];
    return (
      previous.latitude !== point.latitude ||
      previous.longitude !== point.longitude
    );
  });
}

function extractStepPoints(steps: Step[] = []): RoutePoint[] {
  return dedupeAdjacentPoints(
    steps.flatMap((step) => parsePolyline(step.polyline))
  );
}

export function extractRoutePoints(routeResult: SupportedRouteResponse): RoutePoint[] {
  // 将 Web API 的 steps.polyline 摊平成地图组件可直接消费的点集。
  const firstPath = routeResult.route?.paths?.[0];
  if (!firstPath) {
    return [];
  }

  return extractStepPoints(firstPath.steps);
}

export function normalizeDrivingRoute(
  routeResult: DrivingRouteResponse
): NormalizedDrivingRoute {
  // 为常见“路径预览 / 地图绘制”场景提供一个更扁平的数据结构，
  // 业务层不必再自己处理字符串数字和嵌套字段。
  const firstPath = routeResult.route?.paths?.[0];

  return {
    distance: Number(firstPath?.distance ?? 0),
    duration: Number(firstPath?.cost?.duration ?? firstPath?.duration ?? 0),
    taxiCost: routeResult.route?.taxi_cost ? Number(routeResult.route.taxi_cost) : undefined,
    points: extractRoutePoints(routeResult),
  };
}

export function extractAOIBoundary(aoiResult: AOIBoundaryResponse): ExtractedAOIBoundary {
  // AOI 边界返回值可能是单对象，也可能是数组；
  // 这里统一归一成 { id, name, rings } 结构。
  const aoi = Array.isArray(aoiResult.aois) ? aoiResult.aois[0] : aoiResult.aois;
  const polyline = aoi?.polyline ?? '';
  const rings = polyline
    .split('|')
    .map((ring) => parsePolyline(ring))
    .filter((ring) => ring.length > 0);

  return {
    id: aoi?.id,
    name: aoi?.name,
    rings,
  };
}

export function extractTransitRoutePoints(transitResult: TransitRouteResponse): RoutePoint[][] {
  // 公交换乘路线会混合步行段、公交段、铁路段，
  // 这里统一抽成“每条换乘方案 -> 一条完整点集”。
  return (transitResult.route?.transits ?? []).map((transit) =>
    dedupeAdjacentPoints(
      transit.segments.flatMap((segment) => [
        ...(segment.walking ? extractStepPoints(segment.walking.steps) : []),
        ...(segment.bus?.buslines?.flatMap((line) => parsePolyline(line.polyline)) ?? []),
        ...(segment.railway?.buslines?.flatMap((line) => parsePolyline(line.polyline)) ?? []),
      ])
    )
  );
}
