//
//  ExpoGaodeMapNaviView.swift
//  expo-gaode-map-navigation
//
//  
//

import Foundation
import ExpoModulesCore
import AMapNaviKit
import AVFAudio
import CoreLocation

final class ExpoGaodeMapCustomDriveView: AMapNaviDriveView {
  var suppressLaneInfoUI: Bool = false
  var suppressTopInfoUI: Bool = false {
    didSet {
      scheduleTopInfoSuppressionPasses()
      setNeedsLayout()
    }
  }
  private let topInfoCoverView: UIView = {
    let view = UIView()
    view.isHidden = true
    view.isUserInteractionEnabled = false
    view.backgroundColor = UIColor(red: 14.0 / 255.0, green: 18.0 / 255.0, blue: 26.0 / 255.0, alpha: 0.96)
    return view
  }()
  private var scheduledSuppressionPasses = 0

  override init(frame: CGRect) {
    super.init(frame: frame)
    installTopInfoCoverViewIfNeeded()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    installTopInfoCoverViewIfNeeded()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    applySuppressedChromeVisibility()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    installTopInfoCoverViewIfNeeded()
    if suppressTopInfoUI {
      scheduleTopInfoSuppressionPasses()
    }
  }

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

  private func applySuppressedChromeVisibility() {
    installTopInfoCoverViewIfNeeded()
    let topCandidates = collectTopInfoCandidates()
    for candidate in topCandidates {
      candidate.isHidden = suppressTopInfoUI
      candidate.alpha = suppressTopInfoUI ? 0.0 : 1.0
    }

    guard suppressTopInfoUI, !topCandidates.isEmpty else {
      topInfoCoverView.isHidden = true
      return
    }

    let unionFrame = topCandidates.reduce(CGRect.null) { partial, view in
      let frame = view.convert(view.bounds, to: self)
      return partial.union(frame)
    }
    let fallbackFrame = CGRect(x: 0, y: 0, width: bounds.width, height: min(max(bounds.height * 0.17, 96), 150))
    let targetFrame = (unionFrame.isNull ? fallbackFrame : unionFrame.insetBy(dx: -8, dy: -6)).intersection(bounds)
    topInfoCoverView.frame = targetFrame
    topInfoCoverView.isHidden = targetFrame.isEmpty
    if !topInfoCoverView.isHidden {
      bringSubviewToFront(topInfoCoverView)
    }
  }

  private func collectTopInfoCandidates() -> [UIView] {
    guard suppressTopInfoUI || !subviews.isEmpty else {
      return []
    }

    let protectedClassNameFragments = [
      "MAMap",
      "Lane",
      "Cross",
      "Eagle",
      "TrafficBar",
      "Compass",
      "Zoom",
      "Scale",
      "Logo",
    ]

    return allDescendantSubviews(of: self).filter { view in
      guard view !== self, view !== topInfoCoverView else {
        return false
      }

      let frame = view.convert(view.bounds, to: self)
      guard !frame.isEmpty else {
        return false
      }

      let className = NSStringFromClass(type(of: view))
      if protectedClassNameFragments.contains(where: { className.localizedCaseInsensitiveContains($0) }) {
        return false
      }

      let topBandMaxY = min(max(bounds.height * 0.28, 150), 220)
      guard frame.minY <= topBandMaxY && frame.maxY <= topBandMaxY + 70 else {
        return false
      }

      guard frame.height >= 12 && frame.height <= 140 && frame.width >= 20 else {
        return false
      }

      // Keep small corner controls (for example compass / map tool buttons) out of the suppression set.
      let isCornerControl =
        frame.width <= 60 &&
        frame.height <= 60 &&
        (frame.minX <= 24 || frame.maxX >= bounds.width - 24)
      if isCornerControl {
        return false
      }

      return true
    }
  }

  private func allDescendantSubviews(of root: UIView) -> [UIView] {
    root.subviews.flatMap { subview in
      [subview] + allDescendantSubviews(of: subview)
    }
  }

  private func installTopInfoCoverViewIfNeeded() {
    guard topInfoCoverView.superview !== self else {
      return
    }
    addSubview(topInfoCoverView)
  }

  private func scheduleTopInfoSuppressionPasses() {
    scheduledSuppressionPasses = suppressTopInfoUI ? 18 : 0
    guard suppressTopInfoUI else {
      topInfoCoverView.isHidden = true
      return
    }
    runScheduledTopInfoSuppressionPass()
  }

  private func runScheduledTopInfoSuppressionPass() {
    applySuppressedChromeVisibility()
    guard scheduledSuppressionPasses > 0 else {
      return
    }
    scheduledSuppressionPasses -= 1
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) { [weak self] in
      self?.runScheduledTopInfoSuppressionPass()
    }
  }

  func refreshSuppressedTopInfoUIIfNeeded() {
    guard suppressTopInfoUI else {
      return
    }
    applySuppressedChromeVisibility()
  }
}

private struct NaviCustomWaypointMarkerModel {
  let latitude: Double
  let longitude: Double
  let title: String
  var arrived: Bool = false
}

private final class NaviCustomWaypointTailView: UIView {
  override init(frame: CGRect) {
    super.init(frame: frame)
    backgroundColor = .clear
    isOpaque = false
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    backgroundColor = .clear
    isOpaque = false
  }

  override func draw(_ rect: CGRect) {
    guard let context = UIGraphicsGetCurrentContext() else {
      return
    }

    let fillColor = UIColor(red: 47.0 / 255.0, green: 103.0 / 255.0, blue: 255.0 / 255.0, alpha: 1)
    let strokeColor = UIColor.white
    let path = UIBezierPath()
    path.move(to: CGPoint(x: rect.midX, y: rect.maxY - 1))
    path.addLine(to: CGPoint(x: 1.5, y: 1.5))
    path.addLine(to: CGPoint(x: rect.maxX - 1.5, y: 1.5))
    path.close()

    context.saveGState()
    fillColor.setFill()
    strokeColor.setStroke()
    path.lineJoinStyle = .round
    path.lineWidth = 2.5
    path.fill()
    path.stroke()
    context.restoreGState()
  }
}

