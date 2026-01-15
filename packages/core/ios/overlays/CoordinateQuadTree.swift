import Foundation
import CoreLocation
import MAMapKit

// MARK: - 数据结构定义

struct QuadTreePoint {
    let x: Double // latitude
    let y: Double // longitude
    let data: [String: Any]
}

struct BoundingBox {
    let minX: Double // min latitude
    let minY: Double // min longitude
    let maxX: Double // max latitude
    let maxY: Double // max longitude
    
    func contains(_ point: QuadTreePoint) -> Bool {
        return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
    }
    
    func intersects(_ other: BoundingBox) -> Bool {
        return other.minX <= maxX && other.maxX >= minX && other.minY <= maxY && other.maxY >= minY
    }
}

private class QuadTreeNode {
    var points: [QuadTreePoint] = []
    var boundingBox: BoundingBox
    var northWest: QuadTreeNode?
    var northEast: QuadTreeNode?
    var southWest: QuadTreeNode?
    var southEast: QuadTreeNode?
    
    static let capacity = 20 // 增加容量以减少树深度
    
    init(boundingBox: BoundingBox) {
        self.boundingBox = boundingBox
    }
    
    func insert(_ point: QuadTreePoint) -> Bool {
        if !boundingBox.contains(point) {
            return false
        }
        
        if points.count < QuadTreeNode.capacity && northWest == nil {
            points.append(point)
            return true
        }
        
        if northWest == nil {
            subdivide()
        }
        
        if northWest!.insert(point) { return true }
        if northEast!.insert(point) { return true }
        if southWest!.insert(point) { return true }
        if southEast!.insert(point) { return true }
        
        return false
    }
    
    func subdivide() {
        let xMid = (boundingBox.minX + boundingBox.maxX) / 2
        let yMid = (boundingBox.minY + boundingBox.maxY) / 2
        
        northWest = QuadTreeNode(boundingBox: BoundingBox(minX: xMid, minY: boundingBox.minY, maxX: boundingBox.maxX, maxY: yMid)) // Top-Left (Lat increases upwards? No, Lat is X here)
        // Note: Lat/Lon mapping to X/Y needs care.
        // Let's assume X=Lat, Y=Lon.
        // North is +Lat (MaxX), South is -Lat (MinX).
        // East is +Lon (MaxY), West is -Lon (MinY).
        
        // Correct subdivision:
        // North (High Lat) / South (Low Lat)
        // East (High Lon) / West (Low Lon)
        
        // NorthWest: Lat [Mid, Max], Lon [Min, Mid]
        northWest = QuadTreeNode(boundingBox: BoundingBox(minX: xMid, minY: boundingBox.minY, maxX: boundingBox.maxX, maxY: yMid))
        
        // NorthEast: Lat [Mid, Max], Lon [Mid, Max]
        northEast = QuadTreeNode(boundingBox: BoundingBox(minX: xMid, minY: yMid, maxX: boundingBox.maxX, maxY: boundingBox.maxY))
        
        // SouthWest: Lat [Min, Mid], Lon [Min, Mid]
        southWest = QuadTreeNode(boundingBox: BoundingBox(minX: boundingBox.minX, minY: boundingBox.minY, maxX: xMid, maxY: yMid))
        
        // SouthEast: Lat [Min, Mid], Lon [Mid, Max]
        southEast = QuadTreeNode(boundingBox: BoundingBox(minX: boundingBox.minX, minY: yMid, maxX: xMid, maxY: boundingBox.maxY))
        
        // Redistribute points
        for p in points {
            _ = northWest!.insert(p) || northEast!.insert(p) || southWest!.insert(p) || southEast!.insert(p)
        }
        points.removeAll()
    }
    
    func query(range: BoundingBox, results: inout [QuadTreePoint]) {
        if !boundingBox.intersects(range) {
            return
        }
        
        for p in points {
            if range.contains(p) {
                results.append(p)
            }
        }
        
        if northWest == nil {
            return
        }
        
        northWest!.query(range: range, results: &results)
        northEast!.query(range: range, results: &results)
        southWest!.query(range: range, results: &results)
        southEast!.query(range: range, results: &results)
    }
}

// MARK: - QuadTree 管理类

