package expo.modules.gaodemap.managers

import android.content.Context
import android.graphics.BitmapFactory
import android.location.Location
import android.location.LocationListener
import android.os.Bundle
import com.amap.api.maps.AMap
import com.amap.api.maps.LocationSource
import com.amap.api.maps.model.BitmapDescriptorFactory
import com.amap.api.maps.model.MyLocationStyle
import expo.modules.gaodemap.utils.ColorParser
import java.net.URL
import androidx.core.graphics.scale

/**
 * UI 和手势管理器
 * 负责地图控件显示、手势控制、图层显示等
 */
class UIManager(private val aMap: AMap, private val context: Context) : LocationListener {
  
  var onLocationChanged: ((latitude: Double, longitude: Double, accuracy: Float) -> Unit)? = null
  
  private var locationChangedListener: LocationSource.OnLocationChangedListener? = null
  
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
      // 创建默认的定位样式
      if (currentLocationStyle == null) {
        currentLocationStyle = MyLocationStyle().apply {
          // 根据是否跟随设置定位类型
          val locationType = if (followUserLocation) {
            MyLocationStyle.LOCATION_TYPE_FOLLOW  // 连续定位并跟随
          } else {
            MyLocationStyle.LOCATION_TYPE_SHOW  // 只显示定位点，不跟随
          }
          myLocationType(locationType)
          interval(2000)  // 2秒定位一次
          showMyLocation(true)
        }
      } else {
        // 更新定位类型
        val locationType = if (followUserLocation) {
          MyLocationStyle.LOCATION_TYPE_FOLLOW
        } else {
          MyLocationStyle.LOCATION_TYPE_SHOW
        }
        currentLocationStyle?.apply {
          myLocationType(locationType)
          interval(2000)
        }
      }
      
      // 监听定位变化（用于通知 React Native）
      aMap.setOnMyLocationChangeListener { location ->
        onLocationChanged?.invoke(
          location.latitude,
          location.longitude,
          location.accuracy
        )
      }
      
      // 应用定位样式
      aMap.myLocationStyle = currentLocationStyle
      
