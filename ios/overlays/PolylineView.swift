import ExpoModulesCore
import MAMapKit

class PolylineView: ExpoView {
    var points: [[String: Double]] = []
    var strokeWidth: Float = 0
    var strokeColor: Any?
    var textureUrl: String?
    
    private var mapView: MAMapView?
    var polyline: MAPolyline?
    private var renderer: MAPolylineRenderer?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    func setMap(_ map: MAMapView) {
        self.mapView = map
        updatePolyline()
    }
    
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
    }
    
    func getRenderer() -> MAOverlayRenderer {
        if renderer == nil, let polyline = polyline {
            renderer = MAPolylineRenderer(polyline: polyline)
            renderer?.lineWidth = CGFloat(strokeWidth)
            
            if let url = textureUrl {
                print("🎨 PolylineView: 加载纹理 URL: \(url)")
                loadTexture(url: url, renderer: renderer!)
            } else {
                renderer?.strokeColor = ColorParser.parseColor(strokeColor) ?? UIColor.clear
            }
        }
        return renderer!
    }
    
    private func loadTexture(url: String, renderer: MAPolylineRenderer) {
        if url.hasPrefix("http://") || url.hasPrefix("https://") {
            guard let imageUrl = URL(string: url) else {
                print("❌ PolylineView: 无效的 URL: \(url)")
                return
            }
            URLSession.shared.dataTask(with: imageUrl) { [weak self] data, _, error in
                if let error = error {
                    print("❌ PolylineView: 下载图片失败: \(error)")
                    return
                }
                guard let data = data, let image = UIImage(data: data) else {
                    print("❌ PolylineView: 无法创建图片")
                    return
                }
                print("✅ PolylineView: 图片下载成功，大小: \(image.size)")
                DispatchQueue.main.async {
                    self?.applyTexture(image: image, to: renderer)
                }
            }.resume()
        } else if url.hasPrefix("file://") {
            let path = String(url.dropFirst(7))
            if let image = UIImage(contentsOfFile: path) {
                print("✅ PolylineView: 本地图片加载成功")
                applyTexture(image: image, to: renderer)
            } else {
                print("❌ PolylineView: 本地图片加载失败: \(path)")
            }
        } else {
            if let image = UIImage(named: url) {
                print("✅ PolylineView: 资源图片加载成功")
                applyTexture(image: image, to: renderer)
            } else {
                print("❌ PolylineView: 资源图片加载失败: \(url)")
            }
        }
    }
    
    private func applyTexture(image: UIImage, to renderer: MAPolylineRenderer) {
        let selector = NSSelectorFromString("loadStrokeTextureImage:")
        if renderer.responds(to: selector) {
            renderer.perform(selector, with: image)
            print("✅ PolylineView: 纹理已应用")
            mapView?.setNeedsDisplay()
        } else {
            print("❌ PolylineView: renderer 不支持 loadStrokeTextureImage 方法")
        }
    }
    
    func setPoints(_ points: [[String: Double]]) {
        self.points = points
        renderer = nil
        updatePolyline()
    }
    
    func setStrokeWidth(_ width: Float) {
        strokeWidth = width
        renderer = nil
        updatePolyline()
    }
    
    func setStrokeColor(_ color: Any?) {
        strokeColor = color
        renderer = nil
        updatePolyline()
    }
    
    func setTexture(_ url: String?) {
        textureUrl = url
        renderer = nil
        updatePolyline()
    }
}
