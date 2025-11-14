import ExpoModulesCore
import MAMapKit

class MarkerView: ExpoView {
    var position: [String: Double] = [:]
    var title: String = ""
    var markerDescription: String = ""
    var draggable: Bool = false
    
    private var mapView: MAMapView?
    private var annotation: MAPointAnnotation?
    
    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
    }
    
    /**
     * 设置地图实例
     */
    func setMap(_ map: MAMapView) {
        self.mapView = map
        updateAnnotation()
    }
    
    /**
     * 更新标记
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
    }
    
    /**
     * 设置位置
     */
    func setPosition(_ position: [String: Double]) {
        self.position = position
        updateAnnotation()
    }
    
    /**
     * 设置标题
     */
    func setTitle(_ title: String) {
        self.title = title
        updateAnnotation()
    }
    
    /**
     * 设置描述
     */
    func setDescription(_ description: String) {
        self.markerDescription = description
        updateAnnotation()
    }
    
    /**
     * 设置是否可拖拽
     */
    func setDraggable(_ draggable: Bool) {
        self.draggable = draggable
        // iOS 高德地图标记默认不可拖拽，需要自定义实现
    }
}
