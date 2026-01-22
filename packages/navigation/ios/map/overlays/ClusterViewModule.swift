import ExpoModulesCore

public class ClusterViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ClusterView")
        
        View(ClusterView.self) {
            Events("onClusterPress")

            Prop("points") { (view: ClusterView, points: [[String: Any]]) in
                view.setPoints(points)
            }
            
            Prop("radius") { (view: ClusterView, radius: Int) in
                view.setRadius(radius)
            }
            
            Prop("minClusterSize") { (view: ClusterView, size: Int) in
                view.setMinClusterSize(size)
            }
            
            Prop("clusterStyle") { (view: ClusterView, style: [String: Any]) in
                view.setClusterStyle(style)
            }
            
            Prop("clusterTextStyle") { (view: ClusterView, style: [String: Any]) in
                view.setClusterTextStyle(style)
            }

            Prop("clusterBuckets") { (view: ClusterView, buckets: [[String: Any]]) in
                view.setClusterBuckets(buckets)
            }
        }
    }
}