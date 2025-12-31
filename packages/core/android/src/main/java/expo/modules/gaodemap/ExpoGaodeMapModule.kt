package expo.modules.gaodemap

import com.amap.api.maps.AMapUtils
import com.amap.api.maps.model.LatLng
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.gaodemap.modules.SDKInitializer
import expo.modules.gaodemap.modules.LocationManager
import expo.modules.gaodemap.utils.GeometryUtils
import expo.modules.gaodemap.utils.PermissionHelper

/**
 * 高德地图 Expo 模块
 *
 * 负责:
 * - SDK 初始化和版本管理
 * - 定位功能和配置
 * - 权限管理
 */
class ExpoGaodeMapModule : Module() {


  /** 定位管理器实例 */
  private var locationManager: LocationManager? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoGaodeMap")

    // 在模块加载时尝试从本地缓存恢复隐私同意状态，避免每次启动都必须 JS 调用
    try {
      val context = appContext.reactContext!!
      SDKInitializer.restorePrivacyState(context)

      // 初始化预加载管理器（注册内存监听）
      MapPreloadManager.initialize(context)

      // 尝试从 AndroidManifest.xml 读取并设置 API Key
      val apiKey = context.packageManager
          .getApplicationInfo(context.packageName, android.content.pm.PackageManager.GET_META_DATA)
          .metaData?.getString("com.amap.api.v2.apikey")

      if (!apiKey.isNullOrEmpty()) {
          try {
            com.amap.api.maps.MapsInitializer.setApiKey(apiKey)
            com.amap.api.location.AMapLocationClient.setApiKey(apiKey)
            android.util.Log.d("ExpoGaodeMap", "✅ 从 AndroidManifest.xml 读取并设置 API Key 成功")

            // 只有在 API Key 已设置的情况下才启动预加载
            android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
              android.util.Log.i("ExpoGaodeMap", "🚀 自动启动地图预加载")
              MapPreloadManager.startPreload(context, poolSize = 1)
            }, 2000)
          } catch (e: Exception) {
            android.util.Log.w("ExpoGaodeMap", "设置 API Key 失败: ${e.message}")
          }
        } else {
          android.util.Log.w("ExpoGaodeMap", "⚠️ AndroidManifest.xml 未找到 API Key，跳过自动预加载")
        }

    } catch (e: Exception) {
      android.util.Log.w("ExpoGaodeMap", "恢复隐私状态时出现问题: ${e.message}")
    }
 
    // ==================== 隐私协议 ====================
    
    /**
     * 更新隐私合规状态
     * 不用主动调用，下个版本删除
     * 
     */
    Function("updatePrivacyCompliance") { hasAgreed: Boolean ->
       val context = appContext.reactContext!!
       SDKInitializer.restorePrivacyState(context)
    }
    
    // ==================== SDK 初始化 ====================
    
    /**
     * 初始化 SDK（地图 + 定位）
     * @config 配置对象,包含 androidKey
     */
    Function("initSDK") { config: Map<String, String> ->
      val androidKey = config["androidKey"]
      if (androidKey != null) {
        try {
          SDKInitializer.initSDK(appContext.reactContext!!, androidKey)
          getLocationManager() // 初始化定位管理器
        } catch (e: SecurityException) {
          android.util.Log.e("ExpoGaodeMap", "隐私协议未同意: ${e.message}")
          throw expo.modules.kotlin.exception.CodedException("PRIVACY_NOT_AGREED", e.message ?: "用户未同意隐私协议", e)
        } catch (e: Exception) {
          android.util.Log.e("ExpoGaodeMap", "SDK 初始化失败: ${e.message}")
          throw expo.modules.kotlin.exception.CodedException("INIT_FAILED", e.message ?: "SDK 初始化失败", e)
        }
      }
    }

    /**
     * 获取 SDK 版本
     * @return SDK 版本号
     */
    Function("getVersion") {
      SDKInitializer.getVersion()
    }

    /**
    * 检查原生 SDK 是否已配置 API Key
    */
    Function("isNativeSDKConfigured") {
      try {
        val context = appContext.reactContext!!
        val apiKey = context.packageManager
          .getApplicationInfo(context.packageName, android.content.pm.PackageManager.GET_META_DATA)
          .metaData?.getString("com.amap.api.v2.apikey")
        !apiKey.isNullOrEmpty()
      } catch (e: Exception) {
        false
      }
    }


    // ==================== 定位功能 ====================

    /**
     * 开始连续定位
     */
    Function("start") {
      getLocationManager().start()
    }

    /**
     * 停止定位
     */
    Function("stop") {
      getLocationManager().stop()
    }

    /**
     * 检查是否正在定位
     * @return 是否正在定位
     */
    AsyncFunction("isStarted") { promise: expo.modules.kotlin.Promise ->
      promise.resolve(getLocationManager().isStarted())
    }

    /**
     * 获取当前位置（单次定位）
     * @return 位置信息对象
     */
    AsyncFunction("getCurrentLocation") { promise: expo.modules.kotlin.Promise ->
      getLocationManager().getCurrentLocation(promise)
    }

    /**
     * 坐标转换
     * @param coordinate 原始坐标
     * @param type 坐标类型
     * @return 转换后的坐标
     */
    AsyncFunction("coordinateConvert") { coordinate: Map<String, Double>, type: Int, promise: expo.modules.kotlin.Promise ->
      getLocationManager().coordinateConvert(coordinate, type, promise)
    }

    // ==================== 定位配置 ====================

    /**
     * 设置是否返回逆地理信息
     * @param isReGeocode 是否返回逆地理信息
     */
    Function("setLocatingWithReGeocode") { isReGeocode: Boolean ->
      getLocationManager().setLocatingWithReGeocode(isReGeocode)
    }

    /**
     * 设置定位模式
     * @param mode 定位模式
     */
    Function("setLocationMode") { mode: Int ->
      getLocationManager().setLocationMode(mode)
    }

    /**
     * 设置定位间隔
     * @param interval 间隔时间(毫秒)
     */
    Function("setInterval") { interval: Int ->
      getLocationManager().setInterval(interval)
    }

    /**
     * 设置是否单次定位
     * @param isOnceLocation 是否单次定位
     */
    Function("setOnceLocation") { isOnceLocation: Boolean ->
      getLocationManager().setOnceLocation(isOnceLocation)
    }

    /**
     * 设置是否使用设备传感器
     * @param sensorEnable 是否启用传感器
     */
    Function("setSensorEnable") { sensorEnable: Boolean ->
      getLocationManager().setSensorEnable(sensorEnable)
    }

    /**
     * 设置是否允许 WIFI 扫描
     * @param wifiScan 是否允许 WIFI 扫描
     */
    Function("setWifiScan") { wifiScan: Boolean ->
      getLocationManager().setWifiScan(wifiScan)
    }

    /**
     * 设置是否 GPS 优先
     * @param gpsFirst 是否 GPS 优先
     */
    Function("setGpsFirst") { gpsFirst: Boolean ->
      getLocationManager().setGpsFirst(gpsFirst)
    }

    /**
     * 设置是否等待 WIFI 列表刷新
     * @param onceLocationLatest 是否等待刷新
     */
    Function("setOnceLocationLatest") { onceLocationLatest: Boolean ->
      getLocationManager().setOnceLocationLatest(onceLocationLatest)
    }

    /**
     * 设置逆地理语言
     * @param language 语言代码
     */
    Function("setGeoLanguage") { language: String ->
      getLocationManager().setGeoLanguage(language)
    }

    /**
     * 设置是否使用缓存策略
     * @param locationCacheEnable 是否启用缓存
     */
    Function("setLocationCacheEnable") { locationCacheEnable: Boolean ->
      getLocationManager().setLocationCacheEnable(locationCacheEnable)
    }

    /**
     * 设置网络请求超时时间
     * @param httpTimeOut 超时时间(毫秒)
     */
    Function("setHttpTimeOut") { httpTimeOut: Int ->
      getLocationManager().setHttpTimeOut(httpTimeOut)
    }

    /**
     * 设置定位精度 (iOS 专用,Android 空实现)
     * @param accuracy 精度级别
     */
    Function("setDesiredAccuracy") { _: Int ->
      // Android 不支持此配置
    }

    /**
     * 设置定位超时时间 (iOS 专用,Android 空实现)
     * @param timeout 超时时间(秒)
     */
    Function("setLocationTimeout") { _: Int ->
      // Android 不支持此配置
    }

    /**
     * 设置逆地理超时时间 (iOS 专用,Android 空实现)
     * @param timeout 超时时间(秒)
     */
    Function("setReGeocodeTimeout") { _: Int ->
      // Android 不支持此配置
    }

    /**
     * 设置距离过滤器 (iOS 专用,Android 空实现)
     * @param distance 最小距离变化(米)
     */
    Function("setDistanceFilter") { _: Double ->
      // Android 不支持此配置
    }

    /**
     * 设置是否自动暂停定位更新 (iOS 专用,Android 空实现)
     * @param pauses 是否自动暂停
     */
    Function("setPausesLocationUpdatesAutomatically") { _: Boolean ->
      // Android 不支持此配置
    }

    /**
     * 设置是否允许后台定位
     * Android 通过前台服务实现,iOS 通过系统配置实现
     * @param allows 是否允许后台定位
     */
    Function("setAllowsBackgroundLocationUpdates") { allows: Boolean ->
      getLocationManager().setAllowsBackgroundLocationUpdates(allows)
    }

    /**
     * 设置定位协议 (未实现)
     * @param protocol 协议类型
     */
    Function("setLocationProtocol") { _: Int ->
      // 未实现
    }

    /**
     * 开始更新设备方向 (iOS 专用,Android 空实现)
     * Android 不支持此功能
     */
    Function("startUpdatingHeading") {
      // Android 不支持罗盘方向更新
      android.util.Log.d("ExpoGaodeMap", "startUpdatingHeading: iOS 专用功能，Android 不支持")
    }

    /**
     * 停止更新设备方向 (iOS 专用,Android 空实现)
     * Android 不支持此功能
     */
    Function("stopUpdatingHeading") {
      // Android 不支持罗盘方向更新
      android.util.Log.d("ExpoGaodeMap", "stopUpdatingHeading: iOS 专用功能，Android 不支持")
    }

    // ==================== 权限管理 ====================

    /**
     * 检查位置权限状态（增强版，支持 Android 14+ 适配）
     * @return 权限状态对象，包含详细的权限信息
     */
    AsyncFunction("checkLocationPermission") { promise: expo.modules.kotlin.Promise ->
      val context = appContext.reactContext!!

      // 使用增强的权限检查
      val foregroundStatus = PermissionHelper.checkForegroundLocationPermission(context)
      val backgroundStatus = PermissionHelper.checkBackgroundLocationPermission(context)

      promise.resolve(mapOf(
        "granted" to foregroundStatus.granted,
        "status" to if (foregroundStatus.granted) "granted" else if (foregroundStatus.isPermanentlyDenied) "denied" else "notDetermined",
        "fineLocation" to foregroundStatus.fineLocation,
        "coarseLocation" to foregroundStatus.coarseLocation,
        "backgroundLocation" to backgroundStatus.backgroundLocation,
        "shouldShowRationale" to foregroundStatus.shouldShowRationale,
        "isPermanentlyDenied" to foregroundStatus.isPermanentlyDenied,
        "isAndroid14Plus" to PermissionHelper.isAndroid14Plus()
      ))
    }

    /**
     * 请求前台位置权限（增强版，支持 Android 14+ 适配）
     * 注意: Android 权限请求是异步的,使用轮询方式检查权限状态
     * @return 权限请求结果
     */
    AsyncFunction("requestLocationPermission") { promise: expo.modules.kotlin.Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity not available", null)
        return@AsyncFunction
      }

      // 使用增强的权限请求方法
      PermissionHelper.requestForegroundLocationPermission(activity, 1001)

      // 使用 WeakReference 避免内存泄露
      val contextRef = java.lang.ref.WeakReference(appContext.reactContext)
      val handler = android.os.Handler(android.os.Looper.getMainLooper())
      var attempts = 0
      val maxAttempts = 50 // 增加到 5 秒 / 100ms，给用户足够时间操作

      val checkPermission = object : Runnable {
        override fun run() {
          val context = contextRef.get()
          if (context == null) {
            promise.reject("CONTEXT_LOST", "Context was garbage collected", null)
            return
          }

          val status = PermissionHelper.checkForegroundLocationPermission(context)

          // 如果权限已授予或达到最大尝试次数,返回结果并清理 Handler
          if (status.granted || attempts >= maxAttempts) {
            handler.removeCallbacks(this)
            promise.resolve(mapOf(
              "granted" to status.granted,
              "status" to if (status.granted) "granted" else if (status.isPermanentlyDenied) "denied" else "notDetermined",
              "fineLocation" to status.fineLocation,
              "coarseLocation" to status.coarseLocation,
              "shouldShowRationale" to status.shouldShowRationale,
              "isPermanentlyDenied" to status.isPermanentlyDenied
            ))
          } else {
            attempts++
            handler.postDelayed(this, 100)
          }
        }
      }

      // 延迟更长时间开始轮询，给权限对话框弹出的时间
      handler.postDelayed(checkPermission, 500)
    }

    /**
     * 请求后台位置权限（Android 10+ 支持）
     * 注意: 必须在前台权限已授予后才能请求
     * @return 权限请求结果
     */
    AsyncFunction("requestBackgroundLocationPermission") { promise: expo.modules.kotlin.Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity not available", null)
        return@AsyncFunction
      }

      // 检查是否支持后台位置权限
      if (!PermissionHelper.isAndroid10Plus()) {
        promise.resolve(mapOf(
          "granted" to true,
          "backgroundLocation" to true,
          "message" to "Android 10 以下不需要单独请求后台位置权限"
        ))
        return@AsyncFunction
      }

      // 尝试请求后台位置权限
      val canRequest = PermissionHelper.requestBackgroundLocationPermission(activity, 1002)
      if (!canRequest) {
        promise.reject(
          "FOREGROUND_PERMISSION_REQUIRED",
          "必须先授予前台位置权限才能请求后台位置权限",
          null
        )
        return@AsyncFunction
      }

      // 轮询检查权限状态
      val contextRef = java.lang.ref.WeakReference(appContext.reactContext)
      val handler = android.os.Handler(android.os.Looper.getMainLooper())
      var attempts = 0
      val maxAttempts = 30

      val checkPermission = object : Runnable {
        override fun run() {
          val context = contextRef.get()
          if (context == null) {
            promise.reject("CONTEXT_LOST", "Context was garbage collected", null)
            return
          }

          val status = PermissionHelper.checkBackgroundLocationPermission(context)

          if (status.granted || attempts >= maxAttempts) {
            handler.removeCallbacks(this)
            promise.resolve(mapOf(
              "granted" to status.granted,
              "status" to if (status.granted) "granted" else if (status.isPermanentlyDenied) "denied" else "notDetermined",
              "backgroundLocation" to status.backgroundLocation,
              "shouldShowRationale" to status.shouldShowRationale,
              "isPermanentlyDenied" to status.isPermanentlyDenied
            ))
          } else {
            attempts++
            handler.postDelayed(this, 100)
          }
        }
      }

      handler.postDelayed(checkPermission, 100)
    }

    /**
     * 打开应用设置页面（引导用户手动授予权限）
     */
    Function("openAppSettings") {
      val context = appContext.reactContext!!
      PermissionHelper.openAppSettings(context)
    }

    // ==================== 几何计算工具 ====================

    /**
     * 计算两个坐标点之间的距离
     * @param coordinate1 第一个坐标点
     * @param coordinate2 第二个坐标点
     * @return 两点之间的距离（单位：米）
     */
    AsyncFunction("distanceBetweenCoordinates") { coordinate1: Map<String, Double>, coordinate2: Map<String, Double>, promise: expo.modules.kotlin.Promise ->
      try {
        val lat1 = coordinate1["latitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid coordinate1 latitude", null)
        val lon1 = coordinate1["longitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid coordinate1 longitude", null)
        val lat2 = coordinate2["latitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid coordinate2 latitude", null)
        val lon2 = coordinate2["longitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid coordinate2 longitude", null)

        val coord1 = LatLng(lat1, lon1)
        val coord2 = LatLng(lat2, lon2)

        val distance = AMapUtils.calculateLineDistance(coord1, coord2)
        promise.resolve(distance)
      } catch (e: Exception) {
        promise.reject("ERROR", e.message, e)
      }
    }

  

    /**
     * 判断点是否在圆内
     * @param point 要判断的点
     * @param center 圆心坐标
     * @param radius 圆半径（单位：米）
     * @return 是否在圆内
     */
    AsyncFunction("isPointInCircle") { point: Map<String, Double>, center: Map<String, Double>, radius: Double, promise: expo.modules.kotlin.Promise ->
      try {
        val pointLat = point["latitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid point latitude", null)
        val pointLon = point["longitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid point longitude", null)
        val centerLat = center["latitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid center latitude", null)
        val centerLon = center["longitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid center longitude", null)

        val isInside = GeometryUtils.isPointInCircle(
          LatLng(pointLat, pointLon),
          LatLng(centerLat, centerLon),
          radius
        )
        promise.resolve(isInside)
      } catch (e: Exception) {
        promise.reject("ERROR", e.message, e)
      }
    }

    /**
     * 判断点是否在多边形内
     * @param point 要判断的点
     * @param polygon 多边形的顶点坐标数组
     * @return 是否在多边形内
     */
    AsyncFunction("isPointInPolygon") { point: Map<String, Double>, polygon: List<Map<String, Double>>, promise: expo.modules.kotlin.Promise ->
      try {
        val pointLat = point["latitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid point latitude", null)
        val pointLon = point["longitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid point longitude", null)

        if (polygon.size < 3) {
          return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Polygon must have at least 3 vertices", null)
        }

        val polygonPoints = polygon.mapNotNull { coord ->
          val lat = coord["latitude"]
          val lon = coord["longitude"]
          if (lat != null && lon != null) {
            LatLng(lat, lon)
          } else {
            null
          }
        }

        if (polygonPoints.size < 3) {
          return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid polygon coordinates", null)
        }

        val isInside = GeometryUtils.isPointInPolygon(
          LatLng(pointLat, pointLon),
          polygonPoints
        )
        promise.resolve(isInside)
      } catch (e: Exception) {
        promise.reject("ERROR", e.message, e)
      }
    }

    /**
     * 计算多边形面积
     * @param polygon 多边形的顶点坐标数组
     * @return 面积（单位：平方米）
     */
    AsyncFunction("calculatePolygonArea") { polygon: List<Map<String, Double>>, promise: expo.modules.kotlin.Promise ->
      try {
        
        
        if (polygon.size < 3) {
          return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Polygon must have at least 3 vertices", null)
        }

        val polygonPoints = polygon.mapNotNull { coord ->
          val lat = coord["latitude"]
          val lon = coord["longitude"]
          if (lat != null && lon != null) {
           LatLng(lat, lon)
          } else {
            null
          }
        }

     
        
        if (polygonPoints.size < 3) {
          return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid polygon coordinates", null)
        }

        // 使用高德官方 API 计算多边形面积
        val area = AMapUtils.calculateArea(polygonPoints)
       
        promise.resolve(area)
      } catch (e: Exception) {
        android.util.Log.e("ExpoGaodeMap", "📐 calculatePolygonArea 错误: ${e.message}", e)
        promise.reject("ERROR", e.message, e)
      }
    }

    /**
     * 计算矩形面积
     * @param southWest 西南角坐标
     * @param northEast 东北角坐标
     * @return 面积（单位：平方米）
     */
    AsyncFunction("calculateRectangleArea") { southWest: Map<String, Double>, northEast: Map<String, Double>, promise: expo.modules.kotlin.Promise ->
      try {
        
        val swLat = southWest["latitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid southWest latitude", null)
        val swLon = southWest["longitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid southWest longitude", null)
        val neLat = northEast["latitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid northEast latitude", null)
        val neLon = northEast["longitude"] ?: return@AsyncFunction promise.reject("INVALID_ARGUMENT", "Invalid northEast longitude", null)

        // 构造矩形多边形来计算面积
        val rectangle = listOf(
          LatLng(swLat, swLon),
          LatLng(swLat, neLon),
          LatLng(neLat, neLon),
          LatLng(neLat, swLon)
        )

        val area = AMapUtils.calculateArea(rectangle)
        
        promise.resolve(area)
      } catch (e: Exception) {
        android.util.Log.e("ExpoGaodeMap", "📐 calculateRectangleArea 错误: ${e.message}", e)
        promise.reject("ERROR", e.message, e)
      }
    }



    // ==================== 地图预加载 ====================

    /**
     * 开始预加载地图实例
     * @param config 预加载配置对象,包含 poolSize
     */
    Function("startMapPreload") { config: Map<String, Any> ->
      val poolSize = (config["poolSize"] as? Number)?.toInt() ?: 2
      MapPreloadManager.startPreload(appContext.reactContext!!, poolSize)
    }

    /**
     * 获取预加载状态
     * @return 预加载状态信息
     */
    Function("getMapPreloadStatus") {
      MapPreloadManager.getStatus()
    }

    /**
     * 清空预加载池
     */
    Function("clearMapPreloadPool") {
      MapPreloadManager.clearPool()
    }

    /**
     * 检查是否有可用的预加载实例
     * @return 是否有可用实例
     */
    Function("hasPreloadedMapView") {
      MapPreloadManager.hasPreloadedMapView()
    }

    /**
     * 获取预加载性能统计
     * @return 性能统计信息
     */
    Function("getMapPreloadPerformanceMetrics") {
      MapPreloadManager.getPerformanceMetrics()
    }

    Events("onLocationUpdate")

    OnDestroy {
      locationManager?.destroy()
      locationManager = null
      MapPreloadManager.cleanup()
    }
  }

  /**
   * 获取或创建定位管理器
   * @return 定位管理器实例
   */
  private fun getLocationManager(): LocationManager {
    if (locationManager == null) {
      locationManager = LocationManager(appContext.reactContext!!).apply {
        setOnLocationUpdate { location ->
          sendEvent("onLocationUpdate", location)
        }
      }
    }
    return locationManager!!
  }
}
