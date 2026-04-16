#ifndef EXPO_GAODE_MAP_SHADOWNODES_H
#define EXPO_GAODE_MAP_SHADOWNODES_H

#include "ExpoGaodeMapEventEmitters.h"
#include "Props.h"

#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

JSI_EXPORT extern const char ExpoGaodeMapViewComponentName[];

using ExpoGaodeMapViewShadowNode =
    ConcreteViewShadowNode<ExpoGaodeMapViewComponentName, ExpoGaodeMapViewProps, ExpoGaodeMapViewEventEmitter>;

} // namespace react
} // namespace facebook

#endif // EXPO_GAODE_MAP_SHADOWNODES_H
