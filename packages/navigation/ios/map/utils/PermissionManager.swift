#if os(iOS)
import Foundation
import CoreLocation
import UIKit

/**
 * 位置权限管理器
 *
 * 负责:
 * - 请求位置权限（支持 iOS 17+ 新特性）
 * - 监听权限状态变化
 * - 返回权限结果
 * - 提供权限诊断信息
 */
class PermissionManager: NSObject, CLLocationManagerDelegate {
    
    // MARK: - iOS 版本检测
    
    /**
     * 检查是否为 iOS 17+
     */
    static func isIOS17Plus() -> Bool {
        if #available(iOS 17.0, *) {
            return true
        }
        return false
    }
    
    /**
     * 检查是否为 iOS 14+（引入精确位置权限）
     */
    static func isIOS14Plus() -> Bool {
        if #available(iOS 14.0, *) {
            return true
        }
        return false
    }
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
            
            var currentStatus: CLAuthorizationStatus
            if #available(iOS 14.0, *) {
                currentStatus = self.locationManager?.authorizationStatus ?? .notDetermined
            } else {
                currentStatus = CLLocationManager.authorizationStatus()
            }
            
            // 如果已经有权限,直接返回
            var hasPermission = false
            if #available(iOS 8.0, *) {
                hasPermission = currentStatus == .authorizedWhenInUse || currentStatus == .authorizedAlways
            } else {
                hasPermission = currentStatus == .authorizedAlways
            }
            
            if hasPermission {
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
        var granted = false
        if #available(iOS 8.0, *) {
            granted = status == .authorizedWhenInUse || status == .authorizedAlways
        } else {
            granted = status == .authorizedAlways
        }
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
    
    // MARK: - iOS 17+ 新功能
    
    /**
     * 检查是否有精确位置权限（iOS 14+）
     */
    func hasAccuracyAuthorization() -> Bool {
        guard let manager = locationManager else { return true }
        
        if #available(iOS 14.0, *) {
            return manager.accuracyAuthorization == .fullAccuracy
        }
        return true // iOS 14 以下默认为精确位置
    }
    
    /**
     * 请求临时精确位置权限（iOS 14+）
     * @param purposeKey Info.plist 中配置的用途键
     * @param callback 结果回调 (granted)
     */
    func requestTemporaryFullAccuracy(purposeKey: String, callback: @escaping (Bool) -> Void) {
        guard let manager = locationManager else {
            callback(false)
            return
        }
        
        if #available(iOS 14.0, *) {
            manager.requestTemporaryFullAccuracyAuthorization(withPurposeKey: purposeKey) { error in
                if error != nil {
                    callback(false)
                } else {
                    let hasAccuracy = manager.accuracyAuthorization == .fullAccuracy
                    callback(hasAccuracy)
                }
            }
        } else {
            // iOS 14 以下默认为精确位置
            callback(true)
        }
    }
    
    // MARK: - 诊断信息
    
    /**
     * 获取权限诊断信息
     */
    static func getDiagnosticInfo() -> [String: Any] {
        var currentStatus: CLAuthorizationStatus
        if #available(iOS 14.0, *) {
            currentStatus = CLLocationManager().authorizationStatus
        } else {
            currentStatus = CLLocationManager.authorizationStatus()
        }
        let statusString = getStaticAuthorizationStatusString(currentStatus)
        
        var info: [String: Any] = [
            "platform": "ios",
            "systemVersion": UIDevice.current.systemVersion,
            "isIOS17Plus": isIOS17Plus(),
            "isIOS14Plus": isIOS14Plus(),
            "currentStatus": statusString,
            "granted": currentStatus == .authorizedAlways || currentStatus == .authorizedWhenInUse
        ]
        
        // iOS 14+ 精确位置信息
        if #available(iOS 14.0, *) {
            let manager = CLLocationManager()
            info["hasAccuracyAuthorization"] = manager.accuracyAuthorization == .fullAccuracy
        }
        
        return info
    }
    
    /**
     * 静态方法：将权限状态转换为字符串
     */
    private static func getStaticAuthorizationStatusString(_ status: CLAuthorizationStatus) -> String {
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
#endif
