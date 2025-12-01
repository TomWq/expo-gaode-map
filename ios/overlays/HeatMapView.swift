import ExpoModulesCore
import MAMapKit

/**
 * 热力图视图
 * 
 * 负责:
 * - 在地图上显示热力图
 * - 管理热力图数据和样式
 * - 支持半径和透明度配置
 */
class HeatMapView: ExpoView {
    /// 热力图数据点数组
    var data: [[String: Any]] = []
    /// 热力图半径
    var radius: Int = 50
    /// 透明度
    var opacity: Double = 0.6
    
    /// 地图视图弱引用
    private var mapView: MAMapView?
    /// 热力图图层
    private var heatmapOverlay: MAHeatMapTileOverlay?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    /**
     * 设置地图实例
     * @param map 地图视图
     */
    func setMap(_ map: MAMapView) {
        self.mapView = map
        createOrUpdateHeatMap()
    }
    
    /**
     * 设置热力图数据
     * @param data 数据点数组，每个点包含 latitude、longitude
     */
    func setData(_ data: [[String: Any]]) {
        self.data = data
        createOrUpdateHeatMap()
    }
    
    /**
     * 设置热力图半径
     * @param radius 半径值(像素)
     */
    func setRadius(_ radius: Int) {
        self.radius = radius
        createOrUpdateHeatMap()
    }
    
    /**
     * 设置透明度
     * @param opacity 透明度值 (0.0-1.0)
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
            heatmapOverlay = nil
        }
        
        // 验证数据有效性
        guard !data.isEmpty else { return }
        
        // 创建热力图数据
        var heatmapData: [MAHeatMapNode] = []
        for point in data {
            guard let latitude = point["latitude"] as? Double,
                  let longitude = point["longitude"] as? Double,
                  latitude >= -90 && latitude <= 90,
                  longitude >= -180 && longitude <= 180 else {
                continue
            }
            
            let node = MAHeatMapNode()
            node.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            // 支持自定义强度，默认为 1.0
            if let intensity = point["intensity"] as? Double {
                node.intensity = Float(max(0, min(1, intensity)))
            } else {
                node.intensity = 1.0
            }
            heatmapData.append(node)
        }
        
        guard !heatmapData.isEmpty else { return }
        
        // 创建热力图图层
        let heatmap = MAHeatMapTileOverlay()
        heatmap.data = heatmapData
        heatmap.radius = max(1, radius) // 确保半径至少为 1
        heatmap.opacity = CGFloat(max(0, min(1, opacity))) // 限制透明度范围
        
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
    
    /**
     * 从父视图移除时清理热力图
     */
    override func removeFromSuperview() {
        super.removeFromSuperview()
        removeHeatMap()
    }
    
    /**
     * 析构时移除热力图
     */
    deinit {
        removeHeatMap()
        mapView = nil
    }
}
