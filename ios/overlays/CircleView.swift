import ExpoModulesCore
import MAMapKit

class CircleView: ExpoView {
    var circleCenter: [String: Double] = [:]
    var radius: Double = 0
    var fillColor: Any?
    var strokeColor: Any?
    var strokeWidth: Float = 0
    
    private var mapView: MAMapView?
    var circle: MACircle?
    private var renderer: MACircleRenderer?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        circle = MACircle()
    }
    
    func setMap(_ map: MAMapView) {
        self.mapView = map
        if let circle = circle {
            map.add(circle)
        }
    }
    
    private func updateCircle() {
        guard let latitude = circleCenter["latitude"],
              let longitude = circleCenter["longitude"] else { return }
        circle?.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        circle?.radius = radius
    }
    
    func getRenderer() -> MAOverlayRenderer {
        if renderer == nil, let circle = circle {
            renderer = MACircleRenderer(circle: circle)
            renderer?.fillColor = ColorParser.parseColor(fillColor) ?? UIColor.clear
            renderer?.strokeColor = ColorParser.parseColor(strokeColor) ?? UIColor.clear
            renderer?.lineWidth = CGFloat(strokeWidth)
        }
        return renderer!
    }
    
    /**
     * 设置中心点
     */
    func setCenter(_ center: [String: Double]) {
        circleCenter = center
        renderer = nil
        updateCircle()
    }
    
    func setRadius(_ radius: Double) {
        self.radius = radius
        renderer = nil
        updateCircle()
    }
    
    func setFillColor(_ color: Any?) {
        fillColor = color
        renderer = nil
        updateCircle()
    }
    
    func setStrokeColor(_ color: Any?) {
        strokeColor = color
        renderer = nil
        updateCircle()
    }
    
    func setStrokeWidth(_ width: Float) {
        strokeWidth = width
        renderer = nil
        updateCircle()
    }
}
