import ExpoModulesCore
import MAMapKit

class MultiPointView: ExpoView {
    var points: [[String: Any]] = []
    
    private var mapView: MAMapView?
    private var multiPointOverlay: MAMultiPointOverlay?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    func setMap(_ map: MAMapView) {
        self.mapView = map
        updateMultiPoint()
    }
    
    func setPoints(_ points: [[String: Any]]) {
        self.points = points
        updateMultiPoint()
    }
    
    private func updateMultiPoint() {
        guard let mapView = mapView else { return }
        
        if let oldOverlay = multiPointOverlay {
            mapView.remove(oldOverlay)
        }
        
        var items: [MAMultiPointItem] = []
        for point in points {
            guard let latitude = point["latitude"] as? Double,
                  let longitude = point["longitude"] as? Double else {
                continue
            }
            
            let item = MAMultiPointItem()
            item.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            items.append(item)
        }
        
        guard !items.isEmpty else { return }
        
        let overlay = MAMultiPointOverlay(multiPointItems: items)
        
        mapView.add(overlay)
        multiPointOverlay = overlay
    }
}