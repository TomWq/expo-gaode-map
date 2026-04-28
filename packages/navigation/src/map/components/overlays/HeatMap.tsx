import * as React from 'react';
import { StyleSheet } from 'react-native';
import type { ViewProps } from 'react-native';
import type { HeatMapProps } from '../../types';
import type { LatLng } from '../../types';
import { normalizeLatLng } from '../../utils/GeoUtils';
import { createLazyNativeViewManager } from '../../utils/lazyNativeViewManager';

type NativeHeatMapPoint = LatLng & {
  intensity?: number;
  weight?: number;
  count?: number;
  value?: number;
};

type NativeHeatMapProps = Omit<HeatMapProps, 'data'> & ViewProps & {
  data: NativeHeatMapPoint[];
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
  const normalizedData = React.useMemo(() => normalizeHeatMapData(data), [data]);

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

function normalizeHeatMapData(data: HeatMapProps['data']): NativeHeatMapPoint[] {
  return data.map((point) => {
    const normalized = normalizeLatLng(point);
    if (Array.isArray(point)) {
      return {
        ...normalized,
        intensity: typeof point[2] === 'number' ? point[2] : undefined,
      };
    }

    const extra = point as Partial<NativeHeatMapPoint>;
    return {
      ...normalized,
      intensity: typeof extra.intensity === 'number' ? extra.intensity : undefined,
      weight: typeof extra.weight === 'number' ? extra.weight : undefined,
      count: typeof extra.count === 'number' ? extra.count : undefined,
      value: typeof extra.value === 'number' ? extra.value : undefined,
    };
  });
}

export default React.memo(HeatMap);
