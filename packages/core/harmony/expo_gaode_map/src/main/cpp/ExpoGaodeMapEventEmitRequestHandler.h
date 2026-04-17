#ifndef EXPO_GAODE_MAP_EVENT_EMIT_REQUEST_HANDLER_H
#define EXPO_GAODE_MAP_EVENT_EMIT_REQUEST_HANDLER_H

#include "ExpoGaodeMapEventEmitters.h"
#include "RNOH/ArkJS.h"
#include "RNOH/EventEmitRequestHandler.h"

namespace rnoh {

enum class ExpoGaodeMapViewEventType {
  ON_MAP_PRESS,
  ON_PRESS_POI,
  ON_MAP_LONG_PRESS,
  ON_LOAD,
  ON_LOCATION,
  ON_CAMERA_MOVE,
  ON_CAMERA_IDLE,
  ON_COMMAND_RESULT,
};

enum class MarkerViewEventType {
  ON_PRESS,
  ON_DRAG_START,
  ON_DRAG,
  ON_DRAG_END,
};

enum class PolylineViewEventType {
  ON_PRESS,
};

inline ExpoGaodeMapViewEventType getExpoGaodeMapViewEventType(ArkJS &arkJs, napi_value eventObject) {
  auto eventType = arkJs.getString(arkJs.getObjectProperty(eventObject, "type"));

  if (eventType == "onMapPress") {
    return ExpoGaodeMapViewEventType::ON_MAP_PRESS;
  }
  if (eventType == "onPressPoi") {
    return ExpoGaodeMapViewEventType::ON_PRESS_POI;
  }
  if (eventType == "onMapLongPress") {
    return ExpoGaodeMapViewEventType::ON_MAP_LONG_PRESS;
  }
  if (eventType == "onLoad") {
    return ExpoGaodeMapViewEventType::ON_LOAD;
  }
  if (eventType == "onLocation") {
    return ExpoGaodeMapViewEventType::ON_LOCATION;
  }
  if (eventType == "onCameraMove") {
    return ExpoGaodeMapViewEventType::ON_CAMERA_MOVE;
  }
  if (eventType == "onCommandResult") {
    return ExpoGaodeMapViewEventType::ON_COMMAND_RESULT;
  }
  return ExpoGaodeMapViewEventType::ON_CAMERA_IDLE;
}

inline MarkerViewEventType getMarkerViewEventType(ArkJS &arkJs, napi_value eventObject) {
  auto eventType = arkJs.getString(arkJs.getObjectProperty(eventObject, "type"));
  if (eventType == "onPress") {
    return MarkerViewEventType::ON_PRESS;
  }
  if (eventType == "onDragStart") {
    return MarkerViewEventType::ON_DRAG_START;
  }
  if (eventType == "onDrag") {
    return MarkerViewEventType::ON_DRAG;
  }
  return MarkerViewEventType::ON_DRAG_END;
}

inline PolylineViewEventType getPolylineViewEventType(ArkJS &, napi_value) {
  return PolylineViewEventType::ON_PRESS;
}

class ExpoGaodeMapViewEventEmitRequestHandler : public EventEmitRequestHandler {
public:
  void handleEvent(EventEmitRequestHandler::Context const &ctx) override {
    if (ctx.eventName != "ExpoGaodeMapView") {
      return;
    }

    ArkJS arkJs(ctx.env);

    auto eventEmitter = ctx.shadowViewRegistry->getEventEmitter<facebook::react::ExpoGaodeMapViewEventEmitter>(ctx.tag);
    if (eventEmitter == nullptr) {
      return;
    }

    switch (getExpoGaodeMapViewEventType(arkJs, ctx.payload)) {
      case ExpoGaodeMapViewEventType::ON_MAP_PRESS: {
        auto latitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "latitude"));
        auto longitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "longitude"));
        eventEmitter->onMapPress({latitude, longitude});
        break;
      }
      case ExpoGaodeMapViewEventType::ON_PRESS_POI: {
        auto id = arkJs.getString(arkJs.getObjectProperty(ctx.payload, "id"));
        auto name = arkJs.getString(arkJs.getObjectProperty(ctx.payload, "name"));
        auto latitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "latitude"));
        auto longitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "longitude"));

        facebook::react::ExpoGaodeMapViewEventEmitter::LatLng latLng{latitude, longitude};
        eventEmitter->onPressPoi({id, name, latLng});
        break;
      }
      case ExpoGaodeMapViewEventType::ON_MAP_LONG_PRESS: {
        auto latitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "latitude"));
        auto longitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "longitude"));
        eventEmitter->onMapLongPress({latitude, longitude});
        break;
      }
      case ExpoGaodeMapViewEventType::ON_LOAD: {
        eventEmitter->onLoad({});
        break;
      }
      case ExpoGaodeMapViewEventType::ON_LOCATION: {
        auto latitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "latitude"));
        auto longitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "longitude"));
        auto accuracy = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "accuracy"));
        eventEmitter->onLocation({latitude, longitude, accuracy});
        break;
      }
      case ExpoGaodeMapViewEventType::ON_CAMERA_MOVE:
      case ExpoGaodeMapViewEventType::ON_CAMERA_IDLE: {
        auto targetLatitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "targetLatitude"));
        auto targetLongitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "targetLongitude"));
        auto zoom = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "zoom"));
        auto bearing = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "bearing"));
        auto tilt = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "tilt"));

        auto neLatitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "northEastLatitude"));
        auto neLongitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "northEastLongitude"));
        auto swLatitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "southWestLatitude"));
        auto swLongitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "southWestLongitude"));

        facebook::react::ExpoGaodeMapViewEventEmitter::onCameraEvent event {
          { {targetLatitude, targetLongitude}, zoom, bearing, tilt },
          { {neLatitude, neLongitude}, {swLatitude, swLongitude} }
        };

        if (getExpoGaodeMapViewEventType(arkJs, ctx.payload) == ExpoGaodeMapViewEventType::ON_CAMERA_MOVE) {
          eventEmitter->onCameraMove(event);
        } else {
          eventEmitter->onCameraIdle(event);
        }
        break;
      }
      case ExpoGaodeMapViewEventType::ON_COMMAND_RESULT:
      {
        auto command = arkJs.getString(arkJs.getObjectProperty(ctx.payload, "command"));
        auto requestId = arkJs.getString(arkJs.getObjectProperty(ctx.payload, "requestId"));
        auto status = arkJs.getString(arkJs.getObjectProperty(ctx.payload, "status"));
        auto latitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "latitude"));
        auto longitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "longitude"));
        auto snapshotPath = arkJs.getString(arkJs.getObjectProperty(ctx.payload, "snapshotPath"));
        auto message = arkJs.getString(arkJs.getObjectProperty(ctx.payload, "message"));
        eventEmitter->onCommandResult({command, requestId, status, latitude, longitude, snapshotPath, message});
        break;
      }
      default:
        break;
    }
  }
};

