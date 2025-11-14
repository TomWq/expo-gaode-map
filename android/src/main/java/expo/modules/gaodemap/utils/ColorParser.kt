package expo.modules.gaodemap.utils

import android.graphics.Color

object ColorParser {
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
        return try {
            when {
                color.startsWith("#") -> Color.parseColor(color)
                else -> getNamedColor(color)
            }
        } catch (e: Exception) {
            Color.BLACK
        }
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