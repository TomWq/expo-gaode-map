package expo.modules.gaodemap.overlays

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Cluster 视图 Module
 */
class ClusterViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ClusterView")

    View(ClusterView::class) {
      Events("onPress", "onClusterPress")
      
      Prop<List<Map<String, Any>>>("points") { view: ClusterView, points ->
        view.setPoints(points)
      }
      
      Prop<Int>("radius") { view: ClusterView, radius ->
        view.setRadius(radius)
      }
      
      Prop<Int>("minClusterSize") { view: ClusterView, size ->
        view.setMinClusterSize(size)
      }
    }
  }
}