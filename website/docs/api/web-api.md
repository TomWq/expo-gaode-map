# Web API 服务模块

`expo-gaode-map-web-api` 是高德地图 Web API 服务模块（纯 JavaScript 实现），提供地理编码、路径规划、POI 搜索、输入提示等服务能力。

::: tip 包信息
- **包名**：`expo-gaode-map-web-api`
- **类型**：纯 JavaScript Web 服务
- **依赖**：需要先安装 `expo-gaode-map` 或 `expo-gaode-map-navigation`
- **适用场景**：跨平台一致的 Web 服务调用
:::

## 特性

- ✅ **纯 JavaScript**：跨平台一致，无原生编译依赖
- ✅ **TypeScript**：完整类型定义与错误码映射
- ✅ **V5 API**：已适配新版路径规划策略与字段
- ✅ **协同工作**：与地图/导航模块协作，支持无参构造
- ✅ **错误友好**：封装 `GaodeAPIError`，提供错误码中文说明

## 已实现功能

### 地理编码服务
- ✅ 地理编码（地址 → 坐标）
- ✅ 逆地理编码（坐标 → 地址）
- ✅ 批量地理编码 / 批量逆地理编码

### 路径规划服务（V5）
- ✅ 驾车（支持策略、成本、导航步骤、坐标点串等）
- ✅ 步行（支持多路线、导航步骤、坐标点串）
- ✅ 骑行 / 电动车（含成本与导航步骤）
- ✅ 公交（含多策略、跨城、地铁图模式、出入口等）

### 搜索服务
- ✅ POI 搜索（关键字、周边、类型、详情）
- ✅ 输入提示（POI/公交站点/公交线路）

## 安装

本模块要求先安装基础地图组件（导航模块或核心地图模块其一）：

```bash
# 任选其一
npm install expo-gaode-map-navigation
# 或
npm install expo-gaode-map

# 然后安装本模块
npm install expo-gaode-map-web-api
```

## 快速开始

### 1. 申请 Web 服务 Key

登录 [高德开放平台控制台](https://console.amap.com/)，创建应用并添加"Web 服务"Key。

::: warning 注意
这是 Web 服务 Key，不是 iOS/Android Key
:::

### 2. 在基础模块初始化时下发 webKey

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key', // 关键：供 Web API 包读取
});
```

### 3. 无参构造并使用

```typescript
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

// 无参：从基础模块运行时解析 webKey
const api = new GaodeWebAPI();

// 逆地理编码：坐标 → 地址
const result = await api.geocode.regeocode('116.481028,39.989643');
console.log(result.regeocode.formatted_address);

// 地理编码：地址 → 坐标
const geo = await api.geocode.geocode('北京市朝阳区阜通东大街6号');
console.log(geo.geocodes[0].location);
```

## 地理编码

### 逆地理编码（坐标 → 地址）

```typescript
// 基础用法
const result = await api.geocode.regeocode('116.481028,39.989643');
console.log(result.regeocode.formatted_address);
// 北京市朝阳区阜通东大街6号

// 使用对象
const result = await api.geocode.regeocode({
  longitude: 116.481028,
  latitude: 39.989643,
});

// 获取详细信息
const result = await api.geocode.regeocode('116.481028,39.989643', {
  extensions: 'all', // 返回详细信息
  radius: 1000, // 搜索半径1000米
  poitype: '商务住宅|餐饮服务', // POI类型
});
```

### 地理编码（地址 → 坐标）

```typescript
// 基础用法
const result = await api.geocode.geocode('北京市朝阳区阜通东大街6号');
console.log(result.geocodes[0].location);
// 116.481028,39.989643

// 指定城市
const result = await api.geocode.geocode('阜通东大街6号', '北京');

// 批量地理编码
const result = await api.geocode.batchGeocode(
  [
    '北京市朝阳区阜通东大街6号',
    '北京市朝阳区望京SOHO',
  ],
  '北京'
);
```

## 路径规划

### 驾车路径规划

```typescript
import { DrivingStrategy } from 'expo-gaode-map-web-api';

