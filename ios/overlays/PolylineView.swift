import ExpoModulesCore
import MAMapKit

class PolylineView: ExpoView {
    var points: [[String: Double]] = []
    var strokeWidth: Float = 0
    var strokeColor: Any?
    
    private var mapView: MAMapView?
    var polyline: MAPolyline?
    private var renderer: MAPolylineRenderer?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    func setMap(_ map: MAMapView) {
        self.mapView = map
        updatePolyline()
    }
    
    private func updatePolyline() {
        guard let mapView = mapView else { return }
        if let old = polyline { mapView.remove(old) }
        
        var coords = points.compactMap { point -> CLLocationCoordinate2D? in
            guard let lat = point["latitude"], let lng = point["longitude"] else { return nil }
            return CLLocationCoordinate2D(latitude: lat, longitude: lng)
        }
        guard !coords.isEmpty else { return }
        
        polyline = MAPolyline(coordinates: &coords, count: UInt(coords.count))
        mapView.add(polyline!)
    }
    
    func getRenderer() -> MAOverlayRenderer {
        if renderer == nil, let polyline = polyline {
            renderer = MAPolylineRenderer(polyline: polyline)
            renderer?.strokeColor = ColorParser.parseColor(strokeColor) ?? UIColor.clear
            renderer?.lineWidth = CGFloat(strokeWidth)
        }
        return renderer!
    }
    
    func setPoints(_ points: [[String: Double]]) {
        self.points = points
        renderer = nil
        updatePolyline()
    }
    
    func setStrokeWidth(_ width: Float) {
        strokeWidth = width
        renderer = nil
        updatePolyline()
    }
    
    func setStrokeColor(_ color: Any?) {
        strokeColor = color
        renderer = nil
        updatePolyline()
    }
}
