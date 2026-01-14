package expo.modules.gaodemap.search

import android.content.Context

import com.amap.api.services.core.LatLonPoint
import com.amap.api.services.core.PoiItem
import com.amap.api.services.core.PoiItemV2

import com.amap.api.services.geocoder.GeocodeResult
import com.amap.api.services.geocoder.GeocodeSearch
import com.amap.api.services.geocoder.RegeocodeQuery
import com.amap.api.services.geocoder.RegeocodeResult
import com.amap.api.services.help.Inputtips
import com.amap.api.services.help.InputtipsQuery
import com.amap.api.services.help.Tip
import com.amap.api.services.poisearch.PoiResultV2
import com.amap.api.services.poisearch.PoiSearchV2

import com.amap.api.services.routepoisearch.RoutePOISearch
import com.amap.api.services.routepoisearch.RoutePOISearchQuery
import com.amap.api.services.routepoisearch.RoutePOISearchResult
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.collections.mapOf

class ExpoGaodeMapSearchModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exception("React context is null")

  override fun definition() = ModuleDefinition {
    Name("ExpoGaodeMapSearch")

    /**
     * 手动初始化搜索模块（可选）
     */
    Function("initSearch") {
      ensureAPIKeyIsSet()
    }

    /**
     * POI 搜索
     */
    AsyncFunction("searchPOI") { options: Map<String, Any?>, promise: Promise ->
      ensureAPIKeyIsSet()
      try {
        val keyword = options["keyword"] as? String
          ?: throw Exception("keyword is required")
        
        val city = options["city"] as? String ?: ""
        val types = options["types"] as? String ?: ""
        val pageSize = (options["pageSize"] as? Number)?.toInt() ?: 20
        val pageNum = (options["pageNum"] as? Number)?.toInt() ?: 1
        
        val query = PoiSearchV2.Query(keyword, types, city)
        query.pageSize = pageSize
        query.pageNum = pageNum - 1 // 高德 SDK 从 0 开始
          query.showFields = PoiSearchV2.ShowFields(PoiSearchV2.ShowFields.ALL)
        
        val poiSearch = PoiSearchV2(context, query)
        
        poiSearch.setOnPoiSearchListener(object : PoiSearchV2.OnPoiSearchListener {
          override fun onPoiSearched(result: PoiResultV2?, rCode: Int) {
            if (rCode == 1000) {
              promise.resolve(convertPoiResult(result))
            } else {
              promise.reject("SEARCH_ERROR", "Search failed with code: $rCode", null)
            }
          }

          override fun onPoiItemSearched(item: PoiItemV2?, rCode: Int) {
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
      ensureAPIKeyIsSet()
      try {
        val keyword = options["keyword"] as? String
          ?: throw Exception("keyword is required")
        
        @Suppress("UNCHECKED_CAST")
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
        
        val query = PoiSearchV2.Query(keyword, types)
        query.pageSize = pageSize
        query.pageNum = pageNum - 1
          query.showFields = PoiSearchV2.ShowFields(PoiSearchV2.ShowFields.ALL)
        
        val poiSearch = PoiSearchV2(context, query)
        val centerPoint = LatLonPoint(latitude, longitude)
          poiSearch.bound = PoiSearchV2.SearchBound(
              centerPoint, radius
          )
        
        poiSearch.setOnPoiSearchListener(object : PoiSearchV2.OnPoiSearchListener {
          override fun onPoiSearched(result: PoiResultV2?, rCode: Int) {
            if (rCode == 1000) {
              promise.resolve(convertPoiResult(result, centerPoint))
            } else {
              promise.reject("SEARCH_ERROR", "Search failed with code: $rCode", null)
            }
          }

          override fun onPoiItemSearched(item: PoiItemV2?, rCode: Int) {}
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
      ensureAPIKeyIsSet()
      try {
        val keyword = options["keyword"] as? String
          ?: throw Exception("keyword is required")
        
        @Suppress("UNCHECKED_CAST")
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
        
        routePOISearch.setPoiSearchListener { result, rCode ->
            if (rCode == 1000 && result != null) {
                promise.resolve(convertRoutePOIResult(result))
            } else {
                promise.reject("SEARCH_ERROR", "Route search failed with code: $rCode", null)
            }
        }

          routePOISearch.searchRoutePOIAsyn()
      } catch (e: Exception) {
        promise.reject("SEARCH_ERROR", e.message, e)
      }
    }

    /**
     * 多边形搜索（使用矩形范围代替）
     */
    AsyncFunction("searchPolygon") { options: Map<String, Any?>, promise: Promise ->
      ensureAPIKeyIsSet()
      try {
        val keyword = options["keyword"] as? String
          ?: throw Exception("keyword is required")
          @Suppress("UNCHECKED_CAST")
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
        

        
        val query = PoiSearchV2.Query(keyword, types)
        // 策略调整：为了解决 SDK 多边形搜索实为矩形搜索导致过滤后数据量过少的问题
        // 我们强制请求最大数量 (50)，然后在客户端过滤
        // 注意：这会破坏精确的分页对应关系，但在多边形搜索场景下，优先保证返回有效数据更重要
        val sdkPageSize = 50
        query.pageSize = sdkPageSize
        query.pageNum = pageNum - 1
          query.showFields = PoiSearchV2.ShowFields(PoiSearchV2.ShowFields.ALL)
        
        val poiSearch = PoiSearchV2(context, query)
        
        // 使用 SDK 原生多边形搜索
        poiSearch.bound = PoiSearchV2.SearchBound(points)
        
        poiSearch.setOnPoiSearchListener(object : PoiSearchV2.OnPoiSearchListener {
          override fun onPoiSearched(result: PoiResultV2?, rCode: Int) {
            if (rCode == 1000) {
              val convertedResult = convertPoiResult(result).toMutableMap()
              val pois = convertedResult["pois"] as? List<Map<String, Any?>>
              
              if (pois != null) {
                // 1. 客户端过滤：只保留在多边形内的点
                val filteredPois = pois.filter { poi ->
                  val location = poi["location"] as? Map<String, Any?>
                  val lat = (location?.get("latitude") as? Number)?.toDouble()
                  val lng = (location?.get("longitude") as? Number)?.toDouble()
                  
                  if (lat != null && lng != null) {
                    isPointInPolygon(LatLonPoint(lat, lng), points)
                  } else {
                    false
                  }
                }

                // 2. 处理分页截断 (恢复用户请求的 pageSize)
                // 如果过滤后的数量多于用户请求的 pageSize，进行截断
                // 注意：由于我们在 SDK 层请求了 50 条，这里尽量返回给用户填满 pageSize 的数据
                val userPageSize = pageSize
                val finalPois = if (filteredPois.size > userPageSize) {
                    filteredPois.subList(0, userPageSize)
                } else {
                    filteredPois
                }
                
                convertedResult["pois"] = finalPois
                // 更新统计信息，反映过滤后的实际情况
                convertedResult["pageSize"] = userPageSize
                // total 仍然是 SDK 返回的矩形区域总数，无法精确修正，保持原样或不返回
              }
              
              promise.resolve(convertedResult)
            } else {
              promise.reject("SEARCH_ERROR", "Search failed with code: $rCode", null)
            }
          }

          override fun onPoiItemSearched(item: PoiItemV2?, rCode: Int) {}
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
      ensureAPIKeyIsSet()
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

    /**
     * 逆地理编码（坐标转地址）
     */
    AsyncFunction("reGeocode") { options: Map<String, Any?>, promise: Promise ->
      ensureAPIKeyIsSet()
      try {
        @Suppress("UNCHECKED_CAST")
        val location = options["location"] as? Map<String, Any?>
          ?: throw Exception("location is required")
        
        val latitude = (location["latitude"] as? Number)?.toDouble()
          ?: throw Exception("location.latitude is required")
        val longitude = (location["longitude"] as? Number)?.toDouble()
          ?: throw Exception("location.longitude is required")
        
        val radius = (options["radius"] as? Number)?.toFloat() ?: 1000f
        
        val geocodeSearch = GeocodeSearch(context)
        geocodeSearch.setOnGeocodeSearchListener(object : GeocodeSearch.OnGeocodeSearchListener {
          override fun onRegeocodeSearched(result: RegeocodeResult?, rCode: Int) {
            if (rCode == 1000 && result != null) {
              promise.resolve(convertRegeocodeResult(result))
            } else {
              promise.reject("SEARCH_ERROR", "ReGeocode failed with code: $rCode", null)
            }
          }

          override fun onGeocodeSearched(result: GeocodeResult?, rCode: Int) {
            // Not used
          }
        })
        
        val point = LatLonPoint(latitude, longitude)
        val query = RegeocodeQuery(point, radius, GeocodeSearch.AMAP)
        query.extensions = "all"
        
        geocodeSearch.getFromLocationAsyn(query)
      } catch (e: Exception) {
        promise.reject("SEARCH_ERROR", e.message, e)
      }
    }

    /**
     * POI ID 搜索（详情查询）
     */
    AsyncFunction("getPoiDetail") { id: String, promise: Promise ->
      ensureAPIKeyIsSet()
      try {
        if (id.isEmpty()) {
          throw Exception("id is required")
        }

        val poiSearch = PoiSearchV2(context, null)
        poiSearch.setOnPoiSearchListener(object : PoiSearchV2.OnPoiSearchListener {
          override fun onPoiSearched(result: PoiResultV2?, rCode: Int) {
            // Not used
          }

          override fun onPoiItemSearched(item: PoiItemV2?, rCode: Int) {
            if (rCode == 1000 && item != null) {
              promise.resolve(convertPoiItem(item))
            } else {
              promise.reject("SEARCH_ERROR", "Get POI detail failed with code: $rCode", null)
            }
          }
        })

        poiSearch.searchPOIIdAsyn(id)
      } catch (e: Exception) {
        promise.reject("SEARCH_ERROR", e.message, e)
      }
    }
  }

  // MARK: - Private Methods

  /**
   * 判断点是否在多边形内 (Ray Casting 算法)
   */
  private fun isPointInPolygon(point: LatLonPoint, vertices: List<LatLonPoint>): Boolean {
    var inside = false
    var j = vertices.size - 1
    for (i in vertices.indices) {
      if (((vertices[i].latitude > point.latitude) != (vertices[j].latitude > point.latitude)) &&
        (point.longitude < (vertices[j].longitude - vertices[i].longitude) * (point.latitude - vertices[i].latitude) / (vertices[j].latitude - vertices[i].latitude) + vertices[i].longitude)
      ) {
        inside = !inside
      }
      j = i
    }
    return inside
  }

  /**
   * 确保 API Key 已设置
   * 优先级：已设置 > AndroidManifest.xml
   */
  private fun ensureAPIKeyIsSet() {
    try {

      // 1. 尝试从 AndroidManifest.xml 读取
        // 尝试从 AndroidManifest.xml 读取并设置 API Key
        val apiKey = context.packageManager
            .getApplicationInfo(context.packageName, android.content.pm.PackageManager.GET_META_DATA)
            .metaData?.getString("com.amap.api.v2.apikey")
      
      if (apiKey.isNullOrEmpty()) {
            throw Exception("API Key is not set")
      }
    } catch (_: Exception) {
      // Ignore errors, let the SDK handle it or fail later
    }
  }

  /**
   * 转换单个 POI Item
   */
  private fun convertPoiItem(poi: PoiItemV2, center: LatLonPoint? = null): Map<String, Any?> {
      var distance = -1
      if (center != null && poi.latLonPoint != null) {
          val results = FloatArray(1)
          android.location.Location.distanceBetween(
              center.latitude, center.longitude,
              poi.latLonPoint.latitude, poi.latLonPoint.longitude,
              results
          )
          distance = results[0].toInt()
      }

      // 获取深度信息
      val business = poi.business
      val indoor = poi.indoorData
      val photos = poi.photos
      
      return mapOf<String, Any?>(
        "id" to poi.poiId,
        "name" to poi.title,
        "address" to poi.snippet,
        "location" to mapOf<String, Any?>(
          "latitude" to poi.latLonPoint?.latitude,
          "longitude" to poi.latLonPoint?.longitude
        ),
        "typeCode" to poi.typeCode,
        "typeDes" to poi.typeDes,
        "tel" to "", // V2 SDK 移除了 tel 字段，即使 ShowFields.ALL 也不包含
        "distance" to distance,
        "cityName" to poi.cityName,
        "cityCode" to poi.cityCode,
        "provinceName" to poi.provinceName,
        "adName" to poi.adName,
        "adCode" to poi.adCode,
        // 添加深度信息字段映射
        "business" to if (business != null) mapOf<String, Any?>(
            "opentime" to business.opentimeWeek,
            "opentimeToday" to business.opentimeToday,
            "rating" to business.getmRating(),
            "cost" to business.cost,
            "parkingType" to business.parkingType,
            "tag" to business.tag,
            "tel" to business.tel,
            "alias" to business.alias,
            "businessArea" to business.businessArea
        ) else null,
        "photos" to photos?.map { photo ->
             mapOf<String, Any?>(
                 "title" to photo.title,
                 "url" to photo.url
             )
        },
        "indoor" to if (indoor != null) mapOf<String, Any?>(
             "floor" to indoor.floor,
             "floorName" to indoor.floorName,
             "poiId" to indoor.poiId,
             "hasIndoorMap" to indoor.isIndoorMap
        ) else null
      )
  }

  /**
   * 转换单个 Legacy POI Item (用于逆地理编码)
   */
  private fun convertLegacyPoiItem(poi: PoiItem): Map<String, Any?> {
    return mapOf<String, Any?>(
      "id" to poi.poiId,
      "name" to poi.title,
      "address" to poi.snippet,
      "location" to mapOf<String, Any?>(
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
      "adCode" to poi.adCode,
      "website" to poi.website,
      "email" to poi.email,
      "postcode" to poi.postcode,
      "direction" to poi.direction,
      "hasIndoorMap" to poi.isIndoorMap,
      "businessArea" to poi.businessArea,
      "parkingType" to poi.parkingType
    )
  }

  /**
   * 转换 POI 搜索结果
   */
  private fun convertPoiResult(result: PoiResultV2?, center: LatLonPoint? = null): Map<String, Any?> {
    if (result == null) {
      return mapOf(
        "pois" to emptyList<Map<String, Any?>>(),
        "total" to 0,
        "pageNum" to 1,
        "pageSize" to 20,
        "pageCount" to 0
      )
    }

    val pois = result.pois?.map { convertPoiItem(it, center) } ?: emptyList()

    val totalCount = result.count
    val pageSize = result.query.pageSize
    val pageCount = if (pageSize > 0) (totalCount + pageSize - 1) / pageSize else 0

    return mapOf(
      "pois" to pois,
      "total" to totalCount,
      "pageNum" to (result.query.pageNum + 1),
      "pageSize" to pageSize,
      "pageCount" to pageCount
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
          mapOf<String, Any?>(
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
      mapOf<String, Any?>(
        "id" to poi.id,
        "name" to poi.title,
        "address" to "", // RoutePOIItem 确实没有 address/snippet 字段
        "location" to mapOf<String, Any?>(
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

  /**
   * 转换逆地理编码结果
   */
  private fun convertRegeocodeResult(result: RegeocodeResult): Map<String, Any?> {
    val address = result.regeocodeAddress ?: return emptyMap<String, Any?>()
    
    val addressComponent = mapOf<String, Any?>(
      "province" to address.province,
      "city" to address.city,
      "district" to address.district,
      "township" to address.township,
      "towncode" to address.towncode,
      "neighborhood" to address.neighborhood,
      "building" to address.building,
      "cityCode" to address.cityCode,
      "adCode" to address.adCode,
      "country" to address.country,
      "countryCode" to address.countryCode,
      "streetNumber" to (address.streetNumber?.let {
        mapOf<String, Any?>(
          "street" to it.street,
          "number" to it.number,
          "direction" to it.direction,
          "distance" to it.distance
        )
      } ?: mapOf<String, Any?>(
        "street" to "",
        "number" to "",
        "direction" to "",
        "distance" to 0f
      )),
      "businessAreas" to (address.businessAreas?.map { area ->
        mapOf<String, Any?>(
          "name" to area.name,
          "location" to mapOf<String, Any?>(
            "latitude" to area.centerPoint?.latitude,
            "longitude" to area.centerPoint?.longitude
          )
        )
      } ?: emptyList())
    )

    val pois = address.pois?.map { convertLegacyPoiItem(it) } ?: emptyList()

    val aois = address.aois?.map { aoi ->
      mapOf<String, Any?>(
        "id" to aoi.aoiId,
        "name" to aoi.aoiName,
        "adCode" to aoi.adCode,
        "location" to mapOf<String, Any?>(
          "latitude" to aoi.aoiCenterPoint?.latitude,
          "longitude" to aoi.aoiCenterPoint?.longitude
        ),
        "area" to aoi.aoiArea
      )
    } ?: emptyList()
    
    val roads = address.roads?.map { road ->
      mapOf<String, Any?>(
        "id" to road.id,
        "name" to road.name,
        "distance" to road.distance,
        "direction" to road.direction,
        "location" to mapOf<String, Any?>(
          "latitude" to road.latLngPoint?.latitude,
          "longitude" to road.latLngPoint?.longitude
        )
      )
    } ?: emptyList()

    val roadCrosses = address.crossroads?.map { cross ->
      mapOf<String, Any?>(
        "distance" to cross.distance,
        "direction" to cross.direction,
        "location" to mapOf<String, Any?>(
          "latitude" to cross.centerPoint?.latitude,
          "longitude" to cross.centerPoint?.longitude
        ),
        "firstId" to cross.firstRoadId,
        "firstName" to cross.firstRoadName,
        "secondId" to cross.secondRoadId,
        "secondName" to cross.secondRoadName
      )
    } ?: emptyList()

    return mapOf(
      "formattedAddress" to address.formatAddress,
      "addressComponent" to addressComponent,
      "pois" to pois,
      "aois" to aois,
      "roads" to roads,
      "roadCrosses" to roadCrosses
    )
  }
}
