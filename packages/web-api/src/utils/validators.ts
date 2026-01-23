
/**
 * 校验经纬度坐标格式
 * 格式要求：经度,纬度 (例如：116.481028,39.989643)
 */
export function validateCoordinate(coordinate: string): void {
  const pattern = /^-?((1[0-7]\d|\d{1,2})(\.\d+)?|180(\.0+)?),-?([0-8]\d(\.\d+)?|90(\.0+)?|\d(\.\d+)?)$/;
  
  if (!pattern.test(coordinate)) {
    throw new Error(`Invalid coordinate format: "${coordinate}". Expected format: "longitude,latitude" (e.g., "116.481028,39.989643")`);
  }
}

/**
 * 校验多个坐标格式（用于批量请求或多边形）
 * @param coordinates 坐标字符串
 * @param separator 分隔符，默认 "|"
 */
export function validateCoordinates(coordinates: string, separator: string = '|'): void {
  const coords = coordinates.split(separator);
  coords.forEach(coord => validateCoordinate(coord));
}
