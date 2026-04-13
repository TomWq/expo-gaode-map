package expo.modules.gaodemap.navigation

import android.annotation.SuppressLint
import android.content.Context
import com.amap.api.navi.AMapNavi
import com.amap.api.navi.model.AMapCarInfo
import com.amap.api.navi.model.AMapNaviPathGroup
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.gaodemap.map.modules.SDKInitializer
import expo.modules.gaodemap.navigation.routes.drive.DriveTruckRouteCalculator
import expo.modules.gaodemap.navigation.routes.walkride.WalkRideRouteCalculator
import expo.modules.gaodemap.navigation.routes.ebike.EbikeRouteCalculator
import expo.modules.gaodemap.navigation.listeners.IndependentRouteListener
import expo.modules.gaodemap.navigation.utils.Converters
import expo.modules.gaodemap.navigation.managers.IndependentRouteManager
import expo.modules.gaodemap.navigation.services.IndependentRouteService
import java.util.Locale


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

  @SuppressLint("SuspiciousIndentation")
  override fun definition() = ModuleDefinition {
    Name("ExpoGaodeMapNavigation")

    OnCreate {
      appContext.reactContext?.let { context ->
        SDKInitializer.restorePersistedState(context)
      }
    }

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
        ensureNavigationPrivacyReady()
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
     * 打开高德官方导航页面（AmapNaviPage.showRouteActivity）
     * 参数：
     * - from?: { latitude, longitude, name?, poiId? }（可选，不传则使用当前位置）
     * - to: { latitude, longitude, name?, poiId? }（必填）
     * - waypoints?: Array<{ latitude, longitude, name?, poiId? }>（可选）
     * - needCalculateRouteWhenPresent?: Boolean（默认 true）
     * - needDestroyDriveManagerInstanceWhenNaviExit?: Boolean（默认 false）
     * - showExitNaviDialog?: Boolean（默认 true）
     * - useInnerVoice?: Boolean（默认 true）
     * - pageType?: String（可选，例如 ROUTE/NAVI）
     * - officialNaviType?: String（可选，例如 DRIVER）
     */
    AsyncFunction("openOfficialNaviPage") { options: Map<String, Any?>, promise: Promise ->
      try {
        ensureNavigationPrivacyReady()
        openOfficialNaviPage(options)
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject("OPEN_OFFICIAL_PAGE_ERROR", e.message, e)
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
        ensureNavigationPrivacyReady()
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
    ensureNavigationPrivacyReady()
    if (driveTruckCalculator == null) {
      driveTruckCalculator = DriveTruckRouteCalculator(context, this)
    }
    return driveTruckCalculator!!
  }

  private fun ensureWalkRide(): WalkRideRouteCalculator {
    ensureNavigationPrivacyReady()
    if (walkRideCalculator == null) {
      walkRideCalculator = WalkRideRouteCalculator(context, this)
    }
    return walkRideCalculator!!
  }

  private fun ensureEbike(): EbikeRouteCalculator {
    ensureNavigationPrivacyReady()
    if (ebikeCalculator == null) {
      ebikeCalculator = EbikeRouteCalculator(context, this)
    }
    return ebikeCalculator!!
  }

  private fun ensureIndependentService(): IndependentRouteService {
    ensureNavigationPrivacyReady()
    if (independentRouteService == null) {
      independentRouteService = IndependentRouteService(context, this)
    }
    return independentRouteService!!
  }

  private fun ensureNavigationPrivacyReady() {
    SDKInitializer.restorePersistedState(context)
    if (!SDKInitializer.isPrivacyReady()) {
      throw Exception(
        "隐私协议未完成确认，请先调用 setPrivacyConfig（hasShow/hasContainsPrivacy/hasAgree 均为 true）"
      )
    }
  }

  private fun openOfficialNaviPage(options: Map<String, Any?>) {
    @Suppress("UNCHECKED_CAST")
    val from = options["from"] as? Map<String, Any?>
    @Suppress("UNCHECKED_CAST")
    val to = options["to"] as? Map<String, Any?> ?: throw Exception("to is required")
    @Suppress("UNCHECKED_CAST")
    val waypointsRaw = options["waypoints"] as? List<Map<String, Any?>>

    val startPoi = createOfficialPoi(from, "起点")
    val endPoi = createOfficialPoi(to, "终点")
      ?: throw Exception("to is required and must contain latitude/longitude")
    val waypointPois = waypointsRaw
      ?.mapIndexedNotNull { index, item -> createOfficialPoi(item, "途经点${index + 1}") }
      ?: emptyList()

    val params = createAmapNaviParams(
      startPoi = startPoi,
      endPoi = endPoi,
      waypointPois = waypointPois,
      options = options
    )
    showOfficialNaviPage(params)
  }

  private fun createOfficialPoi(
    coordinate: Map<String, Any?>?,
    fallbackName: String
  ): Any? {
    if (coordinate == null) return null

    val latitude = (coordinate["latitude"] as? Number)?.toDouble()
      ?: throw Exception("coordinate.latitude is required")
    val longitude = (coordinate["longitude"] as? Number)?.toDouble()
      ?: throw Exception("coordinate.longitude is required")
    val name = (coordinate["name"] as? String)?.trim()?.takeIf { it.isNotEmpty() } ?: fallbackName
    val poiId = (coordinate["poiId"] as? String).orEmpty()

    val latLngClass = Class.forName("com.amap.api.maps.model.LatLng")
    val latLng = latLngClass
      .getConstructor(Double::class.javaPrimitiveType, Double::class.javaPrimitiveType)
      .newInstance(latitude, longitude)

    val poiClass = Class.forName("com.amap.api.maps.model.Poi")
    val candidates = listOf<Array<Any?>>(
      arrayOf(name, latLng, poiId),
      arrayOf(name, latLng),
    )

    for (args in candidates) {
      instantiateIfMatch(poiClass, args)?.let { return it }
    }

    throw Exception("当前 SDK 的 Poi 构造函数不兼容")
  }

  private fun createAmapNaviParams(
    startPoi: Any?,
    endPoi: Any,
    waypointPois: List<Any>,
    options: Map<String, Any?>
  ): Any {
    val paramsClass = Class.forName("com.amap.api.navi.AmapNaviParams")
    val naviTypeClass = loadFirstAvailableClass(
      "com.amap.api.navi.AmapNaviType",
      "com.amap.api.navi.enums.AmapNaviType"
    ) ?: throw Exception("当前 SDK 缺少 AmapNaviType 枚举类")
    val pageTypeClass = loadFirstAvailableClass(
      "com.amap.api.navi.AmapPageType",
      "com.amap.api.navi.enums.AmapPageType"
    )

    val officialNaviType = resolveEnumConstant(
      enumClass = naviTypeClass,
      preferName = options["officialNaviType"] as? String,
      fallbackNames = listOf("DRIVER", "DRIVE", "CAR")
    )
    val pageType = pageTypeClass?.let {
      resolveEnumConstant(
        enumClass = it,
        preferName = options["pageType"] as? String,
        fallbackNames = listOf("ROUTE", "NAVI")
      )
    }

    val waypointValue: Any? = if (waypointPois.isEmpty()) null else ArrayList(waypointPois)
    val candidates = mutableListOf<Array<Any?>>(
      arrayOf(startPoi, waypointValue, endPoi, officialNaviType, pageType),
      arrayOf(startPoi, waypointValue, endPoi, officialNaviType),
      arrayOf(startPoi, null, endPoi, officialNaviType, pageType),
      arrayOf(startPoi, null, endPoi, officialNaviType),
      arrayOf(startPoi, endPoi, officialNaviType, pageType),
      arrayOf(startPoi, endPoi, officialNaviType),
    )

    for (args in candidates) {
      val params = instantiateIfMatch(paramsClass, args) ?: continue
      applyOptionalParamsByReflection(params, options)
      return params
    }

    throw Exception("当前 SDK 的 AmapNaviParams 构造函数不兼容")
  }

  private fun applyOptionalParamsByReflection(params: Any, options: Map<String, Any?>) {
    // 保持旧行为：未传时仍沿用默认值
    val needCalculate = options["needCalculateRouteWhenPresent"] as? Boolean ?: true
    val needDestroy = options["needDestroyDriveManagerInstanceWhenNaviExit"] as? Boolean ?: false
    val showExitDialog = options["showExitNaviDialog"] as? Boolean ?: true
    val useInnerVoice = options["useInnerVoice"] as? Boolean ?: true

    invokeSetterIfExists(params, "setNeedCalculateRouteWhenPresent", needCalculate)
    invokeSetterIfExists(params, "setNeedDestroyDriveManagerInstanceWhenNaviExit", needDestroy)
    invokeSetterIfExists(params, "setShowExitNaviDialog", showExitDialog)
    invokeSetterIfExists(params, "setUseInnerVoice", useInnerVoice)

    // 不依赖 Context 的参数
    invokeSetterIfExists(params, "setMultipleRouteNaviMode", options["multipleRouteNaviMode"])
    invokeSetterIfExists(params, "setTruckMultipleRouteNaviMode", options["truckMultipleRouteNaviMode"])
    invokeSetterIfExists(params, "setSecondActionVisible", options["secondActionVisible"])
    invokeSetterIfExists(params, "setShowCrossImage", options["showCrossImage"])
    invokeSetterIfExists(params, "setShowRouteStrategyPreferenceView", options["showRouteStrategyPreferenceView"])
    invokeSetterIfExists(params, "setShowVoiceSetings", options["showVoiceSettings"])
    invokeSetterIfExists(params, "setTrafficEnabled", options["trafficEnabled"])
    invokeSetterIfExists(params, "setRouteStrategy", options["routeStrategy"])
    invokeSetterIfExists(params, "setNaviMode", options["naviMode"])

    // 依赖 Context 的参数
    invokeSetterWithContextIfExists(params, "setDayAndNightMode", options["dayAndNightMode"])
    invokeSetterWithContextIfExists(params, "setBroadcastMode", options["broadcastMode"])
    invokeSetterWithContextIfExists(params, "setCarDirectionMode", options["carDirectionMode"])
    invokeSetterWithContextIfExists(params, "setScaleAutoChangeEnable", options["scaleAutoChangeEnable"])
    invokeSetterWithContextIfExists(params, "showEagleMap", options["showEagleMap"])

    // 主题（枚举）
    val themeName = options["theme"] as? String
    if (!themeName.isNullOrBlank()) {
      val themeClass = runCatching {
        Class.forName("com.amap.api.navi.AmapNaviTheme")
      }.getOrNull()
      if (themeClass != null) {
        val theme = resolveEnumConstant(
          enumClass = themeClass,
          preferName = themeName,
          fallbackNames = emptyList()
        )
        invokeSetterIfExists(params, "setTheme", theme)
      }
    }

    // 车辆信息（用于限行/货车）
    @Suppress("UNCHECKED_CAST")
    val carInfoMap = options["carInfo"] as? Map<String, Any?>
    if (carInfoMap != null) {
      val carInfo = buildCarInfo(carInfoMap)
      invokeSetterIfExists(params, "setCarInfo", carInfo)
    }
  }

  private fun buildCarInfo(options: Map<String, Any?>): AMapCarInfo {
    val carInfo = AMapCarInfo()

    try {
      val carType = (options["carType"] as? String)?.trim()?.takeIf { it.isNotEmpty() }
      if (carType != null) carInfo.carType = carType
    } catch (_: Exception) {}
    try {
      val carNumber = (options["carNumber"] as? String)?.trim()?.takeIf { it.isNotEmpty() }
      if (carNumber != null) carInfo.setCarNumber(carNumber)
    } catch (_: Exception) {}
    try {
      val restriction = options["restriction"] as? Boolean
      if (restriction != null) carInfo.isRestriction = restriction
    } catch (_: Exception) {}
    try {
      val motorcycleCC = (options["motorcycleCC"] as? Number)?.toInt()
      if (motorcycleCC != null) carInfo.motorcycleCC = motorcycleCC
    } catch (_: Exception) {}

    // 货车相关可选参数（部分版本 SDK 可能不存在对应 setter，故用反射安全调用）
    invokeSetterIfExists(carInfo, "setVehicleAxis", options["vehicleAxis"])
    invokeSetterIfExists(carInfo, "setVehicleHeight", options["vehicleHeight"])
    invokeSetterIfExists(carInfo, "setVehicleLength", options["vehicleLength"])
    invokeSetterIfExists(carInfo, "setVehicleWidth", options["vehicleWidth"])
    invokeSetterIfExists(carInfo, "setVehicleSize", options["vehicleSize"])
    invokeSetterIfExists(carInfo, "setVehicleLoad", options["vehicleLoad"])
    invokeSetterIfExists(carInfo, "setVehicleWeight", options["vehicleWeight"])
    invokeSetterIfExists(carInfo, "setVehicleLoadSwitch", options["vehicleLoadSwitch"])

    return carInfo
  }

  private fun invokeSetterIfExists(target: Any, methodName: String, value: Any?) {
    if (value == null) return
    val methods = target.javaClass.methods.filter { method ->
      method.name == methodName && method.parameterTypes.size == 1
    }
    for (method in methods) {
      val converted = coerceValue(method.parameterTypes[0], value) ?: continue
      try {
        method.invoke(target, converted)
        return
      } catch (_: Exception) {
        // try next overload
      }
    }
  }

  private fun invokeSetterWithContextIfExists(target: Any, methodName: String, value: Any?) {
    if (value == null) return
    val appCtx = context.applicationContext ?: context
    val methods = target.javaClass.methods.filter { method ->
      method.name == methodName && method.parameterTypes.size == 2
    }
    for (method in methods) {
      val params = method.parameterTypes
      if (!params[0].isAssignableFrom(appCtx.javaClass)) continue
      val converted = coerceValue(params[1], value) ?: continue
      try {
        method.invoke(target, appCtx, converted)
        return
      } catch (_: Exception) {
        // try next overload
      }
    }
  }

  private fun coerceValue(expectedType: Class<*>, value: Any): Any? {
    val boxed = boxPrimitive(expectedType)
    if (boxed.isAssignableFrom(value.javaClass)) return value

    return when (boxed) {
      java.lang.Integer::class.java -> (value as? Number)?.toInt()
      java.lang.Long::class.java -> (value as? Number)?.toLong()
      java.lang.Double::class.java -> (value as? Number)?.toDouble()
      java.lang.Float::class.java -> (value as? Number)?.toFloat()
      java.lang.Short::class.java -> (value as? Number)?.toShort()
      java.lang.Byte::class.java -> (value as? Number)?.toByte()
      java.lang.Boolean::class.java -> when (value) {
        is Boolean -> value
        is Number -> value.toInt() != 0
        is String -> value.equals("true", ignoreCase = true) || value == "1"
        else -> null
      }
      java.lang.String::class.java -> value.toString()
      else -> {
        if (boxed.isEnum && value is String) {
          val byName = boxed.enumConstants
            ?.associateBy { (it as Enum<*>).name.uppercase(Locale.ROOT) }
          byName?.get(value.trim().uppercase(Locale.ROOT))
        } else {
          null
        }
      }
    }
  }

  private fun showOfficialNaviPage(params: Any) {
    val pageClass = Class.forName("com.amap.api.navi.AmapNaviPage")
    val pageInstance = pageClass.getMethod("getInstance").invoke(null)
    val showMethod = pageClass.methods.firstOrNull { method ->
      method.name == "showRouteActivity" && method.parameterTypes.size == 3
    } ?: throw Exception("未找到 showRouteActivity 方法")

    val appCtx = context.applicationContext ?: context
    showMethod.invoke(pageInstance, appCtx, params, null)
  }

  private fun resolveEnumConstant(
    enumClass: Class<*>,
    preferName: String?,
    fallbackNames: List<String>
  ): Any {
    val constants = enumClass.enumConstants
      ?: throw Exception("${enumClass.simpleName} is not enum")
    val byName = constants.associateBy { (it as Enum<*>).name.uppercase(Locale.ROOT) }

    val preferred = preferName?.trim()?.uppercase(Locale.ROOT)
    if (!preferred.isNullOrEmpty()) {
      byName[preferred]?.let { return it }
    }
    for (name in fallbackNames) {
      byName[name.uppercase(Locale.ROOT)]?.let { return it }
    }
    return constants.first()
  }

  private fun loadFirstAvailableClass(vararg classNames: String): Class<*>? {
    for (name in classNames) {
      val clazz = runCatching { Class.forName(name) }.getOrNull()
      if (clazz != null) return clazz
    }
    return null
  }

  private fun instantiateIfMatch(clazz: Class<*>, args: Array<Any?>): Any? {
    val constructors = clazz.constructors.filter { constructor ->
      constructor.parameterTypes.size == args.size
    }

    for (constructor in constructors) {
      if (!areArgsCompatible(constructor.parameterTypes, args)) continue
      try {
        return constructor.newInstance(*args)
      } catch (_: Exception) {
        // try next constructor
      }
    }
    return null
  }

  private fun areArgsCompatible(paramTypes: Array<Class<*>>, args: Array<Any?>): Boolean {
    if (paramTypes.size != args.size) return false
    for (index in paramTypes.indices) {
      val expected = boxPrimitive(paramTypes[index])
      val actual = args[index]
      if (actual == null) {
        if (expected.isPrimitive) return false
        continue
      }
      if (!expected.isAssignableFrom(actual.javaClass)) return false
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

  /**
   * 发送事件到 JS 层
   */
  internal fun sendEvent(name: String, params: Map<String, Any?>?) {
    this@ExpoGaodeMapNavigationModule.sendEvent(name, params)
  }
}
