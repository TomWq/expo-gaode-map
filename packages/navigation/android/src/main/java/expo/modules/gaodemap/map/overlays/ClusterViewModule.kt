package expo.modules.gaodemap.map.overlays

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
      
      Prop<Map<String, Any>>("clusterStyle") { view: ClusterView, style ->
        view.setClusterStyle(style)
      }

      Prop<List<Map<String, Any>>>("clusterBuckets") { view: ClusterView, buckets ->
        view.setClusterBuckets(buckets)
      }
      
      Prop<Map<String, Any>>("clusterTextStyle") { view: ClusterView, style ->
        view.setClusterTextStyle(style)
      }

      Prop<String>("icon") { view: ClusterView, icon ->
        view.setIcon(icon)
      }
    }
  }
}