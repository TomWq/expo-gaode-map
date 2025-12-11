package expo.modules.gaodemap.overlays

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
import androidx.core.graphics.scale
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import expo.modules.gaodemap.companion.BitmapDescriptorCache
import expo.modules.gaodemap.companion.IconBitmapCache
import kotlin.text.StringBuilder

import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit



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
        return p is LayoutParams
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
    private var cacheKey: String? = null

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
      
      // 🔑 修复：需要延迟更新图标，等待 children 完成布局
      // 使用 post 延迟到下一帧，确保 children 完成测量和布局
      if (isNotEmpty() && marker != null) {
        mainHandler.post {
          if (!isRemoving && marker != null && isNotEmpty()) {
            updateMarkerIcon()
          }
        }
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
     * JS 端传入稳定的缓存 key
     */
    fun setCacheKey(key: String?) {
        cacheKey = key
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
            // 构建缓存 key
            val keyPart = cacheKey ?: "icon|$iconUri"
            val fullCacheKey = "$keyPart|${iconWidth}x${iconHeight}"

            // ✅ 优先尝试 BitmapDescriptorCache
            BitmapDescriptorCache.get(fullCacheKey)?.let {
                marker.setIcon(it)
                marker.setAnchor(0.5f, 1.0f)
                return
            }

            when {
                iconUri.startsWith("http://") || iconUri.startsWith("https://") -> {
                    loadImageFromUrl(iconUri) { bitmap ->
                        bitmap?.let {
                            val resized = resizeBitmap(it, iconWidth, iconHeight)
                            // 缓存 bitmap
                            IconBitmapCache.put(fullCacheKey, resized)
                            // 生成 Descriptor 并缓存
                            val descriptor = BitmapDescriptorFactory.fromBitmap(resized)
                            BitmapDescriptorCache.putDescriptor(fullCacheKey, descriptor)

                            mainHandler.post {
                                marker.setIcon(descriptor)
                                marker.setAnchor(0.5f, 1.0f)
                            }
                        } ?: run {
                            mainHandler.post {
                                marker.setIcon(BitmapDescriptorFactory.defaultMarker())
                            }
                        }
                    }
                }
                iconUri.startsWith("file://") -> {
                    val path = iconUri.substring(7)
                    val bitmap = BitmapFactory.decodeFile(path)
                    if (bitmap != null) {
                        val resized = resizeBitmap(bitmap, iconWidth, iconHeight)
                        IconBitmapCache.put(fullCacheKey, resized)
                        val descriptor = BitmapDescriptorFactory.fromBitmap(resized)
                        BitmapDescriptorCache.putDescriptor(fullCacheKey, descriptor)
                        marker.setIcon(descriptor)
                        marker.setAnchor(0.5f, 1.0f)
                    } else {
                        marker.setIcon(BitmapDescriptorFactory.defaultMarker())
                    }
                }
                else -> { // 本地资源名
                    val resId = context.resources.getIdentifier(iconUri, "drawable", context.packageName)
                    if (resId != 0) {
                        val bitmap = BitmapFactory.decodeResource(context.resources, resId)
                        val resized = resizeBitmap(bitmap, iconWidth, iconHeight)
                        IconBitmapCache.put(fullCacheKey, resized)
                        val descriptor = BitmapDescriptorFactory.fromBitmap(resized)
                        BitmapDescriptorCache.putDescriptor(fullCacheKey, descriptor)
                        marker.setIcon(descriptor)
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
     * 应用大头针颜色（使用缓存优化性能）
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

            // 🔑 性能优化：使用缓存避免重复创建 BitmapDescriptor
            val cacheKey = "pin_$color"
            val descriptor = BitmapDescriptorCache.get(cacheKey) ?: run {
                val newDescriptor = BitmapDescriptorFactory.defaultMarker(hue)
                BitmapDescriptorCache.putDescriptor(cacheKey, newDescriptor)
                newDescriptor
            }

            marker.setIcon(descriptor)
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
                    marker.showInfoWindow()
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
     * 改良的 createBitmapFromView：支持缓存（IconBitmapCache）与稳定 fingerprint key。
     * - 如果 view 为空或没有 children，直接返回 null（和你之前一致）
     * - 首先尝试命中缓存 key（fingerprint + size）
     * - 如果未命中，在 UI 线程进行 measure/layout/draw，生成 bitmap 并缓存
     *
     * 注意：render 会在 UI 线程执行；如果当前线程不是 UI 线程，会同步等待 UI 线程完成（有超时）。
     */
    private fun createBitmapFromView(): Bitmap? {
        if (isEmpty()) return null

        // 优先使用 JS 传入的 cacheKey，如果没有则 fallback 为 fingerprint
        val keyPart = cacheKey ?: computeViewFingerprint(this)

        val measuredChild = if (childCount > 0) getChildAt(0) else null
        val measuredWidth = measuredChild?.measuredWidth ?: 0
        val measuredHeight = measuredChild?.measuredHeight ?: 0

        val finalWidth = if (measuredWidth > 0) measuredWidth else (if (customViewWidth > 0) customViewWidth else 240)
        val finalHeight = if (measuredHeight > 0) measuredHeight else (if (customViewHeight > 0) customViewHeight else 80)

        val fullCacheKey = "$keyPart|${finalWidth}x${finalHeight}"

        // 1) 尝试缓存命中
        IconBitmapCache.get(fullCacheKey)?.let { return it }

        // 2) 未命中，则生成 bitmap（同之前逻辑）
        val bitmap: Bitmap? = if (Looper.myLooper() == Looper.getMainLooper()) {
            renderViewToBitmapInternal(finalWidth, finalHeight)
        } else {
            val latch = CountDownLatch(1)
            var result: Bitmap? = null
            mainHandler.post {
                try {
                    result = renderViewToBitmapInternal(finalWidth, finalHeight)
                } finally {
                    latch.countDown()
                }
            }
            try { latch.await(200, TimeUnit.MILLISECONDS) } catch (_: InterruptedException) {}
            result
        }

        bitmap?.let { IconBitmapCache.put(fullCacheKey, it) }
        return bitmap
    }


    /**
     * 真正把 view measure/layout/draw 到 Bitmap 的内部方法（必须在主线程调用）
     */
    private fun renderViewToBitmapInternal(finalWidth: Int, finalHeight: Int): Bitmap? {
        try {
            val childView = if (isNotEmpty()) getChildAt(0) else return null

            // 使用给定的尺寸强制测量布局（更稳定）
            val widthSpec = MeasureSpec.makeMeasureSpec(finalWidth, MeasureSpec.EXACTLY)
            val heightSpec = MeasureSpec.makeMeasureSpec(finalHeight, MeasureSpec.EXACTLY)

            // measure + layout
            childView.measure(widthSpec, heightSpec)
            childView.layout(0, 0, finalWidth, finalHeight)

            // 🔑 修复：创建支持透明度的 bitmap 配置
            val bitmap = Bitmap.createBitmap(finalWidth, finalHeight, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)

            // 🔑 关键修复：强制启用 view 的绘制缓存，确保内容正确渲染
            childView.isDrawingCacheEnabled = true
            childView.buildDrawingCache(true)

            // 绘制 view 到 canvas
            childView.draw(canvas)

            // 清理绘制缓存
            childView.isDrawingCacheEnabled = false
            childView.destroyDrawingCache()

            return bitmap
        } catch (e: Exception) {
            // 遇到异常时返回 null，让上层使用默认图标
            return null
        }
    }

    /**
     * 更新 marker 图标
     */
    private fun updateMarkerIcon() {
        if (isEmpty()) {
            marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
            marker?.setAnchor(0.5f, 1.0f)
            return
        }

        // 构建缓存 key（优先 JS 端 cacheKey）
        val keyPart = cacheKey ?: computeViewFingerprint(this)
        val child = getChildAt(0)
        val measuredWidth = child?.measuredWidth ?: customViewWidth
        val measuredHeight = child?.measuredHeight ?: customViewHeight
        val fullCacheKey = "$keyPart|${measuredWidth}x${measuredHeight}"

        // 1) 尝试 BitmapDescriptor 缓存
        BitmapDescriptorCache.get(fullCacheKey)?.let {
            marker?.setIcon(it)
            // 🔑 修复:自定义视图使用中心锚点,不是底部中心
            marker?.setAnchor(0.5f, 0.5f)
            return
        }

        // 2) Bitmap 缓存命中则生成 Descriptor
        val bitmap = IconBitmapCache.get(fullCacheKey) ?: createBitmapFromView() ?: run {
            marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
            marker?.setAnchor(0.5f, 1.0f)
            return
        }

        // 生成并缓存 BitmapDescriptor
        val descriptor = BitmapDescriptorFactory.fromBitmap(bitmap)
        BitmapDescriptorCache.putDescriptor(fullCacheKey, descriptor)

        // 设置到 Marker
        marker?.setIcon(descriptor)
        // 🔑 修复:自定义视图使用中心锚点,不是底部中心
        marker?.setAnchor(0.5f, 0.5f)
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
        if (view is ViewGroup) {
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
      
      // 🔑 修复：需要延迟更新图标，等待 children 完成布局
      // 原因：立即更新会在 children 还未完成测量/布局时就渲染，导致内容为空
      if (!isRemoving && marker != null && childCount > childCountBefore) {
        mainHandler.post {
          if (!isRemoving && marker != null && isNotEmpty()) {
            updateMarkerIcon()
          }
        }
      }
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
      super.onLayout(changed, left, top, right, bottom)
      // 🔑 修复：布局完成后延迟更新图标
      // 使用 post 确保所有子视图都完成布局
      if (changed && !isRemoving && isNotEmpty() && marker != null) {
        mainHandler.post {
          if (!isRemoving && marker != null && isNotEmpty()) {
            updateMarkerIcon()
          }
        }
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

                // 🔑 修复：不要清空全局缓存
                // 理由：会影响其他 Marker 的性能
                // 缓存应该由 LruCache 自动管理，或在合适的时机（如内存警告）统一清理

                // 移除 marker
                removeMarker()
            }
        }
    }


    /**
     * 为 view 和其子树生成一个轻量“指纹”字符串，用作缓存 key。
     * 注意：这是启发式的，不追求 100% 唯一性，但在大部分自定义 view 场景下能稳定复用。
     */
    fun computeViewFingerprint(view: View?): String {
        if (view == null) return "null"

        val sb = StringBuilder()
        // 首先尝试使用开发者可能预设的 tag 或 contentDescription 作为优先标识（稳定且快速）
        val tag = view.tag
        if (tag != null) {
            sb.append("tag=").append(tag.toString()).append(";")
            return sb.toString()
        }

        val contentDesc = view.contentDescription
        if (!contentDesc.isNullOrEmpty()) {
            sb.append("cdesc=").append(contentDesc.toString()).append(";")
            return sb.toString()
        }

        // 否则做一个递归采样：className + 对于 TextView 获取 text + 对于 ImageView 获取 resourceId 或 drawable hash
        fun appendFor(v: View) {
            sb.append(v.javaClass.simpleName)
            when (v) {
                is TextView -> {
                    val t = v.text?.toString() ?: ""
                    if (t.isNotEmpty()) {
                        sb.append("[text=").append(t).append("]")
                    }
                }
                is ImageView -> {
                    // 尝试读取资源 id（若使用 setImageResource 时可取到），否则取 drawable 的 hashCode 作为近似
                    val resId = v.tag // 开发者可将资源 id 放到 tag 以便稳定识别
                    if (resId is Int && resId != 0) {
                        sb.append("[imgRes=").append(resId).append("]")
                    } else {
                        val dr = v.drawable
                        if (dr != null) {
                            sb.append("[drawableHash=").append(dr.hashCode()).append("]")
                        }
                    }
                }
            }
            sb.append(";")
            if (v is ViewGroup) {
                for (i in 0 until v.childCount) {
                    val c = v.getChildAt(i)
                    appendFor(c)
                }
            }
        }

        appendFor(view)
        // 最终返回一个截断的 sha-like 形式（避免 key 过长）
        return sb.toString().take(1024)
    }
}

