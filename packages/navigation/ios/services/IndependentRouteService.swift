//
//  IndependentRouteService.swift
//  expo-gaode-map-navigation
//
//  独立路径规划服务
//  驾车/货车/摩托车：优先使用官方独立算路回调（返回 AMapNaviRouteGroup）
//  步行/骑行：沿用对应 Manager 的标准算路回调
//

import Foundation
import ExpoModulesCore
import AMapNaviKit

class IndependentRouteService: NSObject {
  
  private weak var module: ExpoGaodeMapNavigationModule?
  private var independentRouteManager: IndependentRouteManager
  private var currentPromise: Promise?
  private var currentToken: Int?
  private var currentScene: String = "drive"
  
  private var driveManager: AMapNaviDriveManager?
  private var walkManager: AMapNaviWalkManager?
  private var rideManager: AMapNaviRideManager?
  
  init(module: ExpoGaodeMapNavigationModule, manager: IndependentRouteManager) {
    self.module = module
    self.independentRouteManager = manager
    super.init()
    initManagers()
  }
  
  private func initManagers() {
    driveManager = AMapNaviDriveManager.sharedInstance()
    driveManager?.delegate = self
    
    walkManager = AMapNaviWalkManager.sharedInstance()
    walkManager?.delegate = self
    
    rideManager = AMapNaviRideManager.sharedInstance()
    rideManager?.delegate = self
  }
  
  // MARK: - 独立驾车路线规划
  func independentDriveRoute(options: [String: Any], promise: Promise) {
    guard let from = options["from"] as? [String: Any],
          let to = options["to"] as? [String: Any] else {
      promise.reject("INVALID_PARAMS", "from and to are required")
      return
    }

    guard let startPOIInfo = Converters.parseNaviPOIInfo(from),
          let endPOIInfo = Converters.parseNaviPOIInfo(to) else {
      promise.reject("INVALID_COORDS", "Invalid coordinates or POI info")
      return
    }

    let wayPOIInfos: [AMapNaviPOIInfo]? = {
      guard let waypoints = options["waypoints"] as? [[String: Any]] else { return nil }
      return Converters.parseNaviPOIInfos(waypoints)
    }()

    if let vehicleInfo = buildVehicleInfo(options: options) {
      driveManager?.setVehicleInfo(vehicleInfo)
    }

    let strategyValue = resolveDriveStrategyValue(options: options)
    let strategy = AMapNaviDrivingStrategy(rawValue: strategyValue)
      ?? AMapNaviDrivingStrategy.drivingStrategySingleDefault
    let token = independentRouteManager.generateToken()

    let success = driveManager?.independentCalculateDriveRoute(
      withStart: startPOIInfo,
      end: endPOIInfo,
      wayPOIInfos: wayPOIInfos,
      drivingStrategy: strategy,
      callback: { [weak self] routeGroup, error in
        guard let self else { return }
        if let error = error {
          promise.reject("CALCULATE_FAILED", error.localizedDescription)
          return
        }
        guard let routeGroup = routeGroup else {
          promise.reject("CALCULATE_FAILED", "独立驾车算路成功回调未返回 routeGroup")
          return
        }

        self.independentRouteManager.storeRouteGroup(token: token, routeGroup: routeGroup)
        let result = self.convertIndependentDriveResult(routeGroup: routeGroup, token: token)
        promise.resolve(result)
      }
    ) ?? false

    if !success {
      promise.reject("CALCULATE_FAILED", "独立驾车路线规划启动失败")
    }
  }
  
  // MARK: - 独立货车路线规划
  func independentTruckRoute(options: [String: Any], promise: Promise) {
    var truckOptions = options
    if truckOptions["carType"] == nil && (truckOptions["vehicleInfo"] as? [String: Any]) == nil {
      truckOptions["carType"] = 1
    }
    independentDriveRoute(options: truckOptions, promise: promise)
  }
  
  // MARK: - 独立步行路线规划
  func independentWalkRoute(options: [String: Any], promise: Promise) {
    guard let from = options["from"] as? [String: Any],
          let to = options["to"] as? [String: Any] else {
      promise.reject("INVALID_PARAMS", "from and to are required")
      return
    }
    
    guard let startPoint = Converters.parseNaviPoint(from),
          let endPoint = Converters.parseNaviPoint(to) else {
      promise.reject("INVALID_COORDS", "Invalid coordinates")
      return
    }
    
    currentScene = "walk"
    currentPromise = promise
    currentToken = independentRouteManager.generateToken()
    
    let success = walkManager?.calculateWalkRoute(withStart: [startPoint], end: [endPoint]) ?? false
    
    if !success {
      currentPromise = nil
      currentToken = nil
      promise.reject("CALCULATE_FAILED", "独立步行路线规划启动失败")
    }
  }
  
