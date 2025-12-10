//
//  IndependentRouteService.swift
//  expo-gaode-map-navigation
//
//  独立路径规划服务 - 简化实现，使用标准路径规划 API
//  注意：iOS SDK 的独立算路 API 可能不支持 callback 方式，使用标准代理方式
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
    
    guard let startPoint = Converters.parseNaviPoint(from),
          let endPoint = Converters.parseNaviPoint(to) else {
      promise.reject("INVALID_COORDS", "Invalid coordinates")
      return
    }
    
    // 解析途经点
    var wayPoints: [AMapNaviPoint]? = nil
    if let waypoints = options["waypoints"] as? [[String: Any]] {
      wayPoints = waypoints.compactMap { Converters.parseNaviPoint($0) }
    }
    
    // 解析策略
    let strategyValue = options["strategy"] as? Int ?? 10
    let strategy: AMapNaviDrivingStrategy = AMapNaviDrivingStrategy(rawValue: strategyValue) ?? AMapNaviDrivingStrategy.drivingStrategySingleDefault
    
    currentScene = "drive"
    currentPromise = promise
    currentToken = independentRouteManager.generateToken()
    
    let success = driveManager?.calculateDriveRoute(
      withStart: [startPoint],
      end: [endPoint],
      wayPoints: wayPoints,
      drivingStrategy: strategy
    ) ?? false
    
    if !success {
      currentPromise = nil
      currentToken = nil
      promise.reject("CALCULATE_FAILED", "独立驾车路线规划启动失败")
    }
  }
  
  // MARK: - 独立货车路线规划
  func independentTruckRoute(options: [String: Any], promise: Promise) {
    // 设置货车信息
    if let vehicleInfo = options["vehicleInfo"] as? [String: Any] {
      let naviVehicleInfo = AMapNaviVehicleInfo()
      naviVehicleInfo.type = vehicleInfo["type"] as? Int ?? 1
      naviVehicleInfo.size = vehicleInfo["size"] as? Int ?? 2
      naviVehicleInfo.width = vehicleInfo["width"] as? Double ?? 2.5
      naviVehicleInfo.height = vehicleInfo["height"] as? Double ?? 3.0
      naviVehicleInfo.length = vehicleInfo["length"] as? Double ?? 10.0
      naviVehicleInfo.load = vehicleInfo["load"] as? Double ?? 10.0
      naviVehicleInfo.weight = vehicleInfo["weight"] as? Double ?? 15.0
      naviVehicleInfo.axisNums = vehicleInfo["axisNums"] as? Int ?? 2
      driveManager?.setVehicleInfo(naviVehicleInfo)
    }
    
    // 复用驾车路线规划
    independentDriveRoute(options: options, promise: promise)
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
    independentDriveRoute(options: options, promise: promise)
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
