package expo.modules.gaodemap.map.overlays

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
      
      // 纬度
      Prop<Double>("latitude") { view, lat ->
        view.setLatitude(lat)
      }
      // 经度
      Prop<Double>("longitude") { view, lng ->
        view.setLongitude(lng)
      }
      // 位置
      Prop<Map<String, Any>?>("position") { view, position ->
        view.setPosition(position)
      }
      // 标题
      Prop<String>("title") { view, title ->
        view.setTitle(title)
      }
      // 副标题
      Prop<String>("snippet") { view, snippet ->
        view.setDescription(snippet)
      }
      // 是否可拖拽
      Prop<Boolean>("draggable") { view, draggable ->
        view.setDraggable(draggable)
      }
      // 图标
      Prop<String>("icon") { view, icon ->
        view.setMarkerIcon(icon)
      }
      // 图标颜色
      Prop<String>("pinColor") { view, color ->
        view.setPinColor(color)
      }
      // 透明度
      Prop<Float>("opacity") { view, opacity ->
        view.setOpacity(opacity)
      }
      // 是否平铺
      Prop<Boolean>("flat") { view, flat ->
        view.setFlat(flat)
      }
      // 层级
      Prop<Float>("zIndex") { view, zIndex ->
        view.setZIndex(zIndex)
      }
      // 锚点
      Prop<Map<String, Float>>("anchor") { view, anchor ->
        view.setAnchor(anchor)
      }
      // 图标宽度
      Prop<Int>("iconWidth") { view, width ->
        view.setIconWidth(width)
      }
      // 图标高度
      Prop<Int>("iconHeight") { view, height ->
        view.setIconHeight(height)
      }
      // 自定义视图宽度
      Prop<Int>("customViewWidth") { view, width ->
        view.setCustomViewWidth(width)
      }
      // 自定义视图高度
      Prop<Int>("customViewHeight") { view, height ->
        view.setCustomViewHeight(height)
      }
        // 缓存key
      Prop<String>("cacheKey") { view, key ->
            view.setCacheKey(key)
      }

      // 平滑移动路径
      Prop<List<Any>?>("smoothMovePath") { view: MarkerView, path ->
        view.setSmoothMovePath(path)
      }

      // 平滑移动时长（秒）
      Prop<Double>("smoothMoveDuration") { view, duration ->
        view.setSmoothMoveDuration(duration)
      }

      // 生长动画
      Prop<Boolean>("growAnimation") { view, enable ->
        view.setGrowAnimation(enable)
      }
    }
  }
}
