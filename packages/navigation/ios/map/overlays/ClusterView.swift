import Foundation
import ExpoModulesCore
import AMapNaviKit

class ClusterView: ExpoView {
    var points: [[String: Any]] = [] {
        didSet {
            parsePoints()
            updateClusters()
        }
    }
    var radius: Int = 100
    var minClusterSize: Int = 1
    var clusterBuckets: [[String: Any]]?

    private var clusterBackgroundColor: UIColor = .systemBlue
    private var clusterBorderColor: UIColor = .white
    private var clusterBorderWidth: CGFloat = 2.0
    private var clusterTextColor: UIColor = .white
    private var clusterTextSize: CGFloat = 14.0
    private var clusterSize: CGSize = CGSize(width: 40, height: 40)

    let onClusterPress = EventDispatcher()

    private weak var mapView: MAMapView?
    private var currentAnnotations: [MAAnnotation] = []
    private let quadTreeQueue = DispatchQueue(label: "com.expo.gaode.quadtree")
    private var isInvalidated = false
    private let imageCache = NSCache<NSString, UIImage>()
    private var baseIconImage: UIImage?
    private var iconIdentifier: String?

    private var latitudes: [Double] = []
    private var longitudes: [Double] = []

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }

    private func parsePoints() {
        var lats: [Double] = []
        var lons: [Double] = []

        for point in points {
            if let coord = LatLngParser.parseLatLng(point) {
                lats.append(coord.latitude)
                lons.append(coord.longitude)
            } else {
                lats.append(0)
                lons.append(0)
            }
        }

        latitudes = lats
        longitudes = lons
    }

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
            clusterBackgroundColor = color
        }
        if let borderColor = ColorParser.parseColor(style["borderColor"]) {
            clusterBorderColor = borderColor
        }
        if let borderWidth = style["borderWidth"] as? Double {
            clusterBorderWidth = CGFloat(borderWidth)
        }

        if let width = style["width"] as? Double {
            clusterSize.width = CGFloat(width)
            if style["height"] == nil {
                clusterSize.height = CGFloat(width)
            }
        }

        if let height = style["height"] as? Double {
            clusterSize.height = CGFloat(height)
            if style["width"] == nil {
                clusterSize.width = CGFloat(height)
            }
        }

        clearImageCache()
        updateClusters()
    }

    func setIcon(_ icon: String?) {
        iconIdentifier = icon
        baseIconImage = nil
        clearImageCache()

        guard let icon, !icon.isEmpty else {
            updateClusters()
            return
        }

        loadIcon(from: icon)
    }

    func setClusterTextStyle(_ style: [String: Any]) {
        if let color = ColorParser.parseColor(style["color"]) {
            clusterTextColor = color
        }
        if let fontSize = style["fontSize"] as? Double {
            clusterTextSize = CGFloat(fontSize)
        }
        clearImageCache()
        updateClusters()
    }

    func setClusterBuckets(_ buckets: [[String: Any]]) {
        clusterBuckets = buckets
        clearImageCache()
        updateClusters()
    }

    func mapRegionDidChange() {
        updateClusters()
    }

    private var updateTimer: Timer?
    private let throttleInterval: TimeInterval = 0.3

    func updateClusters() {
        if isInvalidated { return }

        updateTimer?.invalidate()
        updateTimer = Timer.scheduledTimer(withTimeInterval: throttleInterval, repeats: false) { [weak self] _ in
            self?.performUpdate()
        }
    }

    private func performUpdate() {
        if isInvalidated { return }
        guard let mapView = mapView else { return }
        if mapView.bounds.size.width == 0 { return }

        let visibleRect = mapView.visibleMapRect
        let zoomScale = visibleRect.size.width / Double(mapView.bounds.size.width)
        let centerLat = mapView.centerCoordinate.latitude
        let metersPerMapPoint = MAMetersPerMapPointAtLatitude(centerLat)
        let mapPointsPerScreenPoint = zoomScale
        let metersPerScreenPoint = metersPerMapPoint * mapPointsPerScreenPoint
        let radiusMeters = Double(radius) * metersPerScreenPoint

        quadTreeQueue.async { [weak self] in
            guard let self else { return }

            let latNums = self.latitudes.map { NSNumber(value: $0) }
            let lonNums = self.longitudes.map { NSNumber(value: $0) }
            let clusterData = ClusterNative.clusterPoints(
                latitudes: latNums,
                longitudes: lonNums,
                radiusMeters: radiusMeters
            )

            var annotations: [ClusterAnnotation] = []

            if clusterData.count > 0 {
                let clusterCount = clusterData[0].intValue
                var offset = 1

                for _ in 0..<clusterCount {
                    if offset >= clusterData.count { break }

                    let centerIndex = clusterData[offset].intValue
                    offset += 1

                    let count = clusterData[offset].intValue
                    offset += 1

                    var pois: [[String: Any]] = []

                    for _ in 0..<count {
                        if offset < clusterData.count {
                            let idx = clusterData[offset].intValue
                            if idx >= 0 && idx < self.points.count {
                                pois.append(self.points[idx])
                            }
                            offset += 1
                        }
                    }

                    if centerIndex >= 0 && centerIndex < self.points.count {
                        let centerPoint = self.points[centerIndex]
                        if let lat = centerPoint["latitude"] as? Double,
                           let lon = centerPoint["longitude"] as? Double {
                            let coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lon)
                            annotations.append(
                                ClusterAnnotation(coordinate: coordinate, count: count, pois: pois)
                            )
                        }
                    }
                }
            }

            DispatchQueue.main.async {
                if self.isInvalidated { return }
                self.updateMapViewAnnotations(with: annotations as [MAAnnotation])
            }
        }
    }

    private func updateMapViewAnnotations(with newAnnotations: [MAAnnotation]) {
        guard let mapView = mapView else { return }

        let before = Set(currentAnnotations.compactMap { $0 as? ClusterAnnotation })
        let after = Set(newAnnotations.compactMap { $0 as? ClusterAnnotation })

        let toKeep = before.intersection(after)
        let toAdd = after.subtracting(toKeep)
        let toRemove = before.subtracting(toKeep)

        if !toRemove.isEmpty {
            mapView.removeAnnotations(Array(toRemove))
        }

        if !toAdd.isEmpty {
            mapView.addAnnotations(Array(toAdd))
        }

        var nextAnnotations: [MAAnnotation] = []
        nextAnnotations.append(contentsOf: Array(toKeep) as [MAAnnotation])
        nextAnnotations.append(contentsOf: Array(toAdd) as [MAAnnotation])
        currentAnnotations = nextAnnotations
    }

    func viewForAnnotation(_ annotation: MAAnnotation) -> MAAnnotationView? {
        guard let clusterAnnotation = annotation as? ClusterAnnotation else { return nil }

        let reuseIdentifier = "ClusterAnnotation"
        var annotationView = mapView?.dequeueReusableAnnotationView(withIdentifier: reuseIdentifier)

        if annotationView == nil {
            annotationView = MAAnnotationView(annotation: annotation, reuseIdentifier: reuseIdentifier)
        }

        annotationView?.annotation = annotation
        annotationView?.canShowCallout = false
        annotationView?.image = image(for: clusterAnnotation.count)
        annotationView?.centerOffset = CGPoint(x: 0, y: 0)
        annotationView?.zIndex = 100

        return annotationView
    }

    private func image(for count: Int) -> UIImage? {
        let cacheKey = clusterImageCacheKey(for: count)
        if let cachedImage = imageCache.object(forKey: cacheKey as NSString) {
            return cachedImage
        }

        let size = clusterSize
        let renderer = UIGraphicsImageRenderer(size: size)

        let renderedImage = renderer.image { _ in
            let rect = CGRect(origin: .zero, size: size)

            var bgColor = clusterBackgroundColor
            var borderColor = clusterBorderColor
            var borderWidth = clusterBorderWidth

            if let buckets = clusterBuckets {
                var bestBucket: [String: Any]?
                var maxMinPoints = -1

                for bucket in buckets {
                    if let minPoints = bucket["minPoints"] as? Int, minPoints <= count, minPoints > maxMinPoints {
                        maxMinPoints = minPoints
                        bestBucket = bucket
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

            if let baseIconImage {
                baseIconImage.draw(in: rect)
                if borderWidth > 0 {
                    borderColor.setStroke()
                    let path = UIBezierPath(ovalIn: rect.insetBy(dx: borderWidth / 2, dy: borderWidth / 2))
                    path.lineWidth = borderWidth
                    path.stroke()
                }
            } else {
                bgColor.setFill()
                UIBezierPath(ovalIn: rect).fill()

                if borderWidth > 0 {
                    borderColor.setStroke()
                    let path = UIBezierPath(ovalIn: rect.insetBy(dx: borderWidth / 2, dy: borderWidth / 2))
                    path.lineWidth = borderWidth
                    path.stroke()
                }
            }

            let text = "\(count)"
            let attributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: clusterTextSize),
                .foregroundColor: clusterTextColor
            ]
            let textSize = text.size(withAttributes: attributes)
            let textRect = CGRect(
                x: (size.width - textSize.width) / 2,
                y: (size.height - textSize.height) / 2,
                width: textSize.width,
                height: textSize.height
            )
            text.draw(in: textRect, withAttributes: attributes)
        }

        imageCache.setObject(renderedImage, forKey: cacheKey as NSString)
        return renderedImage
    }

    private func clusterImageCacheKey(for count: Int) -> String {
        let bucketKey: String
        if let buckets = clusterBuckets {
            let minPoints = buckets
                .compactMap { $0["minPoints"] as? Int }
                .filter { $0 <= count }
                .max() ?? 0
            bucketKey = "bucket:\(minPoints)"
        } else {
            bucketKey = "bucket:none"
        }

        return [
            "count:\(count)",
            bucketKey,
            "size:\(Int(clusterSize.width.rounded()))x\(Int(clusterSize.height.rounded()))",
            "bg:\(clusterBackgroundColor.description)",
            "border:\(clusterBorderColor.description)",
            "borderWidth:\(clusterBorderWidth)",
            "textColor:\(clusterTextColor.description)",
            "textSize:\(clusterTextSize)",
            "icon:\(iconIdentifier ?? "none")"
        ].joined(separator: "|")
    }

    private func clearImageCache() {
        imageCache.removeAllObjects()
    }

    private func loadIcon(from icon: String) {
        let requestedIcon = icon

        DispatchQueue.global().async { [weak self] in
            guard let self else { return }

            let image: UIImage? = {
                if requestedIcon.hasPrefix("http://") || requestedIcon.hasPrefix("https://") {
                    guard let url = URL(string: requestedIcon),
                          let data = try? Data(contentsOf: url) else {
                        return nil
                    }
                    return UIImage(data: data)
                }

                if requestedIcon.hasPrefix("file://") {
                    let path = String(requestedIcon.dropFirst(7))
                    return UIImage(contentsOfFile: path)
                }

                return UIImage(named: requestedIcon) ?? UIImage(contentsOfFile: requestedIcon)
            }()

            guard let image else { return }

            DispatchQueue.main.async { [weak self] in
                guard let self, self.iconIdentifier == requestedIcon else { return }
                self.baseIconImage = image
                self.clearImageCache()
                self.updateClusters()
            }
        }
    }

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

    override func removeFromSuperview() {
        isInvalidated = true
        updateTimer?.invalidate()
        clearImageCache()
        super.removeFromSuperview()
        mapView?.removeAnnotations(currentAnnotations)
    }
}
