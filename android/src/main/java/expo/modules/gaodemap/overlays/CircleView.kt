package expo.modules.gaodemap.overlays

import android.content.Context
import android.graphics.Color
import com.amap.api.maps.AMap
import com.amap.api.maps.model.Circle
import com.amap.api.maps.model.CircleOptions
import com.amap.api.maps.model.LatLng
import expo.modules.gaodemap.utils.ColorParser
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class CircleView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  @Suppress("unused")
  private val onCirclePress by EventDispatcher()
  
  private var circle: Circle? = null
  private var aMap: AMap? = null
  private var center: LatLng? = null
  private var radius: Double = 1000.0
  private var fillColor: Int = Color.argb(50, 0, 0, 255)
  private var strokeColor: Int = Color.BLUE
  private var strokeWidth: Float = 10f

  private var _zIndex: Float = 0f
  
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
      // 坐标验证
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return
      }
      center = LatLng(lat, lng)
      circle?.center = center
    }
  }
  
  /**
   * 设置半径
   */
  fun setRadius(radiusValue: Double) {
    // 半径验证（必须大于0）
    val validRadius = if (radiusValue > 0) radiusValue else 1000.0
    radius = validRadius
    circle?.let {
        it.radius = radius
    } ?: createOrUpdateCircle()
  }
  
  /**
   * 设置填充颜色
   */
  fun setFillColor(color: Any) {
    fillColor = ColorParser.parseColor(color)
     circle?.let {
         it.fillColor = fillColor
     } ?: createOrUpdateCircle()

  }
  
  /**
   * 设置边框颜色
   */
  fun setStrokeColor(color: Any) {
    strokeColor =  ColorParser.parseColor(color)
    circle?.let {
        it.strokeColor = strokeColor
    } ?: createOrUpdateCircle()
  }
  
  /**
   * 设置边框宽度
   * 将 dp 转换为 px，与 iOS 的 points 对应
   */
  fun setStrokeWidth(width: Float) {
    val density = context.resources.displayMetrics.density
    strokeWidth = width * density
    circle?.let {
        it.strokeWidth = strokeWidth
    } ?: createOrUpdateCircle()
  }
  
  /**
   * 设置 z-index
   */
  fun setZIndex(zIndex: Float) {
    _zIndex = zIndex
   circle?.let {
        it.zIndex = _zIndex
    } ?: createOrUpdateCircle()
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
          .zIndex(_zIndex)
      )
    }
  }
  
  /**
   * 检查点击位置是否在圆形内
   */
  fun checkPress(latLng: LatLng): Boolean {
    circle?.let { c ->
      if (c.contains(latLng)) {
        onCirclePress(mapOf(
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
    aMap = null
  }

}
