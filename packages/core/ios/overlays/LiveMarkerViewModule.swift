import ExpoModulesCore

public class LiveMarkerViewModule: Module {
    public func definition() -> ModuleDefinition {
        Name("LiveMarkerView")

        View(LiveMarkerView.self) {
            Events("onPress")

            Prop("coordinate") { (view: LiveMarkerView, position: [String: Any]?) in
                view.setPosition(position)
            }

            Prop("anchor") { (view: LiveMarkerView, anchor: [String: Any]?) in
                view.setAnchor(anchor)
            }

            Prop("offset") { (view: LiveMarkerView, offset: [String: Any]?) in
                view.setOffset(offset)
            }

            Prop("contentWidth") { (view: LiveMarkerView, width: Int) in
                view.setContentWidth(width)
            }

            Prop("contentHeight") { (view: LiveMarkerView, height: Int) in
                view.setContentHeight(height)
            }

            Prop("visible") { (view: LiveMarkerView, visible: Bool) in
                view.setVisible(visible)
            }

            Prop("tracksCamera") { (view: LiveMarkerView, enabled: Bool) in
                view.setTracksCamera(enabled)
            }

            Prop("zIndex") { (view: LiveMarkerView, zIndex: Double) in
                view.setZIndex(zIndex)
            }
        }
    }
}
