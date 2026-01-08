import ExpoModulesCore
import MAMapKit

class ClusterView: ExpoView {
    // 属性
    var points: [[String: Any]] = [] {
        didSet {
            buildQuadTree()
        }
    }
    var radius: Int = 100 // 聚合范围 (screen points)
    var minClusterSize: Int = 1
    var clusterBuckets: [[String: Any]]?
    
    // 样式属性
    private var clusterBackgroundColor: UIColor = .systemBlue
    private var clusterBorderColor: UIColor = .white
    private var clusterBorderWidth: CGFloat = 2.0
    private var clusterTextColor: UIColor = .white
    private var clusterTextSize: CGFloat = 14.0
    private var clusterSize: CGSize = CGSize(width: 40, height: 40)
    
    let onClusterPress = EventDispatcher()
    
    private var mapView: MAMapView?
    private var quadTree = CoordinateQuadTree()
    private var currentAnnotations: [MAAnnotation] = []
    private let quadTreeQueue = DispatchQueue(label: "com.expo.gaode.quadtree")
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    // MARK: - Setters for Expo Module
    
    func setPoints(_ points: [[String: Any]]) {
        self.points = points
    }
    
    func setRadius(_ radius: Int) {
        self.radius = radius
        updateClusters()
    }
    
    func setMinClusterSize(_ size: Int) {
        self.minClusterSize = size
        updateClusters()
    }
    
    func setMap(_ map: MAMapView) {
        self.mapView = map
        updateClusters()
    }

    func setClusterStyle(_ style: [String: Any]) {
        if let color = ColorParser.parseColor(style["backgroundColor"]) {
            self.clusterBackgroundColor = color
        }
        if let borderColor = ColorParser.parseColor(style["borderColor"]) {
            self.clusterBorderColor = borderColor
        }
        if let borderWidth = style["borderWidth"] as? Double {
            self.clusterBorderWidth = CGFloat(borderWidth)
        }
        
        // 尺寸设置
        if let width = style["width"] as? Double {
            self.clusterSize.width = CGFloat(width)
            // 如果只设置了宽度，默认高度等于宽度（正圆）
            if style["height"] == nil {
                self.clusterSize.height = CGFloat(width)
            }
        }
        
        if let height = style["height"] as? Double {
            self.clusterSize.height = CGFloat(height)
            // 如果只设置了高度，默认宽度等于高度
            if style["width"] == nil {
                self.clusterSize.width = CGFloat(height)
            }
        }
        
        updateClusters()
    }
    
    func setClusterTextStyle(_ style: [String: Any]) {
        if let color = ColorParser.parseColor(style["color"]) {
            self.clusterTextColor = color
        }
        if let fontSize = style["fontSize"] as? Double {
            self.clusterTextSize = CGFloat(fontSize)
        }
        updateClusters()
    }

    func setClusterBuckets(_ buckets: [[String: Any]]) {
        self.clusterBuckets = buckets
        updateClusters()
    }

    func mapRegionDidChange() {
        updateClusters()
    }
    
    // MARK: - QuadTree Logic
    
    private func buildQuadTree() {
        // 在后台串行队列构建四叉树，保证线程安全
        quadTreeQueue.async { [weak self] in
            guard let self = self else { return }
            self.quadTree.clear()
            self.quadTree.build(with: self.points)
            
            // 构建完成后触发更新
            DispatchQueue.main.async {
                self.updateClusters()
            }
        }
    }
    
    // MARK: - Update Logic
    
    func updateClusters() {
        guard let mapView = mapView else { return }
        
        // 确保地图已布局
        if mapView.bounds.size.width == 0 { return }
        
        let visibleRect = mapView.visibleMapRect
        let boundsWidth = Double(mapView.bounds.size.width)
        let zoomScale = boundsWidth > 0 ? visibleRect.size.width / boundsWidth : 0
        let currentRadius = Double(self.radius)
        
        // 在后台串行队列计算聚合
        quadTreeQueue.async { [weak self] in
            guard let self = self else { return }
            
            let annotations = self.quadTree.clusteredAnnotations(within: visibleRect, zoomScale: zoomScale, gridSize: currentRadius)
            
            DispatchQueue.main.async {
                self.updateMapViewAnnotations(with: annotations as [MAAnnotation])
            }
        }
    }
    
