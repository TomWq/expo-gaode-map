import type { UITurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { UITurboModule } from '@rnoh/react-native-openharmony/ts';
import { abilityAccessCtrl, bundleManager } from '@kit.AbilityKit';
import type { common, PermissionRequestResult, Permissions } from '@kit.AbilityKit';
import geoLocationManager from '@ohos.geoLocationManager';

interface PrivacyStatus {
  hasShow: boolean;
  hasContainsPrivacy: boolean;
  hasAgree: boolean;
  isReady: boolean;
  privacyVersion: string | null;
  agreedPrivacyVersion: string | null;
  restoredFromStorage: boolean;
}

interface SDKConfig {
  androidKey?: string;
  iosKey?: string;
  harmonyKey?: string;
  webKey?: string;
}

interface HarmonyPermissionStatus {
  granted: boolean;
  status: string;
  canAskAgain: boolean;
  isPermanentlyDenied: boolean;
  backgroundLocation: boolean;
  fineLocation: boolean;
  coarseLocation: boolean;
  shouldShowRationale: boolean;
  message?: string;
}

interface GeoLocationRequest {
  priority?: number;
  scenario?: number;
  maxAccuracy?: number;
  timeoutMs?: number;
  timeInterval?: number;
  distanceInterval?: number;
}

interface GeoLocationReGeoLike {
  address?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  citycode?: string;
  adcode?: string;
  street?: string;
  number?: string;
  poiName?: string;
  aoiName?: string;
  desc?: string;
}

interface GeoLocationLike {
  latitude?: number;
  longitude?: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  bearing?: number;
  direction?: number;
  timeStamp?: number;
  reGeo?: GeoLocationReGeoLike;
}

interface GeoLocationScenarioSet {
  UNSET?: number;
}

interface GeoLocationPrioritySet {
  UNSET?: number;
  FIRST_FIX?: number;
  LOW_POWER?: number;
  ACCURACY?: number;
}

interface GeoLocationManagerApi {
  LocationRequestScenario?: GeoLocationScenarioSet;
  LocationRequestPriority?: GeoLocationPrioritySet;
  isLocationEnabled?: () => boolean;
  on?: (
    eventName: 'locationChange',
    request: GeoLocationRequest,
    callback: (location: GeoLocationLike) => void
  ) => void;
  off?: (
    eventName: 'locationChange',
    callback: (location: GeoLocationLike) => void
  ) => void;
  getCurrentLocation?: (
    request: GeoLocationRequest,
    callback: (error: Object | null, location: GeoLocationLike | null) => void
  ) => void;
}

interface LocationPayload {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  bearing: number;
  timestamp: number;
  address?: string;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  cityCode?: string;
  adCode?: string;
  street?: string;
  streetNumber?: string;
  poiName?: string;
  aoiName?: string;
  description?: string;
}

interface HeadingPayload {
  heading: number;
  magneticHeading: number;
  trueHeading: number;
  headingAccuracy: number;
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface PermissionRecord {
  granted: boolean;
  status: string;
  canAskAgain: boolean;
  isPermanentlyDenied: boolean;
  backgroundLocation: boolean;
  fineLocation: boolean;
  coarseLocation: boolean;
  shouldShowRationale: boolean;
  message?: string;
}

const LOCATION_PERMISSION_APPROXIMATE: Permissions = 'ohos.permission.APPROXIMATELY_LOCATION';
const LOCATION_PERMISSION_PRECISE: Permissions = 'ohos.permission.LOCATION';
const LOCATION_PERMISSION_BACKGROUND: Permissions = 'ohos.permission.LOCATION_IN_BACKGROUND';
const LOCATION_FOREGROUND_PERMISSIONS: Array<Permissions> = [
  LOCATION_PERMISSION_APPROXIMATE,
  LOCATION_PERMISSION_PRECISE,
];
const LOCATION_BACKGROUND_PERMISSIONS: Array<Permissions> = [
  LOCATION_PERMISSION_BACKGROUND,
];

const defaultPrivacyStatus: PrivacyStatus = {
  hasShow: true,
  hasContainsPrivacy: true,
  hasAgree: true,
  isReady: true,
  privacyVersion: null,
  agreedPrivacyVersion: null,
  restoredFromStorage: true,
};

interface GeometryCoordinate {
  latitude: number;
  longitude: number;
}

interface GeometryCoordinateInput {
  latitude?: number | string;
  longitude?: number | string;
}

interface GeometryPathBounds {
  north: number;
  south: number;
  east: number;
  west: number;
  center: GeometryCoordinate;
}

interface GeometryNearestPointResult {
  latitude: number;
  longitude: number;
  index: number;
  distanceMeters: number;
}

interface GeometryPointAtDistanceResult {
  latitude: number;
  longitude: number;
  angle: number;
}

interface GeometryTileResult {
  x: number;
  y: number;
  z: number;
}

interface GeometryPixelResult {
  x: number;
  y: number;
}

interface GeometryHeatmapPoint extends GeometryCoordinateInput {
  weight?: number | string;
}

interface GeometryHeatmapCell {
  latitude: number;
  longitude: number;
  intensity: number;
}


interface GeometryProjectedPoint {
  x: number;
  y: number;
  index: number;
}

const GEO_EARTH_RADIUS_METERS: number = 6371000.0;
const GEO_PI: number = 3.14159265358979323846;
const GEO_DEGREES_TO_RADIANS: number = GEO_PI / 180.0;
const GEO_RADIANS_TO_DEGREES: number = 180.0 / GEO_PI;
const GEOHASH_BASE32: string = '0123456789bcdefghjkmnpqrstuvwxyz';
const GEO_CHINA_LAT_MIN: number = 0.8293;
const GEO_CHINA_LAT_MAX: number = 55.8271;
const GEO_CHINA_LNG_MIN: number = 72.004;
const GEO_CHINA_LNG_MAX: number = 137.8347;
const GEO_A: number = 6378245.0;
const GEO_EE: number = 0.00669342162296594323;

function geometryToRadians(degrees: number): number {
  return degrees * GEO_DEGREES_TO_RADIANS;
}

function geometryToDegrees(radians: number): number {
  return radians * GEO_RADIANS_TO_DEGREES;
}

function geometryToNumber(value: number | string | undefined, fallback: number = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function geometryOutOfChina(coordinate: GeometryCoordinate): boolean {
  return coordinate.longitude < GEO_CHINA_LNG_MIN ||
    coordinate.longitude > GEO_CHINA_LNG_MAX ||
    coordinate.latitude < GEO_CHINA_LAT_MIN ||
    coordinate.latitude > GEO_CHINA_LAT_MAX;
}

function geometryTransformLatitude(x: number, y: number): number {
  let result = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  result += (20.0 * Math.sin(6.0 * x * GEO_PI) + 20.0 * Math.sin(2.0 * x * GEO_PI)) * 2.0 / 3.0;
  result += (20.0 * Math.sin(y * GEO_PI) + 40.0 * Math.sin(y / 3.0 * GEO_PI)) * 2.0 / 3.0;
  result += (160.0 * Math.sin(y / 12.0 * GEO_PI) + 320.0 * Math.sin(y * GEO_PI / 30.0)) * 2.0 / 3.0;
  return result;
}

function geometryTransformLongitude(x: number, y: number): number {
  let result = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  result += (20.0 * Math.sin(6.0 * x * GEO_PI) + 20.0 * Math.sin(2.0 * x * GEO_PI)) * 2.0 / 3.0;
  result += (20.0 * Math.sin(x * GEO_PI) + 40.0 * Math.sin(x / 3.0 * GEO_PI)) * 2.0 / 3.0;
  result += (150.0 * Math.sin(x / 12.0 * GEO_PI) + 300.0 * Math.sin(x / 30.0 * GEO_PI)) * 2.0 / 3.0;
  return result;
}

function geometryWgs84ToGcj02(coordinate: GeometryCoordinate): GeometryCoordinate {
  if (geometryOutOfChina(coordinate)) {
    return coordinate;
  }

  let deltaLat = geometryTransformLatitude(coordinate.longitude - 105.0, coordinate.latitude - 35.0);
  let deltaLng = geometryTransformLongitude(coordinate.longitude - 105.0, coordinate.latitude - 35.0);
  const radLat = geometryToRadians(coordinate.latitude);
  const sinRadLat = Math.sin(radLat);
  const magic = 1.0 - GEO_EE * sinRadLat * sinRadLat;
  const sqrtMagic = Math.sqrt(magic);

  deltaLat = (deltaLat * 180.0) /
    (((GEO_A * (1.0 - GEO_EE)) / (magic * sqrtMagic)) * GEO_PI);
  deltaLng = (deltaLng * 180.0) /
    ((GEO_A / sqrtMagic) * Math.cos(radLat) * GEO_PI);

  return {
    latitude: coordinate.latitude + deltaLat,
    longitude: coordinate.longitude + deltaLng,
  };
}

function geometryBd09ToGcj02(coordinate: GeometryCoordinate): GeometryCoordinate {
  const x = coordinate.longitude - 0.0065;
  const y = coordinate.latitude - 0.006;
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * GEO_PI * 3000.0 / 180.0);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * GEO_PI * 3000.0 / 180.0);
  return {
    latitude: z * Math.sin(theta),
    longitude: z * Math.cos(theta),
  };
}

function geometryCoordinateConvert(
  coordinate: GeometryCoordinate,
  type: number
): GeometryCoordinate {
  switch (type) {
    case 0:
      return geometryWgs84ToGcj02(coordinate);
    case 2:
      return geometryBd09ToGcj02(coordinate);
    case 1:
    case 3:
    default:
      return coordinate;
  }
}

function geometryNormalizeCoordinate(input: GeometryCoordinateInput | null | undefined): GeometryCoordinate | null {
  if (!input) {
    return null;
  }

  const latitude = geometryToNumber(input.latitude, Number.NaN);
  const longitude = geometryToNumber(input.longitude, Number.NaN);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function geometryNormalizeCoordinateList(
  inputs: Array<GeometryCoordinateInput> | null | undefined
): GeometryCoordinate[] {
  if (!inputs || inputs.length === 0) {
    return [];
  }

  const result: GeometryCoordinate[] = [];
  for (let index = 0; index < inputs.length; index += 1) {
    const coordinate = geometryNormalizeCoordinate(inputs[index]);
    if (coordinate) {
      result.push(coordinate);
    }
  }
  return result;
}

function geometryNormalizePolygonRings(
  polygon: Array<GeometryCoordinateInput> | Array<Array<GeometryCoordinateInput>> | null | undefined
): GeometryCoordinate[][] {
  if (!polygon || polygon.length === 0) {
    return [];
  }

  const first = polygon[0];
  if (Array.isArray(first)) {
    const rings = polygon as Array<Array<GeometryCoordinateInput>>;
    const normalized: GeometryCoordinate[][] = [];
    for (let index = 0; index < rings.length; index += 1) {
      const ring = geometryNormalizeCoordinateList(rings[index]);
      if (ring.length > 0) {
        normalized.push(ring);
      }
    }
    return normalized;
  }

  const singleRing = geometryNormalizeCoordinateList(polygon as Array<GeometryCoordinateInput>);
  return singleRing.length > 0 ? [singleRing] : [];
}

function geometryDistanceMeters(
  coordinate1: GeometryCoordinate,
  coordinate2: GeometryCoordinate
): number {
  const lat1 = geometryToRadians(coordinate1.latitude);
  const lat2 = geometryToRadians(coordinate2.latitude);
  const deltaLat = lat2 - lat1;
  const deltaLon = geometryToRadians(coordinate2.longitude - coordinate1.longitude);
  const sinHalfLat = Math.sin(deltaLat * 0.5);
  const sinHalfLon = Math.sin(deltaLon * 0.5);
  const haversine = sinHalfLat * sinHalfLat +
    Math.cos(lat1) * Math.cos(lat2) * sinHalfLon * sinHalfLon;
  const centralAngle = 2.0 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1.0 - haversine));
  return GEO_EARTH_RADIUS_METERS * centralAngle;
}

