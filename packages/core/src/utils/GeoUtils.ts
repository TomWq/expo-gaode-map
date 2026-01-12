import { LatLng, LatLngPoint } from '../types/common.types';

/**
 * 将坐标点归一化为对象格式
 * 支持 [longitude, latitude] 数组或 { latitude, longitude } 对象
 * 注意：数组格式遵循 GeoJSON 标准，即 [经度, 纬度]
 * 
 * @param point 坐标点
 * @returns { latitude, longitude } 对象
 */
export function normalizeLatLng(point: LatLngPoint): LatLng {
  if (Array.isArray(point)) {
    let longitude = point[0];
    let latitude = point[1];

    // 智能纠错：如果纬度超出范围 [-90, 90] 且交换后在范围内，则认为是用户传反了
    if (Math.abs(latitude) > 90 && Math.abs(longitude) <= 90) {
      console.warn(
        `[expo-gaode-map] 检测到坐标数组格式可能为 [latitude, longitude] (${point})，已自动纠正为 [longitude, latitude]。建议显式使用 [经度, 纬度] 格式以遵循 GeoJSON 标准。`
      );
      return {
        latitude: longitude,
        longitude: latitude
      };
    }

    return {
      longitude,
      latitude,
    };
  }
  // 对象格式直接返回
  return point;
}

/**
 * 将坐标点数组归一化为对象数组
 * 
 * @param points 坐标点数组
 * @returns LatLng 对象数组
 */
export function normalizeLatLngList(points: LatLngPoint[]): LatLng[] {
  if (!points) return [];
  return points.map(normalizeLatLng);
}
