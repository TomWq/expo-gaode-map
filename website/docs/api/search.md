# 搜索 API

`expo-gaode-map-search` 包提供了高德地图的搜索功能。

> ⚠️ **安装要求**: 搜索功能需要单独安装 `expo-gaode-map-search` 包。

## 安装

```bash
npm install expo-gaode-map-search
```

## 导入

```typescript
import {
  searchPOI,
  searchNearby,
  searchAlong,
  searchPolygon,
  getInputTips,
  reGeocode,
  getPoiDetail,
  initSearch,
  type POI,
  type SearchResult,
  type InputTipsResult,
  type ReGeocodeResult,
} from 'expo-gaode-map-search';
```

## 方法

### initSearch()

手动初始化搜索模块（可选）。

```typescript
function initSearch(): void;
```

如果使用了 Config Plugin 配置 API Key，此方法会自动调用，无需手动初始化。

---

### searchPOI()

搜索指定关键词的地点（POI）。

```typescript
function searchPOI(options: POISearchOptions): Promise<SearchResult>;
```

**参数**：

```typescript
interface POISearchOptions {
  keyword: string;      // 搜索关键词（必需）
  city?: string;        // 城市名称或城市代码
  types?: string;       // POI 类型代码，多个用 | 分隔
  pageSize?: number;    // 每页结果数（1-50），默认 20
  pageNum?: number;     // 页码，默认 1
}
```

**返回值**：`Promise<SearchResult>`

---

### searchNearby()

搜索指定位置周边的地点。

```typescript
function searchNearby(options: NearbySearchOptions): Promise<SearchResult>;
```

**参数**：

```typescript
interface NearbySearchOptions {
  keyword: string;          // 搜索关键词（必需）
  center: Coordinates;      // 中心点坐标（必需）
  radius?: number;          // 搜索半径（米），默认 1000，最大 50000
  types?: string;           // POI 类型代码
  pageSize?: number;        // 每页结果数，默认 20
  pageNum?: number;         // 页码，默认 1
}
```

**返回值**：`Promise<SearchResult>`

---

### searchAlong()

搜索路线沿途的特定地点。

```typescript
function searchAlong(options: AlongSearchOptions): Promise<SearchResult>;
```

**参数**：

```typescript
interface AlongSearchOptions {
  keyword: string;          // 搜索关键词（必需）
  polyline: Coordinates[];  // 路线点数组（必需，至少2个点）
  range?: number;           // 搜索范围（米），默认 250
}
```

> **iOS 限制**: 仅支持以下关键词：
> - 加油站（`加油`、`加油站`）
> - ATM（`atm`、`银行`）
> - 汽修（`汽修`、`维修`）
> - 厕所（`厕所`、`卫生间`）

**返回值**：`Promise<SearchResult>`

---

### searchPolygon()

在指定多边形区域内搜索。

```typescript
function searchPolygon(options: PolygonSearchOptions): Promise<SearchResult>;
```

**参数**：

```typescript
interface PolygonSearchOptions {
  keyword: string;          // 搜索关键词（必需）
  polygon: Coordinates[];   // 多边形顶点数组（必需，至少3个点）
  types?: string;           // POI 类型代码
  pageSize?: number;        // 每页结果数，默认 20
  pageNum?: number;         // 页码，默认 1
}
```

**返回值**：`Promise<SearchResult>`

---

### getInputTips()

获取关键词的自动补全建议。

```typescript
function getInputTips(options: InputTipsOptions): Promise<InputTipsResult>;
```

**参数**：

```typescript
interface InputTipsOptions {
  keyword: string;      // 搜索关键词（必需）
  city?: string;        // 城市限制
  types?: string;       // POI 类型代码，多个用 | 分隔
}
```

**返回值**：`Promise<InputTipsResult>`

---

### reGeocode()

逆地理编码（坐标转地址）。

```typescript
function reGeocode(options: ReGeocodeOptions): Promise<ReGeocodeResult>;
```

**参数**：

```typescript
interface ReGeocodeOptions {
  location: Coordinates;    // 经纬度坐标（必需）
  radius?: number;          // 搜索半径（米），默认 1000
  requireExtension?: boolean; // 是否返回扩展信息，默认 true
}
```

**返回值**：`Promise<ReGeocodeResult>`

---

### getPoiDetail()

查询 POI 详情（通过 ID）。

```typescript
function getPoiDetail(id: string): Promise<POI>;
```

**参数**：

- `id`: POI ID（必需）

**返回值**：`Promise<POI>`

---

## 类型定义

### Coordinates

```typescript
interface Coordinates {
  latitude: number;   // 纬度
  longitude: number;  // 经度
}
```

### POI

