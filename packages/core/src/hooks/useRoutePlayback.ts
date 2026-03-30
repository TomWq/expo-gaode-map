import * as React from 'react';

import ExpoGaodeMapModule from '../ExpoGaodeMapModule';
import { MapContext } from '../components/MapContext';
import type { LatLng } from '../types/common.types';
import type {
  RoutePlaybackController,
  RoutePlaybackOptions,
  RoutePlaybackState,
} from '../types/route-playback.types';
import { normalizeLatLngList } from '../utils/GeoUtils';
import { fitCameraToCoordinates } from '../utils/RouteUtils';

const DEFAULT_STATE: RoutePlaybackState = {
  isPlaying: false,
  isPaused: false,
  progress: 0,
  currentPosition: null,
  currentAngle: 0,
  totalDistance: 0,
  traveledDistance: 0,
  durationSeconds: 0,
};

function getMarkerAngle(
  path: LatLng[],
  totalDistance: number,
  targetDistance: number,
  lastAngle: number,
  options: RoutePlaybackOptions
): { angle: number; point: LatLng | null } {
  // 先取当前距离上的点，再额外预读一个前瞻点，
  // 让车辆朝向在转弯时更自然，不会出现生硬折角。
  const pointInfo = ExpoGaodeMapModule.getPointAtDistance(path, targetDistance);
  if (!pointInfo) {
    return { angle: lastAngle, point: null };
  }

  const lookAheadDistance = options.lookAheadDistanceMeters ?? 5;
  const futurePoint = ExpoGaodeMapModule.getPointAtDistance(
    path,
    Math.min(totalDistance, targetDistance + lookAheadDistance)
  );

  let targetAngle = pointInfo.angle;
  if (futurePoint && targetDistance + lookAheadDistance < totalDistance) {
    let diffNext = futurePoint.angle - pointInfo.angle;
    if (diffNext > 180) diffNext -= 360;
    if (diffNext < -180) diffNext += 360;
    targetAngle = pointInfo.angle + diffNext * 0.4;
  }

  let diff = targetAngle - lastAngle;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  const bearingSmoothing = options.bearingSmoothing ?? 0.2;
  return {
    angle: lastAngle + diff * bearingSmoothing,
    point: {
      latitude: pointInfo.latitude,
      longitude: pointInfo.longitude,
    },
  };
}

