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
    followUserLocation(convertRawProp(context, rawProps, "followUserLocation", sourceProps.followUserLocation, false)),
    indoorViewEnabled(convertRawProp(context, rawProps, "indoorViewEnabled", sourceProps.indoorViewEnabled, false)),
    buildingsEnabled(convertRawProp(context, rawProps, "buildingsEnabled", sourceProps.buildingsEnabled, false)),
    labelsEnabled(convertRawProp(context, rawProps, "labelsEnabled", sourceProps.labelsEnabled, true)),
    compassEnabled(convertRawProp(context, rawProps, "compassEnabled", sourceProps.compassEnabled, false)),
    zoomControlsEnabled(convertRawProp(context, rawProps, "zoomControlsEnabled", sourceProps.zoomControlsEnabled, false)),
    scaleControlsEnabled(convertRawProp(context, rawProps, "scaleControlsEnabled", sourceProps.scaleControlsEnabled, false)),
    myLocationButtonEnabled(convertRawProp(context, rawProps, "myLocationButtonEnabled", sourceProps.myLocationButtonEnabled, false)),
    trafficEnabled(convertRawProp(context, rawProps, "trafficEnabled", sourceProps.trafficEnabled, false)),
    worldMapSwitchEnabled(convertRawProp(context, rawProps, "worldMapSwitchEnabled", sourceProps.worldMapSwitchEnabled, true)),
    maxZoom(convertRawProp(context, rawProps, "maxZoom", sourceProps.maxZoom, 20.0)),
    minZoom(convertRawProp(context, rawProps, "minZoom", sourceProps.minZoom, 3.0)),
    zoomGesturesEnabled(convertRawProp(context, rawProps, "zoomGesturesEnabled", sourceProps.zoomGesturesEnabled, true)),
    scrollGesturesEnabled(convertRawProp(context, rawProps, "scrollGesturesEnabled", sourceProps.scrollGesturesEnabled, true)),
    rotateGesturesEnabled(convertRawProp(context, rawProps, "rotateGesturesEnabled", sourceProps.rotateGesturesEnabled, true)),
    tiltGesturesEnabled(convertRawProp(context, rawProps, "tiltGesturesEnabled", sourceProps.tiltGesturesEnabled, true)),
    cameraEventThrottleMs(convertRawProp(context, rawProps, "cameraEventThrottleMs", sourceProps.cameraEventThrottleMs, 32.0)),
    customMapStyle(convertRawProp(context, rawProps, "customMapStyle", sourceProps.customMapStyle, {})) {}

MarkerViewProps::MarkerViewProps(
  const PropsParserContext &context,
  const MarkerViewProps &sourceProps,
  const RawProps &rawProps
) : ViewProps(context, sourceProps, rawProps),
    latitude(convertRawProp(context, rawProps, "latitude", sourceProps.latitude, 0.0)),
    longitude(convertRawProp(context, rawProps, "longitude", sourceProps.longitude, 0.0)),
    title(convertRawProp(context, rawProps, "title", sourceProps.title, {""})),
    snippet(convertRawProp(context, rawProps, "snippet", sourceProps.snippet, {""})),
    draggable(convertRawProp(context, rawProps, "draggable", sourceProps.draggable, false)),
    flat(convertRawProp(context, rawProps, "flat", sourceProps.flat, false)),
    levelIndex(convertRawProp(context, rawProps, "zIndex", sourceProps.levelIndex, 0.0)),
    anchor(convertRawProp(context, rawProps, "anchor", sourceProps.anchor, {0, 0})),
    centerOffset(convertRawProp(context, rawProps, "centerOffset", sourceProps.centerOffset, {0, 0})),
    opacity(convertRawProp(context, rawProps, "opacity", sourceProps.opacity, 1.0)),
    icon(convertRawProp(context, rawProps, "icon", sourceProps.icon, {""})) {}

