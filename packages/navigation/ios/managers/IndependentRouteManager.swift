//
//  IndependentRouteManager.swift
//  expo-gaode-map-navigation
//
//  独立路径组管理器 - 管理独立路径规划的结果
//  官方文档：独立路径规划的路线结果可以用于路线预览，也可以用于直接导航
//

import Foundation
import AMapNaviKit

class IndependentRouteManager {
  
  private var routeGroups: [Int: AMapNaviRouteGroup] = [:]
  private var nextToken: Int = 1
  private let lock = NSLock()
  
  /// 生成新的 token
  func generateToken() -> Int {
    lock.lock()
    defer { lock.unlock() }
    let token = nextToken
    nextToken += 1
    return token
  }
  
  /// 存储路线组（使用指定 token）
  func storeRouteGroup(token: Int, routeGroup: AMapNaviRouteGroup) {
    lock.lock()
    defer { lock.unlock() }
    routeGroups[token] = routeGroup
  }
  
  /// 存储路线组（自动生成 token）
  func store(_ routeGroup: AMapNaviRouteGroup) -> Int {
    lock.lock()
    defer { lock.unlock() }
    let token = nextToken
    nextToken += 1
    routeGroups[token] = routeGroup
    return token
  }
  
  /// 获取路线组
  func get(_ token: Int) -> AMapNaviRouteGroup? {
    lock.lock()
    defer { lock.unlock() }
    return routeGroups[token]
  }
  
  /// 行前选路 - 选择指定路线
  /// 官方方法：[independentRouteGroup selectNaviRouteWithRouteID:]
  func select(token: Int, routeId: Int?, routeIndex: Int?) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    
    guard let routeGroup = routeGroups[token] else { return false }
    
    // 优先使用 routeId
    if let routeId = routeId {
      routeGroup.selectNaviRoute(withRouteID: routeId)
      return true
    }
    
    // 使用 routeIndex
    if let routeIndex = routeIndex, let routeIDs = routeGroup.naviRouteIDs, routeIndex < routeIDs.count {
      let routeId = routeIDs[routeIndex].intValue
      routeGroup.selectNaviRoute(withRouteID: routeId)
      return true
    }
    
    return false
  }
  
  /// 启动导航
  /// 官方方法：startGPSNavi: / startEmulatorNavi:
  func start(token: Int, naviType: Int, routeId: Int?, routeIndex: Int?) -> Bool {
    lock.lock()
    let routeGroup = routeGroups[token]
    lock.unlock()
    
    guard let routeGroup = routeGroup else { return false }
    
    // 先选择路线
    if routeId != nil || routeIndex != nil {
      _ = select(token: token, routeId: routeId, routeIndex: routeIndex)
    }
    
    // 启动导航
    // naviType: 0 = GPS导航, 1 = 模拟导航
    if naviType == 1 {
      AMapNaviDriveManager.sharedInstance().startEmulatorNavi(routeGroup)
    } else {
      AMapNaviDriveManager.sharedInstance().startGPSNavi(routeGroup)
    }
    
    return true
  }
  
  /// 清除指定路线组
  func clear(_ token: Int) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    return routeGroups.removeValue(forKey: token) != nil
  }
  
  /// 清除所有路线组
  func clearAll() {
    lock.lock()
    defer { lock.unlock() }
    routeGroups.removeAll()
    nextToken = 1
  }
}
