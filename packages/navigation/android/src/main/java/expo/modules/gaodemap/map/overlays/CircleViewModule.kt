package expo.modules.gaodemap.map.overlays

import expo.modules.gaodemap.map.overlays.CircleView
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Circle 视图 Module
 */
class CircleViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NaviCircleView")

    View(CircleView::class) {
      Events("onCirclePress")
      
      Prop<Map<String, Double>>("center") { view, center ->
        view.setCenter(center)
      }
      
      Prop<Double>("radius") { view, radius ->
        view.setRadius(radius)
      }
      
      Prop<Any>("fillColor") { view, color ->
        view.setFillColor(color)
      }
      
      Prop<Any>("strokeColor") { view, color ->
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