private final class NaviCustomWaypointBubbleView: UIView {
  init(title: String) {
    let font = UIFont.systemFont(ofSize: 17, weight: .semibold)
    let textWidth = ceil((title as NSString).size(withAttributes: [.font: font]).width)
    let bodyWidth = min(max(textWidth + 28, 62), 110)
    let size = CGSize(width: bodyWidth, height: 50)
    super.init(frame: CGRect(origin: .zero, size: size))

    backgroundColor = .clear
    isOpaque = false

    let bodyView = UIView(frame: CGRect(x: 0, y: 0, width: bodyWidth, height: 34))
    bodyView.backgroundColor = UIColor(red: 47.0 / 255.0, green: 103.0 / 255.0, blue: 255.0 / 255.0, alpha: 1)
    bodyView.layer.cornerRadius = 17
    bodyView.layer.borderWidth = 2
    bodyView.layer.borderColor = UIColor.white.cgColor
    bodyView.layer.shadowColor = UIColor(red: 21.0 / 255.0, green: 53.0 / 255.0, blue: 127.0 / 255.0, alpha: 1).cgColor
    bodyView.layer.shadowOpacity = 0.18
    bodyView.layer.shadowRadius = 6
    bodyView.layer.shadowOffset = CGSize(width: 0, height: 3)
    addSubview(bodyView)

    let label = UILabel(frame: bodyView.bounds.insetBy(dx: 10, dy: 4))
    label.text = title
    label.textAlignment = .center
    label.textColor = .white
    label.font = font
    bodyView.addSubview(label)

    let tailWidth: CGFloat = 14
    let tailHeight: CGFloat = 14
    let tailView = NaviCustomWaypointTailView(
      frame: CGRect(
        x: (bodyWidth - tailWidth) / 2,
        y: bodyView.frame.maxY - 1,
        width: tailWidth,
        height: tailHeight
      )
    )
    addSubview(tailView)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
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
  let onTrafficStatusesUpdate = EventDispatcher()
  
  // MARK: - Properties
  private var driveView: AMapNaviDriveView?
  private var pendingShowUIElements: Bool?
  private var hasStartedNavi: Bool = false
  private var hasReceivedFirstNaviData: Bool = false
  private var driveManager: AMapNaviDriveManager?
  private var lastKnownSpeed: Int = 0
  private var currentRouteTotalLength: Int?
  private var lastNavigationInfoPayload: [String: Any]?
  private var lastTurnIconType: Int?
  private var lastNextTurnIconType: Int?
  private var lastTurnIconImageUri: String?
  private var lastNextTurnIconImageUri: String?
  private var lastTurnIconBase64: String?
  private var trafficBarTotalLength: Int?
  private var isCrossVisible: Bool = false
  private var isLaneInfoVisible: Bool = false
  private var isNavigationAudioSessionActive: Bool = false
  private var hasLoggedMissingBackgroundAudioMode: Bool = false
  private var renderedCustomWaypointAnnotations: [AMapNaviCompositeCustomAnnotation] = []
  private var customWaypointMarkers: [NaviCustomWaypointMarkerModel] = []

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
  var carImageSource: String? {
    didSet { applyCarImageSource() }
  }
  var carImageSize: CGSize? {
    didSet { applyCarImageSource() }
  }
  var carCompassImageSource: String? {
    didSet { applyCarCompassImageSource() }
  }
  var startPointImageSource: String? {
    didSet { applyStartPointImageSource() }
  }
  var wayPointImageSource: String? {
    didSet { applyWayPointImageSource() }
  }
  var customWaypointMarkerPayloads: [[String: Any]]? {
    didSet { applyCustomWaypointMarkerPayloads(customWaypointMarkerPayloads) }
  }
  var endPointImageSource: String? {
    didSet { applyEndPointImageSource() }
  }
  var cameraImageSource: String? {
    didSet { applyCameraImageSource() }
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
  var trafficBarFrame: CGRect = .zero {
    didSet { applyTrafficBarFrame(trafficBarFrame) }
  }
  var trafficBarColors: [String: Any]? {
    didSet { applyTrafficBarColors(trafficBarColors) }
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
  var showGreyAfterPass: Bool = true {
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
      scheduleOverviewRouteVisibleRegionRefresh()
    }
  }
  var screenAnchor: CGPoint = .zero {
    didSet {
      driveView?.screenAnchor = screenAnchor
      scheduleOverviewRouteVisibleRegionRefresh()
    }
  }
  var hideNativeTopInfoLayout: Bool = false {
    didSet { applyHideNativeTopInfoLayout(hideNativeTopInfoLayout) }
  }
  var hideNativeLaneInfoLayout: Bool = false {
    didSet { applyHideNativeLaneInfoLayout(hideNativeLaneInfoLayout) }
  }
  var iosLiveActivityEnabled: Bool = false {
    didSet {
      if iosLiveActivityEnabled {
        syncNavigationLiveActivityWithLastPayload()
      } else {
        NavigationLiveActivityManager.shared.stop()
      }
    }
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
    activateNavigationAudioSessionIfNeeded(reason: "setup_navi_view")
    
    // 初始化导航视图
    let customDriveView = ExpoGaodeMapCustomDriveView(frame: bounds)
    customDriveView.suppressTopInfoUI = hideNativeTopInfoLayout
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
    applyDriveManagerBackgroundLocationOptionsIfNeeded()
    driveManager?.removeDataRepresentative(self)
    if let view = driveView {
      driveManager?.removeDataRepresentative(view)
      driveManager?.addDataRepresentative(view)
    }
    driveManager?.addDataRepresentative(self)
  }

  private func applyDriveManagerBackgroundLocationOptionsIfNeeded() {
    guard let driveManager else {
      return
    }
    driveManager.pausesLocationUpdatesAutomatically = false
    let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String]
    if backgroundModes?.contains("location") == true {
      driveManager.allowsBackgroundLocationUpdates = true
    }
  }

  private func hasBackgroundAudioModeEnabled() -> Bool {
    let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String]
    return backgroundModes?.contains("audio") == true
  }

