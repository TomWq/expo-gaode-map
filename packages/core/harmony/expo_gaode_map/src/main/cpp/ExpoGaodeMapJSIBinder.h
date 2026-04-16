#ifndef EXPO_GAODE_MAP_JSI_BINDER_H
#define EXPO_GAODE_MAP_JSI_BINDER_H

#include "RNOHCorePackage/ComponentBinders/ViewComponentJSIBinder.h"

namespace rnoh {

class ExpoGaodeMapViewJSIBinder : public ViewComponentJSIBinder {
public:
  facebook::jsi::Object createNativeProps(facebook::jsi::Runtime &rt) override {
    auto object = ViewComponentJSIBinder::createNativeProps(rt);

    object.setProperty(rt, "harmonyApiKey", "string");
    object.setProperty(rt, "mapType", "number");
    object.setProperty(rt, "initialCameraPosition", "Object");
    object.setProperty(rt, "myLocationEnabled", "boolean");
    object.setProperty(rt, "indoorViewEnabled", "boolean");
    object.setProperty(rt, "buildingsEnabled", "boolean");
    object.setProperty(rt, "labelsEnabled", "boolean");
    object.setProperty(rt, "compassEnabled", "boolean");
    object.setProperty(rt, "zoomControlsEnabled", "boolean");
    object.setProperty(rt, "scaleControlsEnabled", "boolean");
    object.setProperty(rt, "myLocationButtonEnabled", "boolean");
    object.setProperty(rt, "trafficEnabled", "boolean");
    object.setProperty(rt, "maxZoom", "number");
    object.setProperty(rt, "minZoom", "number");
    object.setProperty(rt, "zoomGesturesEnabled", "boolean");
    object.setProperty(rt, "scrollGesturesEnabled", "boolean");
    object.setProperty(rt, "rotateGesturesEnabled", "boolean");
    object.setProperty(rt, "tiltGesturesEnabled", "boolean");
    object.setProperty(rt, "cameraEventThrottleMs", "number");

    return object;
  }

  facebook::jsi::Object createBubblingEventTypes(facebook::jsi::Runtime &rt) override {
    return facebook::jsi::Object(rt);
  }

  facebook::jsi::Object createDirectEventTypes(facebook::jsi::Runtime &rt) override {
    facebook::jsi::Object events(rt);
    events.setProperty(rt, "topMapPress", createDirectEvent(rt, "onMapPress"));
    events.setProperty(rt, "topPressPoi", createDirectEvent(rt, "onPressPoi"));
    events.setProperty(rt, "topMapLongPress", createDirectEvent(rt, "onMapLongPress"));
    events.setProperty(rt, "topLoad", createDirectEvent(rt, "onLoad"));
    events.setProperty(rt, "topLocation", createDirectEvent(rt, "onLocation"));
    events.setProperty(rt, "topCameraMove", createDirectEvent(rt, "onCameraMove"));
    events.setProperty(rt, "topCameraIdle", createDirectEvent(rt, "onCameraIdle"));
    return events;
  }
};

} // namespace rnoh

#endif // EXPO_GAODE_MAP_JSI_BINDER_H
