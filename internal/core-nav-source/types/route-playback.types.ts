import type { NativeSyntheticEvent } from 'react-native';

import type { LatLng, LatLngBounds, LatLngPoint, Point } from './common.types';
import type { MarkerProps, PolygonProps, PolylineProps } from './overlays.types';

export interface RouteBounds {
  center: LatLng;
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

export interface FitToCoordinatesOptions {
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

export interface SmoothMoveProgressEvent {
  position: LatLng;
  angle: number;
  progress: number;
  distance: number;
  totalDistance: number;
}

export interface SmoothMoveEndEvent {
  position: LatLng;
  angle: number;
  totalDistance: number;
}

export interface RoutePlaybackOptions {
  durationSeconds?: number;
  minDurationSeconds?: number;
  speedMultiplier?: number;
  baseSpeedMps?: number;
  updateIntervalMs?: number;
  followCamera?: boolean;
  followZoom?: number;
  bearingSmoothing?: number;
  lookAheadDistanceMeters?: number;
  simplificationTolerance?: number;
  autoFit?: boolean;
  fitOptions?: FitToCoordinatesOptions;
  onProgress?: (state: RoutePlaybackState) => void;
  onComplete?: (state: RoutePlaybackState) => void;
}

export interface RoutePlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  progress: number;
  currentPosition: LatLng | null;
  currentAngle: number;
  totalDistance: number;
  traveledDistance: number;
  durationSeconds: number;
  smoothMovePath?: LatLng[];
  smoothMoveDuration?: number;
}

export interface RoutePlaybackController extends RoutePlaybackState {
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  seek(progress: number): void;
  setSpeedMultiplier(multiplier: number): void;
}

export interface RouteOverlayProps {
  points: LatLngPoint[];
  showStartMarker?: boolean;
  showEndMarker?: boolean;
  polylineProps?: Omit<PolylineProps, 'points'>;
  startMarkerProps?: Omit<MarkerProps, 'position'>;
  endMarkerProps?: Omit<MarkerProps, 'position'>;
}

export interface AreaMaskOverlayProps {
  rings: LatLngPoint[][] | string;
  polygonProps?: Omit<PolygonProps, 'points'>;
}

export interface MultiRingPolyline {
  rings: LatLng[][];
  bounds: LatLngBounds | null;
}

export type SmoothMoveProgressEventHandler = (
  event: NativeSyntheticEvent<SmoothMoveProgressEvent>
) => void;

export type SmoothMoveEndEventHandler = (
  event: NativeSyntheticEvent<SmoothMoveEndEvent>
) => void;

export interface FitToCoordinatesTarget {
  moveCamera(
    position: {
      target?: LatLng;
      zoom?: number;
      bearing?: number;
      tilt?: number;
    },
    duration?: number
  ): Promise<void>;
  getCameraPosition(): Promise<{
    target?: LatLng;
    zoom?: number;
    bearing?: number;
    tilt?: number;
  }>;
}

export interface EdgePadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface CoordinateScreenProjector {
  getLatLng(point: Point): Promise<LatLng>;
}
