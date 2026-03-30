import type { LatLng, LatLngBounds, LatLngPoint } from '../types/common.types';
import type {
  FitToCoordinatesOptions,
  FitToCoordinatesTarget,
  MultiRingPolyline,
  RouteBounds,
} from '../types/route-playback.types';
import { normalizeLatLng, normalizeLatLngList } from './GeoUtils';

const MIN_ZOOM = 3;
const MAX_ZOOM = 20;
const DEFAULT_SINGLE_POINT_ZOOM = 16;
const DEFAULT_PADDING_FACTOR = 1.2;

export function estimateZoomLevel(
  latitudeDelta: number,
  longitudeDelta: number,
  options: Pick<FitToCoordinatesOptions, 'minZoom' | 'maxZoom'> = {}
): number {
  // 使用经纬度跨度估算一个“足够看全路径”的缩放级别。
  // 这是高层 TS 兜底逻辑，不依赖具体原生 SDK 的 fitBounds 能力。
  const span = Math.max(latitudeDelta, longitudeDelta, 0.0001);
  const rawZoom = Math.log2(360 / span);
  const minZoom = options.minZoom ?? MIN_ZOOM;
  const maxZoom = options.maxZoom ?? MAX_ZOOM;
  return Math.max(minZoom, Math.min(maxZoom, Number(rawZoom.toFixed(2))));
}

export function getRouteBounds(
  points: LatLngPoint[],
  options: Pick<FitToCoordinatesOptions, 'paddingFactor' | 'minZoom' | 'maxZoom'> = {}
): RouteBounds | null {
  // 统一将路径点转换为对象坐标，再计算中心点、边界和推荐缩放。
  const normalized = normalizeLatLngList(points) as LatLng[];
  if (normalized.length === 0) {
    return null;
  }

  const latitudes = normalized.map((point) => point.latitude);
  const longitudes = normalized.map((point) => point.longitude);

  const north = Math.max(...latitudes);
  const south = Math.min(...latitudes);
  const east = Math.max(...longitudes);
  const west = Math.min(...longitudes);
  const paddingFactor = options.paddingFactor ?? DEFAULT_PADDING_FACTOR;
  const latitudeDelta = Math.max((north - south) * paddingFactor, 0.0001);
  const longitudeDelta = Math.max((east - west) * paddingFactor, 0.0001);

  return {
    center: {
      latitude: (north + south) / 2,
      longitude: (east + west) / 2,
    },
    bounds: {
      north,
      south,
      east,
      west,
    },
    span: {
      latitudeDelta,
      longitudeDelta,
    },
    recommendedZoom: estimateZoomLevel(latitudeDelta, longitudeDelta, options),
  };
}

function parsePolylineRing(polyline: string): LatLng[] {
  if (!polyline.trim()) {
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
    .filter((point): point is LatLng => point !== null);
}

export function parseMultiRingPolyline(polyline: string): MultiRingPolyline {
  // 高德 AOI / 多边形边界常见格式为 ring1|ring2，
  // 这里按“外环/内环”统一拆成二维坐标数组。
  const rings = polyline
    .split('|')
    .map((ring) => parsePolylineRing(ring))
    .filter((ring) => ring.length > 0);

  const flattened = rings.flat();
  const bounds = flattened.length
    ? {
        southwest: {
          latitude: Math.min(...flattened.map((point) => point.latitude)),
          longitude: Math.min(...flattened.map((point) => point.longitude)),
        },
        northeast: {
          latitude: Math.max(...flattened.map((point) => point.latitude)),
          longitude: Math.max(...flattened.map((point) => point.longitude)),
        },
      }
    : null;

  return {
    rings,
    bounds,
  };
}

export async function fitCameraToCoordinates(
  map: FitToCoordinatesTarget,
  points: LatLngPoint[],
  options: FitToCoordinatesOptions = {}
): Promise<void> {
  // 高层相机适配：
  // 1. 单点时直接移动到该点；
  // 2. 多点时计算中心点与推荐缩放；
  // 3. 尽量保留当前朝向和俯仰，避免突兀跳变。
  const normalized = normalizeLatLngList(points) as LatLng[];
  if (normalized.length === 0) {
    return;
  }

  const currentCamera: Awaited<ReturnType<FitToCoordinatesTarget['getCameraPosition']>> =
    await map.getCameraPosition().catch(() => ({}));

  if (normalized.length === 1) {
    const single = normalizeLatLng(normalized[0]);
    await map.moveCamera(
      {
        target: single,
        zoom: options.singlePointZoom ?? currentCamera.zoom ?? DEFAULT_SINGLE_POINT_ZOOM,
        bearing: options.preserveBearing === false ? options.bearing : currentCamera.bearing ?? options.bearing,
        tilt: options.preserveTilt === false ? options.tilt : currentCamera.tilt ?? options.tilt,
      },
      options.duration ?? 0
    );
    return;
  }

  const routeBounds = getRouteBounds(normalized, options);
  if (!routeBounds) {
    return;
  }

  await map.moveCamera(
    {
      target: routeBounds.center,
      zoom: routeBounds.recommendedZoom,
      bearing: options.preserveBearing === false ? options.bearing : currentCamera.bearing ?? options.bearing,
      tilt: options.preserveTilt === false ? options.tilt : currentCamera.tilt ?? options.tilt,
    },
    options.duration ?? 0
  );
}

export function buildLatLngBounds(points: LatLngPoint[]): LatLngBounds | null {
  const routeBounds = getRouteBounds(points);
  if (!routeBounds) {
    return null;
  }

  return {
    southwest: {
      latitude: routeBounds.bounds.south,
      longitude: routeBounds.bounds.west,
    },
    northeast: {
      latitude: routeBounds.bounds.north,
      longitude: routeBounds.bounds.east,
    },
  };
}
