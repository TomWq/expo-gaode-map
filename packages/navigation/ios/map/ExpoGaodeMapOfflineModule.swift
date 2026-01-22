import ExpoModulesCore
import AMapFoundationKit
import AMapNaviKit
import Foundation

/**
 * 高德地图离线地图模块 (iOS)
 * 
 * 
 */
public class ExpoGaodeMapOfflineModule: Module {
  
  // ==================== 属性定义 ====================
  
  // 线程安全的状态集合
  private let stateQueue = DispatchQueue(label: "com.expo.gaodemap.offline.state", attributes: .concurrent)
  private var _downloadingCities: Set<String> = []
  private var _pausedCities: Set<String> = []
  
  private var downloadingCities: Set<String> {
    get { stateQueue.sync { _downloadingCities } }
    set { stateQueue.async(flags: .barrier) { self._downloadingCities = newValue } }
  }
  
  private var pausedCities: Set<String> {
    get { stateQueue.sync { _pausedCities } }
    set { stateQueue.async(flags: .barrier) { self._pausedCities = newValue } }
  }
  
  private var offlineMapManager: MAOfflineMap {
    return MAOfflineMap.shared()
  }
  
  // 数据缓存
  private var cachedCities: [MAOfflineCity]?
  private var cachedProvinces: [MAOfflineProvince]?
  private var cachedMunicipalities: [MAOfflineCity]?
  
  // 初始化锁与等待队列
  private var isSetupComplete = false
  private var isSetupInProgress = false
  private var setupWaiters: [(Bool) -> Void] = []
  
  // ==================== 模块定义 ====================
  
