//
//  WalkRideRouteCalculator.swift
//  expo-gaode-map-navigation
//
//  步行/骑行/电动车路线规划计算器
//  电动车使用 AMapNaviEleBikeManager（收费接口）
//

import Foundation
import ExpoModulesCore
import AMapNaviKit

class WalkRideRouteCalculator: NSObject {
  
  private weak var module: ExpoGaodeMapNavigationModule?
  private var walkManager: AMapNaviWalkManager?
  private var rideManager: AMapNaviRideManager?
  private var eleBikeManager: AMapNaviEleBikeManager?
  private var eleBikeDelegateHandler: EleBikeDelegateHandler?
  private var currentPromise: Promise?
  var scene: String = "walk"
  
  init(module: ExpoGaodeMapNavigationModule) {
    self.module = module
    super.init()
    initNavi()
  }
  
  private func initNavi() {
    walkManager = AMapNaviWalkManager.sharedInstance()
    walkManager?.delegate = self
    
    rideManager = AMapNaviRideManager.sharedInstance()
    rideManager?.delegate = self
    
    eleBikeManager = AMapNaviEleBikeManager.sharedInstance()
    eleBikeDelegateHandler = EleBikeDelegateHandler()
    eleBikeDelegateHandler?.calculator = self
    eleBikeManager?.delegate = eleBikeDelegateHandler
  }
  
  // MARK: - 步行路径规划
  
  func calculateWalkRoute(options: [String: Any], promise: Promise) {
    guard let from = options["from"] as? [String: Any],
          let to = options["to"] as? [String: Any] else {
      promise.reject("INVALID_PARAMS", "from and to are required")
      return
    }
    
    let fromPoint = Converters.parseNaviPoint(from)
    let toPoint = Converters.parseNaviPoint(to)
    
    guard let start = fromPoint, let end = toPoint else {
      promise.reject("INVALID_COORDS", "Invalid coordinates")
      return
    }
    
    scene = "walk"
    currentPromise = promise
    
    NSLog("WalkRideRouteCalculator: 开始步行路径规划 from: (\(start.latitude), \(start.longitude)) to: (\(end.latitude), \(end.longitude))")
    
    let success = walkManager?.calculateWalkRoute(withStart: [start], end: [end]) ?? false
    
    NSLog("WalkRideRouteCalculator: calculateWalkRoute 返回: \(success)")
    
    if !success {
      currentPromise = nil
      promise.reject("CALCULATE_FAILED", "步行路线规划启动失败(可能是距离太远,步行路径通常限制在100公里以内)")
    }
  }
  
  // MARK: - 骑行路径规划
  
  /// 骑行路线规划（坐标方式）
  /// 对应官方方法：calculateRideRouteWithStartPoint:endPoint:
  func calculateRideRoute(options: [String: Any], promise: Promise) {
    guard let from = options["from"] as? [String: Any],
          let to = options["to"] as? [String: Any] else {
      promise.reject("INVALID_PARAMS", "from and to are required")
      return
    }
    
    let fromPoint = Converters.parseNaviPoint(from)
    let toPoint = Converters.parseNaviPoint(to)
    
    guard let start = fromPoint, let end = toPoint else {
      promise.reject("INVALID_COORDS", "Invalid coordinates")
      return
    }
    
    scene = "ride"
    currentPromise = promise
    
    let success = rideManager?.calculateRideRoute(withStart: start, end: end) ?? false
    
    if !success {
      currentPromise = nil
      promise.reject("CALCULATE_FAILED", "骑行路线规划启动失败(可能是距离太远,骑行路径通常限制在100公里以内)")
    }
  }
  
  /// 骑行路线规划（POIInfo方式，推荐）
  /// 对应官方方法：calculateRideRouteWithStartPOIInfo:endPOIInfo:strategy:
  func calculateRideRouteWithPOI(options: [String: Any], promise: Promise) {
    guard let to = options["to"] as? [String: Any] else {
      promise.reject("INVALID_PARAMS", "to is required")
      return
    }
    
    scene = "ride"
    currentPromise = promise
    
    // 起点可为空，内部取当前定位点
    var startPOIInfo: AMapNaviPOIInfo? = nil
    if let from = options["from"] as? [String: Any] {
      startPOIInfo = Converters.parseNaviPOIInfo(from)
    }
    
    guard let endPOIInfo = Converters.parseNaviPOIInfo(to) else {
      currentPromise = nil
      promise.reject("INVALID_PARAMS", "Invalid end POI info")
      return
    }
    let strategy = AMapNaviTravelStrategy(rawValue: options["strategy"] as? Int ?? 0) ?? .multipleDefault
    
    let success = rideManager?.calculateRideRoute(withStart: startPOIInfo, end: endPOIInfo, strategy: strategy) ?? false
    
    if !success {
      currentPromise = nil
      promise.reject("CALCULATE_FAILED", "骑行路线规划启动失败")
    }
  }
  
