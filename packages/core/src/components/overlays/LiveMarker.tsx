import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent, NativeSyntheticEvent } from 'react-native';
import type { LatLng, LiveMarkerProps } from '../../types';
import { normalizeLatLng } from '../../utils/GeoUtils';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';

type NativeLiveMarkerViewProps = Omit<LiveMarkerProps, 'position'> & {
  coordinate: LatLng;
  contentWidth?: number;
  contentHeight?: number;
};

const getNativeLiveMarkerView = createLazyNativeViewManager<NativeLiveMarkerViewProps>('LiveMarkerView');

/**
 * LiveMarker renders real React Native children above the map and keeps them
 * aligned to a geographic coordinate. Use it for complex marker UI and keep
 * high-volume/static points on Marker, MultiPoint, or Cluster.
 */
function LiveMarker(props: LiveMarkerProps) {
  const NativeLiveMarkerView = React.useMemo(() => getNativeLiveMarkerView(), []);
  const [measuredSize, setMeasuredSize] = React.useState({ width: 0, height: 0 });
  const {
    position,
    anchor = { x: 0.5, y: 1 },
    offset = { x: 0, y: 0 },
    visible = true,
    tracksCamera = true,
    onPress,
    children,
    style,
    ...restProps
  } = props;

  const normalizedPosition = normalizeLatLng(position);
  const flattenedStyle = StyleSheet.flatten(style);
  const resolvedWidth = typeof flattenedStyle?.width === 'number'
    ? flattenedStyle.width
    : measuredSize.width;
  const resolvedHeight = typeof flattenedStyle?.height === 'number'
    ? flattenedStyle.height
    : measuredSize.height;
  const explicitSizeStyle = {
    ...(resolvedWidth > 0 ? { width: resolvedWidth } : null),
    ...(resolvedHeight > 0 ? { height: resolvedHeight } : null),
  };
  const hasMeasuredSize = resolvedWidth > 0 && resolvedHeight > 0;

  const handlePress = React.useCallback((event: NativeSyntheticEvent<LatLng>) => {
    onPress?.(event);
  }, [onPress]);

  const handleMeasure = React.useCallback((event: LayoutChangeEvent) => {
    const nextWidth = Math.ceil(event.nativeEvent.layout.width);
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);

    if (nextWidth <= 0 || nextHeight <= 0) {
      return;
    }

    setMeasuredSize((current) => {
      if (current.width === nextWidth && current.height === nextHeight) {
        return current;
      }

      return {
        width: nextWidth,
        height: nextHeight,
      };
    });
  }, []);

  const markerContent = (
    <View
      collapsable={false}
      onLayout={handleMeasure}
      style={styles.measureContainer}
    >
      {children}
    </View>
  );

  return (
    <>
      <View
        pointerEvents="none"
        collapsable={false}
        onLayout={handleMeasure}
        style={styles.hiddenMeasureContainer}
      >
        {children}
      </View>

      {hasMeasuredSize ? (
        <NativeLiveMarkerView
          coordinate={normalizedPosition}
          contentWidth={resolvedWidth}
          contentHeight={resolvedHeight}
          anchor={anchor}
          offset={offset}
          visible={visible}
          tracksCamera={tracksCamera}
          onPress={handlePress}
          collapsable={false}
          style={[styles.marker, explicitSizeStyle, style]}
          {...restProps}
        >
          {markerContent}
        </NativeLiveMarkerView>
      ) : null}
    </>
  );
}

export default React.memo(LiveMarker);

const styles = StyleSheet.create({
  marker: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  measureContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  hiddenMeasureContainer: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    opacity: 0,
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
});