export function useRoutePlayback(
  points: Array<LatLng | [number, number] | number[]>,
  options: RoutePlaybackOptions = {}
): RoutePlaybackController {
  const map = React.useContext(MapContext);
  const optionsRef = React.useRef(options);
  const [state, setState] = React.useState<RoutePlaybackState>(DEFAULT_STATE);
  const [speedMultiplier, setSpeedMultiplierState] = React.useState(options.speedMultiplier ?? 1);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startAtRef = React.useRef(0);
  const elapsedBeforePauseRef = React.useRef(0);
  const lastAngleRef = React.useRef(0);

  React.useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const normalizedPath = React.useMemo(() => {
    // 长路径可选走一次抽稀，减少轨迹回放期间的计算量。
    const normalized = normalizeLatLngList(points) as LatLng[];
    if (normalized.length <= 2 || !options.simplificationTolerance) {
      return normalized;
    }
    return ExpoGaodeMapModule.simplifyPolyline(normalized, options.simplificationTolerance);
  }, [options.simplificationTolerance, points]);

  const totalDistance = React.useMemo(
    () => ExpoGaodeMapModule.calculatePathLength(normalizedPath),
    [normalizedPath]
  );

  const durationSeconds = React.useMemo(() => {
    if (options.durationSeconds) {
      return options.durationSeconds;
    }

    const baseSpeed = options.baseSpeedMps ?? 15;
    const minDuration = options.minDurationSeconds ?? 5;
    if (totalDistance <= 0) {
      return 0;
    }

    return Math.max(minDuration, totalDistance / (baseSpeed * Math.max(speedMultiplier, 0.1)));
  }, [
    options.baseSpeedMps,
    options.durationSeconds,
    options.minDurationSeconds,
    speedMultiplier,
    totalDistance,
  ]);

  const stopTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const publishState = React.useCallback(
    (nextState: RoutePlaybackState) => {
      // 统一从这里下发状态，避免不同控制分支各自维护回调时机。
      setState(nextState);
      optionsRef.current.onProgress?.(nextState);
    },
    []
  );

  const syncProgress = React.useCallback(
    async (progress: number, keepPlaying: boolean) => {
      // 根据“当前进度 -> 已行驶距离 -> 路径上的点”推导出车辆位置，
      // 再同步决定 smoothMovePath / 相机跟随 / 对外状态。
      if (normalizedPath.length === 0 || totalDistance <= 0 || durationSeconds <= 0) {
        const nextState = {
          ...DEFAULT_STATE,
          currentPosition: normalizedPath[0] ?? null,
          totalDistance,
          durationSeconds,
        };
        publishState(nextState);
        return nextState;
      }

      const clampedProgress = Math.max(0, Math.min(1, progress));
      const traveledDistance = totalDistance * clampedProgress;
      const { angle, point } = getMarkerAngle(
        normalizedPath,
        totalDistance,
        traveledDistance,
        lastAngleRef.current,
        optionsRef.current
      );
      lastAngleRef.current = angle;

      const nextState: RoutePlaybackState = {
        isPlaying: keepPlaying,
        isPaused: !keepPlaying && clampedProgress > 0 && clampedProgress < 1,
        progress: clampedProgress,
        currentPosition: point ?? normalizedPath[0] ?? null,
        currentAngle: angle,
        totalDistance,
        traveledDistance,
        durationSeconds,
        smoothMovePath: keepPlaying ? normalizedPath : undefined,
        smoothMoveDuration: keepPlaying ? durationSeconds : undefined,
      };

      publishState(nextState);

      if (optionsRef.current.followCamera !== false && nextState.currentPosition && map) {
        await map.moveCamera(
          {
            target: nextState.currentPosition,
            zoom: optionsRef.current.followZoom ?? 17,
            bearing: angle,
          },
          optionsRef.current.updateIntervalMs ?? 100
        );
      }

      return nextState;
    },
    [
      durationSeconds,
      map,
      normalizedPath,
      publishState,
      totalDistance,
    ]
  );

  const stop = React.useCallback(() => {
    stopTimer();
    elapsedBeforePauseRef.current = 0;
    startAtRef.current = 0;
    lastAngleRef.current = 0;
    publishState({
      ...DEFAULT_STATE,
      currentPosition: normalizedPath[0] ?? null,
      totalDistance,
      durationSeconds,
    });
  }, [durationSeconds, normalizedPath, publishState, stopTimer, totalDistance]);

  const start = React.useCallback(async () => {
    stopTimer();
    elapsedBeforePauseRef.current = 0;
    startAtRef.current = Date.now();
    lastAngleRef.current = 0;

    if (optionsRef.current.autoFit !== false && map && normalizedPath.length > 0) {
      await fitCameraToCoordinates(map, normalizedPath, optionsRef.current.fitOptions);
    }

    await syncProgress(0, true);

    // 使用固定间隔推进进度，保证回放速度与 UI 反馈稳定。
    const interval = Math.max(optionsRef.current.updateIntervalMs ?? 100, 16);
    timerRef.current = setInterval(async () => {
      const elapsedMs = Date.now() - startAtRef.current + elapsedBeforePauseRef.current;
      const progress = durationSeconds <= 0 ? 1 : elapsedMs / (durationSeconds * 1000);

      if (progress >= 1) {
        stopTimer();
        elapsedBeforePauseRef.current = 0;
        startAtRef.current = 0;
        const completedState = await syncProgress(1, false);
        optionsRef.current.onComplete?.(completedState);
        return;
      }

      await syncProgress(progress, true);
    }, interval);
  }, [
    durationSeconds,
    map,
    normalizedPath,
    stopTimer,
    syncProgress,
  ]);

  const pause = React.useCallback(() => {
    if (!timerRef.current || durationSeconds <= 0) {
      return;
    }

    stopTimer();
    elapsedBeforePauseRef.current += Date.now() - startAtRef.current;
    publishState({
      ...state,
      isPlaying: false,
      isPaused: true,
      smoothMovePath: undefined,
      smoothMoveDuration: undefined,
    });
  }, [durationSeconds, publishState, state, stopTimer]);

  const resume = React.useCallback(async () => {
    if (state.progress >= 1) {
      await start();
      return;
    }

    startAtRef.current = Date.now();
    publishState({
      ...state,
      isPlaying: true,
      isPaused: false,
      smoothMovePath: normalizedPath,
      smoothMoveDuration: durationSeconds,
    });

    const interval = Math.max(optionsRef.current.updateIntervalMs ?? 100, 16);
    timerRef.current = setInterval(async () => {
      const elapsedMs = Date.now() - startAtRef.current + elapsedBeforePauseRef.current;
      const progress = durationSeconds <= 0 ? 1 : elapsedMs / (durationSeconds * 1000);

      if (progress >= 1) {
        stopTimer();
        elapsedBeforePauseRef.current = 0;
        startAtRef.current = 0;
        const completedState = await syncProgress(1, false);
        optionsRef.current.onComplete?.(completedState);
        return;
      }

      await syncProgress(progress, true);
    }, interval);
  }, [
    durationSeconds,
    normalizedPath,
    publishState,
    start,
    state,
    stopTimer,
    syncProgress,
  ]);

  const seek = React.useCallback(
    (progress: number) => {
      // seek 只重算“已经播放过的时间”，其余状态由 syncProgress 统一刷新。
      const clamped = Math.max(0, Math.min(1, progress));
      elapsedBeforePauseRef.current = clamped * durationSeconds * 1000;
      startAtRef.current = Date.now();
      void syncProgress(clamped, !!timerRef.current);
    },
    [durationSeconds, syncProgress]
  );

  const setSpeedMultiplier = React.useCallback((multiplier: number) => {
    setSpeedMultiplierState(Math.max(multiplier, 0.1));
  }, []);

  React.useEffect(() => () => stopTimer(), [stopTimer]);

  React.useEffect(() => {
    publishState({
      ...DEFAULT_STATE,
      currentPosition: normalizedPath[0] ?? null,
      totalDistance,
      durationSeconds,
    });
  }, [durationSeconds, normalizedPath, publishState, totalDistance]);

  return {
    ...state,
    totalDistance,
    durationSeconds,
    start: () => {
      void start();
    },
    pause,
    resume: () => {
      void resume();
    },
    stop,
    seek,
    setSpeedMultiplier,
  };
}
