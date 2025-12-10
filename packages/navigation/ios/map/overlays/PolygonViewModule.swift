import ExpoModulesCore

public class NaviPolygonViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NaviPolygonView")
        
        View(NaviPolygonView.self) {
            Events("onPolygonPress")
            
            Prop("points") { (view: NaviPolygonView, points: [[String: Double]]) in
                view.setPoints(points)
            }
            
            Prop("fillColor") { (view: NaviPolygonView, color: String) in
                view.setFillColor(color)
            }
            
            Prop("strokeColor") { (view: NaviPolygonView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("strokeWidth") { (view: NaviPolygonView, width: Double) in
                view.setStrokeWidth(Float(width))
            }
            
            OnViewDidUpdateProps { (view: NaviPolygonView) in
                if !view.isMapConnected() {
                    var parent = view.superview
                    while parent != nil {
                        if let mapView = parent as? NaviMapView {
                            view.setMap(mapView.mapView)
                            return
                        }
                        parent = parent?.superview
                    }
                }
            }
        }
    }
}