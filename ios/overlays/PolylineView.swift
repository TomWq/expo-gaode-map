import ExpoModulesCore
import MAMapKit

/**
 * 折线覆盖物视图
 * 
 * 负责:
 * - 在地图上绘制折线
 * - 支持纹理贴图
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
    let onPress = EventDispatcher()
    
    /// 地图视图弱引用
    private var mapView: MAMapView?
    /// 折线覆盖物对象
    var polyline: MAPolyline?
    /// 折线渲染器
    private var renderer: MAPolylineRenderer?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    /**
     * 设置地图实例
     * @param map 地图视图
     */
    func setMap(_ map: MAMapView) {
        self.mapView = map
        updatePolyline()
    }
    
    /**
     * 更新折线覆盖物
     */
    private func updatePolyline() {
        guard let mapView = mapView else { return }
        if let old = polyline { mapView.remove(old) }
        
        var coords = points.compactMap { point -> CLLocationCoordinate2D? in
            guard let lat = point["latitude"], let lng = point["longitude"] else { return nil }
            return CLLocationCoordinate2D(latitude: lat, longitude: lng)
        }
        guard !coords.isEmpty else { return }
        
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
            
            // 注意: iOS 高德地图 SDK 不支持简单的虚线设置
            // 需要使用 MAMultiPolyline 实现虚线,暂不支持
            
            if let url = textureUrl {
                print("🔷 PolylineView.getRenderer: 加载纹理 \(url)")
                loadTexture(url: url, renderer: renderer!)
            } else {
                let parsedColor = ColorParser.parseColor(strokeColor)
                renderer?.strokeColor = parsedColor ?? UIColor.clear
                print("🔷 PolylineView.getRenderer: 创建新 renderer, strokeColor=\(String(describing: parsedColor)), lineWidth=\(strokeWidth)")
            }
        } else {
            print("🔷 PolylineView.getRenderer: 使用缓存的 renderer")
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
     * @param image 纹理图片
     * @param renderer 折线渲染器
     */
    private func applyTexture(image: UIImage, to renderer: MAPolylineRenderer) {
        let selector = NSSelectorFromString("loadStrokeTextureImage:")
        if renderer.responds(to: selector) {
            renderer.perform(selector, with: image)
            mapView?.setNeedsDisplay()
        }
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
        print("🔷 PolylineView.setStrokeWidth: \(width)")
        strokeWidth = width
        renderer = nil
        updatePolyline()
    }
    
    /**
     * 设置线条颜色
     * @param color 颜色值
     */
    func setStrokeColor(_ color: Any?) {
        print("🔷 PolylineView.setStrokeColor: \(String(describing: color))")
        strokeColor = color
        renderer = nil
        updatePolyline()
    }
    
    /**
     * 设置纹理图片
     * @param url 图片 URL
     */
    func setTexture(_ url: String?) {
        print("🔷 PolylineView.setTexture: \(String(describing: url))")
        textureUrl = url
        renderer = nil
        updatePolyline()
    }
    
    func setDotted(_ dotted: Bool) {
        isDotted = dotted
        renderer = nil
        updatePolyline()
    }
    
    /**
     * 析构时移除折线
     */
    deinit {
        if let mapView = mapView, let polyline = polyline {
            mapView.remove(polyline)
        }
    }
}
