//
//  ExpoGaodeMapNaviView.swift
//  expo-gaode-map-navigation
//
//  
//

import ExpoModulesCore
import AMapNaviKit

public class ExpoGaodeMapNaviView: ExpoView {
  
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
  
  // MARK: - Properties
  private var driveView: AMapNaviDriveView?
  private var driveManager: AMapNaviDriveManager?
  
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
  var showUIElements: Bool = true {
    didSet { driveView?.showUIElements = showUIElements }
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
  var mapViewModeType: Int = 0 {
    didSet { applyMapViewModeType(mapViewModeType) }
  }
  var lineWidth: CGFloat = 0 {
    didSet { driveView?.lineWidth = lineWidth }
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
    // 检查高德 SDK 是否已初始化
    do {
      try checkAMapInitialization()
    } catch {
      let errorMessage = formatError(error)
      // 触发初始化失败事件
      DispatchQueue.main.async {
        self.onNavigationFailed([
          "error": "AMAP_NOT_INITIALIZED",
          "message": errorMessage
        ])
      }
      return
    }
    
    // 初始化驾车导航管理器
    driveManager = AMapNaviDriveManager.sharedInstance()
    driveManager?.delegate = self
    
    // 使用内置语音
    driveManager?.isUseInternalTTS = true
    
    // 初始化导航视图
    driveView = AMapNaviDriveView(frame: bounds)
    driveView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    driveView?.delegate = self
    
    if let view = driveView {
      addSubview(view)
      driveManager?.addDataRepresentative(view)
    }
    
    // 应用初始配置
    applyViewOptions()
  }
  
  private func applyViewOptions() {
    // 通用属性
    driveView?.showCamera = showCamera
    driveView?.autoSwitchShowModeToCarPositionLocked = autoLockCar
    driveView?.autoZoomMapLevel = autoChangeZoom
    driveView?.showTrafficLayer = trafficLayerEnabled
    driveView?.showCrossImage = realCrossDisplay
    driveView?.trackingMode = naviMode == 0 ? .carNorth : .mapNorth
    
    // iOS 特有属性
    driveView?.showRoute = showRoute
    driveView?.showTurnArrow = showTurnArrow
    driveView?.showTrafficBar = showTrafficBar
    driveView?.showBrowseRouteButton = showBrowseRouteButton
    driveView?.showMoreButton = showMoreButton
    driveView?.showTrafficButton = showTrafficButton
    driveView?.showUIElements = showUIElements
    driveView?.showGreyAfterPass = showGreyAfterPass
    driveView?.showVectorline = showVectorline
    driveView?.showTrafficLights = showTrafficLights
    if lineWidth > 0 {
      driveView?.lineWidth = lineWidth
    }
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
    driveView?.showTrafficLayer = enabled
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
    // 再次检查初始化状态
    do {
      try checkAMapInitialization()
    } catch {
      promise.reject("AMAP_NOT_INITIALIZED", formatError(error))
      return
    }
    
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
  
  func stopNavigation(promise: Promise) {
    driveManager?.stopNavi()
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
    driveManager?.delegate = nil
  }
}

// MARK: - AMapNaviDriveManagerDelegate
extension ExpoGaodeMapNaviView: AMapNaviDriveManagerDelegate {
  
  public func driveManager(onCalculateRouteSuccess driveManager: AMapNaviDriveManager) {
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
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, onCalculateRouteFailure error: Error) {
    onRouteCalculated([
      "success": false,
      "errorInfo": error.localizedDescription
    ])
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, didStartNavi naviMode: AMapNaviMode) {
    onNavigationStarted([
      "type": naviMode == .emulator ? 1 : 0,
      "isEmulator": naviMode == .emulator
    ])
  }
  
  public func driveManagerNavi(_ driveManager: AMapNaviDriveManager, didArrive wayPoint: AMapNaviPoint) {
    onWayPointArrived([
      "index": 0
    ])
  }
  
  public func driveManagerDidEndEmulatorNavi(_ driveManager: AMapNaviDriveManager) {
    onNavigationEnded([:])
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, didUpdate naviLocation: AMapNaviLocation) {
    onLocationUpdate([
      "latitude": naviLocation.coordinate.latitude,
      "longitude": naviLocation.coordinate.longitude,
      "speed": naviLocation.speed,
      "bearing": naviLocation.heading
    ])
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, didUpdate naviInfo: AMapNaviInfo) {
    onNavigationInfoUpdate([
      "currentRoadName": naviInfo.currentRoadName ?? "",
      "nextRoadName": naviInfo.nextRoadName ?? "",
      "pathRetainDistance": naviInfo.routeRemainDistance,
      "pathRetainTime": naviInfo.routeRemainTime,
      "curStepRetainDistance": naviInfo.segmentRemainDistance,
      "curStepRetainTime": naviInfo.segmentRemainTime
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
    onNavigationReady([:])
  }
}
