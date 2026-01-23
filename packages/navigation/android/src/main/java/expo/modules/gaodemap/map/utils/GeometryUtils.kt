package expo.modules.gaodemap.map.utils

import com.amap.api.maps.AMapUtils
import com.amap.api.maps.model.LatLng
import kotlin.math.*

/**
 * 几何计算工具类
 * 
 * 提供高德官方 SDK AMapUtils 中不包含的几何计算方法
 */
object GeometryUtils {

    init {
        System.loadLibrary("gaodecluster_nav")
    }

    private external fun nativeIsPointInCircle(
        pointLat: Double,
        pointLon: Double,
        centerLat: Double,
        centerLon: Double,
        radiusMeters: Double
    ): Boolean

    private external fun nativeIsPointInPolygon(
        pointLat: Double,
        pointLon: Double,
        latitudes: DoubleArray,
        longitudes: DoubleArray
    ): Boolean

    private external fun nativeCalculatePolygonArea(
        latitudes: DoubleArray,
        longitudes: DoubleArray
    ): Double

    private external fun nativeCalculateRectangleArea(
        swLat: Double,
        swLon: Double,
        neLat: Double,
        neLon: Double
    ): Double

    private external fun nativeCalculateDistance(
        lat1: Double,
        lon1: Double,
        lat2: Double,
        lon2: Double
    ): Double

    private external fun nativeSimplifyPolyline(
        latitudes: DoubleArray,
        longitudes: DoubleArray,
        tolerance: Double
    ): DoubleArray

    private external fun nativeCalculatePathLength(
        latitudes: DoubleArray,
        longitudes: DoubleArray
    ): Double

    private external fun nativeGetPointAtDistance(
        latitudes: DoubleArray,
        longitudes: DoubleArray,
        distanceMeters: Double
    ): DoubleArray

    private external fun nativeGetNearestPointOnPath(
        latitudes: DoubleArray,
        longitudes: DoubleArray,
        targetLat: Double,
        targetLon: Double
    ): DoubleArray

    private external fun nativeCalculateCentroid(
        latitudes: DoubleArray,
        longitudes: DoubleArray
    ): DoubleArray

    private external fun nativeCalculatePathBounds(
        latitudes: DoubleArray,
        longitudes: DoubleArray
    ): DoubleArray?

    private external fun nativeEncodeGeoHash(
        lat: Double,
        lon: Double,
        precision: Int
    ): String

    private external fun nativeLatLngToTile(
        lat: Double,
        lon: Double,
        zoom: Int
    ): IntArray

    private external fun nativeTileToLatLng(
        x: Int,
        y: Int,
        zoom: Int
    ): DoubleArray

    private external fun nativeLatLngToPixel(
        lat: Double,
        lon: Double,
        zoom: Int
    ): DoubleArray

    private external fun nativePixelToLatLng(
        x: Double,
        y: Double,
        zoom: Int
    ): DoubleArray

    private external fun nativeFindPointInPolygons(
        pointLat: Double,
        pointLon: Double,
        polygons: Array<DoubleArray>,
        polygonsLon: Array<DoubleArray>
    ): Int

    private external fun nativeGenerateHeatmapGrid(
        latitudes: DoubleArray,
        longitudes: DoubleArray,
        weights: DoubleArray,
        gridSizeMeters: Double
    ): DoubleArray

    /**
     * 判断点是否在圆内
     * @param point 要判断的点
     * @param center 圆心坐标
     * @param radius 圆半径（单位：米）
     * @return 是否在圆内
     */
    fun isPointInCircle(point: LatLng, center: LatLng, radius: Double): Boolean {
        return try {
            nativeIsPointInCircle(
                point.latitude,
                point.longitude,
                center.latitude,
                center.longitude,
                radius
            )
        } catch (_: Throwable) {
            val distance = calculateDistance(point, center)
            distance <= radius
        }
    }

    /**
     * 判断点是否在多边形内（射线法）
     * @param point 要判断的点
     * @param polygon 多边形的顶点坐标数组
     * @return 是否在多边形内
     */
    fun isPointInPolygon(point: LatLng, polygon: List<LatLng>): Boolean {
        return try {
            val latitudes = DoubleArray(polygon.size)
            val longitudes = DoubleArray(polygon.size)
            for (i in polygon.indices) {
                latitudes[i] = polygon[i].latitude
                longitudes[i] = polygon[i].longitude
            }
            nativeIsPointInPolygon(point.latitude, point.longitude, latitudes, longitudes)
        } catch (_: Throwable) {
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

            inside
        }
    }

    fun calculatePolygonArea(polygon: List<LatLng>): Double {
        if (polygon.size < 3) {
            return 0.0
        }
        return try {
            val latitudes = DoubleArray(polygon.size)
            val longitudes = DoubleArray(polygon.size)
            for (i in polygon.indices) {
                latitudes[i] = polygon[i].latitude
                longitudes[i] = polygon[i].longitude
            }
            nativeCalculatePolygonArea(latitudes, longitudes)
        } catch (_: Throwable) {
            AMapUtils.calculateArea(polygon).toDouble()
        }
    }

