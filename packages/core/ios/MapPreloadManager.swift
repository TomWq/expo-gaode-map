/**
 * 地图预加载管理器 (iOS)
 * 在后台预先初始化地图实例，提升首次显示速度
 */

import Foundation
import AMapFoundationKit
import MAMapKit

/// 预加载实例数据
struct PreloadedMapInstance {
    let mapView: MAMapView
    let timestamp: Date
}

/// 地图预加载管理器
///
class MapPreloadManager {
    static let shared = MapPreloadManager()
    
    // 动态池大小配置（根据内存自适应）
    private let maxPoolSizeHighMemory = 3      // 高内存设备：>= 500MB
    private let maxPoolSizeMediumMemory = 2    // 中等内存：300-500MB
    private let maxPoolSizeLowMemory = 1       // 低内存设备：150-300MB
    private let minMemoryThresholdMB: UInt64 = 150  // 最低内存要求
    
    // 动态 TTL 配置（根据内存压力自适应）
    private let ttlNormal: TimeInterval = 5 * 60        // 正常：5分钟
    private let ttlMemoryPressure: TimeInterval = 2 * 60  // 内存压力：2分钟
    private let ttlLowMemory: TimeInterval = 1 * 60       // 低内存：1分钟
    
    private var preloadedMapInstances: [PreloadedMapInstance] = []
    private var isPreloading = false
    private let preloadQueue = DispatchQueue(label: "com.expo.gaodemap.preload", qos: .background)
    private var preloadGroup = DispatchGroup()
    
    // 动态配置
    private var currentMaxPoolSize = 2
    private var currentTTL: TimeInterval = 5 * 60
    private var memoryPressureLevel = 0  // 0=正常, 1=压力, 2=严重
    
    // 定期清理任务
    private var cleanupTimer: Timer?

    private init() {
        print("🔧 [MapPreload] 初始化预加载管理器（自适应版本）")
        
        // 注册内存警告监听
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
        
        // 启动定期清理任务
        startPeriodicCleanup()
    }
    
