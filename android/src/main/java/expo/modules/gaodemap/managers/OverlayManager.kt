package expo.modules.gaodemap.managers

import android.content.Context
import android.util.Log
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.amap.api.maps.AMap
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.BitmapDescriptorFactory
import expo.modules.gaodemap.utils.ColorParser
import java.net.URL

/**
 * 覆盖物管理器
 * 负责地图上所有覆盖物的添加、删除、更新
 */
class OverlayManager(private val aMap: AMap, private val context: Context) {
  
  companion object {
    private const val TAG = "OverlayManager"
  }
  
  // 覆盖物存储
  private val circles = mutableMapOf<String, com.amap.api.maps.model.Circle>()
  private val markers = mutableMapOf<String, com.amap.api.maps.model.Marker>()
  private val polylines = mutableMapOf<String, com.amap.api.maps.model.Polyline>()
  private val polygons = mutableMapOf<String, com.amap.api.maps.model.Polygon>()
  
  // Marker ID 映射
  private val markerIdMap = mutableMapOf<com.amap.api.maps.model.Marker, String>()
  
  // Circle ID 映射
  private val circleIdMap = mutableMapOf<com.amap.api.maps.model.Circle, String>()
  
  // Polygon ID 映射
  private val polygonIdMap = mutableMapOf<com.amap.api.maps.model.Polygon, String>()
  
  // Polyline ID 映射
  private val polylineIdMap = mutableMapOf<com.amap.api.maps.model.Polyline, String>()
  
  // 事件回调
  var onMarkerPress: ((String, Double, Double) -> Unit)? = null
  var onMarkerDragStart: ((String, Double, Double) -> Unit)? = null
  var onMarkerDrag: ((String, Double, Double) -> Unit)? = null
  var onMarkerDragEnd: ((String, Double, Double) -> Unit)? = null
  var onCirclePress: ((String, Double, Double) -> Unit)? = null
  var onPolygonPress: ((String, Double, Double) -> Unit)? = null
  var onPolylinePress: ((String, Double, Double) -> Unit)? = null
  
