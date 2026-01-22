#pragma once

#include <vector>
#include <string>

namespace gaodemap {

struct GeoPoint {
    double lat;
    double lon;
};

double calculateDistance(double lat1, double lon1, double lat2, double lon2);
bool isPointInCircle(double pointLat, double pointLon, double centerLat, double centerLon, double radiusMeters);
bool isPointInPolygon(double pointLat, double pointLon, const std::vector<GeoPoint>& polygon);
double calculatePolygonArea(const std::vector<GeoPoint>& polygon);
double calculateRectangleArea(double swLat, double swLon, double neLat, double neLon);

/**
 * Ramer-Douglas-Peucker 轨迹抽稀算法
 * @param points 原始轨迹点
 * @param toleranceMeters 允许的误差（米），值越大点越少
 * @return 简化后的轨迹点
 */
std::vector<GeoPoint> simplifyPolyline(const std::vector<GeoPoint>& points, double toleranceMeters);

/**
 * 计算路径总长度（米）
 */
double calculatePathLength(const std::vector<GeoPoint>& points);

/**
 * 获取路径上指定距离的点和方向
 * @param points 路径点
 * @param distanceMeters 距离起点的米数
 * @param outLat 输出纬度
 * @param outLon 输出经度
 * @param outAngle 输出方向角度 (0-360)
 * @return 是否成功找到点
 */
bool getPointAtDistance(const std::vector<GeoPoint>& points, double distanceMeters, double* outLat, double* outLon, double* outAngle);

// Result structure for nearest point calculation
struct NearestPointResult {
    double latitude;
    double longitude;
    int index; // Index of the point in the path that starts the segment (or the point itself)
    double distanceMeters;
};

// Find the nearest point on the path to a target point
// Returns the nearest point on the polyline segments
NearestPointResult getNearestPointOnPath(const std::vector<GeoPoint>& path, const GeoPoint& target);

/**
 * 计算多边形的质心
 * @param polygon 多边形点集
 * @return 质心坐标
 */
GeoPoint calculateCentroid(const std::vector<GeoPoint>& polygon);

/**
 * GeoHash 编码
 * @param lat 纬度
 * @param lon 经度
 * @param precision 精度 (1-12)
 * @return GeoHash 字符串
 */
std::string encodeGeoHash(double lat, double lon, int precision);

/**
 * 解析高德地图 API 返回的 Polyline 字符串
 * 格式: "lng,lat;lng,lat;..."
 * @param polylineStr 高德原始 polyline 字符串
 * @return 解析后的点集
 */
std::vector<GeoPoint> parsePolyline(const std::string& polylineStr);

struct PathBounds {
    double north;
    double south;
    double east;
    double west;
    double centerLat;
    double centerLon;
};

/**
 * 计算路径的边界和中心点
 * @param points 路径点
 * @return 边界信息
 */
PathBounds calculatePathBounds(const std::vector<GeoPoint>& points);

// --- 瓦片与坐标转换 ---

struct TileResult {
    int x;
    int y;
    int z;
};

struct PixelResult {
    double x;
    double y;
};

/**
 * 经纬度转瓦片坐标
 */
TileResult latLngToTile(double lat, double lon, int zoom);

/**
 * 瓦片坐标转经纬度
 */
GeoPoint tileToLatLng(int x, int y, int zoom);

/**
 * 经纬度转像素坐标
 */
PixelResult latLngToPixel(double lat, double lon, int zoom);

/**
 * 像素坐标转经纬度
 */
GeoPoint pixelToLatLng(double x, double y, int zoom);

// --- 批量地理围栏与热力图 ---

/**
 * 批量判断点是否在多个多边形内 (优化版)
 * @param pointLat 点纬度
 * @param pointLon 点经度
 * @param polygons 多个多边形的集合
 * @return 所在的第一个多边形的索引，若不在任何多边形内返回 -1
 */
int findPointInPolygons(double pointLat, double pointLon, const std::vector<std::vector<GeoPoint>>& polygons);

struct HeatmapPoint {
    double lat;
    double lon;
    double weight;
};

struct HeatmapGridCell {
    double lat;
    double lon;
    double intensity;
};

/**
 * 生成热力图网格数据
 * @param points 原始点集
 * @param gridSizeMeters 网格大小（米）
 * @return 网格中心点及其强度
 */
std::vector<HeatmapGridCell> generateHeatmapGrid(const std::vector<HeatmapPoint>& points, double gridSizeMeters);

} // namespace gaodemap
