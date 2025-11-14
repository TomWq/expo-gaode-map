import ExpoModulesCore
import MAMapKit

class ClusterView: ExpoView {
    var points: [[String: Any]] = []
    var radius: Int = 100
    var minClusterSize: Int = 2
    
    private var mapView: MAMapView?
    private var annotations: [MAPointAnnotation] = []
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    func setMap(_ map: MAMapView) {
        self.mapView = map
        updateCluster()
    }
    
    func setPoints(_ points: [[String: Any]]) {
        self.points = points
        updateCluster()
    }
    
    func setRadius(_ radius: Int) {
        self.radius = radius
        updateCluster()
    }
    
    func setMinClusterSize(_ size: Int) {
        self.minClusterSize = size
        updateCluster()
    }
    
    private func updateCluster() {
        guard let mapView = mapView else { return }
        
        for annotation in annotations {
            mapView.removeAnnotation(annotation)
        }
        annotations.removeAll()
        
        for point in points {
            guard let latitude = point["latitude"] as? Double,
                  let longitude = point["longitude"] as? Double else {
                continue
            }
            
            let annotation = MAPointAnnotation()
            annotation.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            mapView.addAnnotation(annotation)
            annotations.append(annotation)
        }
    }
}