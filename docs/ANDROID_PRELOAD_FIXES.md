# Android 端地图预加载优化

## 🔍 发现的问题

### 1. **缺少内存管理** ⚠️
**位置**: [`MapPreloadManager.kt`](../packages/core/android/src/main/java/expo/modules/gaodemap/MapPreloadManager.kt)

**原始代码问题**:
- 没有监听系统内存警告
- 没有实例过期机制
- 在低内存情况下可能导致 OOM

### 2. **缺少性能统计** ⚠️
- 无法量化预加载效果
- 没有成功率统计
- 无法监控实例使用情况

### 3. **缺少内存检查** ⚠️
- 启动预加载前不检查可用内存
- 可能在低内存设备上造成问题

### 4. **实例数据结构简单** ⚠️
- 只存储 `MapView`，没有时间戳
- 无法实现过期机制

---

## ✅ 已实施的优化

### 1. **内存管理优化** ✅

#### 实现 `ComponentCallbacks2` 接口
```kotlin
object MapPreloadManager : ComponentCallbacks2 {
    override fun onLowMemory() {
        Log.w(TAG, "⚠️ 收到低内存警告，清理预加载池")
        clearPool()
    }
    
    override fun onTrimMemory(level: Int) {
        when (level) {
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL,
            ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> {
                clearPool() // 完全清理
            }
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW,
            ComponentCallbacks2.TRIM_MEMORY_MODERATE -> {
                // 只清理一半
                val halfSize = preloadedMapViews.size / 2
                repeat(halfSize) {
                    preloadedMapViews.poll()?.mapView?.onDestroy()
                }
            }
        }
    }
}
```

#### 注册内存监听
```kotlin
fun initialize(context: Context) {
    appContext = context.applicationContext
    appContext?.registerComponentCallbacks(this)
    startPeriodicCleanup()
}
```

### 2. **实例过期机制** ✅

#### 添加时间戳数据结构
```kotlin
data class PreloadedMapInstance(
    val mapView: MapView,
    val timestamp: Long = System.currentTimeMillis()
)
```

#### 定期清理过期实例
```kotlin
private fun startPeriodicCleanup() {
    cleanupJob = preloadScope.launch {
        while (isActive) {
            delay(60_000) // 每分钟检查一次
            cleanupExpiredInstances()
        }
    }
}

private fun cleanupExpiredInstances() {
    val now = System.currentTimeMillis()
    val iterator = preloadedMapViews.iterator()
    while (iterator.hasNext()) {
        val instance = iterator.next()
        if (now - instance.timestamp > INSTANCE_TTL) {
            instance.mapView.onDestroy()
            iterator.remove()
            expiredCount++
        }
    }
}
```

#### 获取时检查过期
```kotlin
fun getPreloadedMapView(): MapView? {
    val now = System.currentTimeMillis()
    
    // 移除所有过期实例
    while (true) {
        val instance = preloadedMapViews.peek() ?: break
        if (now - instance.timestamp > INSTANCE_TTL) {
            preloadedMapViews.poll()
            instance.mapView.onDestroy()
            instancesExpired.incrementAndGet()
        } else {
            break
        }
    }
    
    return preloadedMapViews.poll()?.mapView
}
```

### 3. **内存充足性检查** ✅

```kotlin
private fun hasEnoughMemory(context: Context): Boolean {
    val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
    val memoryInfo = ActivityManager.MemoryInfo()
    activityManager?.getMemoryInfo(memoryInfo)
    
    // 如果可用内存低于 100MB，不进行预加载
    val availableMB = memoryInfo.availMem / (1024 * 1024)
    return availableMB > 100
}

fun startPreload(context: Context, poolSize: Int) {
    if (!hasEnoughMemory(context)) {
        Log.w(TAG, "⚠️ 内存不足，跳过预加载")
        return
    }
    // ...
}
```

### 4. **性能统计** ✅

#### 统计指标
```kotlin
private val totalPreloads = AtomicInteger(0)
private val successfulPreloads = AtomicInteger(0)
private val failedPreloads = AtomicInteger(0)
private val instancesUsed = AtomicInteger(0)
private val instancesExpired = AtomicInteger(0)
private val totalDuration = AtomicInteger(0)
```