    /// 启动定期清理过期实例的任务
    private func startPeriodicCleanup() {
        cleanupTimer?.invalidate()
        cleanupTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            self?.cleanupExpiredInstances()
        }
    }
    
    /// 清理过期的预加载实例（使用动态 TTL）
    private func cleanupExpiredInstances() {
        let now = Date()
        var expiredCount = 0
        
        preloadedMapInstances.removeAll { instance in
            let isExpired = now.timeIntervalSince(instance.timestamp) > currentTTL
            if isExpired {
                expiredCount += 1
            }
            return isExpired
        }
        
        if expiredCount > 0 {
            print("🧹 [MapPreload] 清理了 \(expiredCount) 个过期实例（当前TTL: \(Int(currentTTL))秒）")
        }
    }
    
    /// 处理内存警告
    @objc private func handleMemoryWarning() {
        print("⚠️ [MapPreload] 收到内存警告，自动清理预加载池")
        clearPool()
    }
    
    /// 开始预加载地图实例（自适应版本）
    /// - Parameter poolSize: 预加载的地图实例数量（会根据内存自适应调整）
    func startPreload(poolSize: Int) {
        guard !isPreloading else {
            print("⚠️ [MapPreload] 预加载已在进行中")
            return
        }
        
        // 动态计算最优池大小
        let adaptiveMaxPoolSize = calculateAdaptivePoolSize()
        currentMaxPoolSize = adaptiveMaxPoolSize
        
        // 动态调整 TTL
        currentTTL = calculateAdaptiveTTL()
        
        // 检查内存是否充足
        guard hasEnoughMemory() else {
            print("⚠️ [MapPreload] 内存不足，跳过预加载")
            return
        }
        
        isPreloading = true
        let targetSize = min(poolSize, adaptiveMaxPoolSize)
        print("🚀 [MapPreload] 开始预加载 \(targetSize) 个地图实例 (自适应池大小: \(adaptiveMaxPoolSize), TTL: \(Int(currentTTL))秒)")
        
        for i in 0..<targetSize {
            preloadGroup.enter()  // 进入预加载队列
            
            preloadQueue.async { [weak self] in
                guard let self = self else { return }
                autoreleasepool {
                    // 创建地图视图
                    let mapView = self.createPreloadedMapView()

                    // 将地图实例添加到池中（带时间戳）
                    DispatchQueue.main.async {
                        let instance = PreloadedMapInstance(mapView: mapView, timestamp: Date())
                        self.preloadedMapInstances.append(instance)
                        print("✅ [MapPreload] 预加载实例 \(i + 1)/\(targetSize) 完成")
                        self.preloadGroup.leave()
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
        
        // 检查是否已在主线程，避免死锁
        if Thread.isMainThread {
            mapView = MAMapView()
            configureMapView(mapView)
        } else {
            // 确保在主线程中创建 MAMapView
            DispatchQueue.main.sync {
                mapView = MAMapView()
                self.configureMapView(mapView)
            }
        }
        return mapView
    }
    
    /// 配置地图视图的基础属性
    /// - Parameter mapView: 需要配置的地图视图
    private func configureMapView(_ mapView: MAMapView) {
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
    
    /// 计算自适应池大小
    /// 根据可用内存动态调整池大小
    private func calculateAdaptivePoolSize() -> Int {
        let availableMB = getAvailableMemoryMB()
        
        switch availableMB {
        case 500...:
            print("📊 [MapPreload] 高内存设备 (\(availableMB)MB)，池大小: \(maxPoolSizeHighMemory)")
            return maxPoolSizeHighMemory
        case 300..<500:
            print("📊 [MapPreload] 中等内存设备 (\(availableMB)MB)，池大小: \(maxPoolSizeMediumMemory)")
            return maxPoolSizeMediumMemory
        case 150..<300:
            print("📊 [MapPreload] 低内存设备 (\(availableMB)MB)，池大小: \(maxPoolSizeLowMemory)")
            return maxPoolSizeLowMemory
        default:
            print("⚠️ [MapPreload] 内存极低 (\(availableMB)MB)，禁用预加载")
            return 0
        }
    }
    
    /// 计算自适应 TTL
    /// 根据内存压力动态调整过期时间
    private func calculateAdaptiveTTL() -> TimeInterval {
        let availableMB = getAvailableMemoryMB()
        let totalMB = getTotalMemoryMB()
        let usagePercent = Int((Double(totalMB - availableMB) / Double(totalMB)) * 100)
        
        switch usagePercent {
        case 0..<60:
            memoryPressureLevel = 0
            print("📊 [MapPreload] 内存充足 (使用率: \(usagePercent)%)，TTL: \(Int(ttlNormal))秒")
            return ttlNormal
        case 60..<80:
            memoryPressureLevel = 1
            print("📊 [MapPreload] 内存压力 (使用率: \(usagePercent)%)，TTL: \(Int(ttlMemoryPressure))秒")
            return ttlMemoryPressure
        default:
            memoryPressureLevel = 2
            print("⚠️ [MapPreload] 内存严重不足 (使用率: \(usagePercent)%)，TTL: \(Int(ttlLowMemory))秒")
            return ttlLowMemory
        }
    }
    
    /// 获取可用内存（MB）
    private func getAvailableMemoryMB() -> UInt64 {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4
        
        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }
        
        if kerr == KERN_SUCCESS {
            let usedMB = UInt64(info.resident_size) / 1024 / 1024
            let totalMB = ProcessInfo.processInfo.physicalMemory / 1024 / 1024
            return totalMB - usedMB
        }
        return 0
    }
    
    /// 获取总内存（MB）
    private func getTotalMemoryMB() -> UInt64 {
        return ProcessInfo.processInfo.physicalMemory / 1024 / 1024
    }
    
    /// 检查是否有足够的内存
    private func hasEnoughMemory() -> Bool {
        return getAvailableMemoryMB() > minMemoryThresholdMB
    }
    
    /// 获取一个预加载的地图实例（使用动态 TTL）
    /// - Returns: 预加载的地图视图，如果池为空则返回 nil
    func getPreloadedMapView() -> MAMapView? {
        let now = Date()
        
        // 检查并移除过期实例（使用动态 TTL）
        preloadedMapInstances.removeAll { instance in
            let isExpired = now.timeIntervalSince(instance.timestamp) > currentTTL
            if isExpired {
                print("🗑️ [MapPreload] 预加载实例已过期（TTL: \(Int(currentTTL))秒），已删除")
            }
            return isExpired
        }
        
        if let instance = preloadedMapInstances.first {
            preloadedMapInstances.removeFirst()
            print("📤 [MapPreload] 使用预加载实例，剩余: \(preloadedMapInstances.count)")
            return instance.mapView
        }
        
        print("⚠️ [MapPreload] 预加载池为空，返回 nil")
        return nil
    }
    
    /// 清空预加载池
    func clearPool() {
        let count = preloadedMapInstances.count
        preloadedMapInstances.removeAll()
        print("🗑️ [MapPreload] 预加载池已清空，清理了 \(count) 个实例")
    }
    
    /// 获取预加载状态（包含动态配置信息）
    /// - Returns: 预加载状态信息
    func getStatus() -> [String: Any] {
        return [
            "poolSize": preloadedMapInstances.count,
            "isPreloading": isPreloading,
            "maxPoolSize": currentMaxPoolSize,
            "currentTTL": currentTTL,
            "memoryPressureLevel": memoryPressureLevel,
            "isAdaptive": true
        ]
    }
    
    /// 获取性能统计信息（包含内存信息）
    func getPerformanceMetrics() -> [String: Any] {
        let availableMB = getAvailableMemoryMB()
        let totalMB = getTotalMemoryMB()
        let usagePercent = Int((Double(totalMB - availableMB) / Double(totalMB)) * 100)
        
        return [
            "currentMaxPoolSize": currentMaxPoolSize,
            "currentTTL": currentTTL,
            "memoryPressureLevel": memoryPressureLevel,
            "availableMemoryMB": availableMB,
            "totalMemoryMB": totalMB,
            "memoryUsagePercent": usagePercent,
            "poolSize": preloadedMapInstances.count
        ]
    }
    
    /// 检查是否有可用的预加载实例
    /// - Returns: 是否有可用实例
    func hasPreloadedMapView() -> Bool {
        return !preloadedMapInstances.isEmpty
    }

    func cleanup() {
        cleanupTimer?.invalidate()
        cleanupTimer = nil
        clearPool()
        print("🧹 [MapPreload] 预加载管理器已清理")
    }
    
    deinit {
        cleanupTimer?.invalidate()
        NotificationCenter.default.removeObserver(self)
    }
}

