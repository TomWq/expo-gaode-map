import ExpoModulesCore
import AMapSearchKit

public class ExpoGaodeMapSearchModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGaodeMapSearch")

    /**
     * POI 搜索
     */
    AsyncFunction("searchPOI") { (options: [String: Any], promise: Promise) in
      guard let keyword = options["keyword"] as? String else {
        promise.reject("SEARCH_ERROR", "keyword is required")
        return
      }
      
      let city = options["city"] as? String ?? ""
      let types = options["types"] as? String ?? ""
      let pageSize = options["pageSize"] as? Int ?? 20
      let pageNum = options["pageNum"] as? Int ?? 1
      
      let request = AMapPOIKeywordsSearchRequest()
      request.keywords = keyword
      request.city = city
      request.types = types
      request.requireExtension = true
      request.page = pageNum
      request.offset = pageSize
      
      let search = AMapSearchAPI()
      search?.aMapPOIKeywordsSearch(request) { request, response in
        if let response = response {
          promise.resolve(self.convertPOISearchResponse(response))
        } else {
          promise.reject("SEARCH_ERROR", "Search failed")
        }
      }
    }

    /**
     * 周边搜索
     */
    AsyncFunction("searchNearby") { (options: [String: Any], promise: Promise) in
      guard let keyword = options["keyword"] as? String else {
        promise.reject("SEARCH_ERROR", "keyword is required")
        return
      }
      
      guard let center = options["center"] as? [String: Any],
            let latitude = center["latitude"] as? Double,
            let longitude = center["longitude"] as? Double else {
        promise.reject("SEARCH_ERROR", "center is required")
        return
      }
      
      let radius = options["radius"] as? Int ?? 1000
      let types = options["types"] as? String ?? ""
      let pageSize = options["pageSize"] as? Int ?? 20
      let pageNum = options["pageNum"] as? Int ?? 1
      
      let request = AMapPOIAroundSearchRequest()
      request.keywords = keyword
      request.location = AMapGeoPoint.location(
        withLatitude: CGFloat(latitude),
        longitude: CGFloat(longitude)
      )
      request.radius = radius
      request.types = types
      request.requireExtension = true
      request.page = pageNum
      request.offset = pageSize
      
      let search = AMapSearchAPI()
      search?.aMapPOIAroundSearch(request) { request, response in
        if let response = response {
          promise.resolve(self.convertPOISearchResponse(response))
        } else {
          promise.reject("SEARCH_ERROR", "Search failed")
        }
      }
    }

    /**
     * 沿途搜索
     */
    AsyncFunction("searchAlong") { (options: [String: Any], promise: Promise) in
      guard let keyword = options["keyword"] as? String else {
        promise.reject("SEARCH_ERROR", "keyword is required")
        return
      }
      
      guard let polyline = options["polyline"] as? [[String: Any]] else {
        promise.reject("SEARCH_ERROR", "polyline is required")
        return
      }
      
      let range = options["range"] as? Int ?? 500
      let types = options["types"] as? String ?? ""
      
      var points: [AMapGeoPoint] = []
      for point in polyline {
        if let lat = point["latitude"] as? Double,
           let lng = point["longitude"] as? Double {
          points.append(AMapGeoPoint.location(
            withLatitude: CGFloat(lat),
            longitude: CGFloat(lng)
          ))
        }
      }
      
      let request = AMapPOIPolygonSearchRequest()
      request.keywords = keyword
      request.polygon = points
      request.types = types
      request.requireExtension = true
      
      let search = AMapSearchAPI()
      search?.aMapPOIPolygonSearch(request) { request, response in
        if let response = response {
          promise.resolve(self.convertPOISearchResponse(response))
        } else {
          promise.reject("SEARCH_ERROR", "Search failed")
        }
      }
    }

    /**
     * 多边形搜索
     */
    AsyncFunction("searchPolygon") { (options: [String: Any], promise: Promise) in
      guard let keyword = options["keyword"] as? String else {
        promise.reject("SEARCH_ERROR", "keyword is required")
        return
      }
      
      guard let polygon = options["polygon"] as? [[String: Any]] else {
        promise.reject("SEARCH_ERROR", "polygon is required")
        return
      }
      
      let types = options["types"] as? String ?? ""
      let pageSize = options["pageSize"] as? Int ?? 20
      let pageNum = options["pageNum"] as? Int ?? 1
      
      var points: [AMapGeoPoint] = []
      for point in polygon {
        if let lat = point["latitude"] as? Double,
           let lng = point["longitude"] as? Double {
          points.append(AMapGeoPoint.location(
            withLatitude: CGFloat(lat),
            longitude: CGFloat(lng)
          ))
        }
      }
      
      let request = AMapPOIPolygonSearchRequest()
      request.keywords = keyword
      request.polygon = points
      request.types = types
      request.requireExtension = true
      request.page = pageNum
      request.offset = pageSize
      
      let search = AMapSearchAPI()
      search?.aMapPOIPolygonSearch(request) { request, response in
        if let response = response {
          promise.resolve(self.convertPOISearchResponse(response))
        } else {
          promise.reject("SEARCH_ERROR", "Search failed")
        }
      }
    }

    /**
     * 输入提示
     */
    AsyncFunction("getInputTips") { (options: [String: Any], promise: Promise) in
      guard let keyword = options["keyword"] as? String else {
        promise.reject("TIPS_ERROR", "keyword is required")
        return
      }
      
      let city = options["city"] as? String ?? ""
      let types = options["types"] as? String ?? ""
      
      let request = AMapInputTipsSearchRequest()
      request.keywords = keyword
      request.city = city
      request.types = types
      
      let search = AMapSearchAPI()
      search?.aMapInputTipsSearch(request) { request, response in
        if let response = response {
          promise.resolve(self.convertInputTipsResponse(response))
        } else {
          promise.reject("TIPS_ERROR", "Input tips failed")
        }
      }
    }
  }

  /**
   * 转换 POI 搜索结果
   */
  private func convertPOISearchResponse(_ response: AMapPOISearchResponse) -> [String: Any] {
    let pois = response.pois?.map { poi -> [String: Any] in
      var result: [String: Any] = [
        "id": poi.uid ?? "",
        "name": poi.name ?? "",
        "address": poi.address ?? "",
        "location": [
          "latitude": poi.location?.latitude ?? 0,
          "longitude": poi.location?.longitude ?? 0
        ],
        "typeCode": poi.typecode ?? "",
        "typeDes": poi.type ?? "",
        "tel": poi.tel ?? "",
        "distance": poi.distance,
        "cityName": poi.city ?? "",
        "provinceName": poi.province ?? "",
        "adName": poi.district ?? "",
        "adCode": poi.adcode ?? ""
      ]
      return result
    } ?? []
    
    return [
      "pois": pois,
      "total": response.count,
      "pageNum": response.pois?.first?.uid != nil ? 1 : 0,
      "pageSize": response.pois?.count ?? 0,
      "pageCount": (response.count + 19) / 20
    ]
  }

  /**
   * 转换输入提示结果
   */
  private func convertInputTipsResponse(_ response: AMapInputTipsSearchResponse) -> [String: Any] {
    let tips = response.tips?.map { tip -> [String: Any] in
      var result: [String: Any] = [
        "id": tip.uid ?? "",
        "name": tip.name ?? "",
        "address": tip.address ?? "",
        "typeCode": tip.typecode ?? "",
        "cityName": tip.district ?? "",
        "adName": tip.district ?? ""
      ]
      
      if let location = tip.location {
        result["location"] = [
          "latitude": location.latitude,
          "longitude": location.longitude
        ]
      }
      
      return result
    } ?? []
    
    return ["tips": tips]
  }
}