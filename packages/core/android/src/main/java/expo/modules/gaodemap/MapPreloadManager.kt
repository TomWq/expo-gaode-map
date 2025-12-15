/**
 * 地图预加载管理器 (Android)
 * 在后台预先初始化地图实例，提升首次显示速度
 */

package expo.modules.gaodemap

import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.res.Configuration
import android.util.Log
import com.amap.api.maps.AMap
import com.amap.api.maps.CameraUpdateFactory
import com.amap.api.maps.MapView
import com.amap.api.maps.model.CameraPosition
import com.amap.api.maps.model.LatLng
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ConcurrentLinkedQueue
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger

/**
 * 地图预加载实例数据
 */
data class PreloadedMapInstance(
    val mapView: MapView,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * 地图预加载管理器单例
 */
object MapPreloadManager : ComponentCallbacks2 {
    private const val TAG = "MapPreloadManager"
    private const val MAX_POOL_SIZE = 3
    private const val INSTANCE_TTL = 5 * 60 * 1000L // 5分钟过期
    
    private val preloadedMapViews = ConcurrentLinkedQueue<PreloadedMapInstance>()
    private val isPreloading = AtomicBoolean(false)
    private val preloadScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    // 性能统计
    private val totalPreloads = AtomicInteger(0)
    private val successfulPreloads = AtomicInteger(0)
    private val failedPreloads = AtomicInteger(0)
    private val instancesUsed = AtomicInteger(0)
    private val instancesExpired = AtomicInteger(0)
    private val totalDuration = AtomicInteger(0)
    
    private var appContext: Context? = null
    private var cleanupJob: Job? = null
    
    init {
        Log.d(TAG, "🔧 初始化预加载管理器")
    }
    
    /**
     * 初始化管理器（注册内存监听）
     */
    fun initialize(context: Context) {
        appContext = context.applicationContext
        appContext?.registerComponentCallbacks(this)
        
        // 启动定期清理任务
        startPeriodicCleanup()
        
        Log.d(TAG, "✅ 预加载管理器已初始化，已注册内存监听")
    }
    
    /**
     * 启动定期清理过期实例的任务
     */
    private fun startPeriodicCleanup() {
        cleanupJob?.cancel()
        cleanupJob = preloadScope.launch {
            while (isActive) {
                delay(60_000) // 每分钟检查一次
                cleanupExpiredInstances()
            }
        }
    }
    
    /**
     * 清理过期的预加载实例
     */
    private fun cleanupExpiredInstances() {
        val now = System.currentTimeMillis()
        var expiredCount = 0
        
        val iterator = preloadedMapViews.iterator()
        while (iterator.hasNext()) {
            val instance = iterator.next()
            if (now - instance.timestamp > INSTANCE_TTL) {
                try {
                    instance.mapView.onDestroy()
                    iterator.remove()
                    expiredCount++
                } catch (e: Exception) {
                    Log.e(TAG, "清理过期实例失败: ${e.message}", e)
                }
            }
        }
        
        if (expiredCount > 0) {
            instancesExpired.addAndGet(expiredCount)
            Log.i(TAG, "🧹 清理了 $expiredCount 个过期实例（总计: ${instancesExpired.get()}）")
        }
    }
    
    /**
     * 内存警告回调
     */
    override fun onLowMemory() {
        Log.w(TAG, "⚠️ 收到低内存警告，清理预加载池")
        clearPool()
    }
    
    /**
     * 内存trim回调
     */
    override fun onTrimMemory(level: Int) {
        when (level) {
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL,
            ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> {
                Log.w(TAG, "⚠️ 内存严重不足 (level: $level)，清理预加载池")
                clearPool()
            }
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW,
            ComponentCallbacks2.TRIM_MEMORY_MODERATE -> {
                Log.w(TAG, "⚠️ 内存不足 (level: $level)，清理部分实例")
                // 只清理一半
                val halfSize = preloadedMapViews.size / 2
                repeat(halfSize) {
                    preloadedMapViews.poll()?.mapView?.onDestroy()
                }
            }
        }
    }
    
    override fun onConfigurationChanged(newConfig: Configuration) {
        // 不需要处理
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
        
        // 检查内存是否充足
        if (!hasEnoughMemory(context)) {
            Log.w(TAG, "⚠️ 内存不足，跳过预加载")
            return
        }
        
        isPreloading.set(true)
        val targetSize = minOf(poolSize, MAX_POOL_SIZE)
        Log.i(TAG, "🚀 开始预加载 $targetSize 个地图实例")
        
        val startTime = System.currentTimeMillis()
        totalPreloads.incrementAndGet()
        
        preloadScope.launch {
            var successCount = 0
            
            repeat(targetSize) { index ->
                try {
                    val mapView = createPreloadedMapView(context)
                    
                    withContext(Dispatchers.Main) {
                        val instance = PreloadedMapInstance(mapView)
                        preloadedMapViews.offer(instance)
                        successCount++
                        Log.i(TAG, "✅ 预加载实例 ${index + 1}/$targetSize 完成")
                        
                        if (index == targetSize - 1) {
                            val duration = (System.currentTimeMillis() - startTime).toInt()
                            isPreloading.set(false)
                            
                            if (successCount > 0) {
                                successfulPreloads.incrementAndGet()
                                totalDuration.addAndGet(duration)
                            } else {
                                failedPreloads.incrementAndGet()
                            }
                            
                            Log.i(TAG, "🎉 所有实例预加载完成（耗时: ${duration}ms）")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "❌ 预加载实例 ${index + 1} 失败: ${e.message}", e)
                    if (index == targetSize - 1) {
                        isPreloading.set(false)
                        if (successCount == 0) {
                            failedPreloads.incrementAndGet()
                        }
                    }
                }
            }
        }
    }
    
    /**
     * 检查是否有足够的内存
     */
    private fun hasEnoughMemory(context: Context): Boolean {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager?.getMemoryInfo(memoryInfo)
        
        // 如果可用内存低于 100MB，不进行预加载
        val availableMB = memoryInfo.availMem / (1024 * 1024)
        return availableMB > 100
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
        val now = System.currentTimeMillis()
        
        // 检查并移除过期实例
        while (true) {
            val instance = preloadedMapViews.peek() ?: break
            
            if (now - instance.timestamp > INSTANCE_TTL) {
                preloadedMapViews.poll()
                try {
                    instance.mapView.onDestroy()
                    instancesExpired.incrementAndGet()
                    Log.i(TAG, "🗑️ 预加载实例已过期，已删除")
                } catch (e: Exception) {
                    Log.e(TAG, "清理过期实例失败: ${e.message}", e)
                }
            } else {
                break
            }
        }
        
        val instance = preloadedMapViews.poll()
        
        if (instance != null) {
            instancesUsed.incrementAndGet()
            Log.i(TAG, "📤 使用预加载实例，剩余: ${preloadedMapViews.size}，总使用: ${instancesUsed.get()}")
            
            // 如果池快空了，记录日志
            if (preloadedMapViews.isEmpty() && !isPreloading.get()) {
                Log.w(TAG, "⚠️ 预加载池为空")
            }
            
            return instance.mapView
        } else {
            Log.w(TAG, "⚠️ 预加载池为空，返回 null")
            return null
        }
    }
    
    /**
     * 清空预加载池
     */
    fun clearPool() {
        val count = preloadedMapViews.size
        preloadedMapViews.forEach { instance ->
            try {
                instance.mapView.onDestroy()
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
     * 获取性能统计信息
     */
    fun getPerformanceMetrics(): Map<String, Any> {
        val total = totalPreloads.get()
        val successful = successfulPreloads.get()
        val avgDuration = if (successful > 0) totalDuration.get() / successful else 0
        val successRate = if (total > 0) (successful.toFloat() / total * 100) else 0f
        
        return mapOf(
            "totalPreloads" to total,
            "successfulPreloads" to successful,
            "failedPreloads" to failedPreloads.get(),
            "averageDuration" to avgDuration,
            "instancesUsed" to instancesUsed.get(),
            "instancesExpired" to instancesExpired.get(),
            "successRate" to successRate
        )
    }
    
    /**
     * 清理资源
     */
    fun cleanup() {
        clearPool()
        cleanupJob?.cancel()
        preloadScope.cancel()
        appContext?.unregisterComponentCallbacks(this)
        Log.i(TAG, "🧹 预加载管理器已清理")
    }
}