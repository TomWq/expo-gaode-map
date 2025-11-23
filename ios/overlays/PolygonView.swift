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
    let onPress = EventDispatcher()
    
    /// 多边形点数组
    var points: [[String: Double]] = []
    /// 填充颜色
    var fillColor: Any?
    /// 边框颜色
    var strokeColor: Any?
    /// 边框宽度
    var strokeWidth: Float = 0
    
    /// 地图视图弱引用
    private var mapView: MAMapView?
    /// 多边形覆盖物对象
    var polygon: MAPolygon?
    /// 多边形渲染器
    private var renderer: MAPolygonRenderer?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
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
        if let mapView = mapView, let polygon = polygon {
            mapView.remove(polygon)
        }
    }
}
