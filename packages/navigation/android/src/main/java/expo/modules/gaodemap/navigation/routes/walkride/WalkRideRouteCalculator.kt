package expo.modules.gaodemap.navigation.routes.walkride

import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.enums.TravelStrategy
import expo.modules.gaodemap.navigation.ExpoGaodeMapNavigationModule
import expo.modules.gaodemap.navigation.listeners.RouteCalculateListener
import expo.modules.gaodemap.navigation.utils.Converters
import expo.modules.kotlin.Promise

/**
 * 步行/骑行 路线规划计算器
 *
 * 对齐官方文档：
 * - 步行/骑行使用经纬度（NaviLatLng）算路
 * - 通过 AMapNavi.calculateWalkRoute / calculateRideRoute 实现
 */
class WalkRideRouteCalculator(
  private val context: Context,
  private val module: ExpoGaodeMapNavigationModule
) {

  private var aMapNavi: AMapNavi? = null
  private var routeListener: RouteCalculateListener? = null

  init {
    initNavi()
  }

  private fun initNavi() {
    if (aMapNavi == null) {
      aMapNavi = AMapNavi.getInstance(context)
      
      // 检查SDK是否正确初始化（验证API Key）
      if (aMapNavi == null) {
        throw Exception("高德地图导航SDK初始化失败,请检查API Key配置是否正确。请在app.json中配置android.config.gaodeMapKey")
      }
      
      // 骑/步行适配：历史实现需切换到 TravelView
      aMapNavi?.isNaviTravelView = true
      routeListener = RouteCalculateListener(module)
      aMapNavi?.addAMapNaviListener(routeListener)
    }
  }

  /**
   * 步行路径规划（NaviLatLng）
   * options:
   * - from: { latitude, longitude }
   * - to: { latitude, longitude }
   */
  fun calculateWalkRoute(options: Map<String, Any?>, promise: Promise) {
    // 确保SDK已初始化
    if (aMapNavi == null) {
      try {
        initNavi()
      } catch (e: Exception) {
        promise.reject("INIT_FAILED", e.message ?: "高德地图导航SDK初始化失败", e)
        return
      }
    }
    
    @Suppress("UNCHECKED_CAST")
    val from = options["from"] as? Map<String, Any?>
      ?: throw Exception("from is required")
    @Suppress("UNCHECKED_CAST")
    val to = options["to"] as? Map<String, Any?>
      ?: throw Exception("to is required")

    // TravelStrategy：支持两种传参方式
    // 1) travelStrategy: 1000(SINGLE) / 1001(MULTIPLE)
    // 2) multiple: Boolean（true=多路径=1001；false/未传=单路径=1000）
    val travelStrategyValue: Int = when {
      options["travelStrategy"] is Number -> (options["travelStrategy"] as Number).toInt()
      options["multiple"] as? Boolean == true -> 1001
      else -> 1000
    }
    val strategyEnum = if (travelStrategyValue == 1001) TravelStrategy.MULTIPLE else TravelStrategy.SINGLE

    // 根据是否提供 POI 信息选择 API：有 name 或 poiId 则走 POI 算路，否则走经纬度算路
    val usePoi = (from["name"] is String) || (from["poiId"] is String) || (to["name"] is String) || (to["poiId"] is String) || (options["usePoi"] as? Boolean == true)

    // 标注场景与多路线期望（步行支持 SINGLE/MULTIPLE）
    routeListener?.scene = "walk"
    routeListener?.multiple = (strategyEnum == TravelStrategy.MULTIPLE)
    routeListener?.currentPromise = promise

    if (usePoi) {
      val start = Converters.parseNaviPoi(from)
      val end = Converters.parseNaviPoi(to)
      aMapNavi?.calculateWalkRoute(start, end, strategyEnum)
    } else {
      val fromLatLng = Converters.parseNaviLatLng(from)
      val toLatLng = Converters.parseNaviLatLng(to)
      aMapNavi?.calculateWalkRoute(fromLatLng, toLatLng)
    }
  }

  /**
   * 骑行路径规划（NaviLatLng）
   * options:
   * - from: { latitude, longitude }
   * - to: { latitude, longitude }
   */
  fun calculateRideRoute(options: Map<String, Any?>, promise: Promise) {
    // 确保SDK已初始化
    if (aMapNavi == null) {
      try {
        initNavi()
      } catch (e: Exception) {
        promise.reject("INIT_FAILED", e.message ?: "高德地图导航SDK初始化失败", e)
        return
      }
    }
    
    @Suppress("UNCHECKED_CAST")
    val from = options["from"] as? Map<String, Any?>
      ?: throw Exception("from is required")
    @Suppress("UNCHECKED_CAST")
    val to = options["to"] as? Map<String, Any?>
      ?: throw Exception("to is required")

    val travelStrategyValue: Int = when {
      options["travelStrategy"] is Number -> (options["travelStrategy"] as Number).toInt()
      options["multiple"] as? Boolean == true -> 1001
      else -> 1000
    }
    val strategyEnum = if (travelStrategyValue == 1001) TravelStrategy.MULTIPLE else TravelStrategy.SINGLE

    val usePoi = (from["name"] is String) || (from["poiId"] is String) || (to["name"] is String) || (to["poiId"] is String) || (options["usePoi"] as? Boolean == true)

    // 标注场景与多路线期望（骑行支持 SINGLE/MULTIPLE）
    routeListener?.scene = "ride"
    routeListener?.multiple = (strategyEnum == TravelStrategy.MULTIPLE)
    routeListener?.currentPromise = promise

    if (usePoi) {
      val start = Converters.parseNaviPoi(from)
      val end = Converters.parseNaviPoi(to)
      aMapNavi?.calculateRideRoute(start, end, strategyEnum)
    } else {
      val fromLatLng = Converters.parseNaviLatLng(from)
      val toLatLng = Converters.parseNaviLatLng(to)
      aMapNavi?.calculateRideRoute(fromLatLng, toLatLng)
    }
  }

  fun destroy() {
    aMapNavi?.removeAMapNaviListener(routeListener)
    try {
      AMapNavi.destroy()
    } catch (_: Exception) {
    } finally {
      aMapNavi = null
      routeListener = null
    }
  }
}