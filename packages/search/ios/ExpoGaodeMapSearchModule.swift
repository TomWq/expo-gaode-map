import ExpoModulesCore
import AMapSearchKit
import AMapFoundationKit

public class ExpoGaodeMapSearchModule: Module {
  private var searchAPI: AMapSearchAPI!
  private var searchDelegate: SearchDelegate!
  
  public func definition() -> ModuleDefinition {
    Name("ExpoGaodeMapSearch")
    
    // 不在 OnCreate 中初始化，改为延迟初始化
    
    /**
     * 手动初始化搜索模块（可选）
     * 如果 API Key 已经设置，则直接初始化
     * 如果未设置，会尝试从 Info.plist 读取
     */
    Function("initSearch") {
      self.initSearchAPI()
    }

    /**
     * POI 搜索
     */
    AsyncFunction("searchPOI") { (options: [String: Any], promise: Promise) in
      // 延迟初始化：在首次使用时才初始化
      self.initSearchAPI()
      
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
      request.page = pageNum
      request.offset = pageSize
      
      self.searchDelegate.currentPromise = promise
      self.searchAPI.aMapPOIKeywordsSearch(request)
    }

    /**
     * 周边搜索
     */
    AsyncFunction("searchNearby") { (options: [String: Any], promise: Promise) in
      self.initSearchAPI()
      
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
      request.page = pageNum
      request.offset = pageSize
      
      self.searchDelegate.currentPromise = promise
      self.searchAPI.aMapPOIAroundSearch(request)
    }

    /**
     * 沿途搜索
     * iOS SDK 支持的沿途搜索类型：加油站、ATM、汽修、厕所
     */
    AsyncFunction("searchAlong") { (options: [String: Any], promise: Promise) in
      self.initSearchAPI()
      
      guard let keyword = options["keyword"] as? String else {
        promise.reject("SEARCH_ERROR", "keyword is required")
        return
      }
      
      guard let polyline = options["polyline"] as? [[String: Any]] else {
        promise.reject("SEARCH_ERROR", "polyline is required")
        return
      }
      
      guard polyline.count >= 2 else {
        promise.reject("SEARCH_ERROR", "polyline must have at least 2 points")
        return
      }
      
      // 转换路线点
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
      
      guard let startPoint = points.first,
            let endPoint = points.last else {
        promise.reject("SEARCH_ERROR", "Invalid polyline points")
        return
      }
      
      // 根据关键词确定搜索类型
      let lowercaseKeyword = keyword.lowercased()
      var searchType: AMapRoutePOISearchType = .gasStation
      if lowercaseKeyword.contains("加油") || lowercaseKeyword == "加油站" {
        searchType = .gasStation
      } else if lowercaseKeyword.contains("atm") || lowercaseKeyword.contains("银行") {
        searchType = .ATM
      } else if lowercaseKeyword.contains("汽修") || lowercaseKeyword.contains("维修") {
        searchType = .maintenanceStation
      } else if lowercaseKeyword.contains("厕所") || lowercaseKeyword.contains("卫生间") {
        searchType = .toilet
      }
      
      let request = AMapRoutePOISearchRequest()
      request.origin = startPoint
      request.destination = endPoint
      request.searchType = searchType
      request.range = 250
      request.strategy = 0
      
      self.searchDelegate.currentPromise = promise
      self.searchAPI.aMapRoutePOISearch(request)
    }

    /**
     * 多边形搜索
     */
    AsyncFunction("searchPolygon") { (options: [String: Any], promise: Promise) in
      self.initSearchAPI()
      
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
      request.polygon = AMapGeoPolygon(points: points)
      request.types = types
      request.page = pageNum
      request.offset = pageSize
      
      self.searchDelegate.currentPromise = promise
      self.searchAPI.aMapPOIPolygonSearch(request)
    }

    /**
     * 输入提示
     */
    AsyncFunction("getInputTips") { (options: [String: Any], promise: Promise) in
      self.initSearchAPI()
      
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
      
      self.searchDelegate.currentPromise = promise
      self.searchAPI.aMapInputTipsSearch(request)
    }
  }
  
  // MARK: - Private Methods
  
