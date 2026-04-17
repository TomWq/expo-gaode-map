#include "ExpoGaodeMapEventEmitters.h"

namespace facebook {
namespace react {

void ExpoGaodeMapViewEventEmitter::onMapPress(onMapPressEvent event) const {
  dispatchEvent("MapPress", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "latitude", event.latitude);
    payload.setProperty(runtime, "longitude", event.longitude);
    return payload;
  });
}

void ExpoGaodeMapViewEventEmitter::onPressPoi(onPressPoiEvent event) const {
  dispatchEvent("PressPoi", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "id", event.id);
    payload.setProperty(runtime, "name", event.name);

    auto position = jsi::Object(runtime);
    position.setProperty(runtime, "latitude", event.position.latitude);
    position.setProperty(runtime, "longitude", event.position.longitude);
    payload.setProperty(runtime, "position", position);

    return payload;
  });
}

void ExpoGaodeMapViewEventEmitter::onMapLongPress(onMapLongPressEvent event) const {
  dispatchEvent("MapLongPress", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "latitude", event.latitude);
    payload.setProperty(runtime, "longitude", event.longitude);
    return payload;
  });
}

void ExpoGaodeMapViewEventEmitter::onLoad(onLoadEvent) const {
  dispatchEvent("Load", [](jsi::Runtime &runtime) {
    return jsi::Object(runtime);
  });
}

void ExpoGaodeMapViewEventEmitter::onLocation(onLocationEvent event) const {
  dispatchEvent("Location", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "latitude", event.latitude);
    payload.setProperty(runtime, "longitude", event.longitude);
    payload.setProperty(runtime, "accuracy", event.accuracy);
    return payload;
  });
}

void ExpoGaodeMapViewEventEmitter::onCommandResult(onCommandResultEvent event) const {
  dispatchEvent("CommandResult", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "command", event.command);
    payload.setProperty(runtime, "requestId", event.requestId);
    payload.setProperty(runtime, "status", event.status);
    payload.setProperty(runtime, "latitude", event.latitude);
    payload.setProperty(runtime, "longitude", event.longitude);
    payload.setProperty(runtime, "snapshotPath", event.snapshotPath);
    payload.setProperty(runtime, "message", event.message);
    return payload;
  });
}

void ExpoGaodeMapViewEventEmitter::onCameraMove(onCameraEvent event) const {
  dispatchEvent("CameraMove", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);

    auto cameraPosition = jsi::Object(runtime);
    auto target = jsi::Object(runtime);
    target.setProperty(runtime, "latitude", event.cameraPosition.target.latitude);
    target.setProperty(runtime, "longitude", event.cameraPosition.target.longitude);
    cameraPosition.setProperty(runtime, "target", target);
    cameraPosition.setProperty(runtime, "zoom", event.cameraPosition.zoom);
    cameraPosition.setProperty(runtime, "bearing", event.cameraPosition.bearing);
    cameraPosition.setProperty(runtime, "tilt", event.cameraPosition.tilt);

    auto bounds = jsi::Object(runtime);
    auto northeast = jsi::Object(runtime);
    northeast.setProperty(runtime, "latitude", event.latLngBounds.northeast.latitude);
    northeast.setProperty(runtime, "longitude", event.latLngBounds.northeast.longitude);
    auto southwest = jsi::Object(runtime);
    southwest.setProperty(runtime, "latitude", event.latLngBounds.southwest.latitude);
    southwest.setProperty(runtime, "longitude", event.latLngBounds.southwest.longitude);
    bounds.setProperty(runtime, "northeast", northeast);
    bounds.setProperty(runtime, "southwest", southwest);

    payload.setProperty(runtime, "cameraPosition", cameraPosition);
    payload.setProperty(runtime, "latLngBounds", bounds);

    return payload;
  });
}

void ExpoGaodeMapViewEventEmitter::onCameraIdle(onCameraEvent event) const {
  dispatchEvent("CameraIdle", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);

    auto cameraPosition = jsi::Object(runtime);
    auto target = jsi::Object(runtime);
    target.setProperty(runtime, "latitude", event.cameraPosition.target.latitude);
    target.setProperty(runtime, "longitude", event.cameraPosition.target.longitude);
    cameraPosition.setProperty(runtime, "target", target);
    cameraPosition.setProperty(runtime, "zoom", event.cameraPosition.zoom);
    cameraPosition.setProperty(runtime, "bearing", event.cameraPosition.bearing);
    cameraPosition.setProperty(runtime, "tilt", event.cameraPosition.tilt);

    auto bounds = jsi::Object(runtime);
    auto northeast = jsi::Object(runtime);
    northeast.setProperty(runtime, "latitude", event.latLngBounds.northeast.latitude);
    northeast.setProperty(runtime, "longitude", event.latLngBounds.northeast.longitude);
    auto southwest = jsi::Object(runtime);
    southwest.setProperty(runtime, "latitude", event.latLngBounds.southwest.latitude);
    southwest.setProperty(runtime, "longitude", event.latLngBounds.southwest.longitude);
    bounds.setProperty(runtime, "northeast", northeast);
    bounds.setProperty(runtime, "southwest", southwest);

    payload.setProperty(runtime, "cameraPosition", cameraPosition);
    payload.setProperty(runtime, "latLngBounds", bounds);

    return payload;
  });
}

void MarkerViewEventEmitter::onPress(onPressEvent event) const {
  dispatchEvent("Press", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "latitude", event.latitude);
    payload.setProperty(runtime, "longitude", event.longitude);
    return payload;
  });
}

void MarkerViewEventEmitter::onDragStart(onDragStartEvent event) const {
  dispatchEvent("DragStart", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "latitude", event.latitude);
    payload.setProperty(runtime, "longitude", event.longitude);
    return payload;
  });
}

void MarkerViewEventEmitter::onDrag(onDragEvent event) const {
  dispatchEvent("Drag", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "latitude", event.latitude);
    payload.setProperty(runtime, "longitude", event.longitude);
    return payload;
  });
}

void MarkerViewEventEmitter::onDragEnd(onDragEndEvent event) const {
  dispatchEvent("DragEnd", [event = std::move(event)](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "latitude", event.latitude);
    payload.setProperty(runtime, "longitude", event.longitude);
    return payload;
  });
}

void PolylineViewEventEmitter::onPress(onPressEvent) const {
  dispatchEvent("Press", [](jsi::Runtime &runtime) {
    return jsi::Object(runtime);
  });
}

} // namespace react
} // namespace facebook
