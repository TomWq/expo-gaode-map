# expo-gaode-map-web-api

高德地图 Web API 服务模块 - 纯 JavaScript 实现，无需原生依赖

## 特性

- ✅ **纯 JavaScript 实现**：无需原生编译，跨平台完全一致
- ✅ **TypeScript 支持**：完整的类型定义
- ✅ **文档完善**：高德 Web API 文档持续更新
- ✅ **易于调试**：可以用浏览器或 Postman 直接测试
- ✅ **零依赖**：只使用标准的 fetch API

## 已实现功能

### 地理编码服务
- ✅ 地理编码（地址 → 坐标）
- ✅ 逆地理编码（坐标 → 地址）
- ✅ 批量地理编码
- ✅ 批量逆地理编码

### 路径规划服务
- ✅ 驾车路径规划
- ✅ 步行路径规划
- ✅ 骑行路径规划
- ✅ 电动车路径规划
- ✅ 公交路径规划

## 待实现功能

- ⏳ POI 搜索
- ⏳ 天气查询
- ⏳ 行政区域查询

## 安装

```bash
npm install expo-gaode-map-web-api
# 或
yarn add expo-gaode-map-web-api
# 或
pnpm add expo-gaode-map-web-api
```

## 快速开始

### 1. 申请 Web API Key

