//
//  ExpoGaodeMapNaviView.swift
//  expo-gaode-map-navigation
//
//  
//

import Foundation
import ExpoModulesCore
import AMapNaviKit

final class ExpoGaodeMapCustomDriveView: AMapNaviDriveView {
  var suppressLaneInfoUI: Bool = false

  override func driveManager(_ driveManager: AMapNaviDriveManager, showLaneBackInfo laneBackInfo: String, laneSelectInfo: String) {
    guard !suppressLaneInfoUI else {
      return
    }
    super.driveManager(driveManager, showLaneBackInfo: laneBackInfo, laneSelectInfo: laneSelectInfo)
  }

  override func driveManagerHideLaneInfo(_ driveManager: AMapNaviDriveManager) {
    guard !suppressLaneInfoUI else {
      return
    }
    super.driveManagerHideLaneInfo(driveManager)
  }
}

public class ExpoGaodeMapNaviView: ExpoView {
  private let independentRouteManager = IndependentRouteManager.shared
  
  // MARK: - 高德 SDK 初始化检查

  /// 检查隐私协议是否已完成并同步到各 SDK
  private func checkPrivacyReady() throws {
    GaodeMapPrivacyManager.restorePersistedState()
    guard GaodeMapPrivacyManager.isReady else {
      throw NSError(
        domain: "ExpoGaodeMapPrivacy",
        code: -1002,
        userInfo: [
          NSLocalizedDescriptionKey: "隐私协议未完成确认",
          NSLocalizedFailureReasonErrorKey: "请先调用 setPrivacyConfig（或 setPrivacyShow/setPrivacyAgree）并确保参数为 true",
          NSLocalizedRecoverySuggestionErrorKey: "建议在首次启动弹窗同意后再进入导航页面。"
        ]
      )
    }
    GaodeMapPrivacyManager.applyPrivacyState()
  }
  
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
        domain: "ExpoGaodeMapNaviView",
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

