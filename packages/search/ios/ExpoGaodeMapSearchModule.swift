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
      // SDK 9.4.0+ 使用 showFieldsType 控制返回字段
      // AMapPOISearchShowFieldsTypeAll (返回所有扩展信息)
      request.showFieldsType = AMapPOISearchShowFieldsType.all
      
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
      request.showFieldsType = AMapPOISearchShowFieldsType.all
      
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
      
      // 转换路线点
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
      request.showFieldsType = AMapPOISearchShowFieldsType.all
      
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

    /**
     * 逆地理编码（坐标转地址）
     */
    AsyncFunction("reGeocode") { (options: [String: Any], promise: Promise) in
      self.initSearchAPI()
      
      guard let location = options["location"] as? [String: Any],
            let latitude = location["latitude"] as? Double,
            let longitude = location["longitude"] as? Double else {
        promise.reject("SEARCH_ERROR", "location is required")
        return
      }
      
      let radius = options["radius"] as? Int ?? 1000
      let requireExtension = options["requireExtension"] as? Bool ?? true
      
      let request = AMapReGeocodeSearchRequest()
      request.location = AMapGeoPoint.location(withLatitude: CGFloat(latitude), longitude: CGFloat(longitude))
      request.radius = limitReGeocodeRadius(radius)
      request.requireExtension = requireExtension
      
      self.searchDelegate.currentPromise = promise
      self.searchAPI.aMapReGoecodeSearch(request)
    }

    /**
     * POI ID 搜索（详情查询）
     */
    AsyncFunction("getPoiDetail") { (id: String, promise: Promise) in
      self.initSearchAPI()
      
      if id.isEmpty {
        promise.reject("SEARCH_ERROR", "id is required")
        return
      }
      
      let request = AMapPOIIDSearchRequest()
      request.uid = id
      
      self.searchDelegate.currentPromise = promise
      self.searchAPI.aMapPOIIDSearch(request)
    }
  }

  
  // MARK: - Private Methods
  
  private func limitReGeocodeRadius(_ radius: Int) -> Int {
     // AMapReGeocodeSearchRequest radius property is NSInteger
     // The documentation doesn't specify a strict limit but usually it's around 0-3000m for regeocode.
     // We just cast it safely.
     return radius
  }

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
      
        _ = AMapServices.shared().apiKey
    }
  }
  
  /**
   * 确保 API Key 已设置
   * 优先级：已设置 > Info.plist > 提示错误
   */
  private func ensureAPIKeyIsSet() {
    // 1. 检查是否已经设置（通过 initSDK 或 AppDelegate）
    if let existingKey = AMapServices.shared().apiKey, !existingKey.isEmpty {
      return
    }
    
    // 2. 尝试从 Info.plist 读取（Config Plugin 会写入）
    if let apiKey = Bundle.main.object(forInfoDictionaryKey: "AMapApiKey") as? String, !apiKey.isEmpty {
      AMapServices.shared().apiKey = apiKey
      AMapServices.shared().enableHTTPS = true
      return
    }
    
   
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
      promise.resolve(convertPOISearchResponse(response, request: request))
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
   * 逆地理编码回调
   */
  func onReGeocodeSearchDone(_ request: AMapReGeocodeSearchRequest!, response: AMapReGeocodeSearchResponse!) {
    guard let promise = currentPromise else { return }
    
    if let response = response {
      promise.resolve(convertReGeocodeResponse(response))
    } else {
      promise.reject("SEARCH_ERROR", "ReGeocode failed")
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
  private func convertPOISearchResponse(_ response: AMapPOISearchResponse, request: AMapPOISearchBaseRequest!) -> Any {
    // 检查是否是 ID 搜索（只有 1 个结果且不是列表）
    // 但 AMapPOISearchResponse 总是返回列表
    // 我们约定如果是 ID 搜索，我们在 JS 层处理，这里依然返回列表格式，或者如果是单个 POI，我们取第一个
    
    // 注意：ID 搜索返回的也是 AMapPOISearchResponse
    
    let pois = response.pois?.map { poi -> [String: Any] in
      return convertPOI(poi)
    } ?? []
    
    // 如果是 ID 搜索，通常 pois 只有一个
    // 为了保持 searchPOI 接口返回结构一致，我们总是返回列表结构
    // 但对于 getPoiDetail，我们需要单个对象。
    // 由于 native 无法区分当前是 searchPOI 还是 getPoiDetail 调用的回调（除非用不同 delegate 方法，但 SDK 都是 onPOISearchDone）
    // 我们可以根据 request 类型判断？SDK 回调中 request 参数是基类 AMapPOISearchBaseRequest
    
    if request is AMapPOIIDSearchRequest {
        if let first = pois.first {
            return first
        } else {
            return [:] // 没找到
        }
    }
    
    return [
      "pois": pois,
      "total": response.count,
      "pageNum": response.pois?.first?.uid != nil ? 1 : 0,
      "pageSize": response.pois?.count ?? 0,
      "pageCount": (response.count + 19) / 20
    ]
  }

  private func convertPOI(_ poi: AMapPOI) -> [String: Any] {
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
        "cityCode": poi.citycode ?? "",
        "provinceName": poi.province ?? "",
        "adName": poi.district ?? "",
        "adCode": poi.adcode ?? "",
        "businessArea": poi.businessArea ?? "",
        "parkingType": poi.parkingType ?? "",
        "website": poi.website ?? "",
        "email": poi.email ?? "",
        "postcode": poi.postcode ?? ""
      ]
      
      // 图片信息
      if let images = poi.images {
          result["photos"] = images.map { image in
              return [
                  "title": image.title ?? "",
                  "url": image.url ?? ""
              ]
          }
      }
      
      // 室内信息
      if let indoor = poi.indoorData {
          result["indoor"] = [
              "floor": indoor.floor,
              "floorName": indoor.floorName ?? "",
              "poiId": indoor.pid ?? "",
              "hasIndoorMap": poi.hasIndoorMap
          ]
      }
      
      // 深度信息 (Business)
      // 只有当有扩展信息或特定业务字段时才返回
      var business: [String: Any] = [
          "tel": poi.tel ?? "",
          "parkingType": poi.parkingType ?? "",
          "businessArea": poi.businessArea ?? ""
      ]
      
      // 合并 extensionInfo
      if let ext = poi.extensionInfo {
          business["rating"] = String(format: "%.1f", ext.rating)
          business["cost"] = String(format: "%.1f", ext.cost)
          business["opentime"] = ext.openTime ?? ""
      }
      
      // 合并 businessData (SDK 9.4.0 新增)
      if let biz = poi.businessData {
          business["alias"] = biz.alias ?? ""
          business["tag"] = biz.tag ?? ""
          
          // 如果 extensionInfo 没有这些字段，优先使用 businessData
          if business["rating"] == nil || (business["rating"] as? String) == "0.0" {
             business["rating"] = biz.rating ?? ""
          }
          if business["cost"] == nil || (business["cost"] as? String) == "0.0" {
             business["cost"] = biz.cost ?? ""
          }
          if business["opentime"] == nil || (business["opentime"] as? String) == "" {
              business["opentime"] = biz.opentimeWeek ?? ""
          }
          
          business["opentimeToday"] = biz.opentimeToday ?? ""
          
          // 如果外层没有 tel/parkingType/businessArea，尝试从 businessData 获取
          if (business["tel"] as? String) == "" { business["tel"] = biz.tel ?? "" }
          if (business["parkingType"] as? String) == "" { business["parkingType"] = biz.parkingType ?? "" }
          if (business["businessArea"] as? String) == "" { business["businessArea"] = biz.businessArea ?? "" }
      }
      
      result["business"] = business
      
      return result
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
   * 转换逆地理编码结果
   */
  private func convertReGeocodeResponse(_ response: AMapReGeocodeSearchResponse) -> [String: Any] {
    guard let regeocode = response.regeocode else {
      return [:]
    }
    
    var result: [String: Any] = [
      "formattedAddress": regeocode.formattedAddress ?? ""
    ]
    
    if let addressComponent = regeocode.addressComponent {
      let streetNumber = addressComponent.streetNumber
      let streetNumberDict: [String: Any] = [
        "street": streetNumber?.street ?? "",
        "number": streetNumber?.number ?? "",
        "direction": streetNumber?.direction ?? "",
        "distance": streetNumber?.distance ?? 0
      ]
      
      let businessAreas = addressComponent.businessAreas?.map { area -> [String: Any] in
        return [
            "name": area.name ?? "",
            "location": [
                "latitude": area.location?.latitude ?? 0,
                "longitude": area.location?.longitude ?? 0
            ]
        ]
      } ?? []
      
      result["addressComponent"] = [
        "province": addressComponent.province ?? "",
        "city": addressComponent.city ?? "",
        "district": addressComponent.district ?? "",
        "township": addressComponent.township ?? "",
        "neighborhood": addressComponent.neighborhood ?? "",
        "building": addressComponent.building ?? "",
        "cityCode": addressComponent.citycode ?? "",
        "adCode": addressComponent.adcode ?? "",
        "streetNumber": streetNumberDict,
        "businessAreas": businessAreas
      ]
    }
    
    if let pois = regeocode.pois {
      result["pois"] = pois.map { poi -> [String: Any] in
        return [
          "id": poi.uid ?? "",
          "name": poi.name ?? "",
          "typeCode": poi.typecode ?? "",
          "typeDes": poi.type ?? "",
          "tel": poi.tel ?? "",
          "distance": poi.distance,
          "direction": poi.direction ?? "",
          "address": poi.address ?? "",
          "location": [
            "latitude": poi.location?.latitude ?? 0,
            "longitude": poi.location?.longitude ?? 0
          ]
        ]
      }
    }
    
    if let aois = regeocode.aois {
      result["aois"] = aois.map { aoi -> [String: Any] in
        return [
          "id": aoi.uid ?? "",
          "name": aoi.name ?? "",
          "adCode": aoi.adcode ?? "",
          "location": [
            "latitude": aoi.location?.latitude ?? 0,
            "longitude": aoi.location?.longitude ?? 0
          ],
          "area": aoi.area
        ]
      }
    }
    
    if let roads = regeocode.roads {
        result["roads"] = roads.map { road -> [String: Any] in
            return [
                "id": road.uid ?? "",
                "name": road.name ?? "",
                "distance": road.distance,
                "direction": road.direction ?? "",
                "location": [
                    "latitude": road.location?.latitude ?? 0,
                    "longitude": road.location?.longitude ?? 0
                ]
            ]
        }
    }
    
    if let roadinters = regeocode.roadinters {
        result["roadCrosses"] = roadinters.map { cross -> [String: Any] in
            return [
                "distance": cross.distance,
                "direction": cross.direction ?? "",
                "location": [
                    "latitude": cross.location?.latitude ?? 0,
                    "longitude": cross.location?.longitude ?? 0
                ],
                "firstId": cross.firstId ?? "",
                "firstName": cross.firstName ?? "",
                "secondId": cross.secondId ?? "",
                "secondName": cross.secondName ?? ""
            ]
        }
    }
    
    return result
  }

  /**
   * 转换沿途 POI 搜索结果
   */
  private func convertRoutePOISearchResponse(_ response: AMapRoutePOISearchResponse) -> [String: Any] {
    let pois = response.pois?.map { poi -> [String: Any] in
        let result: [String: Any] = [
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