PolylineViewProps::PolylineViewProps(
  const PropsParserContext &context,
  const PolylineViewProps &sourceProps,
  const RawProps &rawProps
) : ViewProps(context, sourceProps, rawProps),
    points(convertRawProp(context, rawProps, "points", sourceProps.points, {})),
    strokeWidth(convertRawProp(context, rawProps, "strokeWidth", sourceProps.strokeWidth, 5.0)),
    strokeColor(convertRawProp(context, rawProps, "strokeColor", sourceProps.strokeColor, {""})),
    colors(convertRawProp(context, rawProps, "colors", sourceProps.colors, {})),
    gradient(convertRawProp(context, rawProps, "gradient", sourceProps.gradient, false)),
    geodesic(convertRawProp(context, rawProps, "geodesic", sourceProps.geodesic, false)),
    dotted(convertRawProp(context, rawProps, "dotted", sourceProps.dotted, false)),
    levelIndex(convertRawProp(context, rawProps, "zIndex", sourceProps.levelIndex, 0.0)) {}

PolygonViewProps::PolygonViewProps(
  const PropsParserContext &context,
  const PolygonViewProps &sourceProps,
  const RawProps &rawProps
) : ViewProps(context, sourceProps, rawProps),
    points(sourceProps.points),
    rings(sourceProps.rings),
    strokeWidth(convertRawProp(context, rawProps, "strokeWidth", sourceProps.strokeWidth, 1.0)),
    strokeColor(convertRawProp(context, rawProps, "strokeColor", sourceProps.strokeColor, {""})),
    fillColor(convertRawProp(context, rawProps, "fillColor", sourceProps.fillColor, {""})),
    levelIndex(convertRawProp(context, rawProps, "zIndex", sourceProps.levelIndex, 0.0)) {}

CircleViewProps::CircleViewProps(
  const PropsParserContext &context,
  const CircleViewProps &sourceProps,
  const RawProps &rawProps
) : ViewProps(context, sourceProps, rawProps),
    center(convertRawProp(context, rawProps, "center", sourceProps.center, {0, 0})),
    radius(convertRawProp(context, rawProps, "radius", sourceProps.radius, 0.0)),
    strokeWidth(convertRawProp(context, rawProps, "strokeWidth", sourceProps.strokeWidth, 1.0)),
    strokeColor(convertRawProp(context, rawProps, "strokeColor", sourceProps.strokeColor, {""})),
    fillColor(convertRawProp(context, rawProps, "fillColor", sourceProps.fillColor, {""})),
    levelIndex(convertRawProp(context, rawProps, "zIndex", sourceProps.levelIndex, 0.0)) {}

HeatMapViewProps::HeatMapViewProps(
  const PropsParserContext &context,
  const HeatMapViewProps &sourceProps,
  const RawProps &rawProps
) : ViewProps(context, sourceProps, rawProps),
    data(convertRawProp(context, rawProps, "data", sourceProps.data, {})),
    visible(convertRawProp(context, rawProps, "visible", sourceProps.visible, true)),
    radius(convertRawProp(context, rawProps, "radius", sourceProps.radius, 18)),
    opacity(convertRawProp(context, rawProps, "opacity", sourceProps.opacity, 0.6)) {}

MultiPointViewProps::MultiPointViewProps(
  const PropsParserContext &context,
  const MultiPointViewProps &sourceProps,
  const RawProps &rawProps
) : ViewProps(context, sourceProps, rawProps),
    points(convertRawProp(context, rawProps, "points", sourceProps.points, {})),
    icon(convertRawProp(context, rawProps, "icon", sourceProps.icon, {""})),
    iconWidth(convertRawProp(context, rawProps, "iconWidth", sourceProps.iconWidth, 0)),
    iconHeight(convertRawProp(context, rawProps, "iconHeight", sourceProps.iconHeight, 0)),
    anchor(convertRawProp(context, rawProps, "anchor", sourceProps.anchor, {0.5, 1})) {}

} // namespace react
} // namespace facebook
