# 原生搜索 API 参考

**源文件**: `packages/search/src`

提供基于高德原生 SDK 的高性能搜索服务，涵盖 POI 检索、输入提示及逆地理编码。

## 1. 核心搜索方法

### POI 关键字搜索 (`searchPOI`)
根据关键字在指定城市或区域内搜索。
- **参数**: `POISearchOptions`
  - `keyword`: 关键词 (必填)
  - `city`: 城市名称或编码 (建议使用 cityCode)
  - `types`: POI 类型编码 (如 "050000|060000")
  - `pageSize`: 每页数量 (默认 20)
  - `pageNum`: 页码 (从 1 开始)
  - `sortByDistance`: 是否按距离排序 (需提供 `center`)

### 周边搜索 (`searchNearby`)
以某个坐标为中心，在一定半径内搜索。
- **参数**: `NearbySearchOptions`
  - `center`: 中心点坐标 `{latitude, longitude}` (必填)
  - `keyword`: 关键词
  - `radius`: 半径 (默认 1000米，最大 50000)

### 沿途搜索 (`searchAlong`)
沿着指定路径搜索，适用于导航场景（如“沿途找加油站”）。
- **参数**: `AlongSearchOptions`
  - `polyline`: 路线坐标点数组 (必填)
  - `keyword`: 关键词
  - `range`: 搜索范围 (默认 500米)

### 多边形搜索 (`searchPolygon`)
在自定义的多边形区域内搜索。
- **参数**: `PolygonSearchOptions`
  - `polygon`: 多边形顶点坐标数组 (必填)
  - `keyword`: 关键词

## 2. 辅助服务

### 输入提示 (`getInputTips`)
提供搜索关键词的自动补全建议。
- **参数**: `InputTipsOptions`
  - `keyword`: 输入片段
  - `city`: 限制城市
- **返回**: `InputTip[]` (包含名称、地址、坐标、区域信息)

### 逆地理编码 (`reGeocode`)
将经纬度坐标转换为结构化的地址信息。
- **参数**: `ReGeocodeOptions`
  - `location`: 坐标 (必填)
  - `radius`: 搜索半径 (默认 1000)
  - `requireExtension`: 是否返回详细信息 (默认 true)
- **返回**: `ReGeocodeResult`
  - `formattedAddress`: 格式化地址字符串
  - `addressComponent`: 省市区、街道门牌、商圈列表
  - `aois`: 兴趣区域列表 (如小区、学校范围)
  - `roads`: 周边道路列表
  - `roadCrosses`: 道路交叉口

### POI 详情 (`getPoiDetail`)
获取特定 POI 的深度信息。
- **参数**: `id` (POI ID)
- **返回**: `POI` (包含 `business` 字段：评分、营业时间、人均消费、图片等)

## 3. 类型定义

### POI 结构
```ts
interface POI {
  id: string;
  name: string;
  location: Coordinates;
  address: string;
  typeCode: string;
  distance?: number; // 仅周边搜索有效
  business?: {       // 深度信息
    rating?: string;
    opentime?: string;
    cost?: string;
    tel?: string;
  };
  photos?: Array<{ url: string; title: string }>;
  indoor?: { hasIndoorMap: boolean; floorName: string };
}
```
