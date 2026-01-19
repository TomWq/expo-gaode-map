#include <iostream>
#include <vector>
#include <cmath>
#include <cassert>
#include <iomanip>

#include "../GeometryEngine.hpp"
#include "../ColorParser.hpp"

using namespace gaodemap;

void testDistance() {
    std::cout << "Running testDistance..." << std::endl;
    // Beijing
    double lat1 = 39.9042;
    double lon1 = 116.4074;
    // ~1km East (approximate, 1 deg lon at lat 40 is ~85km)
    // 1km / 85km ~= 0.0117 deg
    double lat2 = 39.9042;
    double lon2 = 116.4191; 

    double dist = calculateDistance(lat1, lon1, lat2, lon2);
    std::cout << "Distance: " << dist << " meters" << std::endl;
    
    // Expect roughly 1000m. 
    // Precise calc: 
    // Haversine(39.9042, 116.4074, 39.9042, 116.4191) -> ~998.6m
    assert(dist > 990 && dist < 1010);
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
    // Alpha 0.5 -> 127 (0x7F)
    uint32_t rgba = parseColor("rgba(255, 0, 0, 0.5)");
    // Allow small rounding diff for alpha if float math used, but here implementation might be int based or float.
    // Let's check hex output.
    // 0.5 * 255 = 127.5 -> 127
    // Expected: 0x7FFF0000
    // Actually implementation uses float: static_cast<int>(alphaFloat * 255.0f)
    assert((rgba & 0x00FFFFFF) == 0x00FF0000); // Color part correct
    uint32_t alpha = (rgba >> 24) & 0xFF;
    assert(alpha >= 127 && alpha <= 128);

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
    
    // Center
    assert(isPointInPolygon(0.5, 0.5, polygon) == true);
    // Outside
    assert(isPointInPolygon(1.5, 0.5, polygon) == false);
    // On edge (implementation dependent usually, but let's test clear inside/outside)
    
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
        
        std::cout << "========================================" << std::endl;
        std::cout << "ALL TESTS PASSED SUCCESSFULLY" << std::endl;
        std::cout << "========================================" << std::endl;
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "TEST FAILED: " << e.what() << std::endl;
        return 1;
    }
}
