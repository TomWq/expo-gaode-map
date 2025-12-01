import ExpoModulesCore

public class CircleViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("CircleView")
        
        View(CircleView.self) {
            Events("onCirclePress")
            
            Prop("center") { (view: CircleView, center: [String: Double]) in
                view.setCenter(center)
            }
            
            Prop("radius") { (view: CircleView, radius: Double) in
                view.setRadius(radius)
            }
            
            Prop("fillColor") { (view: CircleView, color: String) in
                view.setFillColor(color)
            }
            
            Prop("strokeColor") { (view: CircleView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("strokeWidth") { (view: CircleView, width: Double) in
                view.setStrokeWidth(Float(width))
            }
            
        }
    }
}