  private func activateNavigationAudioSessionIfNeeded(reason: String) {
    guard enableVoice else {
      return
    }

    if !hasBackgroundAudioModeEnabled(), !hasLoggedMissingBackgroundAudioMode {
      hasLoggedMissingBackgroundAudioMode = true
      NSLog(
        "[ExpoGaodeMapNaviView][Audio] UIBackgroundModes 缺少 audio，切后台后语音可能中断。reason=%@",
        reason
      )
    }

    let audioSession = AVAudioSession.sharedInstance()
    do {
      try audioSession.setCategory(
        .playback,
        mode: .voicePrompt,
        options: [.duckOthers, .allowBluetooth, .allowBluetoothA2DP]
      )
      try audioSession.setActive(true)
      isNavigationAudioSessionActive = true
      NSLog("[ExpoGaodeMapNaviView][Audio] activated. reason=%@", reason)
    } catch {
      NSLog(
        "[ExpoGaodeMapNaviView][Audio] activate failed. reason=%@ error=%@",
        reason,
        String(describing: error)
      )
    }
  }

  private func deactivateNavigationAudioSessionIfNeeded(reason: String) {
    guard isNavigationAudioSessionActive else {
      return
    }
    let audioSession = AVAudioSession.sharedInstance()
    do {
      try audioSession.setActive(false, options: [.notifyOthersOnDeactivation])
      isNavigationAudioSessionActive = false
      NSLog("[ExpoGaodeMapNaviView][Audio] deactivated. reason=%@", reason)
    } catch {
      NSLog(
        "[ExpoGaodeMapNaviView][Audio] deactivate failed. reason=%@ error=%@",
        reason,
        String(describing: error)
      )
    }
  }

  private func resetTransientNavigationState() {
    hasStartedNavi = false
    currentRouteTotalLength = nil
    trafficBarTotalLength = nil
    lastNavigationInfoPayload = nil
    lastTurnIconType = nil
    lastNextTurnIconType = nil
    lastTurnIconBase64 = nil
    clearCachedTurnIconUris()
    isCrossVisible = false
    isLaneInfoVisible = false
    resetCustomWaypointArrivalState()
    emitVisualStateUpdate()
    NavigationLiveActivityManager.shared.stop()
    deactivateNavigationAudioSessionIfNeeded(reason: "reset_transient_navigation_state")
  }

  private func emitVisualStateUpdate() {
    onNavigationVisualStateUpdate([
      "isCrossVisible": isCrossVisible,
      // iOS 官方导航 SDK 公开的是 showCrossImage / hideCrossImage，
      // 当前没有 Android showModeCross / hideModeCross 对等的 3D 路口模型接口。
      "isModeCrossVisible": false,
      "isLaneInfoVisible": isLaneInfoVisible
    ])
  }

  private func emitNavigationInfoUpdate(_ payload: [String: Any]) {
    (driveView as? ExpoGaodeMapCustomDriveView)?.refreshSuppressedTopInfoUIIfNeeded()
    var nextPayload = payload
    let payloadIconType = payloadIntValue(nextPayload["iconType"]) ?? 0
    if payloadIconType <= 0, let lastTurnIconType {
      nextPayload["iconType"] = lastTurnIconType
      nextPayload["iconDirection"] = lastTurnIconType
    }
    let payloadNextIconType = payloadIntValue(nextPayload["nextIconType"]) ?? 0
    if payloadNextIconType <= 0, let lastNextTurnIconType {
      nextPayload["nextIconType"] = lastNextTurnIconType
    }
    if let lastTurnIconImageUri {
      nextPayload["turnIconImage"] = lastTurnIconImageUri
    } else {
      nextPayload.removeValue(forKey: "turnIconImage")
    }
    if let lastNextTurnIconImageUri {
      nextPayload["nextTurnIconImage"] = lastNextTurnIconImageUri
    } else {
      nextPayload.removeValue(forKey: "nextTurnIconImage")
    }
    lastNavigationInfoPayload = nextPayload
    onNavigationInfoUpdate(nextPayload)
    syncNavigationLiveActivity(payload: nextPayload)
  }

  private func reemitLastNavigationInfoIfNeeded() {
    guard var nextPayload = lastNavigationInfoPayload else {
      return
    }
    if let lastTurnIconType {
      nextPayload["iconType"] = lastTurnIconType
      nextPayload["iconDirection"] = lastTurnIconType
    }
    if let lastNextTurnIconType {
      nextPayload["nextIconType"] = lastNextTurnIconType
    } else {
      nextPayload.removeValue(forKey: "nextIconType")
    }
    if let lastTurnIconImageUri {
      nextPayload["turnIconImage"] = lastTurnIconImageUri
    } else {
      nextPayload.removeValue(forKey: "turnIconImage")
    }
    if let lastNextTurnIconImageUri {
      nextPayload["nextTurnIconImage"] = lastNextTurnIconImageUri
    } else {
      nextPayload.removeValue(forKey: "nextTurnIconImage")
    }

    lastNavigationInfoPayload = nextPayload
    onNavigationInfoUpdate(nextPayload)
    syncNavigationLiveActivity(payload: nextPayload)
  }

