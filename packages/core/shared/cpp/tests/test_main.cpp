#include <iostream>
#include <vector>
#include <cmath>
#include <cassert>
#include <iomanip>
#include <algorithm>
#include <chrono>

#include "../GeometryEngine.hpp"
#include "../ColorParser.hpp"
#include "../QuadTree.hpp"
#include "../ClusterEngine.hpp"

using namespace gaodemap;

// Helper to compare doubles with epsilon
bool approxEqual(double a, double b, double epsilon = 1e-6) {
    return std::abs(a - b) < epsilon;
}

void testDistance() {
    std::cout << "Running testDistance..." << std::endl;
    // Beijing
    double lat1 = 39.9042;
    double lon1 = 116.4074;
    // ~1km East
    double lat2 = 39.9042;
    double lon2 = 116.4191; 

    double dist = calculateDistance(lat1, lon1, lat2, lon2);
    std::cout << "Distance: " << dist << " meters" << std::endl;
    
    // Expect roughly 1000m. 
    assert(dist > 990 && dist < 1010);
    
    // Same point should be 0
    assert(approxEqual(calculateDistance(lat1, lon1, lat1, lon1), 0.0));
    
    std::cout << "PASSED" << std::endl;
}

void testColorParser() {
    std::cout << "Running testColorParser..." << std::endl;
    
    // Red
    assert(parseColor("red") == 0xFFFF0000);
    assert(parseColor("#FF0000") == 0xFFFF0000);
    assert(parseColor("#ff0000") == 0xFFFF0000);
    
    // Blue
    assert(parseColor("blue") == 0xFF0000FF);
    
    // RGB
    assert(parseColor("rgb(0, 255, 0)") == 0xFF00FF00);
    
    // RGBA
    uint32_t rgba = parseColor("rgba(255, 0, 0, 0.5)");
    assert((rgba & 0x00FFFFFF) == 0x00FF0000); 
    uint32_t alpha = (rgba >> 24) & 0xFF;
    assert(alpha >= 127 && alpha <= 128);

    // Invalid colors
    assert(parseColor("notacolor") == 0); 
    assert(parseColor("#XYZ") == 0);
    assert(parseColor("") == 0);

    std::cout << "PASSED" << std::endl;
}

void testPointInPolygon() {
    std::cout << "Running testPointInPolygon..." << std::endl;
    
    // Simple square (0,0) to (1,1)
    std::vector<GeoPoint> polygon = {
        {0, 0},
        {1, 0},
        {1, 1},
        {0, 1}
    };
    
    assert(isPointInPolygon(0.5, 0.5, polygon) == true);
    assert(isPointInPolygon(1.5, 0.5, polygon) == false);
    assert(isPointInPolygon(-0.1, 0.5, polygon) == false);
    
    // Triangle
    std::vector<GeoPoint> triangle = {
        {0, 0},
        {2, 0},
        {1, 2}
    };
    assert(isPointInPolygon(1, 1, triangle) == true);
    assert(isPointInPolygon(1, 2.1, triangle) == false);

    std::cout << "PASSED" << std::endl;
}

void testGeometryEngineExtended() {
    std::cout << "Running testGeometryEngineExtended..." << std::endl;

    // 1. testPointInCircle
    assert(isPointInCircle(39.9, 116.4, 39.9, 116.4, 100) == true);
    assert(isPointInCircle(40.0, 116.4, 39.9, 116.4, 1000) == false); // ~11km diff

    // 2. testArea
    std::vector<GeoPoint> rect = {
        {0, 0}, {0, 1}, {1, 1}, {1, 0}
    };
    double area = calculatePolygonArea(rect);
    std::cout << "Polygon Area: " << area << " m^2" << std::endl;
    assert(area > 0);
    
    double rectArea = calculateRectangleArea(0, 0, 1, 1);
    assert(approxEqual(area, rectArea));

    // 3. simplifyPolyline
    std::vector<GeoPoint> line = {
        {0, 0}, {0.1, 0.0001}, {0.2, 0}, {0.3, 0.0001}, {0.4, 0}
    };
    auto simplified = simplifyPolyline(line, 1000); // 1km tolerance
    assert(simplified.size() < line.size());
    assert(simplified.front().lat == 0);
    assert(simplified.back().lat == 0.4);

    // 4. calculatePathLength
    double length = calculatePathLength({{0,0}, {0,1}});
    assert(length > 111000 && length < 112000); // 1 degree lat is ~111km

    // 5. getPointAtDistance
    double outLat, outLon, outAngle;
    bool found = getPointAtDistance({{0,0}, {1,0}}, 55500, &outLat, &outLon, &outAngle);
    assert(found);
    assert(outLat > 0.4 && outLat < 0.6);
    assert(approxEqual(outLon, 0.0));

    // 6. getNearestPointOnPath
    std::vector<GeoPoint> path = {{0,0}, {2,0}};
    GeoPoint target = {1, 1};
    auto nearest = getNearestPointOnPath(path, target);
    assert(approxEqual(nearest.latitude, 1.0));
    assert(approxEqual(nearest.longitude, 0.0));
    assert(nearest.index == 0);

    // 7. calculateCentroid
    std::vector<GeoPoint> square = {{0,0}, {1,0}, {1,1}, {0,1}};
    auto centroid = calculateCentroid(square);
    assert(approxEqual(centroid.lat, 0.5));
    assert(approxEqual(centroid.lon, 0.5));

    // 8. encodeGeoHash
    std::string hash = encodeGeoHash(39.9042, 116.4074, 5);
    assert(hash.length() == 5);
    assert(hash == "wx4g0"); // Common geohash for Beijing center

    // 9. parsePolyline
    std::string polyStr = "116.4074,39.9042;116.4191,39.9042";
    auto parsed = parsePolyline(polyStr);
    assert(parsed.size() == 2);
    assert(approxEqual(parsed[0].lat, 39.9042));
    assert(approxEqual(parsed[0].lon, 116.4074));
    assert(approxEqual(parsed[1].lat, 39.9042));
    assert(approxEqual(parsed[1].lon, 116.4191));

    // Test empty
    assert(parsePolyline("").empty());
    // Test invalid
    assert(parsePolyline("invalid").empty());
    // Test trailing semicolon
    assert(parsePolyline("116.4074,39.9042;").size() == 1);

    std::cout << "PASSED" << std::endl;
}

