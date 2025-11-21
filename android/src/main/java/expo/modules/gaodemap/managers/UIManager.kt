package expo.modules.gaodemap.managers

import android.content.Context
import android.graphics.BitmapFactory
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager as AndroidLocationManager
import android.os.Bundle
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
class UIManager(private val aMap: AMap, private val context: Context) : LocationListener {
  
  var onLocationChanged: ((latitude: Double, longitude: Double, accuracy: Float) -> Unit)? = null
  
  private var locationManager: AndroidLocationManager? = null
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
    android.util.Log.d("UIManager", "🔵 setShowsUserLocation: show=$show, follow=$followUserLocation")
    
    if (show) {
      // 创建默认的定位样式
      if (currentLocationStyle == null) {
        currentLocationStyle = MyLocationStyle().apply {
          // 根据是否跟随设置定位类型
          val locationType = if (followUserLocation) {
            MyLocationStyle.LOCATION_TYPE_FOLLOW  // 连续定位并跟随
          } else {
            MyLocationStyle.LOCATION_TYPE_LOCATION_ROTATE  // 连续定位，点会旋转
          }
          myLocationType(locationType)
          interval(2000)  // 2秒定位一次
          showMyLocation(true)
        }
        android.util.Log.d("UIManager", "✨ 创建默认 MyLocationStyle")
      } else {
        // 更新定位类型
        val locationType = if (followUserLocation) {
          MyLocationStyle.LOCATION_TYPE_FOLLOW
        } else {
          MyLocationStyle.LOCATION_TYPE_LOCATION_ROTATE
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
      android.util.Log.d("UIManager", "✅ 定位已启用")
      
    } else {
      aMap.setOnMyLocationChangeListener(null)
      aMap.isMyLocationEnabled = false
      android.util.Log.d("UIManager", "❌ 定位已禁用")
    }
  }
  
  /**
   * 启动真实的系统定位
   */
  private fun startRealLocation() {
    try {
      if (locationManager == null) {
        locationManager = context.getSystemService(Context.LOCATION_SERVICE) as AndroidLocationManager
      }
      
      val providers = locationManager?.getProviders(true) ?: emptyList()
      android.util.Log.d("UIManager", "📡 可用的定位提供者: $providers")
      
      // 优先使用 GPS，其次是网络定位
      val provider = when {
        providers.contains(AndroidLocationManager.GPS_PROVIDER) -> {
          android.util.Log.d("UIManager", "✅ 使用 GPS 定位")
          AndroidLocationManager.GPS_PROVIDER
        }
        providers.contains(AndroidLocationManager.NETWORK_PROVIDER) -> {
          android.util.Log.d("UIManager", "✅ 使用网络定位")
          AndroidLocationManager.NETWORK_PROVIDER
        }
        else -> {
          android.util.Log.e("UIManager", "❌ 没有可用的定位提供者")
          return
        }
      }
      
      // 请求位置更新
      locationManager?.requestLocationUpdates(
        provider,
        2000L,  // 最小时间间隔 2秒
        10f,    // 最小距离变化 10米
        this
      )
      
      // 立即获取最后已知位置
      val lastLocation = locationManager?.getLastKnownLocation(provider)
      if (lastLocation != null) {
        android.util.Log.d("UIManager", "📍 获取到最后已知位置: ${lastLocation.latitude}, ${lastLocation.longitude}")
        onLocationChanged(lastLocation)
      } else {
        android.util.Log.d("UIManager", "⏳ 等待首次定位...")
      }
      
    } catch (e: SecurityException) {
      android.util.Log.e("UIManager", "❌ 定位权限未授予: ${e.message}")
    } catch (e: Exception) {
      android.util.Log.e("UIManager", "❌ 启动定位失败: ${e.message}", e)
    }
  }
  
  /**
   * 停止系统定位
   */
  private fun stopRealLocation() {
    try {
      locationManager?.removeUpdates(this)
      android.util.Log.d("UIManager", "🛑 已停止系统定位")
    } catch (e: Exception) {
      android.util.Log.e("UIManager", "停止定位失败: ${e.message}")
    }
  }
  
  /**
   * 位置变化回调
   */
  override fun onLocationChanged(location: Location) {
    android.util.Log.d("UIManager", "📍📍📍 系统定位回调: lat=${location.latitude}, lng=${location.longitude}, accuracy=${location.accuracy}m")
    
    // 通知高德地图
    locationChangedListener?.onLocationChanged(location)
    
    // 通知 React Native
    onLocationChanged?.invoke(
      location.latitude,
      location.longitude,
      location.accuracy
    )
  }
  
  override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {
    android.util.Log.d("UIManager", "定位状态变化: provider=$provider, status=$status")
  }
  
  override fun onProviderEnabled(provider: String) {
    android.util.Log.d("UIManager", "✅ 定位提供者已启用: $provider")
  }
  
  override fun onProviderDisabled(provider: String) {
    android.util.Log.d("UIManager", "❌ 定位提供者已禁用: $provider")
  }
  
  /**
   * 设置用户位置样式
   * 统一 iOS 和 Android 的 API
   */
  fun setUserLocationRepresentation(config: Map<String, Any>) {
    android.util.Log.d("UIManager", "🎨 setUserLocationRepresentation 被调用，配置: $config")
    
    if (currentLocationStyle == null) {
      currentLocationStyle = MyLocationStyle().apply {
        myLocationType(MyLocationStyle.LOCATION_TYPE_LOCATION_ROTATE)
        interval(2000)
        showMyLocation(true)
      }
      android.util.Log.d("UIManager", "创建新的 MyLocationStyle")
    }
    
    val style = currentLocationStyle!!
    
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
    
    // 自定义图标 (image)
    val imagePath = config["image"] as? String
    if (imagePath != null && imagePath.isNotEmpty()) {
      android.util.Log.d("UIManager", "开始加载自定义定位图标: $imagePath")
      
      // 将 dp 转换为 px (与 iOS points 对应)
      val density = context.resources.displayMetrics.density
      val imageWidth = (config["imageWidth"] as? Number)?.let { (it.toFloat() * density).toInt() }
      val imageHeight = (config["imageHeight"] as? Number)?.let { (it.toFloat() * density).toInt() }
      
      android.util.Log.d("UIManager", "图标尺寸: width=$imageWidth, height=$imageHeight, density=$density")
      
      // 网络图片需要在后台线程加载
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        Thread {
          try {
            val originalBitmap = BitmapFactory.decodeStream(URL(imagePath).openStream())
            android.os.Handler(android.os.Looper.getMainLooper()).post {
              if (originalBitmap != null) {
                val scaledBitmap = if (imageWidth != null && imageHeight != null) {
                  android.graphics.Bitmap.createScaledBitmap(originalBitmap, imageWidth, imageHeight, true)
                } else originalBitmap
                
                android.util.Log.d("UIManager", "✅ 网络图片加载成功 (${scaledBitmap.width}x${scaledBitmap.height})，应用到定位样式")
                style.myLocationIcon(BitmapDescriptorFactory.fromBitmap(scaledBitmap))
                
                // 重新应用样式并确保定位开启
                aMap.myLocationStyle = style
                
                // 如果定位没开，重新开启
                if (!aMap.isMyLocationEnabled) {
                  android.util.Log.d("UIManager", "⚠️ 定位未启用，重新启用")
                  aMap.isMyLocationEnabled = true
                }
                
                android.util.Log.d("UIManager", "✅ 定位样式重新应用完成，定位状态: ${aMap.isMyLocationEnabled}")
              } else {
                android.util.Log.e("UIManager", "❌ 网络图片加载失败: bitmap is null")
              }
            }
          } catch (e: Exception) {
            android.util.Log.e("UIManager", "❌ 加载网络图片异常: ${e.message}", e)
          }
        }.start()
        return // 异步加载，提前返回
      } else {
        // 本地图片在后台线程加载
        Thread {
          try {
            val originalBitmap = when {
              imagePath.startsWith("file://") -> {
                android.util.Log.d("UIManager", "加载文件路径图片: ${imagePath.substring(7)}")
                BitmapFactory.decodeFile(imagePath.substring(7))
              }
              else -> {
                // 尝试从资源加载
                val fileName = imagePath.substringBeforeLast('.')
                android.util.Log.d("UIManager", "尝试从资源加载: $fileName")
                val resId = context.resources.getIdentifier(
                  fileName,
                  "drawable",
                  context.packageName
                )
                android.util.Log.d("UIManager", "资源 ID: $resId")
                if (resId != 0) {
                  BitmapFactory.decodeResource(context.resources, resId)
                } else {
                  // 尝试直接作为文件路径
                  android.util.Log.d("UIManager", "尝试作为文件路径加载: $imagePath")
                  BitmapFactory.decodeFile(imagePath)
                }
              }
            }
            
            android.os.Handler(android.os.Looper.getMainLooper()).post {
              if (originalBitmap != null) {
                val scaledBitmap = if (imageWidth != null && imageHeight != null) {
                  android.graphics.Bitmap.createScaledBitmap(originalBitmap, imageWidth, imageHeight, true)
                } else originalBitmap
                
                android.util.Log.d("UIManager", "✅ 本地图片加载成功 (${scaledBitmap.width}x${scaledBitmap.height})，应用到定位样式")
                style.myLocationIcon(BitmapDescriptorFactory.fromBitmap(scaledBitmap))
                
                // 重新应用样式并确保定位开启
                aMap.myLocationStyle = style
                
                // 如果定位没开，重新开启
                if (!aMap.isMyLocationEnabled) {
                  android.util.Log.d("UIManager", "⚠️ 定位未启用，重新启用")
                  aMap.isMyLocationEnabled = true
                }
                
                android.util.Log.d("UIManager", "✅ 定位样式重新应用完成，定位状态: ${aMap.isMyLocationEnabled}")
              } else {
                android.util.Log.e("UIManager", "❌ 本地图片加载失败: bitmap is null, path=$imagePath")
              }
            }
          } catch (e: Exception) {
            android.util.Log.e("UIManager", "❌ 加载本地图片异常: ${e.message}", e)
          }
        }.start()
        return // 异步加载，提前返回
      }
    } else {
      // 没有自定义图标，使用默认蓝点
      android.util.Log.d("UIManager", "使用默认定位图标（蓝点）")
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
}
