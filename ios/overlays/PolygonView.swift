import ExpoModulesCore
import MAMapKit

class PolygonView: ExpoView {
    var points: [[String: Double]] = []
    var fillColor: Any?
    var strokeColor: Any?
    var strokeWidth: Float = 0
    
    private var mapView: MAMapView?
    var polygon: MAPolygon?
    private var renderer: MAPolygonRenderer?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    func setMap(_ map: MAMapView) {
        self.mapView = map
        updatePolygon()
    }
    
    private func updatePolygon() {
        guard let mapView = mapView else { return }
        if let old = polygon { mapView.remove(old) }
        
        var coords = points.compactMap { point -> CLLocationCoordinate2D? in
            guard let lat = point["latitude"], let lng = point["longitude"] else { return nil }
            return CLLocationCoordinate2D(latitude: lat, longitude: lng)
        }
        guard !coords.isEmpty else { return }
        
        polygon = MAPolygon(coordinates: &coords, count: UInt(coords.count))
        mapView.add(polygon!)
    }
    
    func getRenderer() -> MAOverlayRenderer {
        if renderer == nil, let polygon = polygon {
            renderer = MAPolygonRenderer(polygon: polygon)
            renderer?.fillColor = ColorParser.parseColor(fillColor) ?? UIColor.clear
            renderer?.strokeColor = ColorParser.parseColor(strokeColor) ?? UIColor.clear
            renderer?.lineWidth = CGFloat(strokeWidth)
        }
        return renderer!
    }
    
    func setPoints(_ points: [[String: Double]]) {
        self.points = points
        renderer = nil
        updatePolygon()
    }
    
    func setFillColor(_ color: Any?) {
        fillColor = color
        renderer = nil
        updatePolygon()
    }
    
    func setStrokeColor(_ color: Any?) {
        strokeColor = color
        renderer = nil
        updatePolygon()
    }
    
    func setStrokeWidth(_ width: Float) {
        strokeWidth = width
        renderer = nil
        updatePolygon()
    }
}