  public func definition() -> ModuleDefinition {
    Name("ExpoGaodeMapOffline")
    
    Events(
      "onDownloadProgress",
      "onDownloadComplete",
      "onDownloadError",
      "onUnzipProgress",
      "onDownloadPaused",
      "onDownloadCancelled"
    )
    
    OnCreate {
      // Module initialization
    }
    
    OnDestroy {
      MAOfflineMap.shared().cancelAll()
      self.downloadingCities.removeAll()
      self.pausedCities.removeAll()
    }
    
    // ==================== 1. 地图列表管理 ====================
    
    AsyncFunction("getAvailableCities") { (promise: Promise) in
      self.ensureSetup { success in
        guard success else { promise.reject("ERR_SETUP", "Setup failed"); return }
        let cities = self.cachedCities ?? self.offlineMapManager.cities ?? []
        promise.resolve(cities.map { self.convertCityToDict($0) })
      }
    }
    
    AsyncFunction("getAvailableProvinces") { (promise: Promise) in
      self.ensureSetup { success in
        guard success else { promise.reject("ERR_SETUP", "Setup failed"); return }
        let provinces = self.cachedProvinces ?? self.offlineMapManager.provinces ?? []
        promise.resolve(provinces.map { self.convertProvinceToDict($0) })
      }
    }
    
    AsyncFunction("getCitiesByProvince") { (provinceCode: String, promise: Promise) in
      self.ensureSetup { success in
        guard success else { promise.reject("ERR_SETUP", "Setup failed"); return }
        let provinces = self.cachedProvinces ?? self.offlineMapManager.provinces ?? []
        if let province = provinces.first(where: { $0.adcode == provinceCode }) {
          let cities = province.cities.compactMap { ($0 as? MAOfflineCity).map { self.convertCityToDict($0) } }
          promise.resolve(cities)
        } else {
          promise.resolve([])
        }
      }
    }
    
    AsyncFunction("getDownloadedMaps") { (promise: Promise) in
      self.ensureSetup { success in
        guard success else { promise.reject("ERR_SETUP", "Setup failed"); return }
        let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
        let downloaded = allCities.filter { $0.itemStatus == .installed }
        promise.resolve(downloaded.map { self.convertCityToDict($0) })
      }
    }
    
    // ==================== 2. 下载管理 ====================
    
    AsyncFunction("startDownload") { (config: [String: Any], promise: Promise) in
      guard let cityCode = config["cityCode"] as? String else {
        promise.reject("ERR_ARGS", "cityCode required")
        return
      }
      self.startDownloadInternal(cityCode: cityCode, promise: promise)
    }
    
    AsyncFunction("resumeDownload") { (cityCode: String, promise: Promise) in
      self.startDownloadInternal(cityCode: cityCode, promise: promise)
    }
    
    Function("pauseDownload") { (cityCode: String) in
      let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
      if let city = allCities.first(where: { $0.adcode == cityCode }) {
        self.pausedCities.insert(cityCode)
        self.downloadingCities.remove(cityCode)
        self.offlineMapManager.pause(city)
      }
    }
    
    AsyncFunction("cancelDownload") { (cityCode: String) in
      let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
      if let city = allCities.first(where: { $0.adcode == cityCode }) {
        self.downloadingCities.remove(cityCode)
        self.pausedCities.remove(cityCode)
        self.offlineMapManager.pause(city) // iOS SDK 中 pause 停止网络
        self.sendEvent("onDownloadCancelled", ["cityCode": cityCode, "cityName": city.name ?? ""])
      }
    }
    
    AsyncFunction("deleteMap") { (cityCode: String) in
      let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
      if let city = allCities.first(where: { $0.adcode == cityCode }) {
        self.offlineMapManager.delete(city)
        self.downloadingCities.remove(cityCode)
        self.pausedCities.remove(cityCode)
      }
    }
    
    AsyncFunction("updateMap") { (cityCode: String, promise: Promise) in
      self.startDownloadInternal(cityCode: cityCode, promise: promise)
    }
    
    AsyncFunction("checkUpdate") { (cityCode: String, promise: Promise) in
      // 检查特定城市或全局更新
      self.offlineMapManager.checkNewestVersion { hasNewestVersion in
        if hasNewestVersion {
          // 刷新缓存以获取最新数据
          self.stateQueue.async(flags: .barrier) {
            self.cachedCities = nil
            self.cachedProvinces = nil
          }
          self.parseOfflineMapData()
        }
        promise.resolve(hasNewestVersion)
      }
    }
    
    // ==================== 3. 状态查询 ====================
    
    AsyncFunction("isMapDownloaded") { (cityCode: String) -> Bool in
      let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
      return allCities.first(where: { $0.adcode == cityCode })?.itemStatus == .installed
    }
    
    // 恢复原有方法：getMapStatus
    AsyncFunction("getMapStatus") { (cityCode: String) -> [String: Any] in
      let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
      if let city = allCities.first(where: { $0.adcode == cityCode }) {
        return self.convertCityToDict(city)
      }
      return [:]
    }
    
    // 恢复原有方法：getTotalProgress (iOS SDK 无总体进度，返回 0)
    AsyncFunction("getTotalProgress") { () -> Double in
      return 0.0
    }
    
    AsyncFunction("getDownloadingCities") { () -> [String] in
      return Array(self.downloadingCities)
    }
    
    // ==================== 4. 存储管理 ====================
    
    AsyncFunction("getStorageSize") { () -> Int64 in
      let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
      let installed = allCities.filter { $0.itemStatus == .installed }
      // 修复类型转换报错：Int64(0)
      return installed.reduce(Int64(0)) { $0 + ($1.downloadedSize > 0 ? $1.downloadedSize : $1.size) }
    }
    
    // 恢复原有方法：getStorageInfo
    AsyncFunction("getStorageInfo") { () -> [String: Any] in
      // 1. 计算离线地图占用
      let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
      let installed = allCities.filter { $0.itemStatus == .installed }
      let offlineMapSize = installed.reduce(Int64(0)) { $0 + ($1.downloadedSize > 0 ? $1.downloadedSize : $1.size) }
      
      // 2. 获取系统存储信息
      var totalSpace: Int64 = 0
      var availableSpace: Int64 = 0
      var usedSpace: Int64 = 0
      
      do {
        let fileURL = URL(fileURLWithPath: NSHomeDirectory() as String)
        let values = try fileURL.resourceValues(forKeys: [.volumeTotalCapacityKey, .volumeAvailableCapacityKey])
        if let total = values.volumeTotalCapacity { totalSpace = Int64(total) }
        if let available = values.volumeAvailableCapacity { availableSpace = Int64(available) }
        usedSpace = totalSpace - availableSpace
      } catch {
        // Failed to get storage info
      }
      
      return [
        "totalSpace": totalSpace,
        "usedSpace": usedSpace,
        "availableSpace": availableSpace,
        "offlineMapSize": offlineMapSize
      ]
    }
    
    AsyncFunction("clearAllMaps") {
      self.offlineMapManager.clearDisk()
      self.downloadingCities.removeAll()
      self.pausedCities.removeAll()
      self.cachedCities = nil
      self.parseOfflineMapData()
    }
    
    Function("setStoragePath") { (path: String) in
      // iOS does not support changing storage path
    }
    
    // 恢复原有方法：getStoragePath
    AsyncFunction("getStoragePath") { () -> String in
      return NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first ?? ""
    }
    
    // ==================== 5. 批量操作 ====================
    
    // 恢复原有方法：batchDownload
    AsyncFunction("batchDownload") { (cityCodes: [String], allowCellular: Bool?) in
      // 确保初始化
      self.ensureSetup { success in
        guard success else { return }
        let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
        
        cityCodes.forEach { cityCode in
          if let city = allCities.first(where: { $0.adcode == cityCode }) {
            self.downloadingCities.insert(cityCode)
            self.pausedCities.remove(cityCode)
            // 批量下载也建议开启后台
            self.offlineMapManager.downloadItem(city, shouldContinueWhenAppEntersBackground: true) { [weak self] item, status, info in
              guard let self = self, let item = item else { return }
              self.handleDownloadCallback(item: item, status: status, info: info)
            }
          }
        }
      }
    }
    
    // 恢复原有方法：batchDelete
    AsyncFunction("batchDelete") { (cityCodes: [String]) in
      let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
      cityCodes.forEach { cityCode in
        if let city = allCities.first(where: { $0.adcode == cityCode }) {
          self.offlineMapManager.delete(city)
        }
        self.downloadingCities.remove(cityCode)
        self.pausedCities.remove(cityCode)
      }
    }
    
    // 恢复原有方法:batchUpdate
    AsyncFunction("batchUpdate") { (cityCodes: [String]) in
      self.ensureSetup { success in
        guard success else { return }
        let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
        
        cityCodes.forEach { cityCode in
          if let city = allCities.first(where: { $0.adcode == cityCode }) {
            // 只更新已下载的地图
            if city.itemStatus == .installed {
              self.stateQueue.async(flags: .barrier) {
                self._downloadingCities.insert(cityCode)
                self._pausedCities.remove(cityCode)
              }
              self.offlineMapManager.downloadItem(city, shouldContinueWhenAppEntersBackground: true) { [weak self] item, status, info in
                guard let self = self, let item = item else { return }
                self.handleDownloadCallback(item: item, status: status, info: info)
              }
            }
          }
        }
      }
    }
    
    AsyncFunction("pauseAllDownloads") {
      self.offlineMapManager.cancelAll()
      for cityCode in self.downloadingCities {
        self.pausedCities.insert(cityCode)
        self.sendEvent("onDownloadPaused", ["cityCode": cityCode, "cityName": ""])
      }
      self.downloadingCities.removeAll()
    }
    
    // 恢复原有方法：resumeAllDownloads
    AsyncFunction("resumeAllDownloads") {
      // iOS SDK 没有 resumeAll，只能尝试恢复 pausedCities 列表中的城市
      self.ensureSetup { success in
        guard success else { return }
        let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
        let pausedList = Array(self.pausedCities)
        
        pausedList.forEach { cityCode in
           if let city = allCities.first(where: { $0.adcode == cityCode }) {
             self.pausedCities.remove(cityCode)
             self.downloadingCities.insert(cityCode)
             self.offlineMapManager.downloadItem(city, shouldContinueWhenAppEntersBackground: true) { [weak self] item, status, info in
               guard let self = self, let item = item else { return }
               self.handleDownloadCallback(item: item, status: status, info: info)
             }
           }
        }
      }
    }
  }
  
