package expo.modules.gaodemap.map.utils

import com.amap.api.maps.model.LatLng

/**
 * 坐标解析工具类
 * 支持解析多种格式的坐标：
 * 1. Map: { "latitude": 39.9, "longitude": 116.4 }
 * 2. List: [116.4, 39.9] (longitude, latitude)
 */
object LatLngParser {
    
    /**
     * 解析单个坐标点
     */
    fun parseLatLng(data: Any?): LatLng? {
        if (data == null) return null
        
        val latLng = when (data) {
            is Map<*, *> -> {
                val lat = (data["latitude"] as? Number)?.toDouble()
                val lng = (data["longitude"] as? Number)?.toDouble()
                if (lat != null && lng != null) LatLng(lat, lng) else null
            }
            is List<*> -> {
                if (data.size >= 2) {
                    val lng = (data[0] as? Number)?.toDouble()
                    val lat = (data[1] as? Number)?.toDouble()
                    if (lat != null && lng != null) LatLng(lat, lng) else null
                } else null
            }
            else -> null
        }

        // 验证坐标范围
        return if (latLng != null && 
            latLng.latitude >= -90.0 && latLng.latitude <= 90.0 && 
            latLng.longitude >= -180.0 && latLng.longitude <= 180.0) {
            latLng
        } else {
            null
        }
    }

    /**
     * 解析坐标列表
     * 支持扁平列表 [p1, p2, ...] 
     * 也支持嵌套列表 [[p1, p2], [p3, p4]] 并自动展平
     */
    fun parseLatLngList(data: Any?): List<LatLng> {
        if (data == null) return emptyList()
        if (data !is List<*>) return emptyList()

        val result = mutableListOf<LatLng>()
        for (item in data) {
            // 尝试直接解析为点
            val point = parseLatLng(item)
            if (point != null) {
                result.add(point)
            } else if (item is List<*>) {
                // 如果不是点且是列表，递归解析并展平
                result.addAll(parseLatLngList(item))
            }
        }
        return result
    }

    /**
     * 解析嵌套坐标列表 (例如用于多边形孔洞)
     * 返回 List<List<LatLng>>
     */
    fun parseLatLngListList(data: Any?): List<List<LatLng>> {
        if (data == null || data !is List<*>) return emptyList()
        if (data.isEmpty()) return emptyList()

        // 检查第一项。如果第一项能直接解析为点，说明这是一个平铺的列表 [p1, p2, ...]
        if (parseLatLng(data[0]) != null) {
            return listOf(parseLatLngList(data))
        }

        // 否则，它可能是一个嵌套列表 [[p1, p2], [p3, p4]]
        val result = mutableListOf<List<LatLng>>()
        for (item in data) {
            val ring = parseLatLngList(item)
            if (ring.isNotEmpty()) {
                result.add(ring)
            }
        }
        return result
    }
}
