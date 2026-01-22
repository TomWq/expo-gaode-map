package expo.modules.gaodemap.map.overlays

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import com.amap.api.maps.AMap
import com.amap.api.maps.model.BitmapDescriptorFactory
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.Polyline
import com.amap.api.maps.model.PolylineOptions
  
import expo.modules.gaodemap.map.utils.LatLngParser
import expo.modules.gaodemap.map.utils.ColorParser
import expo.modules.gaodemap.map.utils.GeometryUtils
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.net.URL

class PolylineView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  private val onPolylinePress by EventDispatcher()
  
  private var polyline: Polyline? = null
  private var aMap: AMap? = null
  private var points: List<LatLng> = emptyList()
  private var strokeWidth: Float = 10f
  private var strokeColor: Int = Color.BLUE
  private var isDotted: Boolean = false
  private var isGeodesic: Boolean = false
  private var textureUrl: String? = null
  private var simplificationTolerance: Double = 0.0
  
  /**
   * 设置地图实例
   */
  @Suppress("unused")
  fun setMap(map: AMap) {
    aMap = map
    post {
      createOrUpdatePolyline()
    }

  }


  /**
   * 设置折线点集合
   */
  fun setPoints(pointsList: List<Any>?) {
    points = LatLngParser.parseLatLngList(pointsList)
    polyline?.let {
      it.points = points
    } ?: createOrUpdatePolyline()
  }
  
  /**
   * 设置线宽
   */
  fun setStrokeWidth(width: Float) {
    // Android 需要乘以屏幕密度以匹配 iOS 的视觉效果
    val density = context.resources.displayMetrics.density
    strokeWidth = width * density
    polyline?.let {
      it.width = strokeWidth
    } ?: createOrUpdatePolyline()
  }
  
  /**
   * 设置线条颜色
   */
  fun setStrokeColor(color: String?) {
    strokeColor = ColorParser.parseColor(color)
    polyline?.let {
      it.color = strokeColor
    } ?: createOrUpdatePolyline()
  }
  
  /**
   * 设置是否虚线
   */
  fun setDotted(dotted: Boolean) {
    try {
      isDotted = dotted
      createOrUpdatePolyline()
    } catch (e: Throwable) {
      android.util.Log.e("PolylineView", "setDotted failed", e)
    }
  }
  
  /**
   * 设置是否绘制大地线
   */
  fun setGeodesic(geodesic: Boolean) {
    isGeodesic = geodesic
    createOrUpdatePolyline()
  }
  
  /**
   * 设置 z-index
   */
  fun setZIndex(zIndex: Float) {
    polyline?.let {
      it.zIndex = zIndex
    } ?: createOrUpdatePolyline()
  }

    fun setGradient(gradient: Boolean){

    }

  /**
   * 设置透明度
   */
  @Suppress("unused")
  fun setOpacity(opacity: Float) {
    polyline?.let { line ->
      val currentColor = line.color
      val alpha = (opacity * 255).toInt()
      line.color = Color.argb(alpha, Color.red(currentColor), Color.green(currentColor), Color.blue(currentColor))
    }
  }
  
  /**
   * 设置纹理图片
   */
  fun setTexture(url: String?) {
    textureUrl = url
    createOrUpdatePolyline()
  }

  fun setSimplificationTolerance(tolerance: Double) {
    simplificationTolerance = tolerance
    if (points.isNotEmpty()) {
        createOrUpdatePolyline()
    }
  }
  
  /**
   * 创建或更新折线
   */
  @SuppressLint("DiscouragedApi")
  private fun createOrUpdatePolyline() {
    aMap?.let { map ->
      try {
        // 移除旧折线
        polyline?.remove()
        polyline = null
        
        if (points.isNotEmpty()) {
          val displayPoints = if (simplificationTolerance > 0) {
            GeometryUtils.simplifyPolyline(points, simplificationTolerance)
          } else {
            points
          }

          val options = PolylineOptions()
            .addAll(displayPoints)
            .width(strokeWidth)
            .color(strokeColor)
            .geodesic(isGeodesic)

          
          // 设置虚线样式
          try {
              options.isDottedLine = isDotted
              if (isDotted) {
                  options.dottedLineType = PolylineOptions.DOTTEDLINE_TYPE_SQUARE
              }
          } catch (e: Throwable) {
              // 忽略虚线设置错误，防止崩溃
              android.util.Log.e("PolylineView", "设置虚线失败", e)
          }
          
          // 设置纹理
          textureUrl?.let { url ->
            try {
              when {
                url.startsWith("http://") || url.startsWith("https://") -> {
                  // 网络图片异步加载
                  Thread {
                    try {
                      val connection = URL(url).openConnection()
                      val inputStream = connection.getInputStream()
                      val bitmap = android.graphics.BitmapFactory.decodeStream(inputStream)
                      inputStream.close()
                      post {
                        polyline?.setCustomTexture(BitmapDescriptorFactory.fromBitmap(bitmap))
                      }
                    } catch (e: Exception) {
                      e.printStackTrace()
                    }
                  }.start()
                }
                url.startsWith("file://") -> {
                  val path = url.substring(7)
                  val bitmap = android.graphics.BitmapFactory.decodeFile(path)
                  bitmap?.let { options.setCustomTexture(BitmapDescriptorFactory.fromBitmap(it)) }
                }
                else -> {
                  val resId = context.resources.getIdentifier(url, "drawable", context.packageName)
                  if (resId != 0) {
                    val bitmap = android.graphics.BitmapFactory.decodeResource(context.resources, resId)
                    options.setCustomTexture(BitmapDescriptorFactory.fromBitmap(bitmap))
                  }else{
                    
                  }
                }
              }
            } catch (e: Exception) {
              e.printStackTrace()
            }
          }
          
          polyline = map.addPolyline(options)
        }
      } catch (e: Throwable) {
        android.util.Log.e("PolylineView", "Error creating/updating polyline", e)
      }
    }
  }
  
  /**
   * 检查点击位置是否在折线附近
   */
  fun checkPress(latLng: LatLng): Boolean {
    polyline?.let { line ->
      val threshold = 20.0 // 20米容差
      val linePoints = line.points
      if (linePoints.size < 2) return false
      
      for (i in 0 until linePoints.size - 1) {
        val distance = distanceToSegment(latLng, linePoints[i], linePoints[i + 1])
        if (distance <= threshold) {
          onPolylinePress(mapOf(
            "latitude" to latLng.latitude,
            "longitude" to latLng.longitude
          ))
          return true
        }
      }
    }
    return false
  }
  
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
  
  /**
   * 移除折线
   */
  fun removePolyline() {
    polyline?.remove()
    polyline = null
  }
  
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    // 🔑 关键修复：使用 post 延迟检查
    post {
      if (parent == null) {
        removePolyline()
        aMap = null
      }
    }
  }
}
