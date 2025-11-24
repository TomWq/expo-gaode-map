package expo.modules.gaodemap

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * 高德地图视图 Module
 */
class ExpoGaodeMapViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGaodeMapView")

    View(ExpoGaodeMapView::class) {
      Events("onMapPress", "onMapLongPress", "onLoad", "onLocation", "onMarkerPress", "onMarkerDragStart", "onMarkerDrag", "onMarkerDragEnd", "onCirclePress", "onPolygonPress", "onPolylinePress")
      
      // ✅ 关键修复：拦截 React Native 的视图操作异常
      OnViewDestroys { view: ExpoGaodeMapView ->
      }

      Prop<Int>("mapType") { view, type ->
        view.mapType = type
        view.setMapType(type)
      }

      Prop<Map<String, Any?>?>("initialCameraPosition") { view, position ->
        view.initialCameraPosition = position
        position?.let { view.setInitialCameraPosition(it) }
      }

      Prop<Boolean>("zoomControlsEnabled") { view, show -> view.setShowsZoomControls(show) }
      Prop<Boolean>("compassEnabled") { view, show -> view.setShowsCompass(show) }
      Prop<Boolean>("scaleControlsEnabled") { view, show -> view.setShowsScale(show) }

      Prop<Boolean>("zoomGesturesEnabled") { view, enabled -> view.setZoomEnabled(enabled) }
      Prop<Boolean>("scrollGesturesEnabled") { view, enabled -> view.setScrollEnabled(enabled) }
      Prop<Boolean>("rotateGesturesEnabled") { view, enabled -> view.setRotateEnabled(enabled) }
      Prop<Boolean>("tiltGesturesEnabled") { view, enabled -> view.setTiltEnabled(enabled) }
      
      Prop<Float>("maxZoom") { view, maxZoom -> view.setMaxZoom(maxZoom) }
      Prop<Float>("minZoom") { view, minZoom -> view.setMinZoom(minZoom) }

      Prop<Boolean>("followUserLocation") { view, follow -> view.setFollowUserLocation(follow) }
      Prop<Boolean>("myLocationEnabled") { view, show -> view.setShowsUserLocation(show) }
      Prop<Map<String, Any>?>("userLocationRepresentation") { view, representation ->
        representation?.let { view.setUserLocationRepresentation(it) }
      }
      Prop<Boolean>("trafficEnabled") { view, show -> view.setShowsTraffic(show) }
      Prop<Boolean>("buildingsEnabled") { view, show -> view.setShowsBuildings(show) }
      Prop<Boolean>("indoorViewEnabled") { view, show -> view.setShowsIndoorMap(show) }

      OnViewDidUpdateProps { view: ExpoGaodeMapView ->
        if (view.mapType != 0) {
          view.setMapType(view.mapType)
        }
        
        view.initialCameraPosition?.let { position ->
          view.setInitialCameraPosition(position)
        }
      }

      AsyncFunction("moveCamera") { view: ExpoGaodeMapView, position: Map<String, Any>, duration: Int ->
        view.moveCamera(position, duration)
      }

      AsyncFunction("getLatLng") { view: ExpoGaodeMapView, point: Map<String, Double> ->
        view.getLatLng(point)
      }

      AsyncFunction("setCenter") { view: ExpoGaodeMapView, center: Map<String, Double>, animated: Boolean ->
        view.setCenter(center, animated)
      }

      AsyncFunction("setZoom") { view: ExpoGaodeMapView, zoom: Double, animated: Boolean ->
        view.setZoomLevel(zoom.toFloat(), animated)
      }

      AsyncFunction("getCameraPosition") { view: ExpoGaodeMapView ->
        view.getCameraPosition()
      }
      
      AsyncFunction("addCircle") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.addCircle(id, props)
      }
      
      AsyncFunction("removeCircle") { view: ExpoGaodeMapView, id: String ->
        view.removeCircle(id)
      }
      
      AsyncFunction("updateCircle") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.updateCircle(id, props)
      }
      
      AsyncFunction("addMarker") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.addMarker(id, props)
      }
      
      AsyncFunction("removeMarker") { view: ExpoGaodeMapView, id: String ->
        view.removeMarker(id)
      }
      
      AsyncFunction("updateMarker") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.updateMarker(id, props)
      }
      
      AsyncFunction("addPolyline") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.addPolyline(id, props)
      }
      
      AsyncFunction("removePolyline") { view: ExpoGaodeMapView, id: String ->
        view.removePolyline(id)
      }
      
      AsyncFunction("updatePolyline") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.updatePolyline(id, props)
      }
      
      AsyncFunction("addPolygon") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.addPolygon(id, props)
      }
      
      AsyncFunction("removePolygon") { view: ExpoGaodeMapView, id: String ->
        view.removePolygon(id)
      }
      
      AsyncFunction("updatePolygon") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.updatePolygon(id, props)
      }
    }
  }
}