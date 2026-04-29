package expo.modules.gaodemap

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.StatFs
import android.os.Environment
import android.util.Log
import com.amap.api.maps.offlinemap.OfflineMapActivity
import com.amap.api.maps.offlinemap.OfflineMapCity
import com.amap.api.maps.offlinemap.OfflineMapManager
import com.amap.api.maps.offlinemap.OfflineMapProvince
import com.amap.api.maps.offlinemap.OfflineMapStatus
import expo.modules.gaodemap.modules.SDKInitializer
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * 高德地图离线地图模块 (Android)
 */
class ExpoGaodeMapOfflineModule : Module() {
  
  private val logTag = "ExpoGaodeMapOffline"
  private var offlineMapManager: OfflineMapManager? = null
  private val downloadingCities = mutableSetOf<String>()
  private val pausedCities = mutableSetOf<String>()
  
  // 线程安全锁
  private val lock = Any()

  private fun createDownloadListener(): OfflineMapManager.OfflineMapDownloadListener {
    return object : OfflineMapManager.OfflineMapDownloadListener {
      override fun onDownload(status: Int, completeCode: Int, downName: String?) {
        handleDownloadStatus(status, completeCode, downName)
      }

      override fun onCheckUpdate(hasNew: Boolean, name: String?) {
      }

      override fun onRemove(success: Boolean, name: String?, describe: String?) {
      }
    }
  }

  private fun getOfflineMapManager(): OfflineMapManager {
    val reactContext = appContext.reactContext
      ?: throw CodedException("NO_CONTEXT", "React context not available", null)

    SDKInitializer.restorePersistedState(reactContext.applicationContext)

    if (!SDKInitializer.isPrivacyReady()) {
      throw CodedException(
        "PRIVACY_NOT_AGREED",
        "隐私协议未完成确认，请先调用 setPrivacyConfig",
        null
      )
    }

    if (offlineMapManager == null) {
      offlineMapManager = OfflineMapManager(
        reactContext.applicationContext,
        createDownloadListener()
      )
    }

    return offlineMapManager!!
  }

  private fun getActivityLaunchContext(): Context {
    return appContext.currentActivity
      ?: appContext.reactContext
      ?: throw CodedException("NO_CONTEXT", "React context not available", null)
  }

  private fun openOfflineMapUI() {
    val context = getActivityLaunchContext()
    SDKInitializer.restorePersistedState(context.applicationContext)

    if (!SDKInitializer.isPrivacyReady()) {
      throw CodedException(
        "PRIVACY_NOT_AGREED",
        "隐私协议未完成确认，请先调用 setPrivacyConfig",
        null
      )
    }

    val intent = Intent(context, OfflineMapActivity::class.java)
    if (context !is Activity) {
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    context.startActivity(intent)
  }
  
  override fun definition() = ModuleDefinition {
    Name("ExpoGaodeMapOffline")
    
    // ==================== 事件定义 ====================
    
    Events(
      "onDownloadProgress",
      "onDownloadComplete",
      "onDownloadError",
      "onUnzipProgress",
      "onDownloadPaused",
      "onDownloadCancelled"
    )
    
    OnDestroy {
      offlineMapManager?.destroy()
      offlineMapManager = null
      downloadingCities.clear()
    }

    AsyncFunction("openOfflineMapUI") {
      openOfflineMapUI()
    }
    
    // ==================== 地图列表管理 ====================
    
    AsyncFunction("getAvailableCities") {
      val manager = getOfflineMapManager()
      val cities = manager.offlineMapCityList ?: emptyList()
      val downloadedCityKeys = getDownloadedCityKeys(manager)
      cities.map { city -> convertCityToMap(city, downloadedCityKeys) }
    }
    
    AsyncFunction("getAvailableProvinces") {
      val provinces = getOfflineMapManager().offlineMapProvinceList ?: emptyList()
      provinces.map { province -> convertProvinceToMap(province) }
    }
    
    AsyncFunction("getCitiesByProvince") { provinceCode: String ->
      val manager = getOfflineMapManager()
      val province = manager.offlineMapProvinceList?.find {
        it.provinceCode == provinceCode 
      }
      val downloadedCityKeys = getDownloadedCityKeys(manager)
      province?.cityList?.map { city -> convertCityToMap(city, downloadedCityKeys) } ?: emptyList()
    }
    
    AsyncFunction("getDownloadedMaps") {
      val manager = getOfflineMapManager()
      val cities = manager.downloadOfflineMapCityList ?: emptyList()
      val downloadedCityKeys = getDownloadedCityKeys(manager)
      cities.map { city -> convertCityToMap(city, downloadedCityKeys) }
    }
    
    // ==================== 下载管理 ====================
    
    AsyncFunction("startDownload") { config: Map<String, Any?> ->
      val cityCode = config["cityCode"] as? String
        ?: throw IllegalArgumentException("cityCode is required")
      
      synchronized(lock) {
        downloadingCities.add(cityCode)
        pausedCities.remove(cityCode)
      }
      startCityDownload(getOfflineMapManager(), cityCode, "startDownload")
    }
    
    AsyncFunction("pauseDownload") { cityCode: String ->
      val city = getOfflineMapManager().getItemByCityCode(cityCode)
      
      synchronized(lock) {
        pausedCities.add(cityCode)
        downloadingCities.remove(cityCode)
      }
      
      // 使用 pauseByName 暂停指定城市
      city?.city?.let { cityName ->
        getOfflineMapManager().pauseByName(cityName)
      }
      
      if (city != null) {
        sendEvent("onDownloadPaused", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", city.city)
        })
      }
    }
    
    AsyncFunction("resumeDownload") { cityCode: String ->
      synchronized(lock) {
        downloadingCities.add(cityCode)
        pausedCities.remove(cityCode)
      }
      // Android SDK 没有针对单个城市的恢复方法
      // 需要重新调用 downloadByCityCode 来继续下载
      startCityDownload(getOfflineMapManager(), cityCode, "resumeDownload")
    }
    
    AsyncFunction("cancelDownload") { cityCode: String ->
      val city = getOfflineMapManager().getItemByCityCode(cityCode)
      
      synchronized(lock) {
        downloadingCities.remove(cityCode)
        pausedCities.remove(cityCode)
      }
      
      // 使用 stop() 停止所有下载(包括队列)
      getOfflineMapManager().stop()
      
      if (city != null) {
        sendEvent("onDownloadCancelled", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", city.city)
        })
      }
    }
    
