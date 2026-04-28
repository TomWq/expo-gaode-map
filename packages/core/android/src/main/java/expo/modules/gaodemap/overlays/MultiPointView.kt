package expo.modules.gaodemap.overlays

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Handler
import android.os.Looper

import expo.modules.gaodemap.utils.LatLngParser
import com.amap.api.maps.AMap
import com.amap.api.maps.model.BitmapDescriptor
import com.amap.api.maps.model.BitmapDescriptorFactory

import com.amap.api.maps.model.MultiPointItem
import com.amap.api.maps.model.MultiPointOverlay
import com.amap.api.maps.model.MultiPointOverlayOptions
import expo.modules.gaodemap.companion.BitmapDescriptorCache

import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher

import expo.modules.kotlin.views.ExpoView
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread
import androidx.core.graphics.scale

@SuppressLint("ViewConstructor")
class MultiPointView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  private val onMultiPointPress by EventDispatcher()
  private var multiPointOverlay: MultiPointOverlay? = null
  private var aMap: AMap? = null
  private var points: MutableList<MultiPointItem> = mutableListOf()
  
  private var pendingIconUri: String? = null
  private var currentIconDescriptor: BitmapDescriptor? = null
  private val mainHandler = Handler(Looper.getMainLooper())
  
  private var anchorX: Float = 0.5f
  private var anchorY: Float = 0.5f
  
  private var iconWidth: Int? = null
  private var iconHeight: Int? = null
  
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
  fun setPoints(pointsList: List<Any>) {
    points.clear()
    pointsList.forEach { pointData ->
      val latLng = LatLngParser.parseLatLng(pointData)
      if (latLng != null) {
        val multiPointItem = MultiPointItem(latLng)
        // 如果是 Map，尝试获取 ID
        if (pointData is Map<*, *>) {
          val id = pointData["customerId"] as? String ?: pointData["id"] as? String ?: ""
          multiPointItem.customerId = id
        }
        points.add(multiPointItem)
      }
    }
    createOrUpdateMultiPoint()
  }
  
  /**
   * 设置图标
   */
  fun setIcon(iconUri: String?) {
    pendingIconUri = iconUri
    if (iconUri != null) {
        loadAndSetIcon(iconUri)
    } else {
        currentIconDescriptor = null
        createOrUpdateMultiPoint()
    }
  }

  fun setIconWidth(width: Int?) {
    iconWidth = width
    pendingIconUri?.let { loadAndSetIcon(it) }
  }

  fun setIconHeight(height: Int?) {
    iconHeight = height
    pendingIconUri?.let { loadAndSetIcon(it) }
  }
  
  /**
   * 设置锚点
   */
  fun setAnchor(anchor: Map<String, Float>) {
    anchorX = anchor["x"] ?: 0.5f
    anchorY = anchor["y"] ?: 0.5f
    multiPointOverlay?.setAnchor(anchorX, anchorY)
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
        // 使用加载的图标或默认图标
        val icon = currentIconDescriptor ?: BitmapDescriptorFactory.defaultMarker()
        overlayOptions.icon(icon)
        overlayOptions.anchor(anchorX, anchorY)
        
        // 创建海量点覆盖物
        multiPointOverlay = map.addMultiPointOverlay(overlayOptions)
        multiPointOverlay?.items = points
      }
    }
  }

  fun handleMultiPointClick(item: MultiPointItem): Boolean {
      val index = points.indexOfFirst { it.customerId == item.customerId }
      if (index != -1) {
          onMultiPointPress(mapOf(
              "id" to item.customerId, // 兼容旧版
              "customerId" to item.customerId,
              "index" to index, // 添加 index 字段
              "latitude" to item.latLng.latitude,
              "longitude" to item.latLng.longitude
          ))
          return true
      }
      return false
  }

  private fun loadAndSetIcon(iconUri: String) {
      val w = iconWidth ?: 0
      val h = iconHeight ?: 0
      val cacheKey = "multipoint|$iconUri|$w|$h"
      
      // 尝试从缓存获取
      BitmapDescriptorCache.get(cacheKey)?.let {
          currentIconDescriptor = it
          createOrUpdateMultiPoint()
          return
      }

      when {
          iconUri.startsWith("http") -> {
              loadImageFromUrl(iconUri) { bitmap ->
                  processBitmap(bitmap, cacheKey)
              }
          }
          iconUri.startsWith("file://") -> {
              val path = iconUri.substring(7)
              val bitmap = BitmapFactory.decodeFile(path)
              processBitmap(bitmap, cacheKey)
          }
          else -> {
               val resId = context.resources.getIdentifier(iconUri, "drawable", context.packageName)
               if (resId != 0) {
                   val bitmap = BitmapFactory.decodeResource(context.resources, resId)
                   processBitmap(bitmap, cacheKey)
               } else {
                   currentIconDescriptor = null
                   mainHandler.post { createOrUpdateMultiPoint() }
               }
          }
      }
  }

  private fun processBitmap(bitmap: Bitmap?, cacheKey: String) {
      if (bitmap != null) {
          var finalBitmap = bitmap
          if (iconWidth != null || iconHeight != null) {
             var w = iconWidth?.let { dpToPx(it) } ?: 0
             var h = iconHeight?.let { dpToPx(it) } ?: 0
             
             if (w > 0 && h == 0) {
                 h = (bitmap.height * (w.toFloat() / bitmap.width)).toInt()
             } else if (h > 0 && w == 0) {
                 w = (bitmap.width * (h.toFloat() / bitmap.height)).toInt()
             } else if (w == 0 && h == 0) {
                 w = bitmap.width
                 h = bitmap.height
             }
             
             try {
                 finalBitmap = bitmap.scale(w, h)
             } catch (e: Exception) {
                 e.printStackTrace()
             }
          }
          
          val descriptor = BitmapDescriptorFactory.fromBitmap(finalBitmap)
          BitmapDescriptorCache.putDescriptor(cacheKey, descriptor)
          currentIconDescriptor = descriptor
      } else {
          currentIconDescriptor = null
      }
      mainHandler.post { createOrUpdateMultiPoint() }
  }

  private fun dpToPx(dp: Int): Int {
      val density = context.resources.displayMetrics.density
      return (dp * density).toInt()
  }

  private fun loadImageFromUrl(url: String, callback: (Bitmap?) -> Unit) {
      thread {
          var connection: HttpURLConnection? = null
          var inputStream: InputStream? = null
          try {
              val urlConnection = URL(url)
              connection = urlConnection.openConnection() as HttpURLConnection
              connection.connectTimeout = 10000
              connection.readTimeout = 10000
              connection.doInput = true
              connection.connect()

              if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                  inputStream = connection.inputStream
                  val bitmap = BitmapFactory.decodeStream(inputStream)
                  callback(bitmap)
              } else {
                  callback(null)
              }
          } catch (_: Exception) {
              callback(null)
          } finally {
              inputStream?.close()
              connection?.disconnect()
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
