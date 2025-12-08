import ExpoModulesCore

public class NaviHeatMapViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NaviHeatMapView")
        
        View(NaviHeatMapView.self) {
            Prop("data") { (view: NaviHeatMapView, data: [[String: Any]]) in
                view.setData(data)
            }
            
            Prop("radius") { (view: NaviHeatMapView, radius: Int) in
                view.setRadius(radius)
            }
            
            Prop("opacity") { (view: NaviHeatMapView, opacity: Double) in
                view.setOpacity(opacity)
            }
        }
    }
}