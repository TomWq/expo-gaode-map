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

export default React.memo(HeatMap);