  // MARK: - 电动车路径规划
  
  /// 电动车路线规划（坐标方式）
  /// 对应官方方法：calculateEleBikeRouteWithStartPoint:endPoint:
  func calculateEleBikeRoute(options: [String: Any], promise: Promise) {
    guard let from = options["from"] as? [String: Any],
          let to = options["to"] as? [String: Any] else {
      promise.reject("INVALID_PARAMS", "from and to are required")
      return
    }
    
    let fromPoint = Converters.parseNaviPoint(from)
    let toPoint = Converters.parseNaviPoint(to)
    
    guard let start = fromPoint, let end = toPoint else {
      promise.reject("INVALID_COORDS", "Invalid coordinates")
      return
    }
    
    scene = "eleBike"
    currentPromise = promise
    
    let success = eleBikeManager?.calculateEleBikeRoute(withStart: start, end: end) ?? false
    
    if !success {
      currentPromise = nil
      promise.reject("CALCULATE_FAILED", "电动车路线规划启动失败")
    }
  }
  
  /// 电动车路线规划（POIInfo方式，推荐）
  /// 对应官方方法：calculateEleBikeRouteWithStartPOIInfo:endPOIInfo:strategy:
  func calculateEleBikeRouteWithPOI(options: [String: Any], promise: Promise) {
    guard let to = options["to"] as? [String: Any] else {
      promise.reject("INVALID_PARAMS", "to is required")
      return
    }
    
    scene = "eleBike"
    currentPromise = promise
    
    var startPOIInfo: AMapNaviPOIInfo? = nil
    if let from = options["from"] as? [String: Any] {
      startPOIInfo = Converters.parseNaviPOIInfo(from)
    }
    
    guard let endPOIInfo = Converters.parseNaviPOIInfo(to) else {
      currentPromise = nil
      promise.reject("INVALID_PARAMS", "Invalid end POI info")
      return
    }
    let strategy = AMapNaviTravelStrategy(rawValue: options["strategy"] as? Int ?? 0) ?? .multipleDefault
    
    let success = eleBikeManager?.calculateEleBikeRoute(withStart: startPOIInfo, end: endPOIInfo, strategy: strategy) ?? false
    
    if !success {
      currentPromise = nil
      promise.reject("CALCULATE_FAILED", "电动车路线规划启动失败")
    }
  }
  
  func destroy() {
    walkManager?.delegate = nil
    walkManager = nil
    rideManager?.delegate = nil
    rideManager = nil
    eleBikeManager?.delegate = nil
    eleBikeManager = nil
    currentPromise = nil
    // 销毁单例
    AMapNaviWalkManager.destroyInstance()
    AMapNaviRideManager.destroyInstance()
    AMapNaviEleBikeManager.destroyInstance()
  }
}

// MARK: - AMapNaviWalkManagerDelegate

extension WalkRideRouteCalculator: AMapNaviWalkManagerDelegate {
  
  func walkManager(onCalculateRouteSuccess walkManager: AMapNaviWalkManager) {
    guard let promise = currentPromise else { return }
    currentPromise = nil
    
    var routes: [[String: Any]] = []
    
    // 优先使用 naviRoutes (多条路线)
    let naviRoutes = walkManager.naviRoutes()
    if naviRoutes.count > 0 {
      NSLog("WalkRideRouteCalculator: 步行规划返回 \(naviRoutes.count) 条路线")
      for (routeId, route) in naviRoutes {
        routes.append([
          "routeId": routeId,
          "distance": route.routeLength,
          "duration": route.routeTime,
          "strategy": getWalkStrategyName(routeId: routeId as? Int ?? 0),
          "polyline": extractCoordinates(from: route)
        ])
      }
    } else if let naviRoute = walkManager.naviRoute {
      // 单路线
      NSLog("WalkRideRouteCalculator: 步行规划返回单条路线")
      routes.append([
        "routeId": 12,
        "distance": naviRoute.routeLength,
        "duration": naviRoute.routeTime,
        "strategy": "步行路线",
        "polyline": extractCoordinates(from: naviRoute)
      ])
    }
    
    promise.resolve([
      "success": true,
      "routes": routes
    ])
  }
  
  func walkManager(_ walkManager: AMapNaviWalkManager, onCalculateRouteFailure error: Error) {
    guard let promise = currentPromise else { return }
    currentPromise = nil
    
    promise.reject("CALCULATE_FAILED", error.localizedDescription)
  }
}

// MARK: - AMapNaviRideManagerDelegate

extension WalkRideRouteCalculator: AMapNaviRideManagerDelegate {
  