  // ==================== 内部私有方法 ====================
  
  private func startDownloadInternal(cityCode: String, promise: Promise) {
    self.ensureSetup { success in
      guard success else {
        promise.reject("ERR_SETUP", "SDK setup failed")
        return
      }
      
      let allCities = self.cachedCities ?? self.offlineMapManager.cities ?? []
      guard let city = allCities.first(where: { $0.adcode == cityCode }) else {
        promise.reject("ERR_CITY", "City not found: \(cityCode)")
        return
      }
      
      self.downloadingCities.insert(cityCode)
      self.pausedCities.remove(cityCode)
      
      // 开启后台下载
      self.offlineMapManager.downloadItem(city, shouldContinueWhenAppEntersBackground: true) { [weak self] item, status, info in
        guard let self = self, let item = item else { return }
        self.handleDownloadCallback(item: item, status: status, info: info)
      }
      promise.resolve(true)
    }
  }
  
  private func ensureSetup(completion: @escaping (Bool) -> Void) {
    if isSetupComplete { completion(true); return }
    setupWaiters.append(completion)
    if isSetupInProgress { return }
    
    isSetupInProgress = true
    MAOfflineMap.shared().setup { [weak self] success in
      guard let self = self else { return }
      self.isSetupInProgress = false
      self.isSetupComplete = success
      if success { self.parseOfflineMapData() }
      let waiters = self.setupWaiters
      self.setupWaiters.removeAll()
      waiters.forEach { $0(success) }
    }
  }
  
