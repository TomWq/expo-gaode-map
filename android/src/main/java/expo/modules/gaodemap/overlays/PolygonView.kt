package expo.modules.gaodemap.overlays

import android.content.Context
import android.graphics.Color
import com.amap.api.maps.AMap
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.Polygon
import com.amap.api.maps.model.PolygonOptions
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class PolygonView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  private val onPress by EventDispatcher()
  
  private var polygon: Polygon? = null
  private var aMap: AMap? = null
  private var points: List<LatLng> = emptyList()
  private var strokeWidth: Float = 10f
  
  /**
   * 设置地图实例
   */
  @Suppress("unused")
  fun setMap(map: AMap) {
    aMap = map
    createOrUpdatePolygon()
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
  fun setFillColor(color: Int) {
    polygon?.let {
      it.fillColor = color
    } ?: createOrUpdatePolygon()
  }
  
  /**
   * 设置边框颜色
   */
  fun setStrokeColor(color: Int) {
    polygon?.let {
      it.strokeColor = color
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
    polygon?.let {
      it.zIndex = zIndex
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
          .fillColor(Color.argb(50, 0, 0, 255))
          .strokeColor(Color.BLUE)
          .strokeWidth(strokeWidth)
        
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
        onPress(mapOf(
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
