//
//  DriveTruckRouteCalculator.swift
//  expo-gaode-map-navigation
//
//  驾车/货车/摩托车路线规划计算器
//  摩托车使用驾车接口，type=11
//
//  根据官方文档：
//  - AMapNaviDriveManager 是驾车/货车导航管理类
//  - 使用单例 [AMapNaviDriveManager sharedInstance]
//  - 提供四种驾车路线规划方法
//

import Foundation
import ExpoModulesCore
import AMapNaviKit

class DriveTruckRouteCalculator: NSObject {
  
  private weak var module: ExpoGaodeMapNavigationModule?
  private var driveManager: AMapNaviDriveManager?
  private var currentPromise: Promise?
  private var scene: String = "drive"
  private var isInitialized = false
  
  init(module: ExpoGaodeMapNavigationModule) {
    self.module = module
    super.init()
    initNavi()
  }
  
  private func initNavi() {
    // 使用单例获取驾车导航管理器
    driveManager = AMapNaviDriveManager.sharedInstance()
    driveManager?.delegate = self
    isInitialized = true
    NSLog("DriveTruckRouteCalculator: AMapNaviDriveManager 初始化成功")
  }

  private func bindDriveManagerDelegate() {
    driveManager = AMapNaviDriveManager.sharedInstance()
    driveManager?.delegate = self
  }

  private func resolveScene(options: [String: Any]) -> String {
    let carType = intValue(options["carType"]) ?? intValue(options["type"])
    switch carType {
    case 11:
      return "motorcycle"
    case 1, 3, 5:
      return "truck"
    default:
      return "drive"
    }
  }

  private func resolveDrivingStrategy(options: [String: Any]) -> AMapNaviDrivingStrategy {
    let strategyValue: Int
    if let rawStrategy = intValue(options["strategy"]) {
      strategyValue = rawStrategy
    } else {
      strategyValue = Converters.convertDrivingPreferenceToStrategy(
        multipleRoute: true,
        avoidCongestion: boolValue(options["avoidCongestion"]) ?? false,
        avoidHighway: boolValue(options["avoidHighway"]) ?? false,
        avoidCost: boolValue(options["avoidCost"]) ?? false,
        prioritiseHighway: boolValue(options["prioritiseHighway"]) ?? false
      )
    }
    return AMapNaviDrivingStrategy(rawValue: strategyValue)
      ?? AMapNaviDrivingStrategy.drivingStrategyMultipleDefault
  }

  private func applyVehicleInfoIfNeeded(options: [String: Any]) {
    let vehicleInfo = buildVehicleInfo(options: options)
    _ = driveManager?.setVehicleInfo(vehicleInfo)
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
    if let size = intValue(options["size"]) ?? intValue(options["vehicleSize"]) {
      vehicleInfo.size = size
      hasAnyValue = true
    }
    if let width = doubleValue(options["width"]) ?? doubleValue(options["vehicleWidth"]) {
      vehicleInfo.width = width
      hasAnyValue = true
    }
    if let height = doubleValue(options["height"]) ?? doubleValue(options["vehicleHeight"]) {
      vehicleInfo.height = height
      hasAnyValue = true
    }
    if let length = doubleValue(options["length"]) ?? doubleValue(options["vehicleLength"]) {
      vehicleInfo.length = length
      hasAnyValue = true
    }
    if let load = doubleValue(options["load"]) ?? doubleValue(options["vehicleLoad"]) {
      vehicleInfo.load = load
      hasAnyValue = true
    }
    if let weight = doubleValue(options["weight"]) ?? doubleValue(options["vehicleWeight"]) {
      vehicleInfo.weight = weight
      hasAnyValue = true
    }
    if let axisNums = intValue(options["axis"]) ?? intValue(options["axisNums"]) ?? intValue(options["vehicleAxis"]) {
      vehicleInfo.axisNums = axisNums
      hasAnyValue = true
    }
    if let isLoadIgnore = boolValue(options["isLoadIgnore"]) {
      vehicleInfo.isLoadIgnore = isLoadIgnore
      hasAnyValue = true
    }

    return hasAnyValue ? vehicleInfo : nil
  }

