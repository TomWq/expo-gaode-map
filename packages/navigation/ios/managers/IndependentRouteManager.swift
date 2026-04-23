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
  static let shared = IndependentRouteManager()

  private struct Entry {
    let scene: String
    let routeGroup: AMapNaviRouteGroup?
    let routeIds: [Int]
  }
  
  private var routeGroups: [Int: Entry] = [:]
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
  func storeRouteGroup(token: Int, scene: String = "drive", routeGroup: AMapNaviRouteGroup) {
    lock.lock()
    defer { lock.unlock() }
    let routeIds = routeGroup.naviRouteIDs?.map { $0.intValue } ?? []
    routeGroups[token] = Entry(scene: scene, routeGroup: routeGroup, routeIds: routeIds)
  }

  /// 存储非驾车场景的独立路径元信息
  func storeSceneRoutes(token: Int, scene: String, routeIds: [Int]) {
    lock.lock()
    defer { lock.unlock() }
    routeGroups[token] = Entry(scene: scene, routeGroup: nil, routeIds: routeIds)
  }
  
  /// 存储路线组（自动生成 token）
  func store(_ routeGroup: AMapNaviRouteGroup) -> Int {
    lock.lock()
    defer { lock.unlock() }
    let token = nextToken
    nextToken += 1
    let routeIds = routeGroup.naviRouteIDs?.map { $0.intValue } ?? []
    routeGroups[token] = Entry(scene: "drive", routeGroup: routeGroup, routeIds: routeIds)
    return token
  }
  
  /// 获取路线组
  func get(_ token: Int) -> AMapNaviRouteGroup? {
    lock.lock()
    defer { lock.unlock() }
    return routeGroups[token]?.routeGroup
  }

  /// 获取路线场景
  func scene(for token: Int) -> String? {
    lock.lock()
    defer { lock.unlock() }
    return routeGroups[token]?.scene
  }
  
  /// 行前选路 - 选择指定路线
  /// 官方方法：[independentRouteGroup selectNaviRouteWithRouteID:]
  func select(token: Int, routeId: Int?, routeIndex: Int?) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    
    guard let entry = routeGroups[token] else { return false }

    let resolvedRouteId: Int? = {
      if let routeId {
        return routeId
      }
      if let routeIndex, routeIndex >= 0, routeIndex < entry.routeIds.count {
        return entry.routeIds[routeIndex]
      }
      return nil
    }()

    guard let resolvedRouteId else {
      return false
    }

    if let routeGroup = entry.routeGroup {
      routeGroup.selectNaviRoute(withRouteID: resolvedRouteId)
      return true
    }

    switch entry.scene {
    case "walk":
      return AMapNaviWalkManager.sharedInstance().selectNaviRoute(withRouteID: resolvedRouteId)
    case "ride":
      return AMapNaviRideManager.sharedInstance().selectNaviRoute(withRouteID: resolvedRouteId)
    default:
      return false
    }
  }
  
  /// 启动导航
  /// 官方方法：startGPSNavi: / startEmulatorNavi:
  func start(token: Int, naviType: Int, routeId: Int?, routeIndex: Int?) -> Bool {
    lock.lock()
    let entry = routeGroups[token]
    lock.unlock()
    
    guard let entry = entry else { return false }
    
    // 先选择路线
    if routeId != nil || routeIndex != nil {
      _ = select(token: token, routeId: routeId, routeIndex: routeIndex)
    }
    
    // 启动导航
    // naviType: 0 = GPS导航, 1 = 模拟导航
    switch entry.scene {
    case "walk":
      if let routeGroup = entry.routeGroup {
        if naviType == 1 {
          return AMapNaviWalkManager.sharedInstance().startEmulatorNavi(routeGroup)
        } else {
          return AMapNaviWalkManager.sharedInstance().startGPSNavi(routeGroup)
        }
      }
      if naviType == 1 {
        return AMapNaviWalkManager.sharedInstance().startEmulatorNavi()
      } else {
        return AMapNaviWalkManager.sharedInstance().startGPSNavi()
      }
    case "ride":
      if let routeGroup = entry.routeGroup {
        if naviType == 1 {
          return AMapNaviRideManager.sharedInstance().startEmulatorNavi(routeGroup)
        } else {
          return AMapNaviRideManager.sharedInstance().startGPSNavi(routeGroup)
        }
      }
      if naviType == 1 {
        return AMapNaviRideManager.sharedInstance().startEmulatorNavi()
      } else {
        return AMapNaviRideManager.sharedInstance().startGPSNavi()
      }
    default:
      guard let routeGroup = entry.routeGroup else { return false }
      if naviType == 1 {
        return AMapNaviDriveManager.sharedInstance().startEmulatorNavi(routeGroup)
      } else {
        return AMapNaviDriveManager.sharedInstance().startGPSNavi(routeGroup)
      }
    }
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
