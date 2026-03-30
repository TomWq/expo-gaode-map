package expo.modules.gaodemap.overlays

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Rect
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.core.graphics.createBitmap
import expo.modules.gaodemap.companion.IconBitmapCache
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.text.StringBuilder

internal data class MarkerBitmapSnapshot(
    val keyPart: String,
    val width: Int,
    val height: Int,
) {
    val fullCacheKey: String
        get() = "$keyPart|${width}x${height}"
}

internal object MarkerBitmapRenderer {
    fun hasPendingAsyncImageContent(view: View?): Boolean {
        view ?: return false
        if (view.visibility != View.VISIBLE) return false

        if (view is ImageView) {
            val resolvedWidth = view.measuredWidth.takeIf { it > 0 } ?: view.width
            val resolvedHeight = view.measuredHeight.takeIf { it > 0 } ?: view.height
            if (resolvedWidth > 0 && resolvedHeight > 0 && view.drawable == null) {
                return true
            }
        }

        if (view is ViewGroup) {
            for (index in 0 until view.childCount) {
                if (hasPendingAsyncImageContent(view.getChildAt(index))) {
                    return true
                }
            }
        }

        return false
    }

    fun resolveSnapshot(
        container: ViewGroup,
        customViewWidth: Int,
        customViewHeight: Int,
        cacheKey: String?,
    ): MarkerBitmapSnapshot? {
        if (container.childCount == 0) {
            return null
        }

        val child = container.getChildAt(0) ?: return null
        if (hasPendingAsyncImageContent(child)) {
            return null
        }
        val contentView = resolveRenderableContentView(child)
        val contentBounds = computeContentBounds(child)
        val measuredWidth =
            contentBounds?.width()
                ?: contentView?.measuredWidth
                ?: child.measuredWidth
                ?: 0
        val measuredHeight =
            contentBounds?.height()
                ?: contentView?.measuredHeight
                ?: child.measuredHeight
                ?: 0

        val finalWidth = if (measuredWidth > 0) measuredWidth else customViewWidth
        val finalHeight = if (measuredHeight > 0) measuredHeight else customViewHeight

        if (finalWidth <= 0 || finalHeight <= 0) {
            return null
        }

        return MarkerBitmapSnapshot(
            keyPart = cacheKey ?: computeViewFingerprint(container),
            width = finalWidth,
            height = finalHeight,
        )
    }

    fun createBitmap(
        container: ViewGroup,
        snapshot: MarkerBitmapSnapshot,
        customViewWidth: Int,
        customViewHeight: Int,
        mainHandler: Handler,
    ): Bitmap? {
        IconBitmapCache.get(snapshot.fullCacheKey)?.let { return it }

        val bitmap =
            if (Looper.myLooper() == Looper.getMainLooper()) {
                renderViewToBitmapInternal(
                    container = container,
                    finalWidth = snapshot.width,
                    finalHeight = snapshot.height,
                    customViewWidth = customViewWidth,
                    customViewHeight = customViewHeight,
                )
            } else {
                val latch = CountDownLatch(1)
                var result: Bitmap? = null
                mainHandler.post {
                    try {
                        result =
                            renderViewToBitmapInternal(
                                container = container,
                                finalWidth = snapshot.width,
                                finalHeight = snapshot.height,
                                customViewWidth = customViewWidth,
                                customViewHeight = customViewHeight,
                            )
                    } finally {
                        latch.countDown()
                    }
                }
                try {
                    latch.await(200, TimeUnit.MILLISECONDS)
                } catch (_: InterruptedException) {
                }
                result
            }

        bitmap?.let { IconBitmapCache.put(snapshot.fullCacheKey, it) }
        return bitmap
    }

    fun computeContentBounds(view: View?): Rect? {
        view ?: return null
        if (view.visibility != View.VISIBLE) return null

        var resolvedBounds: Rect? = null

        if (view is ViewGroup && view.childCount > 0) {
            for (i in 0 until view.childCount) {
                val child = view.getChildAt(i) ?: continue
                val childBounds = computeContentBounds(child) ?: continue
                val shiftedBounds = Rect(childBounds)
                shiftedBounds.offset(child.left, child.top)
                resolvedBounds =
                    if (resolvedBounds == null) {
                        shiftedBounds
                    } else {
                        Rect(resolvedBounds).apply { union(shiftedBounds) }
                    }
            }
        }

        val hasOwnVisualBounds =
            view.background != null ||
                view.paddingLeft != 0 ||
                view.paddingTop != 0 ||
                view.paddingRight != 0 ||
                view.paddingBottom != 0 ||
                view !is ViewGroup

        val ownWidth = view.measuredWidth.takeIf { it > 0 } ?: view.width
        val ownHeight = view.measuredHeight.takeIf { it > 0 } ?: view.height

        if (hasOwnVisualBounds && ownWidth > 0 && ownHeight > 0) {
            val ownBounds = Rect(0, 0, ownWidth, ownHeight)
            resolvedBounds =
                if (resolvedBounds == null) {
                    ownBounds
                } else {
                    Rect(resolvedBounds).apply { union(ownBounds) }
                }
        }

        return resolvedBounds
    }

