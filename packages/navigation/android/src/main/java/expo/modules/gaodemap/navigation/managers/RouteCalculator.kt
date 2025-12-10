package expo.modules.gaodemap.navigation.managers

import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.model.AMapCarInfo

import expo.modules.kotlin.Promise
import expo.modules.gaodemap.navigation.ExpoGaodeMapNavigationModule
import expo.modules.gaodemap.navigation.utils.Converters
import expo.modules.gaodemap.navigation.listeners.RouteCalculateListener

/**
 * 路径规划管理器
 * 
 * 负责处理各种类型的路径规划：驾车、步行、骑行、公交、货车
 */
class RouteCalculator(
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
      routeListener = RouteCalculateListener(module)
      aMapNavi?.addAMapNaviListener(routeListener)
    }
  }

  /**
   * 驾车路径规划
   */
  fun calculateDriveRoute(options: Map<String, Any?>, promise: Promise) {
    @Suppress("UNCHECKED_CAST")
    val from = options["from"] as? Map<String, Any?>
    @Suppress("UNCHECKED_CAST")
    val to = options["to"] as? Map<String, Any?>
      ?: throw Exception("to is required")

    val fromPoi = from?.let { Converters.parseNaviPoi(it) }
    val toPoi = Converters.parseNaviPoi(to)
    @Suppress("UNCHECKED_CAST")
    val waypoints = Converters.parseWaypoints(options["waypoints"] as? List<Map<String, Any?>>)

    // 支持两种策略传参：
    // 1) 直接传 PathPlanningStrategy 的整型值：strategy
    // 2) 传策略开关（建议）：avoidCongestion/avoidHighway/avoidCost/prioritiseHighway
    val strategy: Int = if (options.containsKey("strategy")) {
      (options["strategy"] as? Number)?.toInt() ?: 0
    } else {
      val avoidCongestion = options["avoidCongestion"] as? Boolean ?: false
      val avoidHighway = options["avoidHighway"] as? Boolean ?: false
      val avoidCost = options["avoidCost"] as? Boolean ?: false
      val prioritiseHighway = options["prioritiseHighway"] as? Boolean ?: false
      try {
        // 6.3+ multipleRoute 参数已无效，但保留 true 以获取多路线策略
        aMapNavi?.strategyConvert(avoidCongestion, avoidHighway, avoidCost, prioritiseHighway, true) ?: 0
      } catch (e: Exception) {
        0
      }
    }

    // 若提供了车牌/限行信息，则在算路前设置车辆信息（小客车）
    val carNumber = options["carNumber"] as? String
    val restriction = options["restriction"] as? Boolean
    if (carNumber != null || restriction != null) {
      try {
        val carInfo = AMapCarInfo().apply {
          if (carNumber != null) setCarNumber(carNumber)
          // 0=小客车；如为货车请使用 calculateTruckRoute 并设置 carType=1
          setCarType("0")
          if (restriction != null) setRestriction(restriction)
        }
        aMapNavi?.setCarInfo(carInfo)
      } catch (_: Exception) {
        // 忽略设置失败，不影响算路
      }
    }

    routeListener?.currentPromise = promise
    // 官方 API：POI 算路
    aMapNavi?.calculateDriveRoute(fromPoi, toPoi, waypoints, strategy)
  }

  /**
   * 步行路径规划（使用 NaviLatLng）
   */
  fun calculateWalkRoute(options: Map<String, Any?>, promise: Promise) {
    @Suppress("UNCHECKED_CAST")
    val from = options["from"] as? Map<String, Any?>
      ?: throw Exception("from is required")
    @Suppress("UNCHECKED_CAST")
    val to = options["to"] as? Map<String, Any?>
      ?: throw Exception("to is required")
    
    val fromLatLng = Converters.parseNaviLatLng(from)
    val toLatLng = Converters.parseNaviLatLng(to)
    
    routeListener?.currentPromise = promise
    aMapNavi?.calculateWalkRoute(fromLatLng, toLatLng)
  }

  /**
   * 骑行路径规划（使用 NaviLatLng）
   */
  fun calculateRideRoute(options: Map<String, Any?>, promise: Promise) {
    @Suppress("UNCHECKED_CAST")
    val from = options["from"] as? Map<String, Any?>
      ?: throw Exception("from is required")
    @Suppress("UNCHECKED_CAST")
    val to = options["to"] as? Map<String, Any?>
      ?: throw Exception("to is required")
    
    val fromLatLng = Converters.parseNaviLatLng(from)
    val toLatLng = Converters.parseNaviLatLng(to)
    
    routeListener?.currentPromise = promise
    aMapNavi?.calculateRideRoute(fromLatLng, toLatLng)
  }

  /**
   * 公交路径规划
   * 注意：公交路径规划需要使用搜索服务，这里返回未实现错误
   */
  fun calculateBusRoute(options: Map<String, Any?>, promise: Promise) {
    promise.reject("NOT_IMPLEMENTED", "Bus route calculation requires search service", null)
  }

  /**
   * 货车路径规划
   */
  fun calculateTruckRoute(options: Map<String, Any?>, promise: Promise) {
    // 货车路径规划：在算路前设置货车信息
    try {
      val carNumber = options["carNumber"] as? String
      val restriction = options["restriction"] as? Boolean
      val carInfo = AMapCarInfo().apply {
        if (carNumber != null) setCarNumber(carNumber)
        // 1=货车（CarType 为 1/3/5 均视为货车），这里取 1 作为通用值
        setCarType("1")
        if (restriction != null) setRestriction(restriction)
        // 如需更精细的车型参数（轴数/长宽高/载重等），可在此扩展：
        // setVehicleAxis("6"); setVehicleHeight("3.5"); setVehicleLength("7.3"); setVehicleWidth("2.5");
        // setVehicleSize("4"); setVehicleLoad("25.99"); setVehicleWeight("20"); setVehicleLoadSwitch(true);
      }
      aMapNavi?.setCarInfo(carInfo)
    } catch (_: Exception) {
      // 忽略设置失败，不影响后续算路
    }

    // 复用驾车算路逻辑（含 strategyConvert）
    calculateDriveRoute(options, promise)
  }

  fun destroy() {
    aMapNavi?.removeAMapNaviListener(routeListener)
    try {
      // 官方建议：销毁单例释放资源
      AMapNavi.destroy()
    } catch (_: Exception) {
    } finally {
      aMapNavi = null
      routeListener = null
    }
  }
}