#ifndef EXPO_GAODE_MAP_EVENT_EMITTERS_H
#define EXPO_GAODE_MAP_EVENT_EMITTERS_H

#include <jsi/jsi.h>
#include <react/renderer/components/view/ViewEventEmitter.h>

namespace facebook {
namespace react {

class JSI_EXPORT ExpoGaodeMapViewEventEmitter : public ViewEventEmitter {
public:
  using ViewEventEmitter::ViewEventEmitter;

  struct LatLng {
    double latitude;
    double longitude;
  };

  struct LatLngBounds {
    LatLng northeast;
    LatLng southwest;
  };

  struct CameraPosition {
    LatLng target;
    double zoom;
    double bearing;
    double tilt;
  };

  struct onMapPressEvent {
    double latitude;
    double longitude;
  };

  struct onPressPoiEvent {
    std::string id;
    std::string name;
    LatLng position;
  };

  struct onMapLongPressEvent {
    double latitude;
    double longitude;
  };

  struct onLoadEvent {};

  struct onLocationEvent {
    double latitude;
    double longitude;
    double accuracy;
  };

  struct onCameraEvent {
    CameraPosition cameraPosition;
    LatLngBounds latLngBounds;
  };

  void onMapPress(onMapPressEvent value) const;
  void onPressPoi(onPressPoiEvent value) const;
  void onMapLongPress(onMapLongPressEvent value) const;
  void onLoad(onLoadEvent value) const;
  void onLocation(onLocationEvent value) const;
  void onCameraMove(onCameraEvent value) const;
  void onCameraIdle(onCameraEvent value) const;
};

} // namespace react
} // namespace facebook

#endif // EXPO_GAODE_MAP_EVENT_EMITTERS_H
