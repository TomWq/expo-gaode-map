package expo.modules.gaodemap.overlays

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Rect
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewParent
import com.amap.api.maps.AMap
import com.amap.api.maps.model.BitmapDescriptorFactory
import com.amap.api.maps.model.LatLng
import com.amap.api.maps.model.Marker
import com.amap.api.maps.model.MarkerOptions
import com.amap.api.maps.utils.SpatialRelationUtil
import com.amap.api.maps.utils.overlay.MovingPointOverlay
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread
import androidx.core.view.isNotEmpty
import androidx.core.view.contains

import androidx.core.view.isEmpty
import androidx.core.graphics.scale
import android.view.ViewGroup
import com.amap.api.maps.model.animation.AlphaAnimation
import com.amap.api.maps.model.animation.AnimationSet
import com.amap.api.maps.model.animation.ScaleAnimation
import android.view.animation.DecelerateInterpolator
import expo.modules.gaodemap.companion.BitmapDescriptorCache
import expo.modules.gaodemap.companion.IconBitmapCache
import expo.modules.gaodemap.utils.GeometryUtils
import kotlin.math.max
import kotlin.math.min
import expo.modules.gaodemap.utils.LatLngParser

class MarkerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

    init {
        // 不可交互,通过父视图定位到屏幕外
        isClickable = false
        isFocusable = false
        isBaselineAligned = false
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

        if (childCount == 0) {
            super.onMeasure(widthMeasureSpec, heightMeasureSpec)
            return
        }

        val parentWidthSize = MeasureSpec.getSize(widthMeasureSpec)
        val parentHeightSize = MeasureSpec.getSize(heightMeasureSpec)
        val fallbackWidthSize = resolveExplicitMeasureSize(parentWidthSize, true)
        val fallbackHeightSize = resolveExplicitMeasureSize(parentHeightSize, false)

        val contentWidthSpec = when {
            customViewWidth > 0 -> MeasureSpec.makeMeasureSpec(customViewWidth, MeasureSpec.EXACTLY)
            fallbackWidthSize > 0 -> MeasureSpec.makeMeasureSpec(fallbackWidthSize, MeasureSpec.AT_MOST)
            else -> MeasureSpec.makeMeasureSpec(1, MeasureSpec.EXACTLY)
        }
        val contentHeightSpec = when {
            customViewHeight > 0 -> MeasureSpec.makeMeasureSpec(customViewHeight, MeasureSpec.EXACTLY)
            fallbackHeightSize > 0 -> MeasureSpec.makeMeasureSpec(fallbackHeightSize, MeasureSpec.AT_MOST)
            else -> MeasureSpec.makeMeasureSpec(1, MeasureSpec.EXACTLY)
        }

        var measuredContentWidth = 0
        var measuredContentHeight = 0

        for (i in 0 until childCount) {
            val child = getChildAt(i)
            val lp = child.layoutParams as? LayoutParams
                ?: LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)

            val childWidthSpec = getChildMeasureSpec(
                contentWidthSpec,
                paddingLeft + paddingRight,
                lp.width
            )
            val childHeightSpec = getChildMeasureSpec(
                contentHeightSpec,
                paddingTop + paddingBottom,
                lp.height
            )

            child.measure(childWidthSpec, childHeightSpec)
            val childBounds = MarkerBitmapRenderer.computeContentBounds(child)
            measuredContentWidth = max(measuredContentWidth, childBounds?.width() ?: child.measuredWidth)
            measuredContentHeight = max(measuredContentHeight, childBounds?.height() ?: child.measuredHeight)
        }

        val desiredWidth = if (customViewWidth > 0) {
            customViewWidth
        } else {
            measuredContentWidth + paddingLeft + paddingRight
        }
        val desiredHeight = if (customViewHeight > 0) {
            customViewHeight
        } else {
            measuredContentHeight + paddingTop + paddingBottom
        }

        val finalWidth = if (parentWidthSize > 0) min(desiredWidth, parentWidthSize) else desiredWidth
        val finalHeight = if (parentHeightSize > 0) min(desiredHeight, parentHeightSize) else desiredHeight

        setMeasuredDimension(
            max(finalWidth, suggestedMinimumWidth),
            max(finalHeight, suggestedMinimumHeight)
        )
    }

    private fun resolveExplicitMeasureSize(parentSize: Int, isWidth: Boolean): Int {
        if (parentSize > 0) {
            return parentSize
        }

        val parentView = parent as? View
        val parentMeasuredSize = if (isWidth) {
            parentView?.measuredWidth ?: 0
        } else {
            parentView?.measuredHeight ?: 0
        }
        if (parentMeasuredSize > 0) {
            return parentMeasuredSize
        }

        val parentLayoutSize = if (isWidth) {
            parentView?.width ?: 0
        } else {
            parentView?.height ?: 0
        }
        if (parentLayoutSize > 0) {
            return parentLayoutSize
        }

        val displayMetrics = context.resources.displayMetrics
        return if (isWidth) displayMetrics.widthPixels else displayMetrics.heightPixels
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
    private var pendingMarkerIconUpdate: Runnable? = null
    private var lastAppliedCustomMarkerKey: String? = null

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

    // 平滑移动相关
    private var smoothMoveMarker: MovingPointOverlay? = null
    private var smoothMovePath: List<LatLng>? = null
    private var smoothMoveDuration: Double = 10.0  // 默认 10 秒
    
    // 生长动画相关
    private var growAnimation: Boolean = false
    private var hasAnimated: Boolean = false
    private var pendingShowMarker: Boolean = false

    private fun isPositionReady(): Boolean {
        return pendingLatitude == null && pendingLongitude == null && pendingPosition == null
    }

    /**
     * 设置生长动画
     */
    fun setGrowAnimation(enable: Boolean) {
        growAnimation = enable
    }

    /**
     * 启动显示动画
     * 组合使用 AlphaAnimation 和微幅 ScaleAnimation
     * Scale 从 0.5 开始而不是 0，可以显著减少因 SDK 锚点偏移导致的视觉平移感，
     * 同时配合 Alpha 渐变，达成“柔和生长”的效果。
     */
    private fun startGrowAnimation(m: Marker) {
        try {
            val set = AnimationSet(true)
            set.setInterpolator(DecelerateInterpolator())
            set.setDuration(500)

            // 透明度：0 -> 1
            val alpha = AlphaAnimation(0f, 1f)
            set.addAnimation(alpha)

            // 缩放：0.5 -> 1.0 (避免从0开始，减少位移幅度)
            val scale = ScaleAnimation(0.8f, 1f, 0.8f, 1f)
            set.addAnimation(scale)

            m.setAnimation(set)
            m.startAnimation()
        } catch (e: Exception) {
            android.util.Log.e("MarkerView", "startGrowAnimation error", e)
        }
    }

    /**
     * 显示标记（统一处理可见性和动画）
     */
    private fun showMarker(m: Marker) {
        if (!isPositionReady()) {
            pendingShowMarker = true
            return
        }

        doShowMarker(m)
    }

    private fun doShowMarker(m: Marker) {

        val targetAlpha = pendingOpacity ?: 1.0f
        
        if (growAnimation && !hasAnimated) {
            m.isVisible = true
            // 不再手动设置 alpha=0，交给 startGrowAnimation 处理
            // 避免时序问题导致的一帧闪烁
            startGrowAnimation(m)
            hasAnimated = true
        } else {
            m.alpha = targetAlpha
            m.isVisible = true
        }
    }

    private fun flushPendingShowIfNeeded() {
        if (!pendingShowMarker || !isPositionReady()) return
        pendingShowMarker = false
        marker?.let { doShowMarker(it) }
    }

    /**
     * 设置地图实例
     */
    @Suppress("unused")
    fun setMap(map: AMap) {
      aMap = map
      createOrUpdateMarker(pendingPosition)
      
      pendingPosition?.let { pos ->
        marker?.position = pos
        pendingPosition = null
        pendingLatitude = null
        pendingLongitude = null
      }

      flushPendingShowIfNeeded()
      
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
     * 设置位置（支持多种格式）
     */
    fun setPosition(positionData: Map<String, Any>?) {
        LatLngParser.parseLatLng(positionData)?.let {
            updatePosition(it.latitude, it.longitude)
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

                flushPendingShowIfNeeded()
            } ?: run {
                if (aMap != null) {
                    createOrUpdateMarker(latLng)
                    marker?.position = latLng
                    pendingLatitude = null
                    pendingLongitude = null

                    flushPendingShowIfNeeded()
                } else {
                    pendingPosition = latLng
                    pendingLatitude = null
                    pendingLongitude = null
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
        if (cacheKey == key) {
            return
        }

        invalidateAppliedCustomMarkerCaches()
        cacheKey = key
        updateMarkerIcon()
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
                showMarker(marker)
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
                                showMarker(marker)
                            }
                        } ?: run {
                            mainHandler.post {
                                marker.setIcon(BitmapDescriptorFactory.defaultMarker())
                                showMarker(marker)
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
                        showMarker(marker)
                    } else {
                        marker.setIcon(BitmapDescriptorFactory.defaultMarker())
                        showMarker(marker)
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
                        showMarker(marker)
                    } else {
                        marker.setIcon(BitmapDescriptorFactory.defaultMarker())
                        showMarker(marker)
                    }
                }
            }
        } catch (_: Exception) {
            marker.setIcon(BitmapDescriptorFactory.defaultMarker())
            showMarker(marker)
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

                createOrUpdateMarker(position)
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
            showMarker(marker)
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
        val resolvedWidth = (width * density).toInt()
        if (iconWidth == resolvedWidth) {
            return
        }

        iconWidth = resolvedWidth
        pendingIconUri?.let { iconUri ->
            marker?.let { loadAndSetIcon(iconUri, it) }
        }
    }

    /**
     * 设置图标高度（用于自定义图标 icon 属性）
     * 注意：React Native 传入的是 DP 值，需要转换为 PX
     */
    fun setIconHeight(height: Int) {
        val density = context.resources.displayMetrics.density
        val resolvedHeight = (height * density).toInt()
        if (iconHeight == resolvedHeight) {
            return
        }

        iconHeight = resolvedHeight
        pendingIconUri?.let { iconUri ->
            marker?.let { loadAndSetIcon(iconUri, it) }
        }
    }

    /**
     * 设置自定义视图宽度（用于 children 属性）
     * 注意：React Native 传入的是 DP 值，需要转换为 PX
     */
    fun setCustomViewWidth(width: Int) {
        val density = context.resources.displayMetrics.density
        val resolvedWidth = (width * density).toInt()
        if (customViewWidth == resolvedWidth) {
            return
        }

        customViewWidth = resolvedWidth
        markCustomMarkerContentDirty()
    }

    /**
     * 设置自定义视图高度（用于 children 属性）
     * 注意：React Native 传入的是 DP 值，需要转换为 PX
     */
    fun setCustomViewHeight(height: Int) {
        val density = context.resources.displayMetrics.density
        val resolvedHeight = (height * density).toInt()
        if (customViewHeight == resolvedHeight) {
            return
        }

        customViewHeight = resolvedHeight
        markCustomMarkerContentDirty()
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
                return !(view.isEmpty() && (!marker.title.isNullOrEmpty() || !marker.snippet.isNullOrEmpty()))
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
    private fun createOrUpdateMarker(initialPosition: LatLng? = null) {
        aMap?.let { map ->
            if (marker == null) {
                // 🔑 修复：如果没有任何坐标信息，暂不创建 Marker，等待坐标就绪
                // 这确保 Marker 永远在正确的位置出生，彻底解决动画位移问题
                val pos = initialPosition ?: pendingPosition ?: if (pendingLatitude != null && pendingLongitude != null) {
                    LatLng(pendingLatitude!!, pendingLongitude!!)
                } else null
                
                if (pos == null) {
                    return
                }

                hasAnimated = false // 重置动画状态
                val options = MarkerOptions()
                // 恢复默认的 visible(false)，因为我们已经有了严谨的创建逻辑
                // 如果需要动画，showMarker 会处理 visible
                options.visible(false)
                options.position(pos)
                
                // 🔑 修复：设置初始锚点，避免动画时的位置跳变
                // 如果是自定义 View（非空），默认锚点设为中心 (0.5, 0.5)
                // 如果是默认大头针（空且无 icon/color），默认锚点设为底部中心 (0.5, 1.0)
                val isDefaultMarker = isEmpty() && pendingIconUri == null && pendingPinColor == null
                val defaultAnchorX = 0.5f
                val defaultAnchorY = if (isDefaultMarker) 1.0f else 0.5f
                
                val anchorX = pendingAnchor?.first ?: defaultAnchorX
                val anchorY = pendingAnchor?.second ?: defaultAnchorY
                
                options.anchor(anchorX, anchorY)

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
                        } else {
                            // 延迟检查，如果是默认 Marker 且没有子视图加入，才显示
                            mainHandler.post {
                                if (marker != null && isEmpty() && pendingIconUri == null && pendingPinColor == null) {
                                    showMarker(m)
                                }
                            }
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
    private fun createBitmapFromView(snapshot: MarkerBitmapSnapshot? = resolveMarkerBitmapSnapshot()): Bitmap? {
        if (isEmpty()) return null

        val resolvedSnapshot = snapshot ?: return null
        return MarkerBitmapRenderer.createBitmap(
            container = this,
            snapshot = resolvedSnapshot,
            customViewWidth = customViewWidth,
            customViewHeight = customViewHeight,
            mainHandler = mainHandler,
        )
    }

    /**
     * 更新 marker 图标
     */
    private fun updateMarkerIcon() {
        if (isEmpty()) {
            // 如果确实为空（没有子视图），恢复默认样式
            marker?.setIcon(BitmapDescriptorFactory.defaultMarker())
            lastAppliedCustomMarkerKey = null
            // 恢复默认锚点（底部中心），除非用户指定了锚点
            val anchorX = pendingAnchor?.first ?: 0.5f
            val anchorY = pendingAnchor?.second ?: 1.0f
            marker?.setAnchor(anchorX, anchorY)
            marker?.let { showMarker(it) }
            return
        }

        val snapshot = resolveMarkerBitmapSnapshot() ?: run {
            if (marker?.isVisible != true) {
                // 自定义 view 还没准备好时，继续等待下一次 layout/update。
            }
            return
        }
        val fullCacheKey = snapshot.fullCacheKey

        // 确定锚点：优先使用用户指定的 pendingAnchor，否则对于自定义 View 使用中心点 (0.5, 0.5)
        val anchorX = pendingAnchor?.first ?: 0.5f
        val anchorY = pendingAnchor?.second ?: 0.5f

        if (fullCacheKey == lastAppliedCustomMarkerKey) {
            marker?.setAnchor(anchorX, anchorY)
            marker?.let { showMarker(it) }
            return
        }

        // 1) 尝试 BitmapDescriptor 缓存
        BitmapDescriptorCache.get(fullCacheKey)?.let { it ->
            marker?.setIcon(it)
            marker?.setAnchor(anchorX, anchorY)
            lastAppliedCustomMarkerKey = fullCacheKey
            marker?.let { showMarker(it) }
            return
        }

        // 2) Bitmap 缓存命中则生成 Descriptor，或者重新生成
        val bitmap = IconBitmapCache.get(fullCacheKey) ?: createBitmapFromView(snapshot) ?: run {
            // 🔑 关键修复：如果生成 Bitmap 失败（例如 View 还没准备好）
            // 不要急着切回默认 Marker，这会导致闪烁和位置跳变。
            // 只有在 Marker 从未显示过的情况下，才考虑兜底策略。
            if (marker?.isVisible != true) {
                 // 如果从未显示过，可以暂不显示，等待下一次尝试，或者显示默认（取决于需求）
                 // 这里选择暂不显示，避免闪现蓝点
            }
            return
        }

        // 生成并缓存 BitmapDescriptor
        val descriptor = BitmapDescriptorFactory.fromBitmap(bitmap)
        BitmapDescriptorCache.putDescriptor(fullCacheKey, descriptor)

        // 设置到 Marker
        marker?.setIcon(descriptor)
        marker?.setAnchor(anchorX, anchorY)
        lastAppliedCustomMarkerKey = fullCacheKey
        marker?.let { showMarker(it) }
    }

    private fun scheduleMarkerIconUpdate(delayMs: Long = 16L) {
        if (isRemoving || marker == null || isEmpty()) {
            return
        }

        pendingMarkerIconUpdate?.let { mainHandler.removeCallbacks(it) }
        val task = Runnable {
            pendingMarkerIconUpdate = null
            if (!isRemoving && marker != null && isNotEmpty()) {
                updateMarkerIcon()
            }
        }
        pendingMarkerIconUpdate = task

        if (delayMs <= 0L) {
            mainHandler.post(task)
        } else {
            mainHandler.postDelayed(task, delayMs)
        }
    }

    private fun invalidateAppliedCustomMarkerCaches() {
        val key = lastAppliedCustomMarkerKey ?: return
        BitmapDescriptorCache.remove(key)
        IconBitmapCache.remove(key)
        lastAppliedCustomMarkerKey = null
    }

    private fun markCustomMarkerContentDirty(delayMs: Long = 16L) {
        if (isRemoving || isEmpty()) {
            return
        }

        invalidateAppliedCustomMarkerCaches()
        if (marker != null) {
            scheduleMarkerIconUpdate(delayMs)
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
                if (!isRemoving && childCount > 0 && marker != null) {
                    markCustomMarkerContentDirty(50)
                }
                // 如果最后一个子视图被移除，什么都不做
                // 让 onDetachedFromWindow 处理完整的清理
            }
        } catch (_: Exception) {
            // 忽略异常
        }
    }
    private fun resolveMarkerBitmapSnapshot(): MarkerBitmapSnapshot? =
        MarkerBitmapRenderer.resolveSnapshot(
            container = this,
            customViewWidth = customViewWidth,
            customViewHeight = customViewHeight,
            cacheKey = cacheKey,
        )


    override fun addView(child: View?, index: Int, params: android.view.ViewGroup.LayoutParams?) {
      // 🔑 关键修复：记录添加前的子视图数量
      val childCountBefore = childCount

      val sourceWidth = when {
        customViewWidth > 0 -> customViewWidth
        params?.width != null && params.width > 0 -> params.width
        else -> LayoutParams.WRAP_CONTENT
      }

      val sourceHeight = when {
        customViewHeight > 0 -> customViewHeight
        params?.height != null && params.height > 0 -> params.height
        else -> LayoutParams.WRAP_CONTENT
      }
      
      val finalParams = LayoutParams(
        sourceWidth,
        sourceHeight
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
      }
      
      // 🔑 修复：需要延迟更新图标，等待 children 完成布局
      // 原因：立即更新会在 children 还未完成测量/布局时就渲染，导致内容为空
      if (!isRemoving && marker != null && childCount > childCountBefore) {
        markCustomMarkerContentDirty()
      }
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
      super.onLayout(changed, left, top, right, bottom)
      // 🔑 修复：布局完成后延迟更新图标
      // 即使 changed 为 false，只要有内容，也应该检查是否需要更新（例如子 View 尺寸变化但 MarkerView 没变）
      if (!isRemoving && isNotEmpty() && marker != null) {
        markCustomMarkerContentDirty()
      }
    }

    @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
    override fun invalidateChildInParent(location: IntArray?, dirty: Rect?): ViewParent? {
        val parentRef = super.invalidateChildInParent(location, dirty)
        if (!isRemoving && isNotEmpty() && marker != null) {
            markCustomMarkerContentDirty()
        }
        return parentRef
    }

  

    /**
     * 设置平滑移动路径
     */
    fun setSmoothMovePath(path: List<Any>?) {
        try {
            // 转换为 LatLng 列表
            smoothMovePath = LatLngParser.parseLatLngList(path)

            // 当路径和时长都设置时，启动平滑移动
            if (smoothMovePath?.isNotEmpty() == true && smoothMoveDuration > 0 && aMap != null) {
                startSmoothMove()
            }
        } catch (e: Exception) {
            android.util.Log.e("MarkerView", "setSmoothMovePath error", e)
        }
    }

    /**
     * 设置平滑移动时长（秒）
     */
    fun setSmoothMoveDuration(duration: Double) {
        smoothMoveDuration = if (duration > 0) duration else 10.0

        // 当路径和时长都设置时，启动平滑移动
        if (smoothMovePath?.isNotEmpty() == true && aMap != null) {
            startSmoothMove()
        }
    }

    /**
     * 启动平滑移动
     */
    private fun startSmoothMove() {
        val path = smoothMovePath ?: run {
            android.util.Log.e("MarkerView", "smoothMovePath is null")
            return
        }
        val map = aMap ?: run {
            android.util.Log.e("MarkerView", "aMap is null")
            return
        }
        (smoothMoveDuration * 1000).toInt()  // 转换为毫秒


        mainHandler.post {
            try {
                // 创建或获取 MovingPointOverlay
                if (smoothMoveMarker == null) {
                    // 创建一个专门用于平滑移动的内部 Marker
                    val options = MarkerOptions()
                    // 设置初始位置为当前位置或路径第一个点
                    val initialPos = if (isNotEmpty()) {
                        val currentLat = pendingLatitude ?: marker?.position?.latitude
                        val currentLng = pendingLongitude ?: marker?.position?.longitude
                        if (currentLat != null && currentLng != null) {
                            LatLng(currentLat, currentLng)
                        } else {
                            path.first()
                        }
                    } else {
                        path.first()
                    }
                    options.position(initialPos)
                    
                    val internalMarker = map.addMarker(options)
                    smoothMoveMarker = MovingPointOverlay(map, internalMarker)
                    
                    // 设置图标 - 优先使用自定义 icon，其次使用 pinColor
                    var iconSetSuccessfully = false
                    try {
                        // 优先：从原始 Marker 直接获取图标
                        marker?.let { _ ->
                            // 1. 尝试使用缓存的自定义 icon
                            if (pendingIconUri != null) {
                                // 尝试不同的缓存 key 格式
                                val possibleKeys = listOfNotNull(
                                    cacheKey?.let { "$it|${iconWidth}x${iconHeight}" },
                                    "icon|$pendingIconUri|${iconWidth}x${iconHeight}",
                                    cacheKey,
                                    "icon|$pendingIconUri"
                                )
                                
                                for (key in possibleKeys) {
                                    if (iconSetSuccessfully) break
                                    
                                    // 先尝试 BitmapDescriptorCache
                                    BitmapDescriptorCache.get(key)?.let { icon ->
                                        internalMarker.setIcon(icon)
                                        iconSetSuccessfully = true
                                    }
                                    
                                    if (iconSetSuccessfully) break
                                    
                                    // 再尝试 IconBitmapCache
                                    IconBitmapCache.get(key)?.let { bitmap ->
                                        val descriptor = BitmapDescriptorFactory.fromBitmap(bitmap)
                                        internalMarker.setIcon(descriptor)
                                        iconSetSuccessfully = true
                                    }
                                }
                            }
                        }
                        
                        // 只有当自定义图标未设置成功时，才使用 pinColor
                        if (!iconSetSuccessfully) {
                            val color = pendingPinColor ?: "red"
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
                            
                            val icon = BitmapDescriptorFactory.defaultMarker(hue)
                            internalMarker.setIcon(icon)
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("MarkerView", "Failed to set icon for smooth move", e)
                        val defaultIcon = BitmapDescriptorFactory.defaultMarker()
                        internalMarker.setIcon(defaultIcon)
                    }
                }

                // 获取内部 Marker
                val internalMarker = smoothMoveMarker?.getObject() as? Marker

                // 停止之前的移动
                smoothMoveMarker?.stopMove()

                // 计算路径的起始点（如果提供了 position，使用它作为起点）
                val startPoint = if (isNotEmpty()) {
                    val currentLat = pendingLatitude ?: marker?.position?.latitude
                    val currentLng = pendingLongitude ?: marker?.position?.longitude
                    if (currentLat != null && currentLng != null) {
                        LatLng(currentLat, currentLng)
                    } else {
                        path.first()
                    }
                } else {
                    path.first()
                }


                // 使用 C++ 优化计算路径中的最近点
                var adjustedPath: List<LatLng>? = null
                val nearestResult = GeometryUtils.getNearestPointOnPath(path, startPoint)
                
                if (nearestResult != null) {
                    val startIndex = nearestResult.index
                    if (startIndex >= 0 && startIndex < path.size - 1) {
                         val subPath = path.subList(startIndex + 1, path.size).toMutableList()
                         subPath.add(0, nearestResult.point)
                         adjustedPath = subPath
                    }
                }

                // 如果 C++ 计算失败，降级使用 SpatialRelationUtil
                if (adjustedPath == null) {
                     val pair = SpatialRelationUtil.calShortestDistancePoint(path, startPoint)
                     adjustedPath = path.subList(pair.first, path.size)
                }
                
                if (adjustedPath.isEmpty()) {
                    adjustedPath = path
                }


                // 🔑 关键修复：先设置内部 Marker 的位置
                internalMarker?.position = adjustedPath.first()
                smoothMoveMarker?.setVisible(true)

                // 设置移动路径
                smoothMoveMarker?.setPoints(adjustedPath)

                // 设置总时长（MovingPointOverlay 的 setTotalDuration 需要秒为单位）
                smoothMoveMarker?.setTotalDuration(smoothMoveDuration.toInt())

                // 开始平滑移动
                smoothMoveMarker?.startSmoothMove()

                // 隐藏原始 Marker，避免重复显示
                marker?.isVisible = false
            } catch (e: Exception) {
                android.util.Log.e("MarkerView", "Start smooth move failed", e)
            }
        }
    }

    /**
     * 停止平滑移动
     */
    private fun stopSmoothMove() {
        smoothMoveMarker?.stopMove()
        smoothMoveMarker?.setVisible(false)
        lastAppliedCustomMarkerKey = null
        marker?.let { showMarker(it) }
    }

    /**
     * 移除标记
     */
    fun removeMarker() {
        // 停止平滑移动
        stopSmoothMove()
        smoothMoveMarker?.destroy()
        smoothMoveMarker = null
        
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
        pendingMarkerIconUpdate = null

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

}
