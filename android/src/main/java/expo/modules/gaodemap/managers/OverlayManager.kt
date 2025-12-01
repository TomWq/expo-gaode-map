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
  
  // 覆盖物存储（仅保留命令式 API 的 Polygon 和 Polyline）
  private val circles = mutableMapOf<String, com.amap.api.maps.model.Circle>()
  private val polylines = mutableMapOf<String, com.amap.api.maps.model.Polyline>()
  private val polygons = mutableMapOf<String, com.amap.api.maps.model.Polygon>()
  
  // Circle ID 映射
  private val circleIdMap = mutableMapOf<com.amap.api.maps.model.Circle, String>()
  
  // Polygon ID 映射
  private val polygonIdMap = mutableMapOf<com.amap.api.maps.model.Polygon, String>()
  
  // Polyline ID 映射
  private val polylineIdMap = mutableMapOf<com.amap.api.maps.model.Polyline, String>()
  
  // 事件回调（仅保留命令式 API）
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

      // 将 dp 转换为 px，与 iOS 的 points 对应
      val density = context.resources.displayMetrics.density

      val options = com.amap.api.maps.model.CircleOptions()
        .center(latLng)
        .radius(radius)
        .fillColor(fillColor)
        .strokeColor(strokeColor)
        .strokeWidth(strokeWidth * density)

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
      strokeWidth?.let {
        val density = context.resources.displayMetrics.density
        circle.strokeWidth = it * density
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

      // 将 dp 转换为 px，与 iOS 的 points 对应
      val density = context.resources.displayMetrics.density

      val options = com.amap.api.maps.model.PolylineOptions()
        .addAll(latLngs)
        .width(width * density)
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
            }
          } catch (e: Exception) {
            // 忽略异常
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
