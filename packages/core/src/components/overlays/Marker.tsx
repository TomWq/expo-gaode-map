import * as React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Platform, StyleSheet, View } from 'react-native';
import type { MarkerProps } from '../../types';
import ExpoGaodeMapModule from '../../ExpoGaodeMapModule';
import { normalizeLatLng, normalizeLatLngList } from '../../utils/GeoUtils';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';

type NativeMarkerViewProps = Omit<MarkerProps, 'position'> & {
  latitude: number;
  longitude: number;
};

const getNativeMarkerView = createLazyNativeViewManager<NativeMarkerViewProps>('MarkerView');

const AUTO_SIZE_FALLBACK = { width: 0, height: 0 };

function areSmoothMovePathsEqual(
  prevPath: MarkerProps['smoothMovePath'],
  nextPath: MarkerProps['smoothMovePath']
): boolean {
  if (prevPath === nextPath) {
    return true;
  }

  if (!prevPath || !nextPath) {
    return prevPath === nextPath;
  }

  if (prevPath.length !== nextPath.length) {
    return false;
  }

  for (let index = 0; index < prevPath.length; index += 1) {
    const prevPoint = normalizeLatLng(prevPath[index]);
    const nextPoint = normalizeLatLng(nextPath[index]);

    if (
      prevPoint.latitude !== nextPoint.latitude ||
      prevPoint.longitude !== nextPoint.longitude
    ) {
      return false;
    }
  }

  return true;
}

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
    customViewWidth,
    customViewHeight,
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
  const shouldUseAutoMeasuredSize = Platform.OS === 'ios';
  const resolvedCustomViewWidth = customViewWidth && customViewWidth > 0
    ? customViewWidth
    : (shouldUseAutoMeasuredSize ? measuredSize.width : 0);
  const resolvedCustomViewHeight = customViewHeight && customViewHeight > 0
    ? customViewHeight
    : (shouldUseAutoMeasuredSize ? measuredSize.height : 0);

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
    const nextWidth = customViewWidth && customViewWidth > 0
      ? customViewWidth
      : Math.ceil(event.nativeEvent.layout.width);
    const nextHeight = customViewHeight && customViewHeight > 0
      ? customViewHeight
      : Math.ceil(event.nativeEvent.layout.height);

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
    ? resolvedCustomViewWidth
    : (iconWidth && iconWidth > 0 ? iconWidth : 40);
    
  const finalIconHeight = hasChildren
    ? resolvedCustomViewHeight
    : (iconHeight && iconHeight > 0 ? iconHeight : 40);

  const optionalNativeProps = cacheKey != null ? { cacheKey } : undefined;
  
  return (
    <NativeMarkerView
      latitude={normalizedPosition.latitude}
      longitude={normalizedPosition.longitude}
      iconWidth={finalIconWidth}
      iconHeight={finalIconHeight}
      customViewWidth={finalIconWidth}
      customViewHeight={finalIconHeight}
      smoothMovePath={normalizedSmoothMovePath}
      {...optionalNativeProps}
      {...restProps}
    >
      {hasChildren && shouldWrapChildrenForMeasurement ? (
        <View
          collapsable={false}
          onLayout={Platform.OS === 'ios' ? handleAutoMeasure : undefined}
          style={styles.measureContainer}
        >
          {children}
        </View>
      ) : children}
    </NativeMarkerView>
  );
}

/**
 * 🔑 性能优化：极简比较函数
 * 只检查最常变化的关键属性,减少 JS 线程开销
 */
function arePropsEqual(prevProps: MarkerProps, nextProps: MarkerProps): boolean {
  // 快速路径：比较 position (最常变化)
  const prevPos = normalizeLatLng(prevProps.position);
  const nextPos = normalizeLatLng(nextProps.position);

  if (
    prevPos.latitude !== nextPos.latitude ||
    prevPos.longitude !== nextPos.longitude
  ) {
    return false;
  }
  
  // 比较 cacheKey (如果提供了 cacheKey,其他属性理论上不会变)
  if (prevProps.cacheKey !== nextProps.cacheKey) {
    return false;
  }
  
  // 比较 children (如果有 children)
  if (prevProps.children !== nextProps.children) {
    return false;
  }

  // 比较自定义内容尺寸和图标尺寸
  if (
    prevProps.customViewWidth !== nextProps.customViewWidth ||
    prevProps.customViewHeight !== nextProps.customViewHeight ||
    prevProps.icon !== nextProps.icon ||
    prevProps.iconWidth !== nextProps.iconWidth ||
    prevProps.iconHeight !== nextProps.iconHeight
  ) {
    return false;
  }
  
  // 比较 smoothMovePath (平滑移动路径)
  if (!areSmoothMovePathsEqual(prevProps.smoothMovePath, nextProps.smoothMovePath)) {
    return false;
  }
  
  // 比较 smoothMoveDuration (平滑移动时长)
  if (prevProps.smoothMoveDuration !== nextProps.smoothMoveDuration) {
    return false;
  }
  
  // 其他属性相同,不重新渲染
  return true;
}

// 导出优化后的组件
export default React.memo(Marker, arePropsEqual);

const styles = StyleSheet.create({
  measureContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
});