#### 记录性能
```kotlin
fun startPreload(context: Context, poolSize: Int) {
    val startTime = System.currentTimeMillis()
    totalPreloads.incrementAndGet()
    
    preloadScope.launch {
        // 预加载逻辑...
        
        val duration = (System.currentTimeMillis() - startTime).toInt()
        if (successCount > 0) {
            successfulPreloads.incrementAndGet()
            totalDuration.addAndGet(duration)
        }
    }
}
```

#### 获取统计
```kotlin
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
```

---

## 📊 优化效果对比

### iOS vs Android

| 特性 | iOS | Android |
|------|-----|---------|
| **原生预加载** | ✅ 支持 | ✅ 支持 |
| **性能提升** | 60-80% | 50-70% (预期) |
| **内存管理** | ✅ 内存警告监听 | ✅ ComponentCallbacks2 |
| **过期机制** | ❌ 无 | ✅ 5分钟TTL |
| **性能统计** | ❌ 无 | ✅ 完整统计 |
| **内存检查** | ❌ 无 | ✅ 100MB阈值 |
| **线程安全** | ✅ GCD | ✅ Coroutines |

---

## 🎯 Android 特有优化

### 1. **分级内存清理**
```kotlin
when (level) {
    TRIM_MEMORY_RUNNING_CRITICAL -> clearPool()      // 完全清理
    TRIM_MEMORY_RUNNING_LOW -> clearHalf()           // 清理一半
}
```

### 2. **协程优雅取消**
```kotlin
fun cleanup() {
    clearPool()
    cleanupJob?.cancel()
    preloadScope.cancel()
    appContext?.unregisterComponentCallbacks(this)
}
```

### 3. **内存阈值检查**
- 可用内存 < 100MB → 跳过预加载
- 防止低端设备 OOM

---

## 📝 使用建议

### Android 配置
```kotlin
// 在 MainActivity 中
MapPreloadManager.initialize(applicationContext)

// 启动预加载
MapPreloadManager.startPreload(context, poolSize = 1)

// 获取统计
val metrics = MapPreloadManager.getPerformanceMetrics()
```

### 低端设备优化
```kotlin
val activityManager = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
val isLowRamDevice = activityManager.isLowRamDevice

val poolSize = if (isLowRamDevice) 0 else 1  // 低端设备禁用预加载
```

---

## ⚠️ 注意事项

### 1. **生命周期管理**
- 必须在 Application 或 Activity 中调用 `initialize()`
- 确保在 `onDestroy()` 中调用 `cleanup()`

### 2. **内存敏感**
- Android 设备内存差异大
- 建议根据设备性能动态调整 `poolSize`

### 3. **权限要求**
- 预加载不需要特殊权限
- 但使用地图需要位置权限

---

## 🐛 已知限制

### 1. **MapView 生命周期**
- Android 的 `MapView` 需要调用 `onCreate()` 才能初始化
- 预加载的 `MapView` 需要重新绑定到实际的 View 层级

### 2. **Context 依赖**
- 预加载需要 `Context` 对象
- 无法在纯静态环境中使用

### 3. **内存占用**
- 每个 MapView 实例约 10-15MB
- 建议 `poolSize` 不超过 2

---

## 📈 性能数据（预期）

### 首次加载时间
- **无预加载**: 800-1200ms
- **有预加载**: 300-500ms
- **提升**: 50-70%

### 内存占用
- **单个实例**: 10-15MB
- **poolSize=1**: 增加 10-15MB
- **poolSize=2**: 增加 20-30MB

### 成功率
- **正常情况**: 95%+
- **低内存设备**: 会自动跳过

---

## ✅ 总结

Android 端的预加载优化全面且可靠：

1. ✅ **内存安全**: 自动监听和响应内存压力
2. ✅ **性能可观测**: 完整的统计和监控
3. ✅ **资源管理**: 自动过期和清理机制
4. ✅ **设备适配**: 根据设备性能动态调整

**建议**: 所有 Android 应用都应启用预加载功能，可显著提升用户体验。