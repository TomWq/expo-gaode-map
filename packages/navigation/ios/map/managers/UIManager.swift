import AMapNaviKit

/**
 * UI 和手势管理器
 * 
 * 负责:
 * - 地图类型设置
 * - 控件显示控制
 * - 手势交互控制
 * - 图层显示管理
 * - 用户位置样式配置
 */
class UIManager: NSObject, MAMapViewDelegate {
    /// 弱引用地图视图,避免循环引用
    private weak var mapView: MAMapView?
    
    /// 定位变化回调
    var onLocationChanged: ((_ latitude: Double, _ longitude: Double, _ accuracy: Double) -> Void)?
    
    /// 缓存的自定义样式配置
    private var cachedCustomStyleOptions: MAMapCustomStyleOptions?
    
    init(mapView: MAMapView) {
        self.mapView = mapView
        super.init()
    }
    
    // MARK: - 地图类型
    
    /**
     * 设置地图类型
     * @param type 0:标准 1:卫星 2:夜间 3:导航
     */
    func setMapType(_ type: Int) {
        guard let mapView = mapView else { return }
        switch type {
        case 1: mapView.mapType = .satellite
        case 2: mapView.mapType = .standardNight
        case 3: mapView.mapType = .navi
        default: mapView.mapType = .standard
        }
        
        // 🔑 关键修复：切换地图类型后重新应用自定义样式
        // 某些地图类型切换可能会重置样式设置
        if let cachedOptions = cachedCustomStyleOptions {
            mapView.setCustomMapStyleOptions(cachedOptions)
            mapView.customMapStyleEnabled = true
        }
    }
    
    // MARK: - 控件显示
    
    /**
     * 设置是否显示缩放控件
     * iOS 高德地图不支持缩放控件
     */
    func setShowsZoomControls(_ show: Bool) {
        // iOS 不支持
    }
    
    /**
     * 设置是否显示指南针
     */
    func setShowsCompass(_ show: Bool) {
        mapView?.showsCompass = show
    }
    
    /**
     * 设置是否显示比例尺
     */
    func setShowsScale(_ show: Bool) {
        mapView?.showsScale = show
    }
    
    // MARK: - 手势控制
    
    /**
     * 设置是否启用缩放手势
     */
    func setZoomEnabled(_ enabled: Bool) {
        mapView?.isZoomEnabled = enabled
    }
    
    /**
     * 设置是否启用滚动手势
     */
    func setScrollEnabled(_ enabled: Bool) {
        mapView?.isScrollEnabled = enabled
    }
    
    /**
     * 设置是否启用旋转手势
     */
    func setRotateEnabled(_ enabled: Bool) {
        mapView?.isRotateEnabled = enabled
    }
    
    /**
     * 设置是否启用倾斜手势
     */
    func setTiltEnabled(_ enabled: Bool) {
        mapView?.isRotateCameraEnabled = enabled
    }
    
    // MARK: - 用户位置
    
    /**
     * 设置是否显示用户位置
     * @param show 是否显示
     * @param followUser 是否跟随用户
     */
    func setShowsUserLocation(_ show: Bool, followUser: Bool) {
        guard let mapView = mapView else { return }
        
        if show {
            // 设置代理以监听定位更新
            if mapView.delegate == nil {
                mapView.delegate = self
            }
            mapView.showsUserLocation = true
            if followUser {
                // 🔑 使用 followWithHeading 模式以支持方向指示器
                mapView.userTrackingMode = .followWithHeading
            } else {
                mapView.userTrackingMode = .none
            }
        } else {
            mapView.showsUserLocation = false
            mapView.userTrackingMode = .none
        }
    }
    
    // MARK: - MAMapViewDelegate
    
    /**
     * 定位更新回调
     */
    public func mapView(_ mapView: MAMapView, didUpdate userLocation: MAUserLocation, updatingLocation: Bool) {
        guard updatingLocation, let location = userLocation.location else { return }
        
        // 🔑 坐标验证
        let latitude = location.coordinate.latitude
        let longitude = location.coordinate.longitude
        guard latitude >= -90 && latitude <= 90,
              longitude >= -180 && longitude <= 180 else {
            return
        }
        
        onLocationChanged?(latitude, longitude, location.horizontalAccuracy)
    }
    
    /**
     * 设置用户位置样式
     * @param config 样式配置字典
     */
    func setUserLocationRepresentation(_ config: [String: Any]) {
        guard let mapView = mapView else { return }
        let representation = MAUserLocationRepresentation()
        
        // 是否显示定位蓝点 (showMyLocation) - 对应 Android 的 showMyLocation
        // iOS 通过 mapView.showsUserLocation 控制，这里提供统一的 API
        if let showMyLocation = config["showMyLocation"] as? Bool {
            mapView.showsUserLocation = showMyLocation
        }
        
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
    
    /**
     * 调整图片大小
     * @param image 原始图片
     * @param targetSize 目标大小
     * @return 调整后的图片
     */
    private func resizeImage(_ image: UIImage, targetSize: CGSize) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: targetSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }
    
    // MARK: - 图层显示
    
    /**
     * 设置是否显示交通路况
     */
    func setShowsTraffic(_ show: Bool) {
        mapView?.isShowTraffic = show
    }
    
    /**
     * 设置是否显示建筑物
     */
    func setShowsBuildings(_ show: Bool) {
        mapView?.isShowsBuildings = show
    }
    
    /**
     * 设置是否显示室内地图
     */
    func setShowsIndoorMap(_ show: Bool) {
        mapView?.isShowsIndoorMap = show
    }
    
    // MARK: - 自定义地图样式
    
    /**
     * 设置自定义地图样式
     * @param styleData 样式数据，支持以下格式：
     *   - styleId: String - 在线样式ID（从高德开放平台获取）
     *   - styleDataPath: String - 本地样式文件路径
     *   - extraStyleDataPath: String - 额外样式文件路径（可选）
     */
    func setCustomMapStyle(_ styleData: [String: Any]) {
        guard let mapView = mapView else { return }
        
        // 在线样式 ID
        if let styleId = styleData["styleId"] as? String, !styleId.isEmpty {
            let customStyle = MAMapCustomStyleOptions()
            customStyle.styleId = styleId
            
            // 🔑 缓存样式配置
            cachedCustomStyleOptions = customStyle
            
            mapView.setCustomMapStyleOptions(customStyle)
            mapView.customMapStyleEnabled = true
            return
        }
        
        // 本地样式文件
        if let styleDataPath = styleData["styleDataPath"] as? String, !styleDataPath.isEmpty {
            // 读取样式文件数据
            if let stylePath = Bundle.main.path(forResource: styleDataPath, ofType: nil),
               let styleFileData = try? Data(contentsOf: URL(fileURLWithPath: stylePath)) {
                let customStyle = MAMapCustomStyleOptions()
                customStyle.styleData = styleFileData
                
                // 额外样式文件（可选）
                if let extraPath = styleData["extraStyleDataPath"] as? String, !extraPath.isEmpty,
                   let extraFilePath = Bundle.main.path(forResource: extraPath, ofType: nil),
                   let extraFileData = try? Data(contentsOf: URL(fileURLWithPath: extraFilePath)) {
                    customStyle.styleExtraData = extraFileData
                }
                
                // 🔑 缓存样式配置
                cachedCustomStyleOptions = customStyle
                
                mapView.setCustomMapStyleOptions(customStyle)
                mapView.customMapStyleEnabled = true
                return
            }
        }
        
        // 如果没有提供任何样式，禁用自定义样式并清除缓存
        cachedCustomStyleOptions = nil
        mapView.customMapStyleEnabled = false
    }
}