    fun resolveRenderableContentView(view: View?): View? {
        var current = view ?: return null

        while (current is ViewGroup && current.childCount == 1) {
            val next = current.getChildAt(0) ?: break
            current = next
        }

        return current
    }

    fun computeViewFingerprint(view: View?): String {
        if (view == null) return "null"

        val sb = StringBuilder()
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

        fun appendFor(v: View) {
            sb.append(v.javaClass.simpleName)
            when (v) {
                is TextView -> {
                    val text = v.text?.toString() ?: ""
                    if (text.isNotEmpty()) {
                        sb.append("[text=").append(text).append("]")
                    }
                }

                is ImageView -> {
                    val resId = v.tag
                    if (resId is Int && resId != 0) {
                        sb.append("[imgRes=").append(resId).append("]")
                    } else {
                        val drawable = v.drawable
                        if (drawable != null) {
                            sb.append("[drawableHash=").append(drawable.hashCode()).append("]")
                        }
                    }
                }
            }
            sb.append(";")
            if (v is ViewGroup) {
                for (i in 0 until v.childCount) {
                    appendFor(v.getChildAt(i))
                }
            }
        }

        appendFor(view)
        return sb.toString().take(1024)
    }

    private fun renderViewToBitmapInternal(
        container: ViewGroup,
        finalWidth: Int,
        finalHeight: Int,
        customViewWidth: Int,
        customViewHeight: Int,
    ): Bitmap? {
        try {
            val childView = container.getChildAt(0) ?: return null

            if (childView.width != finalWidth || childView.height != finalHeight) {
                if (childView.width == 0 || childView.height == 0) {
                    return null
                }

                val widthSpec = View.MeasureSpec.makeMeasureSpec(finalWidth, View.MeasureSpec.EXACTLY)
                val heightSpec = View.MeasureSpec.makeMeasureSpec(finalHeight, View.MeasureSpec.EXACTLY)
                childView.measure(widthSpec, heightSpec)
                childView.layout(0, 0, finalWidth, finalHeight)
            } else if (childView.left != 0 || childView.top != 0) {
                childView.layout(0, 0, finalWidth, finalHeight)
            }

            val bitmap = createBitmap(finalWidth, finalHeight)
            val canvas = Canvas(bitmap)
            childView.draw(canvas)

            val shouldTrimTransparentPadding = customViewWidth <= 0 && customViewHeight <= 0
            return if (shouldTrimTransparentPadding) trimTransparentPadding(bitmap) else bitmap
        } catch (_: Exception) {
            return null
        }
    }

    private fun trimTransparentPadding(bitmap: Bitmap): Bitmap {
        if (bitmap.width <= 1 || bitmap.height <= 1) {
            return bitmap
        }

        if (hasOpaquePixelsOnAllBitmapEdges(bitmap)) {
            return bitmap
        }

        var minX = bitmap.width
        var minY = bitmap.height
        var maxX = -1
        var maxY = -1

        for (y in 0 until bitmap.height) {
            for (x in 0 until bitmap.width) {
                if (Color.alpha(bitmap.getPixel(x, y)) != 0) {
                    if (x < minX) minX = x
                    if (y < minY) minY = y
                    if (x > maxX) maxX = x
                    if (y > maxY) maxY = y
                }
            }
        }

        if (maxX < minX || maxY < minY) {
            return bitmap
        }

        val trimmedWidth = maxX - minX + 1
        val trimmedHeight = maxY - minY + 1
        if (trimmedWidth == bitmap.width && trimmedHeight == bitmap.height) {
            return bitmap
        }

        return Bitmap.createBitmap(bitmap, minX, minY, trimmedWidth, trimmedHeight)
    }

    private fun hasOpaquePixelsOnAllBitmapEdges(bitmap: Bitmap): Boolean {
        var topEdgeHasPixel = false
        var bottomEdgeHasPixel = false
        var leftEdgeHasPixel = false
        var rightEdgeHasPixel = false

        for (x in 0 until bitmap.width) {
            if (!topEdgeHasPixel && Color.alpha(bitmap.getPixel(x, 0)) != 0) {
                topEdgeHasPixel = true
            }
            if (!bottomEdgeHasPixel && Color.alpha(bitmap.getPixel(x, bitmap.height - 1)) != 0) {
                bottomEdgeHasPixel = true
            }
            if (topEdgeHasPixel && bottomEdgeHasPixel) {
                break
            }
        }

        for (y in 0 until bitmap.height) {
            if (!leftEdgeHasPixel && Color.alpha(bitmap.getPixel(0, y)) != 0) {
                leftEdgeHasPixel = true
            }
            if (!rightEdgeHasPixel && Color.alpha(bitmap.getPixel(bitmap.width - 1, y)) != 0) {
                rightEdgeHasPixel = true
            }
            if (leftEdgeHasPixel && rightEdgeHasPixel) {
                break
            }
        }

        return topEdgeHasPixel && bottomEdgeHasPixel && leftEdgeHasPixel && rightEdgeHasPixel
    }
}