    fun calculateRectangleArea(southWest: LatLng, northEast: LatLng): Double {
        return try {
            nativeCalculateRectangleArea(
                southWest.latitude,
                southWest.longitude,
                northEast.latitude,
                northEast.longitude
            )
        } catch (_: Throwable) {
            val rectangle = listOf(
                LatLng(southWest.latitude, southWest.longitude),
                LatLng(southWest.latitude, northEast.longitude),
                LatLng(northEast.latitude, northEast.longitude),
                LatLng(northEast.latitude, southWest.longitude)
            )
            AMapUtils.calculateArea(rectangle).toDouble()
        }
    }

    /**
     * 计算两点之间的距离
     * @param p1 第一个点
     * @param p2 第二个点
     * @return 两点之间的距离（单位：米）
     */
    fun calculateDistance(p1: LatLng, p2: LatLng): Double {
        return try {
            nativeCalculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
        } catch (_: Throwable) {
            val lat1 = Math.toRadians(p1.latitude)
            val lat2 = Math.toRadians(p2.latitude)
            val dLat = lat2 - lat1
            val dLon = Math.toRadians(p2.longitude - p1.longitude)
            
            val a = sin(dLat / 2).pow(2) + cos(lat1) * cos(lat2) * sin(dLon / 2).pow(2)
            val c = 2 * asin(sqrt(a))
            
            6371000.0 * c
        }
    }

    /**
     * 轨迹抽稀（RDP 算法）
     * @param points 原始轨迹点
     * @param tolerance 允许误差（米）
     * @return 简化后的轨迹点
     */
    fun simplifyPolyline(points: List<LatLng>, tolerance: Double): List<LatLng> {
        if (points.size < 3) return points
        return try {
            val latitudes = DoubleArray(points.size)
            val longitudes = DoubleArray(points.size)
            for (i in points.indices) {
                latitudes[i] = points[i].latitude
                longitudes[i] = points[i].longitude
            }
            val result = nativeSimplifyPolyline(latitudes, longitudes, tolerance)
            val simplified = ArrayList<LatLng>(result.size / 2)
            for (i in result.indices step 2) {
                simplified.add(LatLng(result[i], result[i+1]))
            }
            simplified
        } catch (_: Throwable) {
            points
        }
    }

    /**
     * 计算路径总长度
     */
    fun calculatePathLength(points: List<LatLng>): Double {
        if (points.size < 2) return 0.0
        return try {
            val latitudes = DoubleArray(points.size)
            val longitudes = DoubleArray(points.size)
            for (i in points.indices) {
                latitudes[i] = points[i].latitude
                longitudes[i] = points[i].longitude
            }
            nativeCalculatePathLength(latitudes, longitudes)
        } catch (_: Throwable) {
            var total = 0.0
            for (i in 0 until points.size - 1) {
                total += calculateDistance(points[i], points[i+1])
            }
            total
        }
    }

    data class PointAtDistance(val point: LatLng, val angle: Double)

    /**
     * 获取路径上指定距离的点和角度
     */
    fun getPointAtDistance(points: List<LatLng>, distanceMeters: Double): PointAtDistance? {
        if (points.size < 2) return null
        return try {
            val latitudes = DoubleArray(points.size)
            val longitudes = DoubleArray(points.size)
            for (i in points.indices) {
                latitudes[i] = points[i].latitude
                longitudes[i] = points[i].longitude
            }
            val result = nativeGetPointAtDistance(latitudes, longitudes, distanceMeters)
            if (result != null && result.size >= 3) {
                PointAtDistance(LatLng(result[0], result[1]), result[2])
            } else {
                null
            }
        } catch (_: Throwable) {
            null
        }
    }

    data class NearestPointResult(val point: LatLng, val index: Int, val distanceMeters: Double)

    /**
     * 获取路径上距离目标点最近的点
     * @param points 路径点集合
     * @param target 目标点
     * @return 最近点结果，包含点坐标、最近点在路径中的索引（作为起始点的线段）、以及到路径的距离
     */
    fun getNearestPointOnPath(points: List<LatLng>, target: LatLng): NearestPointResult? {
        if (points.size < 2) return null
        return try {
            val latitudes = DoubleArray(points.size)
            val longitudes = DoubleArray(points.size)
            for (i in points.indices) {
                latitudes[i] = points[i].latitude
                longitudes[i] = points[i].longitude
            }
            val result = nativeGetNearestPointOnPath(latitudes, longitudes, target.latitude, target.longitude)
            if (result != null && result.size >= 4) {
                NearestPointResult(
                    LatLng(result[0], result[1]),
                    result[2].toInt(),
                    result[3]
                )
            } else {
                null
            }
        } catch (_: Throwable) {
            null
        }
    }

