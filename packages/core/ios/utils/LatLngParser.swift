import CoreLocation

/**
 * 坐标解析工具类
 * 支持解析多种格式的坐标：
 * 1. Dictionary: ["latitude": 39.9, "longitude": 116.4]
 * 2. Array: [116.4, 39.9] (longitude, latitude)
 */
public enum LatLngParser {
    
    /**
     * 解析单个坐标点
     */
    public static func parseLatLng(_ data: Any?) -> CLLocationCoordinate2D? {
        guard let data = data else { return nil }
        
        var coordinate: CLLocationCoordinate2D?
        
        if let dict = data as? [String: Any] {
            let lat = (dict["latitude"] as? NSNumber)?.doubleValue
            let lng = (dict["longitude"] as? NSNumber)?.doubleValue
            if let lat = lat, let lng = lng {
                coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
            }
        } else if let array = data as? [Any] {
            if array.count >= 2 {
                let lng = (array[0] as? NSNumber)?.doubleValue
                let lat = (array[1] as? NSNumber)?.doubleValue
                if let lat = lat, let lng = lng {
                    coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
                }
            }
        }
        
        // 验证坐标范围
        if let coord = coordinate,
           coord.latitude >= -90.0 && coord.latitude <= 90.0 &&
           coord.longitude >= -180.0 && coord.longitude <= 180.0 {
            return coord
        }
        
        return nil
    }

    /**
     * 解析坐标列表
     * 支持扁平列表 [p1, p2, ...]
     * 也支持嵌套列表 [[p1, p2], [p3, p4]] 并自动展平
     */
    public static func parseLatLngList(_ data: Any?) -> [CLLocationCoordinate2D] {
        guard let array = data as? [Any] else { return [] }
        
        var result: [CLLocationCoordinate2D] = []
        for item in array {
            if let point = parseLatLng(item) {
                result.append(point)
            } else if let subArray = item as? [Any] {
                // 如果不是点且是列表，递归解析并展平
                result.append(contentsOf: parseLatLngList(subArray))
            }
        }
        return result
    }

    /**
     * 解析嵌套坐标列表 (例如用于多边形孔洞)
     * 返回 [[CLLocationCoordinate2D]]
     */
    public static func parseLatLngListList(_ data: Any?) -> [[CLLocationCoordinate2D]] {
        guard let array = data as? [Any], !array.isEmpty else { return [] }
        
        // 检查第一项。如果第一项能直接解析为点，说明这是一个平铺的列表 [p1, p2, ...]
        if parseLatLng(array[0]) != nil {
            return [parseLatLngList(array)]
        }
        
        // 否则，它可能是一个嵌套列表 [[p1, p2], [p3, p4]]
        var result: [[CLLocationCoordinate2D]] = []
        for item in array {
            let ring = parseLatLngList(item)
            if !ring.isEmpty {
                result.append(ring)
            }
        }
        return result
    }
}
