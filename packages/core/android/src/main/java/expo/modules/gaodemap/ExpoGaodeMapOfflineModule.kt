package expo.modules.gaodemap

import android.os.Bundle
import android.os.StatFs
import android.os.Environment
import com.amap.api.maps.offlinemap.OfflineMapCity
import com.amap.api.maps.offlinemap.OfflineMapManager
import com.amap.api.maps.offlinemap.OfflineMapProvince
import com.amap.api.maps.offlinemap.OfflineMapStatus
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * 高德地图离线地图模块 (Android)
 */
class ExpoGaodeMapOfflineModule : Module() {
  
  private var offlineMapManager: OfflineMapManager? = null
  private val downloadingCities = mutableSetOf<String>()
  private val pausedCities = mutableSetOf<String>()
  
  // 线程安全锁
  private val lock = Any()
  
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
    
    // ==================== 模块生命周期 ====================
    
    OnCreate {
      // 初始化离线地图管理器
      offlineMapManager = OfflineMapManager(appContext.reactContext, object : OfflineMapManager.OfflineMapDownloadListener {
        override fun onDownload(status: Int, completeCode: Int, downName: String?) {
          handleDownloadStatus(status, completeCode, downName)
        }
        
        override fun onCheckUpdate(hasNew: Boolean, name: String?) {
          // 更新检查回调
        }
        
        override fun onRemove(success: Boolean, name: String?, describe: String?) {
          // 删除回调
        }
      })
    }
    
    OnDestroy {
      offlineMapManager?.destroy()
      offlineMapManager = null
      downloadingCities.clear()
    }
    
    // ==================== 地图列表管理 ====================
    
    AsyncFunction("getAvailableCities") {
      val cities = offlineMapManager?.offlineMapCityList ?: emptyList()
      cities.map { city -> convertCityToMap(city) }
    }
    
    AsyncFunction("getAvailableProvinces") {
      val provinces = offlineMapManager?.offlineMapProvinceList ?: emptyList()
      provinces.map { province -> convertProvinceToMap(province) }
    }
    
    AsyncFunction("getCitiesByProvince") { provinceCode: String ->
      val province = offlineMapManager?.offlineMapProvinceList?.find { 
        it.provinceCode == provinceCode 
      }
      province?.cityList?.map { city -> convertCityToMap(city) } ?: emptyList()
    }
    
    AsyncFunction("getDownloadedMaps") {
      val cities = offlineMapManager?.downloadOfflineMapCityList ?: emptyList()
      cities.map { city -> convertCityToMap(city) }
    }
    
    // ==================== 下载管理 ====================
    
    AsyncFunction("startDownload") { config: Map<String, Any?> ->
      val cityCode = config["cityCode"] as? String
        ?: throw IllegalArgumentException("cityCode is required")
      
      synchronized(lock) {
        downloadingCities.add(cityCode)
        pausedCities.remove(cityCode)
      }
      offlineMapManager?.downloadByCityCode(cityCode)
    }
    
