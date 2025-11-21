package expo.modules.gaodemap.managers

import android.content.Context
import android.graphics.BitmapFactory
import com.amap.api.maps.AMap
import com.amap.api.maps.LocationSource
import com.amap.api.maps.model.BitmapDescriptorFactory
import com.amap.api.maps.model.MyLocationStyle
import expo.modules.gaodemap.utils.ColorParser
import java.io.File
import java.net.URL

/**
 * UI 和手势管理器
 * 负责地图控件显示、手势控制、图层显示等
 */
class UIManager(private val aMap: AMap, private val context: Context) {
  
  var onLocationChanged: ((latitude: Double, longitude: Double, accuracy: Float) -> Unit)? = null
  
  // ==================== 控件显示 ====================
  
  /**
   * 设置是否显示缩放控件
   */
  fun setShowsZoomControls(show: Boolean) {
    aMap.uiSettings.isZoomControlsEnabled = show
  }
  
  /**
   * 设置是否显示指南针
   */
  fun setShowsCompass(show: Boolean) {
    aMap.uiSettings.isCompassEnabled = show
  }
  
  /**
   * 设置是否显示比例尺
   */
  fun setShowsScale(show: Boolean) {
    aMap.uiSettings.isScaleControlsEnabled = show
  }
  
  // ==================== 手势控制 ====================
  
  /**
   * 设置是否启用缩放手势
   */
  fun setZoomEnabled(enabled: Boolean) {
    aMap.uiSettings.isZoomGesturesEnabled = enabled
  }
  
  /**
   * 设置是否启用滚动手势
   */
  fun setScrollEnabled(enabled: Boolean) {
    aMap.uiSettings.isScrollGesturesEnabled = enabled
  }
  
  /**
   * 设置是否启用旋转手势
   */
  fun setRotateEnabled(enabled: Boolean) {
    aMap.uiSettings.isRotateGesturesEnabled = enabled
  }
  
  /**
   * 设置是否启用倾斜手势
   */
  fun setTiltEnabled(enabled: Boolean) {
    aMap.uiSettings.isTiltGesturesEnabled = enabled
  }
  
  // ==================== 图层显示 ====================
  
  private var currentLocationStyle: MyLocationStyle? = null
  
  /**
   * 设置是否显示用户位置
   */
  fun setShowsUserLocation(show: Boolean, followUserLocation: Boolean = false) {
    if (show) {
      if (currentLocationStyle == null) {
        currentLocationStyle = MyLocationStyle()
      }
      val locationType = if (followUserLocation) {
        MyLocationStyle.LOCATION_TYPE_FOLLOW
      } else {
        MyLocationStyle.LOCATION_TYPE_SHOW
      }
      currentLocationStyle?.myLocationType(locationType)
      aMap.myLocationStyle = currentLocationStyle
      
      // 设置定位监听
      aMap.setLocationSource(object : LocationSource {
        override fun activate(listener: LocationSource.OnLocationChangedListener?) {
          // 高德地图会自动处理定位，我们只需要监听位置变化
        }
        override fun deactivate() {}
      })
      
      // 监听定位变化
      aMap.setOnMyLocationChangeListener { location ->
        onLocationChanged?.invoke(
          location.latitude,
          location.longitude,
          location.accuracy
        )
      }
      
      aMap.isMyLocationEnabled = true
    } else {
      aMap.setOnMyLocationChangeListener(null)
      aMap.isMyLocationEnabled = false
    }
  }
  
