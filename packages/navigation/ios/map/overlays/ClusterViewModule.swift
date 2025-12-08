import ExpoModulesCore

public class NaviClusterViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NaviClusterView")
        
        View(NaviClusterView.self) {
            Prop("points") { (view: NaviClusterView, points: [[String: Any]]) in
                view.setPoints(points)
            }
            
            Prop("radius") { (view: NaviClusterView, radius: Int) in
                view.setRadius(radius)
            }
            
            Prop("minClusterSize") { (view: NaviClusterView, size: Int) in
                view.setMinClusterSize(size)
            }
        }
    }
}