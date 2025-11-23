import ExpoModulesCore
import MAMapKit

/**
 * 圆形覆盖物视图
 * 
 * 负责:
 * - 在地图上绘制圆形
 * - 管理圆形的样式(填充色、边框色、边框宽度)
 * - 响应属性变化并更新渲染
 */
class CircleView: ExpoView {
    /// 事件派发器
    let onPress = EventDispatcher()
    
    /// 圆心坐标
    var circleCenter: [String: Double] = [:]
    /// 半径(米)
    var radius: Double = 0
    /// 填充颜色
    var fillColor: Any?
    /// 边框颜色
    var strokeColor: Any?
    /// 边框宽度
    var strokeWidth: Float = 0
    
    /// 地图视图弱引用
    private var mapView: MAMapView?
    /// 圆形覆盖物对象
    var circle: MACircle?
    /// 圆形渲染器
    private var renderer: MACircleRenderer?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    /**
     * 设置地图实例
     * @param map 地图视图
     */
    func setMap(_ map: MAMapView) {
        self.mapView = map
        updateCircle()
    }
    
    /**
     * 更新圆形覆盖物
     */
    private func updateCircle() {
        guard let mapView = mapView,
              let latitude = circleCenter["latitude"],
              let longitude = circleCenter["longitude"],
              radius > 0 else {
            print("❌ CircleView.updateCircle: 条件不满足")
            return
        }
        
        print("🔵 CircleView.updateCircle: center=(\(latitude),\(longitude)), radius=\(radius)")
        print("🔵 CircleView.updateCircle: fillColor=\(String(describing: fillColor)), strokeColor=\(String(describing: strokeColor)), strokeWidth=\(strokeWidth)")
        
        if circle == nil {
            let coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            circle = MACircle(center: coordinate, radius: radius)
            mapView.add(circle!)
            print("🔵 CircleView.updateCircle: 创建新圆形")
        } else {
            circle?.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            circle?.radius = radius
            mapView.remove(circle!)
            mapView.add(circle!)
            print("🔵 CircleView.updateCircle: 更新现有圆形")
        }
        
        renderer = nil
        print("🔵 CircleView.updateCircle: renderer 已清空")
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
            print("🔵 CircleView.getRenderer: 创建新 renderer")
            print("🔵 CircleView.getRenderer: fillColor=\(String(describing: parsedFillColor)), strokeColor=\(String(describing: parsedStrokeColor)), lineWidth=\(strokeWidth)")
        } else {
            print("🔵 CircleView.getRenderer: 使用缓存的 renderer")
        }
        return renderer!
    }
    
    /**
     * 设置中心点
     * @param center 中心点坐标 {latitude, longitude}
     */
    func setCenter(_ center: [String: Double]) {
        circleCenter = center
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
    func setFillColor(_ color: Any?) {
        fillColor = color
        renderer = nil
        updateCircle()
    }
    
    /**
     * 设置边框颜色
     * @param color 颜色值
     */
    func setStrokeColor(_ color: Any?) {
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
     * 析构时移除圆形
     */
    deinit {
        if let mapView = mapView, let circle = circle {
            mapView.remove(circle)
        }
    }
}
