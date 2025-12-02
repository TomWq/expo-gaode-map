package expo.modules.gaodemap.overlays

import android.content.Context

import com.amap.api.maps.AMap
import com.amap.api.maps.model.BitmapDescriptorFactory
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.MultiPointItem
import com.amap.api.maps.model.MultiPointOverlay
import com.amap.api.maps.model.MultiPointOverlayOptions
import expo.modules.kotlin.AppContext

import expo.modules.kotlin.views.ExpoView

class MultiPointView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  

  private var multiPointOverlay: MultiPointOverlay? = null
  private var aMap: AMap? = null
  private var points: MutableList<MultiPointItem> = mutableListOf()
  
  /**
   * 设置地图实例
   */
  fun setMap(map: AMap) {
    aMap = map
    createOrUpdateMultiPoint()
  }
  
  /**
   * 设置海量点数据
   */
  fun setPoints(pointsList: List<Map<String, Any>>) {
    points.clear()
    pointsList.forEach { point ->
      val lat = (point["latitude"] as? Number)?.toDouble()
      val lng = (point["longitude"] as? Number)?.toDouble()
      val id = point["id"] as? String ?: ""
      
      // 坐标验证
      if (lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        val multiPointItem = MultiPointItem(LatLng(lat, lng))
        multiPointItem.customerId = id
        points.add(multiPointItem)
      }
    }
    createOrUpdateMultiPoint()
  }
  
  /**
   * 设置图标
   */
  fun setIcon(iconUri: String?) {

    // 简化处理，实际需要实现图片加载
    createOrUpdateMultiPoint()
  }
  
  /**
   * 设置锚点
   */
  fun setAnchor(anchor: Map<String, Float>) {
    val x = anchor["x"] ?: 0.5f
    val y = anchor["y"] ?: 0.5f
    multiPointOverlay?.setAnchor(x, y)
  }
  
  /**
   * 创建或更新海量点
   */
  private fun createOrUpdateMultiPoint() {
    aMap?.let { map ->
      if (points.isNotEmpty()) {
        // 移除旧的海量点
        multiPointOverlay?.remove()
        
        // 创建海量点选项
        val overlayOptions = MultiPointOverlayOptions()
        overlayOptions.icon(BitmapDescriptorFactory.defaultMarker())
        overlayOptions.anchor(0.5f, 0.5f)
        
        // 创建海量点覆盖物
        multiPointOverlay = map.addMultiPointOverlay(overlayOptions)
          multiPointOverlay?.items = points
        
        // 注意：MultiPointOverlay 在高德地图 Android SDK 中不直接支持点击事件
        // 如果需要点击事件，需要使用 Marker 或其他方式实现
      }
    }
  }
  
  /**
   * 移除海量点
   */
  fun removeMultiPoint() {
    multiPointOverlay?.remove()
    multiPointOverlay = null
    points.clear()
  }
  
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    // 🔑 关键修复：使用 post 延迟检查
    post {
      if (parent == null) {
        removeMultiPoint()
        aMap = null
      }
    }
  }
}