class MarkerViewEventEmitRequestHandler : public EventEmitRequestHandler {
public:
  void handleEvent(EventEmitRequestHandler::Context const &ctx) override {
    if (ctx.eventName != "MarkerView") {
      return;
    }

    ArkJS arkJs(ctx.env);
    auto eventEmitter = ctx.shadowViewRegistry->getEventEmitter<facebook::react::MarkerViewEventEmitter>(ctx.tag);
    if (eventEmitter == nullptr) {
      return;
    }

    auto latitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "latitude"));
    auto longitude = (double) arkJs.getDouble(arkJs.getObjectProperty(ctx.payload, "longitude"));

    switch (getMarkerViewEventType(arkJs, ctx.payload)) {
      case MarkerViewEventType::ON_PRESS:
        eventEmitter->onPress({latitude, longitude});
        break;
      case MarkerViewEventType::ON_DRAG_START:
        eventEmitter->onDragStart({latitude, longitude});
        break;
      case MarkerViewEventType::ON_DRAG:
        eventEmitter->onDrag({latitude, longitude});
        break;
      case MarkerViewEventType::ON_DRAG_END:
      default:
        eventEmitter->onDragEnd({latitude, longitude});
        break;
    }
  }
};

class PolylineViewEventEmitRequestHandler : public EventEmitRequestHandler {
public:
  void handleEvent(EventEmitRequestHandler::Context const &ctx) override {
    if (ctx.eventName != "PolylineView") {
      return;
    }

    ArkJS arkJs(ctx.env);
    auto eventEmitter = ctx.shadowViewRegistry->getEventEmitter<facebook::react::PolylineViewEventEmitter>(ctx.tag);
    if (eventEmitter == nullptr) {
      return;
    }

    switch (getPolylineViewEventType(arkJs, ctx.payload)) {
      case PolylineViewEventType::ON_PRESS:
      default:
        eventEmitter->onPress({});
        break;
    }
  }
};

} // namespace rnoh

#endif // EXPO_GAODE_MAP_EVENT_EMIT_REQUEST_HANDLER_H
