package expo.modules.gaodemap.overlays

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import com.amap.api.maps.AMap
import com.amap.api.maps.model.LatLng
import expo.modules.gaodemap.utils.LatLngParser
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlin.math.roundToInt

/**
 * Real React Native marker overlay.
 *
 * Unlike MarkerView, this view is never converted into a bitmap marker. It stays
 * in the native view hierarchy above TextureMapView and is positioned from the
 * map projection on camera changes.
 */
@SuppressLint("ViewConstructor")
class LiveMarkerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onPress by EventDispatcher()

  private var aMap: AMap? = null
  private var position: LatLng? = null
  private var anchorX: Float = 0.5f
  private var anchorY: Float = 1.0f
  private var offsetX: Float = 0f
  private var offsetY: Float = 0f
  private var markerVisible: Boolean = true
  internal var contentWidthPx: Int = 0
    private set
  internal var contentHeightPx: Int = 0
    private set
  internal var tracksCamera: Boolean = true

  init {
    isClickable = true
    isFocusable = false
    setBackgroundColor(Color.TRANSPARENT)
    setOnClickListener {
      val point = position ?: return@setOnClickListener
      onPress(
        mapOf(
          "latitude" to point.latitude,
          "longitude" to point.longitude,
        )
      )
    }
  }

  fun setMap(map: AMap) {
    aMap = map
    updateScreenPosition()
  }

  fun clearMap() {
    aMap = null
  }

  fun setPosition(positionData: Map<String, Any>?) {
    position = LatLngParser.parseLatLng(positionData)
    updateScreenPosition()
  }

  fun setAnchor(anchor: Map<String, Any>?) {
    anchorX = ((anchor?.get("x") as? Number)?.toFloat() ?: 0.5f).coerceIn(0f, 1f)
    anchorY = ((anchor?.get("y") as? Number)?.toFloat() ?: 1.0f).coerceIn(0f, 1f)
    updateScreenPosition()
  }

  fun setOffset(offset: Map<String, Any>?) {
    offsetX = (offset?.get("x") as? Number)?.toFloat() ?: 0f
    offsetY = (offset?.get("y") as? Number)?.toFloat() ?: 0f
    updateScreenPosition()
  }

  fun setContentWidth(width: Int) {
    contentWidthPx = width.coerceAtLeast(0)
    requestLayout()
    updateScreenPosition()
  }

  fun setContentHeight(height: Int) {
    contentHeightPx = height.coerceAtLeast(0)
    requestLayout()
    updateScreenPosition()
  }

  fun setVisible(visible: Boolean) {
    markerVisible = visible
    updateScreenPosition()
  }

  fun setTracksCamera(enabled: Boolean) {
    tracksCamera = enabled
  }

  fun setZIndexValue(zIndex: Float) {
    this.z = zIndex
    this.translationZ = zIndex
  }

  override fun generateDefaultLayoutParams(): LayoutParams {
    return LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT)
  }

  override fun generateLayoutParams(attrs: android.util.AttributeSet?): LayoutParams {
    return LayoutParams(context, attrs)
  }

  override fun generateLayoutParams(lp: ViewGroup.LayoutParams?): LayoutParams {
    return when (lp) {
      is LayoutParams -> LayoutParams(
        sanitizeLayoutSize(lp.width),
        sanitizeLayoutSize(lp.height),
      ).also {
        it.leftMargin = lp.leftMargin
        it.topMargin = lp.topMargin
        it.rightMargin = lp.rightMargin
        it.bottomMargin = lp.bottomMargin
      }
      is MarginLayoutParams -> LayoutParams(
        sanitizeLayoutSize(lp.width),
        sanitizeLayoutSize(lp.height),
      ).also {
        it.leftMargin = lp.leftMargin
        it.topMargin = lp.topMargin
        it.rightMargin = lp.rightMargin
        it.bottomMargin = lp.bottomMargin
      }
      else -> LayoutParams(
        sanitizeLayoutSize(lp?.width ?: LayoutParams.WRAP_CONTENT),
        sanitizeLayoutSize(lp?.height ?: LayoutParams.WRAP_CONTENT),
      )
    }
  }

  override fun checkLayoutParams(p: ViewGroup.LayoutParams?): Boolean {
    return p is LayoutParams
  }

  override fun addView(child: View?, index: Int, params: ViewGroup.LayoutParams?) {
    super.addView(child, index, generateLayoutParams(params))
  }

  private fun sanitizeLayoutSize(size: Int): Int {
    return if (size == LayoutParams.MATCH_PARENT) LayoutParams.WRAP_CONTENT else size
  }

  override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
    val childWidthSpec = if (contentWidthPx > 0) {
      MeasureSpec.makeMeasureSpec(contentWidthPx, MeasureSpec.EXACTLY)
    } else {
      MeasureSpec.makeMeasureSpec(MeasureSpec.getSize(widthMeasureSpec), MeasureSpec.AT_MOST)
    }
    val childHeightSpec = if (contentHeightPx > 0) {
      MeasureSpec.makeMeasureSpec(contentHeightPx, MeasureSpec.EXACTLY)
    } else {
      MeasureSpec.makeMeasureSpec(MeasureSpec.getSize(heightMeasureSpec), MeasureSpec.AT_MOST)
    }

    var measuredContentWidth = contentWidthPx
    var measuredContentHeight = contentHeightPx

    for (index in 0 until childCount) {
      val child = getChildAt(index) ?: continue
      if (child.visibility == View.GONE) continue

      child.measure(childWidthSpec, childHeightSpec)
      measuredContentWidth = maxOf(measuredContentWidth, child.measuredWidth)
      measuredContentHeight = maxOf(measuredContentHeight, child.measuredHeight)
    }

    setMeasuredDimension(
      maxOf(measuredContentWidth, suggestedMinimumWidth),
      maxOf(measuredContentHeight, suggestedMinimumHeight),
    )
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    for (index in 0 until childCount) {
      val child = getChildAt(index) ?: continue
      if (child.visibility == View.GONE) continue

      val lp = child.layoutParams as? MarginLayoutParams
      val childLeft = lp?.leftMargin ?: 0
      val childTop = lp?.topMargin ?: 0
      child.layout(
        childLeft,
        childTop,
        childLeft + child.measuredWidth,
        childTop + child.measuredHeight,
      )
    }

    updateScreenPosition()
  }

  fun updateScreenPosition() {
    val map = aMap
    val point = position
    if (!markerVisible || map == null || point == null) {
      visibility = View.GONE
      return
    }

    val screenPoint = map.projection.toScreenLocation(point)
    val markerWidth = measuredWidth.takeIf { it > 0 } ?: width
    val markerHeight = measuredHeight.takeIf { it > 0 } ?: height
    val x = screenPoint.x - markerWidth * anchorX + offsetX
    val y = screenPoint.y - markerHeight * anchorY + offsetY

    translationX = x.roundToInt().toFloat()
    translationY = y.roundToInt().toFloat()
    visibility = View.VISIBLE
  }
}