function geometryBearing(
  coordinate1: GeometryCoordinate,
  coordinate2: GeometryCoordinate
): number {
  const phi1 = geometryToRadians(coordinate1.latitude);
  const phi2 = geometryToRadians(coordinate2.latitude);
  const lam1 = geometryToRadians(coordinate1.longitude);
  const lam2 = geometryToRadians(coordinate2.longitude);
  const y = Math.sin(lam2 - lam1) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(lam2 - lam1);
  return (geometryToDegrees(Math.atan2(y, x)) + 360.0) % 360.0;
}

function geometryIsPointInCircle(
  point: GeometryCoordinate,
  center: GeometryCoordinate,
  radiusMeters: number
): boolean {
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    return false;
  }
  return geometryDistanceMeters(point, center) <= radiusMeters;
}

function geometryIsPointInRing(
  point: GeometryCoordinate,
  polygon: GeometryCoordinate[]
): boolean {
  const pointLat = point.latitude;
  const pointLon = point.longitude;
  const pointCount = polygon.length;
  if (pointCount < 3) {
    return false;
  }

  let inside = false;
  let previousIndex = pointCount - 1;
  for (let index = 0; index < pointCount; index += 1) {
    const current = polygon[index];
    const previous = polygon[previousIndex];
    const intersects = ((current.longitude > pointLon) !== (previous.longitude > pointLon)) &&
      (
        pointLat <
          ((previous.latitude - current.latitude) * (pointLon - current.longitude)) /
            (previous.longitude - current.longitude) +
            current.latitude
      );
    if (intersects) {
      inside = !inside;
    }
    previousIndex = index;
  }

  return inside;
}

function geometryIsPointInPolygon(
  point: GeometryCoordinate,
  rings: GeometryCoordinate[][]
): boolean {
  if (rings.length === 0) {
    return false;
  }

  if (!geometryIsPointInRing(point, rings[0])) {
    return false;
  }

  for (let index = 1; index < rings.length; index += 1) {
    if (geometryIsPointInRing(point, rings[index])) {
      return false;
    }
  }

  return true;
}

function geometryCalculatePolygonArea(ring: GeometryCoordinate[]): number {
  const pointCount = ring.length;
  if (pointCount < 3) {
    return 0.0;
  }

  let total = 0.0;
  for (let index = 0; index < pointCount; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % pointCount];
    const lat1 = geometryToRadians(current.latitude);
    const lat2 = geometryToRadians(next.latitude);
    const lon1 = geometryToRadians(current.longitude);
    const lon2 = geometryToRadians(next.longitude);
    total += (lon2 - lon1) * (2.0 + Math.sin(lat1) + Math.sin(lat2));
  }

  return Math.abs(total) * (GEO_EARTH_RADIUS_METERS * GEO_EARTH_RADIUS_METERS) * 0.5;
}