  private func resolveAppDisplayName() -> String {
    let info = Bundle.main.infoDictionary
    if let displayName = info?["CFBundleDisplayName"] as? String, !displayName.isEmpty {
      return displayName
    }
    if let appName = info?["CFBundleName"] as? String, !appName.isEmpty {
      return appName
    }
    return "导航"
  }

  private func payloadIntValue(_ value: Any?) -> Int? {
    if let intValue = value as? Int {
      return intValue
    }
    if let numberValue = value as? NSNumber {
      return numberValue.intValue
    }
    if let doubleValue = value as? Double {
      return Int(doubleValue)
    }
    if let floatValue = value as? Float {
      return Int(floatValue)
    }
    return nil
  }

  private func makeLiveActivitySnapshot(payload: [String: Any]?) -> NavigationLiveActivitySnapshot? {
    guard let payload else {
      return nil
    }

    let remainDistance = payloadIntValue(payload["pathRetainDistance"]) ?? 0
    let routeTotalDistance = max(
      trafficBarTotalLength ?? 0,
      currentRouteTotalLength ?? 0,
      remainDistance
    )
    let remainTime = payloadIntValue(payload["pathRetainTime"]) ?? 0
    let stepRemainDistance = payloadIntValue(payload["curStepRetainDistance"]) ?? 0
    let iconType = payloadIntValue(payload["iconType"]) ?? 0
    let currentRoadName = (payload["currentRoadName"] as? String) ?? ""
    let nextRoadName = (payload["nextRoadName"] as? String) ?? ""

    return NavigationLiveActivitySnapshot(
      appName: resolveAppDisplayName(),
      currentRoadName: currentRoadName,
      nextRoadName: nextRoadName,
      pathRetainDistance: remainDistance,
      routeTotalDistance: routeTotalDistance,
      pathRetainTime: remainTime,
      curStepRetainDistance: stepRemainDistance,
      iconType: iconType,
      turnIconBase64: lastTurnIconBase64
    )
  }

  private func syncNavigationLiveActivity(payload: [String: Any]?) {
    guard iosLiveActivityEnabled else {
      return
    }
    guard hasStartedNavi else {
      return
    }

    guard let snapshot = makeLiveActivitySnapshot(payload: payload) else {
      return
    }
    NavigationLiveActivityManager.shared.startOrUpdate(snapshot: snapshot)
  }

  private func syncNavigationLiveActivityWithLastPayload() {
    syncNavigationLiveActivity(payload: lastNavigationInfoPayload)
  }

