package expo.modules.gaodemap.overlays

import android.content.Context
import com.amap.api.maps.AMap
import com.amap.api.maps.model.BitmapDescriptorFactory
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.Marker
import com.amap.api.maps.model.MarkerOptions
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

/**
 * 点聚合视图
 * 注意：高德 Android SDK 的点聚合功能需要额外依赖，这里提供基础实现
 * 实际使用时可能需要引入 com.amap.api:3dmap-cluster 库
 */
class ClusterView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  private val onPress by EventDispatcher()
  @Suppress("unused")
  private val onClusterPress by EventDispatcher()
  
  private var aMap: AMap? = null
  private var markers: MutableList<Marker> = mutableListOf()
  private var points: List<Map<String, Any>> = emptyList()
  @Suppress("unused")
  private var radius: Int = 60
  @Suppress("unused")
  private var minClusterSize: Int = 2
  
  /**
   * 设置地图实例
   */
  @Suppress("unused")
  fun setMap(map: AMap) {
    aMap = map
    createOrUpdateCluster()
  }
  
  /**
   * 设置聚合点数据
   */
  fun setPoints(pointsList: List<Map<String, Any>>) {
    // 过滤无效坐标
    points = pointsList.filter { point ->
      val lat = (point["latitude"] as? Number)?.toDouble()
      val lng = (point["longitude"] as? Number)?.toDouble()
      lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    }
    createOrUpdateCluster()
  }
  
  /**
   * 设置聚合半径
   */
  fun setRadius(radiusValue: Int) {
    radius = radiusValue
    createOrUpdateCluster()
  }
  
  /**
   * 设置最小聚合数量
   */
  fun setMinClusterSize(size: Int) {
    minClusterSize = size
    createOrUpdateCluster()
  }
  
  /**
   * 设置图标
   */
  @Suppress("UNUSED_PARAMETER")
  fun setIcon(iconUri: String?) {
    // 简化处理，实际需要实现图片加载
    createOrUpdateCluster()
  }
  
  /**
   * 创建或更新聚合
   * 注意：这是简化实现，完整的点聚合需要使用专门的聚合库
   */
  private fun createOrUpdateCluster() {
    aMap?.let { map ->
      // 清除旧的标记
      markers.forEach { it.remove() }
      markers.clear()
      
      // 简化实现：直接添加所有点作为标记
      // 实际应用中应该使用点聚合算法
      points.forEach { point ->
        val lat = (point["latitude"] as? Number)?.toDouble()
        val lng = (point["longitude"] as? Number)?.toDouble()
        
        if (lat != null && lng != null) {
          val markerOptions = MarkerOptions()
            .position(LatLng(lat, lng))
            .icon(BitmapDescriptorFactory.defaultMarker())
          
          val marker = map.addMarker(markerOptions)
          marker?.let { markers.add(it) }
        }
      }
      
      // 设置点击监听
      map.setOnMarkerClickListener { clickedMarker ->
        if (markers.contains(clickedMarker)) {
          onPress(mapOf(
            "latitude" to clickedMarker.position.latitude,
            "longitude" to clickedMarker.position.longitude
          ))
          true
        } else {
          false
        }
      }
    }
  }
  
  /**
   * 移除聚合
   */
  fun removeCluster() {
    markers.forEach { it.remove() }
    markers.clear()
    points = emptyList()
  }
  
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    removeCluster()
    aMap = null
  }
}
