import ExpoModulesCore
import MAMapKit

/**
 * 多边形覆盖物视图
 * 
 * 负责:
 * - 在地图上绘制多边形
 * - 管理多边形样式(填充色、边框色、边框宽度)
 * - 响应属性变化并更新渲染
 */
class PolygonView: ExpoView {
    let onPolygonPress = EventDispatcher()
    
    /// 多边形点数组
    var points: [[String: Double]] = []
    /// 填充颜色
    var fillColor: Any?
    /// 边框颜色
    var strokeColor: Any?
    /// 边框宽度
    var strokeWidth: Float = 0
    
    /// 地图视图引用
    private var mapView: MAMapView?
    /// 多边形覆盖物对象
    var polygon: MAPolygon?
    /// 多边形渲染器
    private var renderer: MAPolygonRenderer?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        
        // 🔑 关键修复：PolygonView 不应该拦截触摸事件
        self.isUserInteractionEnabled = false
    }
    
    /**
     * 重写 hitTest，让触摸事件完全穿透此视图
     */
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        return nil
    }
    
    /**
     * 重写 point(inside:with:)，确保此视图不响应任何触摸
     */
    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        return false
    }
    
    /**
     * 查找地图视图
     * 新架构下使用全局注册表
     * @return MAMapView 实例或 nil
     */
    func findParentMapView() -> MAMapView? {
        print("🔶 findParentMapView: 从全局注册表获取地图")
        return MapRegistry.shared.getMainMap()
    }
    
    /**
     * 检查地图是否已连接
     */
    func isMapConnected() -> Bool {
        return mapView != nil
    }
    
    /**
     * 设置地图实例
     * @param map 地图视图
     */
    func setMap(_ map: MAMapView) {
        // 避免重复设置
        if self.mapView != nil {
            print("🔶 PolygonView.setMap: 地图已连接，跳过重复设置")
            return
        }
        
        print("🔶 PolygonView.setMap: 首次设置地图，当前 points 数量 = \(points.count)")
        self.mapView = map
        
        // 🔑 新架构修复：注册到全局注册表
        MapRegistry.shared.registerOverlay(self)
        
        // 如果 points 已经设置，立即更新多边形
        if !points.isEmpty {
            print("🔶 PolygonView.setMap: points 已存在，立即更新多边形")
            updatePolygon()
        } else {
            print("🔶 PolygonView.setMap: points 为空，等待 points 设置")
        }
        print("🔶 PolygonView.setMap: 设置完成")
    }
    
    /**
     * 更新多边形覆盖物
     */
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
        
        renderer = nil
    }
    
    /**
     * 获取多边形渲染器
     * @return 渲染器实例
     */
    func getRenderer() -> MAOverlayRenderer {
        if renderer == nil, let polygon = polygon {
            renderer = MAPolygonRenderer(polygon: polygon)
            let parsedFillColor = ColorParser.parseColor(fillColor)
            let parsedStrokeColor = ColorParser.parseColor(strokeColor)
            renderer?.fillColor = parsedFillColor ?? UIColor.clear
            renderer?.strokeColor = parsedStrokeColor ?? UIColor.clear
            renderer?.lineWidth = CGFloat(strokeWidth)
            print("🔶 PolygonView.getRenderer: 创建新 renderer")
            print("🔶 PolygonView.getRenderer: fillColor=\(String(describing: parsedFillColor)), strokeColor=\(String(describing: parsedStrokeColor)), lineWidth=\(strokeWidth)")
        } else {
            print("🔶 PolygonView.getRenderer: 使用缓存的 renderer")
        }
        return renderer!
    }
    
    /**
     * 设置多边形点数组
     * @param points 点数组
     */
    func setPoints(_ points: [[String: Double]]) {
        self.points = points
        updatePolygon()
    }
    
    /**
     * 设置填充颜色
     * @param color 颜色值
     */
    func setFillColor(_ color: Any?) {
        print("🔶 PolygonView.setFillColor: \(String(describing: color))")
        fillColor = color
        renderer = nil
        updatePolygon()
    }
    
    /**
     * 设置边框颜色
     * @param color 颜色值
     */
    func setStrokeColor(_ color: Any?) {
        print("🔶 PolygonView.setStrokeColor: \(String(describing: color))")
        strokeColor = color
        renderer = nil
        updatePolygon()
    }
    
    /**
     * 设置边框宽度
     * @param width 宽度值
     */
    func setStrokeWidth(_ width: Float) {
        print("🔶 PolygonView.setStrokeWidth: \(width)")
        strokeWidth = width
        renderer = nil
        updatePolygon()
    }
    
    /**
     * 析构时移除多边形
     */
    deinit {
        // 🔑 新架构修复：从全局注册表注销
        MapRegistry.shared.unregisterOverlay(self)
        
        if let mapView = mapView, let polygon = polygon {
            mapView.remove(polygon)
        }
    }
}
