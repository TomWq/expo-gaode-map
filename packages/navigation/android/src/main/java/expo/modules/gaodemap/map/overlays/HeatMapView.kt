package expo.modules.gaodemap.map.overlays

import android.content.Context
import android.graphics.Color
import android.os.Looper
import android.util.Log
import com.amap.api.maps.AMap
import com.amap.api.maps.CameraUpdateFactory
import com.amap.api.maps.model.Gradient
import com.amap.api.maps.model.HeatmapTileProvider
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.TileOverlay
import com.amap.api.maps.model.TileOverlayOptions
import com.amap.api.maps.model.WeightedLatLng
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView
import expo.modules.gaodemap.map.utils.LatLngParser
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class HeatMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private companion object {
    const val TAG = "HeatMapView"
  }
  
  private val executor: ExecutorService = Executors.newSingleThreadExecutor()
  private val applyUpdateRunnable = Runnable { applyUpdateOnMain() }
  @Volatile private var updateToken: Int = 0
  @Volatile private var needsRebuild: Boolean = true
  private var visible: Boolean = true

  private var heatmapOverlay: TileOverlay? = null
  private var aMap: AMap? = null
  private var dataList: MutableList<WeightedLatLng> = mutableListOf()
  private var radius: Int = 50
  private var opacity: Double = 0.6
  private var gradient: Gradient? = null
  
  /**
   * 设置地图实例
   */
  @Suppress("unused")
  fun setMap(map: AMap) {
    aMap = map
    needsRebuild = true
    Log.d(TAG, "setMap: map attached")
    scheduleUpdate()
  }
  
 

  /**
   * 设置热力图数据
   */
  fun setData(data: List<Any>?) {
    dataList.clear()
    dataList.addAll(parseWeightedLatLngList(data))
    Log.d(TAG, "setData: raw=${data?.size ?: 0}, parsed=${dataList.size}, ${formatPointStats(dataList)}")
    needsRebuild = true
    scheduleUpdate()
  }
  
  /**
   * 设置热力图半径
   */
  fun setRadius(radiusValue: Int) {
    radius = radiusValue
    Log.d(TAG, "setRadius: $radiusValue")
    needsRebuild = true
    scheduleUpdate()
  }
  
  /**
   * 设置透明度
   */
  fun setOpacity(opacityValue: Double) {
    opacity = opacityValue
    Log.d(TAG, "setOpacity: $opacityValue")
    needsRebuild = true
    scheduleUpdate()
  }

  fun setGradient(gradientValue: Map<String, Any>?) {
    gradient = parseGradient(gradientValue)
    Log.d(TAG, "setGradient: hasGradient=${gradient != null}, raw=${gradientValue != null}")
    needsRebuild = true
    scheduleUpdate()
  }

  fun setVisible(visibleValue: Boolean) {
    Log.d(TAG, "setVisible: $visibleValue, points=${dataList.size}, hasOverlay=${heatmapOverlay != null}, needsRebuild=$needsRebuild")
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
    Log.d(TAG, "scheduleUpdate: token=$updateToken, mapAttached=${aMap != null}, visible=$visible, points=${dataList.size}")
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
    val latLngSnapshot = pointsSnapshot.map { it.latLng }
    val radiusValue = radius.coerceIn(10, 200)
    val opacityValue = opacity.coerceIn(0.0, 1.0)
    val gradientValue = gradient
    Log.d(TAG, "applyUpdate: token=$token, visible=$visible, points=${pointsSnapshot.size}, radius=$radiusValue, opacity=$opacityValue, gradient=${gradientValue != null}, ${formatPointStats(pointsSnapshot)}")

    if (!visible) {
      applyOverlayVisibility()
      return
    }

    if (pointsSnapshot.isEmpty()) {
      Log.w(TAG, "applyUpdate: no valid heatmap points, removing overlay")
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
        val builder = HeatmapTileProvider.Builder()
          .data(latLngSnapshot)
          .radius(radiusValue)

        gradientValue?.let { builder.gradient(it) }

        val provider = builder.build()

        post {
          if (token != updateToken) {
            Log.d(TAG, "addOverlay skipped: stale token=$token, current=$updateToken")
            return@post
          }
          if (aMap !== map) {
            Log.d(TAG, "addOverlay skipped: map instance changed")
            return@post
          }
          if (!visible) {
            Log.d(TAG, "addOverlay skipped: hidden")
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
          Log.i(TAG, "addOverlay success: id=${runCatching { heatmapOverlay?.id }.getOrNull()}, points=${pointsSnapshot.size}, radius=$radiusValue, opacity=$opacityValue")
        }
      } catch (t: Throwable) {
        Log.e(TAG, "Failed to build heatmap", t)
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
    Log.d(TAG, "removeHeatMap")
    heatmapOverlay?.remove()
    heatmapOverlay = null
    dataList.clear()
    needsRebuild = true
  }

  private fun parseWeightedLatLngList(data: Any?): List<WeightedLatLng> {
    if (data == null || data !is List<*>) return emptyList()

    val result = mutableListOf<WeightedLatLng>()
    for (item in data) {
      val point = parseWeightedLatLng(item)
      if (point != null) {
        result.add(point)
      } else if (item is List<*>) {
        result.addAll(parseWeightedLatLngList(item))
      }
    }
    return result
  }

  private fun parseWeightedLatLng(data: Any?): WeightedLatLng? {
    val latLng = LatLngParser.parseLatLng(data) ?: return null
    val intensity = when (data) {
      is Map<*, *> -> listOf(data["intensity"], data["weight"], data["count"], data["value"])
        .firstOrNull { it is Number }
      is List<*> -> data.getOrNull(2)
      else -> null
    }
    val weight = ((intensity as? Number)?.toDouble() ?: 1.0).takeIf { it.isFinite() && it > 0.0 } ?: 1.0
    return WeightedLatLng(latLng, weight)
  }

  private fun parseGradient(gradientValue: Map<String, Any>?): Gradient? {
    if (gradientValue == null) return null
    val rawColors = gradientValue["colors"] as? List<*> ?: return null
    val rawStartPoints = gradientValue["startPoints"] as? List<*> ?: return null
    if (rawColors.size < 2 || rawColors.size != rawStartPoints.size) {
      Log.w(TAG, "parseGradient ignored: colors=${rawColors.size}, startPoints=${rawStartPoints.size}")
      return null
    }

    val colors = IntArray(rawColors.size)
    val startPoints = FloatArray(rawStartPoints.size)
    for (index in rawColors.indices) {
      val color = parseColor(rawColors[index]) ?: run {
        Log.w(TAG, "parseGradient ignored: invalid color at index=$index, value=${rawColors[index]}")
        return null
      }
      val startPoint = (rawStartPoints[index] as? Number)?.toFloat() ?: run {
        Log.w(TAG, "parseGradient ignored: invalid startPoint at index=$index, value=${rawStartPoints[index]}")
        return null
      }
      colors[index] = color
      startPoints[index] = startPoint.coerceIn(0f, 1f)
    }
    return Gradient(colors, startPoints)
  }

  private fun parseColor(value: Any?): Int? {
    return when (value) {
      is Number -> value.toInt()
      is String -> runCatching { Color.parseColor(value) }.getOrNull()
      else -> null
    }
  }

  private fun formatPointStats(points: List<WeightedLatLng>): String {
    if (points.isEmpty()) return "bounds=empty"
    var minLat = Double.POSITIVE_INFINITY
    var maxLat = Double.NEGATIVE_INFINITY
    var minLng = Double.POSITIVE_INFINITY
    var maxLng = Double.NEGATIVE_INFINITY
    var totalIntensity = 0.0
    points.forEach { point ->
      val latLng: LatLng = point.latLng
      minLat = minOf(minLat, latLng.latitude)
      maxLat = maxOf(maxLat, latLng.latitude)
      minLng = minOf(minLng, latLng.longitude)
      maxLng = maxOf(maxLng, latLng.longitude)
      totalIntensity += point.intensity
    }
    return "bounds=[$minLat,$minLng]-[$maxLat,$maxLng], totalIntensity=$totalIntensity"
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
