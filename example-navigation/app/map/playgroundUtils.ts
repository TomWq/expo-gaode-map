import { Image } from 'react-native';

import type {
  ClusterPoint,
  LatLng,
  MultiPointItem,
} from 'expo-gaode-map-navigation';

/**
 * 示例页统一使用的兜底中心点。
 * 当定位不可用时，依然可以正常打开地图并查看能力。
 */
export const BEIJING_CENTER: LatLng = {
  latitude: 39.909186,
  longitude: 116.397411,
};

export type GeoJsonCoordinate = [number, number];
export type HeatMapPoint = LatLng & { count: number };
export type ExampleMultiPoint = MultiPointItem & {
  title: string;
  subtitle: string;
  customerId: string;
};

/**
 * 统一复用示例图标，避免每个示例单独解析资源。
 */
export const positionIconUri = Image.resolveAssetSource(
  require('../../assets/positio_icon.png')
).uri;

/**
 * 生成热力图点，模拟当前位置周围的热点强度分布。
 */
export const generateHeatMapData = (
  center: LatLng,
  count: number
): HeatMapPoint[] => {
  const data: HeatMapPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    data.push({
      latitude: center.latitude + (Math.random() - 0.5) * 0.05,
      longitude: center.longitude + (Math.random() - 0.5) * 0.05,
      count: Math.floor(Math.random() * 100),
    });
  }

  return data;
};

/**
 * 生成海量点示例数据，用来演示 MultiPoint。
 */
export const generateMultiPointData = (
  center: LatLng,
  count: number
): ExampleMultiPoint[] => {
  const data: ExampleMultiPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    data.push({
      latitude: center.latitude + (Math.random() - 0.5) * 0.1,
      longitude: center.longitude + (Math.random() - 0.5) * 0.1,
      title: `Point ${index}`,
      subtitle: `Subtitle ${index}`,
      customerId: `id_${index}`,
    });
  }

  return data;
};

/**
 * 生成原生聚合测试数据。
 */
export const generateClusterData = (
  center: LatLng,
  count: number
): ClusterPoint[] => {
  const data: ClusterPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    data.push({
      latitude: center.latitude + (Math.random() - 0.5) * 0.08,
      longitude: center.longitude + (Math.random() - 0.5) * 0.08,
      properties: {
        id: index,
        title: `Cluster Item ${index}`,
        snippet: `Detail info ${index}`,
      },
    });
  }

  return data;
};

/**
 * 生成一个不规则区域轮廓，方便演示 AOI 高亮。
 */
export const generateIrregularOutline = (
  center: LatLng
): GeoJsonCoordinate[] => {
  const lng = center.longitude;
  const lat = center.latitude;

  return [
    [lng - 0.02, lat + 0.01],
    [lng - 0.012, lat + 0.02],
    [lng + 0.002, lat + 0.023],
    [lng + 0.018, lat + 0.015],
    [lng + 0.024, lat + 0.004],
    [lng + 0.017, lat - 0.011],
    [lng + 0.006, lat - 0.02],
    [lng - 0.01, lat - 0.018],
    [lng - 0.022, lat - 0.007],
    [lng - 0.02, lat + 0.01],
  ];
};

/**
 * 生成遮罩的外环，和内层 AOI 一起构成“挖洞高亮”效果。
 */
export const generateMaskOuterRing = (
  center: LatLng
): GeoJsonCoordinate[] => {
  const lng = center.longitude;
  const lat = center.latitude;
  const offsetLng = 0.18;
  const offsetLat = 0.14;

  return [
    [lng - offsetLng, lat + offsetLat],
    [lng + offsetLng, lat + offsetLat],
    [lng + offsetLng, lat - offsetLat],
    [lng - offsetLng, lat - offsetLat],
    [lng - offsetLng, lat + offsetLat],
  ];
};