  /// 检查 iOS 是否配置了后台定位模式（避免导航启动时触发系统异常）
  private func ensureBackgroundLocationModeForNavigation() throws {
    let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String]
    guard backgroundModes?.contains("location") == true else {
      throw NSError(
        domain: "ExpoGaodeMapNaviView",
        code: -1003,
        userInfo: [
          NSLocalizedDescriptionKey: "iOS 后台定位模式未开启，无法安全启动导航",
          NSLocalizedFailureReasonErrorKey: "Info.plist 缺少 UIBackgroundModes: location",
          NSLocalizedRecoverySuggestionErrorKey: """
            请在 app.json 插件配置中开启后台定位后重新 prebuild：
            ["expo-gaode-map-navigation", {
              "enableBackgroundLocation": true
            }]
            然后执行：npx expo prebuild --clean
            """
        ]
      )
    }
  }
  
  /// 格式化错误信息
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
  
  // MARK: - Event Dispatchers
  let onNavigationReady = EventDispatcher()
  let onNavigationStarted = EventDispatcher()
  let onNavigationFailed = EventDispatcher()
  let onNavigationEnded = EventDispatcher()
  let onLocationUpdate = EventDispatcher()
  let onNavigationText = EventDispatcher()
  let onArriveDestination = EventDispatcher()
  let onRouteCalculated = EventDispatcher()
  let onRouteRecalculate = EventDispatcher()
  let onWayPointArrived = EventDispatcher()
  let onGpsStatusChanged = EventDispatcher()
  let onNavigationInfoUpdate = EventDispatcher()
  let onGpsSignalWeak = EventDispatcher()
  let onNavigationVisualStateUpdate = EventDispatcher()
  let onLaneInfoUpdate = EventDispatcher()
  
  // MARK: - Properties
  private var driveView: AMapNaviDriveView?
  private var driveViewLoaded: Bool = false
  private var pendingShowUIElements: Bool?
  private var pendingShowUIElementsWorkItem: DispatchWorkItem?
  private var hasStartedNavi: Bool = false
  private var hasReceivedFirstNaviData: Bool = false
  private var driveManager: AMapNaviDriveManager?
  private var lastKnownSpeed: Int = 0
  private var lastNavigationInfoPayload: [String: Any]?
  private var lastTurnIconType: Int?
  private var lastNextTurnIconType: Int?
  private var isCrossVisible: Bool = false
  private var isLaneInfoVisible: Bool = false

  private enum LaneStringKind {
    case background
    case selected
  }
  
  // Props - 通用属性
  var naviType: Int = 0 // 0: GPS, 1: Emulator
  var enableVoice: Bool = true {
    didSet { applyEnableVoice(enableVoice) }
  }
  var showCamera: Bool = true {
    didSet { applyShowCamera(showCamera) }
  }
  var autoLockCar: Bool = true {
    didSet { applyAutoLockCar(autoLockCar) }
  }
  var autoChangeZoom: Bool = true {
    didSet { applyAutoChangeZoom(autoChangeZoom) }
  }
  var trafficLayerEnabled: Bool = true {
    didSet { applyTrafficLayerEnabled(trafficLayerEnabled) }
  }
  var realCrossDisplay: Bool = true {
    didSet { applyRealCrossDisplay(realCrossDisplay) }
  }
  var naviMode: Int = 0 {
    didSet { applyNaviMode(naviMode) }
  }
  var showMode: Int = 1 {
    didSet { applyShowMode(showMode) }
  }
  var isNightMode: Bool = false {
    didSet { applyNightMode(isNightMode) }
  }
  
  // Props - iOS 特有属性
  var showRoute: Bool = true {
    didSet { driveView?.showRoute = showRoute }
  }
  var showTurnArrow: Bool = true {
    didSet { driveView?.showTurnArrow = showTurnArrow }
  }
  var showTrafficBar: Bool = true {
    didSet { driveView?.showTrafficBar = showTrafficBar }
  }
  var showBrowseRouteButton: Bool = true {
    didSet { driveView?.showBrowseRouteButton = showBrowseRouteButton }
  }
  var showMoreButton: Bool = true {
    didSet { driveView?.showMoreButton = showMoreButton }
  }
  var showTrafficButton: Bool = true {
    didSet { driveView?.showTrafficButton = showTrafficButton }
  }
  var showBackupRoute: Bool = true {
    didSet { driveView?.showBackupRoute = showBackupRoute }
  }
  var showEagleMap: Bool = false {
    didSet { driveView?.showEagleMap = showEagleMap }
  }
  var showUIElements: Bool = true {
    didSet { applyShowUIElementsToDriveViewIfReady() }
  }
  var showGreyAfterPass: Bool = false {
    didSet { driveView?.showGreyAfterPass = showGreyAfterPass }
  }
  var showVectorline: Bool = true {
    didSet { driveView?.showVectorline = showVectorline }
  }
  var showTrafficLights: Bool = true {
    didSet { driveView?.showTrafficLights = showTrafficLights }
  }
  var showCompassEnabled: Bool? {
    didSet {
      guard let showCompassEnabled else { return }
      driveView?.showCompass = showCompassEnabled
    }
  }
  var showDriveCongestion: Bool = true {
    didSet { driveView?.showDriveCongestion = showDriveCongestion }
  }
  var showTrafficLightView: Bool = true {
    didSet { driveView?.showTrafficLightView = showTrafficLightView }
  }
  var mapViewModeType: Int = 0 {
    didSet { applyMapViewModeType(mapViewModeType) }
  }
  var lineWidth: CGFloat = 0 {
    didSet { driveView?.lineWidth = lineWidth }
  }
  var driveViewEdgePadding: UIEdgeInsets = .zero {
    didSet {
      driveView?.setNeedsLayout()
      driveView?.layoutIfNeeded()
    }
  }
  var screenAnchor: CGPoint = .zero {
    didSet { driveView?.screenAnchor = screenAnchor }
  }
  var hideNativeLaneInfoLayout: Bool = false {
    didSet { applyHideNativeLaneInfoLayout(hideNativeLaneInfoLayout) }
  }

  func applyShowUIElements(_ visible: Bool) {
    showUIElements = visible
  }
  
  // 坐标
  private var startCoordinate: AMapNaviPoint?
  private var endCoordinate: AMapNaviPoint?
  
  // MARK: - Initialization
  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupNaviView()
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  // MARK: - Setup
  private func setupNaviView() {
    // 检查隐私状态 + SDK 初始化状态
    do {
      try checkPrivacyReady()
      try checkAMapInitialization()
    } catch {
      let errorMessage = formatError(error)
      let code = (error as NSError).domain == "ExpoGaodeMapPrivacy" ? "PRIVACY_NOT_AGREED" : "AMAP_NOT_INITIALIZED"
      // 触发初始化失败事件
      DispatchQueue.main.async {
        self.onNavigationFailed([
          "error": code,
          "message": errorMessage
        ])
      }
      return
    }
    
    // 初始化驾车导航管理器
    driveManager = AMapNaviDriveManager.sharedInstance()
    rebindDriveManagerToView()
    
    // 使用内置语音
    driveManager?.isUseInternalTTS = true
    
    // 初始化导航视图
    let customDriveView = ExpoGaodeMapCustomDriveView(frame: bounds)
    customDriveView.suppressLaneInfoUI = hideNativeLaneInfoLayout
    driveView = customDriveView
    driveView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    driveView?.delegate = self
    
    if let view = driveView {
      addSubview(view)
      driveManager?.addDataRepresentative(view)
    }
    
    // 应用初始配置
    applyViewOptions()
  }

  private func rebindDriveManagerToView() {
    driveManager = AMapNaviDriveManager.sharedInstance()
    driveManager?.delegate = self
    driveManager?.removeDataRepresentative(self)
    if let view = driveView {
      driveManager?.removeDataRepresentative(view)
      driveManager?.addDataRepresentative(view)
    }
    driveManager?.addDataRepresentative(self)
  }

  private func resetTransientNavigationState() {
    lastNavigationInfoPayload = nil
    lastTurnIconType = nil
    lastNextTurnIconType = nil
    isCrossVisible = false
    isLaneInfoVisible = false
    emitVisualStateUpdate()
  }

  private func emitVisualStateUpdate() {
    onNavigationVisualStateUpdate([
      "isCrossVisible": isCrossVisible,
      "isModeCrossVisible": false,
      "isLaneInfoVisible": isLaneInfoVisible
    ])
  }

  private func emitNavigationInfoUpdate(_ payload: [String: Any]) {
    var nextPayload = payload
    if let lastTurnIconType {
      nextPayload["iconType"] = lastTurnIconType
      nextPayload["iconDirection"] = lastTurnIconType
    }
    if let lastNextTurnIconType {
      nextPayload["nextIconType"] = lastNextTurnIconType
    }
    lastNavigationInfoPayload = nextPayload
    onNavigationInfoUpdate(nextPayload)
  }

  private func reemitLastNavigationInfoIfNeeded() {
    guard let lastNavigationInfoPayload else {
      return
    }

    var nextPayload = lastNavigationInfoPayload
    if let lastTurnIconType {
      nextPayload["iconType"] = lastTurnIconType
      nextPayload["iconDirection"] = lastTurnIconType
    }
    if let lastNextTurnIconType {
      nextPayload["nextIconType"] = lastNextTurnIconType
    } else {
      nextPayload.removeValue(forKey: "nextIconType")
    }

    lastNavigationInfoPayload = nextPayload
    onNavigationInfoUpdate(nextPayload)
  }

  private func splitLaneInfoString(_ value: String) -> [String] {
    value
      .split(separator: "|", omittingEmptySubsequences: false)
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
  }

  private func parseLaneToken(_ token: String, kind: LaneStringKind) -> Int? {
    guard !token.isEmpty else {
      return nil
    }

    if token == "255" || token == "ff" {
      return 255
    }

    // Older iOS callbacks may use `f` as filler / unavailable lane marker.
    if token == "f" {
      return kind == .background ? 255 : 255
    }

    if let decimalValue = Int(token) {
      return decimalValue
    }

    switch token {
    case "a":
      return 10
    case "b":
      return 11
    case "c":
      return 12
    case "d":
      return 13
    case "e":
      return 14
    case "g":
      return 16
    case "h":
      return 17
    case "i":
      return 18
    case "j":
      return 19
    case "k":
      return 20
    case "kk":
      return 21
    case "l":
      return 23
    default:
      return Int(token, radix: 16)
    }
  }

  private func serializeLaneInfo(laneBackInfo: String, laneSelectInfo: String) -> [String: Any]? {
    let backgroundLane = splitLaneInfoString(laneBackInfo).map {
      parseLaneToken($0, kind: .background) ?? 255
    }
    let frontLane = splitLaneInfoString(laneSelectInfo).map {
      parseLaneToken($0, kind: .selected) ?? 255
    }

    let sentinelIndex = backgroundLane.firstIndex(of: 255)
    let resolvedCount = [
      sentinelIndex,
      backgroundLane.isEmpty ? nil : backgroundLane.count,
      frontLane.isEmpty ? nil : frontLane.count
    ]
      .compactMap { $0 }
      .min() ?? 0

    guard resolvedCount > 0 else {
      return nil
    }

    let normalizedBackground = (0..<resolvedCount).map { index in
      backgroundLane.indices.contains(index) ? backgroundLane[index] : 255
    }
    let normalizedFront = (0..<resolvedCount).map { index in
      frontLane.indices.contains(index) ? frontLane[index] : 255
    }

    return [
      "laneCount": resolvedCount,
      "backgroundLane": normalizedBackground,
      "frontLane": normalizedFront
    ]
  }
  
  private func applyViewOptions() {
    // 通用属性
    driveView?.showCamera = showCamera
    driveView?.autoSwitchShowModeToCarPositionLocked = autoLockCar
    driveView?.autoZoomMapLevel = autoChangeZoom
    driveView?.mapShowTraffic = trafficLayerEnabled
    driveView?.showCrossImage = realCrossDisplay
    driveView?.trackingMode = naviMode == 0 ? .carNorth : .mapNorth
    
    // iOS 特有属性
    driveView?.showRoute = showRoute
    driveView?.showTurnArrow = showTurnArrow
    driveView?.showTrafficBar = showTrafficBar
    driveView?.showBrowseRouteButton = showBrowseRouteButton
    driveView?.showMoreButton = showMoreButton
    driveView?.showTrafficButton = showTrafficButton
    driveView?.showBackupRoute = showBackupRoute
    driveView?.showEagleMap = showEagleMap
    driveView?.showGreyAfterPass = showGreyAfterPass
    driveView?.showVectorline = showVectorline
    driveView?.showTrafficLights = showTrafficLights
    if let showCompassEnabled {
      driveView?.showCompass = showCompassEnabled
    }
    driveView?.showDriveCongestion = showDriveCongestion
    driveView?.showTrafficLightView = showTrafficLightView
    if lineWidth > 0 {
      driveView?.lineWidth = lineWidth
    }
    driveView?.screenAnchor = screenAnchor

    applyShowUIElementsToDriveViewIfReady()
  }

  private func applyShowUIElementsToDriveViewIfReady() {
    guard driveView != nil else {
      pendingShowUIElements = showUIElements
      return
    }

    guard driveViewLoaded else {
      pendingShowUIElements = showUIElements
      return
    }

    let value = pendingShowUIElements ?? showUIElements
    pendingShowUIElements = nil

    if value == false && (!hasStartedNavi || !hasReceivedFirstNaviData) {
      pendingShowUIElements = false
      pendingShowUIElementsWorkItem?.cancel()
      let workItem = DispatchWorkItem { [weak self] in
        guard let self else { return }
        self.applyDriveViewShowUIElements(true, remainingAttempts: 20)
      }
      pendingShowUIElementsWorkItem = workItem
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.08, execute: workItem)
      return
    }

    pendingShowUIElementsWorkItem?.cancel()
    let workItem = DispatchWorkItem { [weak self] in
      guard let self else { return }
      self.applyDriveViewShowUIElements(value, remainingAttempts: 20)
    }
    pendingShowUIElementsWorkItem = workItem

    DispatchQueue.main.asyncAfter(deadline: .now() + 0.08, execute: workItem)
  }

  private func applyHideNativeLaneInfoLayout(_ hidden: Bool) {
    (driveView as? ExpoGaodeMapCustomDriveView)?.suppressLaneInfoUI = hidden
  }

  private func applyDriveViewShowUIElements(_ value: Bool, remainingAttempts: Int) {
    guard let driveView else { return }

    if driveView.bounds.isEmpty {
      if remainingAttempts <= 0 {
        return
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self] in
        self?.applyDriveViewShowUIElements(value, remainingAttempts: remainingAttempts - 1)
      }
      return
    }

    driveView.showUIElements = value
  }

  // MARK: - Prop Setters
  private func applyShowCamera(_ show: Bool) {
    driveView?.showCamera = show
  }
  
  private func applyEnableVoice(_ enabled: Bool) {
    driveManager?.isUseInternalTTS = enabled
    // 内置语音会自动播报，不需要手动调用 startSpeak/stopSpeak
  }
  
  private func applyAutoLockCar(_ enabled: Bool) {
    driveView?.autoSwitchShowModeToCarPositionLocked = enabled
  }
  
  private func applyAutoChangeZoom(_ enabled: Bool) {
    driveView?.autoZoomMapLevel = enabled
  }
  
  private func applyTrafficLayerEnabled(_ enabled: Bool) {
    driveView?.mapShowTraffic = enabled
  }
  
  private func applyRealCrossDisplay(_ enabled: Bool) {
    driveView?.showCrossImage = enabled
  }
  
  private func applyNaviMode(_ mode: Int) {
    driveView?.trackingMode = mode == 0 ? .carNorth : .mapNorth
  }
  
  private func applyShowMode(_ mode: Int) {
    // 1: 锁车态, 2: 全览态, 3: 普通态
    switch mode {
    case 1:
      driveView?.showMode = .carPositionLocked
    case 2:
      driveView?.showMode = .overview
    case 3:
      driveView?.showMode = .normal
    default:
      break
    }
  }
  
  private func applyNightMode(_ enabled: Bool) {
    driveView?.mapViewModeType = enabled ? .night : .day
  }
  
  private func applyMapViewModeType(_ type: Int) {
    // 0: 白天, 1: 黑夜, 2: 自动切换, 3: 自定义
    switch type {
    case 0:
      driveView?.mapViewModeType = .day
    case 1:
      driveView?.mapViewModeType = .night
    case 2:
      driveView?.mapViewModeType = .dayNightAuto
    case 3:
      driveView?.mapViewModeType = .custom
    default:
      break
    }
  }
  
  // MARK: - Public Methods
  func startNavigation(startLat: Double, startLng: Double, endLat: Double, endLng: Double, promise: Promise) {
    // 再次检查隐私状态和初始化状态
    do {
      try checkPrivacyReady()
      try checkAMapInitialization()
      try ensureBackgroundLocationModeForNavigation()
    } catch {
      let nsError = error as NSError
      let code: String
      if nsError.domain == "ExpoGaodeMapPrivacy" {
        code = "PRIVACY_NOT_AGREED"
      } else if nsError.code == -1003 {
        code = "BACKGROUND_LOCATION_NOT_ENABLED"
      } else {
        code = "AMAP_NOT_INITIALIZED"
      }
      promise.reject(code, formatError(error))
      return
    }
    
    rebindDriveManagerToView()
    resetTransientNavigationState()

    startCoordinate = AMapNaviPoint.location(withLatitude: CGFloat(startLat), longitude: CGFloat(startLng))
    endCoordinate = AMapNaviPoint.location(withLatitude: CGFloat(endLat), longitude: CGFloat(endLng))
    
    guard let start = startCoordinate, let end = endCoordinate else {
      promise.reject("INVALID_COORDINATES", "无效的坐标")
      return
    }
    
    // 计算驾车路线
    let success = driveManager?.calculateDriveRoute(
      withStart: [start],
      end: [end],
      wayPoints: nil,
      drivingStrategy: AMapNaviDrivingStrategy.drivingStrategySingleDefault
    ) ?? false
    
    if success {
      promise.resolve([
        "success": true,
        "message": "路线规划中...",
        "naviType": naviType
      ])
    } else {
      promise.reject("CALCULATE_FAILED", "启动路线规划失败")
    }
  }

  func startNavigationWithIndependentPath(
    token: Int,
    routeId: Int?,
    routeIndex: Int?,
    naviType: Int?,
    promise: Promise
  ) {
    do {
      try checkPrivacyReady()
      try checkAMapInitialization()
      try ensureBackgroundLocationModeForNavigation()
    } catch {
      let nsError = error as NSError
      let code: String
      if nsError.domain == "ExpoGaodeMapPrivacy" {
        code = "PRIVACY_NOT_AGREED"
      } else if nsError.code == -1003 {
        code = "BACKGROUND_LOCATION_NOT_ENABLED"
      } else {
        code = "AMAP_NOT_INITIALIZED"
      }
      promise.reject(code, formatError(error))
      return
    }

    rebindDriveManagerToView()
    resetTransientNavigationState()

    if let naviType {
      self.naviType = naviType
    }

    let ok = independentRouteManager.start(
      token: token,
      naviType: self.naviType,
      routeId: routeId,
      routeIndex: routeIndex
    )

    if ok {
      promise.resolve([
        "success": true,
        "message": "独立路径导航启动中...",
        "token": token,
        "naviType": self.naviType
      ])
    } else {
      promise.reject("START_INDEPENDENT_NAVI_FAILED", "独立路径导航启动失败")
    }
  }
  
  func stopNavigation(promise: Promise) {
    driveManager?.stopNavi()
    resetTransientNavigationState()
    promise.resolve([
      "success": true,
      "message": "导航已停止"
    ])
  }
  
  func playCustomTTS(text: String, forcePlay: Bool, promise: Promise) {
    // iOS 使用内置 TTS，会自动播报导航语音
    promise.resolve([
      "success": true
    ])
  }
  
  // MARK: - Lifecycle
  public override func layoutSubviews() {
    super.layoutSubviews()
    driveView?.frame = bounds
  }
  
  deinit {
    driveManager?.stopNavi()
    if let view = driveView {
      driveManager?.removeDataRepresentative(view)
    }
    driveManager?.removeDataRepresentative(self)
    driveManager?.delegate = nil
  }
}