  private func boolValue(_ raw: Any?) -> Bool? {
    if let value = raw as? Bool { return value }
    if let value = raw as? NSNumber { return value.boolValue }
    if let value = raw as? String {
      switch value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
      case "true", "1", "yes":
        return true
      case "false", "0", "no":
        return false
      default:
        return nil
      }
    }
    return nil
  }

  private func intValue(_ raw: Any?) -> Int? {
    if let value = raw as? Int { return value }
    if let value = raw as? NSNumber { return value.intValue }
    if let value = raw as? String { return Int(value) }
    return nil
  }

  private func doubleValue(_ raw: Any?) -> Double? {
    if let value = raw as? Double { return value }
    if let value = raw as? Float { return Double(value) }
    if let value = raw as? NSNumber { return value.doubleValue }
    if let value = raw as? String { return Double(value) }
    return nil
  }

  private func nonEmptyString(_ raw: Any?) -> String? {
    guard let value = raw as? String else { return nil }
    let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
    return trimmed.isEmpty ? nil : trimmed
  }
  
  // MARK: - 驾车路径规划
  
  func calculateDriveRoute(options: [String: Any], promise: Promise) {
    NSLog("DriveTruckRouteCalculator: 开始计算驾车路线")
    bindDriveManagerDelegate()
    
    // 防重复调用检查
    if currentPromise != nil {
      promise.reject("BUSY", "Another route calculation is in progress")
      return
    }
    
    // 解析起终点
    let from = options["from"] as? [String: Any]
    guard let to = options["to"] as? [String: Any] else {
      promise.reject("INVALID_PARAMS", "to is required")
      return
    }
    
    // 解析途经点
    let wayPoints = Converters.parseWaypoints(options["waypoints"] as? [[String: Any]])
    let wayPOIInfos = Converters.parseNaviPOIInfos(options["waypoints"] as? [[String: Any]])
    let wayPointPOIIds = (options["waypoints"] as? [[String: Any]])?.compactMap { point in
      nonEmptyString(point["poiId"]) ?? nonEmptyString(point["mid"])
    }

    let strategy = resolveDrivingStrategy(options: options)

    NSLog("DriveTruckRouteCalculator: 使用策略值: \(strategy.rawValue), strategy: \(strategy.rawValue)")

    scene = resolveScene(options: options)
    currentPromise = promise
    applyVehicleInfoIfNeeded(options: options)
    
    var success = false
    
    // 根据是否有 POI ID 选择不同的算路方法
    if let fromMid = (from?["poiId"] ?? from?["mid"]) as? String,
       let toMid = (to["poiId"] ?? to["mid"]) as? String {
      // 使用 POI ID 算路（推荐方式）
      NSLog("DriveTruckRouteCalculator: 使用 POI ID 算路")
      success = driveManager?.calculateDriveRoute(
        withStartPointPOIId: fromMid,
        endPointPOIId: toMid,
        wayPointsPOIId: wayPointPOIIds,
        drivingStrategy: strategy
      ) ?? false
    } else if let fromInfo = Converters.parseNaviPOIInfo(from),
              let toInfo = Converters.parseNaviPOIInfo(to) {
      // 使用 POIInfo 算路（支持起点角度）
      NSLog("DriveTruckRouteCalculator: 使用 POIInfo 算路")

      // 官方方法：calculateDriveRouteWithStart:end:wayPOIInfos:drivingStrategy:
      success = driveManager?.calculateDriveRoute(
        withStart: fromInfo,
        end: toInfo,
        wayPOIInfos: wayPOIInfos,
        drivingStrategy: strategy
      ) ?? false
    } else if let fromPoint = from != nil ? Converters.parseNaviPoint(from!) : nil,
              let toPoint = Converters.parseNaviPoint(to) {
      // 使用经纬度算路
      NSLog("DriveTruckRouteCalculator: 使用经纬度算路（有起点）")
      success = driveManager?.calculateDriveRoute(
        withStart: [fromPoint],
        end: [toPoint],
        wayPoints: wayPoints,
        drivingStrategy: strategy
      ) ?? false
    } else if let toPoint = Converters.parseNaviPoint(to) {
      // 无起点算路（使用当前定位作为起点）
      NSLog("DriveTruckRouteCalculator: 使用经纬度算路（无起点，使用当前定位）")
      success = driveManager?.calculateDriveRoute(
        withEnd: [toPoint],
        wayPoints: wayPoints,
        drivingStrategy: strategy
      ) ?? false
    } else {
      currentPromise = nil
      promise.reject("INVALID_COORDS", "Invalid coordinates")
      return
    }
    
    NSLog("DriveTruckRouteCalculator: calculateDriveRoute 返回: \(success)")
    
    if !success {
      currentPromise = nil
      promise.reject("CALCULATE_FAILED", "路线规划启动失败")
    }
  }
  
  // MARK: - 货车路径规划
  
  func calculateTruckRoute(options: [String: Any], promise: Promise) {
    NSLog("DriveTruckRouteCalculator: 开始计算货车路线")
    var truckOptions = options
    if truckOptions["carType"] == nil && truckOptions["type"] == nil {
      truckOptions["carType"] = 1
    }
    calculateDriveRoute(options: truckOptions, promise: promise)
  }
  
  func destroy() {
    driveManager?.delegate = nil
    // 销毁单例
    AMapNaviDriveManager.destroyInstance()
    driveManager = nil
    currentPromise = nil
    isInitialized = false
  }
}

