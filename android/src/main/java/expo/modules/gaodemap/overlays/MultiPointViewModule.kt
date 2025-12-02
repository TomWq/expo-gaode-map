package expo.modules.gaodemap.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * MultiPoint 视图 Module
 */
class MultiPointViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MultiPointView")

    View(MultiPointView::class) {
      Events("onPress")
      
      Prop<List<Map<String, Any>>>("points") { view: MultiPointView, points ->
        view.setPoints(points)
      }

        Prop<String>("icon") { view: MultiPointView, icon ->
        view.setIcon(icon)
      }

        Prop<Map<String, Float>>("anchor"){ view: MultiPointView, anchor ->
            view.setAnchor(anchor)
        }
    }
  }
}