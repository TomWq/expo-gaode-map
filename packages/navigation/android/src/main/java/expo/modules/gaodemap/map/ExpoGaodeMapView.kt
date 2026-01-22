package expo.modules.gaodemap.map

import android.annotation.SuppressLint
import android.content.Context
import android.view.View
import android.view.ViewGroup
import com.amap.api.maps.AMap
import com.amap.api.maps.MapView
import com.amap.api.maps.MapsInitializer
import com.amap.api.maps.model.LatLng
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import expo.modules.gaodemap.map.managers.CameraManager
import expo.modules.gaodemap.map.managers.UIManager
import expo.modules.gaodemap.map.overlays.*
import androidx.core.graphics.createBitmap
import androidx.core.view.isVisible
import androidx.core.graphics.withTranslation

/**
 * 高德地图视图组件
 *
 * 负责:
 * - 地图视图的创建和管理
 * - 地图事件的派发
 * - 相机控制和覆盖物管理
 * - 生命周期管理
 */

@SuppressLint("ViewConstructor")
class ExpoGaodeMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

    /**
     * 拦截 React Native 的 ViewManager 操作
     * 重写 requestLayout 防止在移除视图时触发布局异常
     */
    override fun requestLayout() {
        try {
            super.requestLayout()
        } catch (_: Exception) {
            // 忽略异常
        }
    }

    // Props 存储
    /** 地图类型 */
    internal var mapType: Int = 0
    /** 初始相机位置 */
    internal var initialCameraPosition: Map<String, Any?>? = null
    /** 是否跟随用户位置 */
    internal var followUserLocation: Boolean = false
    /** 自定义地图样式配置（缓存） */
    private var customMapStyleData: Map<String, Any>? = null

    /** 主线程 Handler */
    private val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())

    // 事件派发器
    private val onMapPress by EventDispatcher()
    private val onMapLongPress by EventDispatcher()
    private val onLoad by EventDispatcher()
    private val onLocation by EventDispatcher()
    private val onCameraMove by EventDispatcher()
    private val onCameraIdle by EventDispatcher()

    // 事件节流控制
    /** 相机移动事件节流间隔(毫秒) */
    private val CAMERA_MOVE_THROTTLE_MS = 100L
    /** 上次触发相机移动事件的时间戳 */
    private var lastCameraMoveTime = 0L
    /** 缓存的相机移动事件数据 */
    private var pendingCameraMoveData: Map<String, Any>? = null
    /** 节流定时器 Runnable */
    private val throttleRunnable = Runnable {
        pendingCameraMoveData?.let { data ->
            onCameraMove(data)
            pendingCameraMoveData = null
        }
    }

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

            // 尝试从预加载池获取 MapView
            val preloadedMapView = MapPreloadManager.getPreloadedMapView()
            
            if (preloadedMapView != null) {
                mapView = preloadedMapView
                android.util.Log.i("ExpoGaodeMapView", "🚀 使用预加载的 MapView 实例")
            } else {
                // 创建地图视图
                mapView = MapView(context)
                mapView.onCreate(null)
                android.util.Log.i("ExpoGaodeMapView", "⚠️ 创建新的 MapView 实例 (未命中预加载池)")
            }
            
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

                // 应用缓存的自定义地图样式
                customMapStyleData?.let { styleData ->
                    uiManager.setCustomMapStyle(styleData)
                }

                onLoad(mapOf("loaded" to true))
            }
        } catch (_: Exception) {
            // 初始化失败，静默处理
        }
    }

    // 辅助监听器列表
    private val cameraChangeListeners = mutableListOf<AMap.OnCameraChangeListener>()

    fun addCameraChangeListener(listener: AMap.OnCameraChangeListener) {
        if (!cameraChangeListeners.contains(listener)) {
            cameraChangeListeners.add(listener)
        }
    }

    fun removeCameraChangeListener(listener: AMap.OnCameraChangeListener) {
        cameraChangeListeners.remove(listener)
    }

    /**
     * 设置地图事件监听
     */
    private fun setupMapListeners() {
        // 设置相机移动监听器
        aMap.setOnCameraChangeListener(object : AMap.OnCameraChangeListener {
            override fun onCameraChange(cameraPosition: com.amap.api.maps.model.CameraPosition?) {
                // 通知辅助监听器
                cameraChangeListeners.forEach { it.onCameraChange(cameraPosition) }

                // 相机移动中 - 应用节流优化
                cameraPosition?.let {
                    val currentTime = System.currentTimeMillis()
                    val visibleRegion = aMap.projection.visibleRegion
                    val eventData = mapOf(
                        "cameraPosition" to mapOf(
                            "target" to mapOf(
                                "latitude" to it.target.latitude,
                                "longitude" to it.target.longitude
                            ),
                            "zoom" to it.zoom,
                            "tilt" to it.tilt,
                            "bearing" to it.bearing
                        ),
                        "latLngBounds" to mapOf(
                            "northeast" to mapOf(
                                "latitude" to visibleRegion.farRight.latitude,
                                "longitude" to visibleRegion.farRight.longitude
                            ),
                            "southwest" to mapOf(
                                "latitude" to visibleRegion.nearLeft.latitude,
                                "longitude" to visibleRegion.nearLeft.longitude
                            )
                        )
                    )
                    
                    // 节流逻辑：100ms 内只触发一次
                    if (currentTime - lastCameraMoveTime >= CAMERA_MOVE_THROTTLE_MS) {
                        // 超过节流时间，立即触发事件
                        lastCameraMoveTime = currentTime
                        onCameraMove(eventData)
                        // 清除待处理的事件和定时器
                        mainHandler.removeCallbacks(throttleRunnable)
                        pendingCameraMoveData = null
                    } else {
                        // 在节流时间内，缓存事件数据，使用定时器延迟触发
                        pendingCameraMoveData = eventData
                        mainHandler.removeCallbacks(throttleRunnable)
                        mainHandler.postDelayed(
                            throttleRunnable,
                            CAMERA_MOVE_THROTTLE_MS - (currentTime - lastCameraMoveTime)
                        )
                    }
                }
            }

            override fun onCameraChangeFinish(cameraPosition: com.amap.api.maps.model.CameraPosition?) {
                // 通知辅助监听器
                cameraChangeListeners.forEach { it.onCameraChangeFinish(cameraPosition) }

                // 相机移动完成
                cameraPosition?.let {
                    val visibleRegion = aMap.projection.visibleRegion
                    onCameraIdle(mapOf(
                        "cameraPosition" to mapOf(
                            "target" to mapOf(
                                "latitude" to it.target.latitude,
                                "longitude" to it.target.longitude
                            ),
                            "zoom" to it.zoom,
                            "tilt" to it.tilt,
                            "bearing" to it.bearing
                        ),
                        "latLngBounds" to mapOf(
                            "northeast" to mapOf(
                                "latitude" to visibleRegion.farRight.latitude,
                                "longitude" to visibleRegion.farRight.longitude
                            ),
                            "southwest" to mapOf(
                                "latitude" to visibleRegion.nearLeft.latitude,
                                "longitude" to visibleRegion.nearLeft.longitude
                            )
                        )
                    ))
                }
            }
        })
        
        // 设置全局 Marker 点击监听器
        aMap.setOnMarkerClickListener { marker ->
            if (MarkerView.handleMarkerClick(marker)) {
                return@setOnMarkerClickListener true
            }
            if (ClusterView.handleMarkerClick(marker)) {
                return@setOnMarkerClickListener true
            }
            false
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

        // 设置全局 MultiPoint 点击监听器
        aMap.setOnMultiPointClickListener { item ->
            for (i in 0 until childCount) {
                val child = getChildAt(i)
                if (child is MultiPointView) {
                    if (child.handleMultiPointClick(item)) {
                        return@setOnMultiPointClickListener true
                    }
                }
            }
            return@setOnMultiPointClickListener false
        }

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
    
    /**
     * 设置自定义地图样式
     * @param styleData 样式配置
     */
    fun setCustomMapStyle(styleData: Map<String, Any>) {
        customMapStyleData = styleData
        // 如果地图已加载，立即应用样式
        if (isMapLoaded) {
            uiManager.setCustomMapStyle(styleData)
        }
    }

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

    /**
     * 截取地图快照
     * @param promise Promise
     */
    fun takeSnapshot(promise: expo.modules.kotlin.Promise) {
        val isSettled = java.util.concurrent.atomic.AtomicBoolean(false)
        
        aMap.getMapScreenShot(object : AMap.OnMapScreenShotListener {
            override fun onMapScreenShot(bitmap: android.graphics.Bitmap?) {
                // 如果已经处理过，直接返回
                if (isSettled.getAndSet(true)) return
                
                // 旧版本回调，为了兼容性也处理
                bitmap?.let { handleSnapshot(it, promise) } ?: run {
                     promise.reject("SNAPSHOT_FAILED", "Bitmap is null", null)
                }
            }

            override fun onMapScreenShot(bitmap: android.graphics.Bitmap?, status: Int) {
                // 如果已经处理过，直接返回
                if (isSettled.getAndSet(true)) return

                // status != 0 表示失败
                if (status != 0) {
                    promise.reject("SNAPSHOT_FAILED", "Failed to take snapshot, status code: $status", null)
                    return
                }
                bitmap?.let { handleSnapshot(it, promise) } ?: run {
                    promise.reject("SNAPSHOT_FAILED", "Bitmap is null", null)
                }
            }
        })
    }

    @SuppressLint("WrongThread")
    private fun handleSnapshot(mapBitmap: android.graphics.Bitmap, promise: expo.modules.kotlin.Promise) {
        try {
            // 创建最终的 Bitmap，大小为当前容器的大小
            val width = this.width
            val height = this.height
            
            // 如果容器宽高为0，无法截图
            if (width <= 0 || height <= 0) {
                promise.reject("SNAPSHOT_FAILED", "View dimensions are invalid", null)
                return
            }

            val finalBitmap = createBitmap(width, height)
            val canvas = android.graphics.Canvas(finalBitmap)

            // 1. 绘制地图底图
            canvas.drawBitmap(mapBitmap, mapView.left.toFloat(), mapView.top.toFloat(), null)

            // 2. 绘制内部子视图 (React Native Overlays, e.g. Callout)
            for (i in 0 until childCount) {
                val child = getChildAt(i)
                val isMarkerView = child is MarkerView
                
                // 跳过地图本身、隐藏的视图以及 MarkerView
                if (child !== mapView && child.isVisible && !isMarkerView) {
                    canvas.withTranslation(child.left.toFloat(), child.top.toFloat()) {
                        child.draw(this)
                    }
                }
            }

            // 3. 绘制兄弟视图 (MapUI, 覆盖在地图上的 UI 组件)
            // 模仿 iOS 的实现：遍历父容器的子视图，绘制那些覆盖在地图上方的兄弟节点
            (parent as? ViewGroup)?.let { parentGroup ->
                for (i in 0 until parentGroup.childCount) {
                    val sibling = parentGroup.getChildAt(i)
                    // 跳过自己（地图本身）和隐藏的视图
                    if (sibling !== this && sibling.isVisible) {
                        // 计算相对坐标：兄弟视图相对于父容器的坐标 - 地图相对于父容器的坐标
                        val dx = sibling.left - this.left
                        val dy = sibling.top - this.top
                        
                        canvas.withTranslation(dx.toFloat(), dy.toFloat()) {
                            sibling.draw(this)
                        }
                    }
                }
            }

            // 3. 保存到文件
            val filename = java.util.UUID.randomUUID().toString() + ".png"
            val file = java.io.File(context.cacheDir, filename)
            val stream = java.io.FileOutputStream(file)
            finalBitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
            stream.close()

            // 4. 返回文件路径
            promise.resolve(file.absolutePath)

        } catch (e: Exception) {
            promise.reject("SNAPSHOT_ERROR", "Error processing snapshot: ${e.message}", e)
        }
    }

    // ==================== 生命周期管理 ====================

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
               try {
                   // 清理节流定时器
                   mainHandler.removeCallbacks(throttleRunnable)
                   pendingCameraMoveData = null
                   
                   // 清理 Handler 回调,防止内存泄露
                   mainHandler.removeCallbacksAndMessages(null)

            // 清理所有地图监听器
            aMap.setOnMapClickListener(null)
            aMap.setOnMapLongClickListener(null)
            aMap.setOnMapLoadedListener(null)
            aMap.setOnCameraChangeListener(null)
            aMap.setOnMarkerClickListener(null)
            aMap.setOnMarkerDragListener(null)
            aMap.setOnMultiPointClickListener(null)

            // 清除所有覆盖物
            aMap.clear()

            // 销毁地图实例
            mapView.onDestroy()
        } catch (e: Exception) {
            // 静默处理异常,确保销毁流程不会中断
            android.util.Log.e("ExpoGaodeMapView", "Error destroying map", e)
        }

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
            return
        }

        if (child is MapView) {
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
     * 延迟移除 Marker，让它们跟随地图一起延迟销毁
     */
    override fun removeView(child: View?) {
        if (child is MarkerView) {
            // 延迟移除 Marker，与地图的延迟销毁时间一致（500ms）
            mainHandler.postDelayed({
                child.removeMarker()
            }, 500)
            super.removeView(child)
            return
        }

        try {
            super.removeView(child)
        } catch (_: Exception) {
            // 忽略异常
        }
    }

    /**
     * 按索引移除视图
     * 延迟移除 Marker，让它们跟随地图一起延迟销毁
     */
    override fun removeViewAt(index: Int) {
        try {
            val child = super.getChildAt(index)

            if (child is MapView) {
                return
            }

            if (child is MarkerView) {
                // 延迟移除 Marker，与地图的延迟销毁时间一致（500ms）
                mainHandler.postDelayed({
                    child.removeMarker()
                }, 500)
            }

            super.removeViewAt(index)

        } catch (_: Exception) {
            // 忽略异常
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
