package expo.modules.gaodemap.map.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Circle 视图 Module
 */
class CircleViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CircleView")

    View(CircleView::class) {
      Events("onCirclePress")
      
      Prop<Map<String, Any>?>("center") { view: CircleView, center ->
        view.setCenter(center)
      }
      
      Prop<Double>("radius") { view: CircleView, radius ->
        view.setRadius(radius)
      }
      
      Prop<String?>("fillColor") { view: CircleView, color ->
        view.setFillColor(color)
      }
      
      Prop<String?>("strokeColor") { view: CircleView, color ->
        view.setStrokeColor(color)
      }
      
      Prop<Float>("strokeWidth") { view, width ->
        view.setStrokeWidth(width)
      }

      Prop<Float>("zIndex") { view, zIndex ->
        view.setZIndex(zIndex)
      }
    }
  }
}