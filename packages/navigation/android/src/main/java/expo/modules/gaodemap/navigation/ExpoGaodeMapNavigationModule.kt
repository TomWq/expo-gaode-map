package expo.modules.gaodemap.navigation

import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.model.AMapCarInfo
import com.amap.api.navi.model.AMapNaviPathGroup
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.gaodemap.navigation.routes.drive.DriveTruckRouteCalculator
import expo.modules.gaodemap.navigation.routes.walkride.WalkRideRouteCalculator
import expo.modules.gaodemap.navigation.routes.ebike.EbikeRouteCalculator
import expo.modules.gaodemap.navigation.listeners.IndependentRouteListener
import expo.modules.gaodemap.navigation.utils.Converters
import expo.modules.gaodemap.navigation.managers.IndependentRouteManager
import expo.modules.gaodemap.navigation.services.IndependentRouteService


/**
 * 高德地图导航模块
 *
 * 仅保留：路径规划（拆分为与官方文档一致的类别）
 * 1. 驾车/货车 路线规划（routes/drive）
 * 2. 骑行/步行 路线规划（routes/walkride）
 * 3. 独立路径规划（归属到各自类别的算路能力；不涉及 UI）
 * 4. 摩托车路径规划（临时以骑行 API 代替，后续可独立扩展）
 * 5. 骑行电动车路径规划（临时以骑行 API 代替，后续可独立扩展）
 *
 * 说明：
 * - 官方导航界面请使用 NaviView 组件（ExpoGaodeMapNaviViewModule）
 * - 不包含：智能巡航、语音控制、无界面导航控制等
 */
class ExpoGaodeMapNavigationModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exception("React context is null")

  // 分门别类的算路计算器（与官方文档分类一致）
  private var driveTruckCalculator: DriveTruckRouteCalculator? = null
  private var walkRideCalculator: WalkRideRouteCalculator? = null
  private var ebikeCalculator: EbikeRouteCalculator? = null

  // 独立路径规划：在原生侧暂存路线组，委托独立管理器，避免 Module 膨胀
  private val independentRouteManager = IndependentRouteManager()
  private var independentRouteService: IndependentRouteService? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoGaodeMapNavigation")

    // 仅保留算路相关事件（用于需要事件的场景；Promise 也会在 Listener 中完成）
    Events(
      "onCalculateRouteSuccess",
      "onCalculateRouteFailure"
    )

    OnDestroy {
      driveTruckCalculator?.destroy()
      walkRideCalculator?.destroy()
      ebikeCalculator?.destroy()
      driveTruckCalculator = null
      walkRideCalculator = null
      ebikeCalculator = null
      independentRouteService = null
      independentRouteManager.clearAll()
    }

    /**
     * 可选：初始化（提前创建内部实例）
     */
    Function("initNavigation") {
      ensureDriveTruck()
      ensureWalkRide()
    }

    /**
     * 清理所有路径计算实例
     * 用于页面切换时释放资源，避免"Another route calculation is in progress"错误
     */
    Function("destroyAllCalculators") {
      driveTruckCalculator?.destroy()
      walkRideCalculator?.destroy()
      ebikeCalculator?.destroy()
      driveTruckCalculator = null
      walkRideCalculator = null
      ebikeCalculator = null
      independentRouteService = null
      independentRouteManager.clearAll()
    }

    // ---------------- 1. 驾车/货车 路线规划 ----------------

    AsyncFunction("calculateDriveRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        ensureDriveTruck().calculateDriveRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    AsyncFunction("calculateTruckRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        ensureDriveTruck().calculateTruckRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    // ---------------- 2. 骑行/步行 路线规划 ----------------

    AsyncFunction("calculateWalkRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        ensureWalkRide().calculateWalkRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    AsyncFunction("calculateRideRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        ensureWalkRide().calculateRideRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    // ---------------- 3. 独立路径规划 ----------------
    // 使用 AMapNavi.independentCalculateRoute，不影响当前导航状态
    // 委托给 IndependentRouteService 处理，避免 Module 文件臃肿
    
    AsyncFunction("independentDriveRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        ensureIndependentService().independentDriveRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    AsyncFunction("independentTruckRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        ensureIndependentService().independentTruckRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    AsyncFunction("independentWalkRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        ensureIndependentService().independentWalkRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    AsyncFunction("independentRideRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        ensureIndependentService().independentRideRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    // 独立摩托车 路线规划（与驾车一致，依赖车辆信息 carType=11）
    AsyncFunction("independentMotorcycleRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        ensureIndependentService().independentMotorcycleRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    // 提供对独立路径组的操作能力：选路/启动/清理

    /**
     * 选择独立路径组中的主路线
     * 参数：
     * - token: Int（independentXXX 接口返回的 token）
     * - routeId: Int（12/13/14...，优先）
     * - routeIndex: Int（0/1/2，对 routeId 的便捷封装，若 routeId 未传则使用）
     */
    AsyncFunction("selectIndependentRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        val token = (options["token"] as? Number)?.toInt() ?: throw Exception("token is required")
        val routeId = (options["routeId"] as? Number)?.toInt()
        val routeIndex = (options["routeIndex"] as? Number)?.toInt()
        val ok = independentRouteManager.select(token, routeId, routeIndex)
        if (!ok) throw Exception("select route failed")
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("SELECT_ROUTE_ERROR", e.message, e)
      }
    }

    /**
     * 使用指定独立路径组启动导航
     * 参数：
     * - token: Int
     * - naviType: Int（0=GPS，1=EMULATOR；默认0）
     * - routeId/routeIndex: 可选，启动前选择主路线
     */
    AsyncFunction("startNaviWithIndependentPath") { options: Map<String, Any?>, promise: Promise ->
      try {
        val token = (options["token"] as? Number)?.toInt() ?: throw Exception("token is required")
        val routeId = (options["routeId"] as? Number)?.toInt()
        val routeIndex = (options["routeIndex"] as? Number)?.toInt()
        val naviType = (options["naviType"] as? Number)?.toInt() ?: 0
        val ok = independentRouteManager.start(context, token, naviType, routeId, routeIndex)
        if (!ok) throw Exception("startNaviWithPath failed")
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("START_NAVI_ERROR", e.message, e)
      }
    }

    /**
     * 清除独立路径组
     * - token: Int
     */
    AsyncFunction("clearIndependentRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        val token = (options["token"] as? Number)?.toInt() ?: throw Exception("token is required")
        independentRouteManager.clear(token)
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("CLEAR_ROUTE_ERROR", e.message, e)
      }
    }

    // ---------------- 4. 摩托车 路线规划 ----------------
    // 注意：摩托车是收费能力；务必在算路前设置 carType=11 和排量，否则不生效
    AsyncFunction("calculateMotorcycleRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        // 设置摩托车车辆信息（车牌可选、排量可选）
        try {
          val carNumber = options["carNumber"] as? String
          val motorcycleCC = (options["motorcycleCC"] as? Number)?.toInt()
          val carInfo = AMapCarInfo().apply {
            if (carNumber != null) setCarNumber(carNumber)
              carType = "11" // 11 = 摩托车
            if (motorcycleCC != null) {
              try {
                  this.motorcycleCC = motorcycleCC
              } catch (_: Exception) {}
            }
          }
          AMapNavi.getInstance(context).setCarInfo(carInfo)
        } catch (_: Exception) {
          // ignore
        }

        // 复用驾车算路逻辑（含 strategyConvert / 途经点等）
        ensureDriveTruck().calculateDriveRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    // ---------------- 5. 骑行电动车 路线规划 ----------------
    // 暂无单独 SDK API，先复用骑行算路（后续如有官方专门接口，再独立 Calculator）
    AsyncFunction("calculateEBikeRoute") { options: Map<String, Any?>, promise: Promise ->
      try {
        // 使用电动车专用 Calculator，对齐 SDK 的 calculateEleBikeRoute 三种重载
        ensureEbike().calculateEleBikeRoute(options, promise)
      } catch (e: Exception) {
        promise.reject("CALCULATE_ERROR", e.message, e)
      }
    }

    // （可选）公交：官方文档归属搜索/出行服务，导航 SDK 内无直算支持；保持未实现提示
//    AsyncFunction("calculateBusRoute") { @Suppress("UNUSED_PARAMETER") options: Map<String, Any?>, promise: Promise ->
//      promise.reject("NOT_IMPLEMENTED", "Bus route calculation requires search service", null)
//    }
  }

  // MARK: - Private

  /**
   * 存储独立路径组并返回 token
   * 由 IndependentRouteListener 在算路成功时调用
   */
  internal fun storeIndependentGroup(group: AMapNaviPathGroup): Int {
    return independentRouteManager.store(group)
  }

  private fun ensureDriveTruck(): DriveTruckRouteCalculator {
    if (driveTruckCalculator == null) {
      driveTruckCalculator = DriveTruckRouteCalculator(context, this)
    }
    return driveTruckCalculator!!
  }

  private fun ensureWalkRide(): WalkRideRouteCalculator {
    if (walkRideCalculator == null) {
      walkRideCalculator = WalkRideRouteCalculator(context, this)
    }
    return walkRideCalculator!!
  }

  private fun ensureEbike(): EbikeRouteCalculator {
    if (ebikeCalculator == null) {
      ebikeCalculator = EbikeRouteCalculator(context, this)
    }
    return ebikeCalculator!!
  }

  private fun ensureIndependentService(): IndependentRouteService {
    if (independentRouteService == null) {
      independentRouteService = IndependentRouteService(context, this)
    }
    return independentRouteService!!
  }

  /**
   * 发送事件到 JS 层
   */
  internal fun sendEvent(name: String, params: Map<String, Any?>?) {
    this@ExpoGaodeMapNavigationModule.sendEvent(name, params)
  }
}