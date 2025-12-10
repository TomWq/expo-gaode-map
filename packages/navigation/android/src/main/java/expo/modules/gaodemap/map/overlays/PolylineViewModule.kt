package expo.modules.gaodemap.map.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Polyline 视图 Module
 */
class PolylineViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NaviPolylineView")

    View(PolylineView::class) {
      Events("onPolylinePress")
      
      Prop<List<Map<String, Double>>>("points") { view: PolylineView, points ->
        view.setPoints(points)
      }
      
      Prop<Float>("strokeWidth") { view: PolylineView, width ->
        view.setStrokeWidth(width)
      }
      
      Prop<Any>("strokeColor") { view: PolylineView, color ->
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
    }
  }
}