class CoordinateQuadTree {
    private var root: QuadTreeNode?
    
    /// 构建四叉树
    func build(with points: [[String: Any]]) {
        // 全球范围
        let worldBox = BoundingBox(minX: -90, minY: -180, maxX: 90, maxY: 180)
        root = QuadTreeNode(boundingBox: worldBox)
        
        for pointData in points {
            if let lat = pointData["latitude"] as? Double,
               let lon = pointData["longitude"] as? Double {
                let point = QuadTreePoint(x: lat, y: lon, data: pointData)
                _ = root?.insert(point)
            }
        }
    }
    
    /// 清除
    func clear() {
        root = nil
    }
    
    /// 计算聚类
    /// - Parameters:
    ///   - visibleRect: 当前可见区域 (MAMapRect)
    ///   - zoomLevel: 当前缩放级别
    ///   - gridSize: 聚合网格大小（像素），默认 50
    func clusteredAnnotations(within visibleRect: MAMapRect, zoomLevel: Double, gridSize: Double = 50) -> [ClusterAnnotation] {
        guard let root = root else { return [] }
        
        // 1. 计算当前 zoomLevel 下，gridSize 对应的经纬度范围
        // 这是一个粗略估算，因为经纬度距离随纬度变化。
        // 为了简化，我们使用一个经验公式或 MAMapKit 提供的转换（如果可用）。
        // 这里我们使用一个简单的比例：
        // 缩放级别每增加1，分辨率翻倍（每像素代表的度数减半）。
        // Zoom 3: ~30 degrees per screen? No.
        // A standard approach in QuadTree clustering is distance-based clustering.
        
        // 计算当前可视区域的经纬度范围
        let northEast = MACoordinateForMapPoint(MAMapPoint(x: visibleRect.origin.x + visibleRect.size.width, y: visibleRect.origin.y))
        let southWest = MACoordinateForMapPoint(MAMapPoint(x: visibleRect.origin.x, y: visibleRect.origin.y + visibleRect.size.height))
        
        // 注意：MAMapRect 的坐标系原点在左上角？MAMapPoint 是投影坐标。
        // MAMapCoordinateForMapPoint 转换是准确的。
        
        let minLat = min(northEast.latitude, southWest.latitude)
        let maxLat = max(northEast.latitude, southWest.latitude)
        let minLon = min(northEast.longitude, southWest.longitude)
        let maxLon = max(northEast.longitude, southWest.longitude)
        
        // 扩大一点搜索范围，避免边界问题
        let searchBox = BoundingBox(minX: minLat, minY: minLon, maxX: maxLat, maxY: maxLon)
        
        var pointsInView: [QuadTreePoint] = []
        root.query(range: searchBox, results: &pointsInView)
        
        // 如果点太多，可能会卡顿。这里可以限制最大点数。
        
        // 2. 基于距离的聚类
        // 将 gridSize (screen pixels) 转换为经纬度距离
        // 这需要 mapView 的 bounds 和 visibleMapRect。但这里我们只有 visibleRect 和 zoomLevel。
        // 我们可以估算。
        // Scale = visibleRect.size.width / mapView.bounds.size.width (MAMapPoint per pixel)
        // 这里没有 map view bounds，只有 visibleRect。
        // 假设 visibleRect 对应整个屏幕。
        
        // 实际上，MAMapPoint 的单位是米（大约）。
        // 我们可以直接在 MAMapPoint 坐标系下做聚类，这样更方便，因为它是平面的。
        // 但是我们的 QuadTree 存储的是经纬度。
        // 方案：将查询到的点转换为 MAMapPoint，然后进行距离聚类。
        
        var _: [ClusterAnnotation] = []
        _ = Set<String>() // 存储已处理点的唯一标识（这里用 hash 或 index）
        // 由于 QuadTreePoint 没有 ID，我们用 index
        _ = Set<Int>()
        
        // 转换 gridSize 到 MAMapPoint 距离
        // 整个地图宽度约 2.68亿 (MAMapSizeWorld.width)
        // ZoomLevel 3 -> 1 pixel = large distance
        // 我们利用传入的 zoomScale 或者直接利用 MAMetersPerMapPointAtZoomLevel? No.
        
        // 用户传入了 zoomScale (MAMapPoint per pixel)
        // Let's assume gridSize is 50 pixels.
        // distance = gridSize * zoomScale
        
        // 但是参数里没有 zoomScale，只有 visibleRect 和 zoomLevel。
        // 我们可以推算 zoomScale。
        // 实际上，用户示例代码传了 zoomScale:
        // clusteredAnnotations(within: visibleRect, withZoomScale: zoomScale, andZoomLevel: zoomLevel)
        // 我应该修改方法签名以包含 zoomScale。
        
        // 暂时无法获取 zoomScale，我们先用 zoomLevel 估算。
        // 或者直接让调用者传入 zoomScale。
        
        return [] // 临时返回，需要在 updateClusterView 中正确调用
    }
    
