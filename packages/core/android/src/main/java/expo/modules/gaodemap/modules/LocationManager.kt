package expo.modules.gaodemap.modules

import android.content.Context
import com.amap.api.location.AMapLocation
import com.amap.api.location.AMapLocationClient
import com.amap.api.location.AMapLocationClientOption
import com.amap.api.maps.model.LatLng
import expo.modules.kotlin.Promise
import expo.modules.gaodemap.services.LocationForegroundService

/**
 * 定位管理器
 * 
 * 负责:
 * - 连续定位和单次定位
 * - 定位配置管理
 * - 坐标转换
 * - 定位结果回调
 */
class LocationManager(context: Context) {


    /** 应用上下文(避免 Activity 泄露) */
    private val appContext: Context = context.applicationContext
    /** 定位客户端 */
    private var locationClient: AMapLocationClient? = null
    /** 定位配置选项 */
    private var locationOption: AMapLocationClientOption? = null
    /** 定位是否已启动 */
    private var isLocationStarted = false
    /** 定位更新回调 */
    private var onLocationUpdate: ((Map<String, Any?>) -> Unit)? = null
    /** 是否启用后台定位 */
    private var allowsBackgroundLocationUpdates = false

    init {
        initLocationClient()
    }

    /**
     * 设置定位更新回调
     * @param callback 回调函数
     */
    fun setOnLocationUpdate(callback: (Map<String, Any?>) -> Unit) {
        onLocationUpdate = callback
    }

    /**
     * 开始连续定位
     */
    fun start() {
        if (locationClient == null) {
            initLocationClient()
        }
        
        // 如果启用后台定位,启动前台服务
        if (allowsBackgroundLocationUpdates) {
            LocationForegroundService.start(appContext)
        }
        
        locationClient?.startLocation()
        isLocationStarted = true
    }

    /**
     * 停止定位
     */
    fun stop() {
        locationClient?.stopLocation()
        isLocationStarted = false
        
        // 停止前台服务
        if (allowsBackgroundLocationUpdates) {
            LocationForegroundService.stop(appContext)
        }
    }

    /**
     * 检查是否正在定位
     * @return 是否正在定位
     */
    fun isStarted(): Boolean = isLocationStarted

    /**
     * 获取当前位置（单次定位）
     * @param promise Promise 对象用于返回结果
     */
    fun getCurrentLocation(promise: Promise) {
        val onceOption = AMapLocationClientOption().apply {
            isOnceLocation = true
            locationOption?.let { opt ->
                locationMode = opt.locationMode
                isNeedAddress = opt.isNeedAddress
                httpTimeOut = opt.httpTimeOut
            }
        }

        val tempClient = AMapLocationClient(appContext)
        tempClient.setLocationOption(onceOption)
        tempClient.setLocationListener { location ->
            if (location != null && location.errorCode == 0) {
                promise.resolve(formatLocation(location))
            } else {
                promise.reject("LOCATION_ERROR", location?.errorInfo ?: "定位失败", null)
            }
            tempClient.stopLocation()
            tempClient.onDestroy()
        }
        tempClient.startLocation()
    }

    /**
     * 坐标转换
     * @param coordinate 原始坐标
     * @param type 坐标类型
     * @param promise Promise 对象用于返回结果
     */
    fun coordinateConvert(
        coordinate: Map<String, Double>,
        type: Int,
        promise: Promise
    ) {
        val lat = coordinate["latitude"] ?: 0.0
        val lng = coordinate["longitude"] ?: 0.0

        // 坐标验证
        if (lat < -90 || lat > 90) {
            promise.reject("INVALID_COORDINATE", "纬度必须在 -90 到 90 之间", null)
            return
        }
        if (lng < -180 || lng > 180) {
            promise.reject("INVALID_COORDINATE", "经度必须在 -180 到 180 之间", null)
            return
        }

        try {
            val sourceLatLng = LatLng(lat, lng)
            // 高德 SDK 会自动处理坐标转换
            promise.resolve(
                mapOf(
                    "latitude" to sourceLatLng.latitude,
                    "longitude" to sourceLatLng.longitude
                )
            )
        } catch (e: Exception) {
            promise.reject("CONVERT_ERROR", "坐标转换失败: ${e.message}", e)
        }
    }

    // ==================== 配置方法 ====================

    /** 设置是否返回逆地理信息 */
    fun setLocatingWithReGeocode(isReGeocode: Boolean) {
        getOrCreateLocationOption().isNeedAddress = isReGeocode
        applyLocationOption()
    }

    /** 设置定位模式 */
    fun setLocationMode(mode: Int) {
        val locationMode = when (mode) {
            1 -> AMapLocationClientOption.AMapLocationMode.Hight_Accuracy
            2 -> AMapLocationClientOption.AMapLocationMode.Battery_Saving
            3 -> AMapLocationClientOption.AMapLocationMode.Device_Sensors
            else -> AMapLocationClientOption.AMapLocationMode.Hight_Accuracy
        }
        getOrCreateLocationOption().locationMode = locationMode
        applyLocationOption()
    }