    private func updateMapViewAnnotations(with newAnnotations: [MAAnnotation]) {
        guard let mapView = mapView else { return }
        
        // Diff 算法：找出新增、移除和保留的标注
        // 注意：ClusterAnnotation 需要实现 isEqual 和 hash
        
        let before = Set(currentAnnotations.compactMap { $0 as? ClusterAnnotation })
        let after = Set(newAnnotations.compactMap { $0 as? ClusterAnnotation })
        
        // intersection 返回 before 中的元素（如果相等），这正是我们需要保留的已经在地图上的实例
        let toKeep = before.intersection(after)
        let toAdd = after.subtracting(toKeep)
        let toRemove = before.subtracting(toKeep)
        
        // 只有当有变化时才操作
        if !toRemove.isEmpty {
            mapView.removeAnnotations(Array(toRemove) as [MAAnnotation])
        }
        
        if !toAdd.isEmpty {
            mapView.addAnnotations(Array(toAdd) as [MAAnnotation])
        }
        
        // 更新 currentAnnotations
        // 关键：必须保留已经在地图上的实例 (toKeep)，加上新增的实例 (toAdd)
        // 这样可以保证 currentAnnotations 中的对象始终与地图上的对象一致，避免 KVO 崩溃
        var nextAnnotations: [MAAnnotation] = []
        nextAnnotations.append(contentsOf: Array(toKeep) as [MAAnnotation])
        nextAnnotations.append(contentsOf: Array(toAdd) as [MAAnnotation])
        
        currentAnnotations = nextAnnotations
    }
    
    // MARK: - View Provider
    
    func viewForAnnotation(_ annotation: MAAnnotation) -> MAAnnotationView? {
        guard let clusterAnnotation = annotation as? ClusterAnnotation else { return nil }
        
        let reuseIdentifier = "ClusterAnnotation"
        var annotationView = mapView?.dequeueReusableAnnotationView(withIdentifier: reuseIdentifier)
        
        if annotationView == nil {
            annotationView = MAAnnotationView(annotation: annotation, reuseIdentifier: reuseIdentifier)
        }
        
        annotationView?.annotation = annotation
        annotationView?.canShowCallout = false
        
        // 生成图标
        annotationView?.image = image(for: clusterAnnotation.count)
        annotationView?.centerOffset = CGPoint(x: 0, y: 0)
        annotationView?.zIndex = 100
        
        return annotationView
    }
    
    private func image(for count: Int) -> UIImage? {
        let size = self.clusterSize
        let renderer = UIGraphicsImageRenderer(size: size)
        
        return renderer.image { context in
            let rect = CGRect(origin: .zero, size: size)
            
            // 基础样式
            var bgColor = self.clusterBackgroundColor
            var borderColor = self.clusterBorderColor
            var borderWidth = self.clusterBorderWidth
            
            // 应用分级样式
            if let buckets = self.clusterBuckets {
                var bestBucket: [String: Any]?
                var maxMinPoints = -1
                
                for bucket in buckets {
                    if let minPoints = bucket["minPoints"] as? Int, minPoints <= count {
                        if minPoints > maxMinPoints {
                            maxMinPoints = minPoints
                            bestBucket = bucket
                        }
                    }
                }
                
                if let bucket = bestBucket {
                    if let c = ColorParser.parseColor(bucket["backgroundColor"]) {
                        bgColor = c
                    }
                    if let c = ColorParser.parseColor(bucket["borderColor"]) {
                        borderColor = c
                    }
                    if let w = bucket["borderWidth"] as? Double {
                        borderWidth = CGFloat(w)
                    }
                }
            }
            
            bgColor.setFill()
            UIBezierPath(ovalIn: rect).fill()
            
            // 绘制边框
            if borderWidth > 0 {
                borderColor.setStroke()
                let path = UIBezierPath(ovalIn: rect.insetBy(dx: borderWidth / 2, dy: borderWidth / 2))
                path.lineWidth = borderWidth
                path.stroke()
            }
            
            // 绘制文字
            let text = "\(count)"
            let attributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: self.clusterTextSize),
                .foregroundColor: self.clusterTextColor
            ]
            let textSize = text.size(withAttributes: attributes)
            let textRect = CGRect(x: (size.width - textSize.width) / 2,
                                  y: (size.height - textSize.height) / 2,
                                  width: textSize.width,
                                  height: textSize.height)
            text.draw(in: textRect, withAttributes: attributes)
        }
    }
    
    // MARK: - Event Handling
    
    func containsAnnotation(_ annotation: MAAnnotation) -> Bool {
        guard let clusterAnnotation = annotation as? ClusterAnnotation else { return false }
        return currentAnnotations.contains { $0.isEqual(clusterAnnotation) }
    }
    
    func handleAnnotationTap(_ annotation: MAAnnotation) {
        guard let clusterAnnotation = annotation as? ClusterAnnotation else { return }
        
        onClusterPress([
            "count": clusterAnnotation.count,
            "latitude": clusterAnnotation.coordinate.latitude,
            "longitude": clusterAnnotation.coordinate.longitude,
            "pois": clusterAnnotation.pois
        ])
    }
    
    // MARK: - Lifecycle
    
    override func removeFromSuperview() {
        super.removeFromSuperview()
        mapView?.removeAnnotations(currentAnnotations)
    }
}
