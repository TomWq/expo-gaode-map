package expo.modules.gaodemap.overlays

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
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
      android.util.Log.e("MarkerView", "onMeasure 失败", e)
      throw e
    }
  }
  
  private val onPress by EventDispatcher()
  private val onDragStart by EventDispatcher()
  private val onDrag by EventDispatcher()
  private val onDragEnd by EventDispatcher()
  
  private var marker: Marker? = null
  private var aMap: AMap? = null
  private var pendingPosition: LatLng? = null
  private var pendingLatitude: Double? = null  // 临时存储纬度
  private var pendingLongitude: Double? = null  // 临时存储经度
  private var iconWidth: Int = 0  // 用于自定义图标的宽度
  private var iconHeight: Int = 0  // 用于自定义图标的高度
  private var customViewWidth: Int = 0  // 用于自定义视图（children）的宽度
  private var customViewHeight: Int = 0  // 用于自定义视图（children）的高度
  private val mainHandler = Handler(Looper.getMainLooper())
  
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
        android.util.Log.e("MarkerView", "纬度超出有效范围: $lat")
        return
      }
      
      pendingLatitude = lat
      pendingLongitude?.let { lng ->
        updatePosition(lat, lng)
      }
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "setLatitude 异常", e)
    }
  }
  
  /**
   * 设置经度
   */
  fun setLongitude(lng: Double) {
    try {
      if (lng < -180 || lng > 180) {
        android.util.Log.e("MarkerView", "经度超出有效范围: $lng")
        return
      }
      
      pendingLongitude = lng
      pendingLatitude?.let { lat ->
        updatePosition(lat, lng)
      }
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "setLongitude 异常", e)
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
      android.util.Log.e("MarkerView", "updatePosition 异常", e)
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
        android.util.Log.e("MarkerView", "无效的位置数据")
        return
      }
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        android.util.Log.e("MarkerView", "坐标超出有效范围")
        return
      }
      
      updatePosition(lat, lng)
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "setPosition 异常", e)
    }
  }
  
  /**
   * 设置标题
   */
  fun setTitle(title: String) {
    marker?.let { it.title = title }
  }
  
  /**
   * 设置描述
   */
  fun setDescription(description: String) {
    marker?.let { it.snippet = description }
  }
  
  /**
   * 设置是否可拖拽
   */
  fun setDraggable(draggable: Boolean) {
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
      marker?.setAnchor(x, y)
  }
  
  /**
   * 设置是否平贴地图
   */
  fun setFlat(flat: Boolean) {
    marker?.let { it.isFlat = flat }
  }
  
  /**
   * 设置图标
   */
  fun setMarkerIcon(iconUri: String?) {
    iconUri?.let {
      // 这里需要根据 URI 加载图片
      // 可以支持本地资源、网络图片等
      try {
        // 简化处理，实际需要实现图片加载逻辑
        marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
      } catch (e: Exception) {
        e.printStackTrace()
      }
    }
  }
  
  /**
   * 设置 z-index
   */
  fun setZIndex(zIndex: Float) {
    marker?.let { it.zIndex = zIndex }
  }
  
  /**
   * 设置图标宽度（用于自定义图标 icon 属性）
   */
  fun setIconWidth(width: Int) {
    iconWidth = width
  }
  
  /**
   * 设置图标高度（用于自定义图标 icon 属性）
   */
  fun setIconHeight(height: Int) {
    iconHeight = height
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
   * 创建或更新标记
   */
  private fun createOrUpdateMarker() {
    aMap?.let { map ->
      if (marker == null) {
        val options = MarkerOptions()
        marker = map.addMarker(options)
        
        map.setOnMarkerClickListener { clickedMarker ->
          if (clickedMarker == marker) {
            onPress(mapOf(
              "latitude" to clickedMarker.position.latitude,
              "longitude" to clickedMarker.position.longitude
            ))
            true
          } else {
            false
          }
        }
        
        map.setOnMarkerDragListener(object : AMap.OnMarkerDragListener {
          override fun onMarkerDragStart(draggedMarker: Marker?) {
            if (draggedMarker == marker) {
              draggedMarker?.let {
                onDragStart(mapOf(
                  "latitude" to it.position.latitude,
                  "longitude" to it.position.longitude
                ))
              }
            }
          }
          
          override fun onMarkerDrag(draggedMarker: Marker?) {
            if (draggedMarker == marker) {
              draggedMarker?.let {
                onDrag(mapOf(
                  "latitude" to it.position.latitude,
                  "longitude" to it.position.longitude
                ))
              }
            }
          }
          
          override fun onMarkerDragEnd(draggedMarker: Marker?) {
            if (draggedMarker == marker) {
              draggedMarker?.let {
                onDragEnd(mapOf(
                  "latitude" to it.position.latitude,
                  "longitude" to it.position.longitude
                ))
              }
            }
          }
        })
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
      android.util.Log.e("MarkerView", "创建 Bitmap 失败", e)
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
        mainHandler.postDelayed({
          if (childCount == 0 && marker != null) {
            marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
            marker?.setAnchor(0.5f, 1.0f)
          }
        }, 50)
      }
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "removeView 异常", e)
    }
  }
  
  override fun removeViewAt(index: Int) {
    try {
      if (index >= 0 && index < childCount) {
        super.removeViewAt(index)
        mainHandler.postDelayed({
          if (childCount == 0 && marker != null) {
            marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
            marker?.setAnchor(0.5f, 1.0f)
          } else if (childCount > 0 && marker != null) {
            updateMarkerIcon()
          }
        }, 50)
      }
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "removeViewAt 异常", e)
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
    
    mainHandler.postDelayed({
      if (marker != null) updateMarkerIcon()
    }, 50)
    
    mainHandler.postDelayed({
      if (marker != null) updateMarkerIcon()
    }, 150)
  }
  
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (changed && childCount > 0) {
      mainHandler.postDelayed({
        if (marker != null) updateMarkerIcon()
      }, 200)
    }
  }
  
  /**
   * 移除标记
   */
  fun removeMarker() {
    marker?.remove()
    marker = null
  }
  
  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    
    // 清理所有延迟任务
    mainHandler.removeCallbacksAndMessages(null)
    
    // 移除 marker
    removeMarker()
  }
}