    AsyncFunction("deleteMap") { cityCode: String ->
      val city = getOfflineMapManager().getItemByCityCode(cityCode)
        ?: throw IllegalArgumentException("City not found: $cityCode")
      
      // 官方文档:remove() 需要传入城市名称,不是城市代码
      getOfflineMapManager().remove(city.city)
      
      synchronized(lock) {
        downloadingCities.remove(cityCode)
        pausedCities.remove(cityCode)
      }
    }
    
    AsyncFunction("updateMap") { cityCode: String ->
      synchronized(lock) {
        downloadingCities.add(cityCode)
      }
      getOfflineMapManager().updateOfflineCityByCode(cityCode)
    }
    
    AsyncFunction("checkUpdate") { cityCode: String ->
      val city = getOfflineMapManager().getItemByCityCode(cityCode)
      city?.state == OfflineMapStatus.NEW_VERSION
    }
    
    // ==================== 状态查询 ====================
    
    AsyncFunction("isMapDownloaded") { cityCode: String ->
      val manager = getOfflineMapManager()
      val city = manager.getItemByCityCode(cityCode)
      city?.state == OfflineMapStatus.SUCCESS ||
        city?.let { isDownloadedCity(it, getDownloadedCityKeys(manager)) } == true
    }
    
    AsyncFunction("getMapStatus") { cityCode: String ->
      val manager = getOfflineMapManager()
      val city = manager.getItemByCityCode(cityCode)
      val downloadedCityKeys = getDownloadedCityKeys(manager)
      city?.let { convertCityToMap(it, downloadedCityKeys) } ?: Bundle()
    }
    
    AsyncFunction("getTotalProgress") {
      val downloadedCities = getOfflineMapManager().downloadOfflineMapCityList ?: emptyList()
      if (downloadedCities.isEmpty()) {
        0.0
      } else {
        val totalProgress = downloadedCities.sumOf { it.getcompleteCode().toDouble() }
        totalProgress / downloadedCities.size
      }
    }
    
    AsyncFunction("getDownloadingCities") {
      downloadingCities.toList()
    }
    
    // ==================== 存储管理 ====================
    
    AsyncFunction("getStorageSize") {
      // 计算所有已下载地图的大小
      val cities = getOfflineMapManager().downloadOfflineMapCityList ?: emptyList()
      cities.sumOf { it.size }
    }
    
