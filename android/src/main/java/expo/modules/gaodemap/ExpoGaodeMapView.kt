package expo.modules.gaodemap

import android.annotation.SuppressLint
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

    /**
     * 拦截 React Native 的 ViewManager 操作
     * 重写 requestLayout 防止在移除视图时触发布局异常
     */
    override fun requestLayout() {
        try {
            super.requestLayout()
        } catch (e: Exception) {
            Log.e(TAG, "requestLayout 异常被捕获", e)
        }
    }

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
    private val onLocation by EventDispatcher()

    // 高德地图视图
    private lateinit var mapView: MapView
    private lateinit var aMap: AMap

    // 管理器
    private lateinit var cameraManager: CameraManager
    private lateinit var uiManager: UIManager

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
            uiManager = UIManager(aMap, context).apply {
                // 设置定位变化回调
                onLocationChanged = { latitude, longitude, accuracy ->
                    this@ExpoGaodeMapView.onLocation(mapOf(
                        "latitude" to latitude,
                        "longitude" to longitude,
                        "accuracy" to accuracy.toDouble(),
                        "timestamp" to System.currentTimeMillis()
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
        // 设置全局 Marker 点击监听器
        aMap.setOnMarkerClickListener { marker ->
            MarkerView.handleMarkerClick(marker)
        }

        // 设置全局 Marker 拖拽监听器
        aMap.setOnMarkerDragListener(object : AMap.OnMarkerDragListener {
            override fun onMarkerDragStart(marker: com.amap.api.maps.model.Marker) {
                MarkerView.handleMarkerDragStart(marker)
            }

            override fun onMarkerDrag(marker: com.amap.api.maps.model.Marker) {
                MarkerView.handleMarkerDrag(marker)
            }

            override fun onMarkerDragEnd(marker: com.amap.api.maps.model.Marker) {
                MarkerView.handleMarkerDragEnd(marker)
            }
        })

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

            // 触发地图点击事件
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
    fun setShowsUserLocation(show: Boolean) {
        mainHandler.post {
            uiManager.setShowsUserLocation(show, followUserLocation)
        }
    }

    /**
     * 设置是否跟随用户位置
     * @param follow 是否跟随
     */
    fun setFollowUserLocation(follow: Boolean) {
        followUserLocation = follow
        // 如果定位已开启，立即应用新设置
        mainHandler.post {
            if (aMap.isMyLocationEnabled) {
                uiManager.setShowsUserLocation(true, follow)
            }
        }
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
     *
     * 新策略：MarkerView 也加入实际视图层级，但移到屏幕外不可见
     */
    @SuppressLint("UseKtx")
    override fun addView(child: View?, index: Int) {
        if (child is MarkerView) {
            child.setMap(aMap)
            // MarkerView 也加入实际视图层级，但设置为 0x0 大小并移到屏幕外
            // 不使用 View.GONE，避免在新架构下出现渲染问题
            val params = LayoutParams(0, 0)
            child.layoutParams = params
            child.translationX = -10000f  // 移到屏幕外
            child.translationY = -10000f
            super.addView(child, index)
            Log.d(TAG, "添加 MarkerView at index=$index (移到屏幕外)")
            return
        }

        if (child is com.amap.api.maps.MapView) {
            super.addView(child, index)
            return
        }

        super.addView(child, index)

        child?.let {
            when (it) {
                is PolylineView -> it.setMap(aMap)
                is PolygonView -> it.setMap(aMap)
                is CircleView -> it.setMap(aMap)
                is HeatMapView -> it.setMap(aMap)
                is MultiPointView -> it.setMap(aMap)
                is ClusterView -> it.setMap(aMap)
            }
        }
    }

    /**
     * 移除子视图
     */
    override fun removeView(child: View?) {
        if (child is MarkerView) {
            Log.d(TAG, "准备移除 MarkerView: marker存在=${child.marker != null}")
            child.removeMarker()
            super.removeView(child)
            Log.d(TAG, "✅ 已移除 MarkerView")
            return
        }

        try {
            super.removeView(child)
        } catch (e: Exception) {
            Log.e(TAG, "removeView 异常", e)
        }
    }

    /**
     * 按索引移除视图
     */
    override fun removeViewAt(index: Int) {
        try {
            val child = super.getChildAt(index)

            if (child is com.amap.api.maps.MapView) {
                Log.e(TAG, "⚠️ 阻止移除 MapView (index=$index)")
                return
            }

            if (child is MarkerView) {
                Log.d(TAG, "准备移除 MarkerView at index=$index")
                child.removeMarker()
            }

            super.removeViewAt(index)

        } catch (e: Exception) {
            Log.e(TAG, "移除视图异常: index=$index", e)
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
