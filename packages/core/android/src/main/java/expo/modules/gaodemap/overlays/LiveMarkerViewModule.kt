package expo.modules.gaodemap.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * LiveMarker 视图 Module
 */
class LiveMarkerViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LiveMarkerView")

    View(LiveMarkerView::class) {
      Events("onPress")

      Prop<Map<String, Any>?>("coordinate") { view, position ->
        view.setPosition(position)
      }

      Prop<Map<String, Any>?>("anchor") { view, anchor ->
        view.setAnchor(anchor)
      }

      Prop<Map<String, Any>?>("offset") { view, offset ->
        view.setOffset(offset)
      }

      Prop<Int>("contentWidth") { view, width ->
        view.setContentWidth(width)
      }

      Prop<Int>("contentHeight") { view, height ->
        view.setContentHeight(height)
      }

      Prop<Boolean>("visible") { view, visible ->
        view.setVisible(visible)
      }

      Prop<Boolean>("tracksCamera") { view, enabled ->
        view.setTracksCamera(enabled)
      }

      Prop<Float>("zIndex") { view, zIndex ->
        view.setZIndexValue(zIndex)
      }
    }
  }
}
