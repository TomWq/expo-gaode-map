import ExpoModulesCore
import AMapNaviKit

/**
 * 多边形覆盖物视图
 * 
 * 负责:
 * - 在地图上绘制多边形
 * - 管理多边形样式(填充色、边框色、边框宽度)
 * - 响应属性变化并更新渲染
 */
class NaviPolygonView: ExpoView {
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
    /// 上次设置的地图引用（防止重复调用）
    private weak var lastSetMapView: MAMapView?
    
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
        let isNewMap = self.mapView == nil
        self.mapView = map
        
        // 无论是否是新地图，都调用 updatePolygon
        // 这确保了即使在 setMap 之前设置了 props，覆盖物也能被正确创建
        updatePolygon()
    }
    
    /**
     * 更新多边形覆盖物
     */
    private func updatePolygon() {
        guard let mapView = mapView else { return }
        if let old = polygon { mapView.remove(old) }
        
        // 🔑 坐标验证和过滤
        var coords = points.compactMap { point -> CLLocationCoordinate2D? in
            guard let lat = point["latitude"],
                  let lng = point["longitude"],
                  lat >= -90 && lat <= 90,
                  lng >= -180 && lng <= 180 else {
                return nil
            }
            return CLLocationCoordinate2D(latitude: lat, longitude: lng)
        }
        
        // 🔑 至少需要3个点才能绘制多边形
        guard coords.count >= 3 else { return }
        
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
        fillColor = color
        renderer = nil
        updatePolygon()
    }
    
    /**
     * 设置边框颜色
     * @param color 颜色值
     */
    func setStrokeColor(_ color: Any?) {
        strokeColor = color
        renderer = nil
        updatePolygon()
    }
    
    /**
     * 设置边框宽度
     * @param width 宽度值
     */
    func setStrokeWidth(_ width: Float) {
        strokeWidth = width
        renderer = nil
        updatePolygon()
    }
    
    /**
     * 视图即将从父视图移除时调用
     * 🔑 关键修复：旧架构下，React Native 移除视图时不一定立即调用 deinit
     * 需要在 willMove(toSuperview:) 中立即清理地图覆盖物
     */
    override func willMove(toSuperview newSuperview: UIView?) {
        super.willMove(toSuperview: newSuperview)
        
        // 当 newSuperview 为 nil 时，表示视图正在从父视图移除
        if newSuperview == nil {
            if let mapView = mapView, let polygon = polygon {
                mapView.remove(polygon)
                self.polygon = nil
            }
        }
    }
    
    /**
     * 析构时移除多边形（双重保险）
     */
    deinit {
        if let mapView = mapView, let polygon = polygon {
            mapView.remove(polygon)
        }
        mapView = nil
        polygon = nil
        renderer = nil
    }
}
