package qiuxiang.amap3d.modules

import com.amap.api.location.AMapLocation
import com.amap.api.location.AMapLocationClient
import com.amap.api.location.AMapLocationClientOption
import com.amap.api.location.AMapLocationClientOption.AMapLocationProtocol
import com.amap.api.location.AMapLocationListener
import com.amap.api.location.CoordinateConverter
import com.amap.api.location.DPoint
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap


class RNAMapGeolocationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(
        reactContext
    ) {
    private var eventEmitter: ReactContext.RCTDeviceEventEmitter? = null

    // 声明AMapLocationClient类对象
    private var client: AMapLocationClient? = null

    // 初始化 AMapLocationClientOption 对象
    private val option = AMapLocationClientOption()
    private var mLastAMapLocation: AMapLocation? = null

    @ReactMethod
    @Throws(Exception::class)
    fun setApiKey(key: String?) {
        if (client != null) {
            // client = null;
            client!!.onDestroy()
        }
        // 通过SDK提供的 `setApiKey(String key);` 接口设置Key，注意Key设置要在SDK业务初始化之前。
        // 需要在初始化的额前面设置 key
        AMapLocationClient.setApiKey(key)
        /**
         * 设置包含隐私政策，并展示用户授权弹窗 `必须在 AmapLocationClient 实例化之前调用`
         * @param context
         * @param isContains: 是隐私权政策是否包含高德开平隐私权政策  true 是包含
         * @param isShow: 隐私权政策是否弹窗展示告知用户 true 是展示
         * @since 5.6.0
         */
        AMapLocationClient.updatePrivacyShow(this.reactContext, true, true)
        /**
         * 设置是否同意用户授权政策 `必须在 AmapLocationClient 实例化之前调用
         * https://lbs.amap.com/api/android-location-sdk/guide/create-project/dev-attention#t1
         * @param context
         * @param isAgree:隐私权政策是否取得用户同意 true 是用户同意
         *
         * @since 5.6.0
         */
        AMapLocationClient.updatePrivacyAgree(this.reactContext, true)
        // 初始化定位
        client = AMapLocationClient(reactContext.applicationContext)
        //设置定位参数
        client!!.setLocationOption(option)
        // 设置定位监听
        client!!.setLocationListener(locationListener)
        // 用于在 React Native 中获取 DeviceEventManagerModule.RCTDeviceEventEmitter 类的 JS Module 对象，
        // 以便在 JS 端发送和侦听基于设备事件的消息
        eventEmitter =
            reactContext.getJSModule<ReactContext.RCTDeviceEventEmitter>(ReactContext.RCTDeviceEventEmitter::class.java)
    }

    override fun getName(): String {
        return "RNAMapGeolocation"
    }

    /**
     * 定位监听
     */
    var locationListener: AMapLocationListener = object : AMapLocationListener {
        override fun onLocationChanged(location: AMapLocation) {
            println("client.onLocationChanged()!~!!!!!!")
            mLastAMapLocation = location
            deviceEventEmitter?.emit("AMapGeolocation", toJSON(location))
        }
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
        // client.stopLocation();
    }

    @ReactMethod
    fun getCurrentLocation(promise: Promise) {
        try {
            if (client == null) {
                promise.reject("-1", "尚未调用 setApiKey() 进行初始化")
                return
            }
            if (!client!!.isStarted) {
                client!!.startLocation()
            }
            // System.out.println(mLastAMapLocation);
            promise.resolve(toJSON(mLastAMapLocation))
            client!!.stopLocation()
        } catch (e: Exception) {
            promise.reject("-110", e.message)
        }
    }

    @ReactMethod
    fun getLastKnownLocation(promise: Promise) {
        if (client == null) {
            promise.reject("-1", "尚未调用 setApiKey() 进行初始化")
            return
        }
        val location = client!!.lastKnownLocation
        promise.resolve(toJSON(location))
    }

    @ReactMethod
    fun start() {
        if (client == null) {
            return
        }
        client!!.startLocation()
    }

    @ReactMethod
    fun stop() {
        if (client == null) {
            return
        }
        client!!.stopLocation()
    }

    @ReactMethod
    fun isStarted(promise: Promise) {
        if (client == null) {
            promise.reject("-1", "尚未调用 setApiKey() 进行初始化")
            return
        }
        promise.resolve(client!!.isStarted)
    }

    /**
     * 默认的定位参数
     */
    // private AMapLocationClientOption getDefaultOption(){
    // 	AMapLocationClientOption mOption = new AMapLocationClientOption();
    // 	mOption.setLocationMode(AMapLocationMode.Hight_Accuracy);//可选，设置定位模式，可选的模式有高精度、仅设备、仅网络。默认为高精度模式
    // 	mOption.setGpsFirst(false);//可选，设置是否gps优先，只在高精度模式下有效。默认关闭
    // 	mOption.setHttpTimeOut(30000);//可选，设置网络请求超时时间。默认为30秒。在仅设备模式下无效
    // 	mOption.setInterval(2000); //可选，设置定位间隔。默认为2秒
    // 	mOption.setNeedAddress(true);//可选，设置是否返回逆地理地址信息。默认是true
    // 	mOption.setOnceLocation(false);//可选，设置是否单次定位。默认是false
    // 	mOption.setOnceLocationLatest(false);//可选，设置是否等待wifi刷新，默认为false.如果设置为true,会自动变为单次定位，持续定位时不要使用
    // 	AMapLocationClientOption.setLocationProtocol(AMapLocationProtocol.HTTP);//可选， 设置网络请求的协议。可选HTTP或者HTTPS。默认为HTTP
    // 	mOption.setSensorEnable(false);//可选，设置是否使用传感器。默认是false
    // 	mOption.setWifiScan(true); //可选，设置是否开启wifi扫描。默认为true，如果设置为false会同时停止主动刷新，停止以后完全依赖于系统刷新，定位位置可能存在误差
    // 	mOption.setLocationCacheEnable(true); //可选，设置是否使用缓存定位，默认为true
    // 	mOption.setGeoLanguage(AMapLocationClientOption.GeoLanguage.DEFAULT);//可选，设置逆地理信息的语言，默认值为默认语言（根据所在地区选择语言）
    // 	return mOption;
    // }
    /**
     * 设置网络请求的协议, 默认值：HTTP
     * @param amapLocationProtocol 可选协议类型:HTTP, HTTPS -wx
     */
    fun setLocationProtocol(amapLocationProtocol: AMapLocationProtocol?) {
        if (client == null) {
            return
        }
        AMapLocationClientOption.setLocationProtocol(amapLocationProtocol)
        client!!.setLocationOption(option)
    }

    /**
     * 设置网络请求超时时间,默认:30秒-wx
     */
    @ReactMethod
    fun setHttpTimeOut(httpTimeOut: Int) {
        if (client == null) {
            return
        }
        option.setHttpTimeOut(httpTimeOut.toLong())
        client!!.setLocationOption(option)
    }

    /**
     * 设置是否使用缓存策略-wx
     */
    @ReactMethod
    fun setLocationCacheEnable(isLocationCacheEnable: Boolean) {
        if (client == null) {
            return
        }
        option.setLocationCacheEnable(isLocationCacheEnable)
        client!!.setLocationOption(option)
    }

    /**
     * 设置是否等待wifi刷新-wx
     */
    @ReactMethod
    fun setOnceLocationLatest(isOnceLocationLatest: Boolean) {
        if (client == null) {
            return
        }
        option.setOnceLocationLatest(isOnceLocationLatest)
        client!!.setLocationOption(option)
    }

    /**
     * 设置是否gps优先-wx
     */
    @ReactMethod
    fun setGpsFirst(isSetGpsFirst: Boolean) {
        if (client == null) {
            return
        }
        option.setGpsFirst(isSetGpsFirst)
        client!!.setLocationOption(option)
    }

    /**
     * 设置发起定位请求的时间间隔，单位：毫秒，默认值：2000毫秒
     */
    @ReactMethod
    fun setInterval(interval: Int) {
        if (client == null) {
            return
        }
        option.setInterval(interval.toLong())
        client!!.setLocationOption(option)
    }

    /**
     * 设置是否单次定位
     */
    @ReactMethod
    fun setOnceLocation(isOnceLocation: Boolean) {
        if (client == null) {
            return
        }
        option.setOnceLocation(isOnceLocation)
        client!!.setLocationOption(option)
    }

    /**
     * 设置逆地理信息的语言,目前之中中文和英文
     */
    @ReactMethod
    fun setGeoLanguage(language: String?) {
        if (client == null) {
            return
        }
        option.setGeoLanguage(AMapLocationClientOption.GeoLanguage.valueOf(language!!))
        client!!.setLocationOption(option)
    }

    /**
     * 设置定位模式。默认值：Hight_Accuracy 高精度模式
     * android 默认定位模式，目前支持三种定位模式
     * - `Hight_Accuracy` 高精度定位模式：在这种定位模式下，将同时使用高德网络定位和卫星定位,优先返回精度高的定位
     * - `Battery_Saving` 低功耗定位模式：在这种模式下，将只使用高德网络定位
     * - `Device_Sensors` 仅设备定位模式：在这种模式下，将只使用卫星定位。
     */
    @ReactMethod
    fun setLocationMode(mode: String?) {
        if (client == null) {
            return
        }
        option.setLocationMode(AMapLocationClientOption.AMapLocationMode.valueOf(mode!!))
        client!!.setLocationOption(option)
    }

    /**
     * 设置是否返回地址信息，默认返回地址信息
     * 默认值：true, 返回地址信息
     */
    @ReactMethod
    fun setNeedAddress(value: Boolean) {
        if (client == null) {
            return
        }
        option.setNeedAddress(value)
        client!!.setLocationOption(option)
    }

    @ReactMethod
    fun coordinateConvert(point: ReadableMap, typer: Int, promise: Promise) {
        if (client == null) {
            return
        }
        try {
            // { latitude: 40.002172, longitude: 116.467357 }
            // 构造一个示例坐标，第一个参数是纬度，第二个参数是经度
            val pointer = DPoint(point.getDouble("latitude"), point.getDouble("longitude"))
            // DPoint pointer = new DPoint(39.911127, 116.433608);
            // 初始化坐标转换类
            val converter = CoordinateConverter(
                reactContext.applicationContext
            )
            /**
             * 设置坐标来源,这里使用百度坐标作为示例
             * 可选的来源包括：
             * - CoordType.BAIDU: 百度坐标
             * - CoordType.MAPBAR: 图吧坐标
             * - CoordType.MAPABC: 图盟坐标
             * - CoordType.SOSOMAP: 搜搜坐标
             * - CoordType.ALIYUN: 阿里云坐标
             * - CoordType.GOOGLE: 谷歌坐标
             * - CoordType.GPS: GPS坐标
             */
            when (typer) {
                0 -> converter.from(CoordinateConverter.CoordType.BAIDU)
                1 -> converter.from(CoordinateConverter.CoordType.MAPBAR)
                2 -> converter.from(CoordinateConverter.CoordType.MAPABC)
                3 -> converter.from(CoordinateConverter.CoordType.SOSOMAP)
                4 -> converter.from(CoordinateConverter.CoordType.ALIYUN)
                5 -> converter.from(CoordinateConverter.CoordType.GOOGLE)
                6 -> converter.from(CoordinateConverter.CoordType.GPS)
                else -> {}
            }
            converter.coord(pointer)
            // 转换成高德坐标
            val destPoint = converter.convert()
            val map = Arguments.createMap()
            map.putDouble("latitude", destPoint.latitude)
            map.putDouble("longitude", destPoint.longitude)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("-11", e.message)
        }
    }

    /**
     * 设置是否允许调用WIFI刷新 默认值为true，当设置为false时会停止主动调用WIFI刷新，将会极大程度影响定位精度，但可以有效的降低定位耗电
     * 默认值：true, 返回地址信息
     */
    @ReactMethod
    fun setWifiScan(isWifiPassiveScan: Boolean) {
        if (client == null) {
            return
        }
        option.setWifiScan(isWifiPassiveScan)
        client!!.setLocationOption(option)
    }

    /**
     * 设置是否使用设备传感器。是否开启设备传感器，当设置为true时，网络定位可以返回海拔、角度和速度。
     * [高德地图 setSensorEnable 文档](http://amappc.cn-hangzhou.oss-pub.aliyun-inc.com/lbs/static/unzip/Android_Location_Doc/index.html)
     * @default false
     * @platform android
     */
    @ReactMethod
    fun setSensorEnable(sensorEnable: Boolean) {
        if (client == null) {
            return
        }
        option.setSensorEnable(sensorEnable)
        client!!.setLocationOption(option)
    }

    private val deviceEventEmitter: ReactContext.RCTDeviceEventEmitter?
        get() {
            if (eventEmitter == null) {
                eventEmitter =
                    reactContext.getJSModule<ReactContext.RCTDeviceEventEmitter>(ReactContext.RCTDeviceEventEmitter::class.java)
            }
            return eventEmitter
        }

    private fun toJSON(location: AMapLocation?): WritableMap? {
        if (location == null) {
            return null
        }
        val map = Arguments.createMap()
        map.putInt("errorCode", location.errorCode)
        map.putString("errorInfo", location.errorInfo)
        if (location.errorCode == AMapLocation.LOCATION_SUCCESS) {
            map.putDouble("accuracy", location.accuracy.toDouble())
            map.putDouble("latitude", location.latitude)
            map.putDouble("longitude", location.longitude)
            map.putDouble("altitude", location.altitude)
            map.putDouble("speed", location.speed.toDouble())
            // 获取方向角(单位：度）
            map.putDouble("heading", location.bearing.toDouble())
            map.putDouble("timestamp", location.time.toDouble())
            if (!location.address.isEmpty()) {
                map.putString("address", location.address)
                map.putString("country", location.country)
                map.putString("province", location.province)
                map.putString("city", location.city)
                map.putString("district", location.district)
                map.putString("cityCode", location.cityCode)
                map.putString("adCode", location.adCode)
                map.putString("street", location.street)
                map.putString("streetNumber", location.streetNum)
                map.putString("poiName", location.poiName)
                map.putString("aoiName", location.aoiName)
            }


            // --------------------
            // 以上与 iOS 相同字段


            // 获取坐标系类型 高德定位sdk会返回两种坐标系：
            // 坐标系 AMapLocation.COORD_TYPE_GCJ02 -- GCJ02
            // 坐标系 AMapLocation.COORD_TYPE_WGS84 -- WGS84
            // 国外定位时返回的是WGS84坐标系
            map.putString("coordType", location.coordType)
            // 获取位置语义信息
            map.putString("description", location.description)

            // 返回支持室内定位的建筑物ID信息
            map.putString("buildingId", location.buildingId)
            // 室内外置信度
            // 室内：且置信度取值在[1 ～ 100]，值越大在在室内的可能性越大
            // 室外：且置信度取值在[-100 ～ -1] ,值越小在在室内的可能性越大
            // 无法识别室内外：置信度返回值为 0
            map.putInt("conScenario", location.conScenario)
            // 获取室内定位的楼层信息
            map.putString("floor", location.floor)
            // 获取卫星信号强度，仅在卫星定位时有效,值为：
            // #GPS_ACCURACY_BAD，#GPS_ACCURACY_GOOD，#GPS_ACCURACY_UNKNOWN
            map.putInt("gpsAccuracyStatus", location.gpsAccuracyStatus)
            // 获取定位信息描述
            map.putString("locationDetail", location.locationDetail)

            map.putInt("locationType", location.locationType)
            map.putString("provider", location.provider)
            map.putInt("satellites", location.satellites)
            map.putInt("trustedLevel", location.trustedLevel)


            val qualityReportMap = Arguments.createMap()
            // 获取定位质量
            val aMapLocationQualityReport = location.locationQualityReport
            var adviseMessage = aMapLocationQualityReport.adviseMessage
            if (adviseMessage != null) {
                adviseMessage = adviseMessage.replace("[\\t\\n\\r/]".toRegex(), "")
            }
            qualityReportMap.putString("adviseMessage", adviseMessage)
            qualityReportMap.putInt("gpsSatellites", aMapLocationQualityReport.gpsSatellites)
            qualityReportMap.putInt("gpsStatus", aMapLocationQualityReport.gpsStatus)
            qualityReportMap.putDouble(
                "netUseTime",
                aMapLocationQualityReport.netUseTime.toDouble()
            )
            qualityReportMap.putString("networkType", aMapLocationQualityReport.networkType)
            qualityReportMap.putBoolean(
                "isInstalledHighDangerMockApp",
                aMapLocationQualityReport.isInstalledHighDangerMockApp
            )
            qualityReportMap.putBoolean("isWifiAble", aMapLocationQualityReport.isWifiAble)
            map.putMap("locationQualityReport", qualityReportMap)
        } else if (location.errorCode == AMapLocation.ERROR_CODE_FAILURE_LOCATION_PERMISSION) {
            val qualityReportMap = Arguments.createMap()
            // 获取定位质量
            val aMapLocationQualityReport = location.locationQualityReport
            qualityReportMap.putInt("gpsStatus", aMapLocationQualityReport.gpsStatus)
            qualityReportMap.putString("getAdviseMessage", aMapLocationQualityReport.adviseMessage)
            map.putMap("locationQualityReport", qualityReportMap)
        }
        return map
    }
}
