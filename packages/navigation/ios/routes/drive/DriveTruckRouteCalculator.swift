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
  
  // MARK: - 驾车路径规划
  
  func calculateDriveRoute(options: [String: Any], promise: Promise) {
    NSLog("DriveTruckRouteCalculator: 开始计算驾车路线")
    
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
    var wayPoints: [AMapNaviPoint]? = nil
    if let waypointsArray = options["waypoints"] as? [[String: Any]] {
      wayPoints = waypointsArray.compactMap { Converters.parseNaviPoint($0) }
    }
    
    // 解析策略 (0-20 对应 AMapNaviDrivingStrategy)
    // 10-20 是多路径策略,0-9 是单路径策略
    let strategyValue = (options["strategy"] as? Int) ?? 10 // 默认使用多路径策略
    let strategy: AMapNaviDrivingStrategy = AMapNaviDrivingStrategy(rawValue: strategyValue) ?? AMapNaviDrivingStrategy.drivingStrategyMultipleDefault
    
    NSLog("DriveTruckRouteCalculator: 使用策略值: \(strategyValue), strategy: \(strategy.rawValue)")
    
    scene = "drive"
    currentPromise = promise
    
    var success = false
    
    // 根据是否有 POI ID 选择不同的算路方法
    if let fromMid = (from?["poiId"] ?? from?["mid"]) as? String,
       let toMid = (to["poiId"] ?? to["mid"]) as? String {
      // 使用 POI ID 算路（推荐方式）
      NSLog("DriveTruckRouteCalculator: 使用 POI ID 算路")
      success = driveManager?.calculateDriveRoute(
        withStartPointPOIId: fromMid,
        endPointPOIId: toMid,
        wayPointsPOIId: nil,
        drivingStrategy: strategy
      ) ?? false
    } else if let fromInfo = Converters.parseNaviPOIInfo(from),
              let toInfo = Converters.parseNaviPOIInfo(to) {
      // 使用 POIInfo 算路（支持起点角度）
      NSLog("DriveTruckRouteCalculator: 使用 POIInfo 算路")
      
      // 解析途经点 POIInfo
      var wayPOIInfos: [AMapNaviPOIInfo]? = nil
      if let waypointsArray = options["waypoints"] as? [[String: Any]] {
        wayPOIInfos = waypointsArray.compactMap { Converters.parseNaviPOIInfo($0) }
      }
      
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
    
    // 设置货车车辆信息
    let vehicleInfo = AMapNaviVehicleInfo()
    
    // 车牌号
    if let vehicleId = options["carNumber"] as? String {
      vehicleInfo.vehicleId = vehicleId
    }
    
    // 车辆类型：1/3/5 为货车
    vehicleInfo.type = 1
    
    // 货车尺寸类型
    if let size = options["size"] as? Int {
      vehicleInfo.size = size
    } else {
      vehicleInfo.size = 4 // 默认
    }
    
    // 货车宽度（米）
    if let width = options["width"] as? Double {
      vehicleInfo.width = width
    }
    
    // 货车高度（米）
    if let height = options["height"] as? Double {
      vehicleInfo.height = height
    }
    
    // 货车长度（米）
    if let length = options["length"] as? Double {
      vehicleInfo.length = length
    }
    
    // 货车总重（吨）
    if let load = options["load"] as? Double {
      vehicleInfo.load = load
    }
    
    // 货车核定载重（吨）
    if let weight = options["weight"] as? Double {
      vehicleInfo.weight = weight
    }
    
    // 货车轴数
    if let axisNums = options["axisNums"] as? Int {
      vehicleInfo.axisNums = axisNums
    }
    
    // 设置车辆信息
    driveManager?.setVehicleInfo(vehicleInfo)
    
    scene = "truck"
    
    // 复用驾车算路逻辑
    calculateDriveRoute(options: options, promise: promise)
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
          "routeId": routeId,
          "distance": route.routeLength,
          "duration": route.routeTime,
          "tollCost": route.routeTollCost,
          "strategy": scene == "truck" ? "货车路线" : getStrategyName(routeId: routeId as? Int ?? 0),
          "polyline": extractCoordinates(from: route)
        ])
      }
    } else if let naviRoute = driveManager.naviRoute {
      // 单路线
      routes.append([
        "routeId": 12,
        "distance": naviRoute.routeLength,
        "duration": naviRoute.routeTime,
        "tollCost": naviRoute.routeTollCost,
        "strategy": scene == "truck" ? "货车路线" : "推荐路线",
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
