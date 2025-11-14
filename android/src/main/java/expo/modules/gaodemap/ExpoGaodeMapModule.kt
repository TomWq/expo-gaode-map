package expo.modules.gaodemap

import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.gaodemap.modules.SDKInitializer
import expo.modules.gaodemap.modules.LocationManager
import expo.modules.gaodemap.overlays.*

class ExpoGaodeMapModule : Module() {
  companion object {
    private const val TAG = "ExpoGaodeMapModule"
  }
  
  private var locationManager: LocationManager? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoGaodeMap")
    
    Log.d(TAG, "ExpoGaodeMapModule 正在定义")

    // ==================== SDK 初始化 ====================
    
    /**
     * 初始化 SDK（地图 + 定位）
     */
    Function("initSDK") { config: Map<String, String> ->
      Log.d(TAG, "initSDK 被调用")
      val androidKey = config["androidKey"]
      if (androidKey != null) {
        SDKInitializer.initSDK(appContext.reactContext!!, androidKey)
        getLocationManager() // 初始化定位管理器
      }
    }

    /**
     * 获取 SDK 版本
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
     * 是否正在定位
     */
    AsyncFunction("isStarted") { promise: expo.modules.kotlin.Promise ->
      promise.resolve(getLocationManager().isStarted())
    }

    /**
     * 获取当前位置（单次定位）
     */
    AsyncFunction("getCurrentLocation") { promise: expo.modules.kotlin.Promise ->
      getLocationManager().getCurrentLocation(promise)
    }

    /**
     * 坐标转换
     */
    AsyncFunction("coordinateConvert") { coordinate: Map<String, Double>, type: Int, promise: expo.modules.kotlin.Promise ->
      getLocationManager().coordinateConvert(coordinate, type, promise)
    }

    // ==================== 定位配置 ====================

    /**
     * 设置是否返回逆地理信息
     */
    Function("setLocatingWithReGeocode") { isReGeocode: Boolean ->
      getLocationManager().setLocatingWithReGeocode(isReGeocode)
    }

    /**
     * 设置定位模式
     */
    Function("setLocationMode") { mode: Int ->
      getLocationManager().setLocationMode(mode)
    }

    /**
     * 设置定位间隔
     */
    Function("setInterval") { interval: Int ->
      getLocationManager().setInterval(interval)
    }

    /**
     * 设置是否单次定位
     */
    Function("setOnceLocation") { isOnceLocation: Boolean ->
      getLocationManager().setOnceLocation(isOnceLocation)
    }

    /**
     * 设置是否使用设备传感器
     */
    Function("setSensorEnable") { sensorEnable: Boolean ->
      getLocationManager().setSensorEnable(sensorEnable)
    }

    /**
     * 设置是否允许 WIFI 扫描
     */
    Function("setWifiScan") { wifiScan: Boolean ->
      getLocationManager().setWifiScan(wifiScan)
    }

    /**
     * 设置是否 GPS 优先
     */
    Function("setGpsFirst") { gpsFirst: Boolean ->
      getLocationManager().setGpsFirst(gpsFirst)
    }

    /**
     * 设置是否等待 WIFI 列表刷新
     */
    Function("setOnceLocationLatest") { onceLocationLatest: Boolean ->
      getLocationManager().setOnceLocationLatest(onceLocationLatest)
    }

    /**
     * 设置逆地理语言
     */
    Function("setGeoLanguage") { language: String ->
      getLocationManager().setGeoLanguage(language)
    }

    /**
     * 设置是否使用缓存策略
     */
    Function("setLocationCacheEnable") { locationCacheEnable: Boolean ->
      getLocationManager().setLocationCacheEnable(locationCacheEnable)
    }

    /**
     * 设置网络请求超时时间
     */
    Function("setHttpTimeOut") { httpTimeOut: Int ->
      getLocationManager().setHttpTimeOut(httpTimeOut)
    }


    // ==================== 事件 ====================

    Events("onLocationUpdate")

    // ==================== 视图定义 ====================

