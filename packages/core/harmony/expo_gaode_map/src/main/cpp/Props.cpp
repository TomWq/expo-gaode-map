#include "Props.h"

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>

namespace facebook {
namespace react {

ExpoGaodeMapViewProps::ExpoGaodeMapViewProps(
  const PropsParserContext &context,
  const ExpoGaodeMapViewProps &sourceProps,
  const RawProps &rawProps
) : ViewProps(context, sourceProps, rawProps),
    harmonyApiKey(convertRawProp(context, rawProps, "harmonyApiKey", sourceProps.harmonyApiKey, {""})),
    mapType(convertRawProp(context, rawProps, "mapType", sourceProps.mapType, 1)),
    initialCameraPosition(convertRawProp(context, rawProps, "initialCameraPosition", sourceProps.initialCameraPosition, {{0, 0}, 16, 0, 0})),
    myLocationEnabled(convertRawProp(context, rawProps, "myLocationEnabled", sourceProps.myLocationEnabled, false)),
    indoorViewEnabled(convertRawProp(context, rawProps, "indoorViewEnabled", sourceProps.indoorViewEnabled, false)),
    buildingsEnabled(convertRawProp(context, rawProps, "buildingsEnabled", sourceProps.buildingsEnabled, false)),
    labelsEnabled(convertRawProp(context, rawProps, "labelsEnabled", sourceProps.labelsEnabled, true)),
    compassEnabled(convertRawProp(context, rawProps, "compassEnabled", sourceProps.compassEnabled, false)),
    zoomControlsEnabled(convertRawProp(context, rawProps, "zoomControlsEnabled", sourceProps.zoomControlsEnabled, false)),
    scaleControlsEnabled(convertRawProp(context, rawProps, "scaleControlsEnabled", sourceProps.scaleControlsEnabled, false)),
    myLocationButtonEnabled(convertRawProp(context, rawProps, "myLocationButtonEnabled", sourceProps.myLocationButtonEnabled, false)),
    trafficEnabled(convertRawProp(context, rawProps, "trafficEnabled", sourceProps.trafficEnabled, false)),
    maxZoom(convertRawProp(context, rawProps, "maxZoom", sourceProps.maxZoom, 20.0)),
    minZoom(convertRawProp(context, rawProps, "minZoom", sourceProps.minZoom, 3.0)),
    zoomGesturesEnabled(convertRawProp(context, rawProps, "zoomGesturesEnabled", sourceProps.zoomGesturesEnabled, true)),
    scrollGesturesEnabled(convertRawProp(context, rawProps, "scrollGesturesEnabled", sourceProps.scrollGesturesEnabled, true)),
    rotateGesturesEnabled(convertRawProp(context, rawProps, "rotateGesturesEnabled", sourceProps.rotateGesturesEnabled, true)),
    tiltGesturesEnabled(convertRawProp(context, rawProps, "tiltGesturesEnabled", sourceProps.tiltGesturesEnabled, true)),
    cameraEventThrottleMs(convertRawProp(context, rawProps, "cameraEventThrottleMs", sourceProps.cameraEventThrottleMs, 32.0)) {}

} // namespace react
} // namespace facebook
