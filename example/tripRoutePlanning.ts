import { ExpoGaodeMapModule, type LatLng } from 'expo-gaode-map';
import {
  DrivingStrategy,
  GaodeWebAPI,
  type BicyclingRouteResponse,
  type DrivingRouteResponse,
  type Path,
  type WalkingRouteResponse,
} from 'expo-gaode-map-web-api';

import { EXAMPLE_WEB_API_KEY } from './exampleConfig';

export type TripTravelMode = 'walking' | 'bicycling' | 'driving';

export type TripRouteSegment = {
  id: string;
  fromStopId: string;
  toStopId: string;
  mode: TripTravelMode;
  modeLabel: string;
  points: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  source: 'api' | 'fallback';
};

export type TripDayRoutePlan = {
  dayIndex: number;
  segments: TripRouteSegment[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  source: 'api' | 'fallback' | 'mixed';
};

export type TripStopForRoute = {
  id: string;
  coordinate: LatLng;
};

const DAY_LEG_MODES: TripTravelMode[][] = [
  ['walking', 'walking', 'walking'],
  ['driving', 'driving', 'driving'],
  ['walking', 'driving'],
  ['walking', 'bicycling', 'walking'],
  ['driving', 'driving', 'driving'],
];

const MODE_LABELS: Record<TripTravelMode, string> = {
  walking: '步行',
  bicycling: '骑行',
  driving: '驾车',
};

const MODE_ESTIMATED_SPEED_MPS: Record<TripTravelMode, number> = {
  walking: 1.2,
  bicycling: 4.0,
  driving: 12,
};

const WALKING_TO_DRIVING_DISTANCE_THRESHOLD_METERS = 6000;
const BICYCLING_TO_DRIVING_DISTANCE_THRESHOLD_METERS = 18000;

const dayRoutePlanCache = new Map<string, TripDayRoutePlan>();
const dayRoutePlanPending = new Map<string, Promise<TripDayRoutePlan>>();

let routeApiInstance: GaodeWebAPI | null = null;
let routeApiResolved = false;

function samePoint(a: LatLng, b: LatLng): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < 0.000001 &&
    Math.abs(a.longitude - b.longitude) < 0.000001
  );
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function calcPointsDistance(points: LatLng[]): number {
  if (points.length < 2) return 0;

  let distance = 0;
  for (let i = 1; i < points.length; i += 1) {
    distance += ExpoGaodeMapModule.distanceBetweenCoordinates(points[i - 1], points[i]);
  }
  return distance;
}

function estimateDurationByMode(distanceMeters: number, mode: TripTravelMode): number {
  if (distanceMeters <= 0) return 0;
  const speed = MODE_ESTIMATED_SPEED_MPS[mode];
  return Math.max(60, Math.round(distanceMeters / speed));
}

function getModeForLeg(dayIndex: number, legIndex: number): TripTravelMode {
  const dayModes = DAY_LEG_MODES[dayIndex];
  if (!dayModes?.length) {
    return 'walking';
  }
  return dayModes[Math.min(legIndex, dayModes.length - 1)];
}

function buildTripDayCacheKey(dayIndex: number, stops: TripStopForRoute[]): string {
  const signature = stops
    .map(
      (stop) =>
        `${stop.id}:${stop.coordinate.latitude.toFixed(5)},${stop.coordinate.longitude.toFixed(5)}`
    )
    .join('|');
  return `${dayIndex}|${signature}`;
}

function createFallbackSegment(
  dayIndex: number,
  legIndex: number,
  from: TripStopForRoute,
  to: TripStopForRoute,
  mode: TripTravelMode
): TripRouteSegment {
  const points = [from.coordinate, to.coordinate];
  const distanceMeters = calcPointsDistance(points);
  return {
    id: `${dayIndex}-${from.id}-${to.id}-${legIndex}`,
    fromStopId: from.id,
    toStopId: to.id,
    mode,
    modeLabel: MODE_LABELS[mode],
    points,
    distanceMeters,
    durationSeconds: estimateDurationByMode(distanceMeters, mode),
    source: 'fallback',
  };
}

