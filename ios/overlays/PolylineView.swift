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
    
    /// 地图视图弱引用
    private var mapView: MAMapView?
    /// 折线覆盖物对象
    var polyline: MAPolyline?
    /// 折线渲染器
    private var renderer: MAPolylineRenderer?
    
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
                    print("🔷 PolylineView.loadTexture: ❌ 网络图片加载失败: \(error.localizedDescription)")
                    return
                }
                guard let data = data, let image = UIImage(data: data) else {
                    print("🔷 PolylineView.loadTexture: ❌ 无法解析图片数据")
                    return
                }
                print("🔷 PolylineView.loadTexture: ✅ 网络图片加载成功, size: \(image.size)")
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
        print("🔷 PolylineView.applyTexture: ✅ 开始应用纹理, image size: \(image.size)")
        
        // 检查纹理尺寸是否符合要求（正方形且宽高是 2 的整数幂）
        let width = Int(image.size.width)
        let height = Int(image.size.height)
        let isPowerOfTwo = { (n: Int) -> Bool in
            return n > 0 && (n & (n - 1)) == 0
        }
        
        if width != height {
            print("🔷 PolylineView.applyTexture: ⚠️ 纹理不是正方形 (\(width)x\(height))，可能无效")
        } else if !isPowerOfTwo(width) {
            print("🔷 PolylineView.applyTexture: ⚠️ 纹理尺寸 \(width) 不是 2 的整数幂，可能无效")
        } else {
            print("🔷 PolylineView.applyTexture: ✅ 纹理尺寸符合要求 (\(width)x\(height))")
        }
        
        // 检查地图是否为 3D 模式
        if let mapView = mapView {
            print("🔷 PolylineView.applyTexture: 地图类型: \(mapView.mapType.rawValue), cameraDegree: \(mapView.cameraDegree)")
            if mapView.cameraDegree == 0 {
                print("🔷 PolylineView.applyTexture: ⚠️ 地图当前为 2D 模式（cameraDegree=0），纹理仅在 3D 模式下生效！")
                print("🔷 PolylineView.applyTexture: 💡 提示：需要设置地图为 3D 模式才能显示纹理")
            } else {
                print("🔷 PolylineView.applyTexture: ✅ 地图为 3D 模式（cameraDegree=\(mapView.cameraDegree)）")
            }
        }
        
        // 🔑 关键修复：使用 strokeImage 属性设置纹理（与命令式 API 一致）
        renderer.strokeImage = image
        mapView?.setNeedsDisplay()
        print("🔷 PolylineView.applyTexture: ✅ 已设置 strokeImage 属性")
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
        forceRerender()
    }
    
    /**
     * 设置线条颜色
     * @param color 颜色值
     */
    func setStrokeColor(_ color: Any?) {
        print("🔷 PolylineView.setStrokeColor: \(String(describing: color))")
        strokeColor = color
        renderer = nil
        forceRerender()
    }
    
    /**
     * 设置纹理图片
     * @param url 图片 URL
     */
    func setTexture(_ url: String?) {
        print("🔷 PolylineView.setTexture: \(String(describing: url))")
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
            print("🔷 PolylineView.forceRerender: 折线尚未创建，跳过重新渲染")
            return
        }
        
        // 移除旧的 overlay
        mapView.remove(polyline)
        
        // 重新添加（地图会调用 rendererFor overlay）
        mapView.add(polyline)
        
        print("🔷 PolylineView.forceRerender: ✅ 已强制重新渲染折线")
    }
    
    func setDotted(_ dotted: Bool) {
        isDotted = dotted
        renderer = nil
        forceRerender()
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
