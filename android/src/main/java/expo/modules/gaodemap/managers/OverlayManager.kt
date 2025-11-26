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
  

  
  private fun loadMarkerIcon(uri: String, width: Int, height: Int, callback: (Bitmap) -> Unit) {
    Thread {
      try {
        val bitmap = when {
          uri.startsWith("http://") || uri.startsWith("https://") -> {
            BitmapFactory.decodeStream(URL(uri).openStream())
          }
          uri.startsWith("file://") -> {
            BitmapFactory.decodeFile(uri.substring(7))
          }
          else -> {
            null
          }
        }
        
        if (bitmap != null) {
          val resized = Bitmap.createScaledBitmap(bitmap, width, height, true)
          callback(resized)
        }
      } catch (e: Exception) {
        // 忽略异常
      }
    }.start()
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
      
      width?.let {
        val density = context.resources.displayMetrics.density
        polyline.width = it * density
      }
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
      
      // 将 dp 转换为 px，与 iOS 的 points 对应
      val density = context.resources.displayMetrics.density
      
      val options = com.amap.api.maps.model.PolygonOptions()
        .addAll(latLngs)
        .fillColor(fillColor)
        .strokeColor(strokeColor)
        .strokeWidth(strokeWidth * density)
        .zIndex(zIndex)
      
      val polygon = aMap.addPolygon(options)
      polygons[id] = polygon
      polygonIdMap[polygon] = id
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
      strokeWidth?.let {
        val density = context.resources.displayMetrics.density
        polygon.strokeWidth = it * density
      }
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