    AsyncFunction("getStorageInfo") {
      val cities = getOfflineMapManager().downloadOfflineMapCityList ?: emptyList()
      val offlineMapSize = cities.sumOf { it.size }
      
      // 获取存储路径的统计信息
      val stat = StatFs(Environment.getDataDirectory().path)
      val blockSize = stat.blockSizeLong
      val totalBlocks = stat.blockCountLong
      val availableBlocks = stat.availableBlocksLong
      
      val totalSpace = totalBlocks * blockSize
      val availableSpace = availableBlocks * blockSize
      val usedSpace = totalSpace - availableSpace
      
      Bundle().apply {
        putLong("totalSpace", totalSpace)
        putLong("usedSpace", usedSpace)
        putLong("availableSpace", availableSpace)
        putLong("offlineMapSize", offlineMapSize)
      }
    }
    
    AsyncFunction("clearAllMaps") {
      getOfflineMapManager().downloadOfflineMapCityList?.forEach { city ->
        // 使用城市名称删除
        getOfflineMapManager().remove(city.city)
      }
      synchronized(lock) {
        downloadingCities.clear()
        pausedCities.clear()
      }
    }
    
    Function("setStoragePath") { _: String ->
      // Android 离线地图路径由系统管理，此方法不可用
    }
    
    AsyncFunction("getStoragePath") {
      // Android 离线地图路径由系统管理
      ""
    }
    
    // ==================== 批量操作 ====================
    
    AsyncFunction("batchDownload") { cityCodes: List<String>, _: Boolean? ->
      synchronized(lock) {
        cityCodes.forEach { cityCode ->
          downloadingCities.add(cityCode)
          pausedCities.remove(cityCode)
        }
      }
      cityCodes.forEach { cityCode ->
        startCityDownload(getOfflineMapManager(), cityCode, "batchDownload")
      }
    }
    
    AsyncFunction("batchDelete") { cityCodes: List<String> ->
      cityCodes.forEach { cityCode ->
        val city = getOfflineMapManager().getItemByCityCode(cityCode)
        // 使用城市名称删除,不是城市代码
        city?.city?.let { cityName ->
          getOfflineMapManager().remove(cityName)
        }
      }
      synchronized(lock) {
        cityCodes.forEach { cityCode ->
          downloadingCities.remove(cityCode)
          pausedCities.remove(cityCode)
        }
      }
    }
    
    AsyncFunction("batchUpdate") { cityCodes: List<String> ->
      synchronized(lock) {
        cityCodes.forEach { cityCode ->
          downloadingCities.add(cityCode)
        }
      }
      cityCodes.forEach { cityCode ->
        getOfflineMapManager().updateOfflineCityByCode(cityCode)
      }
    }
    
    AsyncFunction("pauseAllDownloads") {
      // pause() 只暂停正在下载的,不包括队列
      getOfflineMapManager().pause()
      
      synchronized(lock) {
        pausedCities.addAll(downloadingCities)
        downloadingCities.forEach { cityCode ->
          val city = getOfflineMapManager().getItemByCityCode(cityCode)
          if (city != null) {
            sendEvent("onDownloadPaused", Bundle().apply {
              putString("cityCode", cityCode)
              putString("cityName", city.city)
            })
          }
        }
        downloadingCities.clear()
      }
    }
    