// 基础用法
const result = await api.route.driving(
  '116.481028,39.989643',
  '116.434446,39.90816'
);

console.log(`距离：${result.route.paths[0].distance}米`);
console.log(`时间：${result.route.paths[0].duration}秒`);
console.log(`收费：${result.route.paths[0].tolls}元`);

// 高级用法：带途经点和策略
const result = await api.route.driving(
  { longitude: 116.481028, latitude: 39.989643 },
  { longitude: 116.434446, latitude: 39.90816 },
  {
    waypoints: ['116.45,39.95', '116.46,39.94'], // 途经点
    strategy: DrivingStrategy.AVOID_JAM, // 躲避拥堵
    show_fields: 'cost,navi,polyline', // 返回详细信息
    plate: '京AHA322', // 车牌号
    cartype: 0, // 车辆类型：0-燃油，1-纯电，2-插混
  }
);
```

### 步行路径规划

```typescript
// 基础用法
const result = await api.route.walking(
  '116.481028,39.989643',
  '116.434446,39.90816'
);

// 多路线 + 详细信息
const result = await api.route.walking(
  '116.481028,39.989643',
  '116.434446,39.90816',
  {
    alternative_route: 3, // 返回3条路线
    show_fields: 'cost,navi,polyline',
  }
);
```

### 骑行路径规划

```typescript
// 基础用法
const result = await api.route.bicycling(
  '116.481028,39.989643',
  '116.434446,39.90816'
);

// 电动车路径规划
const result = await api.route.electricBike(
  '116.481028,39.989643',
  '116.434446,39.90816',
  {
    alternative_route: 3,
    show_fields: 'cost,navi,polyline'
  }
);
```

### 公交路径规划

```typescript
import { TransitStrategy } from 'expo-gaode-map-web-api';

// 同城公交（V5 API：city1 和 city2 必填，使用 citycode）
const result = await api.route.transit(
  '116.481028,39.989643',
  '116.434446,39.90816',
  '010', // 起点城市 citycode（北京）
  '010', // 终点城市 citycode（北京）
  {
    strategy: TransitStrategy.RECOMMENDED, // 推荐模式
    show_fields: 'cost,polyline',
    AlternativeRoute: 3, // 返回3条路线
  }
);

// 跨城公交
const result = await api.route.transit(
  '116.481028,39.989643',
  '121.472644,31.231706',
  '010', // 北京
  '021', // 上海
  {
    strategy: TransitStrategy.TIME_FIRST, // 时间最短
    nightflag: 1, // 考虑夜班车
  }
);
```

## POI 搜索

```typescript
// 关键字搜索
const result = await api.poi.search('肯德基', {
  city: '北京',
  offset: 20,
  page: 1,
});

// 周边搜索
const result = await api.poi.searchAround('116.481028,39.989643', {
  keywords: '餐饮',
  radius: 1000,
});

// 获取详情
const detail = await api.poi.getDetail('B000A83M2Z');
```

## 输入提示

```typescript
// 基础提示
const tips = await api.inputTips.getTips('天安门', {
  city: '北京',
});

// POI 类型提示
const tips = await api.inputTips.getPOITips('餐饮', {
  city: '北京',
  type: '餐饮服务',
});

// 公交站点提示
const tips = await api.inputTips.getBusTips('望京', {
  city: '北京',
});

