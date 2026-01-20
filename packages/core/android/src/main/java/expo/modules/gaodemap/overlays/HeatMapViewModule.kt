package expo.modules.gaodemap.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * HeatMap 视图 Module
 */
class HeatMapViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HeatMapView")

    View(HeatMapView::class) {
      Prop<List<Any>?>("data") { view: HeatMapView, data ->
        view.setData(data)
      }

      Prop<Boolean>("visible") { view: HeatMapView, visible ->
        view.setVisible(visible)
      }
      
      Prop<Int>("radius") { view: HeatMapView, radius ->
        view.setRadius(radius)
      }
      
      Prop<Double>("opacity") { view: HeatMapView, opacity ->
        view.setOpacity(opacity)
      }

      Prop<Map<String, Any>?>("gradient") { _: HeatMapView, _ ->
          // iOS only, ignore on Android
      }

      Prop<Boolean>("allowRetinaAdapting") { _: HeatMapView, _ ->
        // iOS only, ignore on Android
      }
    }
  }
}
