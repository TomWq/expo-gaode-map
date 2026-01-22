/**
 * 地图预加载管理器 (Android)
 * 在后台预先初始化地图实例，提升首次显示速度
 */

package expo.modules.gaodemap.map

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
    
    // 动态池大小配置（根据内存自适应）
    private const val MAX_POOL_SIZE_HIGH_MEMORY = 3      // 高内存设备：>= 500MB
    private const val MAX_POOL_SIZE_MEDIUM_MEMORY = 2    // 中等内存：300-500MB
    private const val MAX_POOL_SIZE_LOW_MEMORY = 1       // 低内存设备：150-300MB
    private const val MIN_MEMORY_THRESHOLD_MB = 150      // 最低内存要求
    
    // 动态 TTL 配置（根据内存压力自适应）
    private const val TTL_NORMAL = 5 * 60 * 1000L        // 正常：5分钟
    private const val TTL_MEMORY_PRESSURE = 2 * 60 * 1000L  // 内存压力：2分钟
    private const val TTL_LOW_MEMORY = 1 * 60 * 1000L    // 低内存：1分钟
    
    private val preloadedMapViews = ConcurrentLinkedQueue<PreloadedMapInstance>()
    private val isPreloading = AtomicBoolean(false)
    private val preloadScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    // 动态配置
    @Volatile private var currentMaxPoolSize = MAX_POOL_SIZE_MEDIUM_MEMORY
    @Volatile private var currentTTL = TTL_NORMAL
    @Volatile private var memoryPressureLevel = 0  // 0=正常, 1=压力, 2=严重
    
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
     * 清理过期的预加载实例（使用动态 TTL）
     */
    private fun cleanupExpiredInstances() {
        val now = System.currentTimeMillis()
        var expiredCount = 0
        
        val iterator = preloadedMapViews.iterator()
        while (iterator.hasNext()) {
            val instance = iterator.next()
            // 使用动态 TTL
            if (now - instance.timestamp > currentTTL) {
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
            Log.i(TAG, "🧹 清理了 $expiredCount 个过期实例（总计: ${instancesExpired.get()}，当前TTL: ${currentTTL/1000}秒）")
        }
    }
    
    /**
     * 内存警告回调
     */
    @Deprecated("Deprecated in Java")
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
     * 开始预加载地图实例（自适应版本）
     * @param context Android 上下文
     * @param poolSize 预加载的地图实例数量（会根据内存自适应调整）
     */
    fun startPreload(context: Context, poolSize: Int) {
        if (isPreloading.get()) {
            Log.w(TAG, "⚠️ 预加载已在进行中")
            return
        }
        
        // 动态计算最优池大小
        val adaptiveMaxPoolSize = calculateAdaptivePoolSize(context)
        currentMaxPoolSize = adaptiveMaxPoolSize
        
        // 动态调整 TTL
        currentTTL = calculateAdaptiveTTL(context)
        
        // 检查内存是否充足
        if (!hasEnoughMemory(context)) {
            Log.w(TAG, "⚠️ 内存不足，跳过预加载")
            return
        }
        
        isPreloading.set(true)
        val targetSize = minOf(poolSize, adaptiveMaxPoolSize)
        Log.i(TAG, "🚀 开始预加载 $targetSize 个地图实例 (自适应池大小: $adaptiveMaxPoolSize, TTL: ${currentTTL/1000}秒)")
        
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
     * 计算自适应池大小
     * 根据可用内存动态调整池大小
     */
    private fun calculateAdaptivePoolSize(context: Context): Int {
        val availableMB = getAvailableMemoryMB(context)
        
        return when {
            availableMB >= 500 -> {
                Log.i(TAG, "📊 高内存设备 (${availableMB}MB)，池大小: $MAX_POOL_SIZE_HIGH_MEMORY")
                MAX_POOL_SIZE_HIGH_MEMORY
            }
            availableMB >= 300 -> {
                Log.i(TAG, "📊 中等内存设备 (${availableMB}MB)，池大小: $MAX_POOL_SIZE_MEDIUM_MEMORY")
                MAX_POOL_SIZE_MEDIUM_MEMORY
            }
            availableMB >= 150 -> {
                Log.i(TAG, "📊 低内存设备 (${availableMB}MB)，池大小: $MAX_POOL_SIZE_LOW_MEMORY")
                MAX_POOL_SIZE_LOW_MEMORY
            }
            else -> {
                Log.w(TAG, "⚠️ 内存极低 (${availableMB}MB)，禁用预加载")
                0
            }
        }
    }
    
    /**
     * 计算自适应 TTL
     * 根据内存压力动态调整过期时间
     */
    private fun calculateAdaptiveTTL(context: Context): Long {
        val availableMB = getAvailableMemoryMB(context)
        val totalMB = getTotalMemoryMB(context)
        val usagePercent = ((totalMB - availableMB).toFloat() / totalMB * 100).toInt()
        
        return when {
            usagePercent < 60 -> {
                memoryPressureLevel = 0
                Log.i(TAG, "📊 内存充足 (使用率: $usagePercent%)，TTL: ${TTL_NORMAL/1000}秒")
                TTL_NORMAL
            }
            usagePercent < 80 -> {
                memoryPressureLevel = 1
                Log.i(TAG, "📊 内存压力 (使用率: $usagePercent%)，TTL: ${TTL_MEMORY_PRESSURE/1000}秒")
                TTL_MEMORY_PRESSURE
            }
            else -> {
                memoryPressureLevel = 2
                Log.w(TAG, "⚠️ 内存严重不足 (使用率: $usagePercent%)，TTL: ${TTL_LOW_MEMORY/1000}秒")
                TTL_LOW_MEMORY
            }
        }
    }
    
    /**
     * 获取可用内存（MB）
     */
    private fun getAvailableMemoryMB(context: Context): Long {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager?.getMemoryInfo(memoryInfo)
        return memoryInfo.availMem / (1024 * 1024)
    }
    
    /**
     * 获取总内存（MB）
     */
    private fun getTotalMemoryMB(context: Context): Long {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager?.getMemoryInfo(memoryInfo)
        return memoryInfo.totalMem / (1024 * 1024)
    }
    
    /**
     * 检查是否有足够的内存
     */
    private fun hasEnoughMemory(context: Context): Boolean {
        val availableMB = getAvailableMemoryMB(context)
        return availableMB > MIN_MEMORY_THRESHOLD_MB
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
     * 获取一个预加载的地图实例（使用动态 TTL）
     * @return 预加载的地图视图，如果池为空则返回 null
     */
    fun getPreloadedMapView(): MapView? {
        val now = System.currentTimeMillis()
        
        // 检查并移除过期实例（使用动态 TTL）
        while (true) {
            val instance = preloadedMapViews.peek() ?: break
            
            if (now - instance.timestamp > currentTTL) {
                preloadedMapViews.poll()
                try {
                    instance.mapView.onDestroy()
                    instancesExpired.incrementAndGet()
                    Log.i(TAG, "🗑️ 预加载实例已过期（TTL: ${currentTTL/1000}秒），已删除")
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
            
            // 触发自动补充（延迟执行，避免影响当前页面渲染）
            triggerRefill()
            
            return instance.mapView
        } else {
            Log.w(TAG, "⚠️ 预加载池为空，返回 null")
            // 尝试触发补充，以便下次使用
            triggerRefill()
            return null
        }
    }

    /**
     * 触发自动补充机制
     */
    private fun triggerRefill() {
        if (isPreloading.get()) return

        // 延迟 5 秒后尝试补充，避免抢占当前 UI 资源
        preloadScope.launch {
            delay(5000)
            if (!isPreloading.get() && preloadedMapViews.size < currentMaxPoolSize) {
                appContext?.let { context ->
                    Log.i(TAG, "🔄 触发自动补充预加载池")
                    withContext(Dispatchers.Main) {
                        startPreload(context, currentMaxPoolSize)
                    }
                }
            }
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
     * 获取预加载状态（包含动态配置信息）
     * @return 预加载状态信息
     */
    fun getStatus(): Map<String, Any> {
        return mapOf(
            "poolSize" to preloadedMapViews.size,
            "isPreloading" to isPreloading.get(),
            "maxPoolSize" to currentMaxPoolSize,
            "currentTTL" to currentTTL,
            "memoryPressureLevel" to memoryPressureLevel,
            "isAdaptive" to true
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
     * 获取性能统计信息（包含内存信息）
     */
    fun getPerformanceMetrics(): Map<String, Any> {
        val total = totalPreloads.get()
        val successful = successfulPreloads.get()
        val avgDuration = if (successful > 0) totalDuration.get() / successful else 0
        val successRate = if (total > 0) (successful.toFloat() / total * 100) else 0f
        
        val availableMB = appContext?.let { getAvailableMemoryMB(it) } ?: 0
        val totalMB = appContext?.let { getTotalMemoryMB(it) } ?: 0
        val usagePercent = if (totalMB > 0) ((totalMB - availableMB).toFloat() / totalMB * 100).toInt() else 0
        
        return mapOf(
            "totalPreloads" to total,
            "successfulPreloads" to successful,
            "failedPreloads" to failedPreloads.get(),
            "averageDuration" to avgDuration,
            "instancesUsed" to instancesUsed.get(),
            "instancesExpired" to instancesExpired.get(),
            "successRate" to successRate,
            "currentMaxPoolSize" to currentMaxPoolSize,
            "currentTTL" to currentTTL,
            "memoryPressureLevel" to memoryPressureLevel,
            "availableMemoryMB" to availableMB,
            "totalMemoryMB" to totalMB,
            "memoryUsagePercent" to usagePercent
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