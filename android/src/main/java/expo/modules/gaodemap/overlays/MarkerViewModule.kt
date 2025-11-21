package expo.modules.gaodemap.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Marker 视图 Module
 */
class MarkerViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MarkerView")

    View(MarkerView::class) {
      Events("onPress", "onDragStart", "onDrag", "onDragEnd")
      
      Prop<Map<String, Double>>("position") { view: MarkerView, position ->
        view.setPosition(position)
      }
      
      Prop<String>("title") { view: MarkerView, title ->
        view.setTitle(title)
      }
      
      Prop<String>("description") { view: MarkerView, description ->
        view.setDescription(description)
      }
      
      Prop<Boolean>("draggable") { view: MarkerView, draggable ->
        view.setDraggable(draggable)
      }
      
      Prop<Float>("opacity") { view: MarkerView, opacity ->
        view.setOpacity(opacity)
      }
      
      Prop<Boolean>("flat") { view: MarkerView, flat ->
        view.setFlat(flat)
      }
      
      Prop<Float>("zIndex") { view: MarkerView, zIndex ->
        view.setZIndex(zIndex)
      }
      
      Prop<Map<String, Float>>("anchor") { view: MarkerView, anchor ->
        view.setAnchor(anchor)
      }
      
      Prop<Int>("iconWidth") { view: MarkerView, width ->
        view.setIconWidth(width)
      }
      
      Prop<Int>("iconHeight") { view: MarkerView, height ->
        view.setIconHeight(height)
      }
      
      Prop<Int>("customViewWidth") { view: MarkerView, width ->
        view.setCustomViewWidth(width)
      }
      
      Prop<Int>("customViewHeight") { view: MarkerView, height ->
        view.setCustomViewHeight(height)
      }
    }
  }
}