  private func normalizedTurnIconImage(_ image: UIImage) -> UIImage {
    guard image.imageOrientation != .up else {
      return image
    }
    let renderer = UIGraphicsImageRenderer(size: image.size)
    return renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: image.size))
    }
  }

  private func trimmedTransparentBoundsImage(_ image: UIImage) -> UIImage {
    guard let cgImage = image.cgImage else {
      return image
    }
    guard let dataProvider = cgImage.dataProvider, let data = dataProvider.data else {
      return image
    }

    let bytes = CFDataGetBytePtr(data)
    let bytesPerPixel = max(cgImage.bitsPerPixel / 8, 0)
    let bytesPerRow = cgImage.bytesPerRow
    let width = cgImage.width
    let height = cgImage.height
    guard let bytes, bytesPerPixel >= 4, width > 0, height > 0 else {
      return image
    }

    let alphaOffset: Int
    switch cgImage.alphaInfo {
    case .premultipliedLast, .last, .noneSkipLast:
      alphaOffset = 3
    case .premultipliedFirst, .first, .noneSkipFirst:
      alphaOffset = 0
    default:
      return image
    }

    var minX = width
    var minY = height
    var maxX = -1
    var maxY = -1
    let alphaThreshold: UInt8 = 8

    for y in 0..<height {
      let rowStart = y * bytesPerRow
      for x in 0..<width {
        let pixelStart = rowStart + x * bytesPerPixel
        let alpha = bytes[pixelStart + alphaOffset]
        if alpha > alphaThreshold {
          minX = min(minX, x)
          minY = min(minY, y)
          maxX = max(maxX, x)
          maxY = max(maxY, y)
        }
      }
    }

    guard maxX >= minX, maxY >= minY else {
      return image
    }

    let cropRect = CGRect(
      x: minX,
      y: minY,
      width: (maxX - minX + 1),
      height: (maxY - minY + 1)
    )
    guard let croppedCGImage = cgImage.cropping(to: cropRect) else {
      return image
    }
    return UIImage(cgImage: croppedCGImage, scale: image.scale, orientation: .up)
  }

  private func aspectFitRect(sourceSize: CGSize, targetSize: CGSize) -> CGRect {
    guard sourceSize.width > 0, sourceSize.height > 0, targetSize.width > 0, targetSize.height > 0 else {
      return CGRect(origin: .zero, size: targetSize)
    }
    let scale = min(targetSize.width / sourceSize.width, targetSize.height / sourceSize.height)
    let drawSize = CGSize(width: sourceSize.width * scale, height: sourceSize.height * scale)
    return CGRect(
      x: (targetSize.width - drawSize.width) / 2.0,
      y: (targetSize.height - drawSize.height) / 2.0,
      width: drawSize.width,
      height: drawSize.height
    )
  }

  private func encodeTurnIconForLiveActivity(_ image: UIImage?) -> String? {
    guard let image else {
      return nil
    }

    let maxEncodedLength = 2600
    let targetSizes: [CGSize] = [
      CGSize(width: 34, height: 34),
      CGSize(width: 30, height: 30),
      CGSize(width: 26, height: 26),
      CGSize(width: 28, height: 28),
      CGSize(width: 24, height: 24),
      CGSize(width: 20, height: 20)
    ]
    let preparedImage = trimmedTransparentBoundsImage(normalizedTurnIconImage(image))

    for size in targetSizes {
      let renderer = UIGraphicsImageRenderer(size: size)
      let rendered = renderer.image { _ in
        let rect = aspectFitRect(sourceSize: preparedImage.size, targetSize: size)
        preparedImage.draw(in: rect)
      }

      if let pngData = rendered.pngData() {
        let pngBase64 = pngData.base64EncodedString()
        if pngBase64.count <= maxEncodedLength {
          return pngBase64
        }
      }
    }

    NSLog("[ExpoGaodeMapNaviView][LiveActivity] turn icon dropped because encoded payload is too large")
    return nil
  }

  private func cacheTurnIconImage(_ image: UIImage?, prefix: String, previousUri: String?) -> String? {
    guard let image, let data = image.pngData() else {
      if let previousUri {
        deleteCachedTurnIcon(at: previousUri)
      }
      return nil
    }

    let filename = "\(prefix)_\(UUID().uuidString).png"
    let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)

    do {
      try data.write(to: fileURL, options: .atomic)
      if let previousUri, previousUri != fileURL.absoluteString {
        deleteCachedTurnIcon(at: previousUri)
      }
      return fileURL.absoluteString
    } catch {
      return previousUri
    }
  }

  private func deleteCachedTurnIcon(at uriString: String) {
    guard let fileURL = URL(string: uriString), fileURL.isFileURL else {
      return
    }
    try? FileManager.default.removeItem(at: fileURL)
  }

  private func clearCachedTurnIconUris() {
    if let lastTurnIconImageUri {
      deleteCachedTurnIcon(at: lastTurnIconImageUri)
    }
    if let lastNextTurnIconImageUri {
      deleteCachedTurnIcon(at: lastNextTurnIconImageUri)
    }
    lastTurnIconImageUri = nil
    lastNextTurnIconImageUri = nil
    lastTurnIconBase64 = nil
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
    driveView?.showUIElements = showUIElements
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
    applyTrafficBarFrame(trafficBarFrame)
    applyTrafficBarColors(trafficBarColors)
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
    applyCustomAnnotationImages()
    applyCustomUILayoutOptionsIfNeeded()
  }

  private func applyCustomAnnotationImages() {
    applyCarImageSource()
    applyCarCompassImageSource()
    applyStartPointImageSource()
    applyWayPointImageSource()
    applyEndPointImageSource()
    applyCameraImageSource()
  }

  private func applyCustomWaypointMarkerPayloads(_ payloads: [[String: Any]]?) {
    customWaypointMarkers = (payloads ?? []).compactMap { item in
      guard
        let latitude = item["latitude"] as? Double,
        let longitude = item["longitude"] as? Double
      else {
        return nil
      }

      let title = (item["title"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines)
      return NaviCustomWaypointMarkerModel(
        latitude: latitude,
        longitude: longitude,
        title: (title?.isEmpty == false ? title : nil) ?? "途经"
      )
    }

    refreshCustomWaypointAnnotations()
  }

  private func clearCustomWaypointAnnotations() {
    guard let driveView else {
      renderedCustomWaypointAnnotations.removeAll()
      return
    }

    for annotation in renderedCustomWaypointAnnotations {
      driveView.remove(annotation)
    }
    renderedCustomWaypointAnnotations.removeAll()
  }

  private func refreshCustomWaypointAnnotations() {
    clearCustomWaypointAnnotations()

    guard let driveView else {
      return
    }

    renderedCustomWaypointAnnotations = customWaypointMarkers.compactMap { marker in
      guard !marker.arrived else {
        return nil
      }

      let coordinate = CLLocationCoordinate2D(
        latitude: marker.latitude,
        longitude: marker.longitude
      )
      let bubbleView = NaviCustomWaypointBubbleView(title: marker.title)
      guard let annotation = AMapNaviCompositeCustomAnnotation(
        coordinate: coordinate,
        view: bubbleView
      ) else {
        return nil
      }

      driveView.add(annotation)
      return annotation
    }
  }

  private func resetCustomWaypointArrivalState() {
    customWaypointMarkers = customWaypointMarkers.map { marker in
      var nextMarker = marker
      nextMarker.arrived = false
      return nextMarker
    }
    refreshCustomWaypointAnnotations()
  }

  private func markNearestCustomWaypointArrived(_ point: AMapNaviPoint) {
    guard !customWaypointMarkers.isEmpty else {
      return
    }

    let targetLatitude = Double(point.latitude)
    let targetLongitude = Double(point.longitude)
    let nextIndex = customWaypointMarkers.enumerated()
      .filter { !$0.element.arrived }
      .min { lhs, rhs in
        let lhsDistance = abs(lhs.element.latitude - targetLatitude) + abs(lhs.element.longitude - targetLongitude)
        let rhsDistance = abs(rhs.element.latitude - targetLatitude) + abs(rhs.element.longitude - targetLongitude)
        return lhsDistance < rhsDistance
      }?
      .offset

    guard let nextIndex else {
      return
    }

    customWaypointMarkers[nextIndex].arrived = true
    refreshCustomWaypointAnnotations()
  }

  private func resolveLocalImage(_ source: String) -> UIImage? {
    if source.hasPrefix("file://") {
      let path = String(source.dropFirst(7))
      return UIImage(contentsOfFile: path)
    }

    return UIImage(named: source) ?? UIImage(contentsOfFile: source)
  }

  private func applyAnnotationImage(
    source: String?,
    currentSource: @escaping () -> String?,
    apply: @escaping (UIImage?) -> Void
  ) {
    guard let source, !source.isEmpty else {
      apply(nil)
      return
    }

    if source.hasPrefix("http://") || source.hasPrefix("https://") {
      DispatchQueue.global().async {
        let image: UIImage? = {
          guard let url = URL(string: source),
                let data = try? Data(contentsOf: url) else {
            return nil
          }
          return UIImage(data: data)
        }()

        DispatchQueue.main.async {
          guard currentSource() == source else {
            return
          }
          apply(image)
        }
      }
      return
    }

    apply(resolveLocalImage(source))
  }

  private func resizeImageIfNeeded(_ image: UIImage?, targetSize: CGSize?) -> UIImage? {
    guard let image else {
      return nil
    }

    guard let targetSize, targetSize.width > 0, targetSize.height > 0 else {
      return image
    }

    let renderer = UIGraphicsImageRenderer(size: targetSize)
    return renderer.image { _ in
      image.draw(in: CGRect(origin: .zero, size: targetSize))
    }
  }

  private func applyCarImageSource() {
    guard let driveView else {
      return
    }
    applyAnnotationImage(source: carImageSource, currentSource: { [weak self] in
      self?.carImageSource
    }) { [weak self, weak driveView] image in
      let resizedImage = self?.resizeImageIfNeeded(image, targetSize: self?.carImageSize) ?? image
      driveView?.setCarImage(resizedImage)
    }
  }

  private func applyCarCompassImageSource() {
    guard let driveView else {
      return
    }
    applyAnnotationImage(source: carCompassImageSource, currentSource: { [weak self] in
      self?.carCompassImageSource
    }) { [weak driveView] image in
      driveView?.setCarCompassImage(image)
    }
  }

  private func applyStartPointImageSource() {
    guard let driveView else {
      return
    }
    applyAnnotationImage(source: startPointImageSource, currentSource: { [weak self] in
      self?.startPointImageSource
    }) { [weak driveView] image in
      driveView?.setStartPointImage(image)
    }
  }

  private func applyWayPointImageSource() {
    guard let driveView else {
      return
    }
    applyAnnotationImage(source: wayPointImageSource, currentSource: { [weak self] in
      self?.wayPointImageSource
    }) { [weak driveView] image in
      driveView?.setWayPointImage(image)
    }
  }

  private func applyEndPointImageSource() {
    guard let driveView else {
      return
    }
    applyAnnotationImage(source: endPointImageSource, currentSource: { [weak self] in
      self?.endPointImageSource
    }) { [weak driveView] image in
      driveView?.setEndPointImage(image)
    }
  }

  private func applyCameraImageSource() {
    guard let driveView else {
      return
    }
    applyAnnotationImage(source: cameraImageSource, currentSource: { [weak self] in
      self?.cameraImageSource
    }) { [weak driveView] image in
      driveView?.setCameraImage(image)
    }
  }

  private func applyShowUIElementsToDriveViewIfReady() {
    guard let driveView else {
      pendingShowUIElements = showUIElements
      return
    }
    let value = pendingShowUIElements ?? showUIElements
    pendingShowUIElements = nil
    driveView.showUIElements = value
    applyCustomUILayoutOptionsIfNeeded()
  }

  private func applyCustomUILayoutOptionsIfNeeded() {
    guard let driveView else {
      return
    }

    guard showUIElements == false else {
      return
    }

    // In custom UI mode, these properties are controlled independently from
    // the built-in widget layer and should be re-applied after toggling it off.
    driveView.showCrossImage = realCrossDisplay
    driveView.showTrafficBar = showTrafficBar
    applyTrafficBarFrame(trafficBarFrame)
    applyTrafficBarColors(trafficBarColors)
    driveView.screenAnchor = screenAnchor
    driveView.setNeedsLayout()
    driveView.layoutIfNeeded()
    scheduleOverviewRouteVisibleRegionRefresh()
  }

  private func refreshOverviewRouteVisibleRegionIfNeeded() {
    guard showUIElements == false, let driveView else {
      return
    }

    guard driveView.showMode == .overview else {
      return
    }

    driveView.updateRoutePolylineInTheVisualRangeWhenTheShowModeIsOverview()
  }

  private func scheduleOverviewRouteVisibleRegionRefresh() {
    DispatchQueue.main.async { [weak self] in
      self?.driveView?.setNeedsLayout()
      self?.driveView?.layoutIfNeeded()
      self?.refreshOverviewRouteVisibleRegionIfNeeded()
    }
  }

  private func applyHideNativeLaneInfoLayout(_ hidden: Bool) {
    (driveView as? ExpoGaodeMapCustomDriveView)?.suppressLaneInfoUI = hidden
  }

  private func applyHideNativeTopInfoLayout(_ hidden: Bool) {
    (driveView as? ExpoGaodeMapCustomDriveView)?.suppressTopInfoUI = hidden
    driveView?.setNeedsLayout()
    driveView?.layoutIfNeeded()
  }

  private func applyTrafficBarFrame(_ frame: CGRect) {
    guard let driveView else {
      return
    }

    guard frame.width > 0, frame.height > 0 else {
      return
    }

    driveView.tmcRouteFrame = frame
  }

  private func applyTrafficBarColors(_ colors: [String: Any]?) {
    guard let driveView, let colors else {
      return
    }

    let mappings: [(String, AMapNaviRouteStatus)] = [
      ("unknown", .unknow),
      ("smooth", .smooth),
      ("fineOpen", .fineOpen),
      ("slow", .slow),
      ("jam", .jam),
      ("seriousJam", .seriousJam),
      ("defaultRoad", .default),
    ]

    let resolvedColors = mappings.compactMap { key, status -> AMapNaviTMCStatusColor? in
      guard let value = colors[key], let color = ColorParser.parseColor(value) else {
        return nil
      }
      let item = AMapNaviTMCStatusColor()
      item.status = status
      item.color = color
      return item
    }

    guard !resolvedColors.isEmpty else {
      return
    }

    driveView.tmcRouteColor = resolvedColors
  }

  private func emitTrafficStatusesUpdate(_ trafficStatuses: [AMapNaviTrafficStatus]?) {
    let totalLengthFromTraffic = (trafficStatuses ?? []).reduce(0) { partial, status in
      partial + max(status.length, 0)
    }

    if totalLengthFromTraffic > 0 {
      if let retainDistance = lastNavigationInfoPayload?["pathRetainDistance"] as? Int {
        if totalLengthFromTraffic >= retainDistance {
          trafficBarTotalLength = totalLengthFromTraffic
        }
      } else {
        trafficBarTotalLength = totalLengthFromTraffic
      }
    }

    // iOS 会提供 fineStatus；统一事件结构时保留它，方便 RN 自绘层按需细化颜色策略。
    let items = (trafficStatuses ?? []).map { status in
      var payload: [String: Any] = [
        "status": Int(status.status.rawValue),
        "length": status.length
      ]
      payload["fineStatus"] = status.trafficFineStatus
      return payload
    }

    var payload: [String: Any] = [
      "items": items
    ]

    let resolvedTotalLength = max(trafficBarTotalLength ?? 0, currentRouteTotalLength ?? 0)
    if resolvedTotalLength > 0 {
      payload["totalLength"] = resolvedTotalLength
    } else if totalLengthFromTraffic > 0 {
      payload["totalLength"] = totalLengthFromTraffic
    } else if let totalLength = currentRouteTotalLength, totalLength > 0 {
      payload["totalLength"] = totalLength
    }

    if let retainDistance = lastNavigationInfoPayload?["pathRetainDistance"] as? Int {
      payload["retainDistance"] = retainDistance
    }

    onTrafficStatusesUpdate(payload)
  }

  // MARK: - Prop Setters
  private func applyShowCamera(_ show: Bool) {
    driveView?.showCamera = show
  }
  
  private func applyEnableVoice(_ enabled: Bool) {
    driveManager?.isUseInternalTTS = enabled
    if enabled {
      activateNavigationAudioSessionIfNeeded(reason: "enable_voice_true")
    } else {
      deactivateNavigationAudioSessionIfNeeded(reason: "enable_voice_false")
    }
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
    scheduleOverviewRouteVisibleRegionRefresh()
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
    scheduleOverviewRouteVisibleRegionRefresh()
  }
  
  deinit {
    NavigationLiveActivityManager.shared.stop()
    deactivateNavigationAudioSessionIfNeeded(reason: "deinit")
    driveManager?.stopNavi()
    clearCustomWaypointAnnotations()
    if let view = driveView {
      driveManager?.removeDataRepresentative(view)
    }
    driveManager?.removeDataRepresentative(self)
    driveManager?.delegate = nil
    clearCachedTurnIconUris()
  }
}