    AsyncFunction("resumeAllDownloads") {
      val pausedList = synchronized(lock) {
        pausedCities.toList()
      }
      
      // 重新下载所有暂停的城市
      pausedList.forEach { cityCode ->
        synchronized(lock) {
          downloadingCities.add(cityCode)
          pausedCities.remove(cityCode)
        }
        startCityDownload(getOfflineMapManager(), cityCode, "resumeAllDownloads")
      }
    }
  }
  
  // ==================== 辅助方法 ====================

  private fun findCity(manager: OfflineMapManager, cityCode: String): OfflineMapCity? {
    return manager.getItemByCityCode(cityCode)
      ?: manager.offlineMapCityList?.find { it.code == cityCode || it.adcode == cityCode }
  }

  private fun startCityDownload(manager: OfflineMapManager, cityCode: String, action: String) {
    val city = findCity(manager, cityCode)
      ?: throw IllegalArgumentException("City not found: $cityCode")

    logCityBeforeDownload(city, cityCode, action)
    downloadCity(manager, city)
  }

  private fun downloadCity(manager: OfflineMapManager, city: OfflineMapCity) {
    try {
      manager.downloadByCityCode(city.code)
      return
    } catch (codeError: Exception) {
      Log.w(logTag, "downloadByCityCode failed cityCode=${city.code} cityName=${city.city} error=${codeError.message}")
      try {
        manager.downloadByCityName(city.city)
      } catch (nameError: Exception) {
        throw IllegalStateException(
          "离线地图下载失败: cityCode=${city.code}, cityName=${city.city}, codeError=${codeError.message}, nameError=${nameError.message}",
          nameError
        )
      }
    }
  }

  private fun logCityBeforeDownload(city: OfflineMapCity?, cityCode: String, action: String) {
    Log.i(logTag, "$action cityCode=$cityCode cityName=${city?.city} code=${city?.code} adcode=${city?.adcode} state=${city?.state} progress=${city?.let { getDownloadProgress(it) }} size=${city?.size} url=${city?.url}")
  }
  
  /**
   * 处理下载状态回调
   */
  private fun handleDownloadStatus(status: Int, completeCode: Int, downName: String?) {
    Log.i(logTag, "onDownload raw status=$status completeCode=$completeCode downName=$downName")

    if (downName == null) return
    
    // downName 可能是城市代码或城市名称,尝试两种方式查找
    val manager = offlineMapManager ?: return
    var city = manager.getItemByCityCode(downName)
    if (city == null) {
      city = manager.offlineMapCityList?.find { it.city == downName }
    }
    
    if (city == null) {
      Log.w(logTag, "onDownload city not found for downName=$downName status=$status completeCode=$completeCode")
      return
    }
    
    val cityCode = city.code
    val cityName = city.city
    Log.i(logTag, "onDownload city cityCode=$cityCode cityName=$cityName adcode=${city.adcode} state=${city.state} progress=${getDownloadProgress(city)} size=${city.size} url=${city.url} status=$status completeCode=$completeCode")
    
    when (status) {
      OfflineMapStatus.SUCCESS -> {
        synchronized(lock) {
          downloadingCities.remove(cityCode)
          pausedCities.remove(cityCode)
        }
        sendEvent("onDownloadComplete", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", cityName)
        })
      }
      
      OfflineMapStatus.LOADING -> {
        sendEvent("onDownloadProgress", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", cityName)
          putInt("progress", completeCode)
          putLong("receivedSize", (city.size * completeCode / 100))
          putLong("expectedSize", city.size)
        })
      }
      
      OfflineMapStatus.UNZIP -> {
        sendEvent("onUnzipProgress", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", cityName)
        })
      }
      
      OfflineMapStatus.ERROR -> {
        synchronized(lock) {
          downloadingCities.remove(cityCode)
        }
        sendEvent("onDownloadError", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", cityName)
          putString("error", "解压失败,数据可能有问题")
        })
      }

      startDownloadFailedCode -> {
        synchronized(lock) {
          downloadingCities.remove(cityCode)
        }
        sendEvent("onDownloadError", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", cityName)
          putString("error", "下载地址为空或离线包不可用")
          putInt("errorCode", status)
        })
      }
      
      OfflineMapStatus.EXCEPTION_NETWORK_LOADING -> {
        sendEvent("onDownloadError", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", cityName)
          putString("error", "网络异常")
        })
      }
      
      OfflineMapStatus.EXCEPTION_AMAP -> {
        synchronized(lock) {
          downloadingCities.remove(cityCode)
        }
        sendEvent("onDownloadError", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", cityName)
          putString("error", "认证异常,请检查Key")
        })
      }
      
      OfflineMapStatus.EXCEPTION_SDCARD -> {
        synchronized(lock) {
          downloadingCities.remove(cityCode)
        }
        sendEvent("onDownloadError", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", cityName)
          putString("error", "SD卡读写异常")
        })
      }
      
      OfflineMapStatus.PAUSE -> {
        // 检查是否是用户主动暂停
        val isPaused = synchronized(lock) { pausedCities.contains(cityCode) }
        if (isPaused) {
          sendEvent("onDownloadPaused", Bundle().apply {
            putString("cityCode", cityCode)
            putString("cityName", cityName)
          })
        }
      }
    }
  }
  
  /**
   * 转换城市对象为 Map
   */
  private fun getDownloadedCityKeys(manager: OfflineMapManager): Set<String> {
    return manager.downloadOfflineMapCityList
      ?.flatMap { getCityIdentityKeys(it) }
      ?.toSet()
      ?: emptySet()
  }

  private fun getCityIdentityKeys(city: OfflineMapCity): List<String> {
    return listOfNotNull(
      city.code?.trim()?.takeIf { it.isNotEmpty() }?.let { "code:$it" },
      city.adcode?.trim()?.takeIf { it.isNotEmpty() }?.let { "adcode:$it" },
      city.city?.trim()?.takeIf { it.isNotEmpty() }?.let { "name:$it" }
    )
  }

  private fun isDownloadedCity(city: OfflineMapCity, downloadedCityKeys: Set<String>): Boolean {
    return getCityIdentityKeys(city).any { downloadedCityKeys.contains(it) }
  }

  private fun convertCityToMap(
    city: OfflineMapCity,
    downloadedCityKeys: Set<String> = emptySet()
  ): Bundle {
    val isPaused = synchronized(lock) { pausedCities.contains(city.code) }
    val isDownloading = synchronized(lock) { downloadingCities.contains(city.code) }
    val isDownloaded = isDownloadedCity(city, downloadedCityKeys)
    
    val status = when {
      isPaused -> "paused"
      isDownloading -> "downloading"
      isDownloaded -> "downloaded"
      else -> getStatusString(city.state)
    }
    
    return Bundle().apply {
      putString("cityCode", city.code)
      putString("cityName", city.city)
      putLong("size", city.size)
      putString("status", status)
      putInt("progress", getDownloadProgress(city))
      putString("version", city.version)
      putLong("downloadedSize", (city.size * getDownloadProgress(city) / 100))
    }
  }
  
  /**
   * 转换省份对象为 Map
   */
  private fun convertProvinceToMap(province: OfflineMapProvince): Bundle {
    return Bundle().apply {
      putString("cityCode", province.provinceCode)
      putString("cityName", province.provinceName)
      putLong("size", province.size)
      putString("status", getStatusString(province.state))
      putInt("progress", getDownloadProgress(province))
      putString("version", province.version)
      putString("provinceName", province.provinceName)
      putString("provinceCode", province.provinceCode)
    }
  }

  /**
   * 兼容获取 START_DOWNLOAD_FAILED 状态码
   * 国内版拼写为 START_DOWNLOAD_FAILD，Google Play 版修正为 START_DOWNLOAD_FAILED
   */
  private val startDownloadFailedCode: Int by lazy {
    try {
      OfflineMapStatus::class.java.getField("START_DOWNLOAD_FAILED").getInt(null)
    } catch (_: Exception) {
      try {
        OfflineMapStatus::class.java.getField("START_DOWNLOAD_FAILD").getInt(null)
      } catch (_: Exception) {
        -1
      }
    }
  }

  /**
   * 兼容获取下载进度
   * Google Play 版本 SDK 可能修复了 getcompleteCode 的命名或使用了不同的 API
   */
  private fun getDownloadProgress(obj: Any): Int {
    try {
      // 尝试标准版的命名 (getcompleteCode)
      val method = obj.javaClass.getMethod("getcompleteCode")
      return method.invoke(obj) as Int
    } catch (_: Exception) {
      try {
        // 尝试修正后的命名 (getCompleteCode) - Google Play 版本可能使用此命名
        val method = obj.javaClass.getMethod("getCompleteCode")
        return method.invoke(obj) as Int
      } catch (_: Exception) {
        // 如果都失败了，尝试直接访问 completeCode 字段
         try {
             val field = obj.javaClass.getField("completeCode")
             return field.getInt(obj)
         } catch (_: Exception) {
             return 0
         }
      }
    }
  }
  
  /**
   * 获取状态字符串。
   * CHECKUPDATES / NEW_VERSION 在 10.1.600 冷启动时可能出现在普通城市列表,
   * 不能单独作为已下载依据；已下载状态以 downloadOfflineMapCityList 为准。
   */
  private fun getStatusString(state: Int): String {
    return when (state) {
      OfflineMapStatus.SUCCESS -> "downloaded"
      OfflineMapStatus.LOADING -> "downloading"
      OfflineMapStatus.UNZIP -> "unzipping"
      OfflineMapStatus.WAITING -> "downloading"
      OfflineMapStatus.PAUSE -> "paused"
      OfflineMapStatus.STOP -> "paused"
      OfflineMapStatus.ERROR -> "failed"
      OfflineMapStatus.EXCEPTION_NETWORK_LOADING -> "downloading"  // 网络问题,可继续
      OfflineMapStatus.EXCEPTION_AMAP -> "failed"  // 认证异常
      OfflineMapStatus.EXCEPTION_SDCARD -> "failed"  // SD卡异常
      startDownloadFailedCode -> "failed"  // 兼容两种拼写的开始下载失败
      OfflineMapStatus.CHECKUPDATES -> "not_downloaded"
      OfflineMapStatus.NEW_VERSION -> "not_downloaded"
      else -> "not_downloaded"
    }
  }
}
