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
      Events("onMapPress", "onMapLongPress", "onLoad", "onLocation", "onCameraMove", "onCameraIdle")
      
      // ✅ 关键修复：拦截 React Native 的视图操作异常
      
      // 移除 OnViewDestroys 回调，让地图在视图真正释放时才销毁
      // 这样可以避免页面退出动画未完成时地图就变成白屏的问题
      // 地图会在 finalize() 或 GC 时通过 finalize() 方法自动清理


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
      
      Prop<Map<String, Any>?>("customMapStyle") { view, styleData ->
        styleData?.let { view.setCustomMapStyle(it) }
      }

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
    }
  }
}
