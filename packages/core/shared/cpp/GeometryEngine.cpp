#include "GeometryEngine.hpp"

#include <cmath>

namespace gaodemap {

static constexpr double kEarthRadiusMeters = 6371000.0;
static constexpr double kPi = 3.14159265358979323846;
static constexpr double kDegreesToRadians = kPi / 180.0;
static constexpr double kRadiansToDegrees = 180.0 / kPi;

static inline double geo_toRadians(double degrees) {
    return degrees * kDegreesToRadians;
}

static inline double geo_toDegrees(double radians) {
    return radians * kRadiansToDegrees;
}

double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double radLat1 = geo_toRadians(lat1);
    const double radLat2 = geo_toRadians(lat2);
    const double dLat = radLat2 - radLat1;
    const double dLon = geo_toRadians(lon2 - lon1);

    const double sinHalfLat = std::sin(dLat * 0.5);
    const double sinHalfLon = std::sin(dLon * 0.5);
    const double h = sinHalfLat * sinHalfLat + std::cos(radLat1) * std::cos(radLat2) * sinHalfLon * sinHalfLon;
    const double c = 2.0 * std::atan2(std::sqrt(h), std::sqrt(1.0 - h));

    return kEarthRadiusMeters * c;
}

static double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
    return calculateDistance(lat1, lon1, lat2, lon2);
}

// 计算方位角 (Bearing)
static double calculateBearing(double lat1, double lon1, double lat2, double lon2) {
    double phi1 = geo_toRadians(lat1);
    double phi2 = geo_toRadians(lat2);
    double lam1 = geo_toRadians(lon1);
    double lam2 = geo_toRadians(lon2);

    double y = std::sin(lam2 - lam1) * std::cos(phi2);
    double x = std::cos(phi1) * std::sin(phi2) -
               std::sin(phi1) * std::cos(phi2) * std::cos(lam2 - lam1);
    double theta = std::atan2(y, x);

    return std::fmod(geo_toDegrees(theta) + 360.0, 360.0);
}

bool isPointInCircle(double pointLat, double pointLon, double centerLat, double centerLon, double radiusMeters) {
    if (radiusMeters <= 0.0) {
        return false;
    }
    const double distance = haversineMeters(pointLat, pointLon, centerLat, centerLon);
    return distance <= radiusMeters;
}

bool isPointInPolygon(double pointLat, double pointLon, const std::vector<GeoPoint>& polygon) {
    const size_t n = polygon.size();
    if (n < 3) {
        return false;
    }

    bool inside = false;
    size_t j = n - 1;
    for (size_t i = 0; i < n; ++i) {
        const double xi = polygon[i].lat;
        const double yi = polygon[i].lon;
        const double xj = polygon[j].lat;
        const double yj = polygon[j].lon;

        const double intersect = ((yi > pointLon) != (yj > pointLon)) &&
            (pointLat < (xj - xi) * (pointLon - yi) / (yj - yi) + xi);
        if (intersect) {
            inside = !inside;
        }
        j = i;
    }

    return inside;
}

double calculatePolygonArea(const std::vector<GeoPoint>& polygon) {
    const size_t n = polygon.size();
    if (n < 3) {
        return 0.0;
    }

    double total = 0.0;
    for (size_t i = 0; i < n; ++i) {
        const GeoPoint& p1 = polygon[i];
        const GeoPoint& p2 = polygon[(i + 1) % n];

        const double lat1 = geo_toRadians(p1.lat);
        const double lat2 = geo_toRadians(p2.lat);
        const double lon1 = geo_toRadians(p1.lon);
        const double lon2 = geo_toRadians(p2.lon);

        total += (lon2 - lon1) * (2.0 + std::sin(lat1) + std::sin(lat2));
    }

    const double area = std::abs(total) * (kEarthRadiusMeters * kEarthRadiusMeters) * 0.5;
    return area;
}

double calculateRectangleArea(double swLat, double swLon, double neLat, double neLon) {
    std::vector<GeoPoint> rectangle;
    rectangle.reserve(4);
    rectangle.push_back({swLat, swLon});
    rectangle.push_back({swLat, neLon});
    rectangle.push_back({neLat, neLon});
    rectangle.push_back({neLat, swLon});
    return calculatePolygonArea(rectangle);
}

// 简单的 2D 点结构，用于本地坐标投影计算
struct Point2D {
    double x;
    double y;
    size_t index; // 原始索引
};

