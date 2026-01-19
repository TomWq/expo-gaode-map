package expo.modules.gaodemap.overlays

import android.annotation.SuppressLint
import android.content.Context
import android.util.Log
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import java.net.URL


import android.graphics.Paint

import android.graphics.Typeface
import android.os.Handler
import android.os.Looper

import com.amap.api.maps.AMap
import com.amap.api.maps.AMapUtils
import com.amap.api.maps.model.BitmapDescriptor
import com.amap.api.maps.model.BitmapDescriptorFactory
import com.amap.api.maps.model.CameraPosition
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.Marker
import com.amap.api.maps.model.MarkerOptions
import expo.modules.gaodemap.ExpoGaodeMapView
import expo.modules.gaodemap.utils.ClusterNative
import expo.modules.gaodemap.utils.ColorParser
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlinx.coroutines.*
import java.util.concurrent.ConcurrentHashMap


/**
 * 点聚合视图
 * 实现真正的点聚合逻辑，支持自定义样式和点击事件
 */
class ClusterView(context: Context, appContext: AppContext) : ExpoView(context, appContext), AMap.OnCameraChangeListener {
  
  private val onPress by EventDispatcher()
  @Suppress("unused")
  private val onClusterPress by EventDispatcher()
  
  private var aMap: AMap? = null
  
  // 聚合点数据
  data class ClusterItem(
    val latLng: LatLng,
    val data: Map<String, Any>
  )
  
  // 聚合对象
  class Cluster(val center: LatLng) {
    val items = mutableListOf<ClusterItem>()
    
    fun add(item: ClusterItem) {
      items.add(item)
    }
    
    val size: Int get() = items.size
    val position: LatLng get() = center // 简单处理，使用中心点作为聚合点位置，也可以计算平均位置
  }
  
  private var rawPoints: List<Map<String, Any>> = emptyList()
  private var clusterItems: List<ClusterItem> = emptyList()
  private var clusters: List<Cluster> = emptyList()
  
  // 当前显示的 Markers
  private val currentMarkers = mutableListOf<Marker>()
  
  // 配置属性
  private var radius: Int = 60 // dp
  private var minClusterSize: Int = 1
  
  // 样式属性
  private var clusterStyle: Map<String, Any>? = null
  private var clusterBuckets: List<Map<String, Any>>? = null
  private var clusterTextStyle: Map<String, Any>? = null

  private val mainHandler = Handler(Looper.getMainLooper())
  
  // 协程作用域
  private var scope = CoroutineScope(Dispatchers.Main + Job())
  private var calculationJob: Job? = null
  
  // 缓存 BitmapDescriptor
  private val bitmapCache = ConcurrentHashMap<Int, BitmapDescriptor>()
  private var currentIconDescriptor: BitmapDescriptor? = null
  private var customIconBitmap: Bitmap? = null
  private var pendingIconUri: String? = null
  
  // 标记样式是否发生变化，用于强制更新图标
  private var styleChanged = false
  
  /**
   * 设置地图实例
   */
  @Suppress("unused")
  fun setMap(map: AMap) {
    aMap = map
    // 注册相机监听
    // 注意：addView 时会自动调用 setMap，此时 parent 已设置
    (parent as? ExpoGaodeMapView)?.addCameraChangeListener(this)
    
    // 如果有待处理的 icon，加载它
    pendingIconUri?.let { 
        loadAndSetIcon(it)
    }
    
    updateClusters()
  }
  
  /**
   * 设置聚合点数据
   */
  fun setPoints(pointsList: List<Map<String, Any>>) {
    rawPoints = pointsList
    // 预处理数据
    scope.launch(Dispatchers.Default) {
      clusterItems = pointsList.mapNotNull { point: Map<String, Any> ->
        val lat = (point["latitude"] as? Number)?.toDouble()
        val lng = (point["longitude"] as? Number)?.toDouble()
        if (lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          ClusterItem(LatLng(lat, lng), point)
        } else {
          null
        }
      }
      withContext(Dispatchers.Main) {
        updateClusters()
      }
    }
  }
  
