import ExpoModulesCore
import AMapNaviKit

class NaviClusterView: ExpoView {
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
        
        // 先移除旧的注释
        removeAllAnnotations()
        
        // 验证数据有效性
        guard !points.isEmpty else { return }
        
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
    
    /**
     * 移除所有标注
     */
    private func removeAllAnnotations() {
        guard let mapView = mapView else { return }
        
        for annotation in annotations {
            mapView.removeAnnotation(annotation)
        }
        annotations.removeAll()
    }
    
    /**
     * 从父视图移除时清理标注
     */
    override func removeFromSuperview() {
        super.removeFromSuperview()
        removeAllAnnotations()
    }
    
    /**
     * 析构时移除标注
     */
    deinit {
        removeAllAnnotations()
        mapView = nil
    }
}