  // MARK: - 独立骑行路线规划
  func independentRideRoute(options: [String: Any], promise: Promise) {
    guard let from = options["from"] as? [String: Any],
          let to = options["to"] as? [String: Any] else {
      promise.reject("INVALID_PARAMS", "from and to are required")
      return
    }
    
    guard let startPoint = Converters.parseNaviPoint(from),
          let endPoint = Converters.parseNaviPoint(to) else {
      promise.reject("INVALID_COORDS", "Invalid coordinates")
      return
    }
    
    currentScene = "ride"
    currentPromise = promise
    currentToken = independentRouteManager.generateToken()
    
    let success = rideManager?.calculateRideRoute(withStart: startPoint, end: endPoint) ?? false
    
    if !success {
      currentPromise = nil
      currentToken = nil
      promise.reject("CALCULATE_FAILED", "独立骑行路线规划启动失败")
    }
  }
  
  // MARK: - 独立摩托车路线规划（使用驾车接口）
  func independentMotorcycleRoute(options: [String: Any], promise: Promise) {
    var motorcycleOptions = options
    if motorcycleOptions["carType"] == nil {
      motorcycleOptions["carType"] = 11
    }
    independentDriveRoute(options: motorcycleOptions, promise: promise)
  }

  private func resolveDriveStrategyValue(options: [String: Any]) -> Int {
    if let strategy = options["strategy"] as? Int {
      return strategy
    }
    return Converters.convertDrivingPreferenceToStrategy(
      multipleRoute: true,
      avoidCongestion: options["avoidCongestion"] as? Bool ?? false,
      avoidHighway: options["avoidHighway"] as? Bool ?? false,
      avoidCost: options["avoidCost"] as? Bool ?? false,
      prioritiseHighway: options["prioritiseHighway"] as? Bool ?? false
    )
  }

  private func buildVehicleInfo(options: [String: Any]) -> AMapNaviVehicleInfo? {
    let naviVehicleInfo = AMapNaviVehicleInfo()
    var hasAnyValue = false

    if let vehicleInfo = options["vehicleInfo"] as? [String: Any] {
      if let type = intValue(vehicleInfo["type"]) {
        naviVehicleInfo.type = type
        hasAnyValue = true
      }
      if let size = intValue(vehicleInfo["size"]) {
        naviVehicleInfo.size = size
        hasAnyValue = true
      }
      if let width = doubleValue(vehicleInfo["width"]) {
        naviVehicleInfo.width = width
        hasAnyValue = true
      }
      if let height = doubleValue(vehicleInfo["height"]) {
        naviVehicleInfo.height = height
        hasAnyValue = true
      }
      if let length = doubleValue(vehicleInfo["length"]) {
        naviVehicleInfo.length = length
        hasAnyValue = true
      }
      if let load = doubleValue(vehicleInfo["load"]) {
        naviVehicleInfo.load = load
        hasAnyValue = true
      }
      if let weight = doubleValue(vehicleInfo["weight"]) {
        naviVehicleInfo.weight = weight
        hasAnyValue = true
      }
      if let axisNums = intValue(vehicleInfo["axisNums"]) {
        naviVehicleInfo.axisNums = axisNums
        hasAnyValue = true
      }
    }

    if let carType = intValue(options["carType"]) {
      naviVehicleInfo.type = carType
      hasAnyValue = true
    }
    if let carNumber = options["carNumber"] as? String, !carNumber.isEmpty {
      naviVehicleInfo.vehicleId = carNumber
      hasAnyValue = true
    }
    if let restriction = options["restriction"] as? Bool {
      naviVehicleInfo.isETARestriction = restriction
      hasAnyValue = true
    }
    if let motorcycleCC = intValue(options["motorcycleCC"]) {
      naviVehicleInfo.motorcycleCC = motorcycleCC
      hasAnyValue = true
    }

    return hasAnyValue ? naviVehicleInfo : nil
  }

  private func convertIndependentDriveResult(
    routeGroup: AMapNaviRouteGroup,
    token: Int
  ) -> [String: Any] {
    let orderedRouteIds = routeGroup.naviRouteIDs?.map { $0.intValue } ?? []
    var routes: [[String: Any]] = []

    if let naviRoutes = routeGroup.naviRoutes {
      let fallbackIds = naviRoutes.keys.map { $0.intValue }.sorted()
      let routeIds = orderedRouteIds.isEmpty ? fallbackIds : orderedRouteIds
      for routeId in routeIds {
        let key = NSNumber(value: routeId)
        guard let route = naviRoutes[key] else { continue }
        routes.append([
          "routeId": routeId,
          "distance": route.routeLength,
          "duration": route.routeTime,
          "tollCost": route.routeTollCost,
          "strategy": "推荐路线",
          "polyline": extractCoordinates(from: route)
        ])
      }
    } else if let route = routeGroup.naviRoute {
      let routeId = routeGroup.naviRouteID
      routes.append([
        "routeId": routeId,
        "distance": route.routeLength,
        "duration": route.routeTime,
        "tollCost": route.routeTollCost,
        "strategy": "推荐路线",
        "polyline": extractCoordinates(from: route)
      ])
    }

    let finalRouteIds = orderedRouteIds.isEmpty ? routes.compactMap { $0["routeId"] as? Int } : orderedRouteIds
    let mainRouteId = routeGroup.naviRouteID
    let mainPathIndex = finalRouteIds.firstIndex(of: mainRouteId) ?? 0

    return [
      "success": true,
      "independent": true,
      "token": token,
      "count": routes.count,
      "mainPathIndex": mainPathIndex,
      "routeIds": finalRouteIds,
      "routes": routes
    ]
  }

