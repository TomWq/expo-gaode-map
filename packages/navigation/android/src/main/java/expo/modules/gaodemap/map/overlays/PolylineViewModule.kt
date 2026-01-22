package expo.modules.gaodemap.map.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Polyline 视图 Module
 */
class PolylineViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PolylineView")

    View(PolylineView::class) {
      Events("onPolylinePress")
      
      Prop<List<Any>?>("points") { view: PolylineView, points ->
        view.setPoints(points)
      }
      
      Prop<Float>("strokeWidth") { view: PolylineView, width ->
        view.setStrokeWidth(width)
      }
      
      Prop<String?>("strokeColor") { view: PolylineView, color ->
        view.setStrokeColor(color)
      }
      
      Prop<String?>("texture") { view: PolylineView, texture ->
        view.setTexture(texture)
      }
      
      Prop<Boolean>("dotted") { view: PolylineView, dotted ->
        view.setDotted(dotted)
      }
      
      Prop<Boolean>("geodesic") { view: PolylineView, geodesic ->
        view.setGeodesic(geodesic)
      }
      
      Prop<Float>("zIndex") { view: PolylineView, zIndex ->
        view.setZIndex(zIndex)
      }

      Prop<Boolean>("gradient")  { view: PolylineView, gradient ->
          view.setGradient(gradient)
      }

      Prop<Double>("simplificationTolerance") { view: PolylineView, tolerance ->
        view.setSimplificationTolerance(tolerance)
      }
    }
  }
}