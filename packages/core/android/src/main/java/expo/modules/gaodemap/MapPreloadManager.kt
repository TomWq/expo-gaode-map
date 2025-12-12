/**
 * 地图预加载管理器 (Android)
 * 在后台预先初始化地图实例，提升首次显示速度
 */

package expo.modules.gaodemap

import android.content.Context
import android.util.Log
import com.amap.api.maps.AMap
import com.amap.api.maps.CameraUpdateFactory
import com.amap.api.maps.MapView
import com.amap.api.maps.model.CameraPosition
import com.amap.api.maps.model.LatLng
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicBoolean

/**
 * 地图预加载管理器单例
 */
object MapPreloadManager {
    private const val TAG = "MapPreloadManager"
    private const val MAX_POOL_SIZE = 3
    
    private val preloadedMapViews = ConcurrentLinkedQueue<MapView>()
    private val isPreloading = AtomicBoolean(false)
    private val preloadScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    init {
        Log.d(TAG, "🔧 初始化预加载管理器")
    }
    
    /**
     * 开始预加载地图实例
     * @param context Android 上下文
     * @param poolSize 预加载的地图实例数量
     */
    fun startPreload(context: Context, poolSize: Int) {
        if (isPreloading.get()) {
            Log.w(TAG, "⚠️ 预加载已在进行中")
            return
        }
        
        isPreloading.set(true)
        val targetSize = minOf(poolSize, MAX_POOL_SIZE)
        Log.i(TAG, "🚀 开始预加载 $targetSize 个地图实例")
        
        preloadScope.launch {
            repeat(targetSize) { index ->
                try {
                    val mapView = createPreloadedMapView(context)
                    
                    withContext(Dispatchers.Main) {
                        preloadedMapViews.offer(mapView)
                        Log.i(TAG, "✅ 预加载实例 ${index + 1}/$targetSize 完成")
                        
                        if (index == targetSize - 1) {
                            isPreloading.set(false)
                            Log.i(TAG, "🎉 所有实例预加载完成")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "❌ 预加载实例 ${index + 1} 失败: ${e.message}", e)
                    if (index == targetSize - 1) {
                        isPreloading.set(false)
                    }
                }
            }
        }
    }
    
    /**
     * 创建预加载的地图视图
     * @param context Android 上下文
     * @return 预加载的地图视图实例
     */
    private suspend fun createPreloadedMapView(context: Context): MapView {
        return withContext(Dispatchers.Main) {
            val mapView = MapView(context)
            val aMap = mapView.map
            
            // 基础配置
            aMap.mapType = AMap.MAP_TYPE_NORMAL
            aMap.isMyLocationEnabled = false
            aMap.uiSettings.isCompassEnabled = false
            aMap.uiSettings.isScaleControlsEnabled = false
            aMap.uiSettings.isZoomControlsEnabled = false
            aMap.uiSettings.isRotateGesturesEnabled = true
            aMap.uiSettings.isScrollGesturesEnabled = true
            aMap.uiSettings.isZoomGesturesEnabled = true
            
            // 预加载中心区域（北京天安门）
            val cameraPosition = CameraPosition(
                LatLng(39.9042, 116.4074),
                12f,  // zoom
                0f,   // tilt
                0f    // bearing
            )
            aMap.moveCamera(CameraUpdateFactory.newCameraPosition(cameraPosition))
            
            // 触发地图初始化
            mapView.onCreate(null)
            
            mapView
        }
    }
    
    /**
     * 获取一个预加载的地图实例
     * @return 预加载的地图视图，如果池为空则返回 null
     */
    fun getPreloadedMapView(): MapView? {
        val mapView = preloadedMapViews.poll()
        
        if (mapView != null) {
            Log.i(TAG, "📤 使用预加载实例，剩余: ${preloadedMapViews.size}")
            
            // 如果池快空了，记录日志（不自动补充，因为需要 context）
            if (preloadedMapViews.isEmpty() && !isPreloading.get()) {
                Log.w(TAG, "⚠️ 预加载池为空")
            }
        } else {
            Log.w(TAG, "⚠️ 预加载池为空，返回 null")
        }
        
        return mapView
    }
    
    /**
     * 清空预加载池
     */
    fun clearPool() {
        val count = preloadedMapViews.size
        preloadedMapViews.forEach { mapView ->
            try {
                mapView.onDestroy()
            } catch (e: Exception) {
                Log.e(TAG, "清理地图实例失败: ${e.message}", e)
            }
        }
        preloadedMapViews.clear()
        Log.i(TAG, "🗑️ 预加载池已清空，清理了 $count 个实例")
    }
    
    /**
     * 获取预加载状态
     * @return 预加载状态信息
     */
    fun getStatus(): Map<String, Any> {
        return mapOf(
            "poolSize" to preloadedMapViews.size,
            "isPreloading" to isPreloading.get(),
            "maxPoolSize" to MAX_POOL_SIZE
        )
    }
    
    /**
     * 检查是否有可用的预加载实例
     * @return 是否有可用实例
     */
    fun hasPreloadedMapView(): Boolean {
        return preloadedMapViews.isNotEmpty()
    }
    
    /**
     * 清理资源
     */
    fun cleanup() {
        clearPool()
        preloadScope.cancel()
        Log.i(TAG, "🧹 预加载管理器已清理")
    }
}