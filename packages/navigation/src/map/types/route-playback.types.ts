import type { NativeSyntheticEvent } from 'react-native';

import type { LatLng } from './common.types';

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

export type SmoothMoveProgressEventHandler = (
  event: NativeSyntheticEvent<SmoothMoveProgressEvent>
) => void;

export type SmoothMoveEndEventHandler = (
  event: NativeSyntheticEvent<SmoothMoveEndEvent>
) => void;
