package expo.modules.gaodemap.utils

import android.graphics.Color
import androidx.core.graphics.toColorInt

object ColorParser {
    init {
        try {
            System.loadLibrary("gaodecluster")
        } catch (_: Throwable) {
            // Ignore if already loaded
        }
    }

    private external fun nativeParseColor(colorString: String): Int

    /**
     * 解析颜色值
     * 支持格式:
     * - 字符串: "#AARRGGBB", "#RRGGBB", "red", "blue" 等
     * - 数字: Int (ARGB)
     */
    fun parseColor(value: Any?): Int {
        return when (value) {
            is String -> parseColorString(value)
            is Int -> value
            is Long -> value.toInt()
            is Double -> value.toInt()
            else -> Color.BLACK
        }
    }
    
    private fun parseColorString(color: String): Int {
        // Try native parser first
        try {
            val nativeColor = nativeParseColor(color)
            if (nativeColor != 0) {
                return nativeColor
            }
        } catch (_: Throwable) {
            // Fallback to Kotlin implementation
        }

        return try {
            when {
                color.startsWith("#") -> color.toColorInt()
                color.startsWith("rgba(") -> parseRgbaColor(color)
                color.startsWith("rgb(") -> parseRgbColor(color)
                else -> getNamedColor(color)
            }
        } catch (_: Exception) {
            Color.BLACK
        }
    }
    
    private fun parseRgbaColor(color: String): Int {
        val values = color.substringAfter("rgba(").substringBefore(")").split(",").map { it.trim() }
        if (values.size != 4) return Color.BLACK
        
        val r = values[0].toIntOrNull() ?: return Color.BLACK
        val g = values[1].toIntOrNull() ?: return Color.BLACK
        val b = values[2].toIntOrNull() ?: return Color.BLACK
        val a = (values[3].toFloatOrNull()?.times(255))?.toInt() ?: return Color.BLACK
        
        return Color.argb(a, r, g, b)
    }
    
    private fun parseRgbColor(color: String): Int {
        val values = color.substringAfter("rgb(").substringBefore(")").split(",").map { it.trim() }
        if (values.size != 3) return Color.BLACK
        
        val r = values[0].toIntOrNull() ?: return Color.BLACK
        val g = values[1].toIntOrNull() ?: return Color.BLACK
        val b = values[2].toIntOrNull() ?: return Color.BLACK
        
        return Color.rgb(r, g, b)
    }
    
    private fun getNamedColor(name: String): Int {
        return when (name.lowercase()) {
            "red" -> Color.RED
            "blue" -> Color.BLUE
            "green" -> Color.GREEN
            "yellow" -> Color.YELLOW
            "black" -> Color.BLACK
            "white" -> Color.WHITE
            "gray", "grey" -> Color.GRAY
            "cyan" -> Color.CYAN
            "magenta" -> Color.MAGENTA
            "transparent" -> Color.TRANSPARENT
            else -> Color.BLACK
        }
    }
}