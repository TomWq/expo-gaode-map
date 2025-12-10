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
      Events("onMarkerPress", "onMarkerDragStart", "onMarkerDrag", "onMarkerDragEnd")
      
      // 拆分 position 为两个独立属性以兼容 React Native 旧架构
      Prop<Double>("latitude") { view, lat ->
        view.setLatitude(lat)
      }
      
      Prop<Double>("longitude") { view, lng ->
        view.setLongitude(lng)
      }
      
      Prop<String>("title") { view, title ->
        view.setTitle(title)
      }
      
      Prop<String>("snippet") { view, snippet ->
        view.setDescription(snippet)
      }
      
      Prop<Boolean>("draggable") { view, draggable ->
        view.setDraggable(draggable)
      }
      
      Prop<String>("icon") { view, icon ->
        view.setMarkerIcon(icon)
      }
      
      Prop<String>("pinColor") { view, color ->
        view.setPinColor(color)
      }
      
      Prop<Float>("opacity") { view, opacity ->
        view.setOpacity(opacity)
      }
      
      Prop<Boolean>("flat") { view, flat ->
        view.setFlat(flat)
      }
      
      Prop<Float>("zIndex") { view, zIndex ->
        view.setZIndex(zIndex)
      }
      
      Prop<Map<String, Float>>("anchor") { view, anchor ->
        view.setAnchor(anchor)
      }
      
      Prop<Int>("iconWidth") { view, width ->
        view.setIconWidth(width)
      }
      
      Prop<Int>("iconHeight") { view, height ->
        view.setIconHeight(height)
      }
      
      Prop<Int>("customViewWidth") { view, width ->
        view.setCustomViewWidth(width)
      }
      
      Prop<Int>("customViewHeight") { view, height ->
        view.setCustomViewHeight(height)
      }
    }
  }
}