// MARK: - AMapNaviDriveManagerDelegate
extension ExpoGaodeMapNaviView: AMapNaviDriveManagerDelegate {
  
  public func driveManager(onCalculateRouteSuccess driveManager: AMapNaviDriveManager) {
    hasStartedNavi = true
    onRouteCalculated([
      "success": true,
      "naviType": naviType
    ])
    
    // 根据导航类型启动
    if naviType == 1 {
      driveManager.startEmulatorNavi()
    } else {
      driveManager.startGPSNavi()
    }

    applyShowUIElementsToDriveViewIfReady()
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, onCalculateRouteFailure error: Error) {
    onRouteCalculated([
      "success": false,
      "errorInfo": error.localizedDescription
    ])
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, didStartNavi naviMode: AMapNaviMode) {
    hasStartedNavi = true
    onNavigationStarted([
      "type": naviMode == .emulator ? 1 : 0,
      "isEmulator": naviMode == .emulator
    ])

    applyShowUIElementsToDriveViewIfReady()
  }
  
  public func driveManagerNavi(_ driveManager: AMapNaviDriveManager, didArrive wayPoint: AMapNaviPoint) {
    onWayPointArrived([
      "index": 0
    ])
  }
  
  public func driveManagerDidEndEmulatorNavi(_ driveManager: AMapNaviDriveManager) {
    resetTransientNavigationState()
    onNavigationEnded([:])
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, didUpdate naviLocation: AMapNaviLocation) {
    if !hasReceivedFirstNaviData {
      hasReceivedFirstNaviData = true
      applyShowUIElementsToDriveViewIfReady()
    }
    lastKnownSpeed = Int(naviLocation.speed.rounded())
    onLocationUpdate([
      "latitude": naviLocation.coordinate.latitude,
      "longitude": naviLocation.coordinate.longitude,
      "speed": naviLocation.speed,
      "bearing": naviLocation.heading
    ])
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, didUpdate naviInfo: AMapNaviInfo) {
    if !hasReceivedFirstNaviData {
      hasReceivedFirstNaviData = true
      applyShowUIElementsToDriveViewIfReady()
    }
    emitNavigationInfoUpdate([
      "naviMode": naviInfo.naviMode.rawValue,
      "currentRoadName": naviInfo.currentRoadName ?? "",
      "nextRoadName": naviInfo.nextRoadName ?? "",
      "pathRetainDistance": naviInfo.routeRemainDistance,
      "pathRetainTime": naviInfo.routeRemainTime,
      "curStepRetainDistance": naviInfo.segmentRemainDistance,
      "curStepRetainTime": naviInfo.segmentRemainTime,
      "currentSpeed": lastKnownSpeed,
      "iconType": lastTurnIconType ?? naviInfo.iconType.rawValue,
      "iconDirection": lastTurnIconType ?? naviInfo.iconType.rawValue,
      "currentSegmentIndex": naviInfo.currentSegmentIndex,
      "currentLinkIndex": naviInfo.currentLinkIndex,
      "currentPointIndex": naviInfo.currentPointIndex,
      "routeRemainTrafficLightCount": naviInfo.routeRemainTrafficLightCount,
      "driveDistance": naviInfo.routeDriveDistance,
      "driveTime": naviInfo.routeDriveTime
    ])
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, playNaviSound soundString: String, soundStringType: AMapNaviSoundType) {
    onNavigationText([
      "type": soundStringType.rawValue,
      "text": soundString
    ])
  }
  
