import ExpoModulesCore

public class PolylineViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PolylineView")
        
        View(PolylineView.self) {
            Prop("points") { (view: PolylineView, points: [[String: Double]]) in
                view.setPoints(points)
            }
            
            Prop("width") { (view: PolylineView, width: Double) in
                view.setStrokeWidth(Float(width))
            }
            
            Prop("strokeWidth") { (view: PolylineView, width: Double) in
                view.setStrokeWidth(Float(width))
            }
            
            Prop("color") { (view: PolylineView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("strokeColor") { (view: PolylineView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("texture") { (view: PolylineView, url: String?) in
                view.setTexture(url)
            }
            
            Prop("dotted") { (view: PolylineView, dotted: Bool) in
                view.setDotted(dotted)
            }
        }
    }
}