// 计算点到线段的垂直距离的平方
static double getSqSegDist(const Point2D& p, const Point2D& p1, const Point2D& p2) {
    double x = p1.x;
    double y = p1.y;
    double dx = p2.x - x;
    double dy = p2.y - y;

    if (dx != 0 || dy != 0) {
        double t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
        if (t > 1) {
            x = p2.x;
            y = p2.y;
        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p.x - x;
    dy = p.y - y;

    return dx * dx + dy * dy;
}

// RDP 递归函数
static void simplifyDPStep(const std::vector<Point2D>& points, size_t first, size_t last, double sqTolerance, std::vector<size_t>& simplified) {
    double maxSqDist = sqTolerance;
    size_t index = 0;

    for (size_t i = first + 1; i < last; i++) {
        double sqDist = getSqSegDist(points[i], points[first], points[last]);
        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push_back(index);
        if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
}

std::vector<GeoPoint> simplifyPolyline(const std::vector<GeoPoint>& points, double toleranceMeters) {
    if (points.size() <= 2) {
        return points;
    }

    // 1. 投影到平面坐标 (Equirectangular Projection approximation)
    // 以第一个点为原点
    double refLat = points[0].lat;
    double refLon = points[0].lon;
    double refLatRad = geo_toRadians(refLat);
    double metersPerDegreeLat = 111319.9;
    double metersPerDegreeLon = 111319.9 * std::cos(refLatRad);

    std::vector<Point2D> projectedPoints;
    projectedPoints.reserve(points.size());
    for (size_t i = 0; i < points.size(); ++i) {
        double x = (points[i].lon - refLon) * metersPerDegreeLon;
        double y = (points[i].lat - refLat) * metersPerDegreeLat;
        projectedPoints.push_back({x, y, i});
    }

    // 2. 运行 RDP 算法
    double sqTolerance = toleranceMeters * toleranceMeters;
    std::vector<size_t> simplifiedIndices;
    simplifiedIndices.push_back(0); // 总是保留第一个点
    
    simplifyDPStep(projectedPoints, 0, projectedPoints.size() - 1, sqTolerance, simplifiedIndices);
    
    simplifiedIndices.push_back(projectedPoints.size() - 1); // 总是保留最后一个点

    // 3. 构建结果
    std::vector<GeoPoint> result;
    result.reserve(simplifiedIndices.size());
    
    for (size_t idx : simplifiedIndices) {
        result.push_back(points[idx]);
    }

    return result;
}

double calculatePathLength(const std::vector<GeoPoint>& points) {
    if (points.size() < 2) return 0.0;
    
    double total = 0.0;
    for (size_t i = 0; i < points.size() - 1; ++i) {
        total += calculateDistance(points[i].lat, points[i].lon, points[i+1].lat, points[i+1].lon);
    }
    return total;
}

bool getPointAtDistance(const std::vector<GeoPoint>& points, double distanceMeters, double* outLat, double* outLon, double* outAngle) {
    if (points.size() < 2 || distanceMeters < 0) return false;
    
    if (distanceMeters == 0) {
        *outLat = points[0].lat;
        *outLon = points[0].lon;
        *outAngle = calculateBearing(points[0].lat, points[0].lon, points[1].lat, points[1].lon);
        return true;
    }
    
    double covered = 0.0;
    for (size_t i = 0; i < points.size() - 1; ++i) {
        double d = calculateDistance(points[i].lat, points[i].lon, points[i+1].lat, points[i+1].lon);
        if (covered + d >= distanceMeters) {
            double remaining = distanceMeters - covered;
            double fraction = remaining / d;
            
            // 简单的线性插值 (Linear Interpolation)
            // 对于小距离段，这比球形插值快得多且误差可忽略
            *outLat = points[i].lat + (points[i+1].lat - points[i].lat) * fraction;
            *outLon = points[i].lon + (points[i+1].lon - points[i].lon) * fraction;
            *outAngle = calculateBearing(points[i].lat, points[i].lon, points[i+1].lat, points[i+1].lon);
            return true;
        }
        covered += d;
    }
    
    // 如果超出总长度，返回最后一个点
    const GeoPoint& last = points.back();
    const GeoPoint& prev = points[points.size() - 2];
    *outLat = last.lat;
    *outLon = last.lon;
    *outAngle = calculateBearing(prev.lat, prev.lon, last.lat, last.lon);
    return true;
}

// Helper: Square of Euclidean distance
static double distSq(double x1, double y1, double x2, double y2) {
    double dx = x1 - x2;
    double dy = y1 - y2;
    return dx * dx + dy * dy;
}

NearestPointResult getNearestPointOnPath(const std::vector<GeoPoint>& path, const GeoPoint& target) {
    NearestPointResult result = {0.0, 0.0, 0, std::numeric_limits<double>::max()};
    
    if (path.empty()) {
        return result;
    }
    
    if (path.size() == 1) {
        result.latitude = path[0].lat;
        result.longitude = path[0].lon;
        result.index = 0;
        result.distanceMeters = calculateDistance(target.lat, target.lon, path[0].lat, path[0].lon);
        return result;
    }

    double minDistance = std::numeric_limits<double>::max();
    
    for (size_t i = 0; i < path.size() - 1; ++i) {
        double ax = path[i].lat;
        double ay = path[i].lon;
        double bx = path[i+1].lat;
        double by = path[i+1].lon;
        
        // Project target (px, py) onto segment AB
        // Note: This treats lat/lon as cartesian for projection, which is an approximation
        // but generally sufficient for "snapping" to a path.
        // For distance calculation, we use Haversine.
        
        double px = target.lat;
        double py = target.lon;
        
        double l2 = distSq(ax, ay, bx, by);
        double t = 0.0;
        if (l2 > 0) {
            t = ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2;
            if (t < 0) t = 0;
            else if (t > 1) t = 1;
        }
        
        double projLat = ax + t * (bx - ax);
        double projLon = ay + t * (by - ay);
        
        double dist = calculateDistance(target.lat, target.lon, projLat, projLon);
        
        if (dist < minDistance) {
            minDistance = dist;
            result.latitude = projLat;
            result.longitude = projLon;
            result.index = static_cast<int>(i);
            result.distanceMeters = dist;
        }
    }
    
    return result;
}

GeoPoint calculateCentroid(const std::vector<GeoPoint>& polygon) {
    if (polygon.empty()) {
        return {0.0, 0.0};
    }
    
    // 简单多边形质心公式
    // Cx = (1/6A) * Σ (xi + xi+1) * (xi * yi+1 - xi+1 * yi)
    // Cy = (1/6A) * Σ (yi + yi+1) * (xi * yi+1 - xi+1 * yi)
    
    double signedArea = 0.0;
    double cx = 0.0;
    double cy = 0.0;
    
    size_t n = polygon.size();
    // 确保多边形闭合
    bool closed = (polygon[0].lat == polygon[n-1].lat && polygon[0].lon == polygon[n-1].lon);
    size_t limit = closed ? n - 1 : n;
    
    for (size_t i = 0; i < limit; ++i) {
        double x0 = polygon[i].lat;
        double y0 = polygon[i].lon;
        double x1 = polygon[(i + 1) % n].lat;
        double y1 = polygon[(i + 1) % n].lon;
        
        double a = x0 * y1 - x1 * y0;
        signedArea += a;
        cx += (x0 + x1) * a;
        cy += (y0 + y1) * a;
    }
    
    if (std::abs(signedArea) < 1e-9) {
        // 退化为计算所有点的平均值
        double sumLat = 0.0;
        double sumLon = 0.0;
        for(const auto& p : polygon) {
            sumLat += p.lat;
            sumLon += p.lon;
        }
        return {sumLat / n, sumLon / n};
    }
    
    signedArea *= 0.5;
    cx /= (6.0 * signedArea);
    cy /= (6.0 * signedArea);
    
    return {cx, cy};
}

std::string encodeGeoHash(double lat, double lon, int precision) {
    if (precision < 1) precision = 1;
    if (precision > 12) precision = 12;
    
    static const char BASE32[] = "0123456789bcdefghjkmnpqrstuvwxyz";
    std::string hash = "";
    
    double minLat = -90.0, maxLat = 90.0;
    double minLon = -180.0, maxLon = 180.0;
    
    int bit = 0;
    int ch = 0;
    bool isEven = true;
    
    while (hash.length() < precision) {
        if (isEven) {
            double mid = (minLon + maxLon) / 2.0;
            if (lon > mid) {
                ch |= (1 << (4 - bit));
                minLon = mid;
            } else {
                maxLon = mid;
            }
        } else {
            double mid = (minLat + maxLat) / 2.0;
            if (lat > mid) {
                ch |= (1 << (4 - bit));
                minLat = mid;
            } else {
                maxLat = mid;
            }
        }
        
        isEven = !isEven;
        
        if (bit < 4) {
            bit++;
        } else {
            hash += BASE32[ch];
            bit = 0;
            ch = 0;
        }
    }
    
    return hash;
}

std::vector<GeoPoint> parsePolyline(const std::string& polylineStr) {
    std::vector<GeoPoint> points;
    if (polylineStr.empty()) {
        return points;
    }

    size_t start = 0;
    size_t end = polylineStr.find(';');
    
    while (true) {
        std::string segment = polylineStr.substr(start, end - start);
        if (!segment.empty()) {
            size_t comma = segment.find(',');
            if (comma != std::string::npos) {
                try {
                    double lon = std::stod(segment.substr(0, comma));
                    double lat = std::stod(segment.substr(comma + 1));
                    points.push_back({lat, lon});
                } catch (...) {
                    // 忽略无效的坐标对
                }
            }
        }
        
        if (end == std::string::npos) {
            break;
        }
        
        start = end + 1;
        end = polylineStr.find(';', start);
    }
    
    return points;
}

PathBounds calculatePathBounds(const std::vector<GeoPoint>& points) {
    PathBounds bounds = { -90.0, 90.0, -180.0, 180.0, 0.0, 0.0 };
    
    if (points.empty()) {
        return bounds;
    }
    
    double minLat = 90.0;
    double maxLat = -90.0;
    double minLon = 180.0;
    double maxLon = -180.0;
    
    for (const auto& p : points) {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lon < minLon) minLon = p.lon;
        if (p.lon > maxLon) maxLon = p.lon;
    }
    
    bounds.north = maxLat;
    bounds.south = minLat;
    bounds.east = maxLon;
    bounds.west = minLon;
    bounds.centerLat = (maxLat + minLat) / 2.0;
    bounds.centerLon = (maxLon + minLon) / 2.0;
    
    return bounds;
}

} // namespace gaodemap
