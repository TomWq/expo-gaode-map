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
        guard let mapView = mapView,
              let points = props["points"] as? [[String: Double]] else { return }
        var coordinates: [CLLocationCoordinate2D] = []
        for point in points {
            guard let lat = point["latitude"], let lng = point["longitude"] else { continue }
            coordinates.append(CLLocationCoordinate2D(latitude: lat, longitude: lng))
        }
        guard !coordinates.isEmpty else { return }
        
        let polyline = MAMultiPolyline()
        polyline.setPolylineWithCoordinates(&coordinates, count: coordinates.count)
        
        overlayStyles[id] = props
        overlays[id] = polyline
        mapView.add(polyline)
        
        // 强制刷新地图渲染
        DispatchQueue.main.async {
            mapView.setNeedsDisplay()
        }
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
        } else if let polyline = overlay as? MAMultiPolyline {
            let renderer = MAMultiColoredPolylineRenderer(multiPolyline: polyline)
            
            if let color = style?["color"] {
                renderer?.strokeColor = ColorParser.parseColor(color) ?? .red
            } else if let strokeColor = style?["strokeColor"] {
                renderer?.strokeColor = ColorParser.parseColor(strokeColor) ?? .red
            } else {
                renderer?.strokeColor = .red
            }
            
            if let width = style?["width"] as? Double {
                renderer?.lineWidth = CGFloat(width)
            } else if let strokeWidth = style?["strokeWidth"] as? Double {
                renderer?.lineWidth = CGFloat(strokeWidth)
            } else {
                renderer?.lineWidth = 5
            }
            
            return renderer!
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