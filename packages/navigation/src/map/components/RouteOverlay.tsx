// This file is generated from internal/core-nav-source. Run `yarn sync:core-nav-shared` after editing the source files.
import * as React from 'react';

import type { RouteOverlayProps } from '../types/route-playback.types';
import { normalizeLatLngList } from '../utils/GeoUtils';
import { Marker, Polyline } from './overlays';

export function RouteOverlay({
  points,
  showStartMarker = true,
  showEndMarker = true,
  polylineProps,
  startMarkerProps,
  endMarkerProps,
}: RouteOverlayProps) {
  // 统一封装“主路径 + 起点 + 终点”的常见展示组合，
  // 这样业务侧不需要每次手动拼装 3 个覆盖物。
  const normalizedPoints = React.useMemo(
    () => normalizeLatLngList(points),
    [points]
  );

  if (normalizedPoints.length === 0) {
    return null;
  }

  const start = normalizedPoints[0];
  const end = normalizedPoints[normalizedPoints.length - 1];

  return (
    <>
      <Polyline
        points={normalizedPoints}
        strokeWidth={polylineProps?.strokeWidth ?? 6}
        strokeColor={polylineProps?.strokeColor ?? '#2563eb'}
        {...polylineProps}
      />
      {showStartMarker ? (
        <Marker
          position={start}
          title={startMarkerProps?.title ?? '起点'}
          {...startMarkerProps}
        />
      ) : null}
      {showEndMarker ? (
        <Marker
          position={end}
          title={endMarkerProps?.title ?? '终点'}
          {...endMarkerProps}
        />
      ) : null}
    </>
  );
}

export default RouteOverlay;
