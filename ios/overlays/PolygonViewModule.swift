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
            
            OnViewDidUpdateProps { (view: PolygonView) in
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