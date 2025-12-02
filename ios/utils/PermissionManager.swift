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
                self.locationManager = CLLocationManager()
                self.locationManager?.delegate = self
            }
            
            let currentStatus = CLLocationManager.authorizationStatus()
            
            // 如果已经有权限,直接返回
            if currentStatus == .authorizedAlways || currentStatus == .authorizedWhenInUse {
                self.permissionCallback?(true, self.getAuthorizationStatusString(currentStatus))
                self.permissionCallback = nil
                return
            }
            
            // 如果已经被拒绝,直接返回
            if currentStatus == .denied || currentStatus == .restricted {
                self.permissionCallback?(false, self.getAuthorizationStatusString(currentStatus))
                self.permissionCallback = nil
                return
            }
            
            self.locationManager?.requestWhenInUseAuthorization()
        }
    }
    
    /**
     * 权限状态变化回调 (iOS 14+)
     */
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        handleAuthorizationChange(manager.authorizationStatus)
    }
    
    /**
     * 权限状态变化回调 (iOS 13 及以下,兼容旧版本)
     */
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        handleAuthorizationChange(status)
    }
    
    /**
     * 处理权限状态变化
     */
    private func handleAuthorizationChange(_ status: CLAuthorizationStatus) {
        // 如果状态仍是 notDetermined,说明用户还没有做出选择,忽略这次回调
        if status == .notDetermined {
            return
        }
        
        // 状态已确定(授予或拒绝),返回结果
        let granted = status == .authorizedAlways || status == .authorizedWhenInUse
        let statusString = getAuthorizationStatusString(status)
        
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
    
    /**
     * 析构函数 - 清理资源
     */
    deinit {
        locationManager?.delegate = nil
        locationManager = nil
        permissionCallback = nil
    }
}