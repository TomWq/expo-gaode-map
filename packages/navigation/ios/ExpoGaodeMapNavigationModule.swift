//
//  ExpoGaodeMapNavigationModule.swift
//  expo-gaode-map-navigation
//
//  高德地图导航模块
//
//  仅保留：路径规划（拆分为与官方文档一致的类别）
//  1. 驾车/货车 路线规划（routes/drive）
//  2. 骑行/步行 路线规划（routes/walkride）
//  3. 独立路径规划（services）
//

import ExpoModulesCore
import AMapNaviKit

public class ExpoGaodeMapNavigationModule: Module {
  
  // 分门别类的算路计算器（与官方文档分类一致）
  private var driveTruckCalculator: DriveTruckRouteCalculator?
  private var walkRideCalculator: WalkRideRouteCalculator?
  
  // 独立路径规划管理
  private let independentRouteManager = IndependentRouteManager()
  private var independentRouteService: IndependentRouteService?
  
  // MARK: - 高德 SDK 初始化检查
  
  /// 检查高德地图 SDK 是否已初始化
  private func checkAMapInitialization() throws {
    // 先检查是否已经通过代码设置了 API Key
    var apiKey = AMapServices.shared().apiKey
    
    // 如果没有设置,尝试从 Info.plist 读取并设置
    if apiKey == nil || apiKey?.isEmpty == true {
      if let infoPlistKey = Bundle.main.object(forInfoDictionaryKey: "AMapApiKey") as? String,
         !infoPlistKey.isEmpty {
        // 从 Info.plist 读取到了 Key,设置到 SDK
        AMapServices.shared().apiKey = infoPlistKey
        apiKey = infoPlistKey
        print("✅ [ExpoGaodeMapNavigation] 已从 Info.plist 读取并设置高德地图 API Key")
      }
    }
    
    // 再次检查是否成功设置
    if apiKey == nil || apiKey?.isEmpty == true {
      throw NSError(
        domain: "ExpoGaodeMapNavigation",
        code: -1001,
        userInfo: [
          NSLocalizedDescriptionKey: "高德地图 SDK 未初始化",
          NSLocalizedFailureReasonErrorKey: "请在 app.json 中配置高德地图 API Key",
          NSLocalizedRecoverySuggestionErrorKey: """
            请按照以下步骤配置:
            1. 在 app.json 的 plugins 中添加:
            ["expo-gaode-map-navigation", {
              "ios_app_key": "your_ios_key_here"
            }]
            2. 运行 npx expo prebuild --clean
            3. 重新启动应用
            
            详细文档: https://github.com/TomWq/expo-gaode-map
            """
        ]
      )
    }
  }
  
  /// 在需要使用导航功能前进行初始化检查
  private func ensureInitialized() throws {
    try checkAMapInitialization()
  }
  
