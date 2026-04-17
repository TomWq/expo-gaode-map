#ifndef EXPO_GAODE_MAP_SHADOWNODES_H
#define EXPO_GAODE_MAP_SHADOWNODES_H

#include "ExpoGaodeMapEventEmitters.h"
#include "Props.h"

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

JSI_EXPORT extern const char ExpoGaodeMapViewComponentName[];
JSI_EXPORT extern const char MarkerViewComponentName[];
JSI_EXPORT extern const char PolylineViewComponentName[];
JSI_EXPORT extern const char PolygonViewComponentName[];
JSI_EXPORT extern const char CircleViewComponentName[];
JSI_EXPORT extern const char HeatMapViewComponentName[];
JSI_EXPORT extern const char MultiPointViewComponentName[];

using ExpoGaodeMapViewShadowNode =
    ConcreteViewShadowNode<ExpoGaodeMapViewComponentName, ExpoGaodeMapViewProps, ExpoGaodeMapViewEventEmitter>;
using MarkerViewShadowNode =
    ConcreteViewShadowNode<MarkerViewComponentName, MarkerViewProps, MarkerViewEventEmitter>;
using PolylineViewShadowNode =
    ConcreteViewShadowNode<PolylineViewComponentName, PolylineViewProps, PolylineViewEventEmitter>;
using PolygonViewShadowNode =
    ConcreteViewShadowNode<PolygonViewComponentName, PolygonViewProps, PolygonViewEventEmitter>;
using CircleViewShadowNode =
    ConcreteViewShadowNode<CircleViewComponentName, CircleViewProps, CircleViewEventEmitter>;
using HeatMapViewShadowNode =
    ConcreteViewShadowNode<HeatMapViewComponentName, HeatMapViewProps, HeatMapViewEventEmitter>;
using MultiPointViewShadowNode =
    ConcreteViewShadowNode<MultiPointViewComponentName, MultiPointViewProps, MultiPointViewEventEmitter>;

} // namespace react
} // namespace facebook

#endif // EXPO_GAODE_MAP_SHADOWNODES_H