      // 启用定位（使用高德地图自己的定位）
      aMap.isMyLocationEnabled = true
      
    } else {
      aMap.setOnMyLocationChangeListener(null)
      aMap.isMyLocationEnabled = false
    }
  }
  

  /**
   * 位置变化回调
   */
  override fun onLocationChanged(location: Location) {
    locationChangedListener?.onLocationChanged(location)
    
    // 通知 React Native
    onLocationChanged?.invoke(
      location.latitude,
      location.longitude,
      location.accuracy
    )
  }
  
  @Deprecated("Deprecated in Java")
  override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {
  }
  
  override fun onProviderEnabled(provider: String) {
  }
  
  override fun onProviderDisabled(provider: String) {
  }
  
  /**
   * 设置用户位置样式
   * 统一 iOS 和 Android 的 API
   */
  fun setUserLocationRepresentation(config: Map<String, Any>) {
    if (currentLocationStyle == null) {
      currentLocationStyle = MyLocationStyle().apply {
        myLocationType(MyLocationStyle.LOCATION_TYPE_LOCATION_ROTATE)
        interval(2000)
        showMyLocation(true)
      }
    }
    
    val style = currentLocationStyle!!
    
    // 定位蓝点展现模式 (locationType) - Android 支持8种模式
    val locationType = config["locationType"] as? String
    if (locationType != null) {
      val locationTypeValue = when (locationType) {
        "SHOW" -> MyLocationStyle.LOCATION_TYPE_SHOW
        "LOCATE" -> MyLocationStyle.LOCATION_TYPE_LOCATE
        "FOLLOW" -> MyLocationStyle.LOCATION_TYPE_FOLLOW
        "MAP_ROTATE" -> MyLocationStyle.LOCATION_TYPE_MAP_ROTATE
        "LOCATION_ROTATE" -> MyLocationStyle.LOCATION_TYPE_LOCATION_ROTATE
        "LOCATION_ROTATE_NO_CENTER" -> MyLocationStyle.LOCATION_TYPE_LOCATION_ROTATE_NO_CENTER
        "FOLLOW_NO_CENTER" -> MyLocationStyle.LOCATION_TYPE_FOLLOW_NO_CENTER
        "MAP_ROTATE_NO_CENTER" -> MyLocationStyle.LOCATION_TYPE_MAP_ROTATE_NO_CENTER
        else -> MyLocationStyle.LOCATION_TYPE_LOCATION_ROTATE // 默认值
      }
      style.myLocationType(locationTypeValue)
    }
    
    // 是否显示定位蓝点 (showMyLocation) - Android 5.1.0+ 支持
    // 注意：这个属性在 iOS 中没有对应项，是 Android 特有的
    val showMyLocation = config["showMyLocation"] as? Boolean
    if (showMyLocation != null) {
      style.showMyLocation(showMyLocation)
    }
    
    // 是否显示精度圈 (showsAccuracyRing) - 先处理这个，设置默认值
    val showsAccuracyRing = config["showsAccuracyRing"] as? Boolean ?: true
    if (!showsAccuracyRing) {
      // 不显示精度圈 - 设置透明色
      style.radiusFillColor(android.graphics.Color.TRANSPARENT)
      style.strokeColor(android.graphics.Color.TRANSPARENT)
      style.strokeWidth(0f)
    } else {
      // 显示精度圈 - 使用自定义颜色或默认值
      
      // 精度圈填充颜色 (fillColor)
      config["fillColor"]?.let {
        style.radiusFillColor(ColorParser.parseColor(it))
      }
      
      // 精度圈边线颜色 (strokeColor)
      config["strokeColor"]?.let {
        style.strokeColor(ColorParser.parseColor(it))
      }
      
      // 精度圈边线宽度 (lineWidth)
      (config["lineWidth"] as? Number)?.let {
        style.strokeWidth(it.toFloat())
      }
    }
    
    // 定位图标锚点 (anchor) - Android 支持
    val anchorU = config["anchorU"] as? Number
    val anchorV = config["anchorV"] as? Number
    if (anchorU != null && anchorV != null) {
      style.anchor(anchorU.toFloat(), anchorV.toFloat())
    }
    
    // 自定义图标 (image)
    val imagePath = config["image"] as? String
    if (imagePath != null && imagePath.isNotEmpty()) {
      val density = context.resources.displayMetrics.density
      val imageWidth = (config["imageWidth"] as? Number)?.let { (it.toFloat() * density).toInt() }
      val imageHeight = (config["imageHeight"] as? Number)?.let { (it.toFloat() * density).toInt() }
      
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        Thread {
          try {
            val originalBitmap = BitmapFactory.decodeStream(URL(imagePath).openStream())
            android.os.Handler(android.os.Looper.getMainLooper()).post {
              if (originalBitmap != null) {
                val scaledBitmap = if (imageWidth != null && imageHeight != null) {
                    originalBitmap.scale(imageWidth, imageHeight)
                } else originalBitmap
                
                style.myLocationIcon(BitmapDescriptorFactory.fromBitmap(scaledBitmap))
                
                // 重新应用样式并确保定位开启
                aMap.myLocationStyle = style
                
                // 如果定位没开，重新开启
                if (!aMap.isMyLocationEnabled) {
                  aMap.isMyLocationEnabled = true
                }
              }
            }
          } catch (_: Exception) {
            // 忽略异常
          }
        }.start()
        return // 异步加载，提前返回
      } else {
        // 本地图片在后台线程加载
        Thread {
          try {
            val originalBitmap = when {
              imagePath.startsWith("file://") -> {
                BitmapFactory.decodeFile(imagePath.substring(7))
              }
              else -> {
                val fileName = imagePath.substringBeforeLast('.')
                val resId = context.resources.getIdentifier(
                  fileName,
                  "drawable",
                  context.packageName
                )
                if (resId != 0) {
                  BitmapFactory.decodeResource(context.resources, resId)
                } else {
                  BitmapFactory.decodeFile(imagePath)
                }
              }
            }
            
            android.os.Handler(android.os.Looper.getMainLooper()).post {
              if (originalBitmap != null) {
                val scaledBitmap = if (imageWidth != null && imageHeight != null) {
                    originalBitmap.scale(imageWidth, imageHeight)
                } else originalBitmap
                
                style.myLocationIcon(BitmapDescriptorFactory.fromBitmap(scaledBitmap))
                
                // 重新应用样式并确保定位开启
                aMap.myLocationStyle = style
                
                // 如果定位没开，重新开启
                if (!aMap.isMyLocationEnabled) {
                  aMap.isMyLocationEnabled = true
                }
              }
            }
          } catch (_: Exception) {
            // 忽略异常
          }
        }.start()
        return // 异步加载，提前返回
      }
    }
    
    // 立即应用样式（针对没有自定义图标的情况）
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
  
  // ==================== 自定义地图样式 ====================
  
  /**
   * 设置自定义地图样式
   * @param styleData 样式数据，支持以下格式：
   *   - styleId: String - 在线样式ID（从高德开放平台获取）
   *   - styleDataPath: String - 本地样式文件路径
   *   - extraStyleDataPath: String - 额外样式文件路径（可选）
   */
  fun setCustomMapStyle(styleData: Map<String, Any>) {
    // 在线样式 ID
    val styleId = styleData["styleId"] as? String
    if (!styleId.isNullOrEmpty()) {
      val options = com.amap.api.maps.model.CustomMapStyleOptions()
      options.isEnable = true
      options.styleId = styleId
      aMap.setCustomMapStyle(options)
      return
    }
    
    // 本地样式文件
    val styleDataPath = styleData["styleDataPath"] as? String
    if (!styleDataPath.isNullOrEmpty()) {
      val options = com.amap.api.maps.model.CustomMapStyleOptions()
      options.isEnable = true
      options.styleDataPath = styleDataPath
      
      // 额外样式文件（可选）
      val extraPath = styleData["extraStyleDataPath"] as? String
      if (!extraPath.isNullOrEmpty()) {
        options.styleExtraPath = extraPath
      }
      
      aMap.setCustomMapStyle(options)
      return
    }
    
    // 如果没有提供任何样式，禁用自定义样式
    val options = com.amap.api.maps.model.CustomMapStyleOptions()
    options.isEnable = false
    aMap.setCustomMapStyle(options)
  }
}
