import { ExpoGaodeMapModule } from './map';
import type {
  BuildAnchorWaypointsOptions,
  NaviPoint,
  WebPlannedRoute,
} from './types';


export function parsePolyline(polyline?: string): NaviPoint[] {
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
    .filter((point): point is NaviPoint => point !== null);
}


export function dedupeAdjacentPoints(points: NaviPoint[]): NaviPoint[] {
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


export function haversineDistance(pointA: NaviPoint, pointB: NaviPoint): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(pointB.latitude - pointA.latitude);
  const longitudeDelta = toRadians(pointB.longitude - pointA.longitude);
  const latitudeA = toRadians(pointA.latitude);
  const latitudeB = toRadians(pointB.latitude);

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(a));
}

export function distanceBetweenCoordinatesSafe(pointA: NaviPoint, pointB: NaviPoint): number {
  try {
    return ExpoGaodeMapModule.distanceBetweenCoordinates(pointA, pointB);
  } catch {
    return haversineDistance(pointA, pointB);
  }
}

export function calculatePathLengthSafe(points: NaviPoint[]): number {
  try {
    return ExpoGaodeMapModule.calculatePathLength(points);
  } catch {
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      total += distanceBetweenCoordinatesSafe(points[index - 1], points[index]);
    }
    return total;
  }
}

export function simplifyPolylineSafe(points: NaviPoint[], tolerance: number): NaviPoint[] {
  if (points.length <= 2) {
    return points;
  }

  try {
    const simplified = ExpoGaodeMapModule.simplifyPolyline(points, tolerance);
    return simplified.length >= 2 ? simplified : points;
  } catch {
    return points;
  }
}

export function getDistanceToPathSafe(path: NaviPoint[], target: NaviPoint): number {
  if (path.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  try {
    const nearest = ExpoGaodeMapModule.getNearestPointOnPath(path, target);
    if (nearest) {
      return nearest.distanceMeters;
    }
  } catch {
    // ignore and fallback to point-to-point scan
  }

  return path.reduce((minimum, point) => {
    const distance = distanceBetweenCoordinatesSafe(point, target);
    return distance < minimum ? distance : minimum;
  }, Number.POSITIVE_INFINITY);
}

export function samplePolyline(points: NaviPoint[], targetSamples = 36): NaviPoint[] {
  if (points.length <= targetSamples) {
    return points;
  }

  const step = Math.max(1, Math.floor(points.length / targetSamples));
  const samples = points.filter((_, index) => index % step === 0);
  const lastPoint = points[points.length - 1];
  const lastSample = samples[samples.length - 1];
  if (
    !lastSample ||
    lastSample.latitude !== lastPoint.latitude ||
    lastSample.longitude !== lastPoint.longitude
  ) {
    samples.push(lastPoint);
  }
  return samples;
}

export function selectEvenlySpacedPoints(points: NaviPoint[], count: number): NaviPoint[] {
  if (count <= 0 || points.length <= count) {
    return points;
  }

  return Array.from({ length: count }, (_, index) => {
    const rawIndex = Math.round(((index + 1) * (points.length + 1)) / (count + 1)) - 1;
    const boundedIndex = Math.min(points.length - 1, Math.max(0, rawIndex));
    return points[boundedIndex];
  });
}

export function normalizeWebRoutePolyline(webRoute: WebPlannedRoute): NaviPoint[] {
  const directPolyline = dedupeAdjacentPoints(webRoute.polyline ?? []);
  if (directPolyline.length > 1) {
    return directPolyline;
  }

  const stepPolyline = dedupeAdjacentPoints(
    (webRoute.steps ?? []).flatMap((step) => step.polyline ?? [])
  );
  return stepPolyline;
}

export function buildAnchorWaypointsFromWebRoute(
  options: BuildAnchorWaypointsOptions
): NaviPoint[] {
  // 这一步的目标不是“还原原始 Web 线路”，而是从 Web 线路里抽出
  // 少量、间距足够大的中间锚点，方便原生独立算路尽量贴近它。
  const {
    webRoute,
    maxViaPoints = 8,
    simplifyTolerance = 80,
    minSpacingMeters = 800,
  } = options;

  const polyline = normalizeWebRoutePolyline(webRoute);
  if (polyline.length <= 2) {
    return [];
  }

  const simplified = dedupeAdjacentPoints(
    simplifyPolylineSafe(polyline, simplifyTolerance)
  );
  const candidatePoints = simplified.length > 2 ? simplified : polyline;
  const interiorPoints = candidatePoints.slice(1, -1);

  // 优先用离前一个锚点足够远的点，避免途经点过密导致原生算路失真。
  const spacedPoints: NaviPoint[] = [];
  let previousPoint = polyline[0];

  for (const point of interiorPoints) {
    if (distanceBetweenCoordinatesSafe(previousPoint, point) < minSpacingMeters) {
      continue;
    }
    spacedPoints.push(point);
    previousPoint = point;
  }

  const waypoints = spacedPoints.length > 0
    ? spacedPoints
    : candidatePoints.length > 2
      ? [candidatePoints[Math.floor(candidatePoints.length / 2)]]
      : [];

  return dedupeAdjacentPoints(selectEvenlySpacedPoints(waypoints, maxViaPoints));
}