    View(ExpoGaodeMapView::class) {
      Log.d(TAG, "正在注册 ExpoGaodeMapView 视图")
      
      // 事件 - 使用 Expo Modules 的事件命名约定
      Events("onPress", "onLongPress", "onLoad")

      // 地图类型 - 使用泛型语法
      Prop<Int>("mapType") { view, type ->
        Log.d(TAG, "✅ Prop mapType 被调用: $type")
        view.mapType = type
        view.setMapType(type)
      }

      // 初始相机位置 - 使用泛型语法
      Prop<Map<String, Any?>?>("initialCameraPosition") { view, position ->
        Log.d(TAG, "✅ Prop initialCameraPosition 被调用: $position")
        view.initialCameraPosition = position
        position?.let { view.setInitialCameraPosition(it) }
      }

      // 控件显示
      Prop<Boolean>("zoomControlsEnabled") { view, show -> view.setShowsZoomControls(show) }
      Prop<Boolean>("compassEnabled") { view, show -> view.setShowsCompass(show) }
      Prop<Boolean>("scaleControlsEnabled") { view, show -> view.setShowsScale(show) }

      // 手势控制
      Prop<Boolean>("zoomGesturesEnabled") { view, enabled -> view.setZoomEnabled(enabled) }
      Prop<Boolean>("scrollGesturesEnabled") { view, enabled -> view.setScrollEnabled(enabled) }
      Prop<Boolean>("rotateGesturesEnabled") { view, enabled -> view.setRotateEnabled(enabled) }
      Prop<Boolean>("tiltGesturesEnabled") { view, enabled -> view.setTiltEnabled(enabled) }
      
      // 缩放级别限制
      Prop<Float>("maxZoom") { view, maxZoom -> view.setMaxZoom(maxZoom) }
      Prop<Float>("minZoom") { view, minZoom -> view.setMinZoom(minZoom) }

      // 地图图层
      Prop<Boolean>("myLocationEnabled") { view, show -> view.setShowsUserLocation(show) }
      Prop<Boolean>("followUserLocation") { view, follow -> view.setFollowUserLocation(follow) }
      Prop<Map<String, Any>?>("userLocationRepresentation") { view, representation ->
        representation?.let { view.setUserLocationRepresentation(it) }
      }
      Prop<Boolean>("trafficEnabled") { view, show -> view.setShowsTraffic(show) }
      Prop<Boolean>("buildingsEnabled") { view, show -> view.setShowsBuildings(show) }
      Prop<Boolean>("indoorViewEnabled") { view, show -> view.setShowsIndoorMap(show) }

      // 生命周期方法 - 在这里手动应用 Props
      OnViewDidUpdateProps { view: ExpoGaodeMapView ->
        Log.d(TAG, "🎯 OnViewDidUpdateProps 被调用")
        Log.d(TAG, "当前 mapType: ${view.mapType}")
        Log.d(TAG, "当前 initialCameraPosition: ${view.initialCameraPosition}")
        
        // 手动应用 Props
        if (view.mapType != 0) {
          Log.d(TAG, "应用 mapType: ${view.mapType}")
          view.setMapType(view.mapType)
        }
        
        view.initialCameraPosition?.let { position ->
          Log.d(TAG, "应用 initialCameraPosition: $position")
          view.setInitialCameraPosition(position)
        }
      }

      AsyncFunction("moveCamera") { view: ExpoGaodeMapView, position: Map<String, Any>, duration: Int ->
        view.moveCamera(position, duration)
      }

      AsyncFunction("getLatLng") { view: ExpoGaodeMapView, point: Map<String, Double> ->
        view.getLatLng(point)
      }

      AsyncFunction("setCenter") { view: ExpoGaodeMapView, center: Map<String, Double>, animated: Boolean ->
        view.setCenter(center, animated)
      }

      AsyncFunction("setZoom") { view: ExpoGaodeMapView, zoom: Double, animated: Boolean ->
        view.setZoomLevel(zoom.toFloat(), animated)
      }

      AsyncFunction("getCameraPosition") { view: ExpoGaodeMapView ->
        view.getCameraPosition()
      }
      
      AsyncFunction("addCircle") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.addCircle(id, props)
      }
      
      AsyncFunction("removeCircle") { view: ExpoGaodeMapView, id: String ->
        view.removeCircle(id)
      }
      
