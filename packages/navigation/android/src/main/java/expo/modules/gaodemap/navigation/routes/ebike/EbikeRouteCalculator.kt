package expo.modules.gaodemap.navigation.routes.ebike

import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.enums.TravelStrategy
import expo.modules.gaodemap.navigation.ExpoGaodeMapNavigationModule
import expo.modules.gaodemap.navigation.listeners.RouteCalculateListener
import expo.modules.gaodemap.navigation.utils.Converters
import expo.modules.kotlin.Promise

/**
 * 骑行电动车 路线规划计算器
 *
 * 对齐官方文档（v8.0.0+）：
 * - AMapNavi.calculateEleBikeRoute(to: NaviLatLng)
 * - AMapNavi.calculateEleBikeRoute(from: NaviLatLng, to: NaviLatLng)
 * - AMapNavi.calculateEleBikeRoute(fromPoi: NaviPoi, toPoi: NaviPoi, strategy: TravelStrategy)
 *
 * 说明：
 * - 推荐使用 POI + strategy（SINGLE/MULTIPLE），SDK 可基于 poiId 提高路线合理性
 * - 起点允许为空（内部将取定位点）
 */
class EbikeRouteCalculator(
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
      // 适配出行视图
        aMapNavi?.isNaviTravelView = true
      routeListener = RouteCalculateListener(module)
      aMapNavi?.addAMapNaviListener(routeListener)
    }
  }

  /**
   * 骑行电动车路径规划
   * options:
   * - from: { latitude, longitude } | POI
   * - to:   { latitude, longitude } | POI  (required)
   * - travelStrategy?: 1000(SINGLE) | 1001(MULTIPLE)
   * - multiple?: boolean (true => MULTIPLE)
   * - usePoi?: boolean 强制按 POI 处理
   */
  fun calculateEleBikeRoute(options: Map<String, Any?>, promise: Promise) {
    @Suppress("UNCHECKED_CAST")
    val to = options["to"] as? Map<String, Any?>
      ?: throw Exception("to is required")
    @Suppress("UNCHECKED_CAST")
    val from = options["from"] as? Map<String, Any?>

    // 计算策略（仅在 POI 模式下使用）
    val travelStrategyValue: Int = when {
      options["travelStrategy"] is Number -> (options["travelStrategy"] as Number).toInt()
      options["multiple"] as? Boolean == true -> 1001
      else -> 1000
    }
    val strategyEnum =
      if (travelStrategyValue == 1001) TravelStrategy.MULTIPLE else TravelStrategy.SINGLE

    // 是否使用 POI 算路：显式指定或存在 name / poiId 字段
    val usePoi =
      (from?.get("name") is String) || (from?.get("poiId") is String) ||
      (to["name"] is String) || (to["poiId"] is String) ||
      (options["usePoi"] as? Boolean == true)

    // 标注场景与多路线期望（电动车）
    routeListener?.scene = "ebike"
    routeListener?.multiple = (strategyEnum == TravelStrategy.MULTIPLE)
    routeListener?.currentPromise = promise

    if (usePoi) {
      // POI 算路（支持起点为空）
      val startPoi = from?.let { Converters.parseNaviPoi(it) }
      val endPoi = Converters.parseNaviPoi(to)
      aMapNavi?.calculateEleBikeRoute(startPoi, endPoi, strategyEnum)
      return
    }

    // 经纬度算路分三种：仅终点（无起点）、起终点
    val toLatLng = Converters.parseNaviLatLng(to)
    if (from == null) {
      aMapNavi?.calculateEleBikeRoute(toLatLng)
    } else {
      val fromLatLng = Converters.parseNaviLatLng(from)
      aMapNavi?.calculateEleBikeRoute(fromLatLng, toLatLng)
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