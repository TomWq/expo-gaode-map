import ExpoModulesCore

public class NaviCircleViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NaviCircleView")
        
        View(NaviCircleView.self) {
            Events("onCirclePress")
            
            Prop("center") { (view: NaviCircleView, center: [String: Double]) in
                view.setCenter(center)
            }
            
            Prop("radius") { (view: NaviCircleView, radius: Double) in
                view.setRadius(radius)
            }
            
            Prop("fillColor") { (view: NaviCircleView, color: String) in
                view.setFillColor(color)
            }
            
            Prop("strokeColor") { (view: NaviCircleView, color: String) in
                view.setStrokeColor(color)
            }
            
            Prop("strokeWidth") { (view: NaviCircleView, width: Double) in
                view.setStrokeWidth(Float(width))
            }

            Prop("zIndex") { (view: NaviCircleView, zIndex: Double) in
                view.setZIndex(zIndex)
            }
            
            OnViewDidUpdateProps { (view: NaviCircleView) in
                // 属性更新完成后，如果还没连接地图，尝试连接
                if !view.isMapConnected() {
                    // 查找父视图 NaviMapView
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