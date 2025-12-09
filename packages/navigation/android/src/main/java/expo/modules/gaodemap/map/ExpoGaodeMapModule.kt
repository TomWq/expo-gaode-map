package expo.modules.gaodemap.map

import android.Manifest
import android.content.pm.PackageManager
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.gaodemap.map.modules.SDKInitializer
import expo.modules.gaodemap.map.modules.LocationManager
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import java.lang.ref.WeakReference

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
    Name("NaviMap")

    // 在模块加载时尝试从本地缓存恢复隐私同意状态，避免每次启动都必须 JS 调用
    try {
      SDKInitializer.restorePrivacyState(appContext.reactContext!!)
    } catch (e: Exception) {
      android.util.Log.w("ExpoGaodeMap", "恢复隐私状态时出现问题: ${e.message}")
    }
 
    // ==================== 隐私合规管理 ====================
    
    /**
     * 更新隐私合规状态
     * 必须在用户同意隐私协议后调用
     * @param hasAgreed 用户是否已同意隐私协议
     */
    Function("updatePrivacyCompliance") { hasAgreed: Boolean ->
      SDKInitializer.updatePrivacyCompliance(appContext.reactContext!!, hasAgreed)
    }
    
    // ==================== SDK 初始化 ====================
    
    /**
     * 初始化 SDK（地图 + 定位）
     * @param config 配置对象,包含 androidKey
     */
    Function("initSDK") { config: Map<String, String> ->
      val androidKey = config["androidKey"]
      if (androidKey != null) {
        try {
          SDKInitializer.initSDK(appContext.reactContext!!, androidKey)
          getLocationManager() // 初始化定位管理器
        } catch (e: SecurityException) {
          Log.e("ExpoGaodeMap", "隐私协议未同意: ${e.message}")
          throw e
        } catch (e: Exception) {
          Log.e("ExpoGaodeMap", "SDK 初始化失败: ${e.message}")
          throw e
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

    // ==================== 定位功能 ====================

    /**
     * 开始连续定位
     */
    Function("start") {
      // 检查隐私协议状态
      if (!SDKInitializer.isPrivacyAgreed()) {
        Log.w("ExpoGaodeMap", "用户未同意隐私协议，无法开始定位")
        throw CodedException("用户未同意隐私协议，无法开始定位")
      }
      
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
    AsyncFunction("isStarted") { promise: Promise ->
      promise.resolve(getLocationManager().isStarted())
    }

    /**
     * 获取当前位置（单次定位）
     * @return 位置信息对象
     */
    AsyncFunction("getCurrentLocation") { promise: Promise ->
      // 检查隐私协议状态
      if (!SDKInitializer.isPrivacyAgreed()) {
        promise.reject("PRIVACY_NOT_AGREED", "用户未同意隐私协议，无法获取位置", null)
        return@AsyncFunction
      }
      
      getLocationManager().getCurrentLocation(promise)
    }

    /**
     * 坐标转换
     * @param coordinate 原始坐标
     * @param type 坐标类型
     * @return 转换后的坐标
     */
    AsyncFunction("coordinateConvert") { coordinate: Map<String, Double>, type: Int, promise: Promise ->
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
    AsyncFunction("checkLocationPermission") { promise: Promise ->
      val context = appContext.reactContext!!
      val fineLocation = Manifest.permission.ACCESS_FINE_LOCATION
      val coarseLocation = Manifest.permission.ACCESS_COARSE_LOCATION
      
      val hasFine = ContextCompat.checkSelfPermission(context, fineLocation) ==
        PackageManager.PERMISSION_GRANTED
      val hasCoarse = ContextCompat.checkSelfPermission(context, coarseLocation) ==
        PackageManager.PERMISSION_GRANTED
      
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
    AsyncFunction("requestLocationPermission") { promise: Promise ->
      val activity = appContext.currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity not available", null)
        return@AsyncFunction
      }
      
      val permissions = arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
      )
      
      ActivityCompat.requestPermissions(activity, permissions, 1001)
      
      // 使用 WeakReference 避免内存泄露
      val contextRef = WeakReference(appContext.reactContext)
      val handler = Handler(Looper.getMainLooper())
      var attempts = 0
      val maxAttempts = 30 // 3 秒 / 100ms
      
      val checkPermission = object : Runnable {
        override fun run() {
          val context = contextRef.get()
          if (context == null) {
            promise.reject("CONTEXT_LOST", "Context was garbage collected", null)
            return
          }
          
          val hasFine = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
          ) == PackageManager.PERMISSION_GRANTED
          val hasCoarse = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_COARSE_LOCATION
          ) == PackageManager.PERMISSION_GRANTED
          
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