  /**
   * 设置聚合半径
   */
  fun setRadius(radiusValue: Int) {
    radius = radiusValue
    updateClusters()
  }
  
  /**
   * 设置最小聚合数量
   */
  fun setMinClusterSize(size: Int) {
    Log.d("ClusterView", "setMinClusterSize: $size")
    minClusterSize = size
    updateClusters()
  }
  
  /**
   * 设置聚合样式
   */
  fun setClusterStyle(style: Map<String, Any>) {
    clusterStyle = style
    bitmapCache.clear() // 样式改变，清除缓存
    styleChanged = true
    updateClusters()
  }
  
  /**
   * 设置聚合文字样式
   */
  fun setClusterTextStyle(style: Map<String, Any>) {
    clusterTextStyle = style
    bitmapCache.clear() // 样式改变，清除缓存
    styleChanged = true
    updateClusters()
  }

  fun setClusterBuckets(buckets: List<Map<String, Any>>) {
    clusterBuckets = buckets
    bitmapCache.clear()
    styleChanged = true
    updateClusters()
  }
   
   /**
    * 设置图标 (保留接口，目前主要使用 clusterStyle)
   */
  @Suppress("UNUSED_PARAMETER")
  fun setIcon(iconUri: String?) {
    pendingIconUri = iconUri
    if (iconUri != null) {
        loadAndSetIcon(iconUri)
    } else {
        currentIconDescriptor = null
        updateClusters()
    }
  }