  func rideManager(onCalculateRouteSuccess rideManager: AMapNaviRideManager) {
    guard let promise = currentPromise else { return }
    currentPromise = nil
    
    var routes: [[String: Any]] = []
    
    // 优先使用 naviRoutes (多条路线)
    let naviRoutes = rideManager.naviRoutes()
    if naviRoutes.count > 0 {
      NSLog("WalkRideRouteCalculator: 骑行规划返回 \(naviRoutes.count) 条路线")
      for (routeId, route) in naviRoutes {
        routes.append([
          "routeId": routeId,
          "distance": route.routeLength,
          "duration": route.routeTime,
          "strategy": getRideStrategyName(routeId: routeId as? Int ?? 0),
          "polyline": extractCoordinates(from: route)
        ])
      }
    } else if let naviRoute = rideManager.naviRoute {
      // 单路线
      NSLog("WalkRideRouteCalculator: 骑行规划返回单条路线")
      routes.append([
        "routeId": 12,
        "distance": naviRoute.routeLength,
        "duration": naviRoute.routeTime,
        "strategy": "骑行路线",
        "polyline": extractCoordinates(from: naviRoute)
      ])
    }
    
    promise.resolve([
      "success": true,
      "routes": routes
    ])
  }
  
  func rideManager(_ rideManager: AMapNaviRideManager, onCalculateRouteFailure error: Error) {
    guard scene == "ride", let promise = currentPromise else { return }
    currentPromise = nil
    
    promise.reject("CALCULATE_FAILED", error.localizedDescription)
  }
}

// MARK: - AMapNaviEleBikeManagerDelegate
// 电动车代理使用单独的类来避免方法签名冲突

private class EleBikeDelegateHandler: NSObject, AMapNaviEleBikeManagerDelegate {
  weak var calculator: WalkRideRouteCalculator?
  
  func eleBikeManager(onCalculateRouteSuccess eleBikeManager: AMapNaviEleBikeManager) {
    calculator?.handleEleBikeSuccess(eleBikeManager)
  }
  
  func eleBikeManager(_ eleBikeManager: AMapNaviEleBikeManager, onCalculateRouteFailure error: Error) {
    calculator?.handleEleBikeFailure(error)
  }
}

extension WalkRideRouteCalculator {
  
  func handleEleBikeSuccess(_ eleBikeManager: AMapNaviEleBikeManager) {
    guard scene == "eleBike", let promise = currentPromise else { return }
    currentPromise = nil
    
    var routes: [[String: Any]] = []
    
    // 优先使用 naviRoutes (多条路线)
    let naviRoutes = eleBikeManager.naviRoutes()
    if naviRoutes.count > 0 {
      NSLog("WalkRideRouteCalculator: 电动车规划返回 \(naviRoutes.count) 条路线")
      for (routeId, route) in naviRoutes {
        routes.append([
          "routeId": routeId,
          "distance": route.routeLength,
          "duration": route.routeTime,
          "strategy": getEleBikeStrategyName(routeId: routeId as? Int ?? 0),
          "polyline": extractCoordinates(from: route)
        ])
      }
    } else if let naviRoute = eleBikeManager.naviRoute {
      // 单路线
      NSLog("WalkRideRouteCalculator: 电动车规划返回单条路线")
      routes.append([
        "routeId": 12,
        "distance": naviRoute.routeLength,
        "duration": naviRoute.routeTime,
        "strategy": "电动车路线",
        "polyline": extractCoordinates(from: naviRoute)
      ])
    }
    
    promise.resolve([
      "success": true,
      "routes": routes
    ])
  }
  
  /// 获取步行策略名称
  private func getWalkStrategyName(routeId: Int) -> String {
    switch routeId {
    case 12: return "推荐路线"
    case 13: return "最短路线"
    case 14: return "避开室内"
    default: return "路线\(routeId - 11)"
    }
  }
  
  /// 获取骑行策略名称
  private func getRideStrategyName(routeId: Int) -> String {
    switch routeId {
    case 12: return "推荐路线"
    case 13: return "最短路线"
    case 14: return "少走主路"
    default: return "路线\(routeId - 11)"
    }
  }
  
  /// 获取电动车策略名称
  private func getEleBikeStrategyName(routeId: Int) -> String {
    switch routeId {
    case 12: return "推荐路线"
    case 13: return "最短路线"
    case 14: return "省电优先"
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
    
    NSLog("WalkRideRouteCalculator: 提取到 \(coordinates.count) 个坐标点")
    return coordinates
  }
  
  func handleEleBikeFailure(_ error: Error) {
    guard scene == "eleBike", let promise = currentPromise else { return }
    currentPromise = nil
    
    promise.reject("CALCULATE_FAILED", error.localizedDescription)
  }
}
