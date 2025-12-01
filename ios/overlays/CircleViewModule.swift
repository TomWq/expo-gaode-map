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

            Prop("zIndex") { (view: CircleView, zIndex: Double) in
                view.setZIndex(zIndex)
            }
            
            OnViewDidUpdateProps { (view: CircleView) in
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