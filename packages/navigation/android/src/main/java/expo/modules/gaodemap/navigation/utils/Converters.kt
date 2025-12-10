package expo.modules.gaodemap.navigation.utils

import com.amap.api.maps.model.LatLng
import com.amap.api.navi.model.*

/**
 * 数据转换工具类
 */
object Converters {
  
  /**
   * 转换坐标点为 NaviLatLng（用于步行、骑行）
   */
  fun parseNaviLatLng(map: Map<String, Any?>): NaviLatLng {
    val lat = (map["latitude"] as? Number)?.toDouble()
      ?: throw Exception("latitude is required")
    val lng = (map["longitude"] as? Number)?.toDouble()
      ?: throw Exception("longitude is required")
    
    return NaviLatLng(lat, lng)
  }
  
  /**
   * 转换坐标点为 NaviPoi（用于驾车、货车）
   */
  fun parseNaviPoi(map: Map<String, Any?>): NaviPoi {
    val lat = (map["latitude"] as? Number)?.toDouble()
      ?: throw Exception("latitude is required")
    val lng = (map["longitude"] as? Number)?.toDouble()
      ?: throw Exception("longitude is required")
    val name = map["name"] as? String
    val poiId = map["poiId"] as? String
    
    // NaviPoi 构造函数需要的是地图库的 LatLng 类型
    return NaviPoi(name, LatLng(lat, lng), poiId)
  }

  /**
   * 转换途经点列表
   */
  fun parseWaypoints(list: List<Map<String, Any?>>?): List<NaviPoi> {
    return list?.map { parseNaviPoi(it) } ?: emptyList()
  }

  /**
   * 转换导航路径信息（用于 getNaviInfo）
   * Android SDK 中导航信息通过路径对象获取
   */
  fun convertNaviPathInfo(path: AMapNaviPath): Map<String, Any?> {
    return mapOf(
      "currentRoadName" to "",
      "nextRoadName" to "",
      "currentStepRetainDistance" to 0,
      "currentStepRetainTime" to 0,
      "pathRetainDistance" to path.allLength,
      "pathRetainTime" to path.allTime,
      "currentSpeed" to 0,
      "iconSpeed" to 0,
      "iconType" to 0,
      "cameraDistance" to 0,
      "cameraType" to 0,
      "isInHighway" to false,
      "isOffRoute" to false
    )
  }

  /**
   * 转换路径步骤（简化版本，只使用确实存在的属性）
   */
  fun convertSteps(steps: List<AMapNaviStep>?): List<Map<String, Any?>> {
    return steps?.map { step ->
      mapOf(
        "instruction" to "",
        "road" to "",
        "distance" to step.length,
        "duration" to 0,
        "polyline" to convertCoords(step.coords),
        "tollDistance" to step.chargeLength,
        "tollCost" to step.tollCost
      )
    } ?: emptyList()
  }

  /**
   * 转换坐标列表（NaviLatLng）
   */
  fun convertCoords(coords: List<NaviLatLng>?): List<Map<String, Double>> {
    return coords?.map { coord ->
      mapOf(
        "latitude" to coord.latitude,
        "longitude" to coord.longitude
      )
    } ?: emptyList()
  }

  /**
   * 转换路径结果（只使用确实存在的属性）
   */
  fun convertNaviPath(path: AMapNaviPath): Map<String, Any?> {
    return mapOf(
      "distance" to path.allLength,
      "duration" to path.allTime,
      "tollDistance" to 0,
      "tollCost" to path.tollCost,
      "trafficLightCount" to 0,
      "steps" to convertSteps(path.steps),
      "polyline" to convertCoords(path.coordList)
    )
  }

  /**
   * 转换驾车路径结果
   */
  fun convertDriveRouteResult(paths: Map<Int, AMapNaviPath>?): Map<String, Any?> {
    val routes = paths?.values?.map { convertNaviPath(it) } ?: emptyList()
    
    return mapOf(
      "routes" to routes,
      "taxiCost" to 0
    )
  }

  /**
   * 转换多路线信息
   */
  fun convertMultiRouteInfo(paths: Map<Int, AMapNaviPath>?): List<Map<String, Any?>> {
    return paths?.entries?.map { (id, path) ->
      mapOf(
        "routeId" to id,
        "distance" to path.allLength,
        "duration" to path.allTime,
        "tollCost" to path.tollCost,
        "trafficLightCount" to 0,
        "strategyDesc" to ""
      )
    } ?: emptyList()
  }
}