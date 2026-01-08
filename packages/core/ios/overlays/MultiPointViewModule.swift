import ExpoModulesCore

public class MultiPointViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("MultiPointView")
        
        View(MultiPointView.self) {
            Events("onMultiPointPress")

            Prop("points") { (view: MultiPointView, points: [[String: Any]]) in
                view.setPoints(points)
            }
            
            Prop("icon") { (view: MultiPointView, icon: String?) in
                view.setIcon(icon)
            }

            Prop("iconWidth") { (view: MultiPointView, width: Double?) in
                view.setIconWidth(width)
            }

            Prop("iconHeight") { (view: MultiPointView, height: Double?) in
                view.setIconHeight(height)
            }
            
            Prop("anchor") { (view: MultiPointView, anchor: [String: Double]?) in
                if let anchor = anchor {
                    let x = anchor["x"] ?? 0.5
                    let y = anchor["y"] ?? 0.5
                    view.setAnchor(x: x, y: y)
                }
            }
        }
    }
}