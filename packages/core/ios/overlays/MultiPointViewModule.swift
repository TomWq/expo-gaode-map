import ExpoModulesCore

public class MultiPointViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("MultiPointView")
        
        View(MultiPointView.self) {
            Prop("points") { (view: MultiPointView, points: [[String: Any]]) in
                view.setPoints(points)
            }
        }
    }
}