// 公交线路提示
const tips = await api.inputTips.getBuslineTips('地铁15号线', {
  city: '北京',
});
```

## 驾车策略（V5 API）

| 策略值 | 说明 |
|--------|------|
| `DrivingStrategy.DEFAULT` (32) | 默认，高德推荐（推荐） |
| `DrivingStrategy.AVOID_JAM` (33) | 躲避拥堵 |
| `DrivingStrategy.HIGHWAY_FIRST` (34) | 高速优先 |
| `DrivingStrategy.NO_HIGHWAY` (35) | 不走高速 |
| `DrivingStrategy.LESS_TOLL` (36) | 少收费 |
| `DrivingStrategy.MAIN_ROAD_FIRST` (37) | 大路优先 |
| `DrivingStrategy.FASTEST` (38) | 速度最快 |

## 公交策略（V5 API）

| 策略值 | 说明 |
|--------|------|
| `TransitStrategy.RECOMMENDED` (0) | 推荐模式（默认） |
| `TransitStrategy.CHEAPEST` (1) | 最经济模式 |
| `TransitStrategy.LEAST_TRANSFER` (2) | 最少换乘 |
| `TransitStrategy.LEAST_WALK` (3) | 最少步行 |
| `TransitStrategy.TIME_FIRST` (8) | 时间最短 |

## 错误处理

```typescript
try {
  const result = await api.geocode.regeocode('116.481028,39.989643');
  console.log(result.regeocode.formatted_address);
} catch (error) {
  if (error instanceof Error) {
    console.error('错误:', error.message);
    // 可能的错误：
    // - "API Error: INVALID_USER_KEY (code: 10001)" - Key无效
    // - "API Error: DAILY_QUERY_OVER_LIMIT (code: 10003)" - 超过每日限额
  }
}
```

## API 参考

### GaodeWebAPI 类

主类，用于创建和管理 Web API 服务实例。

**构造函数：**

```typescript
class GaodeWebAPI {
  constructor(config?: { key?: string })
  
  geocode: GeocodeService;     // 地理编码服务
  route: RouteService;         // 路径规划服务
  poi: POIService;             // POI 搜索服务
  inputTips: InputTipsService; // 输入提示服务
}
```

**参数说明：**

- `config.key`（可选）：Web 服务 Key
  - 如果不传，会自动从已初始化的基础模块中解析 `webKey`
  - 推荐使用无参构造，在基础模块的 `initSDK({ webKey })` 中统一配置

**示例：**

```typescript
// 推荐：无参构造（从基础模块读取）
const api = new GaodeWebAPI();

