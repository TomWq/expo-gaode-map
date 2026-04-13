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
import UIKit

public class ExpoGaodeMapNavigationModule: Module {
  
  // 分门别类的算路计算器（与官方文档分类一致）
  private var driveTruckCalculator: DriveTruckRouteCalculator?
  private var walkRideCalculator: WalkRideRouteCalculator?
  
  // 独立路径规划管理
  private let independentRouteManager = IndependentRouteManager()
  private var independentRouteService: IndependentRouteService?
  
  // 官方导航组件（iOS）
  private var officialCompositeManager: AMapNaviCompositeManager?
  
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
    try ensurePrivacyReady()
    try checkAMapInitialization()
  }

  /// 检查并同步隐私状态（导航 SDK 同样要求在调用任何接口前完成）
  private func ensurePrivacyReady() throws {
    GaodeMapPrivacyManager.restorePersistedState()
    guard GaodeMapPrivacyManager.isReady else {
      throw NSError(
        domain: "ExpoGaodeMapNavigation",
        code: -1002,
        userInfo: [
          NSLocalizedDescriptionKey: "隐私协议未完成确认",
          NSLocalizedFailureReasonErrorKey: "请在调用导航能力前先完成隐私协议弹窗与同意",
          NSLocalizedRecoverySuggestionErrorKey: "请先调用 setPrivacyConfig({ hasShow: true, hasContainsPrivacy: true, hasAgree: true })"
        ]
      )
    }
    GaodeMapPrivacyManager.applyPrivacyState()
  }
  
  public func definition() -> ModuleDefinition {
    Name("ExpoGaodeMapNavigation")

    OnCreate {
      GaodeMapPrivacyManager.restorePersistedState()
    }
    
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
      officialCompositeManager = nil
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
      self.officialCompositeManager = nil
      self.independentRouteManager.clearAll()
    }
    
    // ---------------- 1. 驾车/货车 路线规划 ----------------
    
    AsyncFunction("calculateDriveRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureDriveTruck().calculateDriveRoute(options: options, promise: promise)
      } catch {
        self.rejectInitializationError(promise, error: error)
      }
    }
    
    AsyncFunction("calculateTruckRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureDriveTruck().calculateTruckRoute(options: options, promise: promise)
      } catch {
        self.rejectInitializationError(promise, error: error)
      }
    }
    
    // ---------------- 2. 骑行/步行 路线规划 ----------------
    
    AsyncFunction("calculateWalkRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureWalkRide().calculateWalkRoute(options: options, promise: promise)
      } catch {
        self.rejectInitializationError(promise, error: error)
      }
    }
    
    AsyncFunction("calculateRideRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureWalkRide().calculateRideRoute(options: options, promise: promise)
      } catch {
        self.rejectInitializationError(promise, error: error)
      }
    }
    
    // ---------------- 3. 独立路径规划 ----------------
    
    AsyncFunction("independentDriveRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureIndependentService().independentDriveRoute(options: options, promise: promise)
      } catch {
        self.rejectInitializationError(promise, error: error)
      }
    }
    
    AsyncFunction("independentTruckRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureIndependentService().independentTruckRoute(options: options, promise: promise)
      } catch {
        self.rejectInitializationError(promise, error: error)
      }
    }
    
    AsyncFunction("independentWalkRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureIndependentService().independentWalkRoute(options: options, promise: promise)
      } catch {
        self.rejectInitializationError(promise, error: error)
      }
    }
    
    AsyncFunction("independentRideRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureIndependentService().independentRideRoute(options: options, promise: promise)
      } catch {
        self.rejectInitializationError(promise, error: error)
      }
    }
    
    AsyncFunction("independentMotorcycleRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        self.ensureIndependentService().independentMotorcycleRoute(options: options, promise: promise)
      } catch {
        self.rejectInitializationError(promise, error: error)
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
      do {
        try self.ensureInitialized()
      } catch {
        self.rejectInitializationError(promise, error: error)
        return
      }
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

    // 官方导航页（iOS: AMapNaviCompositeManager）
    AsyncFunction("openOfficialNaviPage") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
      } catch {
        self.rejectInitializationError(promise, error: error)
        return
      }
      self.openOfficialNaviPage(options: options, promise: promise)
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
        self.rejectInitializationError(promise, error: error)
      }
    }
    
    // ---------------- 5. 电动车 路线规划 ----------------
    
    AsyncFunction("calculateEBikeRoute") { (options: [String: Any], promise: Promise) in
      do {
        try self.ensureInitialized()
        // 电动车复用骑行算路
        self.ensureWalkRide().calculateRideRoute(options: options, promise: promise)
      } catch {
        self.rejectInitializationError(promise, error: error)
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

  private func rejectInitializationError(_ promise: Promise, error: Error) {
    let nsError = error as NSError
    let code = (nsError.domain == "ExpoGaodeMapNavigation" && nsError.code == -1002)
      ? "PRIVACY_NOT_AGREED"
      : "AMAP_NOT_INITIALIZED"
    promise.reject(code, formatError(error))
  }

  // MARK: - iOS 官方导航组件
  
  private func openOfficialNaviPage(options: [String: Any], promise: Promise) {
    DispatchQueue.main.async {
      do {
        let config = try self.createOfficialCompositeConfig(options: options)
        let manager = self.officialCompositeManager ?? AMapNaviCompositeManager()
        self.officialCompositeManager = manager
        self.invokeObjectSetter(
          target: manager,
          selectorName: "presentRoutePlanViewControllerWithOptions:",
          value: config
        )
        promise.resolve(true)
      } catch {
        promise.reject("OPEN_OFFICIAL_NAVI_PAGE_FAILED", self.formatError(error))
      }
    }
  }

  private func createOfficialCompositeConfig(options: [String: Any]) throws -> AMapNaviCompositeUserConfig {
    let config = AMapNaviCompositeUserConfig()

    if let presenter = currentPresenterViewController() {
      invokeObjectSetter(target: config, selectorName: "setPresenterViewController:", value: presenter)
    }

    if let from = options["from"] as? [String: Any] {
      try setRoutePlanPOI(
        config: config,
        poiType: 0,
        coordinate: from,
        fallbackName: "起点"
      )
    }

    guard let to = options["to"] as? [String: Any] else {
      throw NSError(
        domain: "ExpoGaodeMapNavigation",
        code: -2001,
        userInfo: [NSLocalizedDescriptionKey: "openOfficialNaviPage 参数缺少 to（终点）"]
      )
    }
    try setRoutePlanPOI(
      config: config,
      poiType: 1,
      coordinate: to,
      fallbackName: "终点"
    )

    if let waypoints = options["waypoints"] as? [Any] {
      for (index, item) in waypoints.prefix(3).enumerated() {
        guard let dict = item as? [String: Any] else { continue }
        try setRoutePlanPOI(
          config: config,
          poiType: 2,
          coordinate: dict,
          fallbackName: "途经点\(index + 1)"
        )
      }
    }

    let startNaviDirectly = boolValue(options["startNaviDirectly"])
      ?? ((options["pageType"] as? String)?.uppercased() == "NAVI")
    if let startNaviDirectly {
      invokeBoolSetter(target: config, selectorName: "setStartNaviDirectly:", value: startNaviDirectly)
    }

    if let needCalculateRoute = boolValue(options["needCalculateRouteWhenPresent"]) {
      invokeBoolSetter(target: config, selectorName: "setNeedCalculateRouteWhenPresent:", value: needCalculateRoute)
    }
    if let needDestroy = boolValue(options["needDestroyDriveManagerInstanceWhenNaviExit"]) {
      invokeBoolSetter(target: config, selectorName: "setNeedDestoryDriveManagerInstanceWhenDismiss:", value: needDestroy)
    }
    if let showExit = boolValue(options["showExitNaviDialog"]) {
      invokeBoolSetter(target: config, selectorName: "setNeedShowConfirmViewWhenStopGPSNavi:", value: showExit)
    }
    if let showNextRoadInfo = boolValue(options["showNextRoadInfo"]) {
      invokeBoolSetter(target: config, selectorName: "setShowNextRoadInfo:", value: showNextRoadInfo)
    }
    if let showCrossImage = boolValue(options["showCrossImage"]) {
      invokeBoolSetter(target: config, selectorName: "setShowCrossImage:", value: showCrossImage)
    }
    if let showPreference = boolValue(options["showRouteStrategyPreferenceView"]) {
      invokeBoolSetter(target: config, selectorName: "setShowDrivingStrategyPreferenceView:", value: showPreference)
    }
    if let multipleRoute = boolValue(options["multipleRouteNaviMode"]) {
      invokeBoolSetter(target: config, selectorName: "setMultipleRouteNaviMode:", value: multipleRoute)
    }
    if let truckMultipleRoute = boolValue(options["truckMultipleRouteNaviMode"]) {
      invokeBoolSetter(target: config, selectorName: "setTruckMultipleRouteNaviMode:", value: truckMultipleRoute)
    }
    if let showBackupRoute = boolValue(options["showBackupRoute"]) {
      invokeBoolSetter(target: config, selectorName: "setShowBackupRoute:", value: showBackupRoute)
    }
    if let trafficEnabled = boolValue(options["trafficEnabled"]) {
      invokeBoolSetter(target: config, selectorName: "setMapShowTraffic:", value: trafficEnabled)
    }
    if let autoZoom = boolValue(options["scaleAutoChangeEnable"]) {
      invokeBoolSetter(target: config, selectorName: "setAutoZoomMapLevel:", value: autoZoom)
    }
    if let showEagleMap = boolValue(options["showEagleMap"]) {
      invokeBoolSetter(target: config, selectorName: "setShowEagleMap:", value: showEagleMap)
    }
    if let showRestrict = boolValue(options["showRestrictareaEnable"]) {
      invokeBoolSetter(target: config, selectorName: "setShowRestrictareaEnable:", value: showRestrict)
    }
    if let removePolyline = boolValue(options["removePolylineAndVectorlineWhenArrivedDestination"]) {
      invokeBoolSetter(
        target: config,
        selectorName: "setRemovePolylineAndVectorlineWhenArrivedDestination:",
        value: removePolyline
      )
    }

    if let routeStrategy = intValue(options["routeStrategy"]) {
      invokeIntSetter(target: config, selectorName: "setDriveStrategy:", value: routeStrategy)
    }
    if let onlineCarHailingType = intValue(options["onlineCarHailingType"]) {
      _ = invokeIntReturnBoolSetter(
        target: config,
        selectorName: "setOnlineCarHailingType:",
        value: onlineCarHailingType
      )
    }

    if let themeRaw = parseThemeType(options["theme"]) {
      invokeIntSetter(target: config, selectorName: "setThemeType:", value: themeRaw)
    }
    if let mapMode = parseMapViewModeType(options: options) {
      invokeIntSetter(target: config, selectorName: "setMapViewModeType:", value: mapMode)
    }
    if let broadcastType = parseBroadcastType(options: options) {
      invokeUIntSetter(target: config, selectorName: "setBroadcastType:", value: UInt(broadcastType))
    }
    if let trackingMode = parseTrackingMode(options: options) {
      invokeIntSetter(target: config, selectorName: "setTrackingMode:", value: trackingMode)
    }

    if let carInfo = options["carInfo"] as? [String: Any],
       let vehicleInfo = buildVehicleInfo(options: carInfo) {
      invokeObjectSetter(target: config, selectorName: "setVehicleInfo:", value: vehicleInfo)
    }

    return config
  }

  private func setRoutePlanPOI(
    config: AMapNaviCompositeUserConfig,
    poiType: Int,
    coordinate: [String: Any],
    fallbackName: String
  ) throws {
    guard let latitude = doubleValue(coordinate["latitude"]),
          let longitude = doubleValue(coordinate["longitude"]) else {
      throw NSError(
        domain: "ExpoGaodeMapNavigation",
        code: -2002,
        userInfo: [NSLocalizedDescriptionKey: "坐标参数必须包含有效的 latitude/longitude"]
      )
    }

    let createdPoint = AMapNaviPoint.location(withLatitude: CGFloat(latitude), longitude: CGFloat(longitude))
    guard let point = (createdPoint as AMapNaviPoint?) else {
      throw NSError(
        domain: "ExpoGaodeMapNavigation",
        code: -2005,
        userInfo: [NSLocalizedDescriptionKey: "创建导航坐标失败"]
      )
    }
    let name = ((coordinate["name"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false)
      ? (coordinate["name"] as? String)
      : fallbackName
    let poiId = (coordinate["poiId"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)

    let selector = NSSelectorFromString("setRoutePlanPOIType:location:name:POIId:")
    guard config.responds(to: selector) else {
      throw NSError(
        domain: "ExpoGaodeMapNavigation",
        code: -2003,
        userInfo: [NSLocalizedDescriptionKey: "当前 iOS SDK 不支持 setRoutePlanPOIType 接口"]
      )
    }

    typealias Function = @convention(c) (
      AnyObject,
      Selector,
      Int,
      AMapNaviPoint,
      NSString?,
      NSString?
    ) -> Bool
    let implementation = config.method(for: selector)
    let function = unsafeBitCast(implementation, to: Function.self)
    let success = function(config, selector, poiType, point, name as NSString?, poiId as NSString?)
    if !success {
      throw NSError(
        domain: "ExpoGaodeMapNavigation",
        code: -2004,
        userInfo: [NSLocalizedDescriptionKey: "设置导航 POI 失败，请检查坐标或 POI 参数"]
      )
    }
  }

  private func buildVehicleInfo(options: [String: Any]) -> AMapNaviVehicleInfo? {
    let vehicleInfo = AMapNaviVehicleInfo()
    var hasAnyValue = false

    if let vehicleId = nonEmptyString(options["carNumber"]) {
      vehicleInfo.vehicleId = vehicleId
      hasAnyValue = true
    }
    if let restriction = boolValue(options["restriction"]) {
      vehicleInfo.isETARestriction = restriction
      hasAnyValue = true
    }
    if let type = intValue(options["carType"]) ?? intValue(options["type"]) {
      vehicleInfo.type = type
      hasAnyValue = true
    }
    if let motorcycleCC = intValue(options["motorcycleCC"]) {
      vehicleInfo.motorcycleCC = motorcycleCC
      hasAnyValue = true
    }
    if let size = intValue(options["vehicleSize"]) {
      vehicleInfo.size = size
      hasAnyValue = true
    }
    if let axisNums = intValue(options["vehicleAxis"]) {
      vehicleInfo.axisNums = axisNums
      hasAnyValue = true
    }
    if let width = doubleValue(options["vehicleWidth"]) {
      vehicleInfo.width = CGFloat(width)
      hasAnyValue = true
    }
    if let height = doubleValue(options["vehicleHeight"]) {
      vehicleInfo.height = CGFloat(height)
      hasAnyValue = true
    }
    if let length = doubleValue(options["vehicleLength"]) {
      vehicleInfo.length = CGFloat(length)
      hasAnyValue = true
    }
    if let load = doubleValue(options["vehicleLoad"]) {
      vehicleInfo.load = CGFloat(load)
      hasAnyValue = true
    }
    if let weight = doubleValue(options["vehicleWeight"]) {
      vehicleInfo.weight = CGFloat(weight)
      hasAnyValue = true
    }
    if let isLoadIgnore = boolValue(options["isLoadIgnore"]) {
      vehicleInfo.isLoadIgnore = isLoadIgnore
      hasAnyValue = true
    }

    return hasAnyValue ? vehicleInfo : nil
  }

  private func parseThemeType(_ raw: Any?) -> Int? {
    if let value = intValue(raw) {
      return value
    }
    guard let name = (raw as? String)?.trimmingCharacters(in: .whitespacesAndNewlines).uppercased(),
          !name.isEmpty else {
      return nil
    }
    switch name {
    case "BLUE", "DEFAULT":
      return 0
    case "WHITE", "LIGHT":
      return 1
    case "BLACK", "DARK":
      return 2
    default:
      return nil
    }
  }

  private func parseMapViewModeType(options: [String: Any]) -> Int? {
    if let raw = intValue(options["mapViewModeType"]) {
      return raw
    }
    guard let dayNightMode = intValue(options["dayAndNightMode"]) else {
      return nil
    }
    switch dayNightMode {
    case 0:
      return 2 // Android: 自动 -> iOS: DayNightAuto
    case 1:
      return 0 // Android: 白天 -> iOS: Day
    case 2:
      return 1 // Android: 夜间 -> iOS: Night
    default:
      return dayNightMode
    }
  }

  private func parseBroadcastType(options: [String: Any]) -> Int? {
    if let raw = intValue(options["broadcastType"]) {
      return raw
    }
    guard let broadcastMode = intValue(options["broadcastMode"]) else {
      return nil
    }
    switch broadcastMode {
    case 1:
      return 1 // Android: 简洁 -> iOS: concise
    case 2:
      return 0 // Android: 详细 -> iOS: detailed
    case 3:
      return 2 // Android: 静音 -> iOS: mute
    default:
      return broadcastMode
    }
  }

  private func parseTrackingMode(options: [String: Any]) -> Int? {
    if let raw = intValue(options["trackingMode"]) {
      return raw
    }
    guard let carDirectionMode = intValue(options["carDirectionMode"]) else {
      return nil
    }
    switch carDirectionMode {
    case 1:
      return 0 // Android: 正北向上 -> iOS: map north
    case 2:
      return 1 // Android: 车头向上 -> iOS: car north
    default:
      return carDirectionMode
    }
  }

  private func currentPresenterViewController() -> UIViewController? {
    guard let scene = UIApplication.shared.connectedScenes
      .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene else {
      return UIApplication.shared.windows.first(where: { $0.isKeyWindow })?.rootViewController
    }
    let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
      ?? scene.windows.first?.rootViewController
    return topViewController(from: root)
  }

  private func topViewController(from root: UIViewController?) -> UIViewController? {
    guard let root else { return nil }
    if let presented = root.presentedViewController {
      return topViewController(from: presented)
    }
    if let nav = root as? UINavigationController {
      return topViewController(from: nav.visibleViewController)
    }
    if let tab = root as? UITabBarController {
      return topViewController(from: tab.selectedViewController)
    }
    return root
  }

  private func invokeBoolSetter(target: NSObject, selectorName: String, value: Bool) {
    let selector = NSSelectorFromString(selectorName)
    guard target.responds(to: selector) else { return }
    typealias Function = @convention(c) (AnyObject, Selector, Bool) -> Void
    let implementation = target.method(for: selector)
    let function = unsafeBitCast(implementation, to: Function.self)
    function(target, selector, value)
  }

  private func invokeIntSetter(target: NSObject, selectorName: String, value: Int) {
    let selector = NSSelectorFromString(selectorName)
    guard target.responds(to: selector) else { return }
    typealias Function = @convention(c) (AnyObject, Selector, Int) -> Void
    let implementation = target.method(for: selector)
    let function = unsafeBitCast(implementation, to: Function.self)
    function(target, selector, value)
  }

  private func invokeUIntSetter(target: NSObject, selectorName: String, value: UInt) {
    let selector = NSSelectorFromString(selectorName)
    guard target.responds(to: selector) else { return }
    typealias Function = @convention(c) (AnyObject, Selector, UInt) -> Void
    let implementation = target.method(for: selector)
    let function = unsafeBitCast(implementation, to: Function.self)
    function(target, selector, value)
  }

  private func invokeIntReturnBoolSetter(target: NSObject, selectorName: String, value: Int) -> Bool? {
    let selector = NSSelectorFromString(selectorName)
    guard target.responds(to: selector) else { return nil }
    typealias Function = @convention(c) (AnyObject, Selector, Int) -> Bool
    let implementation = target.method(for: selector)
    let function = unsafeBitCast(implementation, to: Function.self)
    return function(target, selector, value)
  }

  private func invokeObjectSetter(target: NSObject, selectorName: String, value: AnyObject) {
    let selector = NSSelectorFromString(selectorName)
    guard target.responds(to: selector) else { return }
    typealias Function = @convention(c) (AnyObject, Selector, AnyObject) -> Void
    let implementation = target.method(for: selector)
    let function = unsafeBitCast(implementation, to: Function.self)
    function(target, selector, value)
  }

  private func boolValue(_ raw: Any?) -> Bool? {
    if let value = raw as? Bool { return value }
    if let value = raw as? NSNumber { return value.boolValue }
    if let value = raw as? String {
      let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      if normalized == "true" || normalized == "1" { return true }
      if normalized == "false" || normalized == "0" { return false }
    }
    return nil
  }

  private func intValue(_ raw: Any?) -> Int? {
    if let value = raw as? Int { return value }
    if let value = raw as? NSNumber { return value.intValue }
    if let value = raw as? String {
      return Int(value.trimmingCharacters(in: .whitespacesAndNewlines))
    }
    return nil
  }

  private func doubleValue(_ raw: Any?) -> Double? {
    if let value = raw as? Double { return value }
    if let value = raw as? Float { return Double(value) }
    if let value = raw as? NSNumber { return value.doubleValue }
    if let value = raw as? String {
      return Double(value.trimmingCharacters(in: .whitespacesAndNewlines))
    }
    return nil
  }

  private func nonEmptyString(_ raw: Any?) -> String? {
    guard let value = raw as? String else { return nil }
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed.isEmpty ? nil : trimmed
  }
}
