import ExpoModulesCore

public class NaviPolylineViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NaviPolylineView")
        
        View(NaviPolylineView.self) {
            Events("onPolylinePress")
            
            Prop("points") { (view: NaviPolylineView, points: [[String: Double]]) in
                view.setPoints(points)
            }
            
            Prop("strokeWidth") { (view: NaviPolylineView, width: Double) in
                view.setStrokeWidth(Float(width))
            }
            
            Prop("strokeColor") { (view: NaviPolylineView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("texture") { (view: NaviPolylineView, url: String?) in
                view.setTexture(url)
            }
            
            Prop("dotted") { (view: NaviPolylineView, dotted: Bool) in
                view.setDotted(dotted)
            }
            
            OnViewDidUpdateProps { (view: NaviPolylineView) in
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