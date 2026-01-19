import ExpoModulesCore

public class PolylineViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("PolylineView")
        
        View(PolylineView.self) {
            Events("onPolylinePress")
            
            Prop("points") { (view: PolylineView, points: [[String: Double]]) in
                view.setPoints(points)
            }
            
            Prop("strokeWidth") { (view: PolylineView, width: Double) in
                view.setStrokeWidth(Float(width))
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

            Prop("simplificationTolerance") { (view: PolylineView, tolerance: Double) in
                view.setSimplificationTolerance(tolerance)
            }
            
            OnViewDidUpdateProps { (view: PolylineView) in
                // 属性更新完成后，如果还没连接地图，尝试连接
                if !view.isMapConnected() {
                    // 查找父视图 ExpoGaodeMapView
                    var parent = view.superview
                    while parent != nil {
                        if let mapView = parent as? ExpoGaodeMapView {
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