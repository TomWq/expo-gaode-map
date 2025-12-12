/**
 * 地图预加载管理器 (iOS)
 * 在后台预先初始化地图实例，提升首次显示速度
 */

import Foundation
import AMapFoundationKit
import MAMapKit

/// 地图预加载管理器
///
class MapPreloadManager {
    static let shared = MapPreloadManager()
    
    private var preloadedMapViews: [MAMapView] = []
    private let maxPoolSize = 3
    private var isPreloading = false
    private let preloadQueue = DispatchQueue(label: "com.expo.gaodemap.preload", qos: .background)
    private var preloadGroup = DispatchGroup()  // 用于同步异步任务

    private init() {
        print("🔧 [MapPreload] 初始化预加载管理器")
    }
    
    /// 开始预加载地图实例
    /// - Parameter poolSize: 预加载的地图实例数量
    func startPreload(poolSize: Int) {
        guard !isPreloading else {
            print("⚠️ [MapPreload] 预加载已在进行中")
            return
        }
        
        isPreloading = true
        let targetSize = min(poolSize, maxPoolSize)
        print("🚀 [MapPreload] 开始预加载 \(targetSize) 个地图实例")
        
        for i in 0..<targetSize {
            preloadGroup.enter()  // 进入预加载队列
            
            preloadQueue.async { [weak self] in
                guard let self = self else { return }
                autoreleasepool {
                    // 创建地图视图
                    let mapView = self.createPreloadedMapView()

                    // 将地图实例添加到池中
                    DispatchQueue.main.async {
                        self.preloadedMapViews.append(mapView)
                        print("✅ [MapPreload] 预加载实例 \(i + 1)/\(targetSize) 完成")
                        self.preloadGroup.leave()  // 完成当前实例的加载
                    }
                }
            }
        }
        
        // 等待所有实例加载完成
        preloadGroup.notify(queue: DispatchQueue.main) {
            self.isPreloading = false
            print("🎉 [MapPreload] 所有实例预加载完成")
        }
    }
    
    /// 创建预加载的地图视图
    /// - Returns: 预加载的地图视图实例
    private func createPreloadedMapView() -> MAMapView {
        var mapView: MAMapView!
        // 确保在主线程中创建 MAMapView
        DispatchQueue.main.sync {
            mapView = MAMapView()
            
            // 基础配置
            mapView.mapType = .standard
            mapView.showsUserLocation = false
            mapView.showsCompass = false
            mapView.showsScale = false
            mapView.isZoomEnabled = true
            mapView.isScrollEnabled = true
            mapView.isRotateEnabled = true
            
            // 预加载中心区域（北京天安门）
            let centerCoordinate = CLLocationCoordinate2D(latitude: 39.9042, longitude: 116.4074)
            mapView.setCenter(centerCoordinate, animated: false)
            mapView.setZoomLevel(12, animated: false)
            
            // 设置一个最小的 frame 以触发地图渲染
            mapView.frame = CGRect(x: 0, y: 0, width: 1, height: 1)
            
            // 触发地图初始化
            mapView.layoutIfNeeded()
        }
        return mapView
    }
    
    /// 获取一个预加载的地图实例
    /// - Returns: 预加载的地图视图，如果池为空则返回 nil
    func getPreloadedMapView() -> MAMapView? {
        if let mapView = preloadedMapViews.first {
            preloadedMapViews.removeFirst()
            print("📤 [MapPreload] 使用预加载实例，剩余: \(preloadedMapViews.count)")
            return mapView
        }
        return nil
    }
    
    /// 清空预加载池
    func clearPool() {
        let count = preloadedMapViews.count
        preloadedMapViews.removeAll()
        print("🗑️ [MapPreload] 预加载池已清空，清理了 \(count) 个实例")
    }
    
    /// 获取预加载状态
    /// - Returns: 预加载状态信息
    func getStatus() -> [String: Any] {
        return [
            "poolSize": preloadedMapViews.count,
            "isPreloading": isPreloading,
            "maxPoolSize": maxPoolSize
        ]
    }
    
    /// 检查是否有可用的预加载实例
    /// - Returns: 是否有可用实例
    func hasPreloadedMapView() -> Bool {
        return !preloadedMapViews.isEmpty
    }

    func cleanup() {
        clearPool()
        print("🧹 [MapPreload] 预加载管理器已清理")
    }
}

