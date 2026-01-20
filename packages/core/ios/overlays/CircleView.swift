import ExpoModulesCore
import MAMapKit
import CoreLocation


/**
 * 圆形覆盖物视图
 * 
 * 负责:
 * - 在地图上绘制圆形
 * - 管理圆形的样式(填充色、边框色、边框宽度)
 * - 响应属性变化并更新渲染
 */
class CircleView: ExpoView {
    /// 事件派发器 - 使用 onCirclePress 避免与 MarkerPress 冲突
    let onCirclePress = EventDispatcher()
    
    /// 圆心坐标
    var circleCenter: [String: Double]?
    /// 半径(米)
    var radius: Double = 0
    /// 填充颜色
    var fillColor: String?
    /// 边框颜色
    var strokeColor: String?
    /// 边框宽度
    var strokeWidth: Float = 0
    /// z-index 图层顺序
    var zIndex: Double = 0
    
    /// 地图视图引用
    private var mapView: MAMapView?
    /// 圆形覆盖物对象
    var circle: MACircle?
    /// 圆形渲染器
    private var renderer: MACircleRenderer?
    /// 上次设置的地图引用（防止重复调用）
    private weak var lastSetMapView: MAMapView?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        
        // 🔑 关键修复：CircleView 不应该拦截触摸事件
        self.isUserInteractionEnabled = false
    }
    
    /**
     * 重写 hitTest，让触摸事件完全穿透此视图
     * 这是解决覆盖物视图阻挡地图触摸的关键
     */
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        // 始终返回 nil，让触摸事件穿透到地图
        return nil
    }
    
    /**
     * 重写 point(inside:with:)，确保此视图不响应任何触摸
     */
    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        // 始终返回 false，表示点击不在此视图内
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
        // 🔑 关键优化：如果是同一个地图引用，跳过重复设置
        if lastSetMapView === map {
            return
        }
        
        lastSetMapView = map
        self.mapView = map
        updateCircle()
    }
    
    /**
     * 更新圆形覆盖物
     */
    private func updateCircle() {
        guard let mapView = mapView else {
            return
        }
        
        guard let center = LatLngParser.parseLatLng(circleCenter),
              radius > 0 else {
            return
        }
        
        if let old = circle {
            mapView.remove(old)
        }
        
        circle = MACircle(center: center, radius: radius)
        mapView.add(circle!)
        
        renderer = nil
    }
    
    /**
     * 获取圆形渲染器
     * @return 渲染器实例
     */
    func getRenderer() -> MAOverlayRenderer {
        if renderer == nil, let circle = circle {
            renderer = MACircleRenderer(circle: circle)
            let parsedFillColor = ColorParser.parseColor(fillColor)
            let parsedStrokeColor = ColorParser.parseColor(strokeColor)
            renderer?.fillColor = parsedFillColor ?? UIColor.clear
            renderer?.strokeColor = parsedStrokeColor ?? UIColor.clear
            renderer?.lineWidth = CGFloat(strokeWidth)
        }
        // 确保即使 renderer 存在，它也与当前的 circle 实例关联
        if renderer?.circle !== circle {
            renderer = MACircleRenderer(circle: circle)
        }
        return renderer!
    }
    
    /**
     * 设置圆心
     */
    func setCenter(_ center: [String: Double]?) {
        self.circleCenter = center
        updateCircle()
    }
    
    /**
     * 设置半径
     * @param radius 半径(米)
     */
    func setRadius(_ radius: Double) {
        self.radius = radius
        updateCircle()
    }
    
    /**
     * 设置填充颜色
     * @param color 颜色值
     */
    func setFillColor(_ color: String?) {
        fillColor = color
        renderer = nil
        updateCircle()
    }
    
    /**
     * 设置边框颜色
     * @param color 颜色值
     */
    func setStrokeColor(_ color: String?) {
        strokeColor = color
        renderer = nil
        updateCircle()
    }
    
    /**
     * 设置边框宽度
     * @param width 宽度值
     */
    func setStrokeWidth(_ width: Float) {
        strokeWidth = width
        renderer = nil
        updateCircle()
    }
    
    /**
     * 设置 z-index
     * @param zIndex z-index 值，数值越大越在上层
     *
     * 注意：iOS 高德地图的 MACircle 不直接支持 zIndex 属性
     * overlay 的渲染顺序由添加顺序决定，后添加的在上层
     * 这里通过重新添加来尝试改变顺序
     */
    func setZIndex(_ zIndex: Double) {
        self.zIndex = zIndex
        renderer = nil
        updateCircle()
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
            if let mapView = mapView, let circle = circle {
                mapView.remove(circle)
                self.circle = nil
            }
        }
    }
    
    /**
     * 析构时移除圆形（双重保险）
     */
    deinit {
        if let mapView = mapView, let circle = circle {
            mapView.remove(circle)
        }
        mapView = nil
        circle = nil
        renderer = nil
    }
}
