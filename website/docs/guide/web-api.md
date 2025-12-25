
# Web API 服务

`expo-gaode-map-web-api` 是纯 JavaScript 实现的 Web 服务包，提供地理编码、路径规划、POI 搜索、输入提示等能力。

## 安装

Web API 服务是**可选的**，需要单独安装：

```bash
bun add expo-gaode-map-web-api
# 或
yarn add expo-gaode-map-web-api
# 或
npm install expo-gaode-map-web-api
```

::: tip 提示
Web API 包需要先安装基础地图组件（`expo-gaode-map` 或 `expo-gaode-map-navigation` 任选其一）。
:::

## 特性

- ✅ **纯 JavaScript**：跨平台一致，无原生编译依赖
- ✅ **TypeScript 支持**：完整类型定义与错误码映射
- ✅ **V5 API 适配**：已适配最新的路径规划策略与字段
- ✅ **协同工作**：从基础模块读取 webKey，支持无参构造
- ✅ **错误友好**：封装 `GaodeAPIError`，提供错误码中文说明

## 配置

### 1. 申请 Web 服务 Key

前往 [高德开放平台控制台](https://console.amap.com/) 创建应用，添加 **"Web 服务"** Key。

::: warning 注意
这是 **Web 服务 Key**，不是 iOS/Android Key。
:::

### 2. 在基础模块初始化时配置

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';
// 或
// import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

// 使用 Config Plugin 时，原生 Key 已自动配置
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // 必需，供 Web API 包读取
});

// 不使用 Config Plugin 时
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key',
});
```

### 3. 创建 API 实例

```typescript
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

// 推荐：无参构造（从基础模块读取 webKey）
const api = new GaodeWebAPI();

// 或者：显式传入 Key
const api = new GaodeWebAPI({ key: 'your-web-api-key' });
```

## 基础用法

### 地理编码

将地址转换为坐标：

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

### 逆地理编码

将坐标转换为地址：

```typescript
// 使用字符串
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
  radius: 1000, // 搜索半径
  poitype: '商务住宅|餐饮服务',
});
```

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
// 普通骑行
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

### POI 搜索

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

### 输入提示

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

## 完整示例

### 地址选择器

```typescript
import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity } from 'react-native';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

const api = new GaodeWebAPI();

export default function AddressPickerScreen() {
  const [keyword, setKeyword] = useState('');
  const [tips, setTips] = useState([]);

  const handleInputChange = async (text: string) => {
    setKeyword(text);
    if (text.length > 0) {
      const result = await api.inputTips.getTips(text, {
        city: '北京',
      });
      setTips(result.tips);
    } else {
      setTips([]);
    }
  };

  const handleSelectPlace = async (tip) => {
    console.log('选择了:', tip.name);
    // 获取详细信息
    if (tip.id) {
      const detail = await api.poi.getDetail(tip.id);
      console.log('详情:', detail.pois[0]);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        value={keyword}
        onChangeText={handleInputChange}
        placeholder="输入地址搜索"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          margin: 10,
        }}
      />

      <FlatList
        data={tips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSelectPlace(item)}
            style={{
              padding: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#eee',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
            <Text style={{ color: '#666', marginTop: 5 }}>{item.address}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
```

### 路径对比工具

```typescript
import React, { useState } from 'react';
import { View, Button, FlatList, Text } from 'react-native';
import { GaodeWebAPI, DrivingStrategy } from 'expo-gaode-map-web-api';

const api = new GaodeWebAPI();

export default function RouteCompareScreen() {
  const [routes, setRoutes] = useState([]);

  const compareRoutes = async () => {
    const origin = '116.481028,39.989643';
    const destination = '116.434446,39.90816';

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
          tolls: parseFloat(path.tolls || '0'),
        };
      })
    );

    setRoutes(results.sort((a, b) => a.duration - b.duration));
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Button title="对比路线" onPress={compareRoutes} />

      <FlatList
        data={routes}
        keyExtractor={(item) => item.strategy}
        renderItem={({ item, index }) => (
          <View
            style={{
              padding: 15,
              marginTop: 10,
              backgroundColor: index === 0 ? '#e8f5e9' : '#fff',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#ccc',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              {item.strategy}
              {index === 0 && ' 🏆'}
            </Text>
            <Text style={{ marginTop: 5 }}>
              距离: {(item.distance / 1000).toFixed(2)}公里
            </Text>
            <Text>时间: {Math.floor(item.duration / 60)}分钟</Text>
            <Text>收费: {item.tolls}元</Text>
          </View>
        )}
      />
    </View>
  );
}
```

### 显示当前位置地址

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { ExpoGaodeMapModule } from 'expo-gaode-map';
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

const api = new GaodeWebAPI();

export default function CurrentLocationScreen() {
  const [address, setAddress] = useState('正在获取位置...');

  useEffect(() => {
    (async () => {
      try {
        // 获取当前位置
        const location = await ExpoGaodeMapModule.getCurrentLocation();
        
        // 逆地理编码
        const result = await api.geocode.regeocode({
          longitude: location.longitude,
          latitude: location.latitude,
        });

        setAddress(result.regeocode.formatted_address);
      } catch (error) {
        setAddress('获取位置失败');
        console.error(error);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>当前位置</Text>
      <Text style={{ marginTop: 10, fontSize: 16 }}>{address}</Text>
    </View>
  );
}
```

## 