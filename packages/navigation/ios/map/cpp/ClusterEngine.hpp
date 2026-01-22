#pragma once

#include <vector>

namespace gaodemap {

struct ClusterPoint {
    double lat;
    double lon;
    int index;
};

struct ClusterOutput {
    int centerIndex;
    std::vector<int> indices;
};

std::vector<ClusterOutput> clusterPoints(const std::vector<ClusterPoint>& points, double radiusMeters);

}