function parsePathPoints(path: Path, fallbackPoints: LatLng[]): LatLng[] {
  let parsed: LatLng[] = [];
  for (const step of path.steps ?? []) {
    if (!step.polyline) continue;
    try {
      const next = ExpoGaodeMapModule.parsePolyline(step.polyline);
      if (!next.length) continue;
      if (!parsed.length) {
        parsed = next;
      } else if (samePoint(parsed[parsed.length - 1], next[0])) {
        parsed = parsed.concat(next.slice(1));
      } else {
        parsed = parsed.concat(next);
      }
    } catch {
      // ignore malformed step polyline and continue with remaining steps
    }
  }

  if (parsed.length < 2) {
    return fallbackPoints;
  }
  if (parsed.length > 420) {
    return ExpoGaodeMapModule.simplifyPolyline(parsed, 3);
  }
  return parsed;
}

function getRouteApi(): GaodeWebAPI | null {
  if (routeApiResolved) {
    return routeApiInstance;
  }
  routeApiResolved = true;

  try {
    routeApiInstance = EXAMPLE_WEB_API_KEY
      ? new GaodeWebAPI({ key: EXAMPLE_WEB_API_KEY })
      : new GaodeWebAPI();
  } catch (error) {
    console.warn('[MayDayTrip] 路线规划 API 初始化失败，已降级直线连接:', error);
    routeApiInstance = null;
  }

  return routeApiInstance;
}

async function fetchPathByMode(
  api: GaodeWebAPI,
  mode: TripTravelMode,
  origin: LatLng,
  destination: LatLng
): Promise<Path | null> {
  if (mode === 'driving') {
    const response = await api.route.driving(origin, destination, {
      strategy: DrivingStrategy.AVOID_JAM,
      show_fields: 'polyline,cost',
    });
    return (response as DrivingRouteResponse).route?.paths?.[0] ?? null;
  }
  if (mode === 'bicycling') {
    const response = await api.route.bicycling(origin, destination, {
      show_fields: 'polyline,cost',
    });
    return (response as BicyclingRouteResponse).route?.paths?.[0] ?? null;
  }
  const response = await api.route.walking(origin, destination, {
    show_fields: 'polyline,cost',
  });
  return (response as WalkingRouteResponse).route?.paths?.[0] ?? null;
}

function summarizeDayPlan(dayIndex: number, segments: TripRouteSegment[]): TripDayRoutePlan {
  const totalDistanceMeters = segments.reduce((sum, segment) => sum + segment.distanceMeters, 0);
  const totalDurationSeconds = segments.reduce((sum, segment) => sum + segment.durationSeconds, 0);
  const hasApi = segments.some((segment) => segment.source === 'api');
  const hasFallback = segments.some((segment) => segment.source === 'fallback');
  const source: TripDayRoutePlan['source'] = hasApi && hasFallback ? 'mixed' : hasApi ? 'api' : 'fallback';

  return {
    dayIndex,
    segments,
    totalDistanceMeters,
    totalDurationSeconds,
    source,
  };
}

export function formatModeLabel(mode: TripTravelMode): string {
  return MODE_LABELS[mode];
}