      AsyncFunction("updateCircle") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.updateCircle(id, props)
      }
      
      AsyncFunction("addMarker") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.addMarker(id, props)
      }
      
      AsyncFunction("removeMarker") { view: ExpoGaodeMapView, id: String ->
        view.removeMarker(id)
      }
      
      AsyncFunction("updateMarker") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.updateMarker(id, props)
      }
      
      // Polyline 命令
      AsyncFunction("addPolyline") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.addPolyline(id, props)
      }
      
      AsyncFunction("removePolyline") { view: ExpoGaodeMapView, id: String ->
        view.removePolyline(id)
      }
      
      AsyncFunction("updatePolyline") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        view.updatePolyline(id, props)
      }
      
      // Polygon 命令
      AsyncFunction("addPolygon") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        Log.d(TAG, "🔷 Module addPolygon 被调用: id=$id, props=$props")
        view.addPolygon(id, props)
      }
      
      AsyncFunction("removePolygon") { view: ExpoGaodeMapView, id: String ->
        Log.d(TAG, "🗑️ Module removePolygon 被调用: id=$id")
        view.removePolygon(id)
      }
      
      AsyncFunction("updatePolygon") { view: ExpoGaodeMapView, id: String, props: Map<String, Any> ->
        Log.d(TAG, "🔄 Module updatePolygon 被调用: id=$id, props=$props")
        view.updatePolygon(id, props)
      }
    }

    // ==================== 覆盖物视图注册 ====================
    
    // Marker - 标记点
    View(MarkerView::class) {
      Events("onPress", "onDragStart", "onDrag", "onDragEnd")
      
      Prop<Map<String, Double>>("position") { view: MarkerView, position ->
        view.setPosition(position)
      }
      
      Prop<String>("title") { view: MarkerView, title ->
        view.setTitle(title)
      }
      
      Prop<String>("description") { view: MarkerView, description ->
        view.setDescription(description)
      }
      
      Prop<Boolean>("draggable") { view: MarkerView, draggable ->
        view.setDraggable(draggable)
      }
    }
    
    // Circle - 圆形
    View(CircleView::class) {
      Events("onPress")
      
      Prop<Map<String, Double>>("center") { view, center ->
        Log.d(TAG, "✅ Prop center 被调用: $center")
        view.setCenter(center)
      }
      
      Prop<Double>("radius") { view, radius ->
        Log.d(TAG, "✅ Prop radius 被调用: $radius")
        view.setRadius(radius)
      }
      
      Prop<Int>("fillColor") { view, color ->
        Log.d(TAG, "✅ Prop fillColor 被调用: $color")
        view.setFillColor(color)
      }
      
      Prop<Int>("strokeColor") { view, color ->
        Log.d(TAG, "✅ Prop strokeColor 被调用: $color")
        view.setStrokeColor(color)
      }
      
      Prop<Float>("strokeWidth") { view, width ->
        Log.d(TAG, "✅ Prop strokeWidth 被调用: $width")
        view.setStrokeWidth(width)
      }
    }
    
    // Polyline - 折线
    View(PolylineView::class) {
      Events("onPress")
      
      Prop<List<Map<String, Double>>>("points") { view: PolylineView, points ->
        view.setPoints(points)
      }
      
      Prop<Float>("strokeWidth") { view: PolylineView, width ->
        view.setStrokeWidth(width)
      }
      
      Prop<Int>("strokeColor") { view: PolylineView, color ->
        view.setStrokeColor(color)
      }
    }
    
    // Polygon - 多边形
    View(PolygonView::class) {
      Events("onPress")
      
      Prop<List<Map<String, Double>>>("points") { view: PolygonView, points ->
        view.setPoints(points)
      }
      
      Prop<Int>("fillColor") { view: PolygonView, color ->
        view.setFillColor(color)
      }
      
      Prop<Int>("strokeColor") { view: PolygonView, color ->
        view.setStrokeColor(color)
      }
      
      Prop<Float>("strokeWidth") { view: PolygonView, width ->
        view.setStrokeWidth(width)
      }
    }
    
    // MultiPoint - 海量点
    View(MultiPointView::class) {
      Events("onPress")
      
      Prop<List<Map<String, Any>>>("points") { view: MultiPointView, points ->
        view.setPoints(points)
      }
    }
    
    // HeatMap - 热力图
    View(HeatMapView::class) {
      Prop<List<Map<String, Any>>>("data") { view: HeatMapView, data ->
        view.setData(data)
      }
      
      Prop<Int>("radius") { view: HeatMapView, radius ->
        view.setRadius(radius)
      }
      
      Prop<Double>("opacity") { view: HeatMapView, opacity ->
        view.setOpacity(opacity)
      }
    }
    
    // Cluster - 点聚合
    View(ClusterView::class) {
      Events("onPress", "onClusterPress")
      
      Prop<List<Map<String, Any>>>("points") { view: ClusterView, points ->
        view.setPoints(points)
      }
      
      Prop<Int>("radius") { view: ClusterView, radius ->
        view.setRadius(radius)
      }
      
      Prop<Int>("minClusterSize") { view: ClusterView, size ->
        view.setMinClusterSize(size)
      }
    }

    OnDestroy {
      locationManager?.destroy()
      locationManager = null
    }
  }

  /**
   * 获取或创建定位管理器
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
