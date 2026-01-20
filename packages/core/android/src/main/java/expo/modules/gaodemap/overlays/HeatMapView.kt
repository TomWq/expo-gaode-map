package expo.modules.gaodemap.overlays

import android.content.Context
import android.os.Looper
import android.util.Log
import com.amap.api.maps.AMap
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.TileOverlay
import com.amap.api.maps.model.TileOverlayOptions
import com.amap.api.maps.model.HeatmapTileProvider
import com.amap.api.maps.CameraUpdateFactory
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import expo.modules.gaodemap.utils.LatLngParser

class HeatMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  private val executor: ExecutorService = Executors.newSingleThreadExecutor()
  private val applyUpdateRunnable = Runnable { applyUpdateOnMain() }
  @Volatile private var updateToken: Int = 0
  @Volatile private var needsRebuild: Boolean = true
  private var visible: Boolean = true

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
    needsRebuild = true
    scheduleUpdate()
  }
  
 

  /**
   * 设置热力图数据
   */
  fun setData(data: List<Any>?) {
    dataList.clear()
    dataList.addAll(LatLngParser.parseLatLngList(data))
    needsRebuild = true
    scheduleUpdate()
  }
  
  /**
   * 设置热力图半径
   */
  fun setRadius(radiusValue: Int) {
    radius = radiusValue
    needsRebuild = true
    scheduleUpdate()
  }
  
  /**
   * 设置透明度
   */
  fun setOpacity(opacityValue: Double) {
    opacity = opacityValue
    applyOverlayOpacity()
  }

  fun setVisible(visibleValue: Boolean) {
    if (!visibleValue) {
      visible = false
      updateToken += 1
      removeCallbacks(applyUpdateRunnable)
      applyOverlayVisibility()
      return
    }

    visible = true
    applyOverlayVisibility()

    if (dataList.isEmpty()) {
      return
    }

    if (heatmapOverlay == null || needsRebuild) {
      scheduleUpdate()
    } else {
      applyOverlayOpacity()
      forceRefresh()
    }
  }

  private fun scheduleUpdate() {
    updateToken += 1
    removeCallbacks(applyUpdateRunnable)
    postDelayed(applyUpdateRunnable, 32)
  }

  private fun applyOverlayVisibility() {
    if (Looper.myLooper() != Looper.getMainLooper()) {
      post { applyOverlayVisibility() }
      return
    }
    val overlay = heatmapOverlay ?: return
    runCatching {
      overlay.javaClass.getMethod("setVisible", Boolean::class.javaPrimitiveType)
        .invoke(overlay, visible)
    }.onFailure {
      if (!visible) {
        overlay.remove()
        heatmapOverlay = null
        needsRebuild = true
      }
    }
  }

  private fun applyOverlayOpacity() {
    if (Looper.myLooper() != Looper.getMainLooper()) {
      post { applyOverlayOpacity() }
      return
    }
    val overlay = heatmapOverlay ?: return
    val opacityValue = opacity.coerceIn(0.0, 1.0)
    val transparency = (1.0 - opacityValue).toFloat()
    runCatching {
      overlay.javaClass.getMethod("setTransparency", Float::class.javaPrimitiveType)
        .invoke(overlay, transparency)
    }
  }

  /**
   * 在主线程应用更新（构建 TileProvider 在后台线程）
   */
  private fun applyUpdateOnMain() {
    if (Looper.myLooper() != Looper.getMainLooper()) {
      post { applyUpdateOnMain() }
      return
    }

    val map = aMap ?: return
    val token = updateToken
    val pointsSnapshot = ArrayList(dataList)
    val radiusValue = radius.coerceIn(10, 200)
    val opacityValue = opacity.coerceIn(0.0, 1.0)

    if (!visible) {
      applyOverlayVisibility()
      return
    }

    if (pointsSnapshot.isEmpty()) {
      heatmapOverlay?.remove()
      heatmapOverlay = null
      return
    }

    if (heatmapOverlay != null && !needsRebuild) {
      applyOverlayVisibility()
      applyOverlayOpacity()
      return
    }

    executor.execute {
      try {
        val provider = HeatmapTileProvider.Builder()
          .data(pointsSnapshot)
          .radius(radiusValue)
          .build()

        post {
          if (token != updateToken) {
            return@post
          }
          if (aMap !== map) {
            return@post
          }
          if (!visible) {
            return@post
          }

          heatmapOverlay?.remove()

          val options = TileOverlayOptions().tileProvider(provider)

          runCatching {
            options.javaClass.getMethod("zIndex", Float::class.javaPrimitiveType)
              .invoke(options, 1f)
          }

          runCatching {
            options.javaClass.getMethod("transparency", Float::class.javaPrimitiveType)
              .invoke(options, (1.0 - opacityValue).toFloat())
          }

          heatmapOverlay = map.addTileOverlay(options)
          needsRebuild = false
          runCatching { heatmapOverlay?.clearTileCache() }
          applyOverlayVisibility()
          applyOverlayOpacity()
          forceRefresh()
        }
      } catch (t: Throwable) {
        Log.e("HeatMapView", "Failed to build heatmap", t)
      }
    }
  }
  
  private fun forceRefresh() {
    runCatching { aMap?.moveCamera(CameraUpdateFactory.zoomBy(0f)) }
  }

  /**
   * 移除热力图
   */
  fun removeHeatMap() {
    updateToken += 1
    removeCallbacks(applyUpdateRunnable)
    heatmapOverlay?.remove()
    heatmapOverlay = null
    dataList.clear()
    needsRebuild = true
  }
  
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    // 🔑 关键修复：使用 post 延迟检查
    post {
      if (parent == null) {
        removeHeatMap()
        aMap = null
        runCatching { executor.shutdownNow() }
      }
    }
  }
}