    // 重载带 zoomScale 的方法
    func clusteredAnnotations(within visibleRect: MAMapRect, zoomScale: Double, gridSize: Double = 50) -> [ClusterAnnotation] {
        guard let root = root else { return [] }
        
        // 1. 查询可见区域内的点
        let northEast = MACoordinateForMapPoint(MAMapPoint(x: visibleRect.origin.x + visibleRect.size.width, y: visibleRect.origin.y))
        let southWest = MACoordinateForMapPoint(MAMapPoint(x: visibleRect.origin.x, y: visibleRect.origin.y + visibleRect.size.height))
        
        let minLat = min(northEast.latitude, southWest.latitude)
        let maxLat = max(northEast.latitude, southWest.latitude)
        let minLon = min(northEast.longitude, southWest.longitude)
        let maxLon = max(northEast.longitude, southWest.longitude)
        
        let searchBox = BoundingBox(minX: minLat, minY: minLon, maxX: maxLat, maxY: maxLon)
        
        var pointsInView: [QuadTreePoint] = []
        root.query(range: searchBox, results: &pointsInView)
        
        if pointsInView.isEmpty { return [] }
        
        // 2. 聚类
        // 聚类半径（MAMapPoint 单位）
        let clusterRadius = gridSize * zoomScale
        let clusterRadiusSq = clusterRadius * clusterRadius
        
        var clusters: [ClusterAnnotation] = []
        var visited = [Bool](repeating: false, count: pointsInView.count)
        
        // 将所有点转换为 MAMapPoint 以便计算距离
        let mapPoints = pointsInView.map { MAMapPointForCoordinate(CLLocationCoordinate2D(latitude: $0.x, longitude: $0.y)) }
        
        for i in 0..<pointsInView.count {
            if visited[i] { continue }
            
            let centerPoint = pointsInView[i]
            let centerMapPoint = mapPoints[i]
            
            var clusterPoints: [[String: Any]] = [centerPoint.data]
            visited[i] = true
            
            // 查找邻居
            for j in (i+1)..<pointsInView.count {
                if visited[j] { continue }
                
                let neighborMapPoint = mapPoints[j]
                
                let dx = centerMapPoint.x - neighborMapPoint.x
                let dy = centerMapPoint.y - neighborMapPoint.y
                let distSq = dx*dx + dy*dy
                
                if distSq <= clusterRadiusSq {
                    clusterPoints.append(pointsInView[j].data)
                    visited[j] = true
                }
            }
            
            if clusterPoints.count == 1 {
                // 单个点
                let annotation = ClusterAnnotation(coordinate: CLLocationCoordinate2D(latitude: centerPoint.x, longitude: centerPoint.y), count: 1, pois: clusterPoints)
                clusters.append(annotation)
            } else {
                // 聚合点：计算平均坐标 (这里简单使用中心点坐标，或者计算所有点的平均值)
                // 高德示例通常使用第一个点的坐标作为聚合点坐标，或者计算重心。
                // 为了视觉稳定，使用中心点坐标可能更好？不，使用重心更准确。
                // 简单起见，使用 centerPoint (第一个点) 的坐标。
                let annotation = ClusterAnnotation(coordinate: CLLocationCoordinate2D(latitude: centerPoint.x, longitude: centerPoint.y), count: clusterPoints.count, pois: clusterPoints)
                clusters.append(annotation)
            }
        }
        
        return clusters
    }
}
