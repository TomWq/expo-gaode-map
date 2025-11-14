import MAMapKit

class OverlayManager {
    private weak var mapView: MAMapView?
    private var overlays: [String: MAOverlay] = [:]
    private var overlayStyles: [String: [String: Any]] = [:]
    private var annotations: [String: MAPointAnnotation] = [:]
    
    init(mapView: MAMapView) {
        self.mapView = mapView
    }
    
    // MARK: - Circle
    
    func addCircle(id: String, props: [String: Any]) {
        guard let mapView = mapView,
              let center = props["center"] as? [String: Double],
              let latitude = center["latitude"],
              let longitude = center["longitude"],
              let radius = props["radius"] as? Double else { return }
        
        let circle = MACircle(center: CLLocationCoordinate2D(latitude: latitude, longitude: longitude), radius: radius)
        overlayStyles[id] = props
        mapView.add(circle!)
        overlays[id] = circle
    }
    
    func removeCircle(id: String) {
        guard let mapView = mapView, let circle = overlays[id] else { return }
        mapView.remove(circle)
        overlays.removeValue(forKey: id)
        overlayStyles.removeValue(forKey: id)
    }
    
    func updateCircle(id: String, props: [String: Any]) {
        removeCircle(id: id)
        addCircle(id: id, props: props)
    }
    
    // MARK: - Marker
    
    func addMarker(id: String, props: [String: Any]) {
        guard let mapView = mapView,
              let position = props["position"] as? [String: Double],
              let latitude = position["latitude"],
              let longitude = position["longitude"] else { return }
        
        let annotation = MAPointAnnotation()
        annotation.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        annotation.title = props["title"] as? String
        annotation.subtitle = props["description"] as? String
        mapView.addAnnotation(annotation)
        annotations[id] = annotation
    }
    
    func removeMarker(id: String) {
        guard let mapView = mapView, let annotation = annotations[id] else { return }
        mapView.removeAnnotation(annotation)
        annotations.removeValue(forKey: id)
    }
    
    func updateMarker(id: String, props: [String: Any]) {
        removeMarker(id: id)
        addMarker(id: id, props: props)
    }
    
    // MARK: - Polyline
    
    func addPolyline(id: String, props: [String: Any]) {
        print("📏 OverlayManager.addPolyline - id: \(id), props: \(props)")
        
        guard let mapView = mapView,
              let points = props["points"] as? [[String: Double]] else {
            print("❌ OverlayManager.addPolyline - mapView 或 points 为空")
            return
        }
        
        var coordinates: [CLLocationCoordinate2D] = []
        for point in points {
            guard let lat = point["latitude"], let lng = point["longitude"] else { continue }
            coordinates.append(CLLocationCoordinate2D(latitude: lat, longitude: lng))
        }
        guard coordinates.count >= 2 else {
            print("❌ OverlayManager.addPolyline - 坐标点数量不足: \(coordinates.count)")
            return
        }
        
        let polyline = MAPolyline(coordinates: &coordinates, count: UInt(coordinates.count))!
        
        // 先保存样式和 overlay，再添加到地图
        overlayStyles[id] = props
        overlays[id] = polyline
        
        print("✅ OverlayManager.addPolyline - 准备添加到地图，id: \(id)")
        mapView.add(polyline)
        print("✅ OverlayManager.addPolyline - 已添加到地图")
    }
    
    func removePolyline(id: String) {
        guard let mapView = mapView, let polyline = overlays[id] else { return }
        mapView.remove(polyline)
        overlays.removeValue(forKey: id)
        overlayStyles.removeValue(forKey: id)
    }
    
    func updatePolyline(id: String, props: [String: Any]) {
        removePolyline(id: id)
        addPolyline(id: id, props: props)
    }
    
    // MARK: - Polygon
    
    func addPolygon(id: String, props: [String: Any]) {
        guard let mapView = mapView,
              let points = props["points"] as? [[String: Double]] else { return }
        var coordinates: [CLLocationCoordinate2D] = []
        for point in points {
            guard let lat = point["latitude"], let lng = point["longitude"] else { continue }
            coordinates.append(CLLocationCoordinate2D(latitude: lat, longitude: lng))
        }
        guard !coordinates.isEmpty else { return }
        let polygon = MAPolygon(coordinates: &coordinates, count: UInt(coordinates.count))
        overlayStyles[id] = props
        mapView.add(polygon!)
        overlays[id] = polygon
    }
    
    func removePolygon(id: String) {
        guard let mapView = mapView, let polygon = overlays[id] else { return }
        mapView.remove(polygon)
        overlays.removeValue(forKey: id)
        overlayStyles.removeValue(forKey: id)
    }
    
    func updatePolygon(id: String, props: [String: Any]) {
        removePolygon(id: id)
        addPolygon(id: id, props: props)
    }
    
    // MARK: - Renderer
    
