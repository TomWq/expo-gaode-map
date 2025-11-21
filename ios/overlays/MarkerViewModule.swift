import ExpoModulesCore

public class MarkerViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("MarkerView")
        
        View(MarkerView.self) {
            Prop("position") { (view: MarkerView, position: [String: Double]) in
                view.setPosition(position)
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
            
            Prop("icon") { (view: MarkerView, source: [String: Any]?) in
                view.setIcon(source)
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
            
            Prop("canShowCallout") { (view: MarkerView, show: Bool) in
                view.setCanShowCallout(show)
            }
        }
    }
}