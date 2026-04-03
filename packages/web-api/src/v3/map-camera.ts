// This file is generated from internal/v3-source. Run `yarn sync:v3-shared` after editing the source files.
export interface CameraLatLng {
  latitude: number;
  longitude: number;
}

export type CameraLatLngPoint =
  | CameraLatLng
  | [number, number]
  | number[];

export interface CameraUpdateShape {
  target?: CameraLatLng;
  zoom?: number;
  bearing?: number;
  tilt?: number;
}

export interface CameraPositionShape extends CameraUpdateShape {}

export interface CameraBoundsShape {
  southwest: CameraLatLng;
  northeast: CameraLatLng;
}

export interface FitCameraOptions {
  duration?: number;
  paddingFactor?: number;
  minZoom?: number;
  maxZoom?: number;
  singlePointZoom?: number;
  bearing?: number;
  tilt?: number;
  preserveBearing?: boolean;
  preserveTilt?: boolean;
}

export interface RouteBoundsShape {
  center: CameraLatLng;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  span: {
    latitudeDelta: number;
    longitudeDelta: number;
  };
  recommendedZoom: number;
}

export interface FitCameraTarget {
  moveCamera(position: CameraUpdateShape, duration?: number): Promise<void>;
  getCameraPosition(): Promise<CameraPositionShape>;
}

const MIN_ZOOM = 3;
const MAX_ZOOM = 20;
const DEFAULT_SINGLE_POINT_ZOOM = 16;
const DEFAULT_PADDING_FACTOR = 1.2;

function normalizeLatLng(point: CameraLatLngPoint): CameraLatLng {
  if (Array.isArray(point)) {
    return {
      longitude: Number(point[0]),
      latitude: Number(point[1]),
    };
  }

  return {
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
  };
}

function normalizeLatLngList(points: CameraLatLngPoint[]): CameraLatLng[] {
  return points.map(normalizeLatLng);
}

export function estimateCameraZoom(
  latitudeDelta: number,
  longitudeDelta: number,
  options: Pick<FitCameraOptions, 'minZoom' | 'maxZoom'> = {}
): number {
  const span = Math.max(latitudeDelta, longitudeDelta, 0.0001);
  const rawZoom = Math.log2(360 / span);
  const minZoom = options.minZoom ?? MIN_ZOOM;
  const maxZoom = options.maxZoom ?? MAX_ZOOM;
  return Math.max(minZoom, Math.min(maxZoom, Number(rawZoom.toFixed(2))));
}

export function getCameraRouteBounds(
  points: CameraLatLngPoint[],
  options: Pick<FitCameraOptions, 'paddingFactor' | 'minZoom' | 'maxZoom'> = {}
): RouteBoundsShape | null {
  const normalized = normalizeLatLngList(points);
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
    recommendedZoom: estimateCameraZoom(latitudeDelta, longitudeDelta, options),
  };
}

export async function fitCameraFromPoints(
  map: FitCameraTarget,
  points: CameraLatLngPoint[],
  options: FitCameraOptions = {}
): Promise<void> {
  const normalized = normalizeLatLngList(points);
  if (normalized.length === 0) {
    return;
  }

  const currentCamera = await map.getCameraPosition().catch(() => ({} as CameraPositionShape));

  if (normalized.length === 1) {
    await map.moveCamera(
      {
        target: normalized[0],
        zoom: options.singlePointZoom ?? currentCamera.zoom ?? DEFAULT_SINGLE_POINT_ZOOM,
        bearing:
          options.preserveBearing === false
            ? options.bearing
            : currentCamera.bearing ?? options.bearing,
        tilt:
          options.preserveTilt === false
            ? options.tilt
            : currentCamera.tilt ?? options.tilt,
      },
      options.duration ?? 0
    );
    return;
  }

  const routeBounds = getCameraRouteBounds(normalized, options);
  if (!routeBounds) {
    return;
  }

  await map.moveCamera(
    {
      target: routeBounds.center,
      zoom: routeBounds.recommendedZoom,
      bearing:
        options.preserveBearing === false
          ? options.bearing
          : currentCamera.bearing ?? options.bearing,
      tilt:
        options.preserveTilt === false
          ? options.tilt
          : currentCamera.tilt ?? options.tilt,
    },
    options.duration ?? 0
  );
}

export function buildCameraBounds(points: CameraLatLngPoint[]): CameraBoundsShape | null {
  const routeBounds = getCameraRouteBounds(points);
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
