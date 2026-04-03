// This file is generated from internal/core-nav-source. Run `yarn sync:core-nav-shared` after editing the source files.
import * as React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Platform, StyleSheet, View } from 'react-native';
import type { LatLng, MarkerProps } from '../../types';
import { normalizeLatLng, normalizeLatLngList } from '../../utils/GeoUtils';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';

type NativeMarkerViewProps = Omit<MarkerProps, 'position'> & {
  latitude: number;
  longitude: number;
};

const getNativeMarkerView = createLazyNativeViewManager<NativeMarkerViewProps>(
  'MarkerView'
);

const AUTO_SIZE_FALLBACK = { width: 0, height: 0 };

export function normalizeMarkerSmoothMovePath(
  smoothMovePath: MarkerProps['smoothMovePath']
): LatLng[] | undefined {
  if (!smoothMovePath) {
    return undefined;
  }

  return normalizeLatLngList(smoothMovePath) as LatLng[];
}

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

export function areMarkerPropsEqual(
  prevProps: MarkerProps,
  nextProps: MarkerProps
): boolean {
  const prevPos = normalizeLatLng(prevProps.position);
  const nextPos = normalizeLatLng(nextProps.position);

  if (
    prevPos.latitude !== nextPos.latitude ||
    prevPos.longitude !== nextPos.longitude
  ) {
    return false;
  }

  if (prevProps.cacheKey !== nextProps.cacheKey) {
    return false;
  }

  if (prevProps.children !== nextProps.children) {
    return false;
  }

  if (
    prevProps.customViewWidth !== nextProps.customViewWidth ||
    prevProps.customViewHeight !== nextProps.customViewHeight ||
    prevProps.icon !== nextProps.icon ||
    prevProps.iconWidth !== nextProps.iconWidth ||
    prevProps.iconHeight !== nextProps.iconHeight
  ) {
    return false;
  }

  if (
    !areSmoothMovePathsEqual(
      prevProps.smoothMovePath,
      nextProps.smoothMovePath
    )
  ) {
    return false;
  }

  if (prevProps.smoothMoveDuration !== nextProps.smoothMoveDuration) {
    return false;
  }

  return true;
}

export function MarkerBase(props: MarkerProps) {
  const NativeMarkerView = React.useMemo(() => getNativeMarkerView(), []);
  const [measuredSize, setMeasuredSize] = React.useState(AUTO_SIZE_FALLBACK);
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

  const normalizedPosition = normalizeLatLng(position);
  const normalizedSmoothMovePath =
    normalizeMarkerSmoothMovePath(smoothMovePath);

  const hasChildren = Boolean(children);
  const shouldWrapChildrenForMeasurement = hasChildren;
  const shouldUseAutoMeasuredSize = Platform.OS === 'ios';
  const resolvedCustomViewWidth =
    customViewWidth && customViewWidth > 0
      ? customViewWidth
      : shouldUseAutoMeasuredSize
        ? measuredSize.width
        : 0;
  const resolvedCustomViewHeight =
    customViewHeight && customViewHeight > 0
      ? customViewHeight
      : shouldUseAutoMeasuredSize
        ? measuredSize.height
        : 0;

  const handleAutoMeasure = (event: LayoutChangeEvent) => {
    const nextWidth =
      customViewWidth && customViewWidth > 0
        ? customViewWidth
        : Math.ceil(event.nativeEvent.layout.width);
    const nextHeight =
      customViewHeight && customViewHeight > 0
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

  const finalIconWidth = hasChildren
    ? resolvedCustomViewWidth
    : iconWidth && iconWidth > 0
      ? iconWidth
      : 40;
  const finalIconHeight = hasChildren
    ? resolvedCustomViewHeight
    : iconHeight && iconHeight > 0
      ? iconHeight
      : 40;

  const optionalNativeProps =
    cacheKey != null ? { cacheKey } : undefined;

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
      ) : (
        children
      )}
    </NativeMarkerView>
  );
}

const styles = StyleSheet.create({
  measureContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
});
