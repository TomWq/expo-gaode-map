package expo.modules.gaodemap

import android.content.Context
import android.util.Log
import android.view.View
import com.amap.api.maps.AMap
import com.amap.api.maps.MapView
import com.amap.api.maps.MapsInitializer
import com.amap.api.maps.model.LatLng
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.gaodemap.managers.CameraManager
import expo.modules.gaodemap.managers.UIManager
import expo.modules.gaodemap.managers.OverlayManager
import expo.modules.gaodemap.overlays.*

/**
 * 高德地图视图组件
 * 
 * 负责:
 * - 地图视图的创建和管理
 * - 地图事件的派发
 * - 相机控制和覆盖物管理
 * - 生命周期管理
 */
@Suppress("ViewConstructor")
class ExpoGaodeMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  companion object {
    private const val TAG = "ExpoGaodeMapView"
  }
  
  // Props 存储
  /** 地图类型 */
  internal var mapType: Int = 0
  /** 初始相机位置 */
  internal var initialCameraPosition: Map<String, Any?>? = null
  /** 是否跟随用户位置 */
  internal var followUserLocation: Boolean = false
  
  /** 主线程 Handler */
  private val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())
  
  // 事件派发器
  private val onMapPress by EventDispatcher()
  private val onMapLongPress by EventDispatcher()
  private val onLoad by EventDispatcher()
  private val onMarkerPress by EventDispatcher()
  private val onMarkerDragStart by EventDispatcher()
  private val onMarkerDrag by EventDispatcher()
  private val onMarkerDragEnd by EventDispatcher()
  private val onCirclePress by EventDispatcher()
  private val onPolygonPress by EventDispatcher()
  private val onPolylinePress by EventDispatcher()
  
  // 高德地图视图
  private lateinit var mapView: MapView
  private lateinit var aMap: AMap
  
  // 管理器
  private lateinit var cameraManager: CameraManager
  private lateinit var uiManager: UIManager
  private lateinit var overlayManager: OverlayManager
  
  // 缓存初始相机位置，等待地图加载完成后设置
  private var pendingCameraPosition: Map<String, Any?>? = null
  private var isMapLoaded = false
  
  init {
    try {
      // 确保隐私合规已设置
      MapsInitializer.updatePrivacyShow(context, true, true)
      MapsInitializer.updatePrivacyAgree(context, true)
      
      // 创建地图视图
      mapView = MapView(context)
      mapView.onCreate(null)
      aMap = mapView.map
      
      // 初始化管理器
      cameraManager = CameraManager(aMap)
      uiManager = UIManager(aMap, context)
      overlayManager = OverlayManager(aMap, context).apply {
        onMarkerPress = { id, lat, lng ->
          this@ExpoGaodeMapView.onMarkerPress(mapOf(
            "markerId" to id,
            "latitude" to lat,
            "longitude" to lng
          ))
        }
        onMarkerDragStart = { id, lat, lng ->
          this@ExpoGaodeMapView.onMarkerDragStart(mapOf(
            "markerId" to id,
            "latitude" to lat,
            "longitude" to lng
          ))
        }
        onMarkerDrag = { id, lat, lng ->
          this@ExpoGaodeMapView.onMarkerDrag(mapOf(
            "markerId" to id,
            "latitude" to lat,
            "longitude" to lng
          ))
        }
        onMarkerDragEnd = { id, lat, lng ->
          this@ExpoGaodeMapView.onMarkerDragEnd(mapOf(
            "markerId" to id,
            "latitude" to lat,
            "longitude" to lng
          ))
        }
        onCirclePress = { id, lat, lng ->
          this@ExpoGaodeMapView.onCirclePress(mapOf(
            "circleId" to id,
            "latitude" to lat,
            "longitude" to lng
          ))
        }
        onPolygonPress = { id, lat, lng ->
          this@ExpoGaodeMapView.onPolygonPress(mapOf(
            "polygonId" to id,
            "latitude" to lat,
            "longitude" to lng
          ))
        }
        onPolylinePress = { id, lat, lng ->
          this@ExpoGaodeMapView.onPolylinePress(mapOf(
            "polylineId" to id,
            "latitude" to lat,
            "longitude" to lng
          ))
        }
      }
      
      // 添加地图视图到布局
      addView(mapView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
      
      // 设置地图事件监听
      setupMapListeners()
      
      // 地图加载完成回调
      aMap.setOnMapLoadedListener {
        isMapLoaded = true
        
        // 应用缓存的 Props
        if (mapType != 0) {
          setMapType(mapType)
        }
        
        val positionToApply = initialCameraPosition ?: pendingCameraPosition
        positionToApply?.let { position ->
          applyInitialCameraPosition(position)
          pendingCameraPosition = null
        }
        
        onLoad(mapOf("loaded" to true))
      }
    } catch (e: Exception) {
      Log.e(TAG, "ExpoGaodeMapView 初始化失败", e)
    }
  }
  
  /**
   * 设置地图事件监听
   */
  private fun setupMapListeners() {
    aMap.setOnMapClickListener { latLng ->
      // 检查声明式 PolylineView
      if (checkDeclarativePolylinePress(latLng)) {
        return@setOnMapClickListener
      }
      
      // 检查声明式 PolygonView
      if (checkDeclarativePolygonPress(latLng)) {
        return@setOnMapClickListener
      }
      
      // 检查声明式 CircleView
      if (checkDeclarativeCirclePress(latLng)) {
        return@setOnMapClickListener
      }
      
      // 检查命令式圆形
      val circleId = overlayManager.checkCirclePress(latLng)
      if (circleId != null) {
        overlayManager.onCirclePress?.invoke(circleId, latLng.latitude, latLng.longitude)
        return@setOnMapClickListener
      }
      
      // 检查命令式多边形
      val polygonId = overlayManager.checkPolygonPress(latLng)
      if (polygonId != null) {
        overlayManager.onPolygonPress?.invoke(polygonId, latLng.latitude, latLng.longitude)
        return@setOnMapClickListener
      }
      
      // 检查命令式折线
      val polylineId = overlayManager.checkPolylinePress(latLng)
      if (polylineId != null) {
        overlayManager.onPolylinePress?.invoke(polylineId, latLng.latitude, latLng.longitude)
        return@setOnMapClickListener
      }
      
      // 如果都没点击,触发地图点击事件
      onMapPress(mapOf(
        "latitude" to latLng.latitude,
        "longitude" to latLng.longitude
      ))
    }
    
    aMap.setOnMapLongClickListener { latLng ->
      onMapLongPress(mapOf(
        "latitude" to latLng.latitude,
        "longitude" to latLng.longitude
      ))
    }
  }
  
  // ==================== 地图类型和相机 ====================
  
  /**
   * 设置地图类型
   * @param type 地图类型
   */
  fun setMapType(type: Int) {
    mainHandler.post {
      uiManager.setMapType(type)
    }
  }
  
  /**
   * 设置初始相机位置
   * @param position 相机位置配置
   */
  fun setInitialCameraPosition(position: Map<String, Any?>) {
    initialCameraPosition = position
    
    // 如果地图已加载,立即应用;否则缓存等待地图加载完成
    if (isMapLoaded) {
      mainHandler.post {
        applyInitialCameraPosition(position)
      }
    } else {
      pendingCameraPosition = position
    }
  }
  
  /**
   * 实际应用相机位置
   * @param position 相机位置配置
   */
  private fun applyInitialCameraPosition(position: Map<String, Any?>) {
    cameraManager.setInitialCameraPosition(position)
  }
  
  // ==================== UI 控件和手势 ====================
  
  /** 设置是否显示缩放控件 */
  fun setShowsZoomControls(show: Boolean) = uiManager.setShowsZoomControls(show)
  /** 设置是否显示指南针 */
  fun setShowsCompass(show: Boolean) = uiManager.setShowsCompass(show)
  /** 设置是否显示比例尺 */
  fun setShowsScale(show: Boolean) = uiManager.setShowsScale(show)
  
  /** 设置是否启用缩放手势 */
  fun setZoomEnabled(enabled: Boolean) = uiManager.setZoomEnabled(enabled)
  /** 设置是否启用滚动手势 */
  fun setScrollEnabled(enabled: Boolean) = uiManager.setScrollEnabled(enabled)
  /** 设置是否启用旋转手势 */
  fun setRotateEnabled(enabled: Boolean) = uiManager.setRotateEnabled(enabled)
  /** 设置是否启用倾斜手势 */
  fun setTiltEnabled(enabled: Boolean) = uiManager.setTiltEnabled(enabled)
  
  /** 设置最大缩放级别 */
  fun setMaxZoom(maxZoom: Float) = cameraManager.setMaxZoomLevel(maxZoom)
  /** 设置最小缩放级别 */
  fun setMinZoom(minZoom: Float) = cameraManager.setMinZoomLevel(minZoom)
  
  /** 设置是否显示用户位置 */
  fun setShowsUserLocation(show: Boolean) = uiManager.setShowsUserLocation(show, followUserLocation)
  
  /**
   * 设置是否跟随用户位置
   * @param follow 是否跟随
   */
  fun setFollowUserLocation(follow: Boolean) {
    followUserLocation = follow
    // 如果定位已开启，立即应用新设置
    uiManager.setShowsUserLocation(true, follow)
  }
  
  /**
   * 设置用户位置样式
   * @param representation 样式配置
   */
  fun setUserLocationRepresentation(representation: Map<String, Any>) {
    uiManager.setUserLocationRepresentation(representation)
  }
  
  /** 设置是否显示交通路况 */
  fun setShowsTraffic(show: Boolean) = uiManager.setShowsTraffic(show)
  /** 设置是否显示建筑物 */
  fun setShowsBuildings(show: Boolean) = uiManager.setShowsBuildings(show)
  /** 设置是否显示室内地图 */
  fun setShowsIndoorMap(show: Boolean) = uiManager.setShowsIndoorMap(show)
  
  // ==================== 相机控制方法 ====================
  
  /**
   * 移动相机
   * @param position 目标位置
   * @param duration 动画时长(毫秒)
   */
  fun moveCamera(position: Map<String, Any>, duration: Int) {
    cameraManager.moveCamera(position, duration)
  }
  
  /**
   * 获取屏幕坐标对应的地理坐标
   * @param point 屏幕坐标
   * @return 地理坐标
   */
  fun getLatLng(point: Map<String, Double>): Map<String, Double> {
    return cameraManager.getLatLng(point)
  }
  
  /**
   * 设置地图中心点
   * @param center 中心点坐标
   * @param animated 是否动画
   */
  fun setCenter(center: Map<String, Double>, animated: Boolean) {
    cameraManager.setCenter(center, animated)
  }
  
  /**
   * 设置地图缩放级别
   * @param zoom 缩放级别
   * @param animated 是否动画
   */
  fun setZoomLevel(zoom: Float, animated: Boolean) {
    cameraManager.setZoomLevel(zoom, animated)
  }
  
  /**
   * 获取当前相机位置
   * @return 相机位置信息
   */
  fun getCameraPosition(): Map<String, Any> {
    return cameraManager.getCameraPosition()
  }
  
  // ==================== 覆盖物管理 ====================
  
  /** 添加圆形覆盖物 */
  fun addCircle(id: String, props: Map<String, Any>) {
    mainHandler.post {
      overlayManager.addCircle(id, props)
    }
  }
  
  /** 移除圆形覆盖物 */
  fun removeCircle(id: String) {
    mainHandler.post {
      overlayManager.removeCircle(id)
    }
  }
  
  /** 更新圆形覆盖物 */
  fun updateCircle(id: String, props: Map<String, Any>) {
    mainHandler.post {
      overlayManager.updateCircle(id, props)
    }
  }
  
  /** 添加标记点 */
  fun addMarker(id: String, props: Map<String, Any>) {
    mainHandler.post {
      overlayManager.addMarker(id, props)
    }
  }
  
  /** 移除标记点 */
  fun removeMarker(id: String) {
    mainHandler.post {
      overlayManager.removeMarker(id)
    }
  }
  
  /** 更新标记点 */
  fun updateMarker(id: String, props: Map<String, Any>) {
    mainHandler.post {
      overlayManager.updateMarker(id, props)
    }
  }
  
  /** 添加折线 */
  fun addPolyline(id: String, props: Map<String, Any>) {
    mainHandler.post {
      overlayManager.addPolyline(id, props)
    }
  }
  
  /** 移除折线 */
  fun removePolyline(id: String) {
    mainHandler.post {
      overlayManager.removePolyline(id)
    }
  }
  
  /** 更新折线 */
  fun updatePolyline(id: String, props: Map<String, Any>) {
    mainHandler.post {
      overlayManager.updatePolyline(id, props)
    }
  }
  
  /** 添加多边形 */
  fun addPolygon(id: String, props: Map<String, Any>) {
    mainHandler.post {
      overlayManager.addPolygon(id, props)
    }
  }
  
  /** 移除多边形 */
  fun removePolygon(id: String) {
    mainHandler.post {
      overlayManager.removePolygon(id)
    }
  }
  
  /** 更新多边形 */
  fun updatePolygon(id: String, props: Map<String, Any>) {
    mainHandler.post {
      overlayManager.updatePolygon(id, props)
    }
  }
  
  // ==================== 生命周期方法 ====================
  
  /** 恢复地图 */
  @Suppress("unused")
  fun onResume() {
    mapView.onResume()
  }
  
  /** 暂停地图 */
  @Suppress("unused")
  fun onPause() {
    mapView.onPause()
  }
  
  /** 销毁地图 */
  @Suppress("unused")
  fun onDestroy() {
    // 清理 Handler 回调,防止内存泄露
    mainHandler.removeCallbacksAndMessages(null)
    
    // 清理地图监听器
    aMap.setOnMapClickListener(null)
    aMap.setOnMapLongClickListener(null)
    aMap.setOnMapLoadedListener(null)
    
    // 清理覆盖物
    overlayManager.clear()
    
    // 销毁地图
    mapView.onDestroy()
  }
  
  /** 保存实例状态 */
  @Suppress("unused")
  fun onSaveInstanceState(outState: android.os.Bundle) {
    mapView.onSaveInstanceState(outState)
  }
  
  /**
   * 添加子视图时自动连接到地图
   */
  override fun addView(child: View?, index: Int) {
    super.addView(child, index)
    
    // 自动将地图实例传递给覆盖物子视图
    child?.let {
      when (it) {
        is MarkerView -> it.setMap(aMap)
        is PolylineView -> it.setMap(aMap)
        is PolygonView -> it.setMap(aMap)
        is CircleView -> it.setMap(aMap)
        is HeatMapView -> it.setMap(aMap)
        is MultiPointView -> it.setMap(aMap)
        is ClusterView -> it.setMap(aMap)
      }
    }
  }
  
  private fun checkDeclarativePolylinePress(latLng: LatLng): Boolean {
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child is PolylineView) {
        if (child.checkPress(latLng)) {
          return true
        }
      }
    }
    return false
  }
  
  private fun checkDeclarativePolygonPress(latLng: LatLng): Boolean {
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child is PolygonView) {
        if (child.checkPress(latLng)) {
          return true
        }
      }
    }
    return false
  }
  
  private fun checkDeclarativeCirclePress(latLng: LatLng): Boolean {
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      if (child is CircleView) {
        if (child.checkPress(latLng)) {
          return true
        }
      }
    }
    return false
  }
  
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
  }
}
