import * as React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { StyleSheet, View } from 'react-native';
import type { MarkerProps } from '../../types';
import ExpoGaodeMapModule from '../../ExpoGaodeMapModule';
import { normalizeLatLng, normalizeLatLngList } from '../../utils/GeoUtils';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';

type NativeMarkerViewProps = Omit<MarkerProps, 'position'> & {
  latitude: number;
  longitude: number;
  contentWidth?: number;
  contentHeight?: number;
};

const getNativeMarkerView = createLazyNativeViewManager<NativeMarkerViewProps>('MarkerView');

const AUTO_SIZE_FALLBACK = { width: 0, height: 0 };

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
  const NativeMarkerView = React.useMemo(() => getNativeMarkerView(), []);
  const [measuredSize, setMeasuredSize] = React.useState(AUTO_SIZE_FALLBACK);
  // 从 props 中排除 position 属性，避免传递到原生层
  const {
    position,
    iconWidth,
    iconHeight,
    children,
    smoothMovePath,
    cacheKey,
    ...restProps
  } = props;
  
  // 归一化坐标处理
  const normalizedPosition = normalizeLatLng(position);
  const normalizedSmoothMovePath = smoothMovePath ? normalizeLatLngList(smoothMovePath) : undefined;

  // 根据是否有 children 来决定使用哪个尺寸属性
  const hasChildren = !!children;
  const shouldWrapChildrenForMeasurement = hasChildren;
  // Android 的 children marker 之前始终透传 0 尺寸，点击后重新快照时容易直接消失。
  // 统一走自动测量后，两个平台都会拿到稳定尺寸。
  const shouldUseAutoMeasuredSize = hasChildren;
  const resolvedContentWidth = shouldUseAutoMeasuredSize ? measuredSize.width : 0;
  const resolvedContentHeight = shouldUseAutoMeasuredSize ? measuredSize.height : 0;

  React.useEffect(() => {
    if (
      !normalizedSmoothMovePath ||
      normalizedSmoothMovePath.length < 2 ||
      !props.smoothMoveDuration ||
      props.smoothMoveDuration <= 0
    ) {
      return undefined;
    }

    const totalDistance = ExpoGaodeMapModule.calculatePathLength(normalizedSmoothMovePath);
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
      const pointInfo = ExpoGaodeMapModule.getPointAtDistance(normalizedSmoothMovePath, distance);
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
    }, 100);

    return () => clearInterval(intervalId);
  }, [
    normalizedSmoothMovePath,
    props.onSmoothMoveEnd,
    props.onSmoothMoveProgress,
    props.smoothMoveDuration,
  ]);

  const handleAutoMeasure = (event: LayoutChangeEvent) => {
    const nextWidth = Math.ceil(event.nativeEvent.layout.width);
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);

    if (nextWidth === measuredSize.width && nextHeight === measuredSize.height) {
      return;
    }

    setMeasuredSize({
      width: nextWidth,
      height: nextHeight,
    });
  };
  
  // 智能尺寸计算
  const finalIconWidth = hasChildren
    ? resolvedContentWidth
    : (iconWidth && iconWidth > 0 ? iconWidth : 40);
    
  const finalIconHeight = hasChildren
    ? resolvedContentHeight
    : (iconHeight && iconHeight > 0 ? iconHeight : 40);

  const optionalNativeProps = cacheKey != null ? { cacheKey } : undefined;
  
  return (
    <NativeMarkerView
      {...restProps}
      {...optionalNativeProps}
      latitude={normalizedPosition.latitude}
      longitude={normalizedPosition.longitude}
      iconWidth={finalIconWidth}
      iconHeight={finalIconHeight}
      contentWidth={hasChildren ? finalIconWidth : 0}
      contentHeight={hasChildren ? finalIconHeight : 0}
      smoothMovePath={normalizedSmoothMovePath}
    >
      {hasChildren && shouldWrapChildrenForMeasurement ? (
        <View
          collapsable={false}
          onLayout={handleAutoMeasure}
          style={styles.measureContainer}
        >
          {children}
        </View>
      ) : children}
    </NativeMarkerView>
  );
}

export default React.memo(Marker);

const styles = StyleSheet.create({
  measureContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
});
