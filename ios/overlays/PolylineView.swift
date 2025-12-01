import ExpoModulesCore
import MAMapKit

/**
 * 折线覆盖物视图
 * 
 * 负责:
 * - 在地图上绘制折线
 * - 支持纹理贴图（仅 3D 地图支持）
 * - 管理折线样式(线宽、颜色)
 */
class PolylineView: ExpoView {
    /// 折线点数组
    var points: [[String: Double]] = []
    /// 线宽
    var strokeWidth: Float = 0
    /// 线条颜色
    var strokeColor: Any?
    /// 是否虚线
    var isDotted: Bool = false
    /// 纹理图片 URL
    var textureUrl: String?
    
    /// 点击事件派发器
    let onPolylinePress = EventDispatcher()
    
    /// 地图视图引用
    private var mapView: MAMapView?
    /// 折线覆盖物对象
    var polyline: MAPolyline?
    /// 折线渲染器
    private var renderer: MAPolylineRenderer?
    /// 上次设置的地图引用（防止重复调用）
    private weak var lastSetMapView: MAMapView?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        
        // 🔑 关键修复：PolylineView 不应该拦截触摸事件
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
        // 🔑 关键优化：如果是同一个地图引用，跳过重复设置
        if lastSetMapView === map {
            return
        }
        
        lastSetMapView = map
        self.mapView = map
        updatePolyline()
    }
    
    /**
     * 更新折线覆盖物
     */
    private func updatePolyline() {
        guard let mapView = mapView else { return }
        if let old = polyline { mapView.remove(old) }
        
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
        
        // 🔑 至少需要2个点才能绘制折线
        guard coords.count >= 2 else { return }
        
        polyline = MAPolyline(coordinates: &coords, count: UInt(coords.count))
        mapView.add(polyline!)
        
        renderer = nil
    }
    
    /**
     * 获取折线渲染器
     * @return 渲染器实例
     */
    func getRenderer() -> MAOverlayRenderer {
        if renderer == nil, let polyline = polyline {
            renderer = MAPolylineRenderer(polyline: polyline)
            renderer?.lineWidth = CGFloat(strokeWidth)
            
            if let url = textureUrl {
                loadTexture(url: url, renderer: renderer!)
            } else {
                let parsedColor = ColorParser.parseColor(strokeColor)
                renderer?.strokeColor = parsedColor ?? UIColor.clear
            }
        }
        return renderer!
    }
    
    /**
     * 加载纹理图片
     * @param url 图片 URL (支持 http/https/file/本地资源)
     * @param renderer 折线渲染器
     */
    private func loadTexture(url: String, renderer: MAPolylineRenderer) {
        if url.hasPrefix("http://") || url.hasPrefix("https://") {
            guard let imageUrl = URL(string: url) else {
                return
            }
            URLSession.shared.dataTask(with: imageUrl) { [weak self] data, _, error in
                if let error = error {
                    return
                }
                guard let data = data, let image = UIImage(data: data) else {
                    return
                }
                DispatchQueue.main.async {
                    self?.applyTexture(image: image, to: renderer)
                }
            }.resume()
        } else if url.hasPrefix("file://") {
            let path = String(url.dropFirst(7))
            if let image = UIImage(contentsOfFile: path) {
                applyTexture(image: image, to: renderer)
            }
        } else {
            if let image = UIImage(named: url) {
                applyTexture(image: image, to: renderer)
            }
        }
    }
    
    /**
     * 应用纹理到折线渲染器
     * 
     * 根据高德地图官方文档：
     * - 仅 3D 地图支持纹理
     * - 纹理须是正方形，宽高是2的整数幂（如64x64）
     * - 若设置了纹理，线颜色、连接类型和端点类型将无效
     * 
     * @param image 纹理图片
     * @param renderer 折线渲染器
     */
    private func applyTexture(image: UIImage, to renderer: MAPolylineRenderer) {
        // 🔑 关键修复：使用 strokeImage 属性设置纹理（与命令式 API 一致）
        renderer.strokeImage = image
        mapView?.setNeedsDisplay()
    }
    
    /**
     * 设置折线点数组
     * @param points 点数组
     */
    func setPoints(_ points: [[String: Double]]) {
        self.points = points
        updatePolyline()
    }
    
    /**
     * 设置线宽
     * @param width 线宽值
     */
    func setStrokeWidth(_ width: Float) {
        strokeWidth = width
        renderer = nil
        forceRerender()
    }
    
    /**
     * 设置线条颜色
     * @param color 颜色值
     */
    func setStrokeColor(_ color: Any?) {
        strokeColor = color
        renderer = nil
        forceRerender()
    }
    
    /**
     * 设置纹理图片
     * @param url 图片 URL
     */
    func setTexture(_ url: String?) {
        textureUrl = url
        renderer = nil
        forceRerender()
    }
    
    /**
     * 强制重新渲染折线
     * 通过移除并重新添加 overlay 来触发地图重新请求 renderer
     */
    private func forceRerender() {
        guard let mapView = mapView, let polyline = polyline else {
            return
        }
        
        // 移除旧的 overlay
        mapView.remove(polyline)
        
        // 重新添加（地图会调用 rendererFor overlay）
        mapView.add(polyline)
    }
    
    func setDotted(_ dotted: Bool) {
        isDotted = dotted
        renderer = nil
        forceRerender()
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
            if let mapView = mapView, let polyline = polyline {
                mapView.remove(polyline)
                self.polyline = nil
            }
        }
    }
    
    /**
     * 析构时移除折线（双重保险）
     */
    deinit {
        if let mapView = mapView, let polyline = polyline {
            mapView.remove(polyline)
        }
        mapView = nil
        polyline = nil
        renderer = nil
    }
}