function geometryCalculatePolygonAreaWithHoles(rings: GeometryCoordinate[][]): number {
  if (rings.length === 0) {
    return 0.0;
  }

  let totalArea = geometryCalculatePolygonArea(rings[0]);
  for (let index = 1; index < rings.length; index += 1) {
    totalArea -= geometryCalculatePolygonArea(rings[index]);
  }
  return Math.max(0.0, totalArea);
}

function geometryCalculateRectangleArea(
  southWest: GeometryCoordinate,
  northEast: GeometryCoordinate
): number {
  return geometryCalculatePolygonArea([
    { latitude: southWest.latitude, longitude: southWest.longitude },
    { latitude: southWest.latitude, longitude: northEast.longitude },
    { latitude: northEast.latitude, longitude: northEast.longitude },
    { latitude: northEast.latitude, longitude: southWest.longitude },
  ]);
}

function geometryProjectPointSquareDistance(
  point: GeometryProjectedPoint,
  segmentStart: GeometryProjectedPoint,
  segmentEnd: GeometryProjectedPoint
): number {
  let x = segmentStart.x;
  let y = segmentStart.y;
  let deltaX = segmentEnd.x - x;
  let deltaY = segmentEnd.y - y;

  if (deltaX !== 0 || deltaY !== 0) {
    const t = ((point.x - x) * deltaX + (point.y - y) * deltaY) / (deltaX * deltaX + deltaY * deltaY);
    if (t > 1) {
      x = segmentEnd.x;
      y = segmentEnd.y;
    } else if (t > 0) {
      x += deltaX * t;
      y += deltaY * t;
    }
  }

  deltaX = point.x - x;
  deltaY = point.y - y;
  return deltaX * deltaX + deltaY * deltaY;
}

function geometrySimplifyDpStep(
  points: GeometryProjectedPoint[],
  first: number,
  last: number,
  squareTolerance: number,
  simplified: number[]
): void {
  let maxSquareDistance = squareTolerance;
  let index = 0;

  for (let cursor = first + 1; cursor < last; cursor += 1) {
    const squareDistance = geometryProjectPointSquareDistance(points[cursor], points[first], points[last]);
    if (squareDistance > maxSquareDistance) {
      index = cursor;
      maxSquareDistance = squareDistance;
    }
  }

  if (maxSquareDistance > squareTolerance) {
    if (index - first > 1) {
      geometrySimplifyDpStep(points, first, index, squareTolerance, simplified);
    }
    simplified.push(index);
    if (last - index > 1) {
      geometrySimplifyDpStep(points, index, last, squareTolerance, simplified);
    }
  }
}

function geometrySimplifyPolyline(
  points: GeometryCoordinate[],
  toleranceMeters: number
): GeometryCoordinate[] {
  if (points.length <= 2) {
    return points;
  }

  const referenceLatitude = points[0].latitude;
  const referenceLongitude = points[0].longitude;
  const metersPerDegreeLatitude = 111319.9;
  const metersPerDegreeLongitude = 111319.9 * Math.cos(geometryToRadians(referenceLatitude));
  const projectedPoints: GeometryProjectedPoint[] = [];

  for (let index = 0; index < points.length; index += 1) {
    projectedPoints.push({
      x: (points[index].longitude - referenceLongitude) * metersPerDegreeLongitude,
      y: (points[index].latitude - referenceLatitude) * metersPerDegreeLatitude,
      index,
    });
  }

  const squareTolerance = toleranceMeters * toleranceMeters;
  const simplifiedIndices: number[] = [0];
  geometrySimplifyDpStep(projectedPoints, 0, projectedPoints.length - 1, squareTolerance, simplifiedIndices);
  simplifiedIndices.push(projectedPoints.length - 1);

  const result: GeometryCoordinate[] = [];
  for (let index = 0; index < simplifiedIndices.length; index += 1) {
    result.push(points[simplifiedIndices[index]]);
  }
  return result;
}

function geometryCalculatePathLength(points: GeometryCoordinate[]): number {
  if (points.length < 2) {
    return 0.0;
  }

  let total = 0.0;
  for (let index = 0; index < points.length - 1; index += 1) {
    total += geometryDistanceMeters(points[index], points[index + 1]);
  }
  return total;
}

function geometryGetPointAtDistance(
  points: GeometryCoordinate[],
  distanceMeters: number
): GeometryPointAtDistanceResult | null {
  if (points.length < 2 || distanceMeters < 0) {
    return null;
  }

  if (distanceMeters === 0) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      angle: geometryBearing(points[0], points[1]),
    };
  }

  let covered = 0.0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const segmentDistance = geometryDistanceMeters(points[index], points[index + 1]);
    if (covered + segmentDistance >= distanceMeters) {
      const remaining = distanceMeters - covered;
      const fraction = segmentDistance > 0 ? remaining / segmentDistance : 0;
      return {
        latitude: points[index].latitude + (points[index + 1].latitude - points[index].latitude) * fraction,
        longitude: points[index].longitude + (points[index + 1].longitude - points[index].longitude) * fraction,
        angle: geometryBearing(points[index], points[index + 1]),
      };
    }
    covered += segmentDistance;
  }

  const lastPoint = points[points.length - 1];
  const previousPoint = points[points.length - 2];
  return {
    latitude: lastPoint.latitude,
    longitude: lastPoint.longitude,
    angle: geometryBearing(previousPoint, lastPoint),
  };
}

function geometryDistanceSquare(x1: number, y1: number, x2: number, y2: number): number {
  const deltaX = x1 - x2;
  const deltaY = y1 - y2;
  return deltaX * deltaX + deltaY * deltaY;
}

function geometryGetNearestPointOnPath(
  path: GeometryCoordinate[],
  target: GeometryCoordinate
): GeometryNearestPointResult | null {
  if (path.length === 0) {
    return null;
  }

  if (path.length === 1) {
    return {
      latitude: path[0].latitude,
      longitude: path[0].longitude,
      index: 0,
      distanceMeters: geometryDistanceMeters(target, path[0]),
    };
  }

  let minDistance = Number.POSITIVE_INFINITY;
  let nearestPoint: GeometryNearestPointResult | null = null;

  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const lineSquareLength = geometryDistanceSquare(
      start.latitude,
      start.longitude,
      end.latitude,
      end.longitude
    );

    let t = 0.0;
    if (lineSquareLength > 0) {
      t = (
        (target.latitude - start.latitude) * (end.latitude - start.latitude) +
        (target.longitude - start.longitude) * (end.longitude - start.longitude)
      ) / lineSquareLength;
      if (t < 0) {
        t = 0;
      } else if (t > 1) {
        t = 1;
      }
    }

    const projected = {
      latitude: start.latitude + t * (end.latitude - start.latitude),
      longitude: start.longitude + t * (end.longitude - start.longitude),
    };
    const projectedDistance = geometryDistanceMeters(target, projected);
    if (projectedDistance < minDistance) {
      minDistance = projectedDistance;
      nearestPoint = {
        latitude: projected.latitude,
        longitude: projected.longitude,
        index,
        distanceMeters: projectedDistance,
      };
    }
  }

  return nearestPoint;
}

