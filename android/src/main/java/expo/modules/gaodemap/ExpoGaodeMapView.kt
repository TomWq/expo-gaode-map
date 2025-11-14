package expo.modules.gaodemap

import android.content.Context
import android.util.Log
import android.view.View
import com.amap.api.maps.AMap
import com.amap.api.maps.MapView
import com.amap.api.maps.MapsInitializer
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.gaodemap.managers.CameraManager
import expo.modules.gaodemap.managers.UIManager
import expo.modules.gaodemap.managers.OverlayManager
import expo.modules.gaodemap.overlays.*

@Suppress("ViewConstructor")
class ExpoGaodeMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  companion object {
    private const val TAG = "ExpoGaodeMapView"
  }
  
  // Props 存储
  internal var mapType: Int = 0
  internal var initialCameraPosition: Map<String, Any?>? = null
  internal var followUserLocation: Boolean = false
  
  // Handler for posting to main thread
  private val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())
  
  // 事件派发器
  private val onPress by EventDispatcher()
  private val onLongPress by EventDispatcher()
  private val onLoad by EventDispatcher()
  
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
    Log.d(TAG, "ExpoGaodeMapView 初始化开始")
    
    try {
      // 确保隐私合规已设置
      MapsInitializer.updatePrivacyShow(context, true, true)
      MapsInitializer.updatePrivacyAgree(context, true)
      Log.d(TAG, "地图隐私合规已确认")
      
      // 创建地图视图
      mapView = MapView(context)
      mapView.onCreate(null)
      aMap = mapView.map
      Log.d(TAG, "MapView 创建成功")
      
      // 初始化管理器
      cameraManager = CameraManager(aMap)
      uiManager = UIManager(aMap, context)
      overlayManager = OverlayManager(aMap)
      Log.d(TAG, "管理器初始化完成")
      
      // 添加地图视图到布局
      addView(mapView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
      Log.d(TAG, "MapView 已添加到布局")
      
      // 设置地图事件监听
      setupMapListeners()
      Log.d(TAG, "地图事件监听已设置")
      
      // 地图加载完成回调
      aMap.setOnMapLoadedListener {
        Log.d(TAG, "🎉 地图加载完成")
        isMapLoaded = true
        
        // 应用缓存的 Props
        if (mapType != 0) {
          Log.d(TAG, "应用 mapType: $mapType")
          setMapType(mapType)
        }
        
        val positionToApply = initialCameraPosition ?: pendingCameraPosition
        positionToApply?.let { position ->
          Log.d(TAG, "应用初始相机位置")
          applyInitialCameraPosition(position)
          pendingCameraPosition = null
        }
        
        onLoad(mapOf("loaded" to true))
      }
      
      Log.d(TAG, "ExpoGaodeMapView 初始化完成")
    } catch (e: Exception) {
      Log.e(TAG, "ExpoGaodeMapView 初始化失败", e)
    }
  }
  
  /**
   * 设置地图事件监听
   */
  private fun setupMapListeners() {
    aMap.setOnMapClickListener { latLng ->
      onPress(mapOf(
        "latitude" to latLng.latitude,
        "longitude" to latLng.longitude
      ))
    }
    
    aMap.setOnMapLongClickListener { latLng ->
      onLongPress(mapOf(
        "latitude" to latLng.latitude,
        "longitude" to latLng.longitude
      ))
    }
  }
  
  // ==================== 地图类型和相机 ====================
  
  /**
   * 设置地图类型
   */
  fun setMapType(type: Int) {
    Log.d(TAG, "🎯 setMapType: $type")
    mainHandler.post {
      uiManager.setMapType(type)
      Log.d(TAG, "✅ setMapType 完成")
    }
  }
  
  /**
   * 设置初始相机位置
   */
  fun setInitialCameraPosition(position: Map<String, Any?>) {
    Log.d(TAG, "🎯 setInitialCameraPosition")
    mainHandler.post {
      applyInitialCameraPosition(position)
    }
  }
  
  /**
   * 实际应用相机位置
   */
  private fun applyInitialCameraPosition(position: Map<String, Any?>) {
    cameraManager.setInitialCameraPosition(position)
    Log.d(TAG, "相机位置设置完成")
  }
  
  // ==================== UI 控件和手势 ====================
  
  fun setShowsZoomControls(show: Boolean) = uiManager.setShowsZoomControls(show)
  fun setShowsCompass(show: Boolean) = uiManager.setShowsCompass(show)
  fun setShowsScale(show: Boolean) = uiManager.setShowsScale(show)
  
  fun setZoomEnabled(enabled: Boolean) = uiManager.setZoomEnabled(enabled)
  fun setScrollEnabled(enabled: Boolean) = uiManager.setScrollEnabled(enabled)
  fun setRotateEnabled(enabled: Boolean) = uiManager.setRotateEnabled(enabled)
  fun setTiltEnabled(enabled: Boolean) = uiManager.setTiltEnabled(enabled)
  
  fun setMaxZoom(maxZoom: Float) = cameraManager.setMaxZoomLevel(maxZoom)
  fun setMinZoom(minZoom: Float) = cameraManager.setMinZoomLevel(minZoom)
  
  fun setShowsUserLocation(show: Boolean) = uiManager.setShowsUserLocation(show, followUserLocation)
  
  fun setFollowUserLocation(follow: Boolean) {
    followUserLocation = follow
    // 如果定位已开启，立即应用新设置
    uiManager.setShowsUserLocation(true, follow)
  }
  
  fun setUserLocationRepresentation(representation: Map<String, Any>) {
    uiManager.setUserLocationRepresentation(representation)
  }
  
  fun setShowsTraffic(show: Boolean) = uiManager.setShowsTraffic(show)
  fun setShowsBuildings(show: Boolean) = uiManager.setShowsBuildings(show)
  fun setShowsIndoorMap(show: Boolean) = uiManager.setShowsIndoorMap(show)
  
  // ==================== 相机控制方法 ====================
  
  fun moveCamera(position: Map<String, Any>, duration: Int) {
    cameraManager.moveCamera(position, duration)
  }
  
  fun getLatLng(point: Map<String, Double>): Map<String, Double> {
    return cameraManager.getLatLng(point)
  }
  
  fun setCenter(center: Map<String, Double>, animated: Boolean) {
    cameraManager.setCenter(center, animated)
  }
  
  fun setZoomLevel(zoom: Float, animated: Boolean) {
    cameraManager.setZoomLevel(zoom, animated)
  }
  
  fun getCameraPosition(): Map<String, Any> {
    return cameraManager.getCameraPosition()
  }
  
  // ==================== 覆盖物管理 ====================
  
  fun addCircle(id: String, props: Map<String, Any>) {
    Log.d(TAG, "🔵 addCircle: id=$id")
    mainHandler.post {
      overlayManager.addCircle(id, props)
    }
  }
  
  fun removeCircle(id: String) {
    Log.d(TAG, "🔴 removeCircle: id=$id")
    mainHandler.post {
      overlayManager.removeCircle(id)
    }
  }
  
  fun updateCircle(id: String, props: Map<String, Any>) {
    Log.d(TAG, "🔄 updateCircle: id=$id")
    mainHandler.post {
      overlayManager.updateCircle(id, props)
    }
  }
  
  fun addMarker(id: String, props: Map<String, Any>) {
    Log.d(TAG, "📍 addMarker: id=$id")
    mainHandler.post {
      overlayManager.addMarker(id, props)
    }
  }
  
  fun removeMarker(id: String) {
    Log.d(TAG, "🗑️ removeMarker: id=$id")
    mainHandler.post {
      overlayManager.removeMarker(id)
    }
  }
  
  fun updateMarker(id: String, props: Map<String, Any>) {
    Log.d(TAG, "🔄 updateMarker: id=$id")
    mainHandler.post {
      overlayManager.updateMarker(id, props)
    }
  }
  
  fun addPolyline(id: String, props: Map<String, Any>) {
    Log.d(TAG, "📏 addPolyline: id=$id")
    mainHandler.post {
      overlayManager.addPolyline(id, props)
    }
  }
  
  fun removePolyline(id: String) {
    Log.d(TAG, "🗑️ removePolyline: id=$id")
    mainHandler.post {
      overlayManager.removePolyline(id)
    }
  }
  
  fun updatePolyline(id: String, props: Map<String, Any>) {
    Log.d(TAG, "🔄 updatePolyline: id=$id")
    mainHandler.post {
      overlayManager.updatePolyline(id, props)
    }
  }
  
  fun addPolygon(id: String, props: Map<String, Any>) {
    Log.d(TAG, "🔷 addPolygon: id=$id")
    mainHandler.post {
      overlayManager.addPolygon(id, props)
    }
  }
  
  fun removePolygon(id: String) {
    Log.d(TAG, "🗑️ removePolygon: id=$id")
    mainHandler.post {
      overlayManager.removePolygon(id)
    }
  }
  
  fun updatePolygon(id: String, props: Map<String, Any>) {
    Log.d(TAG, "🔄 updatePolygon: id=$id")
    mainHandler.post {
      overlayManager.updatePolygon(id, props)
    }
  }
  
  // ==================== 生命周期方法 ====================
  
  @Suppress("unused")
  fun onResume() {
    mapView.onResume()
  }
  
  @Suppress("unused")
  fun onPause() {
    mapView.onPause()
  }
  
  @Suppress("unused")
  fun onDestroy() {
    overlayManager.clear()
    mapView.onDestroy()
  }
  
  @Suppress("unused")
  fun onSaveInstanceState(outState: android.os.Bundle) {
    mapView.onSaveInstanceState(outState)
  }
  
  /**
   * 添加子视图时自动连接到地图
   */
  override fun addView(child: View?, index: Int) {
    Log.d(TAG, "addView - child: ${child?.javaClass?.simpleName}")
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
        else -> Log.d(TAG, "未识别的子视图类型: ${it.javaClass.name}")
      }
    }
  }
  
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (changed) {
      Log.d(TAG, "onLayout - bounds: ($left,$top,$right,$bottom)")
    }
  }
}
