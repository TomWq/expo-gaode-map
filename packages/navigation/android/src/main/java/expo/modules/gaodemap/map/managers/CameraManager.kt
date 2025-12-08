package expo.modules.gaodemap.map.managers

import android.graphics.Point
import android.os.Handler
import android.os.Looper
import com.amap.api.maps.AMap
import com.amap.api.maps.CameraUpdateFactory
import com.amap.api.maps.model.CameraPosition
import com.amap.api.maps.model.LatLng

/**
 * 相机控制管理器
 * 负责地图相机位置、缩放、倾斜等操作
 */
class CameraManager(private val aMap: AMap) {
  
  private val mainHandler = Handler(Looper.getMainLooper())
  
  /**
   * 设置最大缩放级别
   */
  fun setMaxZoomLevel(maxZoom: Float) {
    val validZoom = maxZoom.coerceIn(3f, 20f)
    aMap.maxZoomLevel = validZoom
  }
  
  /**
   * 设置最小缩放级别
   */
  fun setMinZoomLevel(minZoom: Float) {
    val validZoom = minZoom.coerceIn(3f, 20f)
    aMap.minZoomLevel = validZoom
  }
  
  /**
   * 设置初始相机位置
   */
  fun setInitialCameraPosition(position: Map<String, Any?>) {
    @Suppress("UNCHECKED_CAST")
    val target = position["target"] as? Map<String, Double>
    val zoom = (position["zoom"] as? Number)?.toFloat() ?: 10f
    val tilt = (position["tilt"] as? Number)?.toFloat() ?: 0f
    val bearing = (position["bearing"] as? Number)?.toFloat() ?: 0f
    
    if (target != null) {
      val lat = target["latitude"] ?: 0.0
      val lng = target["longitude"] ?: 0.0
      
      // 坐标验证
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return
      }
      
      val latLng = LatLng(lat, lng)
      val validZoom = zoom.coerceIn(3f, 20f)
      val validTilt = tilt.coerceIn(0f, 60f)
      
      val cameraPosition = CameraPosition.Builder()
        .target(latLng)
        .zoom(validZoom)
        .tilt(validTilt)
        .bearing(bearing)
        .build()
      
      aMap.moveCamera(CameraUpdateFactory.newCameraPosition(cameraPosition))
    }
  }
  
  /**
   * 移动相机
   */
  fun moveCamera(position: Map<String, Any>, duration: Int) {
    mainHandler.post {
      @Suppress("UNCHECKED_CAST")
      val target = position["target"] as? Map<String, Double>
      val zoom = (position["zoom"] as? Number)?.toFloat()
      val tilt = (position["tilt"] as? Number)?.toFloat()
      val bearing = (position["bearing"] as? Number)?.toFloat()
      
      if (target != null) {
        val lat = target["latitude"] ?: 0.0
        val lng = target["longitude"] ?: 0.0
        
        // 坐标验证
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return@post
        }
        
        val latLng = LatLng(lat, lng)
        
        val builder = CameraPosition.Builder().target(latLng)
        zoom?.let { builder.zoom(it.coerceIn(3f, 20f)) }
        tilt?.let { builder.tilt(it.coerceIn(0f, 60f)) }
        bearing?.let { builder.bearing(it) }
        
        val cameraUpdate = CameraUpdateFactory.newCameraPosition(builder.build())
        
        if (duration > 0) {
          aMap.animateCamera(cameraUpdate, duration.toLong(), null)
        } else {
          aMap.moveCamera(cameraUpdate)
        }
      }
    }
  }
  
  /**
   * 设置地图中心点
   */
  fun setCenter(center: Map<String, Double>, animated: Boolean) {
    val lat = center["latitude"] ?: 0.0
    val lng = center["longitude"] ?: 0.0
    
    // 坐标验证
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return
    }
    
    val latLng = LatLng(lat, lng)
    val cameraUpdate = CameraUpdateFactory.newLatLng(latLng)
    
    if (animated) {
      aMap.animateCamera(cameraUpdate)
    } else {
      aMap.moveCamera(cameraUpdate)
    }
  }
  
  /**
   * 设置地图缩放级别
   */
  fun setZoomLevel(zoom: Float, animated: Boolean) {
    val validZoom = zoom.coerceIn(3f, 20f)
    val cameraUpdate = CameraUpdateFactory.zoomTo(validZoom)
    
    if (animated) {
      aMap.animateCamera(cameraUpdate)
    } else {
      aMap.moveCamera(cameraUpdate)
    }
  }
  
  /**
   * 获取当前相机位置
   */
  fun getCameraPosition(): Map<String, Any> {
    val position = aMap.cameraPosition
    return mapOf(
      "target" to mapOf(
        "latitude" to position.target.latitude,
        "longitude" to position.target.longitude
      ),
      "zoom" to position.zoom,
      "tilt" to position.tilt,
      "bearing" to position.bearing
    )
  }
  
  /**
   * 获取屏幕坐标对应的地理坐标
   */
  fun getLatLng(point: Map<String, Double>): Map<String, Double> {
    val x = (point["x"] ?: 0.0).toInt()
    val y = (point["y"] ?: 0.0).toInt()
    val latLng = aMap.projection.fromScreenLocation(Point(x, y))
    return mapOf(
      "latitude" to latLng.latitude,
      "longitude" to latLng.longitude
    )
  }
}
