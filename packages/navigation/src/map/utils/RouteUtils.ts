// This file is generated from internal/core-nav-source. Run `yarn sync:core-nav-shared` after editing the source files.
import type { LatLng, LatLngBounds, LatLngPoint } from '../types/common.types';
import type {
  FitToCoordinatesOptions,
  FitToCoordinatesTarget,
  MultiRingPolyline,
  RouteBounds,
} from '../types/route-playback.types';
import {
  buildCameraBounds,
  estimateCameraZoom,
  fitCameraFromPoints,
  getCameraRouteBounds,
} from '../v3/map-camera';

export function estimateZoomLevel(
  latitudeDelta: number,
  longitudeDelta: number,
  options: Pick<FitToCoordinatesOptions, 'minZoom' | 'maxZoom'> = {}
): number {
  return estimateCameraZoom(latitudeDelta, longitudeDelta, options);
}

export function getRouteBounds(
  points: LatLngPoint[],
  options: Pick<FitToCoordinatesOptions, 'paddingFactor' | 'minZoom' | 'maxZoom'> = {}
): RouteBounds | null {
  return getCameraRouteBounds(points, options) as RouteBounds | null;
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
  await fitCameraFromPoints(map, points, options);
}

export function buildLatLngBounds(points: LatLngPoint[]): LatLngBounds | null {
  return buildCameraBounds(points) as LatLngBounds | null;
}
