#include "ClusterEngine.hpp"
#include "QuadTree.hpp"
#include <cmath>
#include <algorithm>

namespace gaodemap {

// Removed duplicate toRadians definition, using inline or shared utility in future
// For now, let's keep it static but rename to avoid conflict in unity build
static inline double cluster_toRadians(double degrees) {
    return degrees * 0.017453292519943295;
}

static double haversineMeters(const ClusterPoint& a, const ClusterPoint& b) {
    const double lat1 = cluster_toRadians(a.lat);
    const double lat2 = cluster_toRadians(b.lat);
    const double dLat = lat2 - lat1;
    const double dLon = cluster_toRadians(b.lon - a.lon);

    const double sinHalfLat = std::sin(dLat * 0.5);
    const double sinHalfLon = std::sin(dLon * 0.5);

    const double h = sinHalfLat * sinHalfLat + std::cos(lat1) * std::cos(lat2) * sinHalfLon * sinHalfLon;
    const double c = 2.0 * std::atan2(std::sqrt(h), std::sqrt(1.0 - h));

    return 6371000.0 * c;
}

std::vector<ClusterOutput> clusterPoints(const std::vector<ClusterPoint>& points, double radiusMeters) {
    std::vector<ClusterOutput> clusters;

    if (points.empty() || radiusMeters <= 0.0) {
        return clusters;
    }

    // 1. Build QuadTree
    // Determine bounds
    double minLat = 90.0, maxLat = -90.0, minLon = 180.0, maxLon = -180.0;
    int maxIndex = -1;
    
    for (const auto& p : points) {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lon < minLon) minLon = p.lon;
        if (p.lon > maxLon) maxLon = p.lon;
        if (p.index > maxIndex) maxIndex = p.index;
    }
    
    // Add some buffer
    BoundingBox worldBounds{minLat - 1.0, minLon - 1.0, maxLat + 1.0, maxLon + 1.0};
    QuadTree tree(worldBounds);
    
    for (const auto& p : points) {
        tree.insert(p);
    }

    // 2. Cluster
    // Use maxIndex to size the visited array correctly.
    // If points is empty, maxIndex is -1, but we checked empty above.
    // Ensure vector size is at least maxIndex + 1
    std::vector<bool> globalVisited((maxIndex >= 0 ? maxIndex + 1 : 0), false);
    
    // Approximate degrees for radius (very rough, improves performance)
    // 1 degree lat ~= 111km. 
    double latDegree = radiusMeters / 111000.0;
    
    for (const auto& p : points) {
        if (p.index < 0 || p.index >= globalVisited.size()) continue; // Safety check
        if (globalVisited[p.index]) continue;

        ClusterOutput cluster;
        cluster.centerIndex = p.index;
        cluster.indices.push_back(p.index);
        globalVisited[p.index] = true;

        // Query QuadTree
        // Adjust lonDegree based on current latitude
        // cos can be 0 at poles, handle it
        double cosLat = std::cos(cluster_toRadians(p.lat));
        double lonDegree;
        if (std::abs(cosLat) < 0.00001) {
             lonDegree = 360.0; // At poles, everything is close in longitude
        } else {
             lonDegree = radiusMeters / (111000.0 * std::abs(cosLat));
        }
        
        // Bounding box for query
        BoundingBox range{p.lat - latDegree, p.lon - lonDegree, p.lat + latDegree, p.lon + lonDegree};
        
        std::vector<ClusterPoint> neighbors;
        tree.query(range, neighbors);

        for (const auto& neighbor : neighbors) {
            if (neighbor.index < 0 || neighbor.index >= globalVisited.size()) continue;
            if (globalVisited[neighbor.index]) continue;
            
            // Precise check
            if (haversineMeters(p, neighbor) <= radiusMeters) {
                cluster.indices.push_back(neighbor.index);
                globalVisited[neighbor.index] = true;
            }
        }
        
        clusters.push_back(std::move(cluster));
    }

    return clusters;
}

}
