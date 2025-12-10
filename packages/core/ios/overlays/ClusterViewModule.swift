import ExpoModulesCore

public class ClusterViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ClusterView")
        
        View(ClusterView.self) {
            Prop("points") { (view: ClusterView, points: [[String: Any]]) in
                view.setPoints(points)
            }
            
            Prop("radius") { (view: ClusterView, radius: Int) in
                view.setRadius(radius)
            }
            
            Prop("minClusterSize") { (view: ClusterView, size: Int) in
                view.setMinClusterSize(size)
            }
        }
    }
}