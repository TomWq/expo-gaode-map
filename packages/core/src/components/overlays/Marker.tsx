import * as React from 'react';
import type { MarkerProps } from '../../types';
import ExpoGaodeMapModule from '../../ExpoGaodeMapModule';
import {
  areMarkerPropsEqual,
  MarkerBase,
  normalizeMarkerSmoothMovePath,
} from './marker-base';
import {
  type MarkerSmoothMoveAdapter,
  useMarkerSmoothMoveExtension,
} from './marker-smooth-move';

/**
 * Marker 组件 - 完全声明式 API
 *
 * 支持：
 * - 自定义图标（icon）
 * - 自定义内容（children）- 自动测量尺寸
 * - 大头针样式（pinColor）
 * - 拖拽功能
 * - 所有事件回调
 */
function Marker(props: MarkerProps) {
  const normalizedSmoothMovePath = React.useMemo(
    () => normalizeMarkerSmoothMovePath(props.smoothMovePath),
    [props.smoothMovePath]
  );
  const smoothMoveAdapter = React.useMemo<MarkerSmoothMoveAdapter>(
    () => ({
      calculatePathLength: (points) =>
        ExpoGaodeMapModule.calculatePathLength(points),
      getPointAtDistance: (points, distance) =>
        ExpoGaodeMapModule.getPointAtDistance(points, distance),
    }),
    []
  );

  useMarkerSmoothMoveExtension(props, normalizedSmoothMovePath, {
    enabled: true,
    adapter: smoothMoveAdapter,
  });

  return <MarkerBase {...props} />;
}

// 导出优化后的组件
export default React.memo(Marker, areMarkerPropsEqual);
