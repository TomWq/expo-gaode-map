#pragma once

#include "ClusterTypes.hpp"

namespace gaodemap {

std::vector<ClusterOutput> clusterPoints(const std::vector<ClusterPoint>& points, double radiusMeters);

}
