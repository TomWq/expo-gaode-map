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
    android.util.Log.d("MarkerView", "🗺️ setMap 被调用，pendingPosition = $pendingPosition, childCount = $childCount")
    aMap = map
    createOrUpdateMarker()
    
    // 如果之前已经设置了位置但没有 marker，现在设置位置
    pendingPosition?.let { pos ->
      android.util.Log.d("MarkerView", "✅ 应用待处理的位置: $pos")
      marker?.position = pos
      pendingPosition = null
    }
    
    // 如果已经有子视图，触发多次延迟更新确保内容渲染
    if (childCount > 0 && marker != null) {
      android.util.Log.d("MarkerView", "🎨 setMap 后触发延迟更新")
      
      // 100ms 后第一次更新
      mainHandler.postDelayed({
        android.util.Log.d("MarkerView", "⏰ setMap 第一次延迟更新（100ms）")
        updateMarkerIcon()
      }, 100)
      
      // 300ms 后第二次更新，确保 Text 内容已加载
      mainHandler.postDelayed({
        android.util.Log.d("MarkerView", "⏰ setMap 第二次延迟更新（300ms，确保内容加载）")
        updateMarkerIcon()
      }, 300)
    }
  }
  
  /**
   * 设置纬度
   */
  fun setLatitude(lat: Double) {
    try {
      // 验证坐标范围
      if (lat < -90 || lat > 90) {
        android.util.Log.e("MarkerView", "❌ 纬度超出有效范围: $lat")
        return
      }
      
      android.util.Log.d("MarkerView", "📍 setLatitude: $lat")
      pendingLatitude = lat
      
      // 如果经度也已设置，则更新位置
      pendingLongitude?.let { lng ->
        updatePosition(lat, lng)
      }
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "❌ setLatitude 发生异常", e)
    }
  }
  
  /**
   * 设置经度
   */
  fun setLongitude(lng: Double) {
    try {
      // 验证坐标范围
      if (lng < -180 || lng > 180) {
        android.util.Log.e("MarkerView", "❌ 经度超出有效范围: $lng")
        return
      }
      
      android.util.Log.d("MarkerView", "📍 setLongitude: $lng")
      pendingLongitude = lng
      
      // 如果纬度也已设置，则更新位置
      pendingLatitude?.let { lat ->
        updatePosition(lat, lng)
      }
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "❌ setLongitude 发生异常", e)
    }
  }
  
  /**
   * 更新标记位置（当经纬度都设置后）
   */
  private fun updatePosition(lat: Double, lng: Double) {
    try {
      val latLng = LatLng(lat, lng)
      
      android.util.Log.d("MarkerView", "📍 updatePosition: ($lat, $lng), marker = $marker, aMap = $aMap")
      
      marker?.let {
        android.util.Log.d("MarkerView", "✅ 更新现有 marker 位置")
        it.position = latLng
        pendingPosition = null
        pendingLatitude = null
        pendingLongitude = null
      } ?: run {
        android.util.Log.d("MarkerView", "❌ marker 为 null")
        if (aMap != null) {
          android.util.Log.d("MarkerView", "🔧 aMap 存在，创建新 marker")
          createOrUpdateMarker()
          marker?.position = latLng
          pendingLatitude = null
          pendingLongitude = null
        } else {
          android.util.Log.d("MarkerView", "⏳ aMap 为 null，保存位置等待 setMap")
          pendingPosition = latLng
        }
      }
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "❌ updatePosition 发生异常", e)
    }
  }
  
  /**
   * 设置标记位置（兼容旧的 API）
   */
  fun setPosition(position: Map<String, Double>) {
    try {
      val lat = position["latitude"]
      val lng = position["longitude"]
      
      // 验证坐标有效性
      if (lat == null || lng == null) {
        android.util.Log.e("MarkerView", "❌ 无效的位置数据: latitude=$lat, longitude=$lng")
        return
      }
      
      // 验证坐标范围
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        android.util.Log.e("MarkerView", "❌ 坐标超出有效范围: ($lat, $lng)")
        return
      }
      
      updatePosition(lat, lng)
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "❌ setPosition 发生异常", e)
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
    android.util.Log.d("MarkerView", "📏 设置 iconWidth: $width")
  }
  
  /**
   * 设置图标高度（用于自定义图标 icon 属性）
   */
  fun setIconHeight(height: Int) {
    iconHeight = height
    android.util.Log.d("MarkerView", "📏 设置 iconHeight: $height")
  }
  
  /**
   * 设置自定义视图宽度（用于 children 属性）
   */
  fun setCustomViewWidth(width: Int) {
    customViewWidth = width
    android.util.Log.d("MarkerView", "📏 设置 customViewWidth: $width")
  }
  
  /**
   * 设置自定义视图高度（用于 children 属性）
   */
  fun setCustomViewHeight(height: Int) {
    customViewHeight = height
    android.util.Log.d("MarkerView", "📏 设置 customViewHeight: $height")
  }
  
  /**
   * 创建或更新标记
   */
  private fun createOrUpdateMarker() {
    aMap?.let { map ->
      if (marker == null) {
        android.util.Log.d("MarkerView", "🔧 创建新的 marker")
        val options = MarkerOptions()
        marker = map.addMarker(options)
        
        android.util.Log.d("MarkerView", "📌 Marker 已添加到地图，childCount = $childCount")
        
        // 不立即更新图标，等待延迟更新（在 addView 和 onLayout 中）
        android.util.Log.d("MarkerView", "⏳ 等待延迟更新图标")
        
        // 设置点击监听
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
        
        // 设置拖拽监听
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
    if (childCount == 0) {
      android.util.Log.w("MarkerView", "❌ childCount = 0")
      return null
    }
    
    return try {
      val childView = getChildAt(0)
      android.util.Log.d("MarkerView", "📦 子视图: $childView")
      
      // 获取视图实际测量的尺寸（React Native 已经布局好的）
      val measuredWidth = childView.measuredWidth
      val measuredHeight = childView.measuredHeight
      
      android.util.Log.d("MarkerView", "📏 子视图测量尺寸: ${measuredWidth}x${measuredHeight}")
      
      // 优先使用已测量的尺寸，其次使用 customViewWidth/customViewHeight（用于 children），最后使用默认值
      // 注意：iconWidth/iconHeight 是用于自定义图标的，不用于 children
      val finalWidth = if (measuredWidth > 0) measuredWidth else (if (customViewWidth > 0) customViewWidth else 240)
      val finalHeight = if (measuredHeight > 0) measuredHeight else (if (customViewHeight > 0) customViewHeight else 80)
      
      android.util.Log.d("MarkerView", "📏 最终使用尺寸: ${finalWidth}x${finalHeight} (customViewWidth=$customViewWidth, customViewHeight=$customViewHeight)")
      
      // 打印视图层次结构以调试
      if (childView is android.view.ViewGroup) {
        android.util.Log.d("MarkerView", "📦 子视图有 ${childView.childCount} 个子视图:")
        for (i in 0 until childView.childCount) {
          val child = childView.getChildAt(i)
          android.util.Log.d("MarkerView", "  └─ 子视图[$i]: ${child.javaClass.simpleName}, 可见性: ${child.visibility}")
          if (child is android.widget.TextView) {
            android.util.Log.d("MarkerView", "     文字: '${child.text}', 颜色: ${Integer.toHexString(child.currentTextColor)}, 大小: ${child.textSize}")
          }
        }
      }
      
      if (finalWidth <= 0 || finalHeight <= 0) {
        android.util.Log.w("MarkerView", "❌ 最终尺寸无效: ${finalWidth}x${finalHeight}")
        return null
      }
      
      // 如果需要重新测量（尺寸改变了）
      if (measuredWidth != finalWidth || measuredHeight != finalHeight) {
        childView.measure(
          MeasureSpec.makeMeasureSpec(finalWidth, MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(finalHeight, MeasureSpec.EXACTLY)
        )
        childView.layout(0, 0, finalWidth, finalHeight)
        android.util.Log.d("MarkerView", "✅ 子视图已重新测量和布局")
      }
      
      // 创建 Bitmap
      val bitmap = Bitmap.createBitmap(finalWidth, finalHeight, Bitmap.Config.ARGB_8888)
      val canvas = Canvas(bitmap)
      
      // 设置背景为透明
      canvas.drawColor(android.graphics.Color.TRANSPARENT)
      
      // 绘制视图及其所有子视图
      childView.draw(canvas)
      android.util.Log.d("MarkerView", "🎨 Bitmap 已绘制，尺寸: ${bitmap.width}x${bitmap.height}")
      
      bitmap
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "❌ 创建 Bitmap 失败", e)
      e.printStackTrace()
      null
    }
  }
  
  /**
   * 创建组合 Bitmap：默认 marker + 自定义内容
   */
  private fun createCombinedBitmap(): Bitmap? {
    android.util.Log.d("MarkerView", "🖼️ createCombinedBitmap 开始")
    val customBitmap = createBitmapFromView()
    if (customBitmap == null) {
      android.util.Log.w("MarkerView", "❌ 自定义 Bitmap 为 null")
      return null
    }
    android.util.Log.d("MarkerView", "✅ 自定义 Bitmap: ${customBitmap.width}x${customBitmap.height}")
    
    val markerBitmap = createDefaultMarkerBitmap()
    android.util.Log.d("MarkerView", "✅ 默认 Marker Bitmap: ${markerBitmap.width}x${markerBitmap.height}")
    
    // 计算总尺寸：marker 在下，自定义内容在上
    val totalWidth = maxOf(markerBitmap.width, customBitmap.width)
    val totalHeight = markerBitmap.height + customBitmap.height + 10 // 10px 间距
    
    android.util.Log.d("MarkerView", "📐 组合尺寸: ${totalWidth}x${totalHeight}")
    
    val combinedBitmap = Bitmap.createBitmap(totalWidth, totalHeight, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(combinedBitmap)
    
    // 绘制自定义内容在上方
    val customX = (totalWidth - customBitmap.width) / 2f
    canvas.drawBitmap(customBitmap, customX, 0f, null)
    android.util.Log.d("MarkerView", "🎨 已绘制自定义内容在 ($customX, 0)")
    
    // 绘制 marker 在下方
    val markerX = (totalWidth - markerBitmap.width) / 2f
    val markerY = customBitmap.height + 10f
    canvas.drawBitmap(markerBitmap, markerX, markerY, null)
    android.util.Log.d("MarkerView", "📍 已绘制 marker 在 ($markerX, $markerY)")
    
    return combinedBitmap
  }
  
  /**
   * 更新 marker 图标
   */
  private fun updateMarkerIcon() {
    android.util.Log.d("MarkerView", "🔄 updateMarkerIcon 被调用，childCount = $childCount")

    if (childCount > 0) {
        android.util.Log.d("MarkerView", "🎨 开始创建自定义 Bitmap（仅自定义内容）")
        val customBitmap = createBitmapFromView()
        customBitmap?.let {
            android.util.Log.d("MarkerView", "✅ 自定义 Bitmap 创建成功，尺寸: ${it.width}x${it.height}")

            marker?.setIcon(BitmapDescriptorFactory.fromBitmap(it))

            // 设置 anchor 为底部中心，让自定义内容底部对齐地图坐标点
            val anchorX = 0.5f // 水平居中
            val anchorY = 1.0f // 垂直底部
            android.util.Log.d("MarkerView", "🎯 设置 marker anchor: ($anchorX, $anchorY)")
            marker?.setAnchor(anchorX, anchorY)

            android.util.Log.d("MarkerView", "🎯 图标已设置到 marker")
        } ?: run {
            android.util.Log.w("MarkerView", "❌ 自定义 Bitmap 创建失败")
            marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
        }
    } else {
        android.util.Log.d("MarkerView", "📍 没有子视图，使用默认图标")
        marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
        marker?.setAnchor(0.5f, 1.0f) // 默认 anchor
    }
}

  
  override fun removeView(child: View?) {
    android.util.Log.d("MarkerView", "➖ removeView 被调用，child = $child, childCount = $childCount")
    
    try {
      // 检查子视图是否确实存在
      if (child != null && indexOfChild(child) >= 0) {
        super.removeView(child)
        
        // 子视图被移除后，清除图标或恢复默认图标
        mainHandler.postDelayed({
          android.util.Log.d("MarkerView", "⏰ removeView 延迟更新，childCount = $childCount")
          if (childCount == 0 && marker != null) {
            android.util.Log.d("MarkerView", "📍 所有子视图已移除，恢复默认图标")
            marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
            marker?.setAnchor(0.5f, 1.0f)
          }
        }, 50)
      } else {
        android.util.Log.w("MarkerView", "⚠️ removeView: 子视图不存在或不属于此ViewGroup")
      }
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "❌ removeView 发生异常", e)
    }
  }
  
  override fun removeViewAt(index: Int) {
    android.util.Log.d("MarkerView", "➖ removeViewAt 被调用，index = $index, childCount = $childCount")
    
    try {
      // 确保索引在有效范围内
      if (index >= 0 && index < childCount) {
        super.removeViewAt(index)
        
        // 子视图被移除后，清除图标或恢复默认图标
        mainHandler.postDelayed({
          android.util.Log.d("MarkerView", "⏰ removeViewAt 延迟更新，childCount = $childCount")
          if (childCount == 0 && marker != null) {
            android.util.Log.d("MarkerView", "📍 所有子视图已移除，恢复默认图标")
            marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
            marker?.setAnchor(0.5f, 1.0f)
          } else if (childCount > 0 && marker != null) {
            android.util.Log.d("MarkerView", "🔄 还有子视图，更新图标")
            updateMarkerIcon()
          }
        }, 50)
      } else {
        android.util.Log.w("MarkerView", "⚠️ removeViewAt: 无效的索引 $index，childCount = $childCount，忽略此次移除操作")
      }
    } catch (e: Exception) {
      android.util.Log.e("MarkerView", "❌ removeViewAt 发生异常: index=$index, childCount=$childCount", e)
    }
  }
  
  override fun addView(child: View?, index: Int, params: android.view.ViewGroup.LayoutParams?) {
    android.util.Log.d("MarkerView", "➕ addView 被调用，child = $child, index = $index, childCount = $childCount")
    super.addView(child, index, params)
    
    // 延迟更新图标，等待 React Native 样式和内容渲染
    android.util.Log.d("MarkerView", "✅ 子视图已添加，准备延迟更新，marker=${marker}")
    mainHandler.postDelayed({
      android.util.Log.d("MarkerView", "⏰ 第一次延迟更新图标，marker=${marker}")
      if (marker != null) {
        updateMarkerIcon()
      } else {
        android.util.Log.w("MarkerView", "⚠️ marker 为 null，跳过第一次更新")
      }
    }, 50)
    
    mainHandler.postDelayed({
      android.util.Log.d("MarkerView", "⏰ 第二次延迟更新图标（确保内容加载），marker=${marker}")
      if (marker != null) {
        updateMarkerIcon()
      } else {
        android.util.Log.w("MarkerView", "⚠️ marker 为 null，跳过第二次更新")
      }
    }, 150)
  }
  
  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    android.util.Log.d("MarkerView", "📐 onLayout: changed=$changed, bounds=(${left},${top},${right},${bottom}), marker=${marker}")
    
    // 布局完成后再次尝试更新图标（确保样式已应用）
    if (changed && childCount > 0) {
      android.util.Log.d("MarkerView", "🔄 布局改变，延迟更新图标，marker=${marker}")
      mainHandler.postDelayed({
        android.util.Log.d("MarkerView", "⏰ onLayout 延迟更新执行，marker=${marker}")
        if (marker != null) {
          updateMarkerIcon()
        } else {
          android.util.Log.w("MarkerView", "⚠️ marker 为 null，跳过 onLayout 更新")
        }
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

