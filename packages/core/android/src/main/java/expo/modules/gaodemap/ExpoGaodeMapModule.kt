package expo.modules.gaodemap

import com.amap.api.maps.MapsInitializer
import com.amap.api.maps.model.LatLng
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.gaodemap.modules.SDKInitializer
import expo.modules.gaodemap.modules.LocationManager
import expo.modules.gaodemap.utils.GeometryUtils
import kotlin.math.max
import kotlin.math.abs
import expo.modules.gaodemap.utils.LatLngParser

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
            MapsInitializer.setApiKey(apiKey)
            com.amap.api.location.AMapLocationClient.setApiKey(apiKey)


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
          
          // 初始化成功后自动触发一次预加载
          MapPreloadManager.startPreload(appContext.reactContext!!, poolSize = 1)
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
     * 设置是否加载世界向量地图
     * @param enable 是否开启
     */
    Function("setLoadWorldVectorMap") { enable: Boolean ->
        MapsInitializer.loadWorldVectorMap(enable)
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
      } catch (_: Exception) {
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
    AsyncFunction("coordinateConvert") { coordinate: Map<String, Any>?, type: Int, promise: expo.modules.kotlin.Promise ->
      val latLng = LatLngParser.parseLatLng(coordinate)
      if (latLng != null) {
        val coordMap = mapOf("latitude" to latLng.latitude, "longitude" to latLng.longitude)
        getLocationManager().coordinateConvert(coordMap, type, promise)
      } else {
        promise.reject("INVALID_COORDINATE", "Invalid coordinate format", null)
      }
    }

    // ==================== 几何计算 ====================

    /**
     * 计算两个坐标点之间的距离
     * @param coordinate1 第一个坐标点
     * @param coordinate2 第二个坐标点
     * @returns 两点之间的距离（单位：米）
     */
    Function("distanceBetweenCoordinates") { p1: Map<String, Any>?, p2: Map<String, Any>? ->
      val coord1 = LatLngParser.parseLatLng(p1)
      val coord2 = LatLngParser.parseLatLng(p2)
      if (coord1 != null && coord2 != null) {
        GeometryUtils.calculateDistance(coord1, coord2)
      } else {
        0.0
      }
    }

    /**
     * 计算多边形面积
     * @param points 多边形顶点坐标数组，支持嵌套数组（多边形空洞）
     * @return 面积（平方米）
     */
    Function("calculatePolygonArea") { points: List<Any>? ->
      val rings = LatLngParser.parseLatLngListList(points)
      if (rings.isEmpty()) return@Function 0.0
      
      // 第一项是外轮廓
      var totalArea = GeometryUtils.calculatePolygonArea(rings[0])
      
      // 后续项是内孔，需要减去面积
      if (rings.size > 1) {
        for (i in 1 until rings.size) {
          totalArea -= GeometryUtils.calculatePolygonArea(rings[i])
        }
      }
      
      // 确保面积不为负数
      max(0.0, totalArea)
    }

    /**
     * 判断点是否在多边形内
     * @param point 待判断点
     * @param polygon 多边形顶点坐标数组，支持嵌套数组（多边形空洞）
     * @return 是否在多边形内
     */
    Function("isPointInPolygon") { point: Map<String, Any>?, polygon: List<Any>? ->
      val pt = LatLngParser.parseLatLng(point) ?: return@Function false
      val rings = LatLngParser.parseLatLngListList(polygon)
      if (rings.isEmpty()) return@Function false
      
      // 点必须在外轮廓内
      val inOuter = GeometryUtils.isPointInPolygon(pt, rings[0])
      if (!inOuter) return@Function false
      
      // 点不能在任何内孔内
      if (rings.size > 1) {
        for (i in 1 until rings.size) {
          if (GeometryUtils.isPointInPolygon(pt, rings[i])) {
            return@Function false
          }
        }
      }
      
      true
    }

    /**
     * 判断点是否在圆内
     * @param point 待判断点
     * @param center 圆心坐标
     * @param radius 圆半径（米）
     * @return 是否在圆内
     */
    Function("isPointInCircle") { point: Map<String, Any>?, center: Map<String, Any>?, radius: Double ->
      val pt = LatLngParser.parseLatLng(point)
      val cn = LatLngParser.parseLatLng(center)
      if (pt != null && cn != null) {
        GeometryUtils.isPointInCircle(pt, cn, radius)
      } else {
        false
      }
    }

    /**
     * 计算矩形面积
     * @param southWest 西南角
     * @param northEast 东北角
     * @return 面积（平方米）
     */
    Function("calculateRectangleArea") { southWest: Map<String, Any>?, northEast: Map<String, Any>? ->
      val sw = LatLngParser.parseLatLng(southWest)
      val ne = LatLngParser.parseLatLng(northEast)
      if (sw != null && ne != null) {
        GeometryUtils.calculateRectangleArea(sw, ne)
      } else {
        0.0
      }
    }

    /**
     * 获取路径上距离目标点最近的点
     * @param path 路径点集合
     * @param target 目标点
     * @return 最近点结果
     */
    Function("getNearestPointOnPath") { path: List<Any>?, target: Map<String, Any>? ->
      val pathPoints = LatLngParser.parseLatLngList(path)
      val targetPoint = LatLngParser.parseLatLng(target)
      
      if (targetPoint != null && pathPoints.isNotEmpty()) {
        val result = GeometryUtils.getNearestPointOnPath(pathPoints, targetPoint)
        if (result != null) {
          mapOf(
            "latitude" to result.point.latitude,
            "longitude" to result.point.longitude,
            "index" to result.index,
            "distanceMeters" to result.distanceMeters
          )
        } else {
          null
        }
      } else {
        null
      }
    }

    /**
     * 计算多边形质心
     * @param polygon 多边形顶点坐标数组，支持嵌套数组（多边形空洞）
     * @return 质心坐标
     */
    Function("calculateCentroid") { polygon: List<Any>? ->
      val rings = LatLngParser.parseLatLngListList(polygon)
      if (rings.isEmpty()) return@Function null
      
      if (rings.size == 1) {
        val result = GeometryUtils.calculateCentroid(rings[0])
        return@Function result?.let {
          mapOf(
            "latitude" to it.latitude,
            "longitude" to it.longitude
          )
        }
      }
      
      // 带孔多边形的质心计算: Σ(Area_i * Centroid_i) / Σ(Area_i)
      // 注意: 这里的 Area 是带符号的，或者我们手动减去孔的贡献
      var totalArea = 0.0
      var sumLat = 0.0
      var sumLon = 0.0
      
      for (i in rings.indices) {
        val ring = rings[i]
        val area = GeometryUtils.calculatePolygonArea(ring)
        val centroid = GeometryUtils.calculateCentroid(ring)
        
        if (centroid != null) {
          // 第一项是外轮廓(正)，后续是内孔(负)
          val factor = if (i == 0) 1.0 else -1.0
          val signedArea = area * factor
          
          totalArea += signedArea
          sumLat += centroid.latitude * signedArea
          sumLon += centroid.longitude * signedArea
        }
      }
      
      if (abs(totalArea) > 1e-9) {
        mapOf(
          "latitude" to sumLat / totalArea,
          "longitude" to sumLon / totalArea
        )
      } else {
        null
      }
    }

    /**
     * 计算路径边界
     * @param pointsList 路径点集合
     * @return 边界信息
     */
    Function("calculatePathBounds") { pointsList: List<Any>? ->
      val points = LatLngParser.parseLatLngList(pointsList)
      if (points.isEmpty()) return@Function null

      val result = GeometryUtils.calculatePathBounds(points)
      result?.let {
        mapOf(
          "north" to it.north,
          "south" to it.south,
          "east" to it.east,
          "west" to it.west,
          "center" to mapOf(
            "latitude" to it.centerLat,
            "longitude" to it.centerLon
          )
        )
      }
    }

    /**
     * GeoHash 编码
     * @param coordinate 坐标点
     * @param precision 精度 (1-12)
     * @return GeoHash 字符串
     */
    Function("encodeGeoHash") { coordinate: Map<String, Any>?, precision: Int ->
      val latLng = LatLngParser.parseLatLng(coordinate)
      if (latLng != null) {
        GeometryUtils.encodeGeoHash(latLng, precision)
      } else {
        ""
      }
    }

    /**
     * 轨迹抽稀 (RDP 算法)
     * @param points 原始轨迹点
     * @param tolerance 允许误差(米)
     * @return 简化后的轨迹点
     */
    Function("simplifyPolyline") { points: List<Any>?, tolerance: Double ->
      val poly = LatLngParser.parseLatLngList(points)
      val simplified = GeometryUtils.simplifyPolyline(poly, tolerance)
      simplified.map {
        mapOf(
          "latitude" to it.latitude,
          "longitude" to it.longitude
        )
      }
    }

    /**
     * 计算路径总长度
     * @param points 路径点
     * @return 长度(米)
     */
    Function("calculatePathLength") { points: List<Any>? ->
      val poly = LatLngParser.parseLatLngList(points)
      GeometryUtils.calculatePathLength(poly)
    }

    /**
     * 解析高德地图 API 返回的 Polyline 字符串
     * @param polylineStr 高德原始 polyline 字符串
     * @return 坐标点列表
     */
    Function("parsePolyline") { polylineStr: String? ->
      val result = GeometryUtils.parsePolyline(polylineStr)
      result.map {
        mapOf(
          "latitude" to it.latitude,
          "longitude" to it.longitude
        )
      }
    }

    /**
     * 获取路径上指定距离的点
     * @param points 路径点
     * @param distance 距离起点的米数
     * @return 点信息(坐标+角度)
     */
    Function("getPointAtDistance") { points: List<Any>?, distance: Double ->
      val poly = LatLngParser.parseLatLngList(points)
      val result = GeometryUtils.getPointAtDistance(poly, distance)
      if (result != null) {
        mapOf(
          "latitude" to result.point.latitude,
          "longitude" to result.point.longitude,
          "angle" to result.angle
        )
      } else {
        null
      }
    }

    /**
     * 经纬度转瓦片坐标
     * @param coordinate 坐标
     * @param zoom 缩放级别
     * @return 瓦片坐标 [x, y]
     */
    Function("latLngToTile") { coordinate: Map<String, Any>?, zoom: Int ->
      val latLng = LatLngParser.parseLatLng(coordinate)
      if (latLng != null) {
        val result = GeometryUtils.latLngToTile(latLng, zoom)
        if (result != null && result.size >= 2) {
          mapOf("x" to result[0], "y" to result[1])
        } else {
          null
        }
      } else {
        null
      }
    }

    /**
     * 瓦片坐标转经纬度
     * @param tile 瓦片坐标 {x, y, z}
     * @return 坐标
     */
    Function("tileToLatLng") { tile: Map<String, Any>? ->
      val x = (tile?.get("x") as? Number)?.toInt() ?: 0
      val y = (tile?.get("y") as? Number)?.toInt() ?: 0
      val zoom = (tile?.get("z") as? Number)?.toInt() ?: (tile?.get("zoom") as? Number)?.toInt() ?: 0
      val result = GeometryUtils.tileToLatLng(x, y, zoom)
      result?.let {
        mapOf("latitude" to it.latitude, "longitude" to it.longitude)
      }
    }

    /**
     * 经纬度转像素坐标
     * @param coordinate 坐标
     * @param zoom 缩放级别
     * @return 像素坐标 [x, y]
     */
    Function("latLngToPixel") { coordinate: Map<String, Any>?, zoom: Int ->
      val latLng = LatLngParser.parseLatLng(coordinate)
      if (latLng != null) {
        val result = GeometryUtils.latLngToPixel(latLng, zoom)
        if (result != null && result.size >= 2) {
          mapOf("x" to result[0], "y" to result[1])
        } else {
          null
        }
      } else {
        null
      }
    }

    /**
     * 像素坐标转经纬度
     * @param pixel 像素坐标 {x, y}
     * @param zoom 缩放级别
     * @return 坐标
     */
    Function("pixelToLatLng") { pixel: Map<String, Any>?, zoom: Int ->
      val x = (pixel?.get("x") as? Number)?.toDouble() ?: 0.0
      val y = (pixel?.get("y") as? Number)?.toDouble() ?: 0.0
      val result = GeometryUtils.pixelToLatLng(x, y, zoom)
      result?.let {
        mapOf("latitude" to it.latitude, "longitude" to it.longitude)
      }
    }

    /**
     * 批量判断点在哪个多边形内
     * @param point 待判断点
     * @param polygons 多边形列表
     * @return 所在多边形的索引，不在任何多边形内返回 -1
     */
    Function("findPointInPolygons") { point: Map<String, Any>?, polygons: List<List<Any>>? ->
      val pt = LatLngParser.parseLatLng(point)
      val polys = polygons?.map { LatLngParser.parseLatLngList(it) }
      if (pt != null && polys != null) {
        GeometryUtils.findPointInPolygons(pt, polys)
      } else {
        -1
      }
    }

    /**
     * 生成网格聚合数据 (常用于展示网格聚合图或大规模点数据处理)
     * @param points 包含经纬度和权重的点数组
     * @param gridSizeMeters 网格大小（米）
     */
    Function("generateHeatmapGrid") { points: List<Map<String, Any>>?, gridSizeMeters: Double ->
      if (points == null || points.isEmpty()) return@Function emptyList<Map<String, Any>>()
      
      val count = points.size
      val latitudes = DoubleArray(count)
      val longitudes = DoubleArray(count)
      val weights = DoubleArray(count)
      
      points.forEachIndexed { index, map ->
        latitudes[index] = (map["latitude"] as? Number)?.toDouble() ?: 0.0
        longitudes[index] = (map["longitude"] as? Number)?.toDouble() ?: 0.0
        weights[index] = (map["weight"] as? Number)?.toDouble() ?: 1.0
      }
      
      val result = GeometryUtils.generateHeatmapGrid(latitudes, longitudes, weights, gridSizeMeters)
      result.map {
        mapOf(
          "latitude" to it.latitude,
          "longitude" to it.longitude,
          "intensity" to it.intensity
        )
      }
    }

    // ==================== 定位配置 ====================

    /**
     * 设置是否返回逆地理信息
     * @param isReGeocode 是否返回逆地理信息+
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
      val attempts = 0
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
      val attempts = 0
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
