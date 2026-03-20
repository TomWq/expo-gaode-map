# 核心参考: Web API

高德地图 Web API 模块，提供了在 React Native 环境中直接调用高德 Web 服务的能力。

## 核心概念

- **GaodeWebAPI**: 统一的服务入口类。
- **Web API Key**: 可通过 `ExpoGaodeMapModule.initSDK({ webKey })` 全局下发，也可在构造函数中直接传入 `key`。
- **GCJ-02 坐标系**: 所有输入输出坐标均遵循高德 GCJ-02 标准。
- **服务分类**: 地理编码 (Geocode)、路径规划 (Route)、POI 搜索 (POI)、输入提示 (InputTips)。

## 基础用法

### 初始化与创建实例

在使用 Web API 之前，你可以通过以下两种方式之一提供 Web API Key：

#### 方式 1：全局初始化 (推荐)
在基础模块（`expo-gaode-map` 或 `expo-gaode-map-navigation`）初始化时统一配置。

> 注意：如果这里走的是基础包 `initSDK()` 链路，那么新版本中应先完成隐私确认，再执行初始化。

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

// 1. 在应用启动时初始化 (只需一次)
ExpoGaodeMapModule.initSDK({
  // 如果已通过 Config Plugin 配置 androidKey/iosKey，这里只需传 webKey
  webKey: 'YOUR_WEB_API_KEY' 
});

// 2. 无参创建实例
const api = new GaodeWebAPI();
```

#### 方式 2：构造函数显式传入 (高级配置)
```typescript
const api = new GaodeWebAPI({ 
  key: 'YOUR_WEB_API_KEY',
  enableCache: true, // 开启 LRU 缓存
  maxRetries: 3      // 失败重试次数
});
```

> 方式 2 是纯 JS 路径，不依赖地图渲染，也不依赖基础包的隐私初始化链路。

## 高级特性 (Advanced)

### 1. 缓存策略 (Caching)
SDK 内置了 LRU (Least Recently Used) 缓存机制。开启后，对于 URL 和参数完全相同的请求，将直接返回内存中的结果，不再发起网络请求。

```typescript
const api = new GaodeWebAPI({ enableCache: true });
// 第一次：网络请求
await api.geocode.regeocode('116.48,39.99');
// 第二次：命中缓存 (速度极快)
await api.geocode.regeocode('116.48,39.99');
```

### 2. 请求取消 (Cancellation)
在输入提示（InputTips）等场景中，用户输入速度很快，可能会产生竞态问题。所有 Service 方法均支持通过 `signal` 取消请求。

```typescript
const controller = new AbortController();

api.inputTips.getTips('KFC', {
  city: '010',
  signal: controller.signal
});

// 取消请求
controller.abort();
```

### 3. 自动重试 (Auto Retry)
遇到网络错误、QPS 超限（如 `10014`）、服务器繁忙（`10016`）等可恢复错误时，SDK 会自动进行指数退避重试，默认重试 3 次。

## 路径规划服务 (Route)

提供多种出行方式的路径规划方案，全面支持 **V5** 版本 API。

> **💡 性能优化**：API 返回的路径点串通常较长。建议使用 `ExpoGaodeMapModule.parsePolyline` 进行原生解析，并使用 `ExpoGaodeMapModule.simplifyPolyline` 进行抽稀优化，以获得最佳的渲染性能。

### 驾车路径规划 (Driving)

默认使用 V5 版本接口，支持避让拥堵、多策略选择。

```typescript
import { DrivingStrategy } from 'expo-gaode-map-web-api';

const result = await api.route.driving(
  '116.481028,39.989643', // 起点
  '116.434446,39.90816',  // 终点
  {
    strategy: DrivingStrategy.AVOID_JAM, // 避让拥堵
    waypoints: ['116.45,39.95'],        // 途经点
    plate: '京AHA322',                   // 车牌号 (用于避让限行)
    cartype: 0,                          // 0:燃油, 1:纯电, 2:插混
    show_fields: 'cost,navi,polyline'    // 详细信息控制
  }
);

const path = result.route.paths[0];
console.log(`距离: ${path.distance}米, 耗时: ${path.cost.duration}秒`);
```

### 步行与骑行
```typescript
// 步行
const walk = await api.route.walking(origin, dest);

// 骑行 (支持电动车 electricBike)
const ride = await api.route.bicycling(origin, dest);
const eBike = await api.route.electricBike(origin, dest);
```

### 公交 (Transit)
支持同城和跨城公交规划。

```typescript
const transit = await api.route.transit(
  origin, 
  dest, 
  '010', // 起点城市代码 (如北京)
  '021'  // 目的地城市代码 (如上海)
);
```

## 输入提示 (InputTips)
支持按类型过滤提示内容：

```typescript
// 基础提示
api.inputTips.getTips('肯德基', { city: '北京' });

// 仅公交线路
api.inputTips.getBuslineTips('1路', { city: '北京' });

// 仅 POI
api.inputTips.getPOITips('加油站');
```

## POI 详情深度 (POIService)
通过 `show_fields` 参数获取更深层级的数据：

```typescript
const result = await api.poi.search('商场', {
  // 请求子POI、室内地图、导航信息
  show_fields: 'children,indoor,navi,business'
});

// 批量获取 POI 详情
const details = await api.poi.batchGetDetail(['B000A8VE1H', 'B0FFKEPXS2']);
```

## 地理编码 (Geocode)
支持批量操作。

```typescript
// 批量逆地理编码
const result = await api.geocode.batchRegeocode([
  '116.481028,39.989643',
  '116.434446,39.90816'
]);
```

## 最佳实践与注意事项

### 类型安全 (Type Safety)
`expo-gaode-map-web-api` 提供了完整的 TypeScript 类型定义。在处理 API 响应时，应始终导入并使用正确的类型，避免使用 `any`。

**常用类型对照表：**

| 服务类型 | 请求参数类型 | 响应类型 | 核心数据结构 |
| :--- | :--- | :--- | :--- |
| **驾车** | `DrivingRouteParams` | `DrivingRouteResponse` | `Path`, `Step`, `Tmc` |
| **步行** | `WalkingRouteParams` | `WalkingRouteResponse` | `Path`, `Step` |
| **骑行** | `BicyclingRouteParams` | `BicyclingRouteResponse` | `Path`, `Step` |
| **公交** | `TransitRouteParams` | `TransitRouteResponse` | `Transit`, `Segment`, `BusLine` |
| **地理编码** | `GeocodeParams` | `GeocodeResponse` | `Geocode` |
| **逆地理编码** | `ReGeocodeParams` | `ReGeocodeResponse` | `ReGeocode`, `AddressComponent` |

### 错误处理
Web API 调用可能因为 Key 无效、配额耗尽或网络问题失败，建议使用 `try-catch`。

```typescript
import { GaodeAPIError } from 'expo-gaode-map-web-api';

try {
  const result = await api.geocode.geocode('...');
} catch (error) {
  if (error instanceof GaodeAPIError) {
    console.error(`API 错误: ${error.info} (代码: ${error.infocode})`);
  } else {
    console.error('网络或未知错误', error);
  }
}
```

### API 版本选择
默认情况下，`driving` 和 `search` 等方法使用高德最新的 **V5** 接口。如果需要使用旧版接口，可以在 options 中指定 `version: 'v3'`。