  /**
   * 初始化搜索 API（延迟初始化）
   */
  private func initSearchAPI() {
    if searchAPI == nil {
      // 确保 API Key 已设置
      self.ensureAPIKeyIsSet()
      
      searchDelegate = SearchDelegate()
      searchAPI = AMapSearchAPI()
      searchAPI.delegate = searchDelegate
      
      let apiKey = AMapServices.shared().apiKey
      print("[ExpoGaodeMapSearch] 搜索 API 已初始化，API Key: \(apiKey ?? "未设置")")
    }
  }
  
  /**
   * 确保 API Key 已设置
   * 优先级：已设置 > Info.plist > 提示错误
   */
  private func ensureAPIKeyIsSet() {
    // 1. 检查是否已经设置（通过 initSDK 或 AppDelegate）
    if let existingKey = AMapServices.shared().apiKey, !existingKey.isEmpty {
      print("[ExpoGaodeMapSearch] ✓ API Key 已设置")
      return
    }
    
    // 2. 尝试从 Info.plist 读取（Config Plugin 会写入）
    if let apiKey = Bundle.main.object(forInfoDictionaryKey: "AMapApiKey") as? String, !apiKey.isEmpty {
      AMapServices.shared().apiKey = apiKey
      AMapServices.shared().enableHTTPS = true
      print("[ExpoGaodeMapSearch] ✓ 从 Info.plist 读取并设置 API Key")
      return
    }
    
    // 3. 都没有，提示错误
    print("[ExpoGaodeMapSearch] ✗ 错误: API Key 未设置！")
    print("[ExpoGaodeMapSearch] 请通过以下任一方式设置：")
    print("[ExpoGaodeMapSearch]   1. 在 app.json 的 plugins 中配置 iosApiKey（推荐）")
    print("[ExpoGaodeMapSearch]   2. 调用 ExpoGaodeMap.initSDK({ iosKey: 'your-key' })")
    print("[ExpoGaodeMapSearch]   3. 在 AppDelegate 中调用 [AMapServices sharedServices].apiKey = @\"your-key\"")
  }
}

// MARK: - Search Delegate
class SearchDelegate: NSObject, AMapSearchDelegate {
  var currentPromise: Promise?
  
  /**
   * POI 搜索回调
   */
  func onPOISearchDone(_ request: AMapPOISearchBaseRequest!, response: AMapPOISearchResponse!) {
    guard let promise = currentPromise else { return }
    
    if let response = response {
      promise.resolve(convertPOISearchResponse(response))
    } else {
      promise.reject("SEARCH_ERROR", "Search failed")
    }
    
    currentPromise = nil
  }
  
  /**
   * 沿途搜索回调
   */
  func onRoutePOISearchDone(_ request: AMapRoutePOISearchRequest!, response: AMapRoutePOISearchResponse!) {
    guard let promise = currentPromise else { return }
    
    if let response = response {
      promise.resolve(convertRoutePOISearchResponse(response))
    } else {
      promise.reject("SEARCH_ERROR", "Route search failed")
    }
    
    currentPromise = nil
  }
  
  /**
   * 输入提示回调
   */
  func onInputTipsSearchDone(_ request: AMapInputTipsSearchRequest!, response: AMapInputTipsSearchResponse!) {
    guard let promise = currentPromise else { return }
    
    if let response = response {
      promise.resolve(convertInputTipsResponse(response))
    } else {
      promise.reject("TIPS_ERROR", "Input tips failed")
    }
    
    currentPromise = nil
  }
  
  /**
   * 搜索失败回调
   */
  func aMapSearchRequest(_ request: Any!, didFailWithError error: Error!) {
    guard let promise = currentPromise else { return }
    
    let errorMessage = error?.localizedDescription ?? "Unknown error"
    promise.reject("SEARCH_ERROR", errorMessage)
    currentPromise = nil
  }
  
  // MARK: - 转换方法
  
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

  /**
   * 转换沿途 POI 搜索结果
   */
  private func convertRoutePOISearchResponse(_ response: AMapRoutePOISearchResponse) -> [String: Any] {
    let pois = response.pois?.map { poi -> [String: Any] in
      var result: [String: Any] = [
        "id": poi.uid ?? "",
        "name": poi.name ?? "",
        "address": "",
        "location": [
          "latitude": poi.location?.latitude ?? 0,
          "longitude": poi.location?.longitude ?? 0
        ],
        "distance": poi.distance
      ]
      return result
    } ?? []
    
    return [
      "pois": pois,
      "total": pois.count,
      "pageNum": 1,
      "pageSize": pois.count,
      "pageCount": 1
    ]
  }
}
