import ExpoModulesCore
import AMapNaviKit
import CoreLocation

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
    var points: [Any] = []
    /// 填充颜色
    var fillColor: String?
    /// 边框颜色
    var strokeColor: String?
    /// 边框宽度
    var strokeWidth: Float = 0
    /// 简化容差 (米)
    var simplificationTolerance: Double = 0.0
    
    /// 简化完成事件派发器
    let onPolygonSimplified = EventDispatcher()
    
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
        self.mapView = map
        updatePolygon()
    }
    
    /**
     * 更新多边形覆盖物
     */
    private func updatePolygon() {
        guard let mapView = mapView else { return }
        if let old = polygon { mapView.remove(old) }
        
        // 🔑 使用支持嵌套列表的坐标解析器
        let nestedCoords = LatLngParser.parseLatLngListList(points)
        guard !nestedCoords.isEmpty else { return }
        
        // 第一项是外轮廓
        var outerCoords = nestedCoords[0]
        
        // 🔑 坐标简化 (如果设置了容差)
        if simplificationTolerance > 0 {
            let originalCount = outerCoords.count
            outerCoords = GeometryUtils.simplifyPolyline(outerCoords, tolerance: simplificationTolerance)
            
            // 派发简化事件
            onPolygonSimplified([
                "originalCount": originalCount,
                "simplifiedCount": outerCoords.count
            ])
        }
        
        // 🔑 至少需要3个点才能绘制多边形
        guard outerCoords.count >= 3 else { return }
        
        // 处理内孔 (hollowShapes)
        var hollowShapes: [MAOverlay] = []
        if nestedCoords.count > 1 {
            for i in 1..<nestedCoords.count {
                var ring = nestedCoords[i]
                if ring.count >= 3 {
                    if let hole = MAPolygon(coordinates: &ring, count: UInt(ring.count)) {
                        hollowShapes.append(hole)
                    }
                }
            }
        }
        
        // 创建主多边形
        if let mainPolygon = MAPolygon(coordinates: &outerCoords, count: UInt(outerCoords.count)) {
            // 如果有内孔，设置 hollowShapes 属性
            if !hollowShapes.isEmpty {
                mainPolygon.hollowShapes = hollowShapes
            }
            
            self.polygon = mainPolygon
            mapView.add(mainPolygon)
        }
        
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
    func setPoints(_ points: [Any]) {
        self.points = points
        updatePolygon()
    }
    
    /**
     * 设置填充颜色
     * @param color 颜色值
     */
    func setFillColor(_ color: String?) {
        fillColor = color
        renderer = nil
        updatePolygon()
    }
    
    /**
     * 设置边框颜色
     * @param color 颜色值
     */
    func setStrokeColor(_ color: String?) {
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
     * 设置简化容差
     */
    func setSimplificationTolerance(_ tolerance: Double) {
        simplificationTolerance = tolerance
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