function geometryCalculateCentroid(ring: GeometryCoordinate[]): GeometryCoordinate | null {
  if (ring.length === 0) {
    return null;
  }

  let signedArea = 0.0;
  let centroidLatitude = 0.0;
  let centroidLongitude = 0.0;
  const pointCount = ring.length;
  const isClosed =
    ring[0].latitude === ring[pointCount - 1].latitude &&
    ring[0].longitude === ring[pointCount - 1].longitude;
  const limit = isClosed ? pointCount - 1 : pointCount;

  for (let index = 0; index < limit; index += 1) {
    const current = ring[index];
    const next = ring[(index + 1) % pointCount];
    const area = current.latitude * next.longitude - next.latitude * current.longitude;
    signedArea += area;
    centroidLatitude += (current.latitude + next.latitude) * area;
    centroidLongitude += (current.longitude + next.longitude) * area;
  }

  if (Math.abs(signedArea) < 1e-9) {
    let latitudeSum = 0.0;
    let longitudeSum = 0.0;
    for (let index = 0; index < pointCount; index += 1) {
      latitudeSum += ring[index].latitude;
      longitudeSum += ring[index].longitude;
    }
    return {
      latitude: latitudeSum / pointCount,
      longitude: longitudeSum / pointCount,
    };
  }

  signedArea *= 0.5;
  return {
    latitude: centroidLatitude / (6.0 * signedArea),
    longitude: centroidLongitude / (6.0 * signedArea),
  };
}

function geometryCalculateCentroidWithHoles(rings: GeometryCoordinate[][]): GeometryCoordinate | null {
  if (rings.length === 0) {
    return null;
  }

  if (rings.length === 1) {
    return geometryCalculateCentroid(rings[0]);
  }

  let totalArea = 0.0;
  let latitudeSum = 0.0;
  let longitudeSum = 0.0;
  for (let index = 0; index < rings.length; index += 1) {
    const area = geometryCalculatePolygonArea(rings[index]);
    const centroid = geometryCalculateCentroid(rings[index]);
    if (!centroid) {
      continue;
    }
    const factor = index === 0 ? 1.0 : -1.0;
    const signedArea = area * factor;
    totalArea += signedArea;
    latitudeSum += centroid.latitude * signedArea;
    longitudeSum += centroid.longitude * signedArea;
  }

  if (Math.abs(totalArea) <= 1e-9) {
    return null;
  }

  return {
    latitude: latitudeSum / totalArea,
    longitude: longitudeSum / totalArea,
  };
}

function geometryCalculatePathBounds(points: GeometryCoordinate[]): GeometryPathBounds | null {
  if (points.length === 0) {
    return null;
  }

  let minLatitude = 90.0;
  let maxLatitude = -90.0;
  let minLongitude = 180.0;
  let maxLongitude = -180.0;
  for (let index = 0; index < points.length; index += 1) {
    minLatitude = Math.min(minLatitude, points[index].latitude);
    maxLatitude = Math.max(maxLatitude, points[index].latitude);
    minLongitude = Math.min(minLongitude, points[index].longitude);
    maxLongitude = Math.max(maxLongitude, points[index].longitude);
  }

  return {
    north: maxLatitude,
    south: minLatitude,
    east: maxLongitude,
    west: minLongitude,
    center: {
      latitude: (maxLatitude + minLatitude) * 0.5,
      longitude: (maxLongitude + minLongitude) * 0.5,
    },
  };
}

function geometryEncodeGeoHash(
  coordinate: GeometryCoordinate,
  precision: number
): string {
  let targetPrecision = Math.max(1, Math.min(12, Math.trunc(precision)));
  let minLatitude = -90.0;
  let maxLatitude = 90.0;
  let minLongitude = -180.0;
  let maxLongitude = 180.0;
  let bit = 0;
  let hashValue = 0;
  let isEven = true;
  let hash = '';

  while (hash.length < targetPrecision) {
    if (isEven) {
      const middle = (minLongitude + maxLongitude) * 0.5;
      if (coordinate.longitude > middle) {
        hashValue |= (1 << (4 - bit));
        minLongitude = middle;
      } else {
        maxLongitude = middle;
      }
    } else {
      const middle = (minLatitude + maxLatitude) * 0.5;
      if (coordinate.latitude > middle) {
        hashValue |= (1 << (4 - bit));
        minLatitude = middle;
      } else {
        maxLatitude = middle;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit += 1;
    } else {
      hash += GEOHASH_BASE32[hashValue];
      bit = 0;
      hashValue = 0;
    }
  }

  return hash;
}

function geometryParsePolyline(polyline: string | null | undefined): GeometryCoordinate[] {
  if (!polyline) {
    return [];
  }

  const points: GeometryCoordinate[] = [];
  const segments = polyline.split(';');
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index].trim();
    if (!segment) {
      continue;
    }
    const coordinateParts = segment.split(',');
    if (coordinateParts.length < 2) {
      continue;
    }
    const longitude = Number(coordinateParts[0]);
    const latitude = Number(coordinateParts[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }
    points.push({ latitude, longitude });
  }
  return points;
}

function geometryLatLngToTile(
  coordinate: GeometryCoordinate,
  zoom: number
): GeometryTileResult {
  const tileCount = Math.pow(2.0, zoom);
  return {
    x: Math.trunc(((coordinate.longitude + 180.0) / 360.0) * tileCount),
    y: Math.trunc(((1.0 - Math.asinh(Math.tan(geometryToRadians(coordinate.latitude))) / GEO_PI) / 2.0) * tileCount),
    z: zoom,
  };
}

function geometryTileToLatLng(tile: GeometryTileResult): GeometryCoordinate {
  const tileCount = Math.pow(2.0, tile.z);
  const longitude = (tile.x / tileCount) * 360.0 - 180.0;
  const latitudeRadians = Math.atan(Math.sinh(GEO_PI * (1.0 - 2.0 * tile.y / tileCount)));
  return {
    latitude: geometryToDegrees(latitudeRadians),
    longitude,
  };
}

function geometryLatLngToPixel(
  coordinate: GeometryCoordinate,
  zoom: number
): GeometryPixelResult {
  const scale = Math.pow(2.0, zoom) * 256.0;
  return {
    x: ((coordinate.longitude + 180.0) / 360.0) * scale,
    y: ((1.0 - Math.asinh(Math.tan(geometryToRadians(coordinate.latitude))) / GEO_PI) / 2.0) * scale,
  };
}

function geometryPixelToLatLng(
  pixel: GeometryPixelResult,
  zoom: number
): GeometryCoordinate {
  const scale = Math.pow(2.0, zoom) * 256.0;
  const longitude = (pixel.x / scale) * 360.0 - 180.0;
  const latitudeRadians = Math.atan(Math.sinh(GEO_PI * (1.0 - 2.0 * pixel.y / scale)));
  return {
    latitude: geometryToDegrees(latitudeRadians),
    longitude,
  };
}

function geometryFindPointInPolygons(
  point: GeometryCoordinate,
  polygons: GeometryCoordinate[][]
): number {
  for (let index = 0; index < polygons.length; index += 1) {
    if (geometryIsPointInRing(point, polygons[index])) {
      return index;
    }
  }
  return -1;
}