// MARK: - AMapNaviDriveManagerDelegate
extension ExpoGaodeMapNaviView: AMapNaviDriveManagerDelegate {
  private func makeArrivedLiveActivitySnapshot() -> NavigationLiveActivitySnapshot {
    let remainDistance = payloadIntValue(lastNavigationInfoPayload?["pathRetainDistance"]) ?? 0
    let routeTotalDistance = max(
      trafficBarTotalLength ?? 0,
      currentRouteTotalLength ?? 0,
      remainDistance
    )
    return NavigationLiveActivitySnapshot(
      appName: resolveAppDisplayName(),
      currentRoadName: "",
      nextRoadName: "",
      pathRetainDistance: 0,
      routeTotalDistance: routeTotalDistance,
      pathRetainTime: 0,
      curStepRetainDistance: 0,
      iconType: 15,
      turnIconBase64: nil
    )
  }

  private func handleArrivedDestination(source: String) {
    NSLog("[ExpoGaodeMapNaviView][LiveActivity] arrived destination callback received: %@", source)
    hasStartedNavi = false
    if iosLiveActivityEnabled {
      let arrivedSnapshot = makeArrivedLiveActivitySnapshot()
      NavigationLiveActivityManager.shared.showArrivedAndStop(snapshot: arrivedSnapshot, dismissAfter: 6)
    } else {
      NavigationLiveActivityManager.shared.stop()
    }
    onArriveDestination([:])
  }
  
