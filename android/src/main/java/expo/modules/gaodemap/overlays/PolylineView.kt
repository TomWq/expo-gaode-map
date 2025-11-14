package expo.modules.gaodemap.overlays

import android.content.Context
import android.graphics.Color
import com.amap.api.maps.AMap
import com.amap.api.maps.model.BitmapDescriptorFactory
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.Polyline
import com.amap.api.maps.model.PolylineOptions
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.net.URL

class PolylineView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  private val onPress by EventDispatcher()
  
  private var polyline: Polyline? = null
  private var aMap: AMap? = null
  private var points: List<LatLng> = emptyList()
  private var textureUrl: String? = null
  
  /**
   * 设置地图实例
   */
  @Suppress("unused")
  fun setMap(map: AMap) {
    aMap = map
    createOrUpdatePolyline()
  }
  
  /**
   * 设置折线点集合
   */
  fun setPoints(pointsList: List<Map<String, Double>>) {
    points = pointsList.mapNotNull { point ->
      val lat = point["latitude"]
      val lng = point["longitude"]
      if (lat != null && lng != null) {
        LatLng(lat, lng)
      } else null
    }
    polyline?.let {
      it.points = points
    } ?: createOrUpdatePolyline()
  }
  
  /**
   * 设置线宽
   */
  fun setStrokeWidth(width: Float) {
    polyline?.let {
      it.width = width
    } ?: createOrUpdatePolyline()
  }
  
  /**
   * 设置线条颜色
   */
  fun setStrokeColor(color: Int) {
    polyline?.let {
      it.color = color
    } ?: createOrUpdatePolyline()
  }
  
  /**
   * 设置是否虚线
   */
  fun setDashed(dashed: Boolean) {
    polyline?.let {
      it.isDottedLine = dashed
    } ?: createOrUpdatePolyline()
  }
  
  /**
   * 设置是否使用渐变色
   */
  fun setGradient(gradient: Boolean) {
    polyline?.let {
      it.isGeodesic = gradient
    } ?: createOrUpdatePolyline()
  }
  
  /**
   * 设置 z-index
   */
  fun setZIndex(zIndex: Float) {
    polyline?.let {
      it.zIndex = zIndex
    } ?: createOrUpdatePolyline()
  }
  
  /**
   * 设置透明度
   */
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
  
  /**
   * 创建或更新折线
   */
  private fun createOrUpdatePolyline() {
    aMap?.let { map ->
      // 移除旧折线
      polyline?.remove()
      polyline = null
      
      if (points.isNotEmpty()) {
        val options = PolylineOptions()
          .addAll(points)
          .width(10f)
          .color(Color.BLUE)
        
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
                }
              }
            }
          } catch (e: Exception) {
            e.printStackTrace()
          }
        }
        
        polyline = map.addPolyline(options)
        
        map.setOnPolylineClickListener { clickedPolyline ->
          if (clickedPolyline == polyline) {
            onPress(mapOf("id" to clickedPolyline.id))
          }
        }
      }
    }
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
    removePolyline()
  }
}
