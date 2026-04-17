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
    object.setProperty(rt, "followUserLocation", "boolean");
    object.setProperty(rt, "userLocationRepresentation", "Object");
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
    object.setProperty(rt, "worldMapSwitchEnabled", "boolean");
    object.setProperty(rt, "customMapStyle", "Object");
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
    events.setProperty(rt, "topCommandResult", createDirectEvent(rt, "onCommandResult"));
    return events;
  }
};

class MarkerViewJSIBinder : public ViewComponentJSIBinder {
public:
  facebook::jsi::Object createNativeProps(facebook::jsi::Runtime &rt) override {
    auto object = ViewComponentJSIBinder::createNativeProps(rt);

    object.setProperty(rt, "latitude", "number");
    object.setProperty(rt, "longitude", "number");
    object.setProperty(rt, "position", "Object");
    object.setProperty(rt, "title", "string");
    object.setProperty(rt, "snippet", "string");
    object.setProperty(rt, "draggable", "boolean");
    object.setProperty(rt, "icon", "string");
    object.setProperty(rt, "pinColor", "string");
    object.setProperty(rt, "opacity", "number");
    object.setProperty(rt, "flat", "boolean");
    object.setProperty(rt, "zIndex", "number");
    object.setProperty(rt, "anchor", "Object");
    object.setProperty(rt, "centerOffset", "Object");
    object.setProperty(rt, "iconWidth", "number");
    object.setProperty(rt, "iconHeight", "number");
    object.setProperty(rt, "customViewWidth", "number");
    object.setProperty(rt, "customViewHeight", "number");
    object.setProperty(rt, "cacheKey", "string");
    object.setProperty(rt, "smoothMovePath", "array");
    object.setProperty(rt, "smoothMoveDuration", "number");
    object.setProperty(rt, "growAnimation", "boolean");

    return object;
  }

  facebook::jsi::Object createBubblingEventTypes(facebook::jsi::Runtime &rt) override {
    return facebook::jsi::Object(rt);
  }

  facebook::jsi::Object createDirectEventTypes(facebook::jsi::Runtime &rt) override {
    facebook::jsi::Object events(rt);
    events.setProperty(rt, "topPress", createDirectEvent(rt, "onMarkerPress"));
    events.setProperty(rt, "topDragStart", createDirectEvent(rt, "onMarkerDragStart"));
    events.setProperty(rt, "topDrag", createDirectEvent(rt, "onMarkerDrag"));
    events.setProperty(rt, "topDragEnd", createDirectEvent(rt, "onMarkerDragEnd"));
    return events;
  }
};

class PolylineViewJSIBinder : public ViewComponentJSIBinder {
public:
  facebook::jsi::Object createNativeProps(facebook::jsi::Runtime &rt) override {
    auto object = ViewComponentJSIBinder::createNativeProps(rt);

    object.setProperty(rt, "points", "array");
    object.setProperty(rt, "strokeWidth", "number");
    object.setProperty(rt, "strokeColor", "string");
    object.setProperty(rt, "texture", "string");
    object.setProperty(rt, "dotted", "boolean");
    object.setProperty(rt, "geodesic", "boolean");
    object.setProperty(rt, "zIndex", "number");
    object.setProperty(rt, "gradient", "boolean");
    object.setProperty(rt, "colors", "array");
    object.setProperty(rt, "simplificationTolerance", "number");

    return object;
  }

  facebook::jsi::Object createBubblingEventTypes(facebook::jsi::Runtime &rt) override {
    return facebook::jsi::Object(rt);
  }

  facebook::jsi::Object createDirectEventTypes(facebook::jsi::Runtime &rt) override {
    facebook::jsi::Object events(rt);
    events.setProperty(rt, "topPress", createDirectEvent(rt, "onPolylinePress"));
    return events;
  }
};

class PolygonViewJSIBinder : public ViewComponentJSIBinder {
public:
  facebook::jsi::Object createNativeProps(facebook::jsi::Runtime &rt) override {
    auto object = ViewComponentJSIBinder::createNativeProps(rt);

    object.setProperty(rt, "points", "array");
    object.setProperty(rt, "fillColor", "string");
    object.setProperty(rt, "strokeColor", "string");
    object.setProperty(rt, "strokeWidth", "number");
    object.setProperty(rt, "zIndex", "number");
    object.setProperty(rt, "simplificationTolerance", "number");

    return object;
  }

  facebook::jsi::Object createBubblingEventTypes(facebook::jsi::Runtime &rt) override {
    return facebook::jsi::Object(rt);
  }

  facebook::jsi::Object createDirectEventTypes(facebook::jsi::Runtime &rt) override {
    facebook::jsi::Object events(rt);
    return events;
  }
};

class CircleViewJSIBinder : public ViewComponentJSIBinder {
public:
  facebook::jsi::Object createNativeProps(facebook::jsi::Runtime &rt) override {
    auto object = ViewComponentJSIBinder::createNativeProps(rt);

    object.setProperty(rt, "center", "Object");
    object.setProperty(rt, "radius", "number");
    object.setProperty(rt, "fillColor", "string");
    object.setProperty(rt, "strokeColor", "string");
    object.setProperty(rt, "strokeWidth", "number");
    object.setProperty(rt, "zIndex", "number");

    return object;
  }

  facebook::jsi::Object createBubblingEventTypes(facebook::jsi::Runtime &rt) override {
    return facebook::jsi::Object(rt);
  }

  facebook::jsi::Object createDirectEventTypes(facebook::jsi::Runtime &rt) override {
    facebook::jsi::Object events(rt);
    return events;
  }
};

class HeatMapViewJSIBinder : public ViewComponentJSIBinder {
public:
  facebook::jsi::Object createNativeProps(facebook::jsi::Runtime &rt) override {
    auto object = ViewComponentJSIBinder::createNativeProps(rt);

    object.setProperty(rt, "data", "array");
    object.setProperty(rt, "visible", "boolean");
    object.setProperty(rt, "radius", "number");
    object.setProperty(rt, "opacity", "number");
    object.setProperty(rt, "gradient", "Object");
    object.setProperty(rt, "allowRetinaAdapting", "boolean");

    return object;
  }

  facebook::jsi::Object createBubblingEventTypes(facebook::jsi::Runtime &rt) override {
    return facebook::jsi::Object(rt);
  }

  facebook::jsi::Object createDirectEventTypes(facebook::jsi::Runtime &rt) override {
    facebook::jsi::Object events(rt);
    return events;
  }
};

class MultiPointViewJSIBinder : public ViewComponentJSIBinder {
public:
  facebook::jsi::Object createNativeProps(facebook::jsi::Runtime &rt) override {
    auto object = ViewComponentJSIBinder::createNativeProps(rt);

    object.setProperty(rt, "points", "array");
    object.setProperty(rt, "icon", "string");
    object.setProperty(rt, "iconWidth", "number");
    object.setProperty(rt, "iconHeight", "number");
    object.setProperty(rt, "anchor", "Object");

    return object;
  }

  facebook::jsi::Object createBubblingEventTypes(facebook::jsi::Runtime &rt) override {
    return facebook::jsi::Object(rt);
  }

  facebook::jsi::Object createDirectEventTypes(facebook::jsi::Runtime &rt) override {
    facebook::jsi::Object events(rt);
    return events;
  }
};

} // namespace rnoh

#endif // EXPO_GAODE_MAP_JSI_BINDER_H
