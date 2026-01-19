#pragma once

#include <vector>

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

} // namespace gaodemap
