package expo.modules.gaodemap.map.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Polygon 视图 Module
 */
class PolygonViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NaviPolygonView")

    View(PolygonView::class) {
      Events("onPolygonPress")
      
      Prop<List<Map<String, Double>>>("points") { view: PolygonView, points ->
        view.setPoints(points)
      }
      
      Prop<Any>("fillColor") { view: PolygonView, color ->
        view.setFillColor(color)
      }
      
      Prop<Any>("strokeColor") { view: PolygonView, color ->
        view.setStrokeColor(color)
      }
      
      Prop<Float>("strokeWidth") { view: PolygonView, width ->
        view.setStrokeWidth(width)
      }

      Prop<Float>("zIndex") { view: PolygonView, zIndex ->
        view.setZIndex(zIndex)
      }
    }
  }
}