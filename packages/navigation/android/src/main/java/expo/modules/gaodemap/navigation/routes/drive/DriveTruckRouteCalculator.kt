package expo.modules.gaodemap.navigation.routes.drive

import android.annotation.SuppressLint
import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.model.AMapCarInfo
import com.amap.api.navi.model.NaviLatLng
import com.amap.api.navi.model.NaviPoi
import expo.modules.gaodemap.navigation.ExpoGaodeMapNavigationModule
import expo.modules.gaodemap.navigation.listeners.RouteCalculateListener
import expo.modules.gaodemap.navigation.utils.Converters
import expo.modules.kotlin.Promise

/**
 * 驾车/货车 路线规划计算器
 *
 * 对齐官方文档：
 * - 使用 AMapNavi.calculateDriveRoute(...)（POI/经纬度两种思路，这里采用 POI 形式，亦可传入仅经纬度）
 * - 策略支持两种：
 *   1) 直接传 PathPlanningStrategy 整型值：strategy
 *   2) 通过 strategyConvert(avoidCongestion/avoidHighway/avoidCost/prioritiseHighway)
 * - 货车：在算路前设置 AMapCarInfo.carType=1，且支持车牌/限行开关（可按需扩展 轴数/长宽高/载重等）
 */
class DriveTruckRouteCalculator(
  private val context: Context,
  private val module: ExpoGaodeMapNavigationModule
) {
  companion object {
    private const val TAG = "DriveTruckRouteCalculator"
  }

  private var aMapNavi: AMapNavi? = null
  private var routeListener: RouteCalculateListener? = null
  private var isInitialized = false

  init {
    initNavi()
  }

  private fun initNavi() {
    if (aMapNavi == null) {
      try {
        aMapNavi = AMapNavi.getInstance(context)
        
        // 检查SDK是否正确初始化（验证API Key）
        if (aMapNavi == null) {
          throw Exception("高德地图导航SDK初始化失败,请检查API Key配置是否正确。请在app.json中配置android.config.gaodeMapKey")
        }
        
        routeListener = RouteCalculateListener(module)
        aMapNavi?.addAMapNaviListener(routeListener)
        
        // 设置出行模式为驾车模式（默认）
        aMapNavi?.setEmulatorNaviSpeed(80) // 设置模拟导航速度
        
        isInitialized = true
        android.util.Log.d("DriveTruckRouteCalculator", "AMapNavi 初始化成功")
      } catch (e: Exception) {
        android.util.Log.e("DriveTruckRouteCalculator", "AMapNavi 初始化失败", e)
        throw e
      }
    }
  }

  /**
   * 驾车路径规划
   */
  @SuppressLint("SuspiciousIndentation")
  fun calculateDriveRoute(options: Map<String, Any?>, promise: Promise) {
    android.util.Log.d("DriveTruckRouteCalculator", "开始计算驾车路线，初始化状态: $isInitialized")
    
    // 确保初始化完成
    if (!isInitialized) {
      try {
        initNavi()
      } catch (e: Exception) {
        promise.reject("INIT_FAILED", e.message ?: "高德地图导航SDK初始化失败", e)
        return
      }
      // 再次检查，如果仍然未初始化，延迟重试
      if (!isInitialized) {
        android.util.Log.d("DriveTruckRouteCalculator", "初始化未完成，延迟500ms重试")
        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
          calculateDriveRoute(options, promise)
        }, 500)
        return
      }
    }
    
    android.util.Log.d("DriveTruckRouteCalculator", "AMapNavi 实例: ${aMapNavi != null}")
    
    // 添加防重复调用检查
    if (routeListener?.currentPromise != null) {
      android.util.Log.w("DriveTruckRouteCalculator", "当前已有正在计算的请求，忽略新请求")
      promise.reject("BUSY", "Another route calculation is in progress", null)
      return
    }

    @Suppress("UNCHECKED_CAST")
    val from = options["from"] as? Map<String, Any?>
    @Suppress("UNCHECKED_CAST")
    val to = options["to"] as? Map<String, Any?>
      ?: throw Exception("to is required")

    val fromPoi = from?.let { Converters.parseNaviPoi(it) }
    val toPoi = Converters.parseNaviPoi(to)
    @Suppress("UNCHECKED_CAST")
    val waypointsRaw = options["waypoints"] as? List<Map<String, Any?>>
    val waypoints = Converters.parseWaypoints(waypointsRaw)

    // 1) 直接传策略值，或 2) 通过 strategyConvert 计算
    val strategy: Int = if (options.containsKey("strategy")) {
      (options["strategy"] as? Number)?.toInt() ?: 0
    } else {
      val avoidCongestion = options["avoidCongestion"] as? Boolean ?: false
      val avoidHighway = options["avoidHighway"] as? Boolean ?: false
      val avoidCost = options["avoidCost"] as? Boolean ?: false
      val prioritiseHighway = options["prioritiseHighway"] as? Boolean ?: false
      try {
        aMapNavi?.strategyConvert(avoidCongestion, avoidHighway, avoidCost, prioritiseHighway, true) ?: 0
      } catch (_: Exception) {
        0
      }
    }

    val explicitCarType = when (val rawCarType = options["carType"]) {
      is String -> rawCarType.trim().takeIf { it.isNotEmpty() }
      is Number -> rawCarType.toInt().toString()
      else -> null
    }
    val carNumber = options["carNumber"] as? String
    val restriction = options["restriction"] as? Boolean
    val motorcycleCC = (options["motorcycleCC"] as? Number)?.toInt()
    try {
      val carInfo = AMapCarInfo().apply {
        carType = explicitCarType ?: "0"
        if (carNumber != null) setCarNumber(carNumber)
        if (restriction != null) isRestriction = restriction
        if (motorcycleCC != null) {
          try {
            this.motorcycleCC = motorcycleCC
          } catch (_: Exception) {}
        }
      }
      aMapNavi?.setCarInfo(carInfo)
    } catch (_: Exception) {
      // ignore
    }

    // 标注场景与多路线期望（默认 drive；若上层已指定 scene 则尊重）
    if (routeListener?.scene == null) {
      routeListener?.scene = "drive"
    }
    routeListener?.multiple = true
    routeListener?.currentPromise = promise
    
    android.util.Log.d("DriveTruckRouteCalculator", "调用 calculateDriveRoute")
    android.util.Log.d("DriveTruckRouteCalculator", "起点: $fromPoi")
    android.util.Log.d("DriveTruckRouteCalculator", "终点: $toPoi")
    android.util.Log.d("DriveTruckRouteCalculator", "策略: $strategy")

    val fromLatLng = from?.let { Converters.parseNaviLatLng(it) }
    val toLatLng = Converters.parseNaviLatLng(to)
    val waypointsLatLng = Converters.parseWaypointsLatLng(waypointsRaw)
    val avoidPolygons = Converters.parseAvoidPolygons(options["avoidPolygons"])
    val avoidRoad = (options["avoidRoad"] as? String)?.trim()?.takeIf { it.isNotEmpty() }

    val result = calculateDriveRouteWithOptionalAvoid(
      fromPoi = fromPoi,
      toPoi = toPoi,
      waypointsPoi = waypoints,
      fromLatLng = fromLatLng,
      toLatLng = toLatLng,
      waypointsLatLng = waypointsLatLng,
      strategy = strategy,
      avoidPolygons = avoidPolygons,
      avoidRoad = avoidRoad
    )

    android.util.Log.d("DriveTruckRouteCalculator", "calculateDriveRoute 返回: $result")
  }

  /**
   * 货车路径规划
   * 注意：该能力为收费接口；需要商务开通。未开通可能算路失败。
   */
  fun calculateTruckRoute(options: Map<String, Any?>, promise: Promise) {
    val truckOptions = options.toMutableMap()
    if (truckOptions["carType"] == null) {
      truckOptions["carType"] = "1"
    }

    routeListener?.scene = "truck"
    routeListener?.multiple = true

    calculateDriveRoute(truckOptions, promise)
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

  /**
   * 兼容不同版本 SDK 的避让参数能力：
   * - 若传了 avoidPolygons / avoidRoad，优先尝试反射调用带避让参数的重载；
   * - 不可用时回退到普通算路，保证兼容性。
   */
  private fun calculateDriveRouteWithOptionalAvoid(
    fromPoi: NaviPoi?,
    toPoi: NaviPoi,
    waypointsPoi: List<NaviPoi>,
    fromLatLng: NaviLatLng?,
    toLatLng: NaviLatLng,
    waypointsLatLng: List<NaviLatLng>,
    strategy: Int,
    avoidPolygons: List<List<NaviLatLng>>,
    avoidRoad: String?
  ): Boolean {
    val navi = aMapNavi ?: return false
    val hasAvoidPolygon = avoidPolygons.isNotEmpty()
    val hasAvoidRoad = !avoidRoad.isNullOrBlank()

    if (hasAvoidPolygon || hasAvoidRoad) {
      val reflected = invokeDriveRouteWithAvoidByReflection(
        navi = navi,
        fromPoi = fromPoi,
        toPoi = toPoi,
        waypointsPoi = waypointsPoi,
        fromLatLng = fromLatLng,
        toLatLng = toLatLng,
        waypointsLatLng = waypointsLatLng,
        strategy = strategy,
        avoidPolygons = avoidPolygons,
        avoidRoad = avoidRoad.orEmpty()
      )

      if (reflected != null) {
        return reflected
      }

      android.util.Log.w(
        TAG,
        "avoidPolygons/avoidRoad 已传入，但当前 SDK 重载不可用，回退到普通算路"
      )
    }

    return navi.calculateDriveRoute(fromPoi, toPoi, waypointsPoi, strategy)
  }

  private fun invokeDriveRouteWithAvoidByReflection(
    navi: AMapNavi,
    fromPoi: NaviPoi?,
    toPoi: NaviPoi,
    waypointsPoi: List<NaviPoi>,
    fromLatLng: NaviLatLng?,
    toLatLng: NaviLatLng,
    waypointsLatLng: List<NaviLatLng>,
    strategy: Int,
    avoidPolygons: List<List<NaviLatLng>>,
    avoidRoad: String
  ): Boolean? {
    val startList = fromLatLng?.let { listOf(it) }
    val endList = listOf(toLatLng)

    val avoidPolygonArgs: List<Any> = buildList {
      if (avoidPolygons.isNotEmpty()) {
        add(avoidPolygons)
        add(avoidPolygons.first())
        add(avoidPolygons.flatten())
      } else {
        add(emptyList<NaviLatLng>())
      }
    }

    // 依次尝试常见重载：List 版本、POI 版本；以及是否包含 avoidRoad。
    for (avoidArg in avoidPolygonArgs) {
      if (startList != null) {
        invokeBooleanMethodIfMatch(
          target = navi,
          methodName = "calculateDriveRoute",
          args = arrayOf(startList, endList, waypointsLatLng, avoidArg, avoidRoad, strategy)
        )?.let { return it }

        invokeBooleanMethodIfMatch(
          target = navi,
          methodName = "calculateDriveRoute",
          args = arrayOf(startList, endList, waypointsLatLng, avoidArg, strategy)
        )?.let { return it }
      }

      if (fromPoi != null) {
        invokeBooleanMethodIfMatch(
          target = navi,
          methodName = "calculateDriveRoute",
          args = arrayOf(fromPoi, toPoi, waypointsPoi, avoidArg, avoidRoad, strategy)
        )?.let { return it }

        invokeBooleanMethodIfMatch(
          target = navi,
          methodName = "calculateDriveRoute",
          args = arrayOf(fromPoi, toPoi, waypointsPoi, avoidArg, strategy)
        )?.let { return it }
      }
    }

    return null
  }

  private fun invokeBooleanMethodIfMatch(
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
        if (value is Boolean) return value
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
