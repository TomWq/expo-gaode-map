#ifndef EXPO_GAODE_MAP_PROPS_H
#define EXPO_GAODE_MAP_PROPS_H

#include <string>
#include <unordered_map>
#include <vector>

#include <jsi/jsi.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

struct LatLng {
  double latitude{0};
  double longitude{0};
};

struct CameraPosition {
  LatLng target{};
  double zoom{16};
  double bearing{0};
  double tilt{0};
};

struct CustomMapStyle {
  std::string styleId;
  std::string styleDataPath;
  std::string extraStyleDataPath;
};

template <typename T>
static inline void assignPropIfPresent(
    const PropsParserContext &context,
    const std::unordered_map<std::string, RawValue> &map,
    const char *key,
    T &target)
{
  auto it = map.find(key);
  if (it == map.end() || !it->second.hasValue()) {
    return;
  }
  fromRawValue(context, it->second, target);
}

static inline void fromRawValue(const PropsParserContext &context, const RawValue &value, LatLng &result) {
  auto map = (std::unordered_map<std::string, RawValue>)value;
  assignPropIfPresent(context, map, "latitude", result.latitude);
  assignPropIfPresent(context, map, "longitude", result.longitude);
}

static inline std::string toString(const LatLng &) {
  return "[Object LatLng]";
}

static inline void fromRawValue(const PropsParserContext &context, const RawValue &value, CameraPosition &result) {
  auto map = (std::unordered_map<std::string, RawValue>)value;
  assignPropIfPresent(context, map, "target", result.target);
  assignPropIfPresent(context, map, "zoom", result.zoom);
  assignPropIfPresent(context, map, "bearing", result.bearing);
  assignPropIfPresent(context, map, "tilt", result.tilt);
}

static inline std::string toString(const CameraPosition &) {
  return "[Object CameraPosition]";
}

static inline void
fromRawValue(const PropsParserContext &context, const RawValue &value, CustomMapStyle &result)
{
  if (!value.hasValue() || !value.hasType<std::unordered_map<std::string, RawValue>>()) {
    result = {};
    return;
  }

  auto map = (std::unordered_map<std::string, RawValue>)value;
  assignPropIfPresent(context, map, "styleId", result.styleId);
  assignPropIfPresent(context, map, "styleDataPath", result.styleDataPath);
  assignPropIfPresent(context, map, "extraStyleDataPath", result.extraStyleDataPath);
}

static inline std::string toString(const CustomMapStyle &) {
  return "[Object CustomMapStyle]";
}

class JSI_EXPORT ExpoGaodeMapViewProps final : public ViewProps {
public:
  ExpoGaodeMapViewProps() = default;
  ExpoGaodeMapViewProps(const PropsParserContext &context, const ExpoGaodeMapViewProps &sourceProps, const RawProps &rawProps);

  std::string harmonyApiKey;
  int mapType;
  CameraPosition initialCameraPosition;
  bool myLocationEnabled;
  bool followUserLocation;
  bool indoorViewEnabled;
  bool buildingsEnabled;
  bool labelsEnabled;
  bool compassEnabled;
  bool zoomControlsEnabled;
  bool scaleControlsEnabled;
  bool myLocationButtonEnabled;
  bool trafficEnabled;
  bool worldMapSwitchEnabled;
  double maxZoom;
  double minZoom;
  bool zoomGesturesEnabled;
  bool scrollGesturesEnabled;
  bool rotateGesturesEnabled;
  bool tiltGesturesEnabled;
  double cameraEventThrottleMs;
  CustomMapStyle customMapStyle{};
};

class JSI_EXPORT MarkerViewProps final : public ViewProps {
public:
  MarkerViewProps() = default;
  MarkerViewProps(const PropsParserContext &context, const MarkerViewProps &sourceProps, const RawProps &rawProps);

  double latitude;
  double longitude;
  std::string title;
  std::string snippet;
  bool draggable;
  bool flat;
  double levelIndex;
  Point anchor;
  Point centerOffset;
  double opacity;
  std::string icon;
};

class JSI_EXPORT PolylineViewProps final : public ViewProps {
public:
  PolylineViewProps() = default;
  PolylineViewProps(const PropsParserContext &context, const PolylineViewProps &sourceProps, const RawProps &rawProps);

  std::vector<LatLng> points;
  double strokeWidth;
  std::string strokeColor;
  std::vector<std::string> colors;
  bool gradient;
  bool geodesic;
  bool dotted;
  double levelIndex;
};

class JSI_EXPORT PolygonViewProps final : public ViewProps {
public:
  PolygonViewProps() = default;
  PolygonViewProps(const PropsParserContext &context, const PolygonViewProps &sourceProps, const RawProps &rawProps);

  std::vector<LatLng> points;
  std::vector<std::vector<LatLng>> rings;
  double strokeWidth;
  std::string strokeColor;
  std::string fillColor;
  double levelIndex;
};

class JSI_EXPORT CircleViewProps final : public ViewProps {
public:
  CircleViewProps() = default;
  CircleViewProps(const PropsParserContext &context, const CircleViewProps &sourceProps, const RawProps &rawProps);

  LatLng center;
  double radius;
  double strokeWidth;
  std::string strokeColor;
  std::string fillColor;
  double levelIndex;
};

class JSI_EXPORT HeatMapViewProps final : public ViewProps {
public:
  HeatMapViewProps() = default;
  HeatMapViewProps(const PropsParserContext &context, const HeatMapViewProps &sourceProps, const RawProps &rawProps);

  std::vector<LatLng> data;
  bool visible;
  int radius;
  double opacity;
};

class JSI_EXPORT MultiPointViewProps final : public ViewProps {
public:
  MultiPointViewProps() = default;
  MultiPointViewProps(const PropsParserContext &context, const MultiPointViewProps &sourceProps, const RawProps &rawProps);

  std::vector<LatLng> points;
  std::string icon;
  int iconWidth;
  int iconHeight;
  Point anchor;
};

} // namespace react
} // namespace facebook

#endif // EXPO_GAODE_MAP_PROPS_H