  public func driveManager(onArrivedDestination driveManager: AMapNaviDriveManager) {
    onArriveDestination([:])
  }
  
  public func driveManagerOnReCalculateRoute(forYaw driveManager: AMapNaviDriveManager) {
    onRouteRecalculate([
      "reason": "yaw"
    ])
  }
  
  public func driveManagerOnReCalculateRoute(forTrafficJam driveManager: AMapNaviDriveManager) {
    onRouteRecalculate([
      "reason": "traffic"
    ])
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, update gpsSignalStrength: AMapNaviGPSSignalStrength) {
    let isWeak = gpsSignalStrength == .weak || gpsSignalStrength == .none
    onGpsSignalWeak([
      "isWeak": isWeak
    ])
  }
}

// MARK: - AMapNaviDriveViewDelegate
extension ExpoGaodeMapNaviView: AMapNaviDriveViewDelegate {
  
  public func driveViewDidLoad(_ driveView: AMapNaviDriveView) {
    driveViewLoaded = true
    applyViewOptions()
    applyShowUIElementsToDriveViewIfReady()
    onNavigationReady([:])
  }

  public func driveViewEdgePadding(_ driveView: AMapNaviDriveView) -> UIEdgeInsets {
    return driveViewEdgePadding
  }
}

extension ExpoGaodeMapNaviView: AMapNaviDriveDataRepresentable {
  public func driveManager(_ driveManager: AMapNaviDriveManager, showCrossImage crossImage: UIImage?) {
    isCrossVisible = true
    emitVisualStateUpdate()
  }

