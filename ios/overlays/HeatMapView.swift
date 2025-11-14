import ExpoModulesCore
import MAMapKit

class HeatMapView: ExpoView {
    var data: [[String: Any]] = []
    var radius: Int = 50
    var opacity: Double = 0.6
    
    private var mapView: MAMapView?
    private var heatmapOverlay: MAHeatMapTileOverlay?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    /**
     * 设置地图实例
     */
    func setMap(_ map: MAMapView) {
        self.mapView = map
        createOrUpdateHeatMap()
    }
    
    /**
     * 设置热力图数据
     */
    func setData(_ data: [[String: Any]]) {
        self.data = data
        createOrUpdateHeatMap()
    }
    
    /**
     * 设置热力图半径
     */
    func setRadius(_ radius: Int) {
        self.radius = radius
        createOrUpdateHeatMap()
    }
    
    /**
     * 设置透明度
     */
    func setOpacity(_ opacity: Double) {
        self.opacity = opacity
        createOrUpdateHeatMap()
    }
    
    /**
     * 创建或更新热力图
     */
    private func createOrUpdateHeatMap() {
        guard let mapView = mapView else { return }
        
        // 移除旧的热力图
        if let oldHeatmap = heatmapOverlay {
            mapView.remove(oldHeatmap)
        }
        
        // 创建热力图数据
        var heatmapData: [MAHeatMapNode] = []
        for point in data {
            guard let latitude = point["latitude"] as? Double,
                  let longitude = point["longitude"] as? Double else {
                continue
            }
            
            let node = MAHeatMapNode()
            node.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            node.intensity = 1.0 // 默认强度
            heatmapData.append(node)
        }
        
        guard !heatmapData.isEmpty else { return }
        
        // 创建热力图图层
        let heatmap = MAHeatMapTileOverlay()
        heatmap.data = heatmapData
        heatmap.radius = radius
        heatmap.opacity = CGFloat(opacity)
        
        mapView.add(heatmap)
        heatmapOverlay = heatmap
    }
    
    /**
     * 移除热力图
     */
    func removeHeatMap() {
        guard let mapView = mapView, let heatmap = heatmapOverlay else { return }
        mapView.remove(heatmap)
        heatmapOverlay = nil
    }
    
    override func removeFromSuperview() {
        super.removeFromSuperview()
        removeHeatMap()
    }
}