export function formatDuration(durationSeconds: number): string {
  if (!durationSeconds || durationSeconds <= 0) return '--';
  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes} 分钟`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!minutes) {
    return `${hours} 小时`;
  }
  return `${hours} 小时 ${minutes} 分钟`;
}

export function buildFallbackTripDayRoutePlan(
  dayIndex: number,
  stops: TripStopForRoute[]
): TripDayRoutePlan {
  if (stops.length < 2) {
    return summarizeDayPlan(dayIndex, []);
  }

  const segments: TripRouteSegment[] = [];
  for (let i = 1; i < stops.length; i += 1) {
    const from = stops[i - 1];
    const to = stops[i];
    const mode = getModeForLeg(dayIndex, i - 1);
    segments.push(createFallbackSegment(dayIndex, i - 1, from, to, mode));
  }

  return summarizeDayPlan(dayIndex, segments);
}

export function getCachedTripDayRoutePlan(
  dayIndex: number,
  stops: TripStopForRoute[]
): TripDayRoutePlan | undefined {
  return dayRoutePlanCache.get(buildTripDayCacheKey(dayIndex, stops));
}

export function clearTripDayRoutePlanCache(dayIndex?: number): void {
  if (typeof dayIndex === 'number') {
    const keyPrefix = `${dayIndex}|`;
    Array.from(dayRoutePlanCache.keys()).forEach((cacheKey) => {
      if (cacheKey.startsWith(keyPrefix)) {
        dayRoutePlanCache.delete(cacheKey);
      }
    });
    Array.from(dayRoutePlanPending.keys()).forEach((cacheKey) => {
      if (cacheKey.startsWith(keyPrefix)) {
        dayRoutePlanPending.delete(cacheKey);
      }
    });
    return;
  }

  dayRoutePlanCache.clear();
  dayRoutePlanPending.clear();
}

export async function getTripDayRoutePlan(
  dayIndex: number,
  stops: TripStopForRoute[]
): Promise<TripDayRoutePlan> {
  const cacheKey = buildTripDayCacheKey(dayIndex, stops);
  const cached = dayRoutePlanCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = dayRoutePlanPending.get(cacheKey);
  if (pending) {
    return pending;
  }

  const fallbackPlan = buildFallbackTripDayRoutePlan(dayIndex, stops);
  if (stops.length < 2) {
    dayRoutePlanCache.set(cacheKey, fallbackPlan);
    return fallbackPlan;
  }

  const promise = (async () => {
    const api = getRouteApi();
    if (!api) {
      dayRoutePlanCache.set(cacheKey, fallbackPlan);
      return fallbackPlan;
    }

    const segments: TripRouteSegment[] = [];

    for (let i = 1; i < stops.length; i += 1) {
      const from = stops[i - 1];
      const to = stops[i];
      const plannedMode = getModeForLeg(dayIndex, i - 1);

      try {
        let mode = plannedMode;
        let path = await fetchPathByMode(api, mode, from.coordinate, to.coordinate);
        const initialDistance = toFiniteNumber(path?.distance) ?? 0;

        if (
          path &&
          mode === 'walking' &&
          initialDistance >= WALKING_TO_DRIVING_DISTANCE_THRESHOLD_METERS
        ) {
          const drivingPath = await fetchPathByMode(api, 'driving', from.coordinate, to.coordinate);
          if (drivingPath) {
            mode = 'driving';
            path = drivingPath;
          }
        } else if (
          path &&
          mode === 'bicycling' &&
          initialDistance >= BICYCLING_TO_DRIVING_DISTANCE_THRESHOLD_METERS
        ) {
          const drivingPath = await fetchPathByMode(api, 'driving', from.coordinate, to.coordinate);
          if (drivingPath) {
            mode = 'driving';
            path = drivingPath;
          }
        }

        const fallbackSegment = createFallbackSegment(dayIndex, i - 1, from, to, mode);

        if (!path) {
          segments.push(fallbackSegment);
          continue;
        }

        const points = parsePathPoints(path, fallbackSegment.points);
        const distanceMeters = toFiniteNumber(path.distance) ?? calcPointsDistance(points);
        const durationSeconds =
          toFiniteNumber(path.cost?.duration) ??
          toFiniteNumber(path.duration) ??
          estimateDurationByMode(distanceMeters, mode);

        segments.push({
          ...fallbackSegment,
          points,
          distanceMeters,
          durationSeconds,
          source: path.steps?.length ? 'api' : 'fallback',
        });
      } catch (error) {
        const fallbackSegment = createFallbackSegment(
          dayIndex,
          i - 1,
          from,
          to,
          plannedMode
        );
        console.warn('[MayDayTrip] 单段路线规划失败，已降级直线连接:', error);
        segments.push(fallbackSegment);
      }
    }

    const plan = summarizeDayPlan(dayIndex, segments);
    dayRoutePlanCache.set(cacheKey, plan);
    return plan;
  })()
    .catch(() => fallbackPlan)
    .finally(() => {
      dayRoutePlanPending.delete(cacheKey);
    });

  dayRoutePlanPending.set(cacheKey, promise);
  return promise;
}