  private val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())
  
  // ==================== 圆形覆盖物 ====================
  
  fun addCircle(id: String, props: Map<String, Any>) {
    
    @Suppress("UNCHECKED_CAST")
    val center = props["center"] as? Map<String, Double>
    val radius = (props["radius"] as? Number)?.toDouble() ?: 1000.0
    val fillColor = ColorParser.parseColor(props["fillColor"])
    val strokeColor = ColorParser.parseColor(props["strokeColor"])
    val strokeWidth = (props["strokeWidth"] as? Number)?.toFloat() ?: 10f
    
    if (center != null) {
      val lat = center["latitude"] ?: 0.0
      val lng = center["longitude"] ?: 0.0
      val latLng = LatLng(lat, lng)
      
      val options = com.amap.api.maps.model.CircleOptions()
        .center(latLng)
        .radius(radius)
        .fillColor(fillColor)
        .strokeColor(strokeColor)
        .strokeWidth(strokeWidth)
      
      val circle = aMap.addCircle(options)
      circles[id] = circle
      circleIdMap[circle] = id
    }
  }
  
  fun removeCircle(id: String) {
    circles[id]?.let { circle ->
      circleIdMap.remove(circle)
      circle.remove()
      circles.remove(id)
    }
  }
  
  fun updateCircle(id: String, props: Map<String, Any>) {
    circles[id]?.let { circle ->
      @Suppress("UNCHECKED_CAST")
      val center = props["center"] as? Map<String, Double>
      val radius = (props["radius"] as? Number)?.toDouble()
      val fillColor = props["fillColor"]?.let { ColorParser.parseColor(it) }
      val strokeColor = props["strokeColor"]?.let { ColorParser.parseColor(it) }
      val strokeWidth = (props["strokeWidth"] as? Number)?.toFloat()
      
      center?.let {
        val lat = it["latitude"] ?: 0.0
        val lng = it["longitude"] ?: 0.0
        circle.center = LatLng(lat, lng)
      }
      
      radius?.let { circle.radius = it }
      fillColor?.let { circle.fillColor = it }
      strokeColor?.let { circle.strokeColor = it }
      strokeWidth?.let { circle.strokeWidth = it }
    }
  }
  
  // ==================== 标记点 ====================
  
  fun addMarker(id: String, props: Map<String, Any>) {
    Log.d(TAG, "addMarker 调用 - ID: $id")
    Log.d(TAG, "addMarker props: $props")
    
    @Suppress("UNCHECKED_CAST")
    val position = props["position"] as? Map<String, Double>
    val title = props["title"] as? String
    val snippet = props["snippet"] as? String
    val draggable = props["draggable"] as? Boolean ?: false
    val icon = props["icon"]
    // 将 RN 的点(points)转换为 Android 的 dp
    val iconWidth = dpToPx((props["iconWidth"] as? Number)?.toFloat() ?: 40f)
    val iconHeight = dpToPx((props["iconHeight"] as? Number)?.toFloat() ?: 40f)
    val opacity = (props["opacity"] as? Number)?.toFloat() ?: 1.0f
    val flat = props["flat"] as? Boolean ?: false
    val zIndex = (props["zIndex"] as? Number)?.toFloat() ?: 0f
    val anchor = props["anchor"] as? Map<String, Double>
    
    if (position != null) {
      val lat = position["latitude"] ?: 0.0
      val lng = position["longitude"] ?: 0.0
      val latLng = LatLng(lat, lng)
      
      val options = com.amap.api.maps.model.MarkerOptions()
        .position(latLng)
        .draggable(draggable)
        .setFlat(flat)
        .zIndex(zIndex)
      
      title?.let { options.title(it) }
      snippet?.let { options.snippet(it) }
      
      anchor?.let {
        val x = (it["x"] as? Number)?.toFloat() ?: 0.5f
        val y = (it["y"] as? Number)?.toFloat() ?: 1.0f
        options.anchor(x, y)
      }
      
      val marker = aMap.addMarker(options)
      marker?.alpha = opacity
      
      markers[id] = marker
      marker?.let { markerIdMap[it] = id }
      
      // 加载自定义图标
      icon?.let {
        val uri = when (it) {
          is String -> it
          is Map<*, *> -> it["uri"] as? String
          else -> null
        }
        uri?.let { iconUri ->
          loadMarkerIcon(iconUri, iconWidth, iconHeight) { bitmap ->
            mainHandler.post {
              marker?.setIcon(BitmapDescriptorFactory.fromBitmap(bitmap))
            }
          }
        }
      }
      
      // 设置事件监听器（只设置一次）
      setupMarkerListeners()
    }
  }
  
  private fun setupMarkerListeners() {
    aMap.setOnMarkerClickListener { marker ->
      markerIdMap[marker]?.let { id ->
        onMarkerPress?.invoke(id, marker.position.latitude, marker.position.longitude)
      }
      false // 返回 false 允许显示 InfoWindow
    }
    
    aMap.setOnMarkerDragListener(object : AMap.OnMarkerDragListener {
      override fun onMarkerDragStart(marker: com.amap.api.maps.model.Marker?) {
        marker?.let { m ->
          markerIdMap[m]?.let { id ->
            onMarkerDragStart?.invoke(id, m.position.latitude, m.position.longitude)
          }
        }
      }
      
      override fun onMarkerDrag(marker: com.amap.api.maps.model.Marker?) {
        marker?.let { m ->
          markerIdMap[m]?.let { id ->
            onMarkerDrag?.invoke(id, m.position.latitude, m.position.longitude)
          }
        }
      }
      
      override fun onMarkerDragEnd(marker: com.amap.api.maps.model.Marker?) {
        marker?.let { m ->
          markerIdMap[m]?.let { id ->
            onMarkerDragEnd?.invoke(id, m.position.latitude, m.position.longitude)
          }
        }
      }
    })
  }
  
  private fun loadMarkerIcon(uri: String, width: Int, height: Int, callback: (Bitmap) -> Unit) {
    Thread {
      try {
        Log.d(TAG, "开始加载图标: $uri")
        val bitmap = when {
          uri.startsWith("http://") || uri.startsWith("https://") -> {
            Log.d(TAG, "加载网络图片")
            BitmapFactory.decodeStream(URL(uri).openStream())
          }
          uri.startsWith("file://") -> {
            Log.d(TAG, "加载本地文件")
            BitmapFactory.decodeFile(uri.substring(7))
          }
          else -> {
            Log.d(TAG, "未知 URI 格式")
            null
          }
        }
        
        if (bitmap == null) {
          Log.e(TAG, "图标加载失败: bitmap 为 null")
        } else {
          Log.d(TAG, "图标加载成功: ${bitmap.width}x${bitmap.height}")
          val resized = Bitmap.createScaledBitmap(bitmap, width, height, true)
          callback(resized)
        }
      } catch (e: Exception) {
        Log.e(TAG, "图标加载异常: ${e.message}", e)
      }
    }.start()
  }
  
  fun removeMarker(id: String) {
    markers[id]?.let { marker ->
      markerIdMap.remove(marker)
      marker.remove()
      markers.remove(id)
    }
  }
  
  fun updateMarker(id: String, props: Map<String, Any>) {
    markers[id]?.let { marker ->
      @Suppress("UNCHECKED_CAST")
      val position = props["position"] as? Map<String, Double>
      val title = props["title"] as? String
      val snippet = props["snippet"] as? String
      val draggable = props["draggable"] as? Boolean
      val icon = props["icon"]
      val iconWidth = dpToPx((props["iconWidth"] as? Number)?.toFloat() ?: 40f)
      val iconHeight = dpToPx((props["iconHeight"] as? Number)?.toFloat() ?: 40f)
      val opacity = props["opacity"] as? Number
      val flat = props["flat"] as? Boolean
      val zIndex = props["zIndex"] as? Number
      val anchor = props["anchor"] as? Map<String, Double>
      
      position?.let {
        val lat = it["latitude"] ?: 0.0
        val lng = it["longitude"] ?: 0.0
        marker.position = LatLng(lat, lng)
      }
      
      title?.let { marker.title = it }
      snippet?.let { marker.snippet = it }
      draggable?.let { marker.isDraggable = it }
      opacity?.let { marker.alpha = it.toFloat() }
      flat?.let { marker.isFlat = it }
      zIndex?.let { marker.zIndex = it.toFloat() }
      
      anchor?.let {
        val x = (it["x"] as? Number)?.toFloat() ?: 0.5f
        val y = (it["y"] as? Number)?.toFloat() ?: 1.0f
        marker.setAnchor(x, y)
      }
      
      icon?.let {
        val uri = when (it) {
          is String -> it
          is Map<*, *> -> it["uri"] as? String
          else -> null
        }
        uri?.let { iconUri ->
          loadMarkerIcon(iconUri, iconWidth, iconHeight) { bitmap ->
            mainHandler.post {
              marker.setIcon(BitmapDescriptorFactory.fromBitmap(bitmap))
            }
          }
        }
      }
    }
  }
  
  // ==================== 折线 ====================
  
  fun addPolyline(id: String, props: Map<String, Any>) {
    
    @Suppress("UNCHECKED_CAST")
    val points = props["points"] as? List<Map<String, Double>>
    val width = (props["width"] as? Number)?.toFloat() ?: (props["strokeWidth"] as? Number)?.toFloat() ?: 10f
    val texture = props["texture"] as? String
    val color = if (!texture.isNullOrEmpty()) {
      android.graphics.Color.TRANSPARENT
    } else {
      ColorParser.parseColor(props["color"] ?: props["strokeColor"])
    }
    
    if (points != null && points.size >= 2) {
      val latLngs = points.map { point ->
        val lat = point["latitude"] ?: 0.0
        val lng = point["longitude"] ?: 0.0
        LatLng(lat, lng)
      }
      
      val options = com.amap.api.maps.model.PolylineOptions()
        .addAll(latLngs)
        .width(width)
        .color(color)
      
      val polyline = aMap.addPolyline(options)
      
      // 处理纹理
      if (!texture.isNullOrEmpty()) {
        Thread {
          try {
            val bitmap = if (texture.startsWith("http://") || texture.startsWith("https://")) {
              BitmapFactory.decodeStream(URL(texture).openStream())
            } else if (texture.startsWith("file://")) {
              BitmapFactory.decodeFile(texture.substring(7))
            } else {
              null
            }
            
            bitmap?.let {
              val descriptor = BitmapDescriptorFactory.fromBitmap(it)
              polyline.setCustomTexture(descriptor)
              Log.d(TAG, "✅ 纹理设置成功")
            }
          } catch (e: Exception) {
            Log.e(TAG, "纹理加载失败: ${e.message}")
          }
        }.start()
      }
      
      polylines[id] = polyline
      polylineIdMap[polyline] = id
    }
  }
  
  fun removePolyline(id: String) {
    polylines[id]?.let { polyline ->
      polylineIdMap.remove(polyline)
      polyline.remove()
      polylines.remove(id)
    }
  }
  
  fun updatePolyline(id: String, props: Map<String, Any>) {
    polylines[id]?.let { polyline ->
      @Suppress("UNCHECKED_CAST")
      val points = props["points"] as? List<Map<String, Double>>
      val width = (props["strokeWidth"] as? Number)?.toFloat()
      val color = props["strokeColor"]?.let { ColorParser.parseColor(it) }
      
      points?.let {
        val latLngs = it.map { point ->
          val lat = point["latitude"] ?: 0.0
          val lng = point["longitude"] ?: 0.0
          LatLng(lat, lng)
        }
        polyline.points = latLngs
      }
      
      width?.let { polyline.width = it }
      color?.let { polyline.color = it }
    }
  }
  
  // ==================== 多边形 ====================
  
  fun addPolygon(id: String, props: Map<String, Any>) {
    
    @Suppress("UNCHECKED_CAST")
    val points = props["points"] as? List<Map<String, Double>>
    val fillColor = ColorParser.parseColor(props["fillColor"])
    val strokeColor = ColorParser.parseColor(props["strokeColor"])
    
    val strokeWidth = (props["strokeWidth"] as? Number)?.toFloat() ?: 10f
    val zIndex = (props["zIndex"] as? Number)?.toFloat() ?: 0f
    
    if (points != null && points.size >= 3) {
      val latLngs = points.map { point ->
        val lat = point["latitude"] ?: 0.0
        val lng = point["longitude"] ?: 0.0
        LatLng(lat, lng)
      }
      
      val options = com.amap.api.maps.model.PolygonOptions()
        .addAll(latLngs)
        .fillColor(fillColor)
        .strokeColor(strokeColor)
        .strokeWidth(strokeWidth)
        .zIndex(zIndex)
      
      val polygon = aMap.addPolygon(options)
      polygons[id] = polygon
      polygonIdMap[polygon] = id
      Log.d(TAG, "✅ 多边形创建成功")
    }
  }
  
  fun removePolygon(id: String) {
    polygons[id]?.let { polygon ->
      polygonIdMap.remove(polygon)
      polygon.remove()
      polygons.remove(id)
    }
  }
  
  fun updatePolygon(id: String, props: Map<String, Any>) {
    polygons[id]?.let { polygon ->
      @Suppress("UNCHECKED_CAST")
      val points = props["points"] as? List<Map<String, Double>>
      val fillColor = props["fillColor"]?.let { ColorParser.parseColor(it) }
      val strokeColor = props["strokeColor"]?.let { ColorParser.parseColor(it) }
      
      val strokeWidth = (props["strokeWidth"] as? Number)?.toFloat()
      val zIndex = (props["zIndex"] as? Number)?.toFloat()
      
      points?.let {
        val latLngs = it.map { point ->
          val lat = point["latitude"] ?: 0.0
          val lng = point["longitude"] ?: 0.0
          LatLng(lat, lng)
        }
        polygon.points = latLngs
      }
      
      fillColor?.let { polygon.fillColor = it }
      strokeColor?.let { polygon.strokeColor = it }
      strokeWidth?.let { polygon.strokeWidth = it }
      zIndex?.let { polygon.zIndex = it }
    }
  }
  
  /**
   * 清理所有覆盖物
   */
  /**
   * 检查点击位置是否在某个圆形内
   */
  fun checkCirclePress(latLng: LatLng): String? {
    for ((circle, id) in circleIdMap) {
      if (circle.contains(latLng)) {
        return id
      }
    }
    return null
  }
  
  /**
   * 检查点击位置是否在某个多边形内
   */
  fun checkPolygonPress(latLng: LatLng): String? {
    for ((polygon, id) in polygonIdMap) {
      if (polygon.contains(latLng)) {
        return id
      }
    }
    return null
  }
  
  /**
   * 检查点击位置是否在某条折线附近
   */
  fun checkPolylinePress(latLng: LatLng): String? {
    val threshold = 20.0 // 20米容差
    for ((polyline, id) in polylineIdMap) {
      val points = polyline.points
      if (points.size < 2) continue
      
      for (i in 0 until points.size - 1) {
        val distance = distanceToSegment(latLng, points[i], points[i + 1])
        if (distance <= threshold) {
          return id
        }
      }
    }
    return null
  }
  
  /**
   * 计算点到线段的距离(米)
   */
  private fun distanceToSegment(point: LatLng, start: LatLng, end: LatLng): Double {
    val p = android.location.Location("").apply {
      latitude = point.latitude
      longitude = point.longitude
    }
    val a = android.location.Location("").apply {
      latitude = start.latitude
      longitude = start.longitude
    }
    val b = android.location.Location("").apply {
      latitude = end.latitude
      longitude = end.longitude
    }
    
    val ab = a.distanceTo(b).toDouble()
    if (ab == 0.0) return a.distanceTo(p).toDouble()
    
    val ap = a.distanceTo(p).toDouble()
    val bp = b.distanceTo(p).toDouble()
    
    val t = maxOf(0.0, minOf(1.0,
      ((point.latitude - start.latitude) * (end.latitude - start.latitude) +
       (point.longitude - start.longitude) * (end.longitude - start.longitude)) / (ab * ab)
    ))
    
    val projection = LatLng(
      start.latitude + t * (end.latitude - start.latitude),
      start.longitude + t * (end.longitude - start.longitude)
    )
    
    val proj = android.location.Location("").apply {
      latitude = projection.latitude
      longitude = projection.longitude
    }
    
    return p.distanceTo(proj).toDouble()
  }
  
  fun clear() {
    circles.values.forEach { it.remove() }
    circles.clear()
    circleIdMap.clear()
    
    markers.values.forEach { it.remove() }
    markers.clear()
    
    polylines.values.forEach { it.remove() }
    polylines.clear()
    
    polygons.values.forEach { it.remove() }
    polygons.clear()
    polygonIdMap.clear()
    
    polylineIdMap.clear()
  }
  
  /**
   * 将 dp 转换为 px
   */
  private fun dpToPx(dp: Float): Int {
    val density = context.resources.displayMetrics.density
    return (dp * density + 0.5f).toInt()
  }
}
