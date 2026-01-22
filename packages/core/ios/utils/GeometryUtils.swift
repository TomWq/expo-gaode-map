import CoreLocation

/**
 * 几何计算工具类 (iOS)
 * 
 * 桥接 ClusterNative (C++) 实现的几何计算功能
 */
public enum GeometryUtils {
    
    /**
     * 轨迹抽稀 (RDP 算法)
     * @param points 原始轨迹点
     * @param tolerance 允许误差 (米)
     * @return 简化后的轨迹点
     */
    public static func simplifyPolyline(_ points: [CLLocationCoordinate2D], tolerance: Double) -> [CLLocationCoordinate2D] {
        if points.count < 3 || tolerance <= 0 {
            return points
        }
        
        let lats = points.map { NSNumber(value: $0.latitude) }
        let lons = points.map { NSNumber(value: $0.longitude) }
        
        let result = ClusterNative.simplifyPolyline(latitudes: lats, longitudes: lons, tolerance: tolerance)
        
        var simplified: [CLLocationCoordinate2D] = []
        for i in stride(from: 0, to: result.count, by: 2) {
            if i + 1 < result.count {
                simplified.append(CLLocationCoordinate2D(latitude: result[i].doubleValue, longitude: result[i+1].doubleValue))
            }
        }
        return simplified
    }
}
