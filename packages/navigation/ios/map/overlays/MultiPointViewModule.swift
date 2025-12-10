import ExpoModulesCore

public class NaviMultiPointViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NaviMultiPointView")
        
        View(NaviMultiPointView.self) {
            Prop("points") { (view: NaviMultiPointView, points: [[String: Any]]) in
                view.setPoints(points)
            }
        }
    }
}