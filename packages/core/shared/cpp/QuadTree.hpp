#pragma once

#include <vector>
#include <memory>
#include "ClusterEngine.hpp"

namespace gaodemap {

struct BoundingBox {
    double minLat;
    double minLon;
    double maxLat;
    double maxLon;

    bool contains(double lat, double lon) const;
    bool intersects(const BoundingBox& other) const;
};

class QuadTree {
public:
    QuadTree(const BoundingBox& bounds, int capacity = 20);
    ~QuadTree() = default;

    bool insert(const ClusterPoint& point);
    void query(const BoundingBox& range, std::vector<ClusterPoint>& found) const;
    void clear();

private:
    BoundingBox bounds;
    int capacity;
    std::vector<ClusterPoint> points;
    bool subdivided = false;

    std::unique_ptr<QuadTree> northWest;
    std::unique_ptr<QuadTree> northEast;
    std::unique_ptr<QuadTree> southWest;
    std::unique_ptr<QuadTree> southEast;

    void subdivide();
};

}
