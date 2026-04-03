import * as React from 'react';
import { StyleSheet } from 'react-native';
import type { ViewProps } from 'react-native';
import type { HeatMapProps } from '../../types';
import type { LatLng } from '../../types';
import { normalizeLatLngList } from '../../utils/GeoUtils';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';

type NativeHeatMapProps = Omit<HeatMapProps, 'data'> & ViewProps & {
  data: LatLng[];
};

const getNativeHeatMap = createLazyNativeViewManager<NativeHeatMapProps>('HeatMapView');


/**
 * 高德地图热力图组件
 *
 * @param props - 热力图配置属性，继承自NativeHeatMap组件的属性
 * @returns 渲染高德地图原生热力图组件
 */
function HeatMap(props: HeatMapProps) {
  const NativeHeatMap = React.useMemo(() => getNativeHeatMap(), []);
  const { data, ...restProps } = props;
  const normalizedData = normalizeLatLngList(data);

  return (
    <NativeHeatMap
      data={normalizedData}
      {...restProps}
      collapsable={false}
      pointerEvents="none"
      style={styles.hidden}
    />
  );
}

const styles = StyleSheet.create({
  hidden: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
  },
});

/**
 * 🔑 性能优化：浅比较关键属性
 */
function arePropsEqual(prevProps: HeatMapProps, nextProps: HeatMapProps): boolean {
  // 比较 data 数组引用（最常变化）
  if (prevProps.data !== nextProps.data) {
    return false;
  }

  if (prevProps.visible !== nextProps.visible) {
    return false;
  }
  
  // 比较样式属性
  if (prevProps.radius !== nextProps.radius ||
      prevProps.opacity !== nextProps.opacity) {
    return false;
  }
  
  return true;
}

// 导出优化后的组件
export default React.memo(HeatMap, arePropsEqual);