  private func intValue(_ raw: Any?) -> Int? {
    if let value = raw as? Int { return value }
    if let value = raw as? NSNumber { return value.intValue }
    if let value = raw as? String { return Int(value) }
    return nil
  }

  private func doubleValue(_ raw: Any?) -> Double? {
    if let value = raw as? Double { return value }
    if let value = raw as? NSNumber { return value.doubleValue }
    if let value = raw as? String { return Double(value) }
    return nil
  }
  
  func destroy() {
    driveManager?.delegate = nil
    walkManager?.delegate = nil
    rideManager?.delegate = nil
    currentPromise = nil
    currentToken = nil
  }
}

// MARK: - AMapNaviDriveManagerDelegate

extension IndependentRouteService: AMapNaviDriveManagerDelegate {
  
  func driveManager(onCalculateRouteSuccess driveManager: AMapNaviDriveManager) {
    guard currentScene == "drive", let promise = currentPromise, let token = currentToken else { return }
    currentPromise = nil
    currentToken = nil
    
    var routes: [[String: Any]] = []
    if let routeIDs = driveManager.naviRouteIDs {
      for routeID in routeIDs {
        if let route = driveManager.naviRoutes?[routeID] {
          routes.append([
            "routeId": routeID.intValue,
            "distance": route.routeLength,
            "duration": route.routeTime,
            "tollCost": route.routeTollCost,
            "strategy": "推荐路线",
            "polyline": extractCoordinates(from: route)
          ])
        }
      }
    }
    
    promise.resolve([
      "success": true,
      "token": token,
      "routes": routes
    ])
  }
  
  func driveManager(_ driveManager: AMapNaviDriveManager, onCalculateRouteFailure error: Error) {
    guard currentScene == "drive", let promise = currentPromise else { return }
    currentPromise = nil
    currentToken = nil
    
    promise.reject("CALCULATE_FAILED", error.localizedDescription)
  }
}

// MARK: - AMapNaviWalkManagerDelegate

extension IndependentRouteService: AMapNaviWalkManagerDelegate {
  
  func walkManager(onCalculateRouteSuccess walkManager: AMapNaviWalkManager) {
    guard currentScene == "walk", let promise = currentPromise, let token = currentToken else { return }
    currentPromise = nil
    currentToken = nil
    
    var routes: [[String: Any]] = []
    if let naviRoute = walkManager.naviRoute {
      routes.append([
        "routeId": 1,
        "distance": naviRoute.routeLength,
        "duration": naviRoute.routeTime,
        "strategy": "步行路线",
        "polyline": extractCoordinates(from: naviRoute)
      ])
    }
    
    promise.resolve([
      "success": true,
      "token": token,
      "routes": routes
    ])
  }
  
  func walkManager(_ walkManager: AMapNaviWalkManager, onCalculateRouteFailure error: Error) {
    guard currentScene == "walk", let promise = currentPromise else { return }
    currentPromise = nil
    currentToken = nil
    
    promise.reject("CALCULATE_FAILED", error.localizedDescription)
  }
}

// MARK: - AMapNaviRideManagerDelegate

extension IndependentRouteService: AMapNaviRideManagerDelegate {
  
  func rideManager(onCalculateRouteSuccess rideManager: AMapNaviRideManager) {
    guard currentScene == "ride", let promise = currentPromise, let token = currentToken else { return }
    currentPromise = nil
    currentToken = nil
    
    var routes: [[String: Any]] = []
    if let naviRoute = rideManager.naviRoute {
      routes.append([
        "routeId": 1,
        "distance": naviRoute.routeLength,
        "duration": naviRoute.routeTime,
        "strategy": "骑行路线",
        "polyline": extractCoordinates(from: naviRoute)
      ])
    }
    
    promise.resolve([
      "success": true,
      "token": token,
      "routes": routes
    ])
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
    
    NSLog("IndependentRouteService: 提取到 \(coordinates.count) 个坐标点")
    return coordinates
  }
  
  func rideManager(_ rideManager: AMapNaviRideManager, onCalculateRouteFailure error: Error) {
    guard currentScene == "ride", let promise = currentPromise else { return }
    currentPromise = nil
    currentToken = nil
    
    promise.reject("CALCULATE_FAILED", error.localizedDescription)
  }
}
