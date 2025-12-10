import ExpoModulesCore

public class NaviMarkerViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("NaviMarkerView")
        
        View(NaviMarkerView.self) {
            // 🔑 声明专属事件（避免与其他组件冲突）
            Events("onMarkerPress", "onMarkerDragStart", "onMarkerDrag", "onMarkerDragEnd")
            
            // 拆分 position 为两个独立属性以兼容 React Native 旧架构
            Prop("latitude") { (view: NaviMarkerView, lat: Double) in
                view.setLatitude(lat)
            }
            
            Prop("longitude") { (view: NaviMarkerView, lng: Double) in
                view.setLongitude(lng)
            }
            
            Prop("title") { (view: NaviMarkerView, title: String) in
                view.setTitle(title)
            }
            
            Prop("snippet") { (view: NaviMarkerView, snippet: String) in
                view.setDescription(snippet)
            }
            
            Prop("draggable") { (view: NaviMarkerView, draggable: Bool) in
                view.setDraggable(draggable)
            }
            
            Prop("icon") { (view: NaviMarkerView, source: String?) in
                view.setIconUri(source)
            }
            
            Prop("iconWidth") { (view: NaviMarkerView, width: Double) in
                view.iconWidth = width
            }
            
            Prop("iconHeight") { (view: NaviMarkerView, height: Double) in
                view.iconHeight = height
            }
            
            Prop("customViewWidth") { (view: NaviMarkerView, width: Double) in
                view.customViewWidth = width
            }
            
            Prop("customViewHeight") { (view: NaviMarkerView, height: Double) in
                view.customViewHeight = height
            }
            
            Prop("centerOffset") { (view: NaviMarkerView, offset: [String: Double]) in
                view.setCenterOffset(offset)
            }
            
            Prop("animatesDrop") { (view: NaviMarkerView, animate: Bool) in
                view.setAnimatesDrop(animate)
            }
            
            Prop("pinColor") { (view: NaviMarkerView, color: String) in
                view.setPinColor(color)
            }
            
            Prop("canShowCallout") { (view: NaviMarkerView, show: Bool) in
                view.setCanShowCallout(show)
            }
            
        }
    }
}