// MARK: - AMapNaviDriveManagerDelegate

extension DriveTruckRouteCalculator: AMapNaviDriveManagerDelegate {
  
  /// 路线规划成功回调
  func driveManager(_ driveManager: AMapNaviDriveManager, onCalculateRouteSuccessWith type: AMapNaviRoutePlanType) {
    NSLog("DriveTruckRouteCalculator: onCalculateRouteSuccess, type=\(type.rawValue)")
    
    guard let promise = currentPromise else { return }
    currentPromise = nil
    
    // 获取所有规划路线
    var routes: [[String: Any]] = []
    
    if let naviRoutes = driveManager.naviRoutes {
      for (routeId, route) in naviRoutes {
        routes.append([
          "id": routeId,
          "routeId": routeId,
          "distance": route.routeLength,
          "duration": route.routeTime,
          "tollCost": route.routeTollCost,
          "strategy": routeTitle(routeId: routeId as? Int ?? 0),
          "polyline": extractCoordinates(from: route)
        ])
      }
    } else if let naviRoute = driveManager.naviRoute {
      // 单路线
      routes.append([
        "id": 12,
        "routeId": 12,
        "distance": naviRoute.routeLength,
        "duration": naviRoute.routeTime,
        "tollCost": naviRoute.routeTollCost,
        "strategy": routeTitle(routeId: 12),
        "polyline": extractCoordinates(from: naviRoute)
      ])
    }
    
    promise.resolve([
      "success": true,
      "routes": routes
    ])
  }
  
  /// 路线规划失败回调
  func driveManager(_ driveManager: AMapNaviDriveManager, onCalculateRouteFailure error: Error) {
    NSLog("DriveTruckRouteCalculator: onCalculateRouteFailure, error=\(error.localizedDescription)")
    
    guard let promise = currentPromise else { return }
    currentPromise = nil
    
    promise.reject("CALCULATE_FAILED", error.localizedDescription)
  }
  
  /// 获取策略名称
  private func getStrategyName(routeId: Int) -> String {
    switch routeId {
    case 12: return "推荐路线"
    case 13: return "时间最短"
    case 14: return "距离最短"
    case 15: return "躲避拥堵"
    default: return "路线\(routeId - 11)"
    }
  }

  private func routeTitle(routeId: Int) -> String {
    switch scene {
    case "truck":
      return "货车路线"
    case "motorcycle":
      return "摩托车路线"
    default:
      return getStrategyName(routeId: routeId)
    }
  }
  
  /// 提取路线坐标点
  private func extractCoordinates(from route: AMapNaviRoute) -> [[String: Double]] {
    var coordinates: [[String: Double]] = []
    
    // 从routeCoordinates属性获取完整路径坐标
    let routeCoords = route.routeCoordinates
    if routeCoords.count > 0 {
      for coord in routeCoords {
        coordinates.append([
          "latitude": coord.latitude,
          "longitude": coord.longitude
        ])
      }
    }
    
    // 如果routeCoordinates为空，尝试从segments中提取坐标
    if coordinates.isEmpty {
      let segments = route.routeSegments
      if segments.count > 0 {
        for segment in segments {
          let segmentCoords = segment.coordinates
          if segmentCoords.count > 0 {
            for coord in segmentCoords {
              coordinates.append([
                "latitude": coord.latitude,
                "longitude": coord.longitude
              ])
            }
          }
        }
      }
    }
    
    NSLog("DriveTruckRouteCalculator: 提取到 \(coordinates.count) 个坐标点")
    return coordinates
  }
}