// 或者：显式传入 Key
const api = new GaodeWebAPI({ key: 'your-web-api-key' });
```

---

### GeocodeService API

#### regeocode() - 逆地理编码

```typescript
async regeocode(
  location: string | { longitude: number; latitude: number },
  options?: {
    extensions?: 'base' | 'all';
    radius?: number;
    poitype?: string;
    roadlevel?: 0 | 1;
    homeorcorp?: 0 | 1 | 2;
  }
): Promise<RegeocodeResponse>
```

#### geocode() - 地理编码

```typescript
async geocode(
  address: string,
  city?: string
): Promise<GeocodeResponse>
```

#### batchGeocode() - 批量地理编码

```typescript
async batchGeocode(
  addresses: string[],
  city?: string
): Promise<GeocodeResponse[]>
```

最多支持 10 个地址批量查询。

#### batchRegeocode() - 批量逆地理编码

```typescript
async batchRegeocode(
  locations: Array<string | { longitude: number; latitude: number }>,
  options?: RegeocodeOptions
): Promise<BatchRegeocodeResponse>
```

最多支持 20 个坐标批量查询。

---

### RouteService API

#### driving() - 驾车路径规划

```typescript
async driving(
  origin: string | { longitude: number; latitude: number },
  destination: string | { longitude: number; latitude: number },
  options?: {
    waypoints?: string[];
    strategy?: DrivingStrategy;
    show_fields?: string;
    plate?: string;
    cartype?: 0 | 1 | 2;
    size?: number;
    load?: number;
    extensions?: 'base' | 'all';
  }
): Promise<DrivingRouteResponse>
```

#### walking() - 步行路径规划

```typescript
async walking(
  origin: string | { longitude: number; latitude: number },
  destination: string | { longitude: number; latitude: number },
  options?: {
    alternative_route?: number;
    show_fields?: string;
  }
): Promise<WalkingRouteResponse>
```

#### bicycling() - 骑行路径规划

```typescript
async bicycling(
  origin: string | { longitude: number; latitude: number },
  destination: string | { longitude: number; latitude: number },
  options?: {
    alternative_route?: number;
    show_fields?: string;
  }
): Promise<BicyclingRouteResponse>
```

#### electricBike() - 电动车路径规划

```typescript
async electricBike(
  origin: string | { longitude: number; latitude: number },
  destination: string | { longitude: number; latitude: number },
  options?: {
    alternative_route?: number;
    show_fields?: string;
  }
): Promise<ElectricBikeRouteResponse>
```

#### transit() - 公交路径规划

```typescript
async transit(
  origin: string | { longitude: number; latitude: number },
  destination: string | { longitude: number; latitude: number },
  city1: string,
  city2: string,
  options?: {
    strategy?: TransitStrategy;
    AlternativeRoute?: number;
    nightflag?: 0 | 1;
    show_fields?: string;
    time?: string;
  }
): Promise<TransitRouteResponse>
```

---

### POIService API

#### search() - 关键字搜索

```typescript
async search(
  keywords: string,
  options?: {
    city?: string;
    citylimit?: boolean;
    offset?: number;
    page?: number;
    types?: string;
    extensions?: 'base' | 'all';
  }
): Promise<POISearchResponse>
```

#### searchAround() - 周边搜索

```typescript
async searchAround(
  location: string | { longitude: number; latitude: number },
  options?: {
    keywords?: string;
    types?: string;
    radius?: number;
    offset?: number;
    page?: number;
    extensions?: 'base' | 'all';
  }
): Promise<POISearchResponse>
```

#### searchPolygon() - 多边形搜索

```typescript
async searchPolygon(
  polygon: string,
  options?: {
    keywords?: string;
    types?: string;
    offset?: number;
    page?: number;
    extensions?: 'base' | 'all';
  }
): Promise<POISearchResponse>
```

#### getDetail() - 获取 POI 详情

```typescript
async getDetail(
  id: string
): Promise<POIDetailResponse>
```

---

### InputTipsService API

#### getTips() - 获取输入提示

```typescript
async getTips(
  keywords: string,
  options?: {
    city?: string;
    type?: string;
    location?: string;
    citylimit?: boolean;
  }
): Promise<InputTipsResponse>
```

#### getPOITips() - POI 类型提示

```typescript
async getPOITips(
  keywords: string,
  options?: {
    city?: string;
    type?: string;
  }
): Promise<InputTipsResponse>
```

#### getBusTips() - 公交站点提示

```typescript
async getBusTips(
  keywords: string,
  options?: {
    city?: string;
  }
): Promise<InputTipsResponse>
```

#### getBuslineTips() - 公交线路提示

```typescript
async getBuslineTips(
  keywords: string,
  options?: {
    city?: string;
  }
): Promise<InputTipsResponse>
```

---

## 实用示例

### 完整的地址选择器

```typescript
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

const api = new GaodeWebAPI();

// 1. 用户输入时获取提示
async function handleInputChange(text: string) {
  const tips = await api.inputTips.getTips(text, {
    city: '北京',
  });
  
  return tips.tips.map(tip => ({
    id: tip.id,
    name: tip.name,
    address: tip.address,
    location: tip.location,
  }));
}

// 2. 用户选择后获取详情
async function handleSelectPlace(id: string) {
  const detail = await api.poi.getDetail(id);
  
  return {
    name: detail.pois[0].name,
    address: detail.pois[0].address,
    location: detail.pois[0].location,
    tel: detail.pois[0].tel,
  };
}
```

### 路径对比工具

```typescript
import { DrivingStrategy } from 'expo-gaode-map-web-api';

