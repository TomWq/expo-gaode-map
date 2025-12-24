package expo.modules.gaodemap.utils

import com.amap.api.maps.model.LatLng
import kotlin.math.*

/**
 * 几何计算工具类
 * 
 * 提供高德官方 SDK AMapUtils 中不包含的几何计算方法
 */
object GeometryUtils {

  

    /**
     * 判断点是否在圆内
     * @param point 要判断的点
     * @param center 圆心坐标
     * @param radius 圆半径（单位：米）
     * @return 是否在圆内
     */
    fun isPointInCircle(point: LatLng, center: LatLng, radius: Double): Boolean {
        val distance = calculateDistance(point, center)
        return distance <= radius
    }

    /**
     * 判断点是否在多边形内（射线法）
     * @param point 要判断的点
     * @param polygon 多边形的顶点坐标数组
     * @return 是否在多边形内
     */
    fun isPointInPolygon(point: LatLng, polygon: List<LatLng>): Boolean {
        var inside = false
        val n = polygon.size
        var j = n - 1
        
        for (i in 0 until n) {
            val xi = polygon[i].latitude
            val yi = polygon[i].longitude
            val xj = polygon[j].latitude
            val yj = polygon[j].longitude
            
            if ((yi > point.longitude) != (yj > point.longitude) &&
                (point.latitude < (xj - xi) * (point.longitude - yi) / (yj - yi) + xi)) {
                inside = !inside
            }
            j = i
        }
        
        return inside
    }

    /**
     * 计算两点之间的距离（辅助方法）
     * @param p1 第一个点
     * @param p2 第二个点
     * @return 两点之间的距离（单位：米）
     */
    private fun calculateDistance(p1: LatLng, p2: LatLng): Double {
        val lat1 = Math.toRadians(p1.latitude)
        val lat2 = Math.toRadians(p2.latitude)
        val dLat = lat2 - lat1
        val dLon = Math.toRadians(p2.longitude - p1.longitude)
        
        val a = sin(dLat / 2).pow(2) + cos(lat1) * cos(lat2) * sin(dLon / 2).pow(2)
        val c = 2 * asin(sqrt(a))
        
        return 6371000.0 * c
    }
}
