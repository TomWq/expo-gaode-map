import MAMapKit

class UIManager {
    private weak var mapView: MAMapView?
    
    init(mapView: MAMapView) {
        self.mapView = mapView
    }
    
    func setMapType(_ type: Int) {
        guard let mapView = mapView else { return }
        switch type {
        case 1: mapView.mapType = .satellite
        case 2: mapView.mapType = .standardNight
        default: mapView.mapType = .standard
        }
    }
    
    func setShowsZoomControls(_ show: Bool) {
        // iOS 高德地图不支持缩放控件
    }
    
    func setShowsCompass(_ show: Bool) {
        mapView?.showsCompass = show
    }
    
    func setShowsScale(_ show: Bool) {
        mapView?.showsScale = show
    }
    
    func setZoomEnabled(_ enabled: Bool) {
        mapView?.isZoomEnabled = enabled
    }
    
    func setScrollEnabled(_ enabled: Bool) {
        mapView?.isScrollEnabled = enabled
    }
    
    func setRotateEnabled(_ enabled: Bool) {
        mapView?.isRotateEnabled = enabled
    }
    
    func setTiltEnabled(_ enabled: Bool) {
        mapView?.isRotateCameraEnabled = enabled
    }
    
    func setShowsUserLocation(_ show: Bool, followUser: Bool) {
        guard let mapView = mapView else { return }
        mapView.showsUserLocation = show
        if show && followUser {
            mapView.userTrackingMode = .follow
        } else {
            mapView.userTrackingMode = .none
        }
    }
    
    func setUserLocationRepresentation(_ config: [String: Any]) {
        guard let mapView = mapView else { return }
        let representation = MAUserLocationRepresentation()
        
        // 精度圈是否显示
        if let showsAccuracyRing = config["showsAccuracyRing"] as? Bool {
            representation.showsAccuracyRing = showsAccuracyRing
        }
        
        // 是否显示方向指示
        if let showsHeadingIndicator = config["showsHeadingIndicator"] as? Bool {
            representation.showsHeadingIndicator = showsHeadingIndicator
        }
        
        // 精度圈填充颜色
        if let fillColor = config["fillColor"] {
            representation.fillColor = ColorParser.parseColor(fillColor)
        }
        
        // 精度圈边线颜色
        if let strokeColor = config["strokeColor"] {
            representation.strokeColor = ColorParser.parseColor(strokeColor)
        }
        
        // 精度圈边线宽度
        if let lineWidth = config["lineWidth"] as? Double {
            representation.lineWidth = CGFloat(lineWidth)
        }
        
        // 内部蓝色圆点是否使用律动效果
        if let enablePulseAnimation = config["enablePulseAnimation"] as? Bool {
            representation.enablePulseAnnimation = enablePulseAnimation
        }
        
        // 定位点背景色
        if let locationDotBgColor = config["locationDotBgColor"] {
            representation.locationDotBgColor = ColorParser.parseColor(locationDotBgColor)
        }
        
        // 定位点蓝色圆点颜色
        if let locationDotFillColor = config["locationDotFillColor"] {
            representation.locationDotFillColor = ColorParser.parseColor(locationDotFillColor)
        }
        
        // 定位图标
        if let imagePath = config["image"] as? String {
            let imageWidth = config["imageWidth"] as? Double
            let imageHeight = config["imageHeight"] as? Double
            
            if imagePath.hasPrefix("http://") || imagePath.hasPrefix("https://") {
                // 网络图片 - 异步加载
                DispatchQueue.global().async {
                    if let url = URL(string: imagePath),
                       let data = try? Data(contentsOf: url),
                       var image = UIImage(data: data) {
                        if let width = imageWidth, let height = imageHeight {
                            image = self.resizeImage(image, targetSize: CGSize(width: width, height: height))
                        }
                        DispatchQueue.main.async {
                            representation.image = image
                            mapView.update(representation)
                        }
                    }
                }
                return
            } else if imagePath.hasPrefix("file://") {
                // 本地文件
                let path = String(imagePath.dropFirst(7))
                if var image = UIImage(contentsOfFile: path) {
                    if let width = imageWidth, let height = imageHeight {
                        image = resizeImage(image, targetSize: CGSize(width: width, height: height))
                    }
                    representation.image = image
                }
            } else {
                // 资源文件
                if var image = UIImage(named: imagePath) {
                    if let width = imageWidth, let height = imageHeight {
                        image = resizeImage(image, targetSize: CGSize(width: width, height: height))
                    }
                    representation.image = image
                }
            }
        }
        
        mapView.update(representation)
    }
    
    private func resizeImage(_ image: UIImage, targetSize: CGSize) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: targetSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }
    
    func setShowsTraffic(_ show: Bool) {
        mapView?.isShowTraffic = show
    }
    
    func setShowsBuildings(_ show: Bool) {
        mapView?.isShowsBuildings = show
    }
    
    func setShowsIndoorMap(_ show: Bool) {
        mapView?.isShowsIndoorMap = show
    }
}
