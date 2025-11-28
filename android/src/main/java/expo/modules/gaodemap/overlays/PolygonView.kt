package expo.modules.gaodemap.overlays

import android.content.Context
import android.graphics.Color
import com.amap.api.maps.AMap
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.Polygon
import com.amap.api.maps.model.PolygonOptions
import expo.modules.gaodemap.utils.ColorParser
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class PolygonView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  private val onPolygonPress by EventDispatcher()
  
  private var polygon: Polygon? = null
  private var aMap: AMap? = null
  private var points: List<LatLng> = emptyList()
  private var strokeWidth: Float = 10f

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
  fun setPoints(pointsList: List<Map<String, Double>>) {
    points = pointsList.mapNotNull { point ->
      val lat = point["latitude"]
      val lng = point["longitude"]
      if (lat != null && lng != null) {
        LatLng(lat, lng)
      } else null
    }
    polygon?.let {
      it.points = points
    } ?: createOrUpdatePolygon()
  }
  
  /**
   * 设置填充颜色
   */
  fun setFillColor(color: Any) {
    fillColor = ColorParser.parseColor(color)
    polygon?.let {
      it.fillColor = fillColor
    } ?: createOrUpdatePolygon()
  }
  
  /**
   * 设置边框颜色
   */
  fun setStrokeColor(color: Any) {
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
   * 创建或更新多边形
   */
  private fun createOrUpdatePolygon() {
    aMap?.let { map ->
      if (polygon == null && points.isNotEmpty()) {
        val options = PolygonOptions()
          .addAll(points)
          .fillColor(fillColor)
          .strokeColor(strokeColor)
          .strokeWidth(strokeWidth)
          .zIndex(_zIndex)
        
        polygon = map.addPolygon(options)
        
        // 注意：高德地图 Android SDK 不直接支持 Polygon 点击事件
        // 如果需要点击事件，需要通过其他方式实现
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
    removePolygon()
  }
}
