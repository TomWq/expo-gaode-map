/**
 * 路径规划相关工具函数
 */

/**
 * 解析高德 polyline 字符串为坐标数组
 */
export const parsePolyline = (polylineStr: string | undefined): Array<{ latitude: number; longitude: number }> => {
  if (!polylineStr || typeof polylineStr !== 'string') return [];
  
  try {
    const points = polylineStr.split(';');
    return points.map(point => {
      const [lng, lat] = point.split(',').map(Number);
      return { latitude: lat, longitude: lng };
    }).filter(p => !isNaN(p.latitude) && !isNaN(p.longitude));
  } catch (error) {
    console.warn('[RouteUtils] 解析 polyline 失败:', error);
    return [];
  }
};

/**
 * 简化路径点
 */
export const simplifyPath = (
  points: Array<{ latitude: number; longitude: number }>,
  maxPoints: number = 200
): Array<{ latitude: number; longitude: number }> => {
  if (points.length <= maxPoints) return points;
  
  const step = Math.floor(points.length / maxPoints);
  const simplified: Array<{ latitude: number; longitude: number }> = [];
  
  simplified.push(points[0]);
  
  for (let i = step; i < points.length - 1; i += step) {
    simplified.push(points[i]);
  }
  
  simplified.push(points[points.length - 1]);
  
  return simplified;
};

/**
 * 生成路线颜色
 */
export const generateRouteColor = (index: number): string => {
  const colors = [
    '#2196F3', // 蓝色
    '#4CAF50', // 绿色
    '#FF9800', // 橙色
    '#9C27B0', // 紫色
    '#F44336', // 红色
    '#00BCD4', // 青色
    '#FF5722', // 深橙色
    '#3F51B5', // 靛蓝色
  ];
  return colors[index % colors.length];
};

/**
 * 格式化距离显示
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)}公里`;
  }
  return `${meters}米`;
};

/**
 * 格式化时间显示
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}小时${remainMinutes}分钟`;
};

/**
 * 计算路径的中心点和合适的缩放级别
 */
export const getRouteBounds = (path: Array<{ latitude: number; longitude: number }>) => {
  if (path.length === 0) return null;
  
  const lats = path.map(p => p.latitude);
  const lngs = path.map(p => p.longitude);
  
  return {
    center: {
      latitude: (Math.max(...lats) + Math.min(...lats)) / 2,
      longitude: (Math.max(...lngs) + Math.min(...lngs)) / 2,
    },
    bounds: {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    },
  };
};