package expo.modules.gaodemap.map.overlays

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
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
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread
import androidx.core.view.isNotEmpty
import androidx.core.view.contains
import androidx.core.graphics.createBitmap
import androidx.core.view.isEmpty
import androidx.core.graphics.toColorInt
import androidx.core.graphics.scale

class MarkerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  
  init {
    // 不可交互,通过父视图定位到屏幕外
    isClickable = false
    isFocusable = false
    // 设置为水平方向（默认），让子视图自然布局
    orientation = HORIZONTAL
  }
  
  override fun generateDefaultLayoutParams(): LayoutParams {
    return LayoutParams(
      LayoutParams.WRAP_CONTENT,
      LayoutParams.WRAP_CONTENT
    )
  }
  
  override fun generateLayoutParams(attrs: android.util.AttributeSet?): LayoutParams {
    return LayoutParams(context, attrs)
  }
  
  override fun generateLayoutParams(lp: android.view.ViewGroup.LayoutParams?): LayoutParams {
    return when (lp) {
      is LayoutParams -> lp
      is android.widget.FrameLayout.LayoutParams -> LayoutParams(lp.width, lp.height)
      is MarginLayoutParams -> LayoutParams(lp.width, lp.height)
      else -> LayoutParams(
        lp?.width ?: LayoutParams.WRAP_CONTENT,
        lp?.height ?: LayoutParams.WRAP_CONTENT
      )
    }
  }
  
  override fun checkLayoutParams(p: android.view.ViewGroup.LayoutParams?): Boolean {
    return p is android.widget.LinearLayout.LayoutParams
  }
  
  @SuppressLint("DrawAllocation")
  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val selfParams = this.layoutParams
    if (selfParams == null || selfParams !is LayoutParams) {
      val width = if (customViewWidth > 0) {
        customViewWidth
      } else if (selfParams != null && selfParams.width > 0) {
        selfParams.width
      } else {
        LayoutParams.WRAP_CONTENT
      }
      
      val height = if (customViewHeight > 0) {
        customViewHeight
      } else if (selfParams != null && selfParams.height > 0) {
        selfParams.height
      } else {
        LayoutParams.WRAP_CONTENT
      }
      
      this.layoutParams = LayoutParams(width, height)
    }
    
    for (i in 0 until childCount) {
      val child = getChildAt(i)
      val params = child.layoutParams
      if (params == null || params !is LayoutParams) {
        child.layoutParams = LayoutParams(
          params?.width ?: LayoutParams.WRAP_CONTENT,
          params?.height ?: LayoutParams.WRAP_CONTENT
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
    
    if (isNotEmpty() && marker != null) {
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
    } catch (_: Exception) {
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
    } catch (_: Exception) {
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
    } catch (_: Exception) {
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
   * 设置透明度
   */
  fun setOpacity(opacity: Float) {
    pendingOpacity = opacity
    marker?.let { it.alpha = opacity }
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
    } catch (_: Exception) {
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
      } catch (_: Exception) {
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
        bitmap.scale(finalWidth, finalHeight)
    }
  }
  
  /**
   * 设置大头针颜色
   */
  fun setPinColor(color: String?) {
    pendingPinColor = color
    // 颜色变化时需要重新创建 marker
    aMap?.let { _ ->
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
    } catch (_: Exception) {
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
        view.onMarkerPress.invoke(mapOf(
            "latitude" to marker.position.latitude,
            "longitude" to marker.position.longitude
        ))
        // 只有在没有自定义内容（children）且有 title 或 snippet 时才显示信息窗口
        // 如果有自定义内容，说明用户已经自定义了显示内容，不需要默认信息窗口
        if (view.isEmpty() && (!marker.title.isNullOrEmpty() || !marker.snippet.isNullOrEmpty())) {
          // marker.showInfoWindow()
          return false
        }
        return true
      }
      return false
    }
    
    fun handleMarkerDragStart(marker: Marker) {
        markerViewMap[marker]?.onMarkerDragStart?.invoke(mapOf(
            "latitude" to marker.position.latitude,
            "longitude" to marker.position.longitude
        ))
    }
    
    fun handleMarkerDrag(marker: Marker) {
        markerViewMap[marker]?.onMarkerDrag?.invoke(mapOf(
            "latitude" to marker.position.latitude,
            "longitude" to marker.position.longitude
        ))
    }
    
    fun handleMarkerDragEnd(marker: Marker) {
        markerViewMap[marker]?.onMarkerDragEnd?.invoke(mapOf(
            "latitude" to marker.position.latitude,
            "longitude" to marker.position.longitude
        ))
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
          if (isEmpty()) {
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
   * 将视图转换为 Bitmap
   */
  private fun createBitmapFromView(): Bitmap? {
    if (isEmpty()) return null
    
    return try {
      val childView = getChildAt(0)
      val measuredWidth = childView.measuredWidth
      val measuredHeight = childView.measuredHeight
      
      val finalWidth = if (measuredWidth > 0) measuredWidth else (if (customViewWidth > 0) customViewWidth else 240)
      val finalHeight = if (measuredHeight > 0) measuredHeight else (if (customViewHeight > 0) customViewHeight else 80)

        if (measuredWidth != finalWidth || measuredHeight != finalHeight) {
        childView.measure(
          MeasureSpec.makeMeasureSpec(finalWidth, MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(finalHeight, MeasureSpec.EXACTLY)
        )
        childView.layout(0, 0, finalWidth, finalHeight)
      }
      
      val bitmap = createBitmap(finalWidth, finalHeight)
      val canvas = Canvas(bitmap)
      canvas.drawColor(Color.TRANSPARENT)
      childView.draw(canvas)
      
      bitmap
    } catch (_: Exception) {
      null
    }
  }
  

  /**
   * 更新 marker 图标
   */
  private fun updateMarkerIcon() {
    if (isNotEmpty()) {
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
      if (child != null && contains(child)) {
        super.removeView(child)
        // 不要在这里恢复默认图标
        // 如果 MarkerView 整体要被移除，onDetachedFromWindow 会处理
        // 如果只是移除 children 并保留 Marker，应该由外部重新设置 children
      }
    } catch (_: Exception) {
      // 忽略异常
    }
  }
  
  override fun removeViewAt(index: Int) {
    try {
      if (index in 0..<childCount) {
        super.removeViewAt(index)
        // 只在还有子视图时更新图标
        if (!isRemoving && childCount > 1 && marker != null) {
          mainHandler.postDelayed({
            if (!isRemoving && marker != null && isNotEmpty()) {
              updateMarkerIcon()
            }
          }, 50)
        }
        // 如果最后一个子视图被移除，什么都不做
        // 让 onDetachedFromWindow 处理完整的清理
      }
    } catch (_: Exception) {
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
        if (currentParams != null && currentParams !is LayoutParams) {
          child.layoutParams = LayoutParams(
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
    
    val finalParams = LayoutParams(
      if (customViewWidth > 0) customViewWidth else LayoutParams.WRAP_CONTENT,
      if (customViewHeight > 0) customViewHeight else LayoutParams.WRAP_CONTENT
    )
    
    super.addView(child, index, finalParams)
    
    child?.let {
      val childParams = it.layoutParams
      if (childParams !is LayoutParams) {
        it.layoutParams = LayoutParams(
          childParams?.width ?: LayoutParams.WRAP_CONTENT,
          childParams?.height ?: LayoutParams.WRAP_CONTENT
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
    if (changed && !isRemoving && isNotEmpty() && marker != null) {
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
    
    // 🔑 关键修复：使用 post 延迟检查
    // 清理所有延迟任务
    mainHandler.removeCallbacksAndMessages(null)
    
    // 延迟检查 parent 状态
    mainHandler.post {
      if (parent == null) {
        // 标记正在移除
        isRemoving = true
        // 移除 marker
        removeMarker()
      }
    }
  }
}

