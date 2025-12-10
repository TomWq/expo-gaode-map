package expo.modules.gaodemap.navigation.services

import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.model.AMapCarInfo
import expo.modules.gaodemap.navigation.ExpoGaodeMapNavigationModule
import expo.modules.gaodemap.navigation.listeners.IndependentRouteListener
import expo.modules.gaodemap.navigation.utils.Converters
import expo.modules.kotlin.Promise

/**
 * 独立路径规划业务封装
 *
 * - 将 ExpoGaodeMapNavigationModule 中的 independentXXX 算路逻辑下沉，避免模块文件臃肿
 * - 注意：仍由 Module 暴露 AsyncFunction，调用到本 Service 即可
 */
class IndependentRouteService(
  private val context: Context,
  private val module: ExpoGaodeMapNavigationModule
) {

  // 驾车（小客车）
  fun independentDriveRoute(options: Map<String, Any?>, promise: Promise) {
    try {
      val navi = AMapNavi.getInstance(context)

      @Suppress("UNCHECKED_CAST")
      val from = options["from"] as? Map<String, Any?>
      @Suppress("UNCHECKED_CAST")
      val to = options["to"] as? Map<String, Any?> ?: throw Exception("to is required")

      val fromPoi = from?.let { Converters.parseNaviPoi(it) }
      val toPoi = Converters.parseNaviPoi(to)
      @Suppress("UNCHECKED_CAST")
      val waypoints = Converters.parseWaypoints(options["waypoints"] as? List<Map<String, Any?>>)

      val strategy = resolveDriveStrategy(navi, options)

      val carNumber = options["carNumber"] as? String
      val restriction = options["restriction"] as? Boolean
      if (carNumber != null || restriction != null) {
        setCarInfo(navi, "0", carNumber, restriction)
      }

      navi.independentCalculateRoute(
        fromPoi,
        toPoi,
        waypoints,
        strategy,
        1, // 驾车
        IndependentRouteListener(module, promise)
      )
    } catch (e: Exception) {
      promise.reject("CALCULATE_ERROR", e.message, e)
    }
  }

  // 货车
  fun independentTruckRoute(options: Map<String, Any?>, promise: Promise) {
    try {
      val navi = AMapNavi.getInstance(context)

      val carNumber = options["carNumber"] as? String
      val restriction = options["restriction"] as? Boolean
      setCarInfo(navi, "1", carNumber, restriction)

      @Suppress("UNCHECKED_CAST")
      val from = options["from"] as? Map<String, Any?>
      @Suppress("UNCHECKED_CAST")
      val to = options["to"] as? Map<String, Any?> ?: throw Exception("to is required")

      val fromPoi = from?.let { Converters.parseNaviPoi(it) }
      val toPoi = Converters.parseNaviPoi(to)
      @Suppress("UNCHECKED_CAST")
      val waypoints = Converters.parseWaypoints(options["waypoints"] as? List<Map<String, Any?>>)

      val strategy = resolveDriveStrategy(navi, options)

      navi.independentCalculateRoute(
        fromPoi, toPoi, waypoints, strategy,
        1, // 货车仍归于驾车类型
        IndependentRouteListener(module, promise)
      )
    } catch (e: Exception) {
      promise.reject("CALCULATE_ERROR", e.message, e)
    }
  }

  // 步行
  fun independentWalkRoute(options: Map<String, Any?>, promise: Promise) {
    try {
      val navi = AMapNavi.getInstance(context)

      @Suppress("UNCHECKED_CAST")
      val from = options["from"] as? Map<String, Any?>
      @Suppress("UNCHECKED_CAST")
      val to = options["to"] as? Map<String, Any?> ?: throw Exception("to is required")

      val fromPoi = from?.let { Converters.parseNaviPoi(it) }
      val toPoi = Converters.parseNaviPoi(to)
      @Suppress("UNCHECKED_CAST")
      val waypoints = Converters.parseWaypoints(options["waypoints"] as? List<Map<String, Any?>>)

      val travelStrategy: Int = when {
        options["travelStrategy"] is Number -> (options["travelStrategy"] as Number).toInt()
        options["multiple"] as? Boolean == true -> 1001
        else -> 1000
      }

      navi.independentCalculateRoute(
        fromPoi, toPoi, waypoints, travelStrategy,
        3, // 步行
        IndependentRouteListener(module, promise)
      )
    } catch (e: Exception) {
      promise.reject("CALCULATE_ERROR", e.message, e)
    }
  }

  // 骑行
  fun independentRideRoute(options: Map<String, Any?>, promise: Promise) {
    try {
      val navi = AMapNavi.getInstance(context)

      @Suppress("UNCHECKED_CAST")
      val from = options["from"] as? Map<String, Any?>
      @Suppress("UNCHECKED_CAST")
      val to = options["to"] as? Map<String, Any?> ?: throw Exception("to is required")

      val fromPoi = from?.let { Converters.parseNaviPoi(it) }
      val toPoi = Converters.parseNaviPoi(to)
      @Suppress("UNCHECKED_CAST")
      val waypoints = Converters.parseWaypoints(options["waypoints"] as? List<Map<String, Any?>>)

      val travelStrategy: Int = when {
        options["travelStrategy"] is Number -> (options["travelStrategy"] as Number).toInt()
        options["multiple"] as? Boolean == true -> 1001
        else -> 1000
      }

      navi.independentCalculateRoute(
        fromPoi, toPoi, waypoints, travelStrategy,
        2, // 骑行
        IndependentRouteListener(module, promise)
      )
    } catch (e: Exception) {
      promise.reject("CALCULATE_ERROR", e.message, e)
    }
  }

  // 摩托车（carType=11）
  fun independentMotorcycleRoute(options: Map<String, Any?>, promise: Promise) {
    try {
      val navi = AMapNavi.getInstance(context)

      val carNumber = options["carNumber"] as? String
      val motorcycleCC = (options["motorcycleCC"] as? Number)?.toInt()
      setCarInfo(navi, "11", carNumber, null, motorcycleCC)

      @Suppress("UNCHECKED_CAST")
      val from = options["from"] as? Map<String, Any?>
      @Suppress("UNCHECKED_CAST")
      val to = options["to"] as? Map<String, Any?> ?: throw Exception("to is required")

      val fromPoi = from?.let { Converters.parseNaviPoi(it) }
      val toPoi = Converters.parseNaviPoi(to)
      @Suppress("UNCHECKED_CAST")
      val waypoints = Converters.parseWaypoints(options["waypoints"] as? List<Map<String, Any?>>)

      val strategy = resolveDriveStrategy(navi, options)

      navi.independentCalculateRoute(
        fromPoi, toPoi, waypoints, strategy,
        1, // 驾车类型，由 carType=11 决定摩托车
        IndependentRouteListener(module, promise)
      )
    } catch (e: Exception) {
      promise.reject("CALCULATE_ERROR", e.message, e)
    }
  }

  // 工具：驾车策略
  private fun resolveDriveStrategy(navi: AMapNavi, options: Map<String, Any?>): Int {
    return if (options.containsKey("strategy")) {
      (options["strategy"] as? Number)?.toInt() ?: 0
    } else {
      val avoidCongestion = options["avoidCongestion"] as? Boolean ?: false
      val avoidHighway = options["avoidHighway"] as? Boolean ?: false
      val avoidCost = options["avoidCost"] as? Boolean ?: false
      val prioritiseHighway = options["prioritiseHighway"] as? Boolean ?: false
      try {
        navi.strategyConvert(avoidCongestion, avoidHighway, avoidCost, prioritiseHighway, true)
      } catch (_: Exception) { 0 }
    }
  }

  // 工具：车辆信息
  private fun setCarInfo(
    navi: AMapNavi,
    carType: String,
    carNumber: String? = null,
    restriction: Boolean? = null,
    motorcycleCC: Int? = null
  ) {
    try {
      val carInfo = AMapCarInfo().apply {
        if (carNumber != null) setCarNumber(carNumber)
        setCarType(carType)
        if (restriction != null) isRestriction = restriction
        if (motorcycleCC != null) {
          try {
              this.motorcycleCC = motorcycleCC
          } catch (_: Exception) {}
        }
      }
      navi.setCarInfo(carInfo)
    } catch (_: Exception) {
      // ignore
    }
  }
}