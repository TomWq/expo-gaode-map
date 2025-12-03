import ExpoModulesCore

public class HeatMapViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("HeatMapView")
        
        View(HeatMapView.self) {
            Prop("data") { (view: HeatMapView, data: [[String: Any]]) in
                view.setData(data)
            }
            
            Prop("radius") { (view: HeatMapView, radius: Int) in
                view.setRadius(radius)
            }
            
            Prop("opacity") { (view: HeatMapView, opacity: Double) in
                view.setOpacity(opacity)
            }
        }
    }
}