package expo.modules.gaodemap.navigation.routes.drive

import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.model.AMapCarInfo
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
    val waypoints = Converters.parseWaypoints(options["waypoints"] as? List<Map<String, Any?>>)

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

    // 小客车可选设置：车牌/限行
    val carNumber = options["carNumber"] as? String
    val restriction = options["restriction"] as? Boolean
    if (carNumber != null || restriction != null) {
      try {
        val carInfo = AMapCarInfo().apply {
          if (carNumber != null) setCarNumber(carNumber)
            carType = "0" // 0=小客车
          if (restriction != null) isRestriction = restriction
        }
        aMapNavi?.setCarInfo(carInfo)
      } catch (_: Exception) {
        // ignore
      }
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
    
    val result = aMapNavi?.calculateDriveRoute(fromPoi, toPoi, waypoints, strategy)
    android.util.Log.d("DriveTruckRouteCalculator", "calculateDriveRoute 返回: $result")
  }

  /**
   * 货车路径规划
   * 注意：该能力为收费接口；需要商务开通。未开通可能算路失败。
   */
  fun calculateTruckRoute(options: Map<String, Any?>, promise: Promise) {
    // 先设置货车信息，再复用驾车算路流程
    try {
      val carNumber = options["carNumber"] as? String
      val restriction = options["restriction"] as? Boolean

      val carInfo = AMapCarInfo().apply {
        if (carNumber != null) setCarNumber(carNumber)
          carType = "1" // 1/3/5 视为货车，这里取 1
        if (restriction != null) isRestriction = restriction

        // 可按需扩展更详细的货车参数（示例）：
        // setVehicleAxis("6")
        // setVehicleHeight("3.5")
        // setVehicleLength("7.3")
        // setVehicleWidth("2.5")
        // setVehicleSize("4")
        // setVehicleLoad("25.99")
        // setVehicleWeight("20")
        // setVehicleLoadSwitch(true)
      }
      aMapNavi?.setCarInfo(carInfo)
    } catch (_: Exception) {
      // ignore
    }

    // 标注场景（truck），并期望多路线
    routeListener?.scene = "truck"
    routeListener?.multiple = true

    calculateDriveRoute(options, promise)
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