function geometryGenerateHeatmapGrid(
  points: GeometryHeatmapPoint[],
  gridSizeMeters: number
): GeometryHeatmapCell[] {
  if (points.length === 0 || !Number.isFinite(gridSizeMeters) || gridSizeMeters <= 0) {
    return [];
  }

  let minLatitude = 90.0;
  let maxLatitude = -90.0;
  let minLongitude = 180.0;
  let maxLongitude = -180.0;
  const normalizedPoints: Array<GeometryCoordinate & { weight: number }> = [];

  for (let index = 0; index < points.length; index += 1) {
    const coordinate = geometryNormalizeCoordinate(points[index]);
    if (!coordinate) {
      continue;
    }
    const weight = geometryToNumber(points[index].weight, 1.0);
    normalizedPoints.push({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      weight,
    });
    minLatitude = Math.min(minLatitude, coordinate.latitude);
    maxLatitude = Math.max(maxLatitude, coordinate.latitude);
    minLongitude = Math.min(minLongitude, coordinate.longitude);
    maxLongitude = Math.max(maxLongitude, coordinate.longitude);
  }

  if (normalizedPoints.length === 0) {
    return [];
  }

  const latitudeDegreeDistance = 111320.0;
  const longitudeDegreeDistance = 111320.0 * Math.cos(geometryToRadians((minLatitude + maxLatitude) * 0.5));
  const latitudeStep = gridSizeMeters / latitudeDegreeDistance;
  const longitudeStep = gridSizeMeters / longitudeDegreeDistance;
  if (latitudeStep <= 0 || longitudeStep <= 0) {
    return [];
  }

  const grid = new Map<string, { latitudeIndex: number; longitudeIndex: number; intensity: number }>();
  for (let index = 0; index < normalizedPoints.length; index += 1) {
    const latitudeIndex = Math.trunc((normalizedPoints[index].latitude - minLatitude) / latitudeStep);
    const longitudeIndex = Math.trunc((normalizedPoints[index].longitude - minLongitude) / longitudeStep);
    const key = `${latitudeIndex}:${longitudeIndex}`;
    const current = grid.get(key);
    if (current) {
      current.intensity += normalizedPoints[index].weight;
    } else {
      grid.set(key, {
        latitudeIndex,
        longitudeIndex,
        intensity: normalizedPoints[index].weight,
      });
    }
  }

  const cells: GeometryHeatmapCell[] = [];
  grid.forEach((value) => {
    cells.push({
      latitude: minLatitude + (value.latitudeIndex + 0.5) * latitudeStep,
      longitude: minLongitude + (value.longitudeIndex + 0.5) * longitudeStep,
      intensity: value.intensity,
    });
  });
  return cells;
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return apiKey;
  }
  return `${apiKey.slice(0, 4)}***${apiKey.slice(-4)}`;
}

export class ExpoGaodeMapModule extends UITurboModule {
  private static privacyStatus: PrivacyStatus = { ...defaultPrivacyStatus };
  private static sdkConfig: SDKConfig | null = null;
  private static accessTokenId: number = -1;
  private static loadWorldVectorMapEnabled: boolean = false;
  private isUpdatingLocation: boolean = false;
  private wantsLocationUpdates: boolean = false;
  private wantsHeadingUpdates: boolean = false;
  private updateIntervalMs: number = 2000;
  private distanceFilterMeters: number = 0;
  private desiredAccuracyMeters: number = 100;
  private singleLocationTimeoutMs: number = 10000;
  private allowsBackgroundLocationUpdates: boolean = false;
  private locationMode: number = 1;
  private readonly geoLocationChangeListener = (location: GeoLocationLike): void => {
    const payload = this.toLocationPayload(location);
    if (this.wantsLocationUpdates) {
      this.emitModuleEvent('onLocationUpdate', payload);
    }
    if (this.wantsHeadingUpdates) {
      this.emitModuleEvent('onHeadingUpdate', this.toHeadingPayload(location));
    }
  };

  constructor(ctx: UITurboModuleContext) {
    super(ctx);
    console.info('[ExpoGaodeMapModule] constructed');
  }

  override __onDestroy__(): void {
    this.stopGeoUpdatingLocation();
    this.isUpdatingLocation = false;
    this.wantsLocationUpdates = false;
    this.wantsHeadingUpdates = false;
  }

  setPrivacyShow(hasShow: boolean, hasContainsPrivacy: boolean): void {
    ExpoGaodeMapModule.privacyStatus.hasShow = !!hasShow;
    ExpoGaodeMapModule.privacyStatus.hasContainsPrivacy = !!hasContainsPrivacy;
    ExpoGaodeMapModule.updatePrivacyReadyFlag();
    console.info(`[ExpoGaodeMapModule] setPrivacyShow show=${ExpoGaodeMapModule.privacyStatus.hasShow} contain=${ExpoGaodeMapModule.privacyStatus.hasContainsPrivacy}`);
  }

  setPrivacyAgree(hasAgree: boolean): void {
    ExpoGaodeMapModule.privacyStatus.hasAgree = !!hasAgree;
    if (hasAgree && ExpoGaodeMapModule.privacyStatus.privacyVersion) {
      ExpoGaodeMapModule.privacyStatus.agreedPrivacyVersion = ExpoGaodeMapModule.privacyStatus.privacyVersion;
    } else if (!hasAgree) {
      ExpoGaodeMapModule.privacyStatus.agreedPrivacyVersion = null;
    }
    ExpoGaodeMapModule.updatePrivacyReadyFlag();
    console.info(`[ExpoGaodeMapModule] setPrivacyAgree agree=${ExpoGaodeMapModule.privacyStatus.hasAgree}`);
  }

  setPrivacyVersion(version: string): void {
    ExpoGaodeMapModule.privacyStatus.privacyVersion = version || null;
  }

  resetPrivacyConsent(): void {
    ExpoGaodeMapModule.privacyStatus = { ...defaultPrivacyStatus };
    ExpoGaodeMapModule.sdkConfig = null;
  }

  getPrivacyStatus(): PrivacyStatus {
    return { ...ExpoGaodeMapModule.privacyStatus };
  }

  static getPrivacyStatusSnapshot(): PrivacyStatus {
    return { ...ExpoGaodeMapModule.privacyStatus };
  }

  initSDK(config: SDKConfig): void {
    ExpoGaodeMapModule.sdkConfig = { ...(config || {}) };
    const key = ExpoGaodeMapModule.getMapApiKey();
    console.info(`[ExpoGaodeMapModule] initSDK key=${key ? maskApiKey(key) : 'EMPTY'}`);
  }

  static getSDKConfig(): SDKConfig | null {
    const cfg = ExpoGaodeMapModule.sdkConfig;
    return cfg ? { ...cfg } : null;
  }

  static getMapApiKey(): string | undefined {
    const cfg = ExpoGaodeMapModule.sdkConfig;
    return cfg?.harmonyKey || cfg?.androidKey || cfg?.webKey || cfg?.iosKey;
  }

  private static updatePrivacyReadyFlag(): void {
    ExpoGaodeMapModule.privacyStatus.isReady =
      ExpoGaodeMapModule.privacyStatus.hasAgree &&
      ExpoGaodeMapModule.privacyStatus.hasShow &&
      ExpoGaodeMapModule.privacyStatus.hasContainsPrivacy;
  }

  isNativeSDKConfigured(): boolean {
    const cfg = ExpoGaodeMapModule.sdkConfig;
    return !!(cfg?.harmonyKey || cfg?.androidKey || cfg?.iosKey || cfg?.webKey);
  }

  setLoadWorldVectorMap(enabled: boolean): void {
    ExpoGaodeMapModule.loadWorldVectorMapEnabled = !!enabled;
  }

  static isLoadWorldVectorMapEnabled(): boolean {
    return ExpoGaodeMapModule.loadWorldVectorMapEnabled;
  }

  getVersion(): string {
    return 'harmony-0.1.0';
  }

  start(): void {
    this.wantsLocationUpdates = true;
    this.ensureUpdatingLocationRunning();
  }

  stop(): void {
    this.wantsLocationUpdates = false;
    this.stopUpdatingLocationIfIdle();
  }

  isStarted(): boolean {
    return this.isUpdatingLocation;
  }

  startUpdatingHeading(): void {
    this.wantsHeadingUpdates = true;
    this.ensureUpdatingLocationRunning();
  }

  stopUpdatingHeading(): void {
    this.wantsHeadingUpdates = false;
    this.stopUpdatingLocationIfIdle();
  }

