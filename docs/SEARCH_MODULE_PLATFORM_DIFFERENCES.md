# 搜索模块平台差异对比

本文档对比 Android 和 iOS 平台的搜索模块实现，说明各平台的特性和差异。

## 📊 功能对比表

| 功能 | Android | iOS | 状态 |
|------|---------|-----|------|
| POI 搜索 | ✅ | ✅ | 完全一致 |
| 周边搜索 | ✅ | ✅ | 完全一致 |
| 沿途搜索 | ✅ | ✅ | 已同步 |
| 多边形搜索 | ✅ | ✅ | 完全一致 |
| 输入提示 | ✅ | ✅ | 完全一致 |

## 🔧 沿途搜索实现差异

### Android 实现

**SDK API**: `RoutePOISearch` + `RoutePOISearchQuery`

```kotlin
// 1. 支持的搜索类型（枚举）
val searchType = when(keyword.lowercase()) {
  "加油站", "加油" -> RoutePOISearch.RoutePOISearchType.TypeGasStation
  "atm", "银行" -> RoutePOISearch.RoutePOISearchType.TypeATM
  "汽修", "维修" -> RoutePOISearch.RoutePOISearchType.TypeMaintenanceStation
  "厕所", "卫生间" -> RoutePOISearch.RoutePOISearchType.TypeToilet
  else -> RoutePOISearch.RoutePOISearchType.TypeGasStation
}

// 2. 创建查询
val query = RoutePOISearchQuery(startPoint, endPoint, 1, searchType, searchRange)

// 3. 执行搜索
val routePOISearch = RoutePOISearch(context, query)
routePOISearch.setPoiSearchListener { result, rCode ->
  // 处理结果
}
routePOISearch.searchRoutePOIAsyn()
```

**关键特性**:
- 使用专用的 `RoutePOISearch` API
- 支持 4 种固定类型
- 默认搜索半径：250 米
- 结果类型：`RoutePOISearchResult`

### iOS 实现

**SDK API**: `AMapRoutePOISearchRequest`

```swift
// 1. 支持的搜索类型（枚举）
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

// 2. 创建请求
let request = AMapRoutePOISearchRequest()
request.origin = startPoint
request.destination = endPoint
request.searchType = searchType
request.range = 250
request.strategy = 0

// 3. 执行搜索
let search = AMapSearchAPI()
search?.aMapRoutePOISearch(request) { request, response in
  // 处理结果
}
```

**关键特性**:
- 使用 `AMapRoutePOISearchRequest`
- 支持相同的 4 种类型
- 默认搜索半径：250 米
- 结果类型：`AMapRoutePOISearchResponse`

## 📝 支持的沿途搜索类型

两个平台都支持以下 4 种类型：

| 类型 | 关键词示例 | Android 枚举 | iOS 枚举 |
|------|-----------|-------------|---------|
| 加油站 | "加油站", "加油" | `TypeGasStation` | `.gasStation` |
| ATM | "atm", "银行" | `TypeATM` | `.ATM` |
| 汽修店 | "汽修", "维修" | `TypeMaintenanceStation` | `.maintenanceStation` |
| 厕所 | "厕所", "卫生间" | `TypeToilet` | `.toilet` |

## 🎯 API 参数对比

### POI 搜索

| 参数 | Android | iOS | 类型 | 说明 |
|------|---------|-----|------|------|
| keyword | ✅ | ✅ | String | 搜索关键词 |
| city | ✅ | ✅ | String | 城市名称 |
| types | ✅ | ✅ | String | POI 类型 |
| pageSize | ✅ | ✅ | Int | 每页数量 |
| pageNum | ✅ | ✅ | Int | 页码 |

### 周边搜索

| 参数 | Android | iOS | 类型 | 说明 |
|------|---------|-----|------|------|
| keyword | ✅ | ✅ | String | 搜索关键词 |
| center | ✅ | ✅ | Location | 中心点坐标 |
| radius | ✅ | ✅ | Int | 半径（米） |
| types | ✅ | ✅ | String | POI 类型 |
| pageSize | ✅ | ✅ | Int | 每页数量 |
| pageNum | ✅ | ✅ | Int | 页码 |

### 沿途搜索