void benchmarkParsePolyline() {
    std::cout << "Running benchmarkParsePolyline (10,000 points)..." << std::endl;
    
    // 生成 10,000 个点的测试字符串
    std::string largePoly;
    largePoly.reserve(300000); // 预分配约 300KB
    for (int i = 0; i < 10000; ++i) {
        largePoly += "116.4074,39.9042;";
    }

    auto start = std::chrono::high_resolution_clock::now();
    
    // 运行 100 次以获得更准确的平均值
    for (int i = 0; i < 100; ++i) {
        auto result = parsePolyline(largePoly);
        if (result.size() != 10000) {
            std::cerr << "Error: Expected 10000 points, got " << result.size() << std::endl;
        }
    }
    
    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double, std::milli> duration = end - start;
    
    std::cout << "Total time for 100 iterations: " << duration.count() << " ms" << std::endl;
    std::cout << "Average time per parse (10,000 points): " << duration.count() / 100.0 << " ms" << std::endl;
    std::cout << "PASSED" << std::endl;
}

void testQuadTree() {
    std::cout << "Running testQuadTree..." << std::endl;

    BoundingBox bounds{0, 0, 10, 10};
    QuadTree tree(bounds, 2); // Small capacity to force subdivision

    tree.insert({1, 1, 1});
    tree.insert({2, 2, 2});
    tree.insert({8, 8, 3});
    tree.insert({9, 9, 4});

    std::vector<ClusterPoint> found;
    tree.query({0, 0, 3, 3}, found);
    assert(found.size() == 2);
    
    found.clear();
    tree.query({7, 7, 10, 10}, found);
    assert(found.size() == 2);

    found.clear();
    tree.query({4, 4, 6, 6}, found);
    assert(found.size() == 0);

    std::cout << "PASSED" << std::endl;
}

void testClusterEngine() {
    std::cout << "Running testClusterEngine..." << std::endl;

    std::vector<ClusterPoint> points = {
        {39.9042, 116.4074, 0}, // Beijing 1
        {39.9043, 116.4075, 1}, // Beijing 2 (very close)
        {31.2304, 121.4737, 2}, // Shanghai 1
        {31.2305, 121.4738, 3}  // Shanghai 2 (very close)
    };

    // Cluster with 1km radius
    auto clusters = clusterPoints(points, 1000);
    
    // Should have 2 clusters
    assert(clusters.size() == 2);
    
    for (const auto& c : clusters) {
        assert(c.indices.size() == 2);
    }

    // Cluster with 1m radius (should be 4 clusters)
    auto clustersSmall = clusterPoints(points, 1);
    assert(clustersSmall.size() == 4);

    std::cout << "PASSED" << std::endl;
}

int main() {
    std::cout << "========================================" << std::endl;
    std::cout << "STARTING C++ SHARED CODE TESTS" << std::endl;
    std::cout << "========================================" << std::endl;

    try {
        testDistance();
        testColorParser();
        testPointInPolygon();
        testGeometryEngineExtended();
        benchmarkParsePolyline();
        testQuadTree();
        testClusterEngine();
        
        std::cout << "========================================" << std::endl;
        std::cout << "ALL TESTS PASSED SUCCESSFULLY" << std::endl;
        std::cout << "========================================" << std::endl;
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "TEST FAILED: " << e.what() << std::endl;
        return 1;
    }
}
