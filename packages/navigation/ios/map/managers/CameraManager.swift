import ExpoModulesCore
import AMapNaviKit

/**
 * 相机管理器
 * 
 * 负责:
 * - 相机位置和视角控制
 * - 缩放级别管理
 * - 坐标转换
 */
class CameraManager {
    /// 弱引用地图视图,避免循环引用
    private weak var mapView: MAMapView?
    
    init(mapView: MAMapView) {
        self.mapView = mapView
    }
    
    // MARK: - 缩放级别控制
    
    /**
     * 设置最大缩放级别
     * @param maxZoom 最大缩放级别 (3-20)
     */
    func setMaxZoomLevel(_ maxZoom: CGFloat) {
        mapView?.maxZoomLevel = maxZoom
    }
    
    /**
     * 设置最小缩放级别
     * @param minZoom 最小缩放级别 (3-20)
     */
    func setMinZoomLevel(_ minZoom: CGFloat) {
        mapView?.minZoomLevel = minZoom
    }
    
    // MARK: - 相机位置控制
    
    /**
     * 设置初始相机位置
     * 不带动画,用于地图初始化
     * @param position 包含 target、zoom、bearing、tilt 的字典
     */
    func setInitialCameraPosition(_ position: [String: Any]) {
        guard let mapView = mapView else { return }
        let status = MAMapStatus()
        
        if let target = position["target"] as? [String: Double],
           let latitude = target["latitude"],
           let longitude = target["longitude"] {
            // 🔑 坐标验证
            guard latitude >= -90 && latitude <= 90,
                  longitude >= -180 && longitude <= 180 else {
                return
            }
            status.centerCoordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        }
        
        if let zoom = position["zoom"] as? Double {
            // 🔑 缩放级别范围限制 (3-20)
            let validZoom = max(3, min(20, zoom))
            status.zoomLevel = CGFloat(validZoom)
        }
        
        if let bearing = position["bearing"] as? Double {
            status.rotationDegree = CGFloat(bearing)
        }
        
        if let tilt = position["tilt"] as? Double {
            status.cameraDegree = CGFloat(tilt)
        }
        
        mapView.setMapStatus(status, animated: false, duration: 0)
    }
    
    /**
     * 移动相机到指定位置
     * 支持动画效果
     * @param position 目标位置信息
     * @param duration 动画时长(毫秒)
     */
    func moveCamera(position: [String: Any], duration: Int) {
        guard let mapView = mapView else { return }
        
        let status = MAMapStatus()
        
        // 设置中心点,如果未提供则保持当前值
        if let target = position["target"] as? [String: Double],
           let latitude = target["latitude"],
           let longitude = target["longitude"] {
            // 🔑 坐标验证
            guard latitude >= -90 && latitude <= 90,
                  longitude >= -180 && longitude <= 180 else {
                return
            }
            status.centerCoordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        } else {
            status.centerCoordinate = mapView.centerCoordinate
        }
        
        // 设置缩放级别
        if let zoom = position["zoom"] as? Double {
            status.zoomLevel = CGFloat(zoom)
        } else {
            status.zoomLevel = mapView.zoomLevel
        }
        
        // 设置旋转角度
        if let bearing = position["bearing"] as? Double {
            status.rotationDegree = CGFloat(bearing)
        } else {
            status.rotationDegree = mapView.rotationDegree
        }
        
        // 设置倾斜角度
        if let tilt = position["tilt"] as? Double {
            status.cameraDegree = CGFloat(tilt)
        } else {
            status.cameraDegree = mapView.cameraDegree
        }
        
        mapView.setMapStatus(status, animated: duration > 0, duration: TimeInterval(duration) / 1000.0)
    }
    
    /**
     * 设置地图中心点
     * @param center 中心点坐标
     * @param animated 是否使用动画
     */
    func setCenter(center: [String: Double], animated: Bool) {
        guard let mapView = mapView,
              let latitude = center["latitude"],
              let longitude = center["longitude"] else { return }
        
        // 🔑 坐标验证
        guard latitude >= -90 && latitude <= 90,
              longitude >= -180 && longitude <= 180 else {
            return
        }
        
        mapView.setCenter(CLLocationCoordinate2D(latitude: latitude, longitude: longitude), animated: animated)
    }
    
    /**
     * 设置缩放级别
     * @param zoom 缩放级别 (3-20)
     * @param animated 是否使用动画
     */
    func setZoomLevel(zoom: CGFloat, animated: Bool) {
        // 🔑 缩放级别范围限制 (3-20)
        let validZoom = max(3, min(20, zoom))
        mapView?.setZoomLevel(validZoom, animated: animated)
    }
    
    // MARK: - 相机信息获取
    
    /**
     * 获取当前相机位置信息
     * @return 包含 target、zoom、bearing、tilt 的字典
     */
    func getCameraPosition() -> [String: Any] {
        guard let mapView = mapView else { return [:] }
        let center = mapView.centerCoordinate
        return [
            "target": ["latitude": center.latitude, "longitude": center.longitude],
            "zoom": Double(mapView.zoomLevel),
            "bearing": Double(mapView.rotationDegree),
            "tilt": Double(mapView.cameraDegree)
        ]
    }
    
    /**
     * 将屏幕坐标转换为地理坐标
     * @param point 屏幕坐标点 {x, y}
     * @return 地理坐标 {latitude, longitude}
     */
    func getLatLng(point: [String: Double]) -> [String: Double] {
        guard let mapView = mapView,
              let x = point["x"],
              let y = point["y"] else { return [:] }
        let screenPoint = CGPoint(x: x, y: y)
        let coordinate = mapView.convert(screenPoint, toCoordinateFrom: mapView)
        return ["latitude": coordinate.latitude, "longitude": coordinate.longitude]
    }
}