| 参数 | Android | iOS | 类型 | 说明 |
|------|---------|-----|------|------|
| keyword | ✅ | ✅ | String | 搜索类型（枚举映射） |
| polyline | ✅ | ✅ | Array<Location> | 路线点集合 |
| range | 250 | 250 | Int | 搜索半径（固定） |

### 多边形搜索

| 参数 | Android | iOS | 类型 | 说明 |
|------|---------|-----|------|------|
| keyword | ✅ | ✅ | String | 搜索关键词 |
| polygon | ✅ | ✅ | Array<Location> | 多边形顶点 |
| types | ✅ | ✅ | String | POI 类型 |
| pageSize | ✅ | ✅ | Int | 每页数量 |
| pageNum | ✅ | ✅ | Int | 页码 |

**注意**: Android 使用矩形范围模拟多边形搜索

### 输入提示

| 参数 | Android | iOS | 类型 | 说明 |
|------|---------|-----|------|------|
| keyword | ✅ | ✅ | String | 输入关键词 |
| city | ✅ | ✅ | String | 城市限制 |
| types | ✅ | ✅ | String | POI 类型 |

## 📦 返回数据结构对比

### POI 信息结构

```typescript
interface POI {
  id: string;           // POI ID
  name: string;         // 名称
  address: string;      // 地址
  location: {           // 坐标
    latitude: number;
    longitude: number;
  };
  typeCode: string;     // 类型编码
  typeDes: string;      // 类型描述
  tel: string;          // 电话
  distance: number;     // 距离（周边搜索）
  cityName: string;     // 城市
  cityCode: string;     // 城市编码（Android）
  provinceName: string; // 省份
  adName: string;       // 区域
  adCode: string;       // 区域编码
}
```

### 沿途搜索结果结构

```typescript
interface RoutePOI {
  id: string;           // POI ID
  name: string;         // 名称
  address: string;      // 地址（可能为空）
  location: {           // 坐标
    latitude: number;
    longitude: number;
  };
  distance: number;     // 距离起点的距离
}
```

## ⚠️ 平台差异说明

### 1. 多边形搜索实现

- **Android**: 使用矩形边界框代替真正的多边形搜索
- **iOS**: 使用原生的 `AMapPOIPolygonSearchRequest`

### 2. 页码计数

- **Android**: 页码从 0 开始（SDK），但接口层转换为从 1 开始
- **iOS**: 页码从 1 开始

### 3. 错误码

- **Android**: 详细的错误码（如 1901 表示参数错误）
- **iOS**: 简化的错误信息

## 🚀 使用建议

### 1. 沿途搜索最佳实践

```typescript
// ✅ 推荐：使用支持的类型
await SearchModule.searchAlong({
  keyword: '加油站',  // 或 'ATM', '汽修', '厕所'
  polyline: [
    { latitude: 39.9042, longitude: 116.4074 },
    { latitude: 39.9250, longitude: 116.4074 },
  ],
});

// ❌ 不推荐：使用不支持的类型
await SearchModule.searchAlong({
  keyword: '餐厅',  // 不支持，会默认搜索加油站
  polyline: [...],
});
```

### 2. 跨平台兼容性

```typescript
// 确保在两个平台上都能正常工作
const result = await SearchModule.searchPOI({
  keyword: '餐厅',
  city: '北京',
  pageSize: 20,
  pageNum: 1,
});

// 处理结果时考虑可选字段
result.pois.forEach(poi => {
  console.log(poi.name);
  console.log(poi.address || '无地址'); // 某些情况下可能没有地址
});
```

## 📚 相关文档

- [高德 Android 搜索 SDK 文档](https://lbs.amap.com/api/android-sdk/guide/map-search/search-pois)
- [高德 iOS 搜索 SDK 文档](https://lbs.amap.com/api/ios-sdk/guide/map-search/search-pois)
- [搜索模块使用文档](./OPTIONAL_MODULES_USAGE.md#搜索模块)

## 🔄 更新日志

### v1.0.0 (2025-12-03)
- ✅ 统一 Android 和 iOS 的沿途搜索实现
- ✅ 添加 4 种沿途搜索类型支持
- ✅ 统一返回数据结构
- ✅ 完善错误处理