  async getCurrentLocation(): Promise<LocationPayload> {
    return new Promise((resolve, reject) => {
      if (!this.isSystemLocationEnabled()) {
        reject(new Error('location service disabled'));
        return;
      }

      const manager = this.getGeoLocationManager();

      if (typeof manager.getCurrentLocation !== 'function') {
        reject(new Error('getCurrentLocation unavailable'));
        return;
      }

      try {
        manager.getCurrentLocation(this.buildSingleLocationRequest(), (error, location) => {
          if (error) {
            reject(new Error(`single location failed: ${JSON.stringify(error)}`));
            return;
          }
          if (!location) {
            reject(new Error('single location empty'));
            return;
          }
          resolve(this.toLocationPayload(location));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async coordinateConvert(
    coordinate: GeometryCoordinateInput | null | undefined,
    type: number | null | undefined
  ): Promise<GeometryCoordinate> {
    const point = geometryNormalizeCoordinate(coordinate);
    if (!point) {
      throw new Error('invalid coordinate');
    }

    const normalizedType = Math.trunc(geometryToNumber(type ?? undefined, 0));
    return geometryCoordinateConvert(point, normalizedType);
  }

  setLocatingWithReGeocode(): void {
    this.applyUpdatingOptionIfPossible();
  }

  setInterval(interval: number): void {
    const nextInterval = Number(interval);
    this.updateIntervalMs = Number.isFinite(nextInterval) && nextInterval >= 0 ? nextInterval : this.updateIntervalMs;
    this.applyUpdatingOptionIfPossible();
  }

  setDistanceFilter(distance: number): void {
    const nextDistance = Number(distance);
    this.distanceFilterMeters =
      Number.isFinite(nextDistance) && nextDistance >= 0 ? nextDistance : this.distanceFilterMeters;
    this.applyUpdatingOptionIfPossible();
  }

  setDesiredAccuracy(accuracy: number): void {
    const normalizedAccuracy = Number(accuracy);
    if (!Number.isFinite(normalizedAccuracy)) {
      return;
    }

    if (normalizedAccuracy <= 1) {
      this.desiredAccuracyMeters = 10;
    } else if (normalizedAccuracy === 2) {
      this.desiredAccuracyMeters = 10;
    } else if (normalizedAccuracy === 3) {
      this.desiredAccuracyMeters = 100;
    } else if (normalizedAccuracy === 4) {
      this.desiredAccuracyMeters = 1000;
    } else if (normalizedAccuracy >= 5) {
      this.desiredAccuracyMeters = 3000;
    }
    this.applyUpdatingOptionIfPossible();
  }

  setLocationMode(mode: number): void {
    this.locationMode = Number(mode);
    this.applyUpdatingOptionIfPossible();
  }

  setLocationTimeout(timeoutSeconds: number): void {
    const timeoutMs = Number(timeoutSeconds) * 1000;
    if (Number.isFinite(timeoutMs) && timeoutMs >= 1000) {
      this.singleLocationTimeoutMs = timeoutMs;
    }
  }

  setReGeocodeTimeout(_timeoutSeconds: number): void {}

  setGeoLanguage(language: string): void {
    const normalized = String(language).trim().toUpperCase();
    if (normalized === 'EN' || normalized === 'EN-US' || normalized === 'EN_US') {
    } else if (normalized === 'DEFAULT') {
    } else {
    }
  }

  setAllowsBackgroundLocationUpdates(allows: boolean): void {
    this.allowsBackgroundLocationUpdates = !!allows;
    this.applyUpdatingOptionIfPossible();
  }

  get isBackgroundLocationEnabled(): boolean {
    return this.allowsBackgroundLocationUpdates;
  }

  setLocationProtocol(_protocol: string): void {}

  setOnceLocation(_isOnceLocation: boolean): void {}
  setSensorEnable(_sensorEnable: boolean): void {}
  setWifiScan(_wifiScan: boolean): void {}
  setGpsFirst(_gpsFirst: boolean): void {}
  setOnceLocationLatest(_onceLocationLatest: boolean): void {}
  setLocationCacheEnable(_locationCacheEnable: boolean): void {}
  setHttpTimeOut(_httpTimeOut: number): void {}
  setPausesLocationUpdatesAutomatically(_pauses: boolean): void {}

  addListener(_eventName: string): void {}
  removeListeners(_count: number): void {}

  private applyUpdatingOptionIfPossible(): void {
    if (!this.isUpdatingLocation) {
      return;
    }

    const shouldContinueUpdating = this.wantsLocationUpdates || this.wantsHeadingUpdates;
    this.stopGeoUpdatingLocation();
    if (shouldContinueUpdating) {
      this.startGeoUpdatingLocation();
    }
  }

  private ensureUpdatingLocationRunning(): void {
    this.startGeoUpdatingLocation();
  }

  private stopUpdatingLocationIfIdle(): void {
    if (this.wantsLocationUpdates || this.wantsHeadingUpdates) {
      return;
    }
    this.stopGeoUpdatingLocation();
  }

  private getGeoLocationManager(): GeoLocationManagerApi {
    return geoLocationManager as GeoLocationManagerApi;
  }

  private startGeoUpdatingLocation(): void {
    if (this.isUpdatingLocation) {
      return;
    }
    if (!this.isSystemLocationEnabled()) {
      console.error('[ExpoGaodeMapModule] location service disabled, skip startUpdatingLocation');
      return;
    }

    const manager = this.getGeoLocationManager();

    if (typeof manager.on !== 'function') {
      console.error('[ExpoGaodeMapModule] geoLocationManager.on unavailable');
      return;
    }

    try {
      manager.on('locationChange', this.buildUpdatingLocationRequest(), this.geoLocationChangeListener);
      this.isUpdatingLocation = true;
    } catch (error) {
      console.error(`[ExpoGaodeMapModule] startUpdatingLocation failed: ${JSON.stringify(error)}`);
    }
  }

  private stopGeoUpdatingLocation(): void {
    if (!this.isUpdatingLocation) {
      return;
    }

    const manager = this.getGeoLocationManager();

    if (typeof manager.off !== 'function') {
      this.isUpdatingLocation = false;
      return;
    }

    try {
      manager.off('locationChange', this.geoLocationChangeListener);
    } catch (error) {
      console.error(`[ExpoGaodeMapModule] stopUpdatingLocation failed: ${JSON.stringify(error)}`);
    } finally {
      this.isUpdatingLocation = false;
    }
  }

  private buildUpdatingLocationRequest(): GeoLocationRequest {
    const scenarios = this.getGeoLocationManager().LocationRequestScenario ?? {};
    return {
      priority: this.resolveLocationPriority(),
      scenario: scenarios.UNSET,
      maxAccuracy: this.desiredAccuracyMeters,
      timeInterval: Math.max(0, Math.round(this.updateIntervalMs / 1000)),
      distanceInterval: this.distanceFilterMeters,
    };
  }

  private buildSingleLocationRequest(): GeoLocationRequest {
    const scenarios = this.getGeoLocationManager().LocationRequestScenario ?? {};
    return {
      priority: this.resolveLocationPriority(),
      scenario: scenarios.UNSET,
      maxAccuracy: this.desiredAccuracyMeters,
      timeoutMs: Math.max(1000, this.singleLocationTimeoutMs),
    };
  }

  private resolveLocationPriority(): number {
    const priorities = this.getGeoLocationManager().LocationRequestPriority ?? {};
    switch (this.locationMode) {
      case 2:
        return priorities.LOW_POWER ?? priorities.UNSET ?? 0;
      case 3:
        return priorities.ACCURACY ?? priorities.UNSET ?? 0;
      case 1:
      default:
        return priorities.FIRST_FIX ?? priorities.UNSET ?? 0;
    }
  }

  private isSystemLocationEnabled(): boolean {
    try {
      const manager = this.getGeoLocationManager();
      if (typeof manager.isLocationEnabled !== 'function') {
        return true;
      }
      return manager.isLocationEnabled();
    } catch {
      return true;
    }
  }

  private toLocationPayload(location: GeoLocationLike): LocationPayload {
    const heading = Number(location.bearing ?? location.direction ?? 0);
    const payload: LocationPayload = {
      latitude: Number(location.latitude ?? 0),
      longitude: Number(location.longitude ?? 0),
      altitude: Number(location.altitude ?? 0),
      accuracy: Number(location.accuracy ?? 0),
      speed: Number(location.speed ?? 0),
      heading,
      bearing: heading,
      timestamp: Number(location.timeStamp ?? Date.now())
    };

    const reGeo = location.reGeo;
    if (reGeo) {
      payload.address = String(reGeo.address ?? '');
      payload.country = String(reGeo.country ?? '');
      payload.province = String(reGeo.province ?? '');
      payload.city = String(reGeo.city ?? '');
      payload.district = String(reGeo.district ?? '');
      payload.cityCode = String(reGeo.citycode ?? '');
      payload.adCode = String(reGeo.adcode ?? '');
      payload.street = String(reGeo.street ?? '');
      payload.streetNumber = String(reGeo.number ?? '');
      payload.poiName = String(reGeo.poiName ?? '');
      payload.aoiName = String(reGeo.aoiName ?? '');
      payload.description = String(reGeo.desc ?? '');
    }
    return payload;
  }

  private toHeadingPayload(location: GeoLocationLike): HeadingPayload {
    const heading = Number(location.bearing ?? location.direction ?? 0);
    return {
      heading,
      magneticHeading: heading,
      trueHeading: heading,
      headingAccuracy: Number(location.accuracy ?? 0),
      x: 0,
      y: 0,
      z: 0,
      timestamp: Number(location.timeStamp ?? Date.now())
    };
  }

  private emitModuleEvent(eventName: string, payload: LocationPayload | HeadingPayload): void {
    try {
      this.ctx.rnInstance.emitDeviceEvent(eventName, payload);
    } catch (error) {
      console.error(`[ExpoGaodeMapModule] emit ${eventName} failed: ${JSON.stringify(error)}`);
    }
  }

  private getUIAbilityContext(): common.UIAbilityContext | null {
    const uiAbilityContext = this.ctx.uiAbilityContext;
    if (!uiAbilityContext) {
      console.error('[ExpoGaodeMapModule] uiAbilityContext is missing, cannot request permission.');
      return null;
    }
    return uiAbilityContext;
  }

  private async getAccessTokenId(): Promise<number> {
    if (ExpoGaodeMapModule.accessTokenId > 0) {
      return ExpoGaodeMapModule.accessTokenId;
    }

    try {
      const bundleInfo = await bundleManager.getBundleInfoForSelf(
        bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION
      );
      const tokenId = bundleInfo.appInfo.accessTokenId;
      if (typeof tokenId === 'number' && tokenId > 0) {
        ExpoGaodeMapModule.accessTokenId = tokenId;
        return tokenId;
      }
    } catch (error) {
      console.error(`[ExpoGaodeMapModule] getAccessTokenId failed: ${JSON.stringify(error)}`);
    }

    return -1;
  }

  private async isPermissionGranted(permission: Permissions): Promise<boolean> {
    const tokenId = await this.getAccessTokenId();
    if (tokenId <= 0) {
      return false;
    }

    const atManager = abilityAccessCtrl.createAtManager();
    try {
      const grantStatus = await atManager.checkAccessToken(tokenId, permission);
      return grantStatus === abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
    } catch (error) {
      console.error(`[ExpoGaodeMapModule] checkAccessToken failed: ${JSON.stringify(error)}`);
      return false;
    }
  }

  private toPermissionRecord(status: HarmonyPermissionStatus): PermissionRecord {
    return {
      granted: status.granted,
      status: status.status,
      canAskAgain: status.canAskAgain,
      isPermanentlyDenied: status.isPermanentlyDenied,
      backgroundLocation: status.backgroundLocation,
      fineLocation: status.fineLocation,
      coarseLocation: status.coarseLocation,
      shouldShowRationale: status.shouldShowRationale,
      message: status.message,
    };
  }

  private async buildLocationPermissionStatus(message?: string): Promise<HarmonyPermissionStatus> {
    const coarseLocation = await this.isPermissionGranted(LOCATION_PERMISSION_APPROXIMATE);
    const fineLocation = await this.isPermissionGranted(LOCATION_PERMISSION_PRECISE);
    const backgroundLocation = await this.isPermissionGranted(LOCATION_PERMISSION_BACKGROUND);
    const granted = coarseLocation || fineLocation;

    return {
      granted,
      status: granted ? 'granted' : 'denied',
      canAskAgain: true,
      isPermanentlyDenied: false,
      backgroundLocation,
      fineLocation,
      coarseLocation,
      shouldShowRationale: !granted,
      message,
    };
  }

  private async requestPermissions(permissions: Array<Permissions>): Promise<PermissionRequestResult | null> {
    const context = this.getUIAbilityContext();
    if (!context) {
      return null;
    }

    const atManager = abilityAccessCtrl.createAtManager();
    try {
      return await atManager.requestPermissionsFromUser(context, permissions);
    } catch (error) {
      console.error(`[ExpoGaodeMapModule] requestPermissionsFromUser failed: ${JSON.stringify(error)}`);
      return null;
    }
  }

  private isRequestGranted(result: PermissionRequestResult | null): boolean {
    if (!result) {
      return false;
    }
    const authResults = result.authResults;
    if (!authResults || authResults.length === 0) {
      return false;
    }
    for (let i = 0; i < authResults.length; i += 1) {
      if (authResults[i] !== abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED) {
        return false;
      }
    }
    return true;
  }

  async checkLocationPermission(): Promise<PermissionRecord> {
    const status = await this.buildLocationPermissionStatus();
    return this.toPermissionRecord(status);
  }

  async requestLocationPermission(): Promise<PermissionRecord> {
    const currentStatus = await this.buildLocationPermissionStatus();
    if (currentStatus.granted) {
      return this.toPermissionRecord(currentStatus);
    }

    const requestResult = await this.requestPermissions(LOCATION_FOREGROUND_PERMISSIONS);
    if (!this.isRequestGranted(requestResult)) {
      const deniedStatus = await this.buildLocationPermissionStatus('用户未授予定位权限');
      return this.toPermissionRecord(deniedStatus);
    }

    const latestStatus = await this.buildLocationPermissionStatus();
    return this.toPermissionRecord(latestStatus);
  }

  async requestBackgroundLocationPermission(): Promise<PermissionRecord> {
    const currentStatus = await this.buildLocationPermissionStatus();
    if (!currentStatus.granted) {
      currentStatus.message = '必须先授予前台定位权限';
      return this.toPermissionRecord(currentStatus);
    }

    if (currentStatus.backgroundLocation) {
      return this.toPermissionRecord(currentStatus);
    }

    const requestResult = await this.requestPermissions(LOCATION_BACKGROUND_PERMISSIONS);
    if (!this.isRequestGranted(requestResult)) {
      const deniedStatus = await this.buildLocationPermissionStatus('后台定位权限未授予');
      return this.toPermissionRecord(deniedStatus);
    }

    const latestStatus = await this.buildLocationPermissionStatus();
    return this.toPermissionRecord(latestStatus);
  }

  distanceBetweenCoordinates(
    coordinate1: GeometryCoordinateInput | null | undefined,
    coordinate2: GeometryCoordinateInput | null | undefined
  ): number {
    const point1 = geometryNormalizeCoordinate(coordinate1);
    const point2 = geometryNormalizeCoordinate(coordinate2);
    if (!point1 || !point2) {
      return 0.0;
    }
    return geometryDistanceMeters(point1, point2);
  }

  isPointInCircle(
    point: GeometryCoordinateInput | null | undefined,
    center: GeometryCoordinateInput | null | undefined,
    radius: number
  ): boolean {
    const targetPoint = geometryNormalizeCoordinate(point);
    const centerPoint = geometryNormalizeCoordinate(center);
    if (!targetPoint || !centerPoint) {
      return false;
    }
    return geometryIsPointInCircle(targetPoint, centerPoint, Number(radius));
  }

  isPointInPolygon(
    point: GeometryCoordinateInput | null | undefined,
    polygon: Array<GeometryCoordinateInput> | Array<Array<GeometryCoordinateInput>> | null | undefined
  ): boolean {
    const targetPoint = geometryNormalizeCoordinate(point);
    const rings = geometryNormalizePolygonRings(polygon);
    if (!targetPoint || rings.length === 0) {
      return false;
    }
    return geometryIsPointInPolygon(targetPoint, rings);
  }

  calculatePolygonArea(
    polygon: Array<GeometryCoordinateInput> | Array<Array<GeometryCoordinateInput>> | null | undefined
  ): number {
    const rings = geometryNormalizePolygonRings(polygon);
    return geometryCalculatePolygonAreaWithHoles(rings);
  }

  calculateRectangleArea(
    southWest: GeometryCoordinateInput | null | undefined,
    northEast: GeometryCoordinateInput | null | undefined
  ): number {
    const southWestPoint = geometryNormalizeCoordinate(southWest);
    const northEastPoint = geometryNormalizeCoordinate(northEast);
    if (!southWestPoint || !northEastPoint) {
      return 0.0;
    }
    return geometryCalculateRectangleArea(southWestPoint, northEastPoint);
  }

  getNearestPointOnPath(
    path: Array<GeometryCoordinateInput> | null | undefined,
    target: GeometryCoordinateInput | null | undefined
  ): GeometryNearestPointResult | null {
    const pathPoints = geometryNormalizeCoordinateList(path);
    const targetPoint = geometryNormalizeCoordinate(target);
    if (pathPoints.length === 0 || !targetPoint) {
      return null;
    }
    return geometryGetNearestPointOnPath(pathPoints, targetPoint);
  }

  calculateCentroid(
    polygon: Array<GeometryCoordinateInput> | Array<Array<GeometryCoordinateInput>> | null | undefined
  ): GeometryCoordinate | null {
    const rings = geometryNormalizePolygonRings(polygon);
    return geometryCalculateCentroidWithHoles(rings);
  }

  calculatePathBounds(
    points: Array<GeometryCoordinateInput> | null | undefined
  ): GeometryPathBounds | null {
    const normalizedPoints = geometryNormalizeCoordinateList(points);
    return geometryCalculatePathBounds(normalizedPoints);
  }

  encodeGeoHash(
    coordinate: GeometryCoordinateInput | null | undefined,
    precision: number
  ): string {
    const point = geometryNormalizeCoordinate(coordinate);
    if (!point) {
      return '';
    }
    return geometryEncodeGeoHash(point, precision);
  }

  simplifyPolyline(
    points: Array<GeometryCoordinateInput> | null | undefined,
    tolerance: number
  ): GeometryCoordinate[] {
    const normalizedPoints = geometryNormalizeCoordinateList(points);
    return geometrySimplifyPolyline(normalizedPoints, Number(tolerance));
  }

  calculatePathLength(
    points: Array<GeometryCoordinateInput> | null | undefined
  ): number {
    const normalizedPoints = geometryNormalizeCoordinateList(points);
    return geometryCalculatePathLength(normalizedPoints);
  }

  parsePolyline(polylineStr: string | null | undefined): GeometryCoordinate[] {
    return geometryParsePolyline(polylineStr);
  }

  getPointAtDistance(
    points: Array<GeometryCoordinateInput> | null | undefined,
    distance: number
  ): GeometryPointAtDistanceResult | null {
    const normalizedPoints = geometryNormalizeCoordinateList(points);
    return geometryGetPointAtDistance(normalizedPoints, Number(distance));
  }

  latLngToTile(
    coordinate: GeometryCoordinateInput | null | undefined,
    zoom: number
  ): GeometryTileResult | null {
    const point = geometryNormalizeCoordinate(coordinate);
    if (!point || !Number.isFinite(zoom)) {
      return null;
    }
    return geometryLatLngToTile(point, Math.trunc(zoom));
  }

  tileToLatLng(
    tile: GeometryTileResult | null | undefined
  ): GeometryCoordinate | null {
    if (!tile) {
      return null;
    }

    const x = geometryToNumber(tile.x, Number.NaN);
    const y = geometryToNumber(tile.y, Number.NaN);
    const z = geometryToNumber(tile.z, Number.NaN);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return null;
    }

    return geometryTileToLatLng({
      x: Math.trunc(x),
      y: Math.trunc(y),
      z: Math.trunc(z),
    });
  }

  latLngToPixel(
    coordinate: GeometryCoordinateInput | null | undefined,
    zoom: number
  ): GeometryPixelResult | null {
    const point = geometryNormalizeCoordinate(coordinate);
    if (!point || !Number.isFinite(zoom)) {
      return null;
    }
    return geometryLatLngToPixel(point, Math.trunc(zoom));
  }

  pixelToLatLng(
    pixel: GeometryPixelResult | null | undefined,
    zoom: number
  ): GeometryCoordinate | null {
    if (!pixel || !Number.isFinite(zoom)) {
      return null;
    }

    const x = geometryToNumber(pixel.x, Number.NaN);
    const y = geometryToNumber(pixel.y, Number.NaN);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return geometryPixelToLatLng({ x, y }, Math.trunc(zoom));
  }

  findPointInPolygons(
    point: GeometryCoordinateInput | null | undefined,
    polygons: Array<Array<GeometryCoordinateInput>> | null | undefined
  ): number {
    const targetPoint = geometryNormalizeCoordinate(point);
    if (!targetPoint || !polygons || polygons.length === 0) {
      return -1;
    }

    const normalizedPolygons: GeometryCoordinate[][] = [];
    for (let index = 0; index < polygons.length; index += 1) {
      const polygon = geometryNormalizeCoordinateList(polygons[index]);
      if (polygon.length > 0) {
        normalizedPolygons.push(polygon);
      }
    }

    return geometryFindPointInPolygons(targetPoint, normalizedPolygons);
  }

  generateHeatmapGrid(
    points: GeometryHeatmapPoint[] | null | undefined,
    gridSizeMeters: number
  ): GeometryHeatmapCell[] {
    if (!points || points.length === 0) {
      return [];
    }
    return geometryGenerateHeatmapGrid(points, Number(gridSizeMeters));
  }

  openAppSettings(): void {
    console.warn('[ExpoGaodeMapModule] openAppSettings is not implemented on Harmony yet.');
  }
}

export default ExpoGaodeMapModule;
