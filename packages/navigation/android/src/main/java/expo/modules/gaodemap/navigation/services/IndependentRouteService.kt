package expo.modules.gaodemap.navigation.services

import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.model.AMapCarInfo
import com.amap.api.navi.model.NaviLatLng
import com.amap.api.navi.model.NaviPoi
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
  companion object {
    private const val TAG = "IndependentRouteService"
  }

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
      val waypointsRaw = options["waypoints"] as? List<Map<String, Any?>>
      val waypointsPoi = Converters.parseWaypoints(waypointsRaw)

      val strategy = resolveDriveStrategy(navi, options)

      val carNumber = options["carNumber"] as? String
      val restriction = options["restriction"] as? Boolean
      if (carNumber != null || restriction != null) {
        setCarInfo(navi, "0", carNumber, restriction)
      }

      val listener = IndependentRouteListener(module, promise)
      val avoidPolygons = Converters.parseAvoidPolygons(options["avoidPolygons"])
      val avoidRoad = (options["avoidRoad"] as? String)?.trim()?.takeIf { it.isNotEmpty() }
      val hasAvoidPolygon = avoidPolygons.isNotEmpty()
      val hasAvoidRoad = !avoidRoad.isNullOrBlank()

      if (hasAvoidPolygon || hasAvoidRoad) {
        val fromLatLng = from?.let { Converters.parseNaviLatLng(it) }
        val toLatLng = Converters.parseNaviLatLng(to)
        val waypointsLatLng = Converters.parseWaypointsLatLng(waypointsRaw)

        val reflected = invokeIndependentDriveRouteWithAvoidByReflection(
          navi = navi,
          fromPoi = fromPoi,
          toPoi = toPoi,
          waypointsPoi = waypointsPoi,
          fromLatLng = fromLatLng,
          toLatLng = toLatLng,
          waypointsLatLng = waypointsLatLng,
          strategy = strategy,
          avoidPolygons = avoidPolygons,
          avoidRoad = avoidRoad.orEmpty(),
          listener = listener
        )

        when (reflected) {
          true -> return
          false -> {
            promise.reject("CALCULATE_ERROR", "独立避让算路启动失败", null)
            return
          }

          null -> {
            android.util.Log.w(TAG, "当前 SDK 不支持 independentCalculateRoute 的避让参数重载")
            promise.reject(
              "AVOID_NOT_SUPPORTED",
              "当前安卓 SDK 不支持独立路径的避让参数，请升级 navi-3dmap SDK",
              null
            )
            return
          }
        }
      }

      navi.independentCalculateRoute(
        fromPoi,
        toPoi,
        waypointsPoi,
        strategy,
        1, // 驾车
        listener
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
      } catch (_: Exception) {
        0
      }
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
          } catch (_: Exception) {
          }
        }
      }
      navi.setCarInfo(carInfo)
    } catch (_: Exception) {
      // ignore
    }
  }

  /**
   * 兼容不同版本 SDK 的 independentCalculateRoute 避让参数能力。
   *
   * 返回：
   * - true: 已成功调用到某个重载，后续等待回调
   * - false: 命中重载但返回失败
   * - null: 未找到可匹配的重载
   */
  private fun invokeIndependentDriveRouteWithAvoidByReflection(
    navi: AMapNavi,
    fromPoi: NaviPoi?,
    toPoi: NaviPoi,
    waypointsPoi: List<NaviPoi>,
    fromLatLng: NaviLatLng?,
    toLatLng: NaviLatLng,
    waypointsLatLng: List<NaviLatLng>,
    strategy: Int,
    avoidPolygons: List<List<NaviLatLng>>,
    avoidRoad: String,
    listener: IndependentRouteListener
  ): Boolean? {
    val startList = fromLatLng?.let { listOf(it) }
    val endList = listOf(toLatLng)
    val hasAvoidRoad = avoidRoad.isNotBlank()

    val avoidPolygonArgs: List<Any> = buildList {
      if (avoidPolygons.isNotEmpty()) {
        add(avoidPolygons)
        add(avoidPolygons.first())
        add(avoidPolygons.flatten())
      } else {
        add(emptyList<NaviLatLng>())
      }
    }

    for (avoidArg in avoidPolygonArgs) {
      if (startList != null) {
        val listArgs = buildList<Array<Any>> {
          add(arrayOf(startList, endList, waypointsLatLng, avoidArg, avoidRoad, strategy, 1, listener))
          add(arrayOf(startList, endList, waypointsLatLng, avoidArg, strategy, 1, listener))
          if (hasAvoidRoad) {
            add(arrayOf(startList, endList, waypointsLatLng, avoidRoad, strategy, 1, listener))
          }
        }

        for (args in listArgs) {
          invokeMethodIfMatch(
            target = navi,
            methodName = "independentCalculateRoute",
            args = args
          )?.let { return it }
        }
      }

      if (fromPoi != null) {
        val poiArgs = buildList<Array<Any>> {
          add(arrayOf(fromPoi, toPoi, waypointsPoi, avoidArg, avoidRoad, strategy, 1, listener))
          add(arrayOf(fromPoi, toPoi, waypointsPoi, avoidArg, strategy, 1, listener))
          if (hasAvoidRoad) {
            add(arrayOf(fromPoi, toPoi, waypointsPoi, avoidRoad, strategy, 1, listener))
          }
        }

        for (args in poiArgs) {
          invokeMethodIfMatch(
            target = navi,
            methodName = "independentCalculateRoute",
            args = args
          )?.let { return it }
        }
      }
    }

    return null
  }

  private fun invokeMethodIfMatch(
    target: Any,
    methodName: String,
    args: Array<Any>
  ): Boolean? {
    val methods = target.javaClass.methods.filter { method ->
      method.name == methodName && method.parameterTypes.size == args.size
    }

    for (method in methods) {
      if (!areArgsCompatible(method.parameterTypes, args)) continue
      try {
        val value = method.invoke(target, *args)
        return if (value is Boolean) value else true
      } catch (_: Exception) {
        // 尝试下一个重载
      }
    }

    return null
  }

  private fun areArgsCompatible(paramTypes: Array<Class<*>>, args: Array<Any>): Boolean {
    if (paramTypes.size != args.size) return false
    for (index in paramTypes.indices) {
      val expected = boxPrimitive(paramTypes[index])
      val actual = args[index].javaClass
      if (!expected.isAssignableFrom(actual)) return false
    }
    return true
  }

  private fun boxPrimitive(type: Class<*>): Class<*> {
    return when (type) {
      java.lang.Integer.TYPE -> java.lang.Integer::class.java
      java.lang.Long.TYPE -> java.lang.Long::class.java
      java.lang.Boolean.TYPE -> java.lang.Boolean::class.java
      java.lang.Float.TYPE -> java.lang.Float::class.java
      java.lang.Double.TYPE -> java.lang.Double::class.java
      java.lang.Short.TYPE -> java.lang.Short::class.java
      java.lang.Byte.TYPE -> java.lang.Byte::class.java
      java.lang.Character.TYPE -> java.lang.Character::class.java
      else -> type
    }
  }
}
