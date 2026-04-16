#ifndef EXPO_GAODE_MAP_PROPS_H
#define EXPO_GAODE_MAP_PROPS_H

#include <jsi/jsi.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

struct LatLng {
  double latitude;
  double longitude;
};

struct CameraPosition {
  LatLng target;
  double zoom;
  double bearing;
  double tilt;
};

static inline void fromRawValue(const PropsParserContext &context, const RawValue &value, LatLng &result) {
  auto map = (butter::map<std::string, RawValue>)value;
  auto itLatitude = map.find("latitude");
  if (itLatitude != map.end()) {
    fromRawValue(context, itLatitude->second, result.latitude);
  }
  auto itLongitude = map.find("longitude");
  if (itLongitude != map.end()) {
    fromRawValue(context, itLongitude->second, result.longitude);
  }
}

static inline std::string toString(const LatLng &) {
  return "[Object LatLng]";
}

static inline void fromRawValue(const PropsParserContext &context, const RawValue &value, CameraPosition &result) {
  auto map = (butter::map<std::string, RawValue>)value;

  auto itTarget = map.find("target");
  if (itTarget != map.end()) {
    fromRawValue(context, itTarget->second, result.target);
  }

  auto itZoom = map.find("zoom");
  if (itZoom != map.end()) {
    fromRawValue(context, itZoom->second, result.zoom);
  }

  auto itBearing = map.find("bearing");
  if (itBearing != map.end()) {
    fromRawValue(context, itBearing->second, result.bearing);
  }

  auto itTilt = map.find("tilt");
  if (itTilt != map.end()) {
    fromRawValue(context, itTilt->second, result.tilt);
  }
}

static inline std::string toString(const CameraPosition &) {
  return "[Object CameraPosition]";
}

class JSI_EXPORT ExpoGaodeMapViewProps final : public ViewProps {
public:
  ExpoGaodeMapViewProps() = default;
  ExpoGaodeMapViewProps(const PropsParserContext &context, const ExpoGaodeMapViewProps &sourceProps, const RawProps &rawProps);

  std::string harmonyApiKey;
  int mapType;
  CameraPosition initialCameraPosition;
  bool myLocationEnabled;
  bool indoorViewEnabled;
  bool buildingsEnabled;
  bool labelsEnabled;
  bool compassEnabled;
  bool zoomControlsEnabled;
  bool scaleControlsEnabled;
  bool myLocationButtonEnabled;
  bool trafficEnabled;
  double maxZoom;
  double minZoom;
  bool zoomGesturesEnabled;
  bool scrollGesturesEnabled;
  bool rotateGesturesEnabled;
  bool tiltGesturesEnabled;
  double cameraEventThrottleMs;
};

} // namespace react
} // namespace facebook

#endif // EXPO_GAODE_MAP_PROPS_H