    func getRenderer(for overlay: MAOverlay) -> MAOverlayRenderer? {
        let id = overlays.first(where: { $0.value === overlay })?.key
        let style = id != nil ? overlayStyles[id!] : nil
        
        print("🎨 OverlayManager.getRenderer - overlay类型: \(type(of: overlay)), id: \(id ?? "nil"), style: \(style ?? [:])")
        
        if let circle = overlay as? MACircle {
            guard let renderer = MACircleRenderer(circle: circle) else {
                return nil
            }
            
            if let fillColor = style?["fillColor"] {
                renderer.fillColor = ColorParser.parseColor(fillColor)
            }
            if let strokeColor = style?["strokeColor"] {
                renderer.strokeColor = ColorParser.parseColor(strokeColor)
            }
            if let strokeWidth = style?["strokeWidth"] as? Double {
                renderer.lineWidth = CGFloat(strokeWidth)
            }
            
            return renderer
        } else if let polyline = overlay as? MAPolyline {
            let renderer = MAPolylineRenderer(polyline: polyline)!
            
            // 设置线宽
            if let width = style?["width"] as? Double {
                renderer.lineWidth = CGFloat(width)
            } else if let strokeWidth = style?["strokeWidth"] as? Double {
                renderer.lineWidth = CGFloat(strokeWidth)
            } else {
                renderer.lineWidth = 8
            }
            
            // 设置线条样式
            renderer.lineJoinType = kMALineJoinRound
            renderer.lineCapType = kMALineCapRound
            
            // 设置纹理或颜色
            if let textureUrl = style?["texture"] as? String, !textureUrl.isEmpty {
                loadPolylineTexture(url: textureUrl, renderer: renderer)
            } else {
                if let color = style?["color"] {
                    print("🎨 color 原始值: \(color), 类型: \(type(of: color))")
                    let parsedColor = ColorParser.parseColor(color)
                    print("🎨 解析后的颜色: \(String(describing: parsedColor))")
                    renderer.strokeColor = parsedColor ?? .red
                } else if let strokeColor = style?["strokeColor"] {
                    print("🎨 strokeColor 原始值: \(strokeColor), 类型: \(type(of: strokeColor))")
                    let parsedColor = ColorParser.parseColor(strokeColor)
                    print("🎨 解析后的颜色: \(String(describing: parsedColor))")
                    renderer.strokeColor = parsedColor ?? .red
                } else {
                    print("⚠️ 没有找到 color 或 strokeColor，使用默认红色")
                    renderer.strokeColor = .red
                }
            }
            
            return renderer
        } else if let polygon = overlay as? MAPolygon {
            guard let renderer = MAPolygonRenderer(polygon: polygon) else {
                return nil
            }
            
            if let fillColor = style?["fillColor"] {
                renderer.fillColor = ColorParser.parseColor(fillColor)
            }
            if let strokeColor = style?["strokeColor"] {
                renderer.strokeColor = ColorParser.parseColor(strokeColor)
            }
            if let strokeWidth = style?["strokeWidth"] as? Double {
                renderer.lineWidth = CGFloat(strokeWidth)
            }
            
            return renderer
        }
        
        return nil
    }
    
    private func loadPolylineTexture(url: String, renderer: MAPolylineRenderer) {
        if url.hasPrefix("http://") || url.hasPrefix("https://") {
            guard let imageUrl = URL(string: url) else {
                print("❌ OverlayManager: 无效的 URL: \(url)")
                return
            }
            URLSession.shared.dataTask(with: imageUrl) { [weak self] data, _, error in
                if let error = error {
                    print("❌ OverlayManager: 下载图片失败: \(error)")
                    return
                }
                guard let data = data, let image = UIImage(data: data) else {
                    print("❌ OverlayManager: 无法创建图片")
                    return
                }
                print("✅ OverlayManager: 图片下载成功，大小: \(image.size)")
                DispatchQueue.main.async {
                    self?.applyPolylineTexture(image: image, to: renderer)
                }
            }.resume()
        } else if url.hasPrefix("file://") {
            let path = String(url.dropFirst(7))
            if let image = UIImage(contentsOfFile: path) {
                print("✅ OverlayManager: 本地图片加载成功")
                applyPolylineTexture(image: image, to: renderer)
            } else {
                print("❌ OverlayManager: 本地图片加载失败: \(path)")
            }
        } else {
            if let image = UIImage(named: url) {
                print("✅ OverlayManager: 资源图片加载成功")
                applyPolylineTexture(image: image, to: renderer)
            } else {
                print("❌ OverlayManager: 资源图片加载失败: \(url)")
            }
        }
    }
    
    private func applyPolylineTexture(image: UIImage, to renderer: MAPolylineRenderer) {
        renderer.strokeImage = image
    }
    
    func clear() {
        guard let mapView = mapView else { return }
        for overlay in overlays.values {
            mapView.remove(overlay)
        }
        for annotation in annotations.values {
            mapView.removeAnnotation(annotation)
        }
        overlays.removeAll()
        overlayStyles.removeAll()
        annotations.removeAll()
    }
}