  public func driveManager(onCalculateRouteSuccess driveManager: AMapNaviDriveManager) {
    hasStartedNavi = true
    applyDriveManagerBackgroundLocationOptionsIfNeeded()
    activateNavigationAudioSessionIfNeeded(reason: "calculate_route_success")
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
    DispatchQueue.main.async { [weak self] in
      self?.applyCustomAnnotationImages()
      self?.refreshCustomWaypointAnnotations()
    }
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, onCalculateRouteFailure error: Error) {
    onRouteCalculated([
      "success": false,
      "errorInfo": error.localizedDescription
    ])
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, didStartNavi naviMode: AMapNaviMode) {
    hasStartedNavi = true
    applyDriveManagerBackgroundLocationOptionsIfNeeded()
    activateNavigationAudioSessionIfNeeded(reason: "did_start_navi")
    onNavigationStarted([
      "type": naviMode == .emulator ? 1 : 0,
      "isEmulator": naviMode == .emulator
    ])

    applyShowUIElementsToDriveViewIfReady()
    refreshCustomWaypointAnnotations()
    syncNavigationLiveActivityWithLastPayload()
  }
  
  public func driveManagerNavi(_ driveManager: AMapNaviDriveManager, didArrive wayPoint: AMapNaviPoint) {
    markNearestCustomWaypointArrived(wayPoint)
    onWayPointArrived([
      "index": 0
    ])
  }
  
