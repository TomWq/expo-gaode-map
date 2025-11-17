package expo.modules.gaodemap.overlays

import android.content.Context
import android.graphics.Color
import com.amap.api.maps.AMap
import com.amap.api.maps.model.Circle
import com.amap.api.maps.model.CircleOptions
import com.amap.api.maps.model.LatLng
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class CircleView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  @Suppress("unused")
  private val onPress by EventDispatcher()
  
  private var circle: Circle? = null
  private var aMap: AMap? = null
  private var center: LatLng? = null
  private var radius: Double = 1000.0
  private var fillColor: Int = Color.argb(50, 0, 0, 255)
  private var strokeColor: Int = Color.BLUE
  private var strokeWidth: Float = 10f
  
  /**
   * 设置地图实例
   */
  @Suppress("unused")
  fun setMap(map: AMap) {
    aMap = map
    // 延迟创建圆形，确保所有 props 都已设置
    post { createOrUpdateCircle() }
  }
  
  /**
   * 设置圆心
   */
  fun setCenter(centerMap: Map<String, Double>) {
    val lat = centerMap["latitude"]
    val lng = centerMap["longitude"]
    if (lat != null && lng != null) {
      center = LatLng(lat, lng)
      circle?.center = center
    }
  }
  
  /**
   * 设置半径
   */
  fun setRadius(radiusValue: Double) {
    radius = radiusValue
    circle?.radius = radius
  }
  
  /**
   * 设置填充颜色
   */
  fun setFillColor(color: Int) {
    fillColor = color
    circle?.fillColor = color
  }
  
  /**
   * 设置边框颜色
   */
  fun setStrokeColor(color: Int) {
    strokeColor = color
    circle?.strokeColor = color
  }
  
  /**
   * 设置边框宽度
   */
  fun setStrokeWidth(width: Float) {
    strokeWidth = width
    circle?.strokeWidth = width
  }
  
  /**
   * 设置 z-index
   */
  fun setZIndex(zIndex: Float) {
    circle?.zIndex = zIndex
  }
  
  /**
   * 创建或更新圆形
   */
  private fun createOrUpdateCircle() {
    val map = aMap ?: return
    val centerPoint = center ?: return
    
    if (circle == null) {
      circle = map.addCircle(
        CircleOptions()
          .center(centerPoint)
          .radius(radius)
          .fillColor(fillColor)
          .strokeColor(strokeColor)
          .strokeWidth(strokeWidth)
      )
    }
  }
  
  /**
   * 检查点击位置是否在圆形内
   */
  fun checkPress(latLng: LatLng): Boolean {
    circle?.let { c ->
      if (c.contains(latLng)) {
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
   * 移除圆形
   */
  fun removeCircle() {
    circle?.remove()
    circle = null
  }
  
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    removeCircle()
  }
}
