import * as React from 'react';

import type { AreaMaskOverlayProps } from '../types/route-playback.types';
import { normalizeLatLngList } from '../utils/GeoUtils';
import { parseMultiRingPolyline } from '../utils/RouteUtils';
import { Polygon } from './overlays';

export function AreaMaskOverlay({ rings, polygonProps }: AreaMaskOverlayProps) {
  // 支持直接传多环坐标，或传高德返回的 polyline 字符串。
  // 最终都落到 Polygon 的“带孔多边形”能力上。
  const normalizedPoints = React.useMemo(() => {
    if (typeof rings === 'string') {
      return parseMultiRingPolyline(rings).rings;
    }

    return normalizeLatLngList(rings);
  }, [rings]);

  if (!normalizedPoints.length) {
    return null;
  }

  return (
    <Polygon
      points={normalizedPoints}
      fillColor={polygonProps?.fillColor ?? 'rgba(15, 23, 42, 0.45)'}
      strokeColor={polygonProps?.strokeColor ?? 'rgba(15, 23, 42, 0.8)'}
      strokeWidth={polygonProps?.strokeWidth ?? 1}
      {...polygonProps}
    />
  );
}

export default AreaMaskOverlay;
