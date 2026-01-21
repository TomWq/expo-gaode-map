# Web API 技能

高德地图 Web API 模块，提供了在 React Native 环境中直接调用高德 Web 服务的能力。该模块独立于原生 SDK，主要用于纯数据层面的地理信息查询，如地理编码、路径规划、POI 搜索和输入提示。

## 核心概念

- **GaodeWebAPI**: 统一的服务入口类。
- **Web API Key**: 必须通过 `ExpoGaodeMapModule.initSDK({ webKey })` 初始化，模块会自动从核心包获取该 Key。
- **GCJ-02 坐标系**: 所有输入输出坐标均遵循高德 GCJ-02 标准。
- **服务分类**: 地理编码 (Geocode)、路径规划 (Route)、POI 搜索 (POI)、输入提示 (InputTips)。

## 基础用法

### 初始化与创建实例

在使用 Web API 之前，你可以通过以下两种方式之一提供 Web API Key：

#### 方式 1：全局初始化 (推荐)
在基础模块（`expo-gaode-map` 或 `expo-gaode-map-navigation`）初始化时统一配置。

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

// 1. 在应用启动时初始化 (只需一次)
ExpoGaodeMapModule.initSDK({
  iosKey: '...',
  androidKey: '...',
  webKey: 'YOUR_WEB_API_KEY' // 供 Web API 自动读取
});

// 2. 无参创建实例
const api = new GaodeWebAPI();
```

#### 方式 2：构造函数显式传入
如果你不希望依赖 `initSDK` 的全局配置，或者需要临时使用不同的 Key。

```typescript
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

// 在构造函数中显式传入 key
const api = new GaodeWebAPI({ 
  key: 'YOUR_WEB_API_KEY' 
});
```

## 地理编码服务 (Geocode)

用于地址字符串与经纬度坐标之间的相互转换。

### 地理编码 (地址 -> 坐标)

```typescript
// 基础用法
const result = await api.geocode.geocode('北京市朝阳区阜通东大街6号');
const location = result.geocodes[0].location; // "116.481028,39.989643"

// 指定城市
const result = await api.geocode.geocode('阜通东大街6号', '北京');
```

### 逆地理编码 (坐标 -> 地址)

```typescript
// 方式1：使用字符串
const result = await api.geocode.regeocode('116.481028,39.989643');

// 方式2：使用坐标对象
const result = await api.geocode.regeocode({
  longitude: 116.481028,
  latitude: 39.989643
});

// 方式3：带可选参数（如获取周边 POI）
const result = await api.geocode.regeocode('116.481028,39.989643', {
  extensions: 'all', // 返回全部信息，包括周边 POI、AOI 等
  radius: 1000       // 搜索半径
});

console.log(result.regeocode.formatted_address);
```

## 路径规划服务 (Route)

提供多种出行方式的路径规划方案。

### 驾车路径规划 (Driving)

默认使用 V5 版本接口，支持避让拥堵、多策略选择。

```typescript
import { DrivingStrategy } from 'expo-gaode-map-web-api';

const result = await api.route.driving(
  '116.481028,39.989643', // 起点
  '116.434446,39.90816',  // 终点
  {
    strategy: DrivingStrategy.AVOID_JAM, // 避让拥堵
    waypoints: ['116.45,39.95'],        // 途经点 (支持数组或字符串)
    plate: '京AHA322'                    // 车牌号 (用于避让限行)
  }
);

const path = result.route.paths[0];
console.log(`距离: ${path.distance}米, 耗时: ${path.cost.duration}秒`);
```

### 其他路径规划

```typescript
// 步行
const walking = await api.route.walking(origin, dest);

// 骑行
const bicycling = await api.route.bicycling(origin, dest);

// 电动车
const ebike = await api.route.electricBike(origin, dest);

// 公交 (需指定城市)
const transit = await api.route.transit(origin, dest, {
  city: '北京',
  cityd: '上海' // 跨城公交
});
```

## POI 搜索服务 (POI)

搜索兴趣点信息，支持关键字、周边和多边形搜索。

### 关键字搜索

```typescript
const result = await api.poi.search('肯德基', {
  region: '北京市',
  city_limit: true,
  page_size: 20
});
```

### 周边搜索

```typescript
const result = await api.poi.searchAround('116.473168,39.993015', {
  keywords: '餐厅',
  radius: 1000,
  sortrule: 'distance'
});
```

## 输入提示服务 (InputTips)

根据用户输入返回搜索建议。

```typescript
// 基础输入提示
const result = await api.inputTips.getTips('肯德基', {
  city: '北京',
  citylimit: true
});

// 仅获取 POI 类型的建议
const poiTips = await api.inputTips.getPOITips('餐厅', { city: '北京' });

// 仅获取公交站点的建议
const busTips = await api.inputTips.getBusTips('天安门', { city: '北京' });
```

## 最佳实践与注意事项

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

### 坐标转换

Web API 仅支持 **GCJ-02** 坐标系。如果你的数据是 WGS-84 (GPS) 或 BD-09 (百度)，请先使用核心包的 `ExpoGaodeMapModule.convertCoordinate` 进行转换后再调用 Web API。

### API 版本选择

默认情况下，`driving` 和 `search` 等方法使用高德最新的 **V5** 接口。如果需要使用旧版接口，可以在 options 中指定 `version: 'v3'`。
