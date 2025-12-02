package expo.modules.gaodemap.overlays

import android.content.Context
import com.amap.api.maps.AMap
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.TileOverlay
import com.amap.api.maps.model.TileOverlayOptions
import com.amap.api.maps.model.HeatmapTileProvider
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class HeatMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  private var heatmapOverlay: TileOverlay? = null
  private var aMap: AMap? = null
  private var dataList: MutableList<LatLng> = mutableListOf()
  private var radius: Int = 50
  private var opacity: Double = 0.6
  
  /**
   * 设置地图实例
   */
  @Suppress("unused")
  fun setMap(map: AMap) {
    aMap = map
    createOrUpdateHeatMap()
  }
  
  /**
   * 设置热力图数据
   */
  fun setData(data: List<Map<String, Any>>) {
    dataList.clear()
    data.forEach { point ->
      val lat = (point["latitude"] as? Number)?.toDouble()
      val lng = (point["longitude"] as? Number)?.toDouble()
      // 坐标验证
      if (lat != null && lng != null && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        dataList.add(LatLng(lat, lng))
      }
    }
    createOrUpdateHeatMap()
  }
  
  /**
   * 设置热力图半径
   */
  fun setRadius(radiusValue: Int) {
    radius = radiusValue
    createOrUpdateHeatMap()
  }
  
  /**
   * 设置透明度
   */
  fun setOpacity(opacityValue: Double) {
    opacity = opacityValue
    createOrUpdateHeatMap()
  }
  
  /**
   * 创建或更新热力图
   */
  private fun createOrUpdateHeatMap() {
    aMap?.let { map ->
      if (dataList.isNotEmpty()) {
        // 移除旧的热力图
        heatmapOverlay?.remove()
        
        // 创建热力图提供者
        val builder = HeatmapTileProvider.Builder()
        builder.data(dataList)
        builder.radius(radius)
        
        // 创建热力图图层
        val heatmapTileProvider = builder.build()
        val tileOverlayOptions = TileOverlayOptions()
          .tileProvider(heatmapTileProvider)
        
        heatmapOverlay = map.addTileOverlay(tileOverlayOptions)
        // 注意：TileOverlay 不支持 transparency 属性，透明度通过 HeatmapTileProvider 控制
      }
    }
  }
  
  /**
   * 移除热力图
   */
  fun removeHeatMap() {
    heatmapOverlay?.remove()
    heatmapOverlay = null
    dataList.clear()
  }
  
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    // 🔑 关键修复：使用 post 延迟检查
    post {
      if (parent == null) {
        removeHeatMap()
        aMap = null
      }
    }
  }
}