  private fun loadAndSetIcon(iconUri: String) {
    // 尝试从缓存获取 (这里只缓存 Descriptor，Bitmap 需要重新加载或者另外缓存)
    // 为了简单起见，如果设置了 icon，我们总是重新加载 Bitmap 以便支持绘制文字
    // 实际生产中应该也缓存 Bitmap
    
    scope.launch(Dispatchers.IO) {
        try {
            val bitmap = when {
                iconUri.startsWith("http") -> {
                    val url = URL(iconUri)
                    BitmapFactory.decodeStream(url.openStream())
                }
                iconUri.startsWith("file://") -> {
                    val path = iconUri.substring(7)
                    BitmapFactory.decodeFile(path)
                }
                else -> {
                    // 尝试作为资源名称加载
                    val resId = context.resources.getIdentifier(iconUri, "drawable", context.packageName)
                    if (resId != 0) {
                        BitmapFactory.decodeResource(context.resources, resId)
                    } else {
                        // 尝试作为普通文件路径
                        BitmapFactory.decodeFile(iconUri)
                    }
                }
            }
            
            if (bitmap != null) {
                customIconBitmap = bitmap
                val descriptor = BitmapDescriptorFactory.fromBitmap(bitmap)
                currentIconDescriptor = descriptor
                
                // 清空缓存，因为基础图标变了，所有生成的带数字的图标都需要重新生成
                bitmapCache.clear()
                
                withContext(Dispatchers.Main) {
                    updateClusters()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
  }

  /**
   * 相机移动回调
   */
  override fun onCameraChange(cameraPosition: CameraPosition?) {
    // 移动过程中不实时重新计算，以免性能问题
  }

  override fun onCameraChangeFinish(cameraPosition: CameraPosition?) {
    updateClusters()
  }
  
  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    // 重新创建协程作用域（如果已被取消）
    if (!scope.isActive) {
      scope = CoroutineScope(Dispatchers.Main + Job())
    }
    // 重新注册监听器（防止因 detach 导致监听器丢失）
    (parent as? ExpoGaodeMapView)?.addCameraChangeListener(this)
    updateClusters()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    scope.cancel() // 取消协程
    (parent as? ExpoGaodeMapView)?.removeCameraChangeListener(this)
    currentMarkers.forEach { 
        it.remove()
        unregisterMarker(it)
    }
    currentMarkers.clear()
    bitmapCache.clear()
  }
  
  /**
   * 更新聚合
   * 使用协程在后台计算
   */
  private fun updateClusters() {
    val map = aMap ?: return
    
    // 取消上一次计算
    calculationJob?.cancel()
    
    // 确保 scope 处于活跃状态
    if (!scope.isActive) {
        scope = CoroutineScope(Dispatchers.Main + Job())
    }

    calculationJob = scope.launch(Dispatchers.Default) {
      if (clusterItems.isEmpty()) return@launch
      
      // 获取当前比例尺 (米/像素)
      val scalePerPixel = withContext(Dispatchers.Main) {
        // 增加安全性检查
        if (map.mapType != 0) { // 简单检查 map 是否存活
            map.scalePerPixel
        } else {
            0f
        }
      }

      if (scalePerPixel <= 0) {
          // 比例尺无效，稍后重试
          withContext(Dispatchers.Main) {
              android.util.Log.w("ClusterView", "Invalid scalePerPixel: $scalePerPixel, retrying...")
              mainHandler.postDelayed({ updateClusters() }, 500)
          }
          return@launch
      }
      
      // 计算聚合距离 (米)
      // radius 是 dp，需要转 px，再转米
      val density = context.resources.displayMetrics.density
      val radiusPx = radius * density
      val radiusMeters = radiusPx * scalePerPixel
      
      val newClusters = buildClustersFromNative(radiusMeters.toDouble()) ?: buildClustersFallback(radiusMeters.toDouble())
      
      // 更新 UI
      withContext(Dispatchers.Main) {
        renderClusters(newClusters)
      }
    }
  }

  private fun buildClustersFromNative(radiusMeters: Double): List<Cluster>? {
    return try {
      val latitudes = DoubleArray(clusterItems.size)
      val longitudes = DoubleArray(clusterItems.size)
      for (i in clusterItems.indices) {
        val item = clusterItems[i]
        latitudes[i] = item.latLng.latitude
        longitudes[i] = item.latLng.longitude
      }

      val encoded = ClusterNative.clusterPoints(latitudes, longitudes, radiusMeters)
      if (encoded.isEmpty()) return null

      var cursor = 0
      val clusterCount = encoded[cursor++]
      if (clusterCount <= 0) return emptyList()

      val newClusters = mutableListOf<Cluster>()
      for (c in 0 until clusterCount) {
        if (cursor + 1 >= encoded.size) break
        val centerIndex = encoded[cursor++]
        val size = encoded[cursor++]
        if (centerIndex < 0 || centerIndex >= clusterItems.size) {
          cursor += size
          continue
        }
        val cluster = Cluster(clusterItems[centerIndex].latLng)
        for (k in 0 until size) {
          if (cursor >= encoded.size) break
          val itemIndex = encoded[cursor++]
          if (itemIndex >= 0 && itemIndex < clusterItems.size) {
            cluster.add(clusterItems[itemIndex])
          }
        }
        newClusters.add(cluster)
      }
      newClusters
    } catch (_: Throwable) {
      null
    }
  }

  private fun buildClustersFallback(radiusMeters: Double): List<Cluster> {
    val newClusters = mutableListOf<Cluster>()
    val visited = BooleanArray(clusterItems.size)

    for (i in clusterItems.indices) {
      if (visited[i]) continue

      val item = clusterItems[i]
      val cluster = Cluster(item.latLng)
      cluster.add(item)
      visited[i] = true

      for (j in i + 1 until clusterItems.size) {
        if (visited[j]) continue

        val other = clusterItems[j]
        val distance = AMapUtils.calculateLineDistance(item.latLng, other.latLng).toDouble()

        if (distance < radiusMeters) {
          cluster.add(other)
          visited[j] = true
        }
      }

      newClusters.add(cluster)
    }

    return newClusters
  }

  /**
   * 渲染聚合点
   * 使用 Diff 算法优化渲染，避免全量刷新导致的闪烁
   */
  private fun renderClusters(newClusters: List<Cluster>) {
    Log.d("ClusterView", "renderClusters: count=${newClusters.size}, minClusterSize=$minClusterSize")
    val map = aMap ?: return
    clusters = newClusters

    // 1. 建立新数据的索引 (基于位置 lat_lng)
    // 注意：Double 比较存在精度问题，这里简单处理，实际可使用 GeoHash 或容差比较
    val newClusterMap = newClusters.associateBy { "${it.center.latitude}_${it.center.longitude}" }
    
    // 2. 建立当前 Markers 的索引
    val currentMarkerMap = mutableMapOf<String, Marker>()
    val markersToRemove = mutableListOf<Marker>()
    
    currentMarkers.forEach { marker ->
        val key = "${marker.position.latitude}_${marker.position.longitude}"
        // 如果当前 Marker 的位置在新数据中存在，且尚未被匹配（处理位置重叠的罕见情况）
        if (newClusterMap.containsKey(key) && !currentMarkerMap.containsKey(key)) {
            currentMarkerMap[key] = marker
        } else {
            markersToRemove.add(marker)
        }
    }
    
    // 3. 移除不再存在的 Markers
    markersToRemove.forEach {
        it.remove()
        unregisterMarker(it)
        currentMarkers.remove(it)
    }
    
    // 4. 更新或添加 Markers
    newClusters.forEach { cluster ->
        val key = "${cluster.center.latitude}_${cluster.center.longitude}"
        val existingMarker = currentMarkerMap[key]
        
        if (existingMarker != null) {
            // --- 更新逻辑 ---
            // 检查数据是否变化（例如聚合数量变化导致图标变化）
            val oldCluster = existingMarker.getObject() as? Cluster
            if (oldCluster?.size != cluster.size || styleChanged) {
                // 只有数量变化时才更新图标，减少开销
                if (cluster.size >= minClusterSize) {
                    existingMarker.setIcon(generateIcon(cluster.size))
                    existingMarker.zIndex = 2.0f
                } else {
                    existingMarker.setIcon(currentIconDescriptor ?: BitmapDescriptorFactory.defaultMarker())
                    existingMarker.zIndex = 1.0f
                }
            }
            // 总是更新 title，以防 enableCallout 变化
            existingMarker.title = "${cluster.size}个点"
            
            // 更新关联数据
            existingMarker.setObject(cluster)
        } else {
            // --- 新增逻辑 ---
            val markerOptions = MarkerOptions()
                .position(cluster.center)
            

            

            if (cluster.size >= minClusterSize) {
                markerOptions.icon(generateIcon(cluster.size))
                markerOptions.zIndex(2.0f)
            } else {
                markerOptions.icon(currentIconDescriptor ?: BitmapDescriptorFactory.defaultMarker())
                markerOptions.zIndex(1.0f)
            }
            
            val marker = map.addMarker(markerOptions)
            if (marker != null) {
                currentMarkers.add(marker)
                registerMarker(marker, this)
                marker.setObject(cluster)
            }
        }
    }
    
    // 重置样式变化标记
    styleChanged = false
  }
  
  /**
   * 生成聚合图标
   */
  @SuppressLint("UseKtx")
  private fun generateIcon(count: Int): BitmapDescriptor {
    // 检查缓存
    // 简单的缓存策略：只根据数量缓存。如果样式变化，会清空缓存。
    bitmapCache[count]?.let { return it }
    
    val density = context.resources.displayMetrics.density
    
    // 获取样式配置
    var activeStyle = clusterStyle ?: emptyMap()

    clusterBuckets?.let { buckets ->
        val bestBucket = buckets
            .filter { (it["minPoints"] as? Number)?.toInt() ?: 0 <= count }
            .maxByOrNull { (it["minPoints"] as? Number)?.toInt() ?: 0 }

        if (bestBucket != null) {
             activeStyle = activeStyle + bestBucket
        }
    }

    val bgColorVal = activeStyle["backgroundColor"]
    val borderColorVal = activeStyle["borderColor"]
    val borderWidthVal = (activeStyle["borderWidth"] as? Number)?.toFloat() ?: 2f
    val textSizeVal = (clusterTextStyle?.get("fontSize") as? Number)?.toFloat() ?: 14f
    val textColorVal = clusterTextStyle?.get("color")
    val fontWeightVal = clusterTextStyle?.get("fontWeight") as? String
    
    // 解析颜色
    val bgColor = ColorParser.parseColor(bgColorVal ?: "#F54531") // 默认红色
    val borderColor = ColorParser.parseColor(borderColorVal ?: "#FFFFFF") // 默认白色
    val textColor = ColorParser.parseColor(textColorVal ?: "#FFFFFF") // 默认白色
    
    // 计算尺寸 (根据 iOS 逻辑：size = 30 + (count.toString().length - 1) * 5)
    // 这里简单处理，或者根据 count 动态调整
    // 基础大小 36dp
    val baseSize = 36
    val extraSize = (count.toString().length - 1) * 6
    val sizeDp = baseSize + extraSize
    val sizePx = (sizeDp * density).toInt()
    
    val bitmap = if (customIconBitmap != null) {
        // 如果有自定义图标，将其缩放到目标大小
        val scaled = Bitmap.createScaledBitmap(customIconBitmap!!, sizePx, sizePx, true)
        // 复制为可变 Bitmap 以便绘制文字
        scaled.copy(Bitmap.Config.ARGB_8888, true)
    } else {
        Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    }

    val canvas = Canvas(bitmap)
    
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    val radius = sizePx / 2f
    
    // 如果没有自定义图标，绘制默认的圆形背景
    if (customIconBitmap == null) {
        // 绘制边框
        paint.color = borderColor
        paint.style = Paint.Style.FILL
        canvas.drawCircle(radius, radius, radius, paint)
        
        // 绘制背景
        paint.color = bgColor
        val borderWidthPx = borderWidthVal * density
        canvas.drawCircle(radius, radius, radius - borderWidthPx, paint)
    }
    
    // 绘制文字
    paint.color = textColor
    paint.textSize = textSizeVal * density
    paint.textAlign = Paint.Align.CENTER
    
    // 字体粗细
    if (fontWeightVal == "bold") {
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
    }
    
    // 文字垂直居中
    val fontMetrics = paint.fontMetrics
    val baseline = radius - (fontMetrics.bottom + fontMetrics.top) / 2
    
    canvas.drawText(count.toString(), radius, baseline, paint)
    
    val descriptor = BitmapDescriptorFactory.fromBitmap(bitmap)
    bitmapCache[count] = descriptor
    return descriptor
  }
  
  /**
   * 处理 Marker 点击
   */
  fun onMarkerClick(marker: Marker) {
    val cluster = marker.getObject() as? Cluster
    if (cluster != null) {
      // 无论聚合数量多少，统一触发 onClusterPress
      // 这样保证用户在 React Native 端监听 onClusterPress 时总能收到事件
      // 如果是单点，count 为 1，pois 包含单个点数据
      val pointsData = cluster.items.map { it.data }
      onClusterPress(mapOf(
        "count" to cluster.size,
        "latitude" to cluster.center.latitude,
        "longitude" to cluster.center.longitude,
        "pois" to pointsData,
        "points" to pointsData // 兼容 iOS 或用户习惯
      ))
    }
  }
  
  companion object {
    private val markerMap = ConcurrentHashMap<Marker, ClusterView>()
    
    fun registerMarker(marker: Marker, view: ClusterView) {
      markerMap[marker] = view
    }
    
    fun unregisterMarker(marker: Marker) {
      markerMap.remove(marker)
    }
    
    fun handleMarkerClick(marker: Marker): Boolean {
      markerMap[marker]?.let { view ->
        view.onMarkerClick(marker)
        return true
      }
      return false
    }
  }
}
