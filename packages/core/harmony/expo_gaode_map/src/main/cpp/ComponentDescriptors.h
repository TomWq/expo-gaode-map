#ifndef EXPO_GAODE_MAP_COMPONENTDESCRIPTORS_H
#define EXPO_GAODE_MAP_COMPONENTDESCRIPTORS_H

#include "ShadowNodes.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook {
namespace react {

using ExpoGaodeMapViewComponentDescriptor = ConcreteComponentDescriptor<ExpoGaodeMapViewShadowNode>;
using MarkerViewComponentDescriptor = ConcreteComponentDescriptor<MarkerViewShadowNode>;
using PolylineViewComponentDescriptor = ConcreteComponentDescriptor<PolylineViewShadowNode>;
using PolygonViewComponentDescriptor = ConcreteComponentDescriptor<PolygonViewShadowNode>;
using CircleViewComponentDescriptor = ConcreteComponentDescriptor<CircleViewShadowNode>;
using HeatMapViewComponentDescriptor = ConcreteComponentDescriptor<HeatMapViewShadowNode>;
using MultiPointViewComponentDescriptor = ConcreteComponentDescriptor<MultiPointViewShadowNode>;

} // namespace react
} // namespace facebook

#endif // EXPO_GAODE_MAP_COMPONENTDESCRIPTORS_H
