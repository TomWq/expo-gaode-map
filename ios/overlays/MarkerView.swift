import ExpoModulesCore
import MAMapKit
import UIKit

/**
 * 标记点视图
 *
 * 负责:
 * - 在地图上显示标记点
 * - 管理标记点属性(位置、标题、描述)
 * - 支持拖拽功能
 * - 支持自定义 children 视图
 */
class MarkerView: ExpoView {
    // MARK: - 事件派发器
    let onPress = EventDispatcher()
    let onDragStart = EventDispatcher()
    let onDrag = EventDispatcher()
    let onDragEnd = EventDispatcher()
    
    /// 标记点位置
    var position: [String: Double] = [:]
    /// 标题
    var title: String = ""
    /// 描述
    var markerDescription: String = ""
    /// 是否可拖拽
    var draggable: Bool = false
    /// 图标 URI
    var iconUri: String?
    /// 图标宽度（用于自定义图标 icon 属性）
    var iconWidth: Double = 40
    /// 图标高度（用于自定义图标 icon 属性）
    var iconHeight: Double = 40
    /// 自定义视图宽度（用于 children 属性）
    var customViewWidth: Double = 0
    /// 自定义视图高度（用于 children 属性）
    var customViewHeight: Double = 0
    /// 中心偏移
    var centerOffset: [String: Double]?
    /// 是否显示动画
    var animatesDrop: Bool = false
    /// 大头针颜色
    var pinColor: String = "red"
    /// 是否显示气泡
    var canShowCallout: Bool = true
    /// 地图视图弱引用
    private var mapView: MAMapView?
    /// 标记点对象
    var annotation: MAPointAnnotation?
    /// 标记点视图
    private var annotationView: MAAnnotationView?
    /// 待处理的位置（在 setMap 之前设置）
    private var pendingPosition: [String: Double]?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        // 不可交互,通过父视图定位到屏幕外
        isUserInteractionEnabled = false
    }
    
    /**
     * 设置地图实例
     * @param map 地图视图
     */
    func setMap(_ map: MAMapView) {
        self.mapView = map
        
        // 如果有待处理的位置，先应用它
        if let pending = pendingPosition {
            self.position = pending
            pendingPosition = nil
        }
        
        updateAnnotation()
    }
    
    /**
     * 更新标记点
     */
    private func updateAnnotation() {
        guard let mapView = mapView,
              let latitude = position["latitude"],
              let longitude = position["longitude"] else {
            return
        }
        
        // 移除旧的标记
        if let oldAnnotation = annotation {
            mapView.removeAnnotation(oldAnnotation)
        }
        
        // 创建新的标记
        let annotation = MAPointAnnotation()
        annotation.coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        annotation.title = title
        annotation.subtitle = markerDescription
        
        mapView.addAnnotation(annotation)
        self.annotation = annotation
        
        // 延迟处理子视图,等待 React Native 添加完成
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            guard let self = self else { return }
            self.updateMarkerImage()
        }
        
        // 再次延迟更新，确保内容完全渲染
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            guard let self = self else { return }
            self.updateMarkerImage()
        }
    }
    
    /**
     * 更新 marker 图标
     */
    private func updateMarkerImage() {
        guard let mapView = mapView, let annotation = annotation else {
            return
        }
        guard let view = mapView.view(for: annotation) else {
            return
        }
        
        self.annotationView = view
        
        if self.subviews.count > 0 {
            // 有自定义内容，显示自定义图片
            if let image = self.createImageFromSubviews() {
                view.image = image
                // 设置 anchor 为底部中心
                view.centerOffset = CGPoint(x: 0, y: -image.size.height / 2)
            } else {
                // 自定义图片创建失败，使用默认图标
                view.image = self.createDefaultMarkerImage()
                view.centerOffset = CGPoint(x: 0, y: -18)
            }
        } else {
            // 没有自定义内容，使用默认图标
            view.image = self.createDefaultMarkerImage()
            view.centerOffset = CGPoint(x: 0, y: -18)
        }
    }
    
    /**
     * 创建默认 marker 图标（红色大头针）
     */
    private func createDefaultMarkerImage() -> UIImage {
        let width: CGFloat = 48
        let height: CGFloat = 72
        let size = CGSize(width: width, height: height)
        
        UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        guard let context = UIGraphicsGetCurrentContext() else {
            return UIImage()
        }
        
        // 绘制红色圆形顶部
        context.setFillColor(UIColor(red: 1.0, green: 0.32, blue: 0.32, alpha: 1.0).cgColor)
        let circleRect = CGRect(x: 2, y: 2, width: width - 4, height: width - 4)
        context.fillEllipse(in: circleRect)
        
        // 绘制尖端
        context.beginPath()
        context.move(to: CGPoint(x: width / 2, y: height))
        context.addLine(to: CGPoint(x: width / 4, y: width / 2 + 10))
        context.addLine(to: CGPoint(x: 3 * width / 4, y: width / 2 + 10))
        context.closePath()
        context.fillPath()
        
        // 绘制白色边框
        context.setStrokeColor(UIColor.white.cgColor)
        context.setLineWidth(3)
        let borderRect = CGRect(x: 4, y: 4, width: width - 8, height: width - 8)
        context.strokeEllipse(in: borderRect)
        
        return UIGraphicsGetImageFromCurrentImageContext() ?? UIImage()
    }
    
    /**
     * 将子视图转换为图片
     */
    private func createImageFromSubviews() -> UIImage? {
        guard let firstSubview = subviews.first else { return nil }
        
        // 优先使用 customViewWidth/customViewHeight（用于 children），其次使用子视图尺寸，最后使用默认值
        // 注意：iconWidth/iconHeight 是用于自定义图标的，不用于 children
        let width: CGFloat
        let height: CGFloat
        
        if customViewWidth > 0 {
            width = CGFloat(customViewWidth)
        } else if firstSubview.bounds.size.width > 0 {
            width = firstSubview.bounds.size.width
        } else {
            width = 200 // 默认宽度
        }
        
        if customViewHeight > 0 {
            height = CGFloat(customViewHeight)
        } else if firstSubview.bounds.size.height > 0 {
            height = firstSubview.bounds.size.height
        } else {
            height = 60 // 默认高度
        }
        
        let size = CGSize(width: width, height: height)
        
        // 强制子视图使用指定尺寸布局
        firstSubview.frame = CGRect(origin: .zero, size: size)
        
        // 递归强制布局所有子视图
        forceLayoutRecursively(view: firstSubview)
        
        UIGraphicsBeginImageContextWithOptions(size, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        guard let context = UIGraphicsGetCurrentContext() else { return nil }
        
        // 使用 drawHierarchy 而不是 layer.render，这样能正确渲染 Text
        firstSubview.drawHierarchy(in: CGRect(origin: .zero, size: size), afterScreenUpdates: true)
        
        return UIGraphicsGetImageFromCurrentImageContext()
    }
    
    /**
     * 递归强制布局视图及其所有子视图
     */
    private func forceLayoutRecursively(view: UIView) {
        view.setNeedsLayout()
        view.layoutIfNeeded()
        
        for subview in view.subviews {
            forceLayoutRecursively(view: subview)
        }
    }
    
    /**
     * 创建组合图片：默认 marker + 自定义内容
     */
    private func createCombinedImage() -> UIImage? {
        guard let customImage = createImageFromSubviews() else { return nil }
        let markerImage = createDefaultMarkerImage()
        
        // 计算总尺寸：marker 在下，自定义内容在上
        let totalWidth = max(markerImage.size.width, customImage.size.width)
        let spacing: CGFloat = 10
        let totalHeight = markerImage.size.height + customImage.size.height + spacing
        let totalSize = CGSize(width: totalWidth, height: totalHeight)
        
        UIGraphicsBeginImageContextWithOptions(totalSize, false, 0.0)
        defer { UIGraphicsEndImageContext() }
        
        // 绘制自定义内容在上方
        let customX = (totalWidth - customImage.size.width) / 2
        customImage.draw(at: CGPoint(x: customX, y: 0))
        
        // 绘制 marker 在下方
        let markerX = (totalWidth - markerImage.size.width) / 2
        let markerY = customImage.size.height + spacing
        markerImage.draw(at: CGPoint(x: markerX, y: markerY))
        
        return UIGraphicsGetImageFromCurrentImageContext()
    }
    
    override func didAddSubview(_ subview: UIView) {
        super.didAddSubview(subview)
        
        // 当添加子视图时,延迟更新标记图标
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            self?.updateMarkerImage()
        }
        
        // 再次延迟更新，确保内容完全渲染
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
            self?.updateMarkerImage()
        }
    }
    
    /**
     * 设置位置
     * @param position 位置坐标 {latitude, longitude}
     */
    func setPosition(_ position: [String: Double]) {
        if mapView != nil {
            // 地图已设置，直接更新
            self.position = position
            updateAnnotation()
        } else {
            // 地图还未设置，保存位置待后续应用
            pendingPosition = position
        }
    }
    
    /**
     * 设置标题
     * @param title 标题文本
     */
    func setTitle(_ title: String) {
        self.title = title
        updateAnnotation()
    }
    
    /**
     * 设置描述
     * @param description 描述文本
     */
    func setDescription(_ description: String) {
        self.markerDescription = description
        updateAnnotation()
    }
    
    /**
     * 设置是否可拖拽
     * @param draggable 是否可拖拽
     */
    func setDraggable(_ draggable: Bool) {
        self.draggable = draggable
        updateAnnotation()
    }
    
    func setIcon(_ source: [String: Any]?) {
        if let dict = source {
            // 处理 require() 返回的对象
            if let uri = dict["uri"] as? String {
                self.iconUri = uri
            }
        }
        updateAnnotation()
    }
    
    func setCenterOffset(_ offset: [String: Double]) {
        self.centerOffset = offset
    }
    
    func setAnimatesDrop(_ animate: Bool) {
        self.animatesDrop = animate
    }
    
    func setPinColor(_ color: String) {
        self.pinColor = color
    }
    
    func setCanShowCallout(_ show: Bool) {
        self.canShowCallout = show
    }
    
    /**
     * 析构时移除标记点
     */
    deinit {
        if let mapView = mapView, let annotation = annotation {
            mapView.removeAnnotation(annotation)
        }
    }
}
