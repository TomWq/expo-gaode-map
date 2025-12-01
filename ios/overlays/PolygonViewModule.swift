import ExpoModulesCore

public class PolygonViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PolygonView")
        
        View(PolygonView.self) {
            Events("onPolygonPress")
            
            Prop("points") { (view: PolygonView, points: [[String: Double]]) in
                view.setPoints(points)
            }
            
            Prop("fillColor") { (view: PolygonView, color: String) in
                view.setFillColor(color)
            }
            
            Prop("strokeColor") { (view: PolygonView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("strokeWidth") { (view: PolygonView, width: Double) in
                view.setStrokeWidth(Float(width))
            }
            
        }
    }
}