    AsyncFunction("pauseDownload") { cityCode: String ->
      val city = offlineMapManager?.getItemByCityCode(cityCode)
      
      synchronized(lock) {
        pausedCities.add(cityCode)
        downloadingCities.remove(cityCode)
      }
      
      // 使用 pauseByName 暂停指定城市
      city?.city?.let { cityName ->
        offlineMapManager?.pauseByName(cityName)
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
      offlineMapManager?.downloadByCityCode(cityCode)
    }
    
    AsyncFunction("cancelDownload") { cityCode: String ->
      val city = offlineMapManager?.getItemByCityCode(cityCode)
      
      synchronized(lock) {
        downloadingCities.remove(cityCode)
        pausedCities.remove(cityCode)
      }
      
      // 使用 stop() 停止所有下载(包括队列)
      offlineMapManager?.stop()
      
      if (city != null) {
        sendEvent("onDownloadCancelled", Bundle().apply {
          putString("cityCode", cityCode)
          putString("cityName", city.city)
        })
      }
    }
    
    AsyncFunction("deleteMap") { cityCode: String ->
      val city = offlineMapManager?.getItemByCityCode(cityCode)
        ?: throw IllegalArgumentException("City not found: $cityCode")
      
      // 官方文档:remove() 需要传入城市名称,不是城市代码
      offlineMapManager?.remove(city.city)
      
      synchronized(lock) {
        downloadingCities.remove(cityCode)
        pausedCities.remove(cityCode)
      }
    }
    
    AsyncFunction("updateMap") { cityCode: String ->
      synchronized(lock) {
        downloadingCities.add(cityCode)
      }
      offlineMapManager?.updateOfflineCityByCode(cityCode)
    }
    
    AsyncFunction("checkUpdate") { cityCode: String ->
      val city = offlineMapManager?.getItemByCityCode(cityCode)
      city?.state == OfflineMapStatus.NEW_VERSION
    }
    
    // ==================== 状态查询 ====================
    
    AsyncFunction("isMapDownloaded") { cityCode: String ->
      val city = offlineMapManager?.getItemByCityCode(cityCode)
      city?.state == OfflineMapStatus.SUCCESS || 
      city?.state == OfflineMapStatus.CHECKUPDATES
    }
    
    AsyncFunction("getMapStatus") { cityCode: String ->
      val city = offlineMapManager?.getItemByCityCode(cityCode)
      city?.let { convertCityToMap(it) } ?: Bundle()
    }
    
    AsyncFunction("getTotalProgress") {
      val downloadedCities = offlineMapManager?.downloadOfflineMapCityList ?: emptyList()
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
      val cities = offlineMapManager?.downloadOfflineMapCityList ?: emptyList()
      cities.sumOf { it.size }
    }
    
    AsyncFunction("getStorageInfo") {
      val cities = offlineMapManager?.downloadOfflineMapCityList ?: emptyList()
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
      offlineMapManager?.downloadOfflineMapCityList?.forEach { city ->
        // 使用城市名称删除
        offlineMapManager?.remove(city.city)
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
        offlineMapManager?.downloadByCityCode(cityCode)
      }
    }
    
    AsyncFunction("batchDelete") { cityCodes: List<String> ->
      cityCodes.forEach { cityCode ->
        val city = offlineMapManager?.getItemByCityCode(cityCode)
        // 使用城市名称删除,不是城市代码
        city?.city?.let { cityName ->
          offlineMapManager?.remove(cityName)
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
        offlineMapManager?.updateOfflineCityByCode(cityCode)
      }
    }
    
    AsyncFunction("pauseAllDownloads") {
      // pause() 只暂停正在下载的,不包括队列
      offlineMapManager?.pause()
      
      synchronized(lock) {
        pausedCities.addAll(downloadingCities)
        downloadingCities.forEach { cityCode ->
          val city = offlineMapManager?.getItemByCityCode(cityCode)
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
        offlineMapManager?.downloadByCityCode(cityCode)
      }
    }
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 处理下载状态回调
   */
  private fun handleDownloadStatus(status: Int, completeCode: Int, downName: String?) {
    if (downName == null) return
    
    // downName 可能是城市代码或城市名称,尝试两种方式查找
    var city = offlineMapManager?.getItemByCityCode(downName)
    if (city == null) {
      city = offlineMapManager?.offlineMapCityList?.find { it.city == downName }
    }
    
    if (city == null) return
    
    val cityCode = city.code
    val cityName = city.city
    
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
  private fun convertCityToMap(city: OfflineMapCity): Bundle {
    val isPaused = synchronized(lock) { pausedCities.contains(city.code) }
    val isDownloading = synchronized(lock) { downloadingCities.contains(city.code) }
    
    val status = when {
      isPaused -> "paused"
      isDownloading -> "downloading"
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
    } catch (e: Exception) {
      try {
        OfflineMapStatus::class.java.getField("START_DOWNLOAD_FAILD").getInt(null)
      } catch (e2: Exception) {
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
    } catch (e: Exception) {
      try {
        // 尝试修正后的命名 (getCompleteCode) - Google Play 版本可能使用此命名
        val method = obj.javaClass.getMethod("getCompleteCode")
        return method.invoke(obj) as Int
      } catch (e2: Exception) {
        // 如果都失败了，尝试直接访问 completeCode 字段
         try {
             val field = obj.javaClass.getField("completeCode")
             return field.getInt(obj)
         } catch (e3: Exception) {
             return 0
         }
      }
    }
  }
  
  /**
   * 获取状态字符串
   * 注意：只有 SUCCESS 状态才表示真正下载完成
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