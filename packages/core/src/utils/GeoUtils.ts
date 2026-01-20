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
 * 支持一维数组 [p1, p2, ...] 或二维嵌套数组 [[p1, p2, ...], [p3, p4, ...]]
 * 
 * @param points 坐标点数组或嵌套数组
 * @returns 归一化后的坐标数组
 */
export function normalizeLatLngList(points: LatLngPoint[] | LatLngPoint[][]): any {
  if (!points || points.length === 0) return [];

  // 检查是否为嵌套数组 (检查第一项是否也是数组或对象，且不符合 LatLngPoint 的基本判断)
  // 如果第一项是数组且长度 > 2，或者第一项的第一个元素也是数组/对象，则认为是嵌套数组
  const firstItem = points[0];
  
  if (Array.isArray(firstItem)) {
    // 如果第一项是 [number, number]，则这可能是一个一维坐标点数组 (LatLngPoint[])
    // 除非所有元素都是数组且至少有一个子数组长度不等于2，或者我们明确知道这是嵌套的
    // 为了支持 Polygon 的嵌套格式，我们需要递归处理
    
    // 启发式判断：如果第一项是数组且它的第一个元素也是数组或对象，那么它一定是嵌套的
    if (Array.isArray(firstItem[0]) || (typeof firstItem[0] === 'object' && firstItem[0] !== null && 'latitude' in firstItem[0])) {
      return (points as LatLngPoint[][]).map(ring => ring.map(normalizeLatLng));
    }
    
    // 另一种情况：用户传入的是 [[lng, lat], [lng, lat]]，这既可以看作 LatLngPoint[]，
    // 也可以看作 LatLngPoint[][] (只有一个外轮廓)。
    // 在 Polygon 组件中，我们希望统一处理。
    // 如果是 Polygon 传入的，我们希望保留嵌套结构。
    // 但 normalizeLatLngList 是通用的。
    
    // 改进逻辑：如果 data[0] 是一个点，我们把它当作一维数组处理。
    // 如果 data[0] 不是一个点（即它是点的集合），我们当作二维处理。
    if (isPoint(firstItem)) {
      return (points as LatLngPoint[]).map(normalizeLatLng);
    } else {
      return (points as LatLngPoint[][]).map(ring => ring.map(normalizeLatLng));
    }
  }

  return (points as LatLngPoint[]).map(normalizeLatLng);
}

/**
 * 判断一个对象是否为坐标点 (LatLngPoint)
 */
function isPoint(item: any): boolean {
  if (!item) return false;
  // { latitude, longitude } 格式
  if (typeof item === 'object' && 'latitude' in item && 'longitude' in item) return true;
  // [longitude, latitude] 格式
  if (Array.isArray(item) && item.length >= 2 && typeof item[0] === 'number' && typeof item[1] === 'number') return true;
  return false;
}
