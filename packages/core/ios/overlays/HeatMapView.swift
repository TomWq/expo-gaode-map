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
    /// 渐变配置
    var gradient: [String: Any]?
    /// 是否开启高清适配
    var allowRetinaAdapting: Bool = false

    private var visible: Bool = true
    
    /// 地图视图弱引用
    private var mapView: MAMapView?
    /// 热力图图层
    var heatmapOverlay: MAHeatMapTileOverlay?
    /// 渲染器
    private var renderer: MATileOverlayRenderer?

    private func reloadRenderer() {
        guard let mapView = mapView, let overlay = heatmapOverlay else { return }
        if let existing = mapView.renderer(for: overlay) as? MATileOverlayRenderer {
            existing.reloadData()
            mapView.setNeedsDisplay()
            return
        }
        renderer?.reloadData()
        mapView.setNeedsDisplay()
    }
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        self.backgroundColor = UIColor.clear
    }
    
    /**
     * 设置地图实例
     * @param map 地图视图
     */
    func setMap(_ map: MAMapView) {
        self.mapView = map
        print("HeatMap: setMap")
        createOrUpdateHeatMap()
    }
    
    /**
     * 获取渲染器
     */
    func getRenderer() -> MAOverlayRenderer {
        if let overlay = heatmapOverlay {
            if renderer == nil || renderer?.overlay !== overlay {
                renderer = MATileOverlayRenderer(tileOverlay: overlay)
                renderer?.reloadData()
            }
            return renderer!
        }
        return MAOverlayRenderer()
    }
    
    /**
     * 设置热力图数据
     * @param data 数据点数组，每个点包含 latitude、longitude
     */
    func setData(_ data: [[String: Any]]) {
        self.data = data
        print("HeatMap: setData count=\(data.count)")
        createOrUpdateHeatMap()
    }
    
    /**
     * 设置热力图半径
     * @param radius 半径值(像素)
     */
    func setRadius(_ radius: Int) {
        self.radius = radius
        print("HeatMap: setRadius \(radius)")
        createOrUpdateHeatMap()
    }
    
    /**
     * 设置透明度
     * @param opacity 透明度值 (0.0-1.0)
     */
    func setOpacity(_ opacity: Double) {
        self.opacity = opacity
        print("HeatMap: setOpacity \(opacity)")
        createOrUpdateHeatMap()
    }
    
    /**
     * 设置渐变配置
     */
    func setGradient(_ gradient: [String: Any]?) {
        self.gradient = gradient
        print("HeatMap: setGradient hasValue=\(gradient != nil)")
        createOrUpdateHeatMap()
    }
    
    /**
     * 设置是否开启高清适配
     */
    func setAllowRetinaAdapting(_ allow: Bool) {
        self.allowRetinaAdapting = allow
        print("HeatMap: setAllowRetinaAdapting \(allow)")
        createOrUpdateHeatMap()
    }

    func setVisible(_ visible: Bool) {
        self.visible = visible
        createOrUpdateHeatMap()
    }
    
    /**
     * 创建或更新热力图
     */
    private func createOrUpdateHeatMap() {
        if !Thread.isMainThread {
            DispatchQueue.main.async { [weak self] in
                self?.createOrUpdateHeatMap()
            }
            return
        }

        guard let mapView = mapView else { return }

        if !visible {
            if let overlay = heatmapOverlay {
                overlay.opacity = 0
                reloadRenderer()
            }
            return
        }
        
        // 移除旧的热力图
        if let oldHeatmap = heatmapOverlay {
            mapView.remove(oldHeatmap)
            heatmapOverlay = nil
            renderer = nil
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
            if let count = point["count"] as? Double {
                node.intensity = Float(max(0, count))
            } else if let intensity = point["intensity"] as? Double {
                node.intensity = Float(max(0, min(1, intensity)))
            } else {
                node.intensity = 1.0
            }
            heatmapData.append(node)
        }
        
        guard !heatmapData.isEmpty else {
            print("HeatMap: No valid data points found")
            return
        }
        
        print("HeatMap: Creating overlay with \(heatmapData.count) points")
        
        // 创建热力图图层
        let heatmap = MAHeatMapTileOverlay()
        heatmap.data = heatmapData
        heatmap.radius = min(200, max(10, radius))
        heatmap.opacity = CGFloat(max(0, min(1, opacity))) // 限制透明度范围
        heatmap.allowRetinaAdapting = allowRetinaAdapting
        
        // 配置渐变
        if let gradientConfig = gradient,
           let colorsArray = gradientConfig["colors"] as? [Any],
           let startPointsArray = gradientConfig["startPoints"] as? [NSNumber] {
            
            var colors: [UIColor] = []
            for colorValue in colorsArray {
                if let color = ColorParser.parseColor(colorValue) {
                    colors.append(color)
                }
            }
            
            if !colors.isEmpty && colors.count == startPointsArray.count {
                let gradient = MAHeatMapGradient(color: colors, andWithStartPoints: startPointsArray)
                heatmap.gradient = gradient
            }
        }

        heatmapOverlay = heatmap
        renderer = MATileOverlayRenderer(tileOverlay: heatmap)
        renderer?.reloadData()

        mapView.add(heatmap)
        reloadRenderer()
    }
    
    /**
     * 移除热力图
     */
    func removeHeatMap() {
        if !Thread.isMainThread {
            DispatchQueue.main.async { [weak self] in
                self?.removeHeatMap()
            }
            return
        }
        guard let mapView = mapView, let heatmap = heatmapOverlay else { return }
        mapView.remove(heatmap)
        heatmapOverlay = nil
        renderer = nil
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