```typescript
interface POI {
  id: string;                // POI ID
  name: string;              // 名称
  address: string;           // 地址
  location: Coordinates;     // 位置坐标
  typeCode: string;          // 类型代码
  typeDes: string;           // 类型描述
  tel?: string;              // 电话
  distance?: number;         // 距离（米）
  cityName?: string;         // 城市
  cityCode?: string;         // 城市编码
  provinceName?: string;     // 省份
  adName?: string;           // 区域名称
  adCode?: string;           // 区域代码
  // 深度信息 (Android SDK V9.4.0+ 新增)
  business?: {
    opentime?: string;       // 营业时间
    opentimeToday?: string;  // 今日营业时间
    rating?: string;         // 评分
    cost?: string;           // 人均消费
    parkingType?: string;    // 停车场类型
    tag?: string;            // 标签
    tel?: string;            // 电话
    alias?: string;          // 别名
    businessArea?: string;   // 商圈
  };
  // 图片信息
  photos?: Array<{
    title?: string;
    url?: string;
  }>;
  // 室内地图信息
  indoor?: {
    floor?: string;          // 楼层
    floorName?: string;      // 楼层名称
    poiId?: string;          // POI ID
    hasIndoorMap?: boolean;  // 是否有室内地图
  };
}
```

### SearchResult

```typescript
interface SearchResult {
  pois: POI[];          // POI 列表
  total: number;        // 总结果数
  pageNum: number;      // 当前页码
  pageSize: number;     // 每页数量
  pageCount: number;    // 总页数
}
```

### InputTip

```typescript
interface InputTip {
  id: string;               // POI ID
  name: string;             // 名称
  address: string;          // 地址
  typeCode: string;         // 类型代码
  cityName?: string;        // 城市
  adName?: string;          // 区域
  location?: Coordinates;   // 位置（可能为空）
}
```

### InputTipsResult

```typescript
interface InputTipsResult {
  tips: InputTip[];     // 提示列表
}
```

### ReGeocodeResult

```typescript
interface ReGeocodeResult {
  formattedAddress: string;       // 格式化地址
  addressComponent: AddressComponent; // 地址组成要素
  pois: POI[];                    // 兴趣点列表
  roads: Road[];                  // 道路列表
  roadCrosses: RoadCross[];       // 道路交叉口列表
  aois: AOI[];                    // 兴趣区域列表
}
```

### AddressComponent

```typescript
interface AddressComponent {
  province: string;       // 省名称
  city: string;           // 市名称
  district: string;       // 区名称
  township: string;       // 乡镇名称
  neighborhood: string;   // 社区名称
  building: string;       // 建筑名称
  cityCode: string;       // 城市编码
  adCode: string;         // 区域编码
  streetNumber: {         // 门牌信息
    street: string;       // 街道名称
    number: string;       // 门牌号
    location?: Coordinates; // 坐标点
    direction: string;    // 方向
    distance: number;     // 距离
  };
  businessAreas?: BusinessArea[]; // 商圈列表
}
```

## POI 类型代码

| 类型 | 代码 |
|------|------|
| 汽车服务 | `010000` |
| 汽车销售 | `020000` |
| 汽车维修 | `030000` |
| 摩托车服务 | `040000` |
| 餐饮服务 | `050000` |
| 购物服务 | `060000` |
| 生活服务 | `070000` |
| 体育休闲服务 | `080000` |
| 医疗保健服务 | `090000` |
| 住宿服务 | `100000` |
| 风景名胜 | `110000` |
| 商务住宅 | `120000` |
| 政府机构 | `130000` |
| 科教文化 | `140000` |
| 交通设施 | `150000` |
| 金融保险 | `160000` |
| 公司企业 | `170000` |

完整列表请参考 [高德地图 POI 分类编码](https://lbs.amap.com/api/webservice/download)。

## 错误处理

所有搜索方法都返回 Promise，建议使用 try-catch 捕获错误：

**常见错误代码**：
- `SEARCH_ERROR` - 搜索失败
- `INVALID_USER_KEY` - API Key 未设置或无效
- `TIPS_ERROR` - 输入提示失败

## 平台差异

| 功能 | Android | iOS |
|------|---------|-----|
| POI 搜索 | ✓ | ✓ |
| 周边搜索 | ✓ | ✓ |
| 沿途搜索 | ✓ | ✓（仅4种类型） |
| 多边形搜索 | ✓ | ✓ |
| 输入提示 | ✓ | ✓ |
| 逆地理编码 | ✓ | ✓ |
| POI 详情 | ✓ | ✓ |

**Android**: 使用高德 3D 地图统一 SDK（`com.amap.api:3dmap:10.0.600`）

**iOS**: 需要 `AMapSearchKit` 框架

## 相关文档

- [搜索功能指南](/guide/search) - 详细使用指南
- [搜索示例](/examples/search) - 完整代码示例
- [快速开始](/guide/getting-started) - 安装和配置