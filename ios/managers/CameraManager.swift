import ExpoModulesCore
import MAMapKit

class CameraManager {
    private weak var mapView: MAMapView?
    
    init(mapView: MAMapView) {
        self.mapView = mapView
    }
    
    func setMaxZoomLevel(_ maxZoom: CGFloat) {
        mapView?.maxZoomLevel = maxZoom
    }
    
    func setMinZoomLevel(_ minZoom: CGFloat) {
        mapView?.minZoomLevel = minZoom
    }
    
    func setInitialCameraPosition(_ position: [String: Any]) {
        guard let mapView = mapView else { return }
        let status = MAMapStatus()
        
        if let target = position["target"] as? [String: Double],
           let latitude = target["latitude"],
           let longitude = target["longitude"] {
            status.centerCoordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        }
        
        if let zoom = position["zoom"] as? Double {
            status.zoomLevel = CGFloat(zoom)
        }
        
        if let bearing = position["bearing"] as? Double {
            status.rotationDegree = CGFloat(bearing)
        }
        
        if let tilt = position["tilt"] as? Double {
            status.cameraDegree = CGFloat(tilt)
        }
        
        mapView.setMapStatus(status, animated: false, duration: 0)
    }
    
    func moveCamera(position: [String: Any], duration: Int) {
        guard let mapView = mapView else { return }
        let status = MAMapStatus()
        
        if let target = position["target"] as? [String: Double],
           let latitude = target["latitude"],
           let longitude = target["longitude"] {
            status.centerCoordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        } else {
            status.centerCoordinate = mapView.centerCoordinate
        }
        
        if let zoom = position["zoom"] as? Double {
            status.zoomLevel = CGFloat(zoom)
        } else {
            status.zoomLevel = mapView.zoomLevel
        }
        
        if let bearing = position["bearing"] as? Double {
            status.rotationDegree = CGFloat(bearing)
        } else {
            status.rotationDegree = mapView.rotationDegree
        }
        
        if let tilt = position["tilt"] as? Double {
            status.cameraDegree = CGFloat(tilt)
        } else {
            status.cameraDegree = mapView.cameraDegree
        }
        
        mapView.setMapStatus(status, animated: duration > 0, duration: TimeInterval(duration) / 1000.0)
    }
    
    func setCenter(center: [String: Double], animated: Bool) {
        guard let mapView = mapView,
              let latitude = center["latitude"],
              let longitude = center["longitude"] else { return }
        mapView.setCenter(CLLocationCoordinate2D(latitude: latitude, longitude: longitude), animated: animated)
    }
    
    func setZoomLevel(zoom: CGFloat, animated: Bool) {
        mapView?.setZoomLevel(zoom, animated: animated)
    }
    
    func getCameraPosition() -> [String: Any] {
        guard let mapView = mapView else { return [:] }
        let center = mapView.centerCoordinate
        return [
            "target": ["latitude": center.latitude, "longitude": center.longitude],
            "zoom": Double(mapView.zoomLevel),
            "bearing": Double(mapView.rotationDegree),
            "tilt": Double(mapView.cameraDegree)
        ]
    }
    
    func getLatLng(point: [String: Double]) -> [String: Double] {
        guard let mapView = mapView,
              let x = point["x"],
              let y = point["y"] else { return [:] }
        let screenPoint = CGPoint(x: x, y: y)
        let coordinate = mapView.convert(screenPoint, toCoordinateFrom: mapView)
        return ["latitude": coordinate.latitude, "longitude": coordinate.longitude]
    }
}