1. 登录 [高德开放平台控制台](https://console.amap.com/)
2. 创建应用
3. 添加 **Web 服务** Key（注意：不是 iOS/Android Key）

### 2. 基础使用

```typescript
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

// 创建实例
const api = new GaodeWebAPI({
  key: 'your-web-api-key',
});

// 逆地理编码：坐标 → 地址
const result = await api.geocode.regeocode('116.481028,39.989643');
console.log(result.regeocode.formatted_address);
// 输出：北京市朝阳区阜通东大街6号

// 地理编码：地址 → 坐标
const result2 = await api.geocode.geocode('北京市朝阳区阜通东大街6号');
console.log(result2.geocodes[0].location);
// 输出：116.481028,39.989643

// 驾车路径规划
const route = await api.route.driving(
  '116.481028,39.989643',
  '116.434446,39.90816'
);
console.log(`距离：${route.route.paths[0].distance}米`);
console.log(`时间：${route.route.paths[0].duration}秒`);
```

## 详细用法

### 逆地理编码

#### 基础用法

```typescript
// 方式1：使用字符串（经度,纬度）
const result = await api.geocode.regeocode('116.481028,39.989643');

// 方式2：使用对象
const result = await api.geocode.regeocode({
  longitude: 116.481028,
  latitude: 39.989643,
});

// 获取结果
console.log(result.regeocode.formatted_address);
// 北京市朝阳区阜通东大街6号

console.log(result.regeocode.addressComponent);
// {
//   country: "中国",
//   province: "北京市",
//   city: [],
//   district: "朝阳区",
//   township: "望京街道",
//   street: "阜通东大街",
//   number: "6号",
//   ...
// }
```

#### 高级用法

```typescript
// 获取详细信息（附近POI、道路等）
const result = await api.geocode.regeocode('116.481028,39.989643', {
  extensions: 'all', // 返回详细信息
  radius: 1000, // 搜索半径1000米
  poitype: '商务住宅|餐饮服务', // POI类型
});

// 获取附近POI
result.regeocode.pois?.forEach(poi => {
  console.log(`${poi.name} - ${poi.distance}米`);
});

// 获取附近道路
result.regeocode.roads?.forEach(road => {
  console.log(`${road.name} - ${road.distance}米`);
});
```

#### 批量逆地理编码

```typescript
const result = await api.geocode.batchRegeocode([
  '116.481028,39.989643',
  '116.434446,39.90816',
  '116.397477,39.908692',
]);

// 处理多个结果
// 注意：批量查询的结果格式与单个查询略有不同
```

### 地理编码

#### 基础用法

```typescript
// 地址转坐标
const result = await api.geocode.geocode('北京市朝阳区阜通东大街6号');

console.log(result.geocodes[0].location);
// 116.481028,39.989643

console.log(result.geocodes[0].formatted_address);
// 北京市朝阳区阜通东大街6号
```

#### 指定城市

```typescript
// 当地址不完整时，建议指定城市
const result = await api.geocode.geocode('阜通东大街6号', '北京');

// 可以避免歧义，提高准确性
```

#### 批量地理编码

```typescript
const result = await api.geocode.batchGeocode(
  [
    '北京市朝阳区阜通东大街6号',
    '北京市朝阳区望京SOHO',
    '北京市海淀区中关村大街1号',
  ],
  '北京'
);

result.geocodes.forEach(geocode => {
  console.log(`${geocode.formatted_address} → ${geocode.location}`);
});
```

## 在 React Native 中使用

### 示例：显示当前位置地址

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import * as Location from 'expo-location';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

const api = new GaodeWebAPI({ key: 'your-key' });

export default function CurrentLocation() {
  const [address, setAddress] = useState('');

  useEffect(() => {
    (async () => {
      // 获取当前位置
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync();
      const { longitude, latitude } = location.coords;

      // 逆地理编码
      const result = await api.geocode.regeocode({
        longitude,
        latitude,
      });

      setAddress(result.regeocode.formatted_address);
    })();
  }, []);

  return (
    <View>
      <Text>当前位置：{address}</Text>
    </View>
  );
}
```

### 示例：搜索地址并在地图上显示

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

const api = new GaodeWebAPI({ key: 'your-key' });

export default function SearchMap() {
  const [address, setAddress] = useState('');
  const [marker, setMarker] = useState(null);

  const handleSearch = async () => {
    // 地址转坐标
    const result = await api.geocode.geocode(address, '北京');
    
    if (result.geocodes.length > 0) {
      const [lng, lat] = result.geocodes[0].location.split(',');
      setMarker({
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        title: result.geocodes[0].formatted_address,
      });
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        value={address}
        onChangeText={setAddress}
        placeholder="输入地址"
      />
      <Button title="搜索" onPress={handleSearch} />
      
      <MapView style={{ flex: 1 }}>
        {marker && <Marker {...marker} />}
      </MapView>
    </View>
  );
}
```

### 路径规划（新版 V5 API）

#### 驾车路径规划

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

// 高级用法：带途经点和策略（新版 V5 API）
const result = await api.route.driving(
  { longitude: 116.481028, latitude: 39.989643 },
  { longitude: 116.434446, latitude: 39.90816 },
  {
    waypoints: ['116.45,39.95', '116.46,39.94'], // 途经点
    strategy: DrivingStrategy.AVOID_JAM, // 躲避拥堵（新版使用33）
    show_fields: 'cost,navi,polyline', // 返回成本、导航、坐标信息
    plate: '京AHA322', // 车牌号（用于判断限行）
    cartype: 0, // 车辆类型：0-燃油，1-纯电，2-插混
    ferry: 0, // 是否使用轮渡：0-使用，1-不使用
  }
);

// 新能源车路径规划
const result = await api.route.driving(
  '116.481028,39.989643',
  '116.434446,39.90816',
  {
    cartype: 1, // 纯电动汽车
    plate: '京AD12345', // 新能源车牌
    strategy: DrivingStrategy.DEFAULT, // 高德推荐策略
  }
);
```

#### 步行路径规划

```typescript
// 基础用法
const result = await api.route.walking(
  '116.481028,39.989643',
  '116.434446,39.90816'
);

console.log(`步行距离：${result.route.paths[0].distance}米`);
console.log(`预计时间：${result.route.paths[0].duration}秒`);
console.log(`打车费用：${result.route.paths[0].taxi}元`);

// 高级用法：多路线 + 详细信息
const result = await api.route.walking(
  '116.481028,39.989643',
  '116.434446,39.90816',
  {
    alternative_route: 3, // 返回3条路线
    show_fields: 'cost,navi,polyline', // 返回成本、导航、坐标
    origin_id: 'B000A83M2Z', // 起点POI ID（提升准确性）
    destination_id: 'B000A83M30', // 终点POI ID
    isindoor: 1, // 需要室内算路
  }
);

// 获取每一步的导航信息
result.route.paths[0].steps.forEach((step, index) => {
  console.log(`第${index + 1}步：${step.instruction}`);
  console.log(`  道路：${step.road_name || '无名路'}`);
  console.log(`  距离：${step.step_distance}米`);
  console.log(`  道路类型：${step.walk_type}`); // 0-普通道路，1-人行横道等
});
```

#### 骑行路径规划

```typescript
// 基础用法
const result = await api.route.bicycling(
  '116.481028,39.989643',
  '116.434446,39.90816'
);

// 高级用法：多路线
const result = await api.route.bicycling(
  '116.481028,39.989643',
  '116.434446,39.90816',
  {
    alternative_route: 2, // 返回2条路线
    show_fields: 'cost,navi,polyline' // 返回详细信息
  }
);
```

#### 电动车路径规划

```typescript
const result = await api.route.electricBike(
  '116.481028,39.989643',
  '116.434446,39.90816',
  {
    alternative_route: 3, // 返回3条路线
    show_fields: 'cost,navi,polyline'
  }
);
```

#### 公交路径规划

```typescript
import { TransitStrategy } from 'expo-gaode-map-web-api';

// 同城公交（新版 V5 API：city1 和 city2 必填，使用 citycode）
const result = await api.route.transit(
  '116.481028,39.989643',
  '116.434446,39.90816',
  '010', // 起点城市 citycode（北京）
  '010', // 终点城市 citycode（北京）
  {
    strategy: TransitStrategy.RECOMMENDED, // 推荐模式（默认）
    show_fields: 'cost,polyline', // 返回成本和坐标信息
    AlternativeRoute: 3, // 返回3条路线
  }
);

// 跨城公交
const result = await api.route.transit(
  '116.481028,39.989643',
  '121.472644,31.231706',
  '010', // 北京 citycode
  '021', // 上海 citycode
  {
    strategy: TransitStrategy.TIME_FIRST, // 时间最短
    nightflag: 1, // 考虑夜班车
    date: '2024-12-08', // 请求日期
    time: '9:00', // 出发时间
  }
);

// 地铁图模式（起终点都是地铁站）
const result = await api.route.transit(
  '116.481028,39.989643',
  '116.434446,39.90816',
  '010',
  '010',
  {
    strategy: TransitStrategy.SUBWAY_MAP, // 地铁图模式
    originpoi: 'B000A83M2Z', // 起点地铁站POI ID（必填）
    destinationpoi: 'B000A83M30', // 终点地铁站POI ID（必填）
    multiexport: 1, // 返回全部地铁出入口
  }
);

// 处理公交换乘方案
result.route.transits.forEach((transit, index) => {
  console.log(`\n方案${index + 1}：`);
  console.log(`总费用：${transit.cost}元`);
  console.log(`总时间：${transit.duration}秒`);
  console.log(`步行距离：${transit.walking_distance}米`);
  console.log(`是否夜班车：${transit.nightflag === '1' ? '是' : '否'}`);
  
  transit.segments.forEach((segment, segIndex) => {
    if (segment.walking) {
      console.log(`  ${segIndex + 1}. 步行 ${segment.walking.distance}米`);
    } else if (segment.bus) {
      const line = segment.bus.buslines[0];
      console.log(`  ${segIndex + 1}. 乘坐 ${line.name}`);
      console.log(`     ${line.departure_stop.name} → ${line.arrival_stop.name}`);
      console.log(`     途经${line.via_num}站，${line.distance}米`);
    }
  });
});
```

## API 参考

### GaodeWebAPI

主类，用于创建 API 实例。

#### 构造函数

```typescript
new GaodeWebAPI(config: ClientConfig)
```

#### 配置选项

```typescript
interface ClientConfig {
  /** Web API Key */
  key: string;
  /** 基础URL，默认：https://restapi.amap.com */
  baseURL?: string;
  /** 请求超时（毫秒），默认：10000 */
  timeout?: number;
}
```

#### 服务

**geocode - 地理编码服务**
- `regeocode()` - 逆地理编码
- `geocode()` - 地理编码
- `batchRegeocode()` - 批量逆地理编码
- `batchGeocode()` - 批量地理编码

**route - 路径规划服务**
- `driving()` - 驾车路径规划
- `walking()` - 步行路径规划
- `bicycling()` - 骑行路径规划
- `electricBike()` - 电动车路径规划
- `transit()` - 公交路径规划

**工具方法**
- `setKey(key)` - 更新 API Key
- `getKey()` - 获取当前 API Key

### 逆地理编码参数详解

#### regeocode(location, options?)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| location | string \| Coordinate | 是 | 经纬度坐标，格式："经度,纬度" 或 {longitude, latitude} |
| options.poitype | string | 否 | 返回附近POI类型，多个类型用"\|"分隔，如："商务住宅\|餐饮服务" |
| options.radius | number | 否 | 搜索半径，取值范围：0-3000，默认1000米 |
| options.extensions | 'base' \| 'all' | 否 | 返回结果控制：base（基本信息，默认）/all（详细信息，包含POI、道路等） |
| options.roadlevel | 0 \| 1 | 否 | 道路等级：0（全部道路）/1（高速+国道+省道+县道+乡镇村道） |
| options.homeorcorp | 0 \| 1 \| 2 | 否 | 是否优化POI返回顺序：0（不优化）/1（优化为家）/2（优化为公司） |
| options.sig | string | 否 | 数字签名，签名校验型key需要传递此参数 |
| options.output | 'JSON' \| 'XML' | 否 | 返回数据格式，默认JSON |
| options.callback | string | 否 | 回调函数名，仅output为JSON时有效 |

#### 返回值字段说明

**AddressComponent（地址组成元素）**

| 字段 | 说明 | 示例 |
|------|------|------|
| country | 国家名称 | "中国" |
| province | 省份名称 | "北京市" |
| city | 城市名称（直辖市/省直辖县可能为空） | "北京市" 或 [] |
| citycode | 城市编码 | "010" |
| district | 区县名称 | "海淀区" |
| adcode | 行政区编码 | "110108" |
| township | 乡镇/街道（社区街道，非道路） | "燕园街道" |
| towncode | 乡镇街道编码 | "110101001000" |
| street | 街道名称 | "中关村北二条" |
| number | 门牌号 | "3号" |
| seaArea | 所属海域信息（可选） | "渤海" |

### 地理编码参数详解

#### geocode(address, city?, options?)

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| address | string | 是 | 结构化地址信息，地址信息越完整，解析精度越高 |
| city | string | 否 | 指定查询的城市，支持：城市中文、全拼、citycode、adcode。例如："北京市"/"beijing"/"010"/"110000" |
| options.sig | string | 否 | 数字签名，签名校验型key需要传递此参数 |
| options.output | 'JSON' \| 'XML' | 否 | 返回数据格式，默认JSON |
| options.callback | string | 否 | 回调函数名，仅output为JSON时有效 |

#### 批量查询说明

- **批量逆地理编码**：最多支持 20 个坐标点，坐标用"|"分隔
- **批量地理编码**：最多支持 10 个地址，地址用"|"分隔

### 路径规划参数详解

#### driving(origin, destination, options?)

**驾车路径规划策略（新版 V5 API）**

| 策略值 | 说明 |
|--------|------|
| `DrivingStrategy.SPEED_FIRST` (0) | 速度优先（旧版，只返回一条路线） |
| `DrivingStrategy.COST_FIRST` (1) | 费用优先（旧版，不走收费路段） |
| `DrivingStrategy.REGULAR_FASTEST` (2) | 常规最快（旧版） |
| `DrivingStrategy.DEFAULT` (32) | **默认，高德推荐（推荐使用）** |
| `DrivingStrategy.AVOID_JAM` (33) | 躲避拥堵 |
| `DrivingStrategy.HIGHWAY_FIRST` (34) | 高速优先 |
| `DrivingStrategy.NO_HIGHWAY` (35) | 不走高速 |
| `DrivingStrategy.LESS_TOLL` (36) | 少收费 |
| `DrivingStrategy.MAIN_ROAD_FIRST` (37) | 大路优先 |
| `DrivingStrategy.FASTEST` (38) | 速度最快 |
| `DrivingStrategy.AVOID_JAM_HIGHWAY_FIRST` (39) | 躲避拥堵 + 高速优先 |
| `DrivingStrategy.AVOID_JAM_NO_HIGHWAY` (40) | 躲避拥堵 + 不走高速 |
| `DrivingStrategy.AVOID_JAM_LESS_TOLL` (41) | 躲避拥堵 + 少收费 |
| `DrivingStrategy.LESS_TOLL_NO_HIGHWAY` (42) | 少收费 + 不走高速 |
| `DrivingStrategy.AVOID_JAM_LESS_TOLL_NO_HIGHWAY` (43) | 躲避拥堵 + 少收费 + 不走高速 |
| `DrivingStrategy.AVOID_JAM_MAIN_ROAD` (44) | 躲避拥堵 + 大路优先 |
| `DrivingStrategy.AVOID_JAM_FASTEST` (45) | 躲避拥堵 + 速度最快 |

**车辆类型（新版 V5 API）**

| 值 | 说明 |
|----|------|
| 0 | 普通燃油汽车（默认） |
| 1 | 纯电动汽车 |
| 2 | 插电式混动汽车 |

#### transit(origin, destination, city1, city2, options?)

**公交换乘策略（新版 V5 API）**

| 策略值 | 说明 |
|--------|------|
| `TransitStrategy.RECOMMENDED` (0) | 推荐模式，综合权重（默认） |
| `TransitStrategy.CHEAPEST` (1) | 最经济模式，票价最低 |
| `TransitStrategy.LEAST_TRANSFER` (2) | 最少换乘模式 |
| `TransitStrategy.LEAST_WALK` (3) | 最少步行模式 |
| `TransitStrategy.MOST_COMFORTABLE` (4) | 最舒适模式，尽量乘坐空调车 |
| `TransitStrategy.NO_SUBWAY` (5) | 不乘地铁模式 |
| `TransitStrategy.SUBWAY_MAP` (6) | 地铁图模式（起终点都是地铁站，需提供POI ID） |
| `TransitStrategy.SUBWAY_FIRST` (7) | 地铁优先模式（步行距离不超过4KM） |
| `TransitStrategy.TIME_FIRST` (8) | 时间短模式，总时间最少 |

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
    // - "Request timeout after 10000ms" - 请求超时
  }
}
```

## 注意事项

1. **Key 类型**：必须使用 Web 服务 Key，不能使用 iOS/Android Key
2. **配额限制**：个人开发者每天30万次免费额度
3. **坐标格式**：经度在前，纬度在后（经度,纬度）
4. **网络请求**：需要网络连接，无法离线使用
5. **跨域问题**：Web 端可能遇到跨域，建议使用代理或服务端请求

## 相关资源

- [高德地图 Web API 文档](https://lbs.amap.com/api/webservice/summary)
- [expo-gaode-map 核心模块](../core)
- [expo-gaode-map-navigation 导航模块](../navigation)

## License

MIT