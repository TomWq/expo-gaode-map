import MAMapKit

/**
 * 覆盖物管理器（已废弃）
 * 
 * 注意：所有覆盖物已完全改为声明式 API
 * 此文件仅保留以避免编译错误，未来版本将完全移除
 */
class OverlayManager {
    /// 地图视图弱引用
    private weak var mapView: MAMapView?
    
    /**
     * 初始化覆盖物管理器
     * @param mapView 地图视图实例
     */
    init(mapView: MAMapView) {
        self.mapView = mapView
    }
    
    /**
     * 清除所有覆盖物（空实现）
     */
    func clear() {
        // 空实现 - 所有覆盖物现在由声明式组件管理
    }
}
