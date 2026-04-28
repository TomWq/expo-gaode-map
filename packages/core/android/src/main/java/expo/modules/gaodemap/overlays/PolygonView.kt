package expo.modules.gaodemap.overlays

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import com.amap.api.maps.AMap
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.Polygon
import com.amap.api.maps.model.PolygonHoleOptions
import com.amap.api.maps.model.PolygonOptions
import expo.modules.gaodemap.utils.ColorParser
import expo.modules.gaodemap.utils.GeometryUtils
import expo.modules.gaodemap.utils.LatLngParser
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

@SuppressLint("ViewConstructor")
class PolygonView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  private val onPolygonPress by EventDispatcher()
  private val onPolygonSimplified by EventDispatcher()
  
  private var polygon: Polygon? = null
  private var aMap: AMap? = null
  private var points: List<LatLng> = emptyList()
  private var holes: List<List<LatLng>> = emptyList()
  private var strokeWidth: Float = 10f
  private var simplificationTolerance: Double = 0.0

  private var fillColor: Int = Color.argb(50, 0, 0, 255)

  private var strokeColor: Int = Color.BLUE

  private var _zIndex: Float = 0f
  
  /**
   * 设置地图实例
   */
  @Suppress("unused")
  fun setMap(map: AMap) {
    aMap = map
    post { createOrUpdatePolygon() }

  }
  
  /**
   * 设置多边形点集合
   */
  fun setPoints(pointsList: List<Any>?) {
    val nestedPoints = LatLngParser.parseLatLngListList(pointsList)
    if (nestedPoints.isNotEmpty()) {
      points = nestedPoints[0]
      holes = if (nestedPoints.size > 1) nestedPoints.subList(1, nestedPoints.size) else emptyList()
    } else {
      points = emptyList()
      holes = emptyList()
    }
    
    polygon?.let {
      it.points = points
      it.holeOptions = holes.map { holePoints ->
        PolygonHoleOptions().addAll(holePoints)
      }
    } ?: createOrUpdatePolygon()
  }
  
  /**
   * 设置填充颜色
   */
  fun setFillColor(color: String?) {
    fillColor = ColorParser.parseColor(color)
    polygon?.let {
      it.fillColor = fillColor
    } ?: createOrUpdatePolygon()
  }
  
  /**
   * 设置边框颜色
   */
  fun setStrokeColor(color: String?) {
   strokeColor = ColorParser.parseColor(color)
    polygon?.let {
      it.strokeColor = strokeColor
    } ?: createOrUpdatePolygon()
  }
  
  /**
   * 设置边框宽度
   */
  fun setStrokeWidth(width: Float) {
    // Android 需要乘以屏幕密度以匹配 iOS 的视觉效果
    val density = context.resources.displayMetrics.density
    strokeWidth = width * density
    polygon?.let {
      it.strokeWidth = strokeWidth
    } ?: createOrUpdatePolygon()
  }
  
  /**
   * 设置 z-index
   */
  fun setZIndex(zIndex: Float) {
      _zIndex = zIndex
    polygon?.let {
      it.zIndex = _zIndex
    } ?: createOrUpdatePolygon()
  }

  /**
   * 设置简化容差
   */
  fun setSimplificationTolerance(tolerance: Double) {
    simplificationTolerance = tolerance
    if (points.isNotEmpty()) {
      createOrUpdatePolygon()
    }
  }
  
  /**
   * 创建或更新多边形
   */
  private fun createOrUpdatePolygon() {
    aMap?.let { map ->
      // 移除旧的多边形
      polygon?.remove()
      polygon = null
      
      if (points.isNotEmpty()) {
        val displayPoints = if (simplificationTolerance > 0) {
          GeometryUtils.simplifyPolyline(points, simplificationTolerance)
        } else {
          points
        }

        // 至少3个点
        if (displayPoints.size < 3) return

        val options = PolygonOptions()
          .addAll(displayPoints)
          .fillColor(fillColor)
          .strokeColor(strokeColor)
          .strokeWidth(strokeWidth)
          .zIndex(_zIndex)
        
        if (holes.isNotEmpty()) {
          holes.forEach { holePoints ->
            options.addHoles(PolygonHoleOptions().addAll(holePoints))
          }
        }
        
        polygon = map.addPolygon(options)
        
        // 派发简化事件
        onPolygonSimplified(mapOf(
          "originalCount" to points.size,
          "simplifiedCount" to displayPoints.size
        ))
      }
    }
  }
  
  /**
   * 检查点击位置是否在多边形内
   */
  fun checkPress(latLng: LatLng): Boolean {
    polygon?.let { poly ->
      if (poly.contains(latLng)) {
        onPolygonPress(mapOf(
          "latitude" to latLng.latitude,
          "longitude" to latLng.longitude
        ))
        return true
      }
    }
    return false
  }
  
  /**
   * 移除多边形
   */
  fun removePolygon() {
    polygon?.remove()
    polygon = null
  }
  
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    // 🔑 关键修复：使用 post 延迟检查
    post {
      if (parent == null) {
        removePolygon()
        aMap = null
      }
    }
  }
}