// 对比不同策略的路径
async function compareRoutes(origin: string, destination: string) {
  const strategies = [
    { name: '高德推荐', value: DrivingStrategy.DEFAULT },
    { name: '躲避拥堵', value: DrivingStrategy.AVOID_JAM },
    { name: '不走高速', value: DrivingStrategy.NO_HIGHWAY },
    { name: '少收费', value: DrivingStrategy.LESS_TOLL },
  ];
  
  const results = await Promise.all(
    strategies.map(async (s) => {
      const result = await api.route.driving(origin, destination, {
        strategy: s.value,
        show_fields: 'cost',
      });
      
      const path = result.route.paths[0];
      return {
        strategy: s.name,
        distance: parseInt(path.distance),
        duration: parseInt(path.duration),
        tolls: parseFloat(path.tolls),
      };
    })
  );
  
  // 按时间排序
  return results.sort((a, b) => a.duration - b.duration);
}
```

### 周边设施查询

```typescript
// 查询某个位置周边的各类设施
async function findNearbyFacilities(location: string) {
  const categories = [
    { name: '餐饮', types: '餐饮服务' },
    { name: '购物', types: '购物服务' },
    { name: '交通', types: '交通设施服务' },
    { name: '医疗', types: '医疗保健服务' },
  ];
  
  const results = await Promise.all(
    categories.map(async (cat) => {
      const result = await api.poi.searchAround(location, {
        types: cat.types,
        radius: 1000,
        offset: 10,
      });
      
      return {
        category: cat.name,
        count: parseInt(result.count),
        pois: result.pois.slice(0, 5).map(poi => ({
          name: poi.name,
          address: poi.address,
          distance: poi.distance,
        })),
      };
    })
  );
  
  return results;
}
```

---

## 常见问题

### Q: 为什么需要先安装基础模块？

A: Web API 包需要从基础模块（`expo-gaode-map` 或 `expo-gaode-map-navigation`）中读取 `webKey`。这样可以统一管理所有 Key，避免重复配置。

### Q: 可以同时使用核心地图包和导航包吗？

A: **不可以**。导航包内置了完整的地图 SDK，与核心地图包冲突。只能选择其一：
- 如果需要导航功能 → 使用 `expo-gaode-map-navigation`
- 如果只需要地图 → 使用 `expo-gaode-map`

### Q: Web API 和原生搜索模块有什么区别？

A:
- **Web API**：纯 JavaScript，跨平台一致，但需要网络请求
- **原生搜索**：调用原生 SDK，性能更好，但需要分别适配 iOS 和 Android

建议优先使用原生搜索模块（`expo-gaode-map-search`），仅在原生不支持的场景（如 Web 端）使用 Web API。

### Q: 如何处理超出配额的情况？

A:
```typescript
try {
  const result = await api.geocode.regeocode('116.481028,39.989643');
} catch (error) {
  if (error instanceof Error && error.message.includes('DAILY_QUERY_OVER_LIMIT')) {
    // 提示用户今日配额已用完
    console.log('今日查询次数已用完，请明天再试');
  }
}
```

### Q: 坐标格式是什么？

A: 高德地图使用 GCJ-02 坐标系（火星坐标系），格式为"经度,纬度"，例如：`116.481028,39.989643`。

注意：
- 经度在前，纬度在后
- 使用英文逗号分隔
- 经度范围：-180 ~ 180
- 纬度范围：-90 ~ 90

---

## 注意事项

1. **Key 类型**：必须使用 Web 服务 Key（非 iOS/Android Key）
2. **初始化**：建议在基础模块中通过 `initSDK({ webKey })` 下发
3. **配额限制**：请参考高德控制台额度与 QPS 限制
4. **坐标格式**：经度在前，纬度在后（经度,纬度）
5. **网络请求**：需要网络连接，无法离线使用
6. **坐标系**：高德地图使用 GCJ-02 坐标系（火星坐标系）
7. **批量查询**：地理编码最多 10 个，逆地理编码最多 20 个
8. **缓存建议**：对于相同的查询，建议在客户端做缓存以减少请求次数

## 相关文档

- [导航 API](/api/navigation) - 导航模块使用指南
- [搜索 API](/api/search) - 原生搜索模块
- [高德 Web API 文档](https://lbs.amap.com/api/webservice/summary)