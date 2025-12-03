package expo.modules.gaodemap

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.gaodemap.modules.SDKInitializer
import expo.modules.gaodemap.modules.LocationManager

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

    // ==================== SDK 初始化 ====================
    
    /**
     * 初始化 SDK（地图 + 定位）
     * @param config 配置对象,包含 androidKey
     */
    Function("initSDK") { config: Map<String, String> ->
      val androidKey = config["androidKey"]
      if (androidKey != null) {
        SDKInitializer.initSDK(appContext.reactContext!!, androidKey)
        getLocationManager() // 初始化定位管理器
      }
    }

    /**
     * 获取 SDK 版本
     * @return SDK 版本号
     */
    Function("getVersion") {
      SDKInitializer.getVersion()
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

    // ==================== 权限管理 ====================
    
    /**
     * 检查位置权限状态
     * @return 权限状态对象
     */
    AsyncFunction("checkLocationPermission") { promise: expo.modules.kotlin.Promise ->
      val context = appContext.reactContext!!
      val fineLocation = android.Manifest.permission.ACCESS_FINE_LOCATION
      val coarseLocation = android.Manifest.permission.ACCESS_COARSE_LOCATION
      
      val hasFine = androidx.core.content.ContextCompat.checkSelfPermission(context, fineLocation) ==
        android.content.pm.PackageManager.PERMISSION_GRANTED
      val hasCoarse = androidx.core.content.ContextCompat.checkSelfPermission(context, coarseLocation) ==
        android.content.pm.PackageManager.PERMISSION_GRANTED
      
      promise.resolve(mapOf(
        "granted" to (hasFine && hasCoarse),
        "fineLocation" to hasFine,
        "coarseLocation" to hasCoarse
      ))
    }
    
    /**
     * 请求位置权限
     * 注意: Android 权限请求是异步的,使用轮询方式检查权限状态
     * @return 权限请求结果
     */
    AsyncFunction("requestLocationPermission") { promise: expo.modules.kotlin.Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity not available", null)
        return@AsyncFunction
      }
      
      val permissions = arrayOf(
        android.Manifest.permission.ACCESS_FINE_LOCATION,
        android.Manifest.permission.ACCESS_COARSE_LOCATION
      )
      
      androidx.core.app.ActivityCompat.requestPermissions(activity, permissions, 1001)
      
      // 使用 WeakReference 避免内存泄露
      val contextRef = java.lang.ref.WeakReference(appContext.reactContext)
      val handler = android.os.Handler(android.os.Looper.getMainLooper())
      var attempts = 0
      val maxAttempts = 30 // 3 秒 / 100ms
      
      val checkPermission = object : Runnable {
        override fun run() {
          val context = contextRef.get()
          if (context == null) {
            promise.reject("CONTEXT_LOST", "Context was garbage collected", null)
            return
          }
          
          val hasFine = androidx.core.content.ContextCompat.checkSelfPermission(
            context, android.Manifest.permission.ACCESS_FINE_LOCATION
          ) == android.content.pm.PackageManager.PERMISSION_GRANTED
          val hasCoarse = androidx.core.content.ContextCompat.checkSelfPermission(
            context, android.Manifest.permission.ACCESS_COARSE_LOCATION
          ) == android.content.pm.PackageManager.PERMISSION_GRANTED
          
          // 如果权限已授予或达到最大尝试次数,返回结果并清理 Handler
          if ((hasFine && hasCoarse) || attempts >= maxAttempts) {
            handler.removeCallbacks(this)
            promise.resolve(mapOf(
              "granted" to (hasFine && hasCoarse),
              "fineLocation" to hasFine,
              "coarseLocation" to hasCoarse
            ))
          } else {
            attempts++
            handler.postDelayed(this, 100)
          }
        }
      }
      
      handler.postDelayed(checkPermission, 100)
    }

    Events("onLocationUpdate")

    OnDestroy {
      locationManager?.destroy()
      locationManager = null
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
