import ExpoModulesCore
import MAMapKit
import UIKit

class MultiPointView: ExpoView {
    let onMultiPointPress = EventDispatcher()
    
    var points: [[String: Any]] = []
    var iconUri: String?
    var iconWidth: Double?
    var iconHeight: Double?
    var anchorX: Double = 0.5
    var anchorY: Double = 0.5
    
    private var mapView: MAMapView?
    private var multiPointOverlay: MAMultiPointOverlay?
    private var renderer: MAMultiPointOverlayRenderer?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    func setMap(_ map: MAMapView) {
        self.mapView = map
        updateMultiPoint()
    }
    
    func setPoints(_ points: [[String: Any]]) {
        self.points = points
        updateMultiPoint()
    }
    
    func setIcon(_ iconUri: String?) {
        self.iconUri = iconUri
        updateIcon()
    }
    
    func setIconWidth(_ width: Double?) {
        self.iconWidth = width
        updateIcon()
    }
    
    func setIconHeight(_ height: Double?) {
        self.iconHeight = height
        updateIcon()
    }
    
    func setAnchor(x: Double, y: Double) {
        self.anchorX = x
        self.anchorY = y
        renderer?.anchor = CGPoint(x: x, y: y)
    }
    
    private func updateMultiPoint() {
        guard let mapView = mapView else { return }
        
        // 移除旧的覆盖物
        if let oldOverlay = multiPointOverlay {
            mapView.remove(oldOverlay)
            multiPointOverlay = nil
            renderer = nil
        }
        
        // 验证数据有效性
        guard !points.isEmpty else { return }
        
        var items: [MAMultiPointItem] = []
        for (_, point) in points.enumerated() {
            guard let latitude = point["latitude"] as? Double,
                  let longitude = point["longitude"] as? Double else {
                continue
            }
            
            let item = MAMultiPointItem()
            item.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
            // 存储 index 和 customerId 到 item 中，这里利用 customID 或者 title 属性
            // MAMultiPointItem 有 customID 属性
            if let customerId = point["customerId"] as? String {
                item.customID = customerId
            } else if let id = point["id"] as? String {
                item.customID = id
            }
            
            // 也可以存 title，这里为了方便查找 index，我们可以把 index 存到 title 或者 subtitle
            // 但最好是通过 customID 查找
            
            items.append(item)
        }
        
        guard !items.isEmpty else { return }
        
        let overlay = MAMultiPointOverlay(multiPointItems: items)
        self.multiPointOverlay = overlay
        mapView.add(overlay)
    }
    
    func getRenderer() -> MAMultiPointOverlayRenderer? {
        guard let overlay = multiPointOverlay else { return nil }
        
        if renderer == nil {
            renderer = MAMultiPointOverlayRenderer(multiPointOverlay: overlay)
            renderer?.anchor = CGPoint(x: anchorX, y: anchorY)
            updateIcon()
        }
        return renderer
    }
    
    private func updateIcon() {
        guard let iconUri = iconUri else { return }
        
        // 构建缓存 key
        let w = Int(iconWidth ?? 0)
        let h = Int(iconHeight ?? 0)
        let key = "multipoint|\(iconUri)|\(w)x\(h)"
        
        // 1. 尝试从缓存获取
        if let cached = IconBitmapCache.shared.image(forKey: key) {
            self.renderer?.icon = cached
            refreshOverlay()
            return
        }
        
        loadIcon(iconUri: iconUri) { [weak self] image in
            guard let self = self, let image = image else { return }
            
            var finalImage = image
            if let w = self.iconWidth, let h = self.iconHeight {
                finalImage = self.resizeImage(image: image, targetSize: CGSize(width: w, height: h))
            } else if let w = self.iconWidth {
                let h = image.size.height * (w / image.size.width)
                finalImage = self.resizeImage(image: image, targetSize: CGSize(width: w, height: h))
            } else if let h = self.iconHeight {
                let w = image.size.width * (h / image.size.height)
                finalImage = self.resizeImage(image: image, targetSize: CGSize(width: w, height: h))
            }
            
            // 写入缓存
            IconBitmapCache.shared.setImage(finalImage, forKey: key)
            
            self.renderer?.icon = finalImage
            self.refreshOverlay()
        }
    }
    
    private func refreshOverlay() {
        self.renderer?.setNeedsUpdate()
        // 强制刷新：通过重新添加 overlay 触发更新
        if let mapView = self.mapView, let overlay = self.multiPointOverlay {
            mapView.remove(overlay)
            mapView.add(overlay)
        }
    }
    
    private func resizeImage(image: UIImage, targetSize: CGSize) -> UIImage {
        UIGraphicsBeginImageContextWithOptions(targetSize, false, 0.0)
        image.draw(in: CGRect(origin: .zero, size: targetSize))
        let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return resizedImage ?? image
    }
    
    private func loadIcon(iconUri: String, completion: @escaping (UIImage?) -> Void) {
        if iconUri.hasPrefix("http://") || iconUri.hasPrefix("https://") {
            guard let url = URL(string: iconUri) else {
                completion(nil)
                return
            }
            URLSession.shared.dataTask(with: url) { data, _, _ in
                guard let data = data, let image = UIImage(data: data) else {
                    DispatchQueue.main.async { completion(nil) }
                    return
                }
                DispatchQueue.main.async { completion(image) }
            }.resume()
        } else if iconUri.hasPrefix("file://") {
            let path = String(iconUri.dropFirst(7))
            completion(UIImage(contentsOfFile: path))
        } else {
            completion(UIImage(named: iconUri))
        }
    }
    
    func handleMultiPointClick(item: MAMultiPointItem) {
        // 查找对应的 point 数据
        var index = -1
        var pointData: [String: Any]?
        
        // 优先通过 customID 查找
        if let customID = item.customID {
            index = points.firstIndex { ($0["customerId"] as? String) == customID || ($0["id"] as? String) == customID } ?? -1
        }
        
        // 如果没找到，尝试通过坐标查找（不够精确，但作为备选）
        if index == -1 {
            index = points.firstIndex { point in
                guard let lat = point["latitude"] as? Double,
                      let lng = point["longitude"] as? Double else { return false }
                return abs(lat - item.coordinate.latitude) < 0.000001 && abs(lng - item.coordinate.longitude) < 0.000001
            } ?? -1
        }
        
        if index != -1 {
            pointData = points[index]
            onMultiPointPress([
                "index": index,
                "customerId": pointData?["customerId"] ?? pointData?["id"] ?? "",
                "latitude": item.coordinate.latitude,
                "longitude": item.coordinate.longitude
            ])
        }
    }

    /**
     * 移除多点覆盖物
     */
    private func removeMultiPoint() {
        guard let mapView = mapView, let overlay = multiPointOverlay else { return }
        mapView.remove(overlay)
        multiPointOverlay = nil
    }
    
    /**
     * 从父视图移除时清理覆盖物
     */
    override func removeFromSuperview() {
        super.removeFromSuperview()
        removeMultiPoint()
    }
    
    /**
     * 析构时移除覆盖物
     */
    deinit {
        removeMultiPoint()
        mapView = nil
    }
}
