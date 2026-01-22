package expo.modules.gaodemap.map.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Polygon 视图 Module
 */
class PolygonViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PolygonView")

    View(PolygonView::class) {
      Events("onPolygonPress", "onPolygonSimplified")
      
      Prop<List<Any>?>("points") { view: PolygonView, points ->
        view.setPoints(points)
      }
      
      Prop<String?>("fillColor") { view: PolygonView, color ->
        view.setFillColor(color)
      }
      
      Prop<String?>("strokeColor") { view: PolygonView, color ->
        view.setStrokeColor(color)
      }
      
      Prop<Float>("strokeWidth") { view: PolygonView, width ->
        view.setStrokeWidth(width)
      }

      Prop<Float>("zIndex") { view: PolygonView, zIndex ->
        view.setZIndex(zIndex)
      }

      Prop<Double>("simplificationTolerance") { view: PolygonView, tolerance ->
        view.setSimplificationTolerance(tolerance)
      }
    }
  }
}