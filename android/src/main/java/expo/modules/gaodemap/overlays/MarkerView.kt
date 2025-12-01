package expo.modules.gaodemap.overlays

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.os.Handler
import android.os.Looper
import android.view.View
import com.amap.api.maps.AMap
import com.amap.api.maps.model.BitmapDescriptorFactory
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.Marker
import com.amap.api.maps.model.MarkerOptions
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.File
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class MarkerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  init {
    // 不可交互,通过父视图定位到屏幕外
    isClickable = false
    isFocusable = false
    // 设置为水平方向（默认），让子视图自然布局
    orientation = HORIZONTAL
  }
  
  override fun generateDefaultLayoutParams(): android.widget.LinearLayout.LayoutParams {
    return android.widget.LinearLayout.LayoutParams(
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
      android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
    )
  }
  
  override fun generateLayoutParams(attrs: android.util.AttributeSet?): android.widget.LinearLayout.LayoutParams {
    return android.widget.LinearLayout.LayoutParams(context, attrs)
  }
  
  override fun generateLayoutParams(lp: android.view.ViewGroup.LayoutParams?): android.widget.LinearLayout.LayoutParams {
    return when (lp) {
      is android.widget.LinearLayout.LayoutParams -> lp
      is android.view.ViewGroup.MarginLayoutParams -> android.widget.LinearLayout.LayoutParams(lp)
      else -> android.widget.LinearLayout.LayoutParams(
        lp?.width ?: android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
        lp?.height ?: android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
      )
    }
  }
  
  override fun checkLayoutParams(p: android.view.ViewGroup.LayoutParams?): Boolean {
    return p is android.widget.LinearLayout.LayoutParams
  }
  
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val selfParams = this.layoutParams
    if (selfParams == null || selfParams !is android.widget.LinearLayout.LayoutParams) {
      val width = if (customViewWidth > 0) {
        customViewWidth
      } else if (selfParams != null && selfParams.width > 0) {
        selfParams.width
      } else {
        android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
      }
      
      val height = if (customViewHeight > 0) {
        customViewHeight
      } else if (selfParams != null && selfParams.height > 0) {
        selfParams.height
      } else {
        android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
      }
      
      this.layoutParams = android.widget.LinearLayout.LayoutParams(width, height)
    }
    
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      val params = child.layoutParams
      if (params == null || params !is android.widget.LinearLayout.LayoutParams) {
        child.layoutParams = android.widget.LinearLayout.LayoutParams(
          params?.width ?: android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
          params?.height ?: android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        )
      }
    }
    
    try {
      super.onMeasure(widthMeasureSpec, heightMeasureSpec)
    } catch (e: Exception) {
      throw e
    }
  }
  
  private val onMarkerPress by EventDispatcher()
  private val onMarkerDragStart by EventDispatcher()
  private val onMarkerDrag by EventDispatcher()
  private val onMarkerDragEnd by EventDispatcher()
  
  internal var marker: Marker? = null
  private var aMap: AMap? = null
  private var pendingPosition: LatLng? = null
  private var pendingLatitude: Double? = null  // 临时存储纬度
  private var pendingLongitude: Double? = null  // 临时存储经度
  private var iconWidth: Int = 0  // 用于自定义图标的宽度
  private var iconHeight: Int = 0  // 用于自定义图标的高度
  private var customViewWidth: Int = 0  // 用于自定义视图（children）的宽度
  private var customViewHeight: Int = 0  // 用于自定义视图（children）的高度
  private val mainHandler = Handler(Looper.getMainLooper())
  private var isRemoving = false  // 标记是否正在被移除
  
  // 缓存属性，在 marker 创建前保存
  private var pendingTitle: String? = null
  private var pendingSnippet: String? = null
  private var pendingDraggable: Boolean? = null
  private var pendingOpacity: Float? = null
  private var pendingFlat: Boolean? = null
  private var pendingZIndex: Float? = null
  private var pendingAnchor: Pair<Float, Float>? = null
  private var pendingIconUri: String? = null
  private var pendingPinColor: String? = null
  
  /**
   * 设置地图实例
   */
  @Suppress("unused")
  fun setMap(map: AMap) {
    aMap = map
    createOrUpdateMarker()
    
    pendingPosition?.let { pos ->
      marker?.position = pos
      pendingPosition = null
    }
    
    if (childCount > 0 && marker != null) {
      mainHandler.postDelayed({
        updateMarkerIcon()
      }, 100)
      
      mainHandler.postDelayed({
        updateMarkerIcon()
      }, 300)
    }
  }
  
  /**
   * 设置纬度
   */
  fun setLatitude(lat: Double) {
    try {
      if (lat < -90 || lat > 90) {
        return
      }
      
      pendingLatitude = lat
      pendingLongitude?.let { lng ->
        updatePosition(lat, lng)
      }
    } catch (e: Exception) {
      // 忽略异常
    }
  }
  
  /**
   * 设置经度
   */
  fun setLongitude(lng: Double) {
    try {
      if (lng < -180 || lng > 180) {
        return
      }
      
      pendingLongitude = lng
      pendingLatitude?.let { lat ->
        updatePosition(lat, lng)
      }
    } catch (e: Exception) {
      // 忽略异常
    }
  }
  
  /**
   * 更新标记位置（当经纬度都设置后）
   */
  private fun updatePosition(lat: Double, lng: Double) {
    try {
      val latLng = LatLng(lat, lng)
      
      marker?.let {
        it.position = latLng
        pendingPosition = null
        pendingLatitude = null
        pendingLongitude = null
      } ?: run {
        if (aMap != null) {
          createOrUpdateMarker()
          marker?.position = latLng
          pendingLatitude = null
          pendingLongitude = null
        } else {
          pendingPosition = latLng
        }
      }
    } catch (e: Exception) {
      // 忽略异常
    }
  }
  
  /**
   * 设置标记位置（兼容旧的 API）
   */
  fun setPosition(position: Map<String, Double>) {
    try {
      val lat = position["latitude"]
      val lng = position["longitude"]
      
      if (lat == null || lng == null) {
        return
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return
      }
      
      updatePosition(lat, lng)
    } catch (e: Exception) {
      // 忽略异常
    }
  }
  
  /**
   * 设置标题
   */
  fun setTitle(title: String) {
    pendingTitle = title
    marker?.let {
      it.title = title
      // 如果信息窗口正在显示，刷新它
      if (it.isInfoWindowShown) {
        it.showInfoWindow()
      }
    }
  }
  
  /**
   * 设置描述
   */
  fun setDescription(description: String) {
    pendingSnippet = description
    marker?.let {
      it.snippet = description
      // 如果信息窗口正在显示，刷新它
      if (it.isInfoWindowShown) {
        it.showInfoWindow()
      }
    }
  }
  
  /**
   * 设置是否可拖拽
   */
  fun setDraggable(draggable: Boolean) {
    pendingDraggable = draggable
    marker?.let { it.isDraggable = draggable }
  }
  
  /**
   * 设置是否显示信息窗口
   */
  fun setShowsInfoWindow(show: Boolean) {
    marker?.let {
      if (show) {
        it.showInfoWindow()
      } else {
        it.hideInfoWindow()
      }
    }
  }
  
  /**
   * 设置透明度
   */
  fun setOpacity(opacity: Float) {
    pendingOpacity = opacity
    marker?.let { it.alpha = opacity }
  }
  
  /**
   * 设置旋转角度
   */
  fun setMarkerRotation(rotation: Float) {
    marker?.let { it.rotateAngle = rotation }
  }
  
  /**
   * 设置锚点
   */
  @SuppressLint("SuspiciousIndentation")
  fun setAnchor(anchor: Map<String, Float>) {
    val x = anchor["x"] ?: 0.5f
    val y = anchor["y"] ?: 1.0f
    pendingAnchor = Pair(x, y)
    marker?.setAnchor(x, y)
  }
  
  /**
   * 设置是否平贴地图
   */
  fun setFlat(flat: Boolean) {
    pendingFlat = flat
    marker?.let { it.isFlat = flat }
  }
  
  /**
   * 设置图标
   */
  fun setMarkerIcon(iconUri: String?) {
    pendingIconUri = iconUri
    iconUri?.let {
      marker?.let { m ->
        loadAndSetIcon(it, m)
      }
    }
  }
  
  /**
   * 加载并设置图标
   * 支持: http/https 网络图片, file:// 本地文件, 本地资源名
   */
  private fun loadAndSetIcon(iconUri: String, marker: Marker) {
    try {
      when {
        // 网络图片
        iconUri.startsWith("http://") || iconUri.startsWith("https://") -> {
          loadImageFromUrl(iconUri) { bitmap ->
            bitmap?.let {
              val resized = resizeBitmap(it, iconWidth, iconHeight)
              mainHandler.post {
                marker.setIcon(BitmapDescriptorFactory.fromBitmap(resized))
                marker.setAnchor(0.5f, 1.0f)
              }
            } ?: run {
              mainHandler.post {
                marker.setIcon(BitmapDescriptorFactory.defaultMarker())
              }
            }
          }
        }
        // 本地文件
        iconUri.startsWith("file://") -> {
          val path = iconUri.substring(7) // 移除 "file://" 前缀
          val bitmap = BitmapFactory.decodeFile(path)
          if (bitmap != null) {
            val resized = resizeBitmap(bitmap, iconWidth, iconHeight)
            marker.setIcon(BitmapDescriptorFactory.fromBitmap(resized))
            marker.setAnchor(0.5f, 1.0f)
          } else {
            marker.setIcon(BitmapDescriptorFactory.defaultMarker())
          }
        }
        // 本地资源名
        else -> {
          val resourceId = context.resources.getIdentifier(
            iconUri,
            "drawable",
            context.packageName
          )
          if (resourceId != 0) {
            val bitmap = BitmapFactory.decodeResource(context.resources, resourceId)
            val resized = resizeBitmap(bitmap, iconWidth, iconHeight)
            marker.setIcon(BitmapDescriptorFactory.fromBitmap(resized))
            marker.setAnchor(0.5f, 1.0f)
          } else {
            marker.setIcon(BitmapDescriptorFactory.defaultMarker())
          }
        }
      }
    } catch (e: Exception) {
      marker.setIcon(BitmapDescriptorFactory.defaultMarker())
    }
  }
  
  /**
   * 从网络加载图片
   */
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
      } catch (e: Exception) {
        callback(null)
      } finally {
        inputStream?.close()
        connection?.disconnect()
      }
    }
  }
  
  /**
   * 调整图片尺寸
   */
  private fun resizeBitmap(bitmap: Bitmap, width: Int, height: Int): Bitmap {
    // 如果没有指定尺寸，使用原图尺寸或默认值
    val finalWidth = if (width > 0) width else bitmap.width
    val finalHeight = if (height > 0) height else bitmap.height
    
    return if (bitmap.width == finalWidth && bitmap.height == finalHeight) {
      bitmap
    } else {
      Bitmap.createScaledBitmap(bitmap, finalWidth, finalHeight, true)
    }
  }
  
  /**
   * 设置大头针颜色
   */
  fun setPinColor(color: String?) {
    pendingPinColor = color
    // 颜色变化时需要重新创建 marker
    aMap?.let { map ->
      marker?.let { oldMarker ->
        val position = oldMarker.position
        oldMarker.remove()
        marker = null
        
        createOrUpdateMarker()
        marker?.position = position
      }
    }
  }
  
  /**
   * 应用大头针颜色
   */
  private fun applyPinColor(color: String, marker: Marker) {
    try {
      val hue = when (color.lowercase()) {
        "red" -> BitmapDescriptorFactory.HUE_RED
        "orange" -> BitmapDescriptorFactory.HUE_ORANGE
        "yellow" -> BitmapDescriptorFactory.HUE_YELLOW
        "green" -> BitmapDescriptorFactory.HUE_GREEN
        "cyan" -> BitmapDescriptorFactory.HUE_CYAN
        "blue" -> BitmapDescriptorFactory.HUE_BLUE
        "violet" -> BitmapDescriptorFactory.HUE_VIOLET
        "magenta" -> BitmapDescriptorFactory.HUE_MAGENTA
        "rose" -> BitmapDescriptorFactory.HUE_ROSE
        "purple" -> BitmapDescriptorFactory.HUE_VIOLET
        else -> BitmapDescriptorFactory.HUE_RED
      }
      marker.setIcon(BitmapDescriptorFactory.defaultMarker(hue))
    } catch (e: Exception) {
      // 忽略异常
    }
  }
  
  /**
   * 设置 z-index
   */
  fun setZIndex(zIndex: Float) {
    pendingZIndex = zIndex
    marker?.let { it.zIndex = zIndex }
  }
  
  /**
   * 设置图标宽度（用于自定义图标 icon 属性）
   * 注意：React Native 传入的是 DP 值，需要转换为 PX
   */
  fun setIconWidth(width: Int) {
    val density = context.resources.displayMetrics.density
    iconWidth = (width * density).toInt()
  }
  
  /**
   * 设置图标高度（用于自定义图标 icon 属性）
   * 注意：React Native 传入的是 DP 值，需要转换为 PX
   */
  fun setIconHeight(height: Int) {
    val density = context.resources.displayMetrics.density
    iconHeight = (height * density).toInt()
  }
  
  /**
   * 设置自定义视图宽度（用于 children 属性）
   * 注意：React Native 传入的是 DP 值，需要转换为 PX
   */
  fun setCustomViewWidth(width: Int) {
    val density = context.resources.displayMetrics.density
    customViewWidth = (width * density).toInt()
  }
  
  /**
   * 设置自定义视图高度（用于 children 属性）
   * 注意：React Native 传入的是 DP 值，需要转换为 PX
   */
  fun setCustomViewHeight(height: Int) {
    val density = context.resources.displayMetrics.density
    customViewHeight = (height * density).toInt()
  }
  
  /**
   * 全局的 Marker 点击监听器
   * 必须在 ExpoGaodeMapView 中设置，不能在每个 MarkerView 中重复设置
   */
  companion object {
    private val markerViewMap = mutableMapOf<Marker, MarkerView>()
    
    fun registerMarker(marker: Marker, view: MarkerView) {
      markerViewMap[marker] = view
    }
    
    fun unregisterMarker(marker: Marker) {
      markerViewMap.remove(marker)
    }
    
    fun handleMarkerClick(marker: Marker): Boolean {
      markerViewMap[marker]?.let { view ->
        view.onMarkerPress(mapOf(
          "latitude" to marker.position.latitude,
          "longitude" to marker.position.longitude
        ))
        // 显示信息窗口（如果有 title 或 snippet）
        if (!marker.title.isNullOrEmpty() || !marker.snippet.isNullOrEmpty()) {
          marker.showInfoWindow()
        }
        return true
      }
      return false
    }
    
    fun handleMarkerDragStart(marker: Marker) {
      markerViewMap[marker]?.let { view ->
        view.onMarkerDragStart(mapOf(
          "latitude" to marker.position.latitude,
          "longitude" to marker.position.longitude
        ))
      }
    }
    
    fun handleMarkerDrag(marker: Marker) {
      markerViewMap[marker]?.let { view ->
        view.onMarkerDrag(mapOf(
          "latitude" to marker.position.latitude,
          "longitude" to marker.position.longitude
        ))
      }
    }
    
    fun handleMarkerDragEnd(marker: Marker) {
      markerViewMap[marker]?.let { view ->
        view.onMarkerDragEnd(mapOf(
          "latitude" to marker.position.latitude,
          "longitude" to marker.position.longitude
        ))
      }
    }
  }
  
  /**
   * 创建或更新标记
   */
  private fun createOrUpdateMarker() {
    aMap?.let { map ->
      if (marker == null) {
        val options = MarkerOptions()
        marker = map.addMarker(options)
        
        // 注册到全局 map
        marker?.let { m ->
          registerMarker(m, this)
          
          // 应用缓存的属性
          pendingTitle?.let { m.title = it }
          pendingSnippet?.let { m.snippet = it }
          pendingDraggable?.let { m.isDraggable = it }
          pendingOpacity?.let { m.alpha = it }
          pendingFlat?.let { m.isFlat = it }
          pendingZIndex?.let { m.zIndex = it }
          pendingAnchor?.let { m.setAnchor(it.first, it.second) }
          
          // 优先级：children > icon > pinColor
          if (childCount == 0) {
            if (pendingIconUri != null) {
              loadAndSetIcon(pendingIconUri!!, m)
            } else if (pendingPinColor != null) {
              applyPinColor(pendingPinColor!!, m)
            }
          }
        }
      }
    }
  }
  
  /**
   * 创建默认 marker 图标 (红色大头针)
   */
  private fun createDefaultMarkerBitmap(): Bitmap {
    val width = 48
    val height = 72
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    paint.color = Color.parseColor("#FF5252")
    paint.style = Paint.Style.FILL
    
    // 绘制圆形顶部
    canvas.drawCircle(width / 2f, width / 2f, width / 2f - 2, paint)
    
    // 绘制尖端
    val path = Path()
    path.moveTo(width / 2f, height.toFloat())
    path.lineTo(width / 4f, width / 2f + 10f)
    path.lineTo(3 * width / 4f, width / 2f + 10f)
    path.close()
    canvas.drawPath(path, paint)
    
    // 绘制白色边框
    paint.color = Color.WHITE
    paint.style = Paint.Style.STROKE
    paint.strokeWidth = 3f
    canvas.drawCircle(width / 2f, width / 2f, width / 2f - 4, paint)
    
    return bitmap
  }
  
  /**
   * 将视图转换为 Bitmap
   */
  private fun createBitmapFromView(): Bitmap? {
    if (childCount == 0) return null
    
    return try {
      val childView = getChildAt(0)
      val measuredWidth = childView.measuredWidth
      val measuredHeight = childView.measuredHeight
      
      val finalWidth = if (measuredWidth > 0) measuredWidth else (if (customViewWidth > 0) customViewWidth else 240)
      val finalHeight = if (measuredHeight > 0) measuredHeight else (if (customViewHeight > 0) customViewHeight else 80)
      
      if (finalWidth <= 0 || finalHeight <= 0) return null
      
      if (measuredWidth != finalWidth || measuredHeight != finalHeight) {
        childView.measure(
          MeasureSpec.makeMeasureSpec(finalWidth, MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(finalHeight, MeasureSpec.EXACTLY)
        )
        childView.layout(0, 0, finalWidth, finalHeight)
      }
      
      val bitmap = Bitmap.createBitmap(finalWidth, finalHeight, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)
      canvas.drawColor(android.graphics.Color.TRANSPARENT)
      childView.draw(canvas)
      
      bitmap
    } catch (e: Exception) {
      null
    }
  }
  
  /**
   * 创建组合 Bitmap：默认 marker + 自定义内容
   */
  private fun createCombinedBitmap(): Bitmap? {
    val customBitmap = createBitmapFromView() ?: return null
    val markerBitmap = createDefaultMarkerBitmap()
    
    val totalWidth = maxOf(markerBitmap.width, customBitmap.width)
    val totalHeight = markerBitmap.height + customBitmap.height + 10
    
    val combinedBitmap = Bitmap.createBitmap(totalWidth, totalHeight, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(combinedBitmap)
    
    val customX = (totalWidth - customBitmap.width) / 2f
    canvas.drawBitmap(customBitmap, customX, 0f, null)
    
    val markerX = (totalWidth - markerBitmap.width) / 2f
    val markerY = customBitmap.height + 10f
    canvas.drawBitmap(markerBitmap, markerX, markerY, null)
    
    return combinedBitmap
  }
  
  /**
   * 更新 marker 图标
   */
  private fun updateMarkerIcon() {
    if (childCount > 0) {
      val customBitmap = createBitmapFromView()
      customBitmap?.let {
        marker?.setIcon(BitmapDescriptorFactory.fromBitmap(it))
        marker?.setAnchor(0.5f, 1.0f)
      } ?: run {
        marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
      }
    } else {
      marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
      marker?.setAnchor(0.5f, 1.0f)
    }
  }

  
  override fun removeView(child: View?) {
    try {
      if (child != null && indexOfChild(child) >= 0) {
        super.removeView(child)
        // 不要在这里恢复默认图标
        // 如果 MarkerView 整体要被移除，onDetachedFromWindow 会处理
        // 如果只是移除 children 并保留 Marker，应该由外部重新设置 children
      }
    } catch (e: Exception) {
      // 忽略异常
    }
  }
  
  override fun removeViewAt(index: Int) {
    try {
      if (index >= 0 && index < childCount) {
        super.removeViewAt(index)
        // 只在还有子视图时更新图标
        if (!isRemoving && childCount > 1 && marker != null) {
          mainHandler.postDelayed({
            if (!isRemoving && marker != null && childCount > 0) {
              updateMarkerIcon()
            }
          }, 50)
        }
        // 如果最后一个子视图被移除，什么都不做
        // 让 onDetachedFromWindow 处理完整的清理
      }
    } catch (e: Exception) {
      // 忽略异常
    }
  }
  /**
   * 递归修复子视图的 LayoutParams，确保所有子视图都使用正确的 LayoutParams 类型
   */
  private fun fixChildLayoutParams(view: View) {
    if (view is android.view.ViewGroup) {
      for (i in 0 until view.childCount) {
        val child = view.getChildAt(i)
        val currentParams = child.layoutParams
        if (currentParams != null && currentParams !is android.widget.LinearLayout.LayoutParams) {
          child.layoutParams = android.widget.LinearLayout.LayoutParams(
            currentParams.width,
            currentParams.height
          )
        }
        fixChildLayoutParams(child)
      }
    }
  }
  
  
  override fun addView(child: View?, index: Int, params: android.view.ViewGroup.LayoutParams?) {
    // 🔑 关键修复：记录添加前的子视图数量
    val childCountBefore = childCount
    
    val finalParams = android.widget.LinearLayout.LayoutParams(
      if (customViewWidth > 0) customViewWidth else android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
      if (customViewHeight > 0) customViewHeight else android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
    )
    
    super.addView(child, index, finalParams)
    
    child?.let {
      val childParams = it.layoutParams
      if (childParams !is android.widget.LinearLayout.LayoutParams) {
        it.layoutParams = android.widget.LinearLayout.LayoutParams(
          childParams?.width ?: android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
          childParams?.height ?: android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        )
      }
      fixChildLayoutParams(it)
    }
    
    // 🔑 关键修复：只有在子视图数量真正变化且 marker 已存在时才更新图标
    // 避免在其他覆盖物添加时触发不必要的刷新
    if (!isRemoving && marker != null && childCount > childCountBefore) {
      mainHandler.postDelayed({
        if (!isRemoving && marker != null) {
          updateMarkerIcon()
        }
      }, 50)
      
      mainHandler.postDelayed({
        if (!isRemoving && marker != null) {
          updateMarkerIcon()
        }
      }, 150)
    }
  }
  
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    // 🔑 关键修复：只有在有子视图且 marker 存在时才更新，避免不必要的刷新
    if (changed && !isRemoving && childCount > 0 && marker != null) {
      mainHandler.postDelayed({
        if (!isRemoving && marker != null) {
          updateMarkerIcon()
        }
      }, 200)
    }
  }
  
  /**
   * 移除标记
   */
  fun removeMarker() {
    marker?.let {
      unregisterMarker(it)
      it.remove()
    }
    marker = null
  }
  
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    
    // 标记正在移除
    isRemoving = true
    
    // 清理所有延迟任务
    mainHandler.removeCallbacksAndMessages(null)
    
    // 移除 marker
    removeMarker()
  }
}