    fun calculateCentroid(points: List<LatLng>): LatLng? {
        if (points.size < 3) return null
        return try {
            val latitudes = DoubleArray(points.size)
            val longitudes = DoubleArray(points.size)
            for (i in points.indices) {
                latitudes[i] = points[i].latitude
                longitudes[i] = points[i].longitude
            }
            val result = nativeCalculateCentroid(latitudes, longitudes)
            if (result != null && result.size >= 2) {
                LatLng(result[0], result[1])
            } else {
                null
            }
        } catch (_: Throwable) {
            null
        }
    }

    data class PathBounds(
        val north: Double,
        val south: Double,
        val east: Double,
        val west: Double,
        val centerLat: Double,
        val centerLon: Double
    )

    /**
     * 计算路径的边界和中心点
     */
    fun calculatePathBounds(points: List<LatLng>): PathBounds? {
        if (points.isEmpty()) return null
        return try {
            val latitudes = DoubleArray(points.size)
            val longitudes = DoubleArray(points.size)
            for (i in points.indices) {
                latitudes[i] = points[i].latitude
                longitudes[i] = points[i].longitude
            }
            val result = nativeCalculatePathBounds(latitudes, longitudes)
            if (result != null && result.size >= 6) {
                PathBounds(result[0], result[1], result[2], result[3], result[4], result[5])
            } else {
                null
            }
        } catch (_: Throwable) {
            null
        }
    }

    fun encodeGeoHash(point: LatLng, precision: Int): String {
        return try {
            nativeEncodeGeoHash(point.latitude, point.longitude, precision)
        } catch (_: Throwable) {
            ""
        }
    }

    /**
     * 解析高德地图 API 返回的 Polyline 字符串
     * 格式: "lng,lat;lng,lat;..."
     */
    fun parsePolyline(polylineStr: String?): List<LatLng> {
        if (polylineStr.isNullOrEmpty()) return emptyList()
        return try {
            val result = nativeParsePolyline(polylineStr)
            if (result != null && result.isNotEmpty()) {
                val points = mutableListOf<LatLng>()
                for (i in 0 until result.size step 2) {
                    points.add(LatLng(result[i], result[i+1]))
                }
                points
            } else {
                emptyList()
            }
        } catch (_: Throwable) {
            emptyList()
        }
    }

    private external fun nativeParsePolyline(
        polylineStr: String
    ): DoubleArray?

    fun latLngToTile(latLng: LatLng, zoom: Int): IntArray? {
        return try {
            nativeLatLngToTile(latLng.latitude, latLng.longitude, zoom)
        } catch (_: Throwable) {
            null
        }
    }

    fun tileToLatLng(x: Int, y: Int, zoom: Int): LatLng? {
        return try {
            val result = nativeTileToLatLng(x, y, zoom)
            if (result != null && result.size >= 2) {
                LatLng(result[0], result[1])
            } else {
                null
            }
        } catch (_: Throwable) {
            null
        }
    }

    fun latLngToPixel(latLng: LatLng, zoom: Int): DoubleArray? {
        return try {
            nativeLatLngToPixel(latLng.latitude, latLng.longitude, zoom)
        } catch (_: Throwable) {
            null
        }
    }

    fun pixelToLatLng(x: Double, y: Double, zoom: Int): LatLng? {
        return try {
            val result = nativePixelToLatLng(x, y, zoom)
            if (result != null && result.size >= 2) {
                LatLng(result[0], result[1])
            } else {
                null
            }
        } catch (_: Throwable) {
            null
        }
    }

    fun findPointInPolygons(point: LatLng, polygons: List<List<LatLng>>): Int {
        if (polygons.isEmpty()) return -1
        return try {
            val polygonsLat = Array(polygons.size) { i ->
                DoubleArray(polygons[i].size) { j -> polygons[i][j].latitude }
            }
            val polygonsLon = Array(polygons.size) { i ->
                DoubleArray(polygons[i].size) { j -> polygons[i][j].longitude }
            }
            nativeFindPointInPolygons(point.latitude, point.longitude, polygonsLat, polygonsLon)
        } catch (_: Throwable) {
            -1
        }
    }

    data class HeatmapGridCell(val latitude: Double, val longitude: Double, val intensity: Double)

    fun generateHeatmapGrid(
        latitudes: DoubleArray,
        longitudes: DoubleArray,
        weights: DoubleArray,
        gridSizeMeters: Double
    ): List<HeatmapGridCell> {
        if (latitudes.isEmpty() || latitudes.size != longitudes.size || latitudes.size != weights.size) return emptyList()
        return try {
            val result = nativeGenerateHeatmapGrid(latitudes, longitudes, weights, gridSizeMeters)
            val cells = mutableListOf<HeatmapGridCell>()
            for (i in result.indices step 3) {
                cells.add(HeatmapGridCell(result[i], result[i+1], result[i+2]))
            }
            cells
        } catch (_: Throwable) {
            emptyList()
        }
    }
}
