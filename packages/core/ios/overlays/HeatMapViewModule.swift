import ExpoModulesCore

public class HeatMapViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("HeatMapView")
        
        View(HeatMapView.self) {
            Prop("data") { (view: HeatMapView, data: [[String: Any]]) in
                view.setData(data)
            }

            Prop("visible") { (view: HeatMapView, visible: Bool) in
                view.setVisible(visible)
            }
            
            Prop("radius") { (view: HeatMapView, radius: Int) in
                view.setRadius(radius)
            }
            
            Prop("opacity") { (view: HeatMapView, opacity: Double) in
                view.setOpacity(opacity)
            }
            
            Prop("gradient") { (view: HeatMapView, gradient: [String: Any]?) in
                view.setGradient(gradient)
            }
            
            Prop("allowRetinaAdapting") { (view: HeatMapView, allow: Bool) in
                view.setAllowRetinaAdapting(allow)
            }
        }
    }
}