  public func driveManagerHideCrossImage(_ driveManager: AMapNaviDriveManager) {
    isCrossVisible = false
    emitVisualStateUpdate()
  }

  public func driveManager(_ driveManager: AMapNaviDriveManager, showLaneBackInfo laneBackInfo: String, laneSelectInfo: String) {
    isLaneInfoVisible = true
    emitVisualStateUpdate()
    if let payload = serializeLaneInfo(laneBackInfo: laneBackInfo, laneSelectInfo: laneSelectInfo) {
      onLaneInfoUpdate(payload)
    }
  }

  public func driveManagerHideLaneInfo(_ driveManager: AMapNaviDriveManager) {
    isLaneInfoVisible = false
    emitVisualStateUpdate()
  }

  public func driveManager(_ driveManager: AMapNaviDriveManager, updateTurnIconImage turnIconImage: UIImage?, turnIconType: AMapNaviIconType) {
    lastTurnIconType = Int(turnIconType.rawValue)
    reemitLastNavigationInfoIfNeeded()
  }

  public func driveManager(_ driveManager: AMapNaviDriveManager, updateNextTurnIconImage turnIconImage: UIImage?, nextTurnIconType turnIconType: AMapNaviIconType) {
    lastNextTurnIconType = Int(turnIconType.rawValue)
    reemitLastNavigationInfoIfNeeded()
  }
}
