// This file is generated from internal/core-nav-source. Run `yarn sync:core-nav-shared` after editing the source files.
import * as React from 'react';
import type { LatLng } from '../../types';

interface MarkerSmoothMovePoint {
  latitude: number;
  longitude: number;
  angle?: number;
}

export interface MarkerSmoothMoveAdapter {
  calculatePathLength(points: LatLng[]): number;
  getPointAtDistance(
    points: LatLng[],
    distance: number
  ): MarkerSmoothMovePoint | null | undefined;
}

export interface MarkerSmoothMoveOptions {
  enabled?: boolean;
  adapter?: MarkerSmoothMoveAdapter;
  intervalMs?: number;
}

export interface MarkerSmoothMoveRuntimeProps<
  TProgressEvent = unknown,
  TEndEvent = unknown
> {
  smoothMoveDuration?: number;
  onSmoothMoveProgress?: (event: TProgressEvent) => void;
  onSmoothMoveEnd?: (event: TEndEvent) => void;
}

export function useMarkerSmoothMoveExtension<
  TProgressEvent = unknown,
  TEndEvent = unknown
>(
  props: MarkerSmoothMoveRuntimeProps<TProgressEvent, TEndEvent>,
  normalizedSmoothMovePath: LatLng[] | undefined,
  options: MarkerSmoothMoveOptions = {}
): void {
  React.useEffect(() => {
    if (options.enabled === false || !options.adapter) {
      return undefined;
    }

    if (
      !normalizedSmoothMovePath ||
      normalizedSmoothMovePath.length < 2 ||
      !props.smoothMoveDuration ||
      props.smoothMoveDuration <= 0
    ) {
      return undefined;
    }

    const totalDistance = options.adapter.calculatePathLength(
      normalizedSmoothMovePath
    );
    if (totalDistance <= 0) {
      props.onSmoothMoveEnd?.({
        nativeEvent: {
          position: normalizedSmoothMovePath[normalizedSmoothMovePath.length - 1],
          angle: 0,
          totalDistance,
        },
      } as never);
      return undefined;
    }

    const durationMs = props.smoothMoveDuration * 1000;
    const startedAt = Date.now();
    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / durationMs);
      const distance = totalDistance * progress;
      const pointInfo = options.adapter?.getPointAtDistance(
        normalizedSmoothMovePath,
        distance
      );
      const point = pointInfo
        ? { latitude: pointInfo.latitude, longitude: pointInfo.longitude }
        : normalizedSmoothMovePath[normalizedSmoothMovePath.length - 1];
      const angle = pointInfo?.angle ?? 0;

      props.onSmoothMoveProgress?.({
        nativeEvent: {
          position: point,
          angle,
          progress,
          distance,
          totalDistance,
        },
      } as never);

      if (progress >= 1) {
        props.onSmoothMoveEnd?.({
          nativeEvent: {
            position: point,
            angle,
            totalDistance,
          },
        } as never);
      }
    };

    tick();
    const intervalId = setInterval(() => {
      tick();
      if (Date.now() - startedAt >= durationMs) {
        clearInterval(intervalId);
      }
    }, options.intervalMs ?? 100);

    return () => clearInterval(intervalId);
  }, [
    normalizedSmoothMovePath,
    options.adapter,
    options.enabled,
    options.intervalMs,
    props.onSmoothMoveEnd,
    props.onSmoothMoveProgress,
    props.smoothMoveDuration,
  ]);
}
