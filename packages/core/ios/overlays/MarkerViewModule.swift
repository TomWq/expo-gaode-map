import ExpoModulesCore

public class MarkerViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("MarkerView")
        
        View(MarkerView.self) {
            // 🔑 声明专属事件（避免与其他组件冲突）
            Events("onMarkerPress", "onMarkerDragStart", "onMarkerDrag", "onMarkerDragEnd")
            
            // 拆分 position 为两个独立属性以兼容 React Native 旧架构
            Prop("latitude") { (view: MarkerView, lat: Double) in
                view.setLatitude(lat)
            }
            
            Prop("longitude") { (view: MarkerView, lng: Double) in
                view.setLongitude(lng)
            }
            
            Prop("title") { (view: MarkerView, title: String) in
                view.setTitle(title)
            }
            
            Prop("snippet") { (view: MarkerView, snippet: String) in
                view.setDescription(snippet)
            }
            
            Prop("draggable") { (view: MarkerView, draggable: Bool) in
                view.setDraggable(draggable)
            }
            
            Prop("icon") { (view: MarkerView, source: String?) in
                view.setIconUri(source)
            }
            
            Prop("iconWidth") { (view: MarkerView, width: Double) in
                view.iconWidth = width
            }
            
            Prop("iconHeight") { (view: MarkerView, height: Double) in
                view.iconHeight = height
            }
            
            Prop("customViewWidth") { (view: MarkerView, width: Double) in
                view.customViewWidth = width
            }
            
            Prop("customViewHeight") { (view: MarkerView, height: Double) in
                view.customViewHeight = height
            }
            
            Prop("centerOffset") { (view: MarkerView, offset: [String: Double]) in
                view.setCenterOffset(offset)
            }
            
            Prop("animatesDrop") { (view: MarkerView, animate: Bool) in
                view.setAnimatesDrop(animate)
            }
            
            Prop("pinColor") { (view: MarkerView, color: String) in
                view.setPinColor(color)
            }
            
            Prop("canShowCallout") { (view: MarkerView, canShow: Bool) in
                view.canShowCallout = canShow
            }

            Prop("growAnimation") { (view: MarkerView, enabled: Bool) in
                view.growAnimation = enabled
            }
             Prop("cacheKey") { (view: MarkerView, key: String) in
                view.setCacheKey(key)
            }
            
            Prop("position") { (view: MarkerView, position: [String: Double]?) in
                view.setPosition(position)
            }
            
            // 平滑移动路径
            Prop("smoothMovePath") { (view: MarkerView, path: [[String: Double]]) in
                view.setSmoothMovePath(path)
            }
            
            // 平滑移动时长（秒）
            Prop("smoothMoveDuration") { (view: MarkerView, duration: Double) in
                view.setSmoothMoveDuration(duration)
            }
        }
    }
}
