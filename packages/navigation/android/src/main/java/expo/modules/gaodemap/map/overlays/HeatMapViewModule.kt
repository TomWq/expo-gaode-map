package expo.modules.gaodemap.map.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * HeatMap 视图 Module
 */
class HeatMapViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NaviHeatMapView")

    View(HeatMapView::class) {
      Prop<List<Map<String, Any>>>("data") { view: HeatMapView, data ->
        view.setData(data)
      }
      
      Prop<Int>("radius") { view: HeatMapView, radius ->
        view.setRadius(radius)
      }
      
      Prop<Double>("opacity") { view: HeatMapView, opacity ->
        view.setOpacity(opacity)
      }
    }
  }
}