  /**
   * 设置用户位置样式
   * 统一 iOS 和 Android 的 API
   */
  fun setUserLocationRepresentation(config: Map<String, Any>) {
    if (currentLocationStyle == null) {
      currentLocationStyle = MyLocationStyle()
    }
    
    val style = currentLocationStyle!!
    
    // 精度圈边线颜色 (strokeColor)
    config["strokeColor"]?.let {
      style.strokeColor(ColorParser.parseColor(it))
    }
    
    // 精度圈填充颜色 (fillColor)
    config["fillColor"]?.let {
      style.radiusFillColor(ColorParser.parseColor(it))
    }
    
    // 精度圈边线宽度 (lineWidth)
    (config["lineWidth"] as? Number)?.let {
      style.strokeWidth(it.toFloat())
    }
    
    // 是否显示精度圈 (showsAccuracyRing)
    (config["showsAccuracyRing"] as? Boolean)?.let { showRing ->
      if (!showRing) {
        // 不显示精度圈，但要显示蓝点
        style.radiusFillColor(android.graphics.Color.TRANSPARENT)
        style.strokeColor(android.graphics.Color.TRANSPARENT)
      }
    }
    
    // 自定义图标 (image)
    (config["image"] as? String)?.let { imagePath ->
      
      // 将 dp 转换为 px (与 iOS points 对应)
      val density = context.resources.displayMetrics.density
      val imageWidth = (config["imageWidth"] as? Number)?.let { (it.toFloat() * density).toInt() }
      val imageHeight = (config["imageHeight"] as? Number)?.let { (it.toFloat() * density).toInt() }
      
      // 网络图片需要在后台线程加载
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        Thread {
          try {
            val originalBitmap = BitmapFactory.decodeStream(URL(imagePath).openStream())
            android.os.Handler(android.os.Looper.getMainLooper()).post {
              originalBitmap?.let { bitmap ->
                val scaledBitmap = if (imageWidth != null && imageHeight != null) {
                  android.graphics.Bitmap.createScaledBitmap(bitmap, imageWidth, imageHeight, true)
                } else bitmap
                
                style.myLocationIcon(BitmapDescriptorFactory.fromBitmap(scaledBitmap))
                aMap.myLocationStyle = style
              } ?: android.util.Log.e("UIManager", "网络图片加载失败")
            }
          } catch (e: Exception) {
            android.util.Log.e("UIManager", "加载网络图片异常", e)
          }
        }.start()
      } else {
        // 本地图片也在后台线程加载,避免阻塞主线程
        Thread {
          try {
            val originalBitmap = when {
              imagePath.startsWith("file://") -> {
                BitmapFactory.decodeFile(imagePath.substring(7))
              }
              else -> {
                val resId = context.resources.getIdentifier(
                  imagePath.substringBeforeLast('.'),
                  "drawable",
                  context.packageName
                )
                if (resId != 0) {
                  BitmapFactory.decodeResource(context.resources, resId)
                } else null
              }
            }
            
            android.os.Handler(android.os.Looper.getMainLooper()).post {
              originalBitmap?.let { bitmap ->
                val scaledBitmap = if (imageWidth != null && imageHeight != null) {
                  android.graphics.Bitmap.createScaledBitmap(bitmap, imageWidth, imageHeight, true)
                } else bitmap
                
                style.myLocationIcon(BitmapDescriptorFactory.fromBitmap(scaledBitmap))
                aMap.myLocationStyle = style
              } ?: android.util.Log.e("UIManager", "本地图片加载失败")
            }
          } catch (e: Exception) {
            android.util.Log.e("UIManager", "加载本地图片异常", e)
          }
        }.start()
      }
    }
    
    aMap.myLocationStyle = style
  }
  
  /**
   * 设置是否显示交通路况
   */
  fun setShowsTraffic(show: Boolean) {
    aMap.isTrafficEnabled = show
  }
  
  /**
   * 设置是否显示建筑物
   */
  fun setShowsBuildings(show: Boolean) {
    aMap.showBuildings(show)
  }
  
  /**
   * 设置是否显示室内地图
   */
  fun setShowsIndoorMap(show: Boolean) {
    aMap.showIndoorMap(show)
  }
  
  /**
   * 设置地图类型
   */
  fun setMapType(type: Int) {
    aMap.mapType = when (type) {
      1 -> AMap.MAP_TYPE_SATELLITE  // 卫星地图
      2 -> AMap.MAP_TYPE_NIGHT      // 夜间地图
      3 -> AMap.MAP_TYPE_NAVI       // 导航地图
      4 -> AMap.MAP_TYPE_BUS        // 公交地图
      else -> AMap.MAP_TYPE_NORMAL  // 标准地图
    }
  }
}
