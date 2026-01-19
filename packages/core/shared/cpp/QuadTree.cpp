#include "QuadTree.hpp"

namespace gaodemap {

bool BoundingBox::contains(double lat, double lon) const {
    return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}

bool BoundingBox::intersects(const BoundingBox& other) const {
    return !(other.minLat > maxLat || other.maxLat < minLat || 
             other.minLon > maxLon || other.maxLon < minLon);
}

QuadTree::QuadTree(const BoundingBox& bounds, int capacity)
    : bounds(bounds), capacity(capacity) {}

bool QuadTree::insert(const ClusterPoint& point) {
    if (!bounds.contains(point.lat, point.lon)) {
        return false;
    }

    if (points.size() < capacity && !subdivided) {
        points.push_back(point);
        return true;
    }

    if (!subdivided) {
        subdivide();
    }

    if (northWest->insert(point)) return true;
    if (northEast->insert(point)) return true;
    if (southWest->insert(point)) return true;
    if (southEast->insert(point)) return true;

    // Point might be exactly on the boundary of the QuadTree but not accepted by children?
    // In our logic, children cover the full range of the parent.
    // However, floating point precision might be tricky.
    // As a fallback, if we are subdivided but children didn't take it (rare), 
    // we can keep it here or force insert.
    // Given the subdivision logic, it should cover all space.
    return false;
}

void QuadTree::subdivide() {
    double midLat = (bounds.minLat + bounds.maxLat) / 2.0;
    double midLon = (bounds.minLon + bounds.maxLon) / 2.0;

    northWest = std::make_unique<QuadTree>(BoundingBox{midLat, bounds.minLon, bounds.maxLat, midLon}, capacity);
    northEast = std::make_unique<QuadTree>(BoundingBox{midLat, midLon, bounds.maxLat, bounds.maxLon}, capacity);
    southWest = std::make_unique<QuadTree>(BoundingBox{bounds.minLat, bounds.minLon, midLat, midLon}, capacity);
    southEast = std::make_unique<QuadTree>(BoundingBox{bounds.minLat, midLon, midLat, bounds.maxLon}, capacity);

    subdivided = true;
    
    // Redistribute existing points
    for (const auto& p : points) {
        bool inserted = northWest->insert(p) || northEast->insert(p) || 
                        southWest->insert(p) || southEast->insert(p);
    }
    points.clear();
}

void QuadTree::query(const BoundingBox& range, std::vector<ClusterPoint>& found) const {
    if (!bounds.intersects(range)) {
        return;
    }

    for (const auto& p : points) {
        if (range.contains(p.lat, p.lon)) {
            found.push_back(p);
        }
    }

    if (subdivided) {
        northWest->query(range, found);
        northEast->query(range, found);
        southWest->query(range, found);
        southEast->query(range, found);
    }
}

void QuadTree::clear() {
    points.clear();
    northWest.reset();
    northEast.reset();
    southWest.reset();
    southEast.reset();
    subdivided = false;
}

}