  public func driveManagerDidEndEmulatorNavi(_ driveManager: AMapNaviDriveManager) {
    resetTransientNavigationState()
    deactivateNavigationAudioSessionIfNeeded(reason: "did_end_emulator_navi")
    onNavigationEnded([:])
  }
  
  public func driveManager(_ driveManager: AMapNaviDriveManager, playNaviSound soundString: String, soundStringType: AMapNaviSoundType) {
    activateNavigationAudioSessionIfNeeded(reason: "play_navi_sound")
    onNavigationText([
      "type": soundStringType.rawValue,
      "text": soundString
    ])
  }
  
  /// 兼容一部分 SDK/Swift 导入下的到达终点回调签名
  public func driveManager(onArrivedDestination driveManager: AMapNaviDriveManager) {
    handleArrivedDestination(source: "driveManager(onArrivedDestination:)")
    deactivateNavigationAudioSessionIfNeeded(reason: "arrived_destination_named")
  }

  /// AMapNaviDriveManagerDelegate 官方到达终点回调
  public func driveManagerOnArrivedDestination(_ driveManager: AMapNaviDriveManager) {
    handleArrivedDestination(source: "driveManagerOnArrivedDestination")
    deactivateNavigationAudioSessionIfNeeded(reason: "arrived_destination_official")
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
    applyViewOptions()
    applyShowUIElementsToDriveViewIfReady()
    refreshCustomWaypointAnnotations()
    scheduleOverviewRouteVisibleRegionRefresh()
    onNavigationReady([:])
  }

  public func driveViewEdgePadding(_ driveView: AMapNaviDriveView) -> UIEdgeInsets {
    return driveViewEdgePadding
  }

  public func driveView(_ driveView: AMapNaviDriveView, didChange showMode: AMapNaviDriveViewShowMode) {
    if showMode == .overview {
      scheduleOverviewRouteVisibleRegionRefresh()
    }
  }
}

extension ExpoGaodeMapNaviView: AMapNaviDriveDataRepresentable {
  public func driveManager(_ driveManager: AMapNaviDriveManager, update naviRoute: AMapNaviRoute?) {
    if let routeLength = naviRoute?.routeLength, routeLength > 0 {
      currentRouteTotalLength = routeLength
    }
  }

  public func driveManager(_ driveManager: AMapNaviDriveManager, update naviLocation: AMapNaviLocation?) {
    guard let naviLocation else {
      return
    }
    if !hasReceivedFirstNaviData {
      hasReceivedFirstNaviData = true
      applyShowUIElementsToDriveViewIfReady()
    }
    lastKnownSpeed = Int(naviLocation.speed)
    onLocationUpdate([
      "latitude": naviLocation.coordinate.latitude,
      "longitude": naviLocation.coordinate.longitude,
      "speed": naviLocation.speed,
      "bearing": naviLocation.heading
    ])
  }

  public func driveManager(_ driveManager: AMapNaviDriveManager, update naviInfo: AMapNaviInfo?) {
    guard let naviInfo else {
      return
    }
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
      "iconType": naviInfo.iconType.rawValue,
      "iconDirection": naviInfo.iconType.rawValue,
      "currentSegmentIndex": naviInfo.currentSegmentIndex,
      "currentLinkIndex": naviInfo.currentLinkIndex,
      "currentPointIndex": naviInfo.currentPointIndex,
      "routeRemainTrafficLightCount": naviInfo.routeRemainTrafficLightCount,
      "driveDistance": naviInfo.routeDriveDistance,
      "driveTime": naviInfo.routeDriveTime
    ])
  }

  public func driveManager(_ driveManager: AMapNaviDriveManager, showCross crossImage: UIImage?) {
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

  public func driveManager(_ driveManager: AMapNaviDriveManager, updateTrafficStatus trafficStatus: [AMapNaviTrafficStatus]?) {
    emitTrafficStatusesUpdate(trafficStatus)
  }

  public func driveManager(_ driveManager: AMapNaviDriveManager, updateTurnIconImage turnIconImage: UIImage?, turn turnIconType: AMapNaviIconType) {
    lastTurnIconType = Int(turnIconType.rawValue)
    let encodedTurnIcon = encodeTurnIconForLiveActivity(turnIconImage)
    if let encodedTurnIcon {
      lastTurnIconBase64 = encodedTurnIcon
    } else if turnIconImage == nil {
      NSLog(
        "[ExpoGaodeMapNaviView][LiveActivity] turnIconImage is nil, keep previous turn icon snapshot"
      )
    }
    NSLog(
      "[ExpoGaodeMapNaviView][LiveActivity] turnIconType=%d, incomingBase64Length=%d, effectiveBase64Length=%d",
      Int(turnIconType.rawValue),
      encodedTurnIcon?.count ?? 0,
      lastTurnIconBase64?.count ?? 0
    )
    lastTurnIconImageUri = cacheTurnIconImage(
      turnIconImage,
      prefix: "turn_icon",
      previousUri: lastTurnIconImageUri
    )
    reemitLastNavigationInfoIfNeeded()
  }

  public func driveManager(_ driveManager: AMapNaviDriveManager, updateNextTurnIconImage turnIconImage: UIImage?, nextTurn turnIconType: AMapNaviIconType) {
    lastNextTurnIconType = Int(turnIconType.rawValue)
    lastNextTurnIconImageUri = cacheTurnIconImage(
      turnIconImage,
      prefix: "next_turn_icon",
      previousUri: lastNextTurnIconImageUri
    )
    reemitLastNavigationInfoIfNeeded()
  }
}
