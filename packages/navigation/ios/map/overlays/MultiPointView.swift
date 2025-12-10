import ExpoModulesCore
import AMapNaviKit

class NaviMultiPointView: ExpoView {
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
        
        // 移除旧的覆盖物
        if let oldOverlay = multiPointOverlay {
            mapView.remove(oldOverlay)
            multiPointOverlay = nil
        }
        
        // 验证数据有效性
        guard !points.isEmpty else { return }
        
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
    
    /**
     * 移除多点覆盖物
     */
    private func removeMultiPoint() {
        guard let mapView = mapView, let overlay = multiPointOverlay else { return }
        mapView.remove(overlay)
        multiPointOverlay = nil
    }
    
    /**
     * 从父视图移除时清理覆盖物
     */
    override func removeFromSuperview() {
        super.removeFromSuperview()
        removeMultiPoint()
    }
    
    /**
     * 析构时移除覆盖物
     */
    deinit {
        removeMultiPoint()
        mapView = nil
    }
}