    /** 设置定位间隔(毫秒) */
    fun setInterval(interval: Int) {
        getOrCreateLocationOption().interval = interval.toLong()
        applyLocationOption()
    }

    /** 设置是否单次定位 */
    fun setOnceLocation(isOnceLocation: Boolean) {
        getOrCreateLocationOption().isOnceLocation = isOnceLocation
        applyLocationOption()
    }

    /** 设置是否使用设备传感器 */
    fun setSensorEnable(sensorEnable: Boolean) {
        getOrCreateLocationOption().isSensorEnable = sensorEnable
        applyLocationOption()
    }

    /** 设置是否允许 WIFI 扫描 */
    fun setWifiScan(wifiScan: Boolean) {
        getOrCreateLocationOption().isWifiScan = wifiScan
        applyLocationOption()
    }

    /** 设置是否 GPS 优先 */
    fun setGpsFirst(gpsFirst: Boolean) {
        getOrCreateLocationOption().isGpsFirst = gpsFirst
        applyLocationOption()
    }

    /** 设置是否等待 WIFI 列表刷新 */
    fun setOnceLocationLatest(onceLocationLatest: Boolean) {
        getOrCreateLocationOption().isOnceLocationLatest = onceLocationLatest
        applyLocationOption()
    }

    /** 设置逆地理语言 */
    fun setGeoLanguage(language: String) {
        val geoLanguage = when (language) {
            "EN" -> AMapLocationClientOption.GeoLanguage.EN
            "ZH" -> AMapLocationClientOption.GeoLanguage.ZH
            else -> AMapLocationClientOption.GeoLanguage.DEFAULT
        }
        getOrCreateLocationOption().geoLanguage = geoLanguage
        applyLocationOption()
    }

    /** 设置是否使用缓存策略 */
    fun setLocationCacheEnable(locationCacheEnable: Boolean) {
        getOrCreateLocationOption().isLocationCacheEnable = locationCacheEnable
        applyLocationOption()
    }

    /** 设置网络请求超时时间(毫秒) */
    fun setHttpTimeOut(httpTimeOut: Int) {
        getOrCreateLocationOption().httpTimeOut = httpTimeOut.toLong()
        applyLocationOption()
    }

    /** 设置是否允许后台定位 */
    fun setAllowsBackgroundLocationUpdates(allows: Boolean) {
        allowsBackgroundLocationUpdates = allows
    }

    /**
     * 销毁资源
     */
    fun destroy() {
        onLocationUpdate = null
        locationClient?.stopLocation()
        locationClient?.onDestroy()
        locationClient = null
        locationOption = null
        
        // 确保停止前台服务
        if (allowsBackgroundLocationUpdates) {
            LocationForegroundService.stop(appContext)
        }
    }

    // ==================== 私有方法 ====================

    /**
     * 初始化定位客户端
     */
    private fun initLocationClient() {
        if (locationClient == null) {
            locationClient = AMapLocationClient(appContext).apply {
                setLocationListener { location ->
                    if (location != null && location.errorCode == 0) {
                        onLocationUpdate?.invoke(formatLocation(location))
                    }
                }
                
            }

            locationOption = AMapLocationClientOption().apply {
                locationMode = AMapLocationClientOption.AMapLocationMode.Hight_Accuracy
                isNeedAddress = true
                interval = 2000
                httpTimeOut = 30000
            }
            locationClient?.setLocationOption(locationOption)
        }
    }

    /**
     * 获取或创建定位配置选项
     * @return 定位配置选项
     */
    private fun getOrCreateLocationOption(): AMapLocationClientOption {
        if (locationOption == null) {
            locationOption = AMapLocationClientOption()
        }
        return locationOption!!
    }

    /**
     * 应用定位配置
     */
    private fun applyLocationOption() {
        locationClient?.setLocationOption(locationOption)
    }

    /**
     * 格式化定位结果
     * @param location 定位对象
     * @return 格式化后的定位信息
     */
    private fun formatLocation(location: AMapLocation): Map<String, Any?> {
        return mapOf(
            "latitude" to location.latitude,
            "longitude" to location.longitude,
            "altitude" to location.altitude,
            "accuracy" to location.accuracy,
            "heading" to location.bearing,
            "speed" to location.speed,
            "timestamp" to location.time,
            "address" to location.address,
            "country" to location.country,
            "province" to location.province,
            "city" to location.city,
            "district" to location.district,
            "cityCode" to location.cityCode,
            "adCode" to location.adCode,
            "street" to location.street,
            "streetNumber" to location.streetNum,
            "poiName" to location.poiName,
            "aoiName" to location.aoiName,
            "description" to location.locationDetail,
            "coordType" to location.coordType,
            "buildingId" to location.buildingId
        )
    }
}
