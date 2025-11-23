import Foundation
import CoreLocation

/**
 * 位置权限管理器
 * 
 * 负责:
 * - 请求位置权限
 * - 监听权限状态变化
 * - 返回权限结果
 */
class PermissionManager: NSObject, CLLocationManagerDelegate {
    /// 位置管理器实例
    private var locationManager: CLLocationManager?
    /// 权限请求回调
    private var permissionCallback: ((Bool, String) -> Void)?
    
    /**
     * 请求位置权限
     * @param callback 权限结果回调 (granted, status)
     */
    func requestPermission(callback: @escaping (Bool, String) -> Void) {
        self.permissionCallback = callback
        
        // 确保在主线程操作
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            if self.locationManager == nil {
                print("🔐 [PermissionManager] 创建 CLLocationManager")
                self.locationManager = CLLocationManager()
                self.locationManager?.delegate = self
                print("🔐 [PermissionManager] delegate 已设置: \(self.locationManager?.delegate != nil)")
            }
            
            let currentStatus = CLLocationManager.authorizationStatus()
            print("🔐 [PermissionManager] 当前权限状态: \(self.getAuthorizationStatusString(currentStatus))")
            
            // 如果已经有权限,直接返回
            if currentStatus == .authorizedAlways || currentStatus == .authorizedWhenInUse {
                print("🔐 [PermissionManager] 已有权限,直接返回")
                self.permissionCallback?(true, self.getAuthorizationStatusString(currentStatus))
                self.permissionCallback = nil
                return
            }
            
            // 如果已经被拒绝,直接返回
            if currentStatus == .denied || currentStatus == .restricted {
                print("🔐 [PermissionManager] 权限已被拒绝")
                self.permissionCallback?(false, self.getAuthorizationStatusString(currentStatus))
                self.permissionCallback = nil
                return
            }
            
            print("🔐 [PermissionManager] 调用 requestWhenInUseAuthorization()")
            self.locationManager?.requestWhenInUseAuthorization()
            print("🔐 [PermissionManager] requestWhenInUseAuthorization() 调用完成")
        }
    }
    
    /**
     * 权限状态变化回调 (iOS 14+)
     */
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        print("🔐 [PermissionManager] locationManagerDidChangeAuthorization 被调用")
        handleAuthorizationChange(manager.authorizationStatus)
    }
    
    /**
     * 权限状态变化回调 (iOS 13 及以下,兼容旧版本)
     */
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        print("🔐 [PermissionManager] didChangeAuthorization 被调用")
        handleAuthorizationChange(status)
    }
    
    /**
     * 处理权限状态变化
     */
    private func handleAuthorizationChange(_ status: CLAuthorizationStatus) {
        print("🔐 [PermissionManager] 当前状态: \(getAuthorizationStatusString(status))")
        
        // 如果状态仍是 notDetermined,说明用户还没有做出选择,忽略这次回调
        if status == .notDetermined {
            print("🔐 [PermissionManager] 状态仍为 notDetermined,等待用户选择")
            return
        }
        
        // 状态已确定(授予或拒绝),返回结果
        let granted = status == .authorizedAlways || status == .authorizedWhenInUse
        let statusString = getAuthorizationStatusString(status)
        
        print("🔐 [PermissionManager] 返回结果: granted=\(granted), status=\(statusString)")
        
        permissionCallback?(granted, statusString)
        permissionCallback = nil
    }
    
    /**
     * 将权限状态转换为字符串
     */
    private func getAuthorizationStatusString(_ status: CLAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "notDetermined"
        case .restricted: return "restricted"
        case .denied: return "denied"
        case .authorizedAlways: return "authorizedAlways"
        case .authorizedWhenInUse: return "authorizedWhenInUse"
        @unknown default: return "unknown"
        }
    }
}