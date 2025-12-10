//
//  Converters.swift
//  expo-gaode-map-navigation
//
//  坐标转换工具类
//

import Foundation
import AMapNaviKit

class Converters {
  
  /// 解析导航点 (AMapNaviPoint)
  static func parseNaviPoint(_ dict: [String: Any]?) -> AMapNaviPoint? {
    guard let dict = dict,
          let latitude = dict["latitude"] as? Double,
          let longitude = dict["longitude"] as? Double else {
      return nil
    }
    return AMapNaviPoint.location(withLatitude: CGFloat(latitude), longitude: CGFloat(longitude))
  }
  
  /// 解析途经点列表
  static func parseWaypoints(_ list: [[String: Any]]?) -> [AMapNaviPoint]? {
    guard let list = list, !list.isEmpty else { return nil }
    return list.compactMap { parseNaviPoint($0) }
  }
  
  /// 解析 POI 信息 (AMapNaviPOIInfo)
  /// 支持：mid/poiId, locPoint, startAngle
  static func parseNaviPOIInfo(_ dict: [String: Any]?) -> AMapNaviPOIInfo? {
    guard let dict = dict else { return nil }
    
    let poiInfo = AMapNaviPOIInfo()
    
    // POI ID
    if let mid = dict["mid"] as? String {
      poiInfo.mid = mid
    } else if let poiId = dict["poiId"] as? String {
      poiInfo.mid = poiId
    }
    
    // 坐标点
    if let latitude = dict["latitude"] as? Double,
       let longitude = dict["longitude"] as? Double {
      poiInfo.locPoint = AMapNaviPoint.location(withLatitude: CGFloat(latitude), longitude: CGFloat(longitude))
    }
    
    // 起点角度（0为正北，顺时针方向增加）
    if let startAngle = dict["startAngle"] as? Double {
      poiInfo.startAngle = startAngle
    } else {
      poiInfo.startAngle = -1 // 默认值
    }
    
    // 如果没有 mid 也没有坐标，返回 nil
    if poiInfo.mid == nil && poiInfo.locPoint == nil {
      return nil
    }
    
    return poiInfo
  }
  
  /// 解析 POI 信息列表
  static func parseNaviPOIInfos(_ list: [[String: Any]]?) -> [AMapNaviPOIInfo]? {
    guard let list = list, !list.isEmpty else { return nil }
    return list.compactMap { parseNaviPOIInfo($0) }
  }
  
  /// 将驾车偏好转换为策略值
  /// 对应官方文档的 ConvertDrivingPreferenceToDrivingStrategy 方法
  static func convertDrivingPreferenceToStrategy(
    multipleRoute: Bool,
    avoidCongestion: Bool,
    avoidHighway: Bool,
    avoidCost: Bool,
    prioritiseHighway: Bool
  ) -> Int {
    // 不走高速与高速优先不能同时为 true
    // 高速优先与避免收费不能同时为 true
    
    if multipleRoute {
      // 多路径策略 (10-20)
      if prioritiseHighway && avoidCongestion {
        return 20 // 躲避拥堵&高速优先
      } else if prioritiseHighway {
        return 19 // 高速优先
      } else if avoidHighway && avoidCost && avoidCongestion {
        return 18 // 避免拥堵&避免收费&不走高速
      } else if avoidCost && avoidCongestion {
        return 17 // 躲避拥堵&避免收费
      } else if avoidHighway && avoidCost {
        return 16 // 避免收费&不走高速
      } else if avoidHighway && avoidCongestion {
        return 15 // 躲避拥堵&不走高速
      } else if avoidCost {
        return 14 // 避免收费
      } else if avoidHighway {
        return 13 // 不走高速
      } else if avoidCongestion {
        return 12 // 躲避拥堵
      } else {
        return 10 // 默认多路径
      }
    } else {
      // 单路径策略 (0-9)
      if avoidHighway && avoidCost && avoidCongestion {
        return 9 // 躲避拥堵和收费，不走高速
      } else if avoidCost && avoidCongestion {
        return 8 // 躲避拥堵和收费
      } else if avoidHighway && avoidCost {
        return 7 // 费用优先，不走高速且避免所有收费路段
      } else if avoidHighway {
        return 6 // 速度优先，不走高速
      } else if avoidCongestion {
        return 4 // 躲避拥堵
      } else if avoidCost {
        return 1 // 费用优先
      } else {
        return 0 // 速度优先（默认）
      }
    }
  }
}
