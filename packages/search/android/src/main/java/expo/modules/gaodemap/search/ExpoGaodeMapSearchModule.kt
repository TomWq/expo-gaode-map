package expo.modules.gaodemap.search

import android.content.Context
import com.amap.api.services.core.LatLonPoint
import com.amap.api.services.core.PoiItem
import com.amap.api.services.help.Inputtips
import com.amap.api.services.help.InputtipsQuery
import com.amap.api.services.help.Tip
import com.amap.api.services.poisearch.PoiResult
import com.amap.api.services.poisearch.PoiSearch
import com.amap.api.services.route.RouteSearch
import com.amap.api.services.routepoisearch.RoutePOISearch
import com.amap.api.services.routepoisearch.RoutePOISearchQuery
import com.amap.api.services.routepoisearch.RoutePOISearchResult
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoGaodeMapSearchModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exception("React context is null")

  override fun definition() = ModuleDefinition {
    Name("ExpoGaodeMapSearch")

    /**
     * POI 搜索
     */
    AsyncFunction("searchPOI") { options: Map<String, Any?>, promise: Promise ->
      try {
        val keyword = options["keyword"] as? String
          ?: throw Exception("keyword is required")
        
        val city = options["city"] as? String ?: ""
        val types = options["types"] as? String ?: ""
        val pageSize = (options["pageSize"] as? Number)?.toInt() ?: 20
        val pageNum = (options["pageNum"] as? Number)?.toInt() ?: 1
        
        val query = PoiSearch.Query(keyword, types, city)
        query.pageSize = pageSize
        query.pageNum = pageNum - 1 // 高德 SDK 从 0 开始
        
        val poiSearch = PoiSearch(context, query)
        
        poiSearch.setOnPoiSearchListener(object : PoiSearch.OnPoiSearchListener {
          override fun onPoiSearched(result: PoiResult?, rCode: Int) {
            if (rCode == 1000) {
              promise.resolve(convertPoiResult(result))
            } else {
              promise.reject("SEARCH_ERROR", "Search failed with code: $rCode", null)
            }
          }

          override fun onPoiItemSearched(item: PoiItem?, rCode: Int) {
            // 不使用单个 POI 搜索
          }
        })
        
        poiSearch.searchPOIAsyn()
      } catch (e: Exception) {
        promise.reject("SEARCH_ERROR", e.message, e)
      }
    }

    /**
     * 周边搜索
     */
    AsyncFunction("searchNearby") { options: Map<String, Any?>, promise: Promise ->
      try {
        val keyword = options["keyword"] as? String
          ?: throw Exception("keyword is required")
        
        val center = options["center"] as? Map<String, Any?>
          ?: throw Exception("center is required")
        
        val latitude = (center["latitude"] as? Number)?.toDouble()
          ?: throw Exception("center.latitude is required")
        val longitude = (center["longitude"] as? Number)?.toDouble()
          ?: throw Exception("center.longitude is required")
        
        val radius = (options["radius"] as? Number)?.toInt() ?: 1000
        val types = options["types"] as? String ?: ""
        val pageSize = (options["pageSize"] as? Number)?.toInt() ?: 20
        val pageNum = (options["pageNum"] as? Number)?.toInt() ?: 1
        
        val query = PoiSearch.Query(keyword, types)
        query.pageSize = pageSize
        query.pageNum = pageNum - 1
        
        val poiSearch = PoiSearch(context, query)
        poiSearch.setBound(PoiSearch.SearchBound(
          LatLonPoint(latitude, longitude), radius
        ))
        
        poiSearch.setOnPoiSearchListener(object : PoiSearch.OnPoiSearchListener {
          override fun onPoiSearched(result: PoiResult?, rCode: Int) {
            if (rCode == 1000) {
              promise.resolve(convertPoiResult(result))
            } else {
              promise.reject("SEARCH_ERROR", "Search failed with code: $rCode", null)
            }
          }

          override fun onPoiItemSearched(item: PoiItem?, rCode: Int) {}
        })
        
        poiSearch.searchPOIAsyn()
      } catch (e: Exception) {
        promise.reject("SEARCH_ERROR", e.message, e)
      }
    }

    /**
     * 沿途搜索
     */
    AsyncFunction("searchAlong") { options: Map<String, Any?>, promise: Promise ->
      try {
        val keyword = options["keyword"] as? String
          ?: throw Exception("keyword is required")
        
        val polyline = options["polyline"] as? List<Map<String, Any?>>
          ?: throw Exception("polyline is required")
        
        if (polyline.size < 2) {
          throw Exception("polyline must have at least 2 points")
        }
        
        // 转换路线点
        val points = polyline.map { point ->
          val lat = (point["latitude"] as? Number)?.toDouble()
            ?: throw Exception("Invalid polyline point")
          val lng = (point["longitude"] as? Number)?.toDouble()
            ?: throw Exception("Invalid polyline point")
          LatLonPoint(lat, lng)
        }
        
        val startPoint = points.first()
        val endPoint = points.last()
        
        // 构造沿途搜索参数
        val searchRange = 250 // 搜索半径（米）
        // 使用枚举类型作为搜索类型
        val searchType = when(keyword.lowercase()) {
          "加油站", "加油" -> RoutePOISearch.RoutePOISearchType.TypeGasStation
          "atm", "银行" -> RoutePOISearch.RoutePOISearchType.TypeATM
          "汽修", "维修" -> RoutePOISearch.RoutePOISearchType.TypeMaintenanceStation
          "厕所", "卫生间" -> RoutePOISearch.RoutePOISearchType.TypeToilet
          else -> RoutePOISearch.RoutePOISearchType.TypeGasStation // 默认搜索加油站
        }
        val query = RoutePOISearchQuery(startPoint, endPoint, 1, searchType, searchRange)
        
        val routePOISearch = RoutePOISearch(context, query)
        
        routePOISearch.setPoiSearchListener(object : RoutePOISearch.OnRoutePOISearchListener {
          override fun onRoutePoiSearched(result: RoutePOISearchResult?, rCode: Int) {
            if (rCode == 1000 && result != null) {
              promise.resolve(convertRoutePOIResult(result))
            } else {
              promise.reject("SEARCH_ERROR", "Route search failed with code: $rCode", null)
            }
          }
        })
        
        routePOISearch.searchRoutePOIAsyn()
      } catch (e: Exception) {
        promise.reject("SEARCH_ERROR", e.message, e)
      }
    }

    /**
     * 多边形搜索（使用矩形范围代替）
     */
    AsyncFunction("searchPolygon") { options: Map<String, Any?>, promise: Promise ->
      try {
        val keyword = options["keyword"] as? String
          ?: throw Exception("keyword is required")
        
        val polygon = options["polygon"] as? List<Map<String, Any?>>
          ?: throw Exception("polygon is required")
        
        val types = options["types"] as? String ?: ""
        val pageSize = (options["pageSize"] as? Number)?.toInt() ?: 20
        val pageNum = (options["pageNum"] as? Number)?.toInt() ?: 1
        
        // 计算边界矩形
        val points = polygon.map { point ->
          val lat = (point["latitude"] as? Number)?.toDouble()
            ?: throw Exception("Invalid polygon point")
          val lng = (point["longitude"] as? Number)?.toDouble()
            ?: throw Exception("Invalid polygon point")
          LatLonPoint(lat, lng)
        }
        
        val minLat = points.minOf { it.latitude }
        val maxLat = points.maxOf { it.latitude }
        val minLng = points.minOf { it.longitude }
        val maxLng = points.maxOf { it.longitude }
        
        val query = PoiSearch.Query(keyword, types)
        query.pageSize = pageSize
        query.pageNum = pageNum - 1
        
        val poiSearch = PoiSearch(context, query)
        // 使用矩形搜索代替多边形搜索
        poiSearch.setBound(PoiSearch.SearchBound(
          LatLonPoint(minLat, minLng),
          LatLonPoint(maxLat, maxLng)
        ))
        
        poiSearch.setOnPoiSearchListener(object : PoiSearch.OnPoiSearchListener {
          override fun onPoiSearched(result: PoiResult?, rCode: Int) {
            if (rCode == 1000) {
              promise.resolve(convertPoiResult(result))
            } else {
              promise.reject("SEARCH_ERROR", "Search failed with code: $rCode", null)
            }
          }

          override fun onPoiItemSearched(item: PoiItem?, rCode: Int) {}
        })
        
        poiSearch.searchPOIAsyn()
      } catch (e: Exception) {
        promise.reject("SEARCH_ERROR", e.message, e)
      }
    }

    /**
     * 输入提示
     */
    AsyncFunction("getInputTips") { options: Map<String, Any?>, promise: Promise ->
      try {
        val keyword = options["keyword"] as? String
          ?: throw Exception("keyword is required")
        
        val city = options["city"] as? String ?: ""
        val types = options["types"] as? String ?: ""
        
        val query = InputtipsQuery(keyword, city)
        if (types.isNotEmpty()) {
          query.cityLimit = true
        }
        
        val inputtips = Inputtips(context, query)
        
        inputtips.setInputtipsListener { tipList, rCode ->
          if (rCode == 1000) {
            promise.resolve(convertTipsResult(tipList))
          } else {
            promise.reject("TIPS_ERROR", "Input tips failed with code: $rCode", null)
          }
        }
        
        inputtips.requestInputtipsAsyn()
      } catch (e: Exception) {
        promise.reject("TIPS_ERROR", e.message, e)
      }
    }
  }

  /**
   * 转换 POI 搜索结果
   */
  private fun convertPoiResult(result: PoiResult?): Map<String, Any?> {
    if (result == null) {
      return mapOf(
        "pois" to emptyList<Map<String, Any?>>(),
        "total" to 0,
        "pageNum" to 1,
        "pageSize" to 20,
        "pageCount" to 0
      )
    }

    val pois = result.pois?.map { poi ->
      mapOf(
        "id" to poi.poiId,
        "name" to poi.title,
        "address" to poi.snippet,
        "location" to mapOf(
          "latitude" to poi.latLonPoint?.latitude,
          "longitude" to poi.latLonPoint?.longitude
        ),
        "typeCode" to poi.typeCode,
        "typeDes" to poi.typeDes,
        "tel" to poi.tel,
        "distance" to poi.distance,
        "cityName" to poi.cityName,
        "cityCode" to poi.cityCode,
        "provinceName" to poi.provinceName,
        "adName" to poi.adName,
        "adCode" to poi.adCode
      )
    } ?: emptyList()

    return mapOf(
      "pois" to pois,
      "total" to result.pageCount * result.query.pageSize,
      "pageNum" to (result.query.pageNum + 1),
      "pageSize" to result.query.pageSize,
      "pageCount" to result.pageCount
    )
  }

  /**
   * 转换输入提示结果
   */
  private fun convertTipsResult(tips: List<Tip>?): Map<String, Any?> {
    val tipList = tips?.map { tip ->
      mapOf(
        "id" to tip.poiID,
        "name" to tip.name,
        "address" to tip.address,
        "location" to tip.point?.let {
          mapOf(
            "latitude" to it.latitude,
            "longitude" to it.longitude
          )
        },
        "typeCode" to tip.typeCode,
        "cityName" to tip.district,
        "adName" to tip.district
      )
    } ?: emptyList()

    return mapOf("tips" to tipList)
  }

  /**
   * 转换沿途 POI 搜索结果
   */
  private fun convertRoutePOIResult(result: RoutePOISearchResult): Map<String, Any?> {
    val pois = result.routePois?.map { poi ->
      mapOf(
        "id" to poi.id,
        "name" to poi.title,
        "address" to "",  // RoutePOIItem 没有 address 属性
        "location" to mapOf(
          "latitude" to poi.point?.latitude,
          "longitude" to poi.point?.longitude
        ),
        "distance" to poi.distance
      )
    } ?: emptyList()

    return mapOf(
      "pois" to pois,
      "total" to pois.size,
      "pageNum" to 1,
      "pageSize" to pois.size,
      "pageCount" to 1
    )
  }
}