  public func definition() -> ModuleDefinition {
    Name("ExpoGaodeMapNavigation")
    
    Events(
      "onCalculateRouteSuccess",
      "onCalculateRouteFailure"
    )
    
    OnDestroy {
      driveTruckCalculator?.destroy()
      walkRideCalculator?.destroy()
      driveTruckCalculator = nil
      walkRideCalculator = nil
      independentRouteService = nil
      independentRouteManager.clearAll()
    }
    
    // 初始化导航
    Function("initNavigation") { () -> Bool in
      do {
        try self.ensureInitialized()
        self.ensureDriveTruck()
        self.ensureWalkRide()
        return true
      } catch {
        let errorMessage = self.formatError(error)
        print("⚠️ [ExpoGaodeMapNavigation] 初始化失败: \(errorMessage)")
        throw error
      }
    }
    
    // 销毁所有路径计算器
    Function("destroyAllCalculators") { () -> Void in
      self.driveTruckCalculator?.destroy()
      self.walkRideCalculator?.destroy()
      self.driveTruckCalculator = nil
      self.walkRideCalculator = nil
      self.independentRouteService = nil
      self.independentRouteManager.clearAll()
      print("✅ [ExpoGaodeMapNavigation] 已清理所有路径计算器实例")
    }
    
    // ---------------- 1. 驾车/货车 路线规划 ----------------
    
    AsyncFunction("calculateDriveRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureDriveTruck().calculateDriveRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
    
    AsyncFunction("calculateTruckRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureDriveTruck().calculateTruckRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
    
    // ---------------- 2. 骑行/步行 路线规划 ----------------
    
    AsyncFunction("calculateWalkRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureWalkRide().calculateWalkRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
    
    AsyncFunction("calculateRideRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureWalkRide().calculateRideRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
    
    // ---------------- 3. 独立路径规划 ----------------
    
    AsyncFunction("independentDriveRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureIndependentService().independentDriveRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
    
    AsyncFunction("independentTruckRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureIndependentService().independentTruckRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
    
    AsyncFunction("independentWalkRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureIndependentService().independentWalkRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
    
    AsyncFunction("independentRideRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureIndependentService().independentRideRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
    
    AsyncFunction("independentMotorcycleRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureIndependentService().independentMotorcycleRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
    
    // 选择独立路线
    AsyncFunction("selectIndependentRoute") { (options: [String: Any], promise: Promise) in
      guard let token = options["token"] as? Int else {
        promise.reject("INVALID_TOKEN", "token is required")
        return
      }
      let routeId = options["routeId"] as? Int
      let routeIndex = options["routeIndex"] as? Int
      let ok = self.independentRouteManager.select(token: token, routeId: routeId, routeIndex: routeIndex)
      promise.resolve(ok)
    }
    
    // 使用独立路径启动导航
    AsyncFunction("startNaviWithIndependentPath") { (options: [String: Any], promise: Promise) in
      guard let token = options["token"] as? Int else {
        promise.reject("INVALID_TOKEN", "token is required")
        return
      }
      let routeId = options["routeId"] as? Int
      let routeIndex = options["routeIndex"] as? Int
      let naviType = (options["naviType"] as? Int) ?? 0
      let ok = self.independentRouteManager.start(token: token, naviType: naviType, routeId: routeId, routeIndex: routeIndex)
      promise.resolve(ok)
    }
    
    // 清除独立路线
    AsyncFunction("clearIndependentRoute") { (options: [String: Any], promise: Promise) in
      guard let token = options["token"] as? Int else {
        promise.reject("INVALID_TOKEN", "token is required")
        return
      }
      let ok = self.independentRouteManager.clear(token)
      promise.resolve(ok)
    }
    
    // ---------------- 4. 摩托车 路线规划 ----------------
    
    AsyncFunction("calculateMotorcycleRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        // 摩托车复用驾车算路
        self.ensureDriveTruck().calculateDriveRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
    
    // ---------------- 5. 电动车 路线规划 ----------------
    
    AsyncFunction("calculateEBikeRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        // 电动车复用骑行算路
        self.ensureWalkRide().calculateRideRoute(options: options, promise: promise)
      } catch {
        promise.reject("AMAP_NOT_INITIALIZED", self.formatError(error))
      }
    }
  }
  
  // MARK: - Private
  
  private func ensureDriveTruck() -> DriveTruckRouteCalculator {
    if driveTruckCalculator == nil {
      driveTruckCalculator = DriveTruckRouteCalculator(module: self)
    }
    return driveTruckCalculator!
  }
  
  private func ensureWalkRide() -> WalkRideRouteCalculator {
    if walkRideCalculator == nil {
      walkRideCalculator = WalkRideRouteCalculator(module: self)
    }
    return walkRideCalculator!
  }
  
  private func ensureIndependentService() -> IndependentRouteService {
    if independentRouteService == nil {
      independentRouteService = IndependentRouteService(module: self, manager: independentRouteManager)
    }
    return independentRouteService!
  }
  
  // MARK: - 错误格式化
  
  /// 格式化错误信息为用户友好的文本
  private func formatError(_ error: Error) -> String {
    let nsError = error as NSError
    var message = nsError.localizedDescription
    
    if let reason = nsError.localizedFailureReason {
      message += "\n原因: \(reason)"
    }
    
    if let suggestion = nsError.localizedRecoverySuggestion {
      message += "\n\n解决方案:\n\(suggestion)"
    }
    
    return message
  }
}