  private func parseOfflineMapData() {
    let map = MAOfflineMap.shared()
    stateQueue.async(flags: .barrier) {
      self.cachedCities = map?.cities
      self.cachedProvinces = map?.provinces
      self.cachedMunicipalities = map?.municipalities
    }
  }
  
  private func handleDownloadCallback(item: MAOfflineItem, status: MAOfflineMapDownloadStatus, info: Any?) {
    guard let city = item as? MAOfflineCity, let cityCode = city.adcode else { return }
    let cityName = city.name ?? ""
    
    switch status {
    case .progress:
      if let infoDict = info as? [String: Any],
         let received = infoDict[MAOfflineMapDownloadReceivedSizeKey] as? Int64,
         let expected = infoDict[MAOfflineMapDownloadExpectedSizeKey] as? Int64,
         expected > 0 {
        let progress = Int((Double(received) / Double(expected)) * 100)
        self.sendEvent("onDownloadProgress", [
          "cityCode": cityCode, "cityName": cityName, "progress": progress, "receivedSize": received, "expectedSize": expected
        ])
      }
    case .unzip:
      self.sendEvent("onUnzipProgress", ["cityCode": cityCode, "cityName": cityName])
    case .finished:
      // 只处理 .finished 状态,避免重复事件
      self.stateQueue.async(flags: .barrier) {
        self._downloadingCities.remove(cityCode)
        self._pausedCities.remove(cityCode)
      }
      self.sendEvent("onDownloadComplete", ["cityCode": cityCode, "cityName": cityName])
    case .completed:
      // .completed 状态只更新内部状态,不发送事件
      self.stateQueue.async(flags: .barrier) {
        self._downloadingCities.remove(cityCode)
        self._pausedCities.remove(cityCode)
      }
    case .cancelled:
      let wasPaused = stateQueue.sync { _pausedCities.contains(cityCode) }
      self.stateQueue.async(flags: .barrier) {
        self._downloadingCities.remove(cityCode)
      }
      if wasPaused {
        self.sendEvent("onDownloadPaused", ["cityCode": cityCode, "cityName": cityName])
      } else {
        self.sendEvent("onDownloadCancelled", ["cityCode": cityCode, "cityName": cityName])
      }
    case .error:
      self.stateQueue.async(flags: .barrier) {
        self._downloadingCities.remove(cityCode)
      }
      let err = (info as? NSError)?.localizedDescription ?? "Error"
      self.sendEvent("onDownloadError", ["cityCode": cityCode, "cityName": cityName, "error": err])
    default: break
    }
  }
  
  private func convertCityToDict(_ city: MAOfflineCity) -> [String: Any] {
    var status = "not_downloaded"
    switch city.itemStatus {
    case .installed: status = "downloaded"
    case .cached: status = "downloading"
    case .expired: status = "expired"
    default: status = "not_downloaded"
    }
    
    // 线程安全地检查状态
    let isDownloading = stateQueue.sync { _downloadingCities.contains(city.adcode) }
    let isPaused = stateQueue.sync { _pausedCities.contains(city.adcode) }
    
    if isDownloading { status = "downloading" }
    else if isPaused { status = "paused" }
    
    return [
      "cityCode": city.adcode ?? "",
      "cityName": city.name ?? "",
      "size": city.size,
      "status": status,
      "downloadedSize": city.downloadedSize,
      "version": self.offlineMapManager.version ?? "",
      "progress": city.size > 0 ? Int((Double(city.downloadedSize) / Double(city.size)) * 100) : 0
    ]
  }
  
  private func convertProvinceToDict(_ province: MAOfflineProvince) -> [String: Any] {
    return [
      "cityCode": province.adcode ?? "",
      "cityName": province.name ?? "",
      "size": province.size,
      "status": (province.itemStatus == .installed) ? "downloaded" : "not_downloaded",
      "downloadedSize": province.downloadedSize
    ]
  }
}
