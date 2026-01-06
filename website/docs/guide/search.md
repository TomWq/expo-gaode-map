# 搜索功能

`expo-gaode-map-search` 提供了高德地图的搜索功能，包括 POI 搜索、周边搜索、沿途搜索等。

## 安装

搜索功能是**可选的**，需要单独安装：

```bash
bun add expo-gaode-map-search
# 或
yarn add expo-gaode-map-search
# 或
npm install expo-gaode-map-search
```

::: tip 提示
搜索包依赖核心包 `expo-gaode-map`，请确保已安装核心包。
:::

## 配置

搜索功能使用与核心包相同的 API Key，无需额外配置。

### 使用 Config Plugin（推荐）

在 `app.json` 中配置核心包即可：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "iosKey": "your-ios-api-key",
          "androidKey": "your-android-api-key"
        }
      ]
    ]
  }
}
```

### 手动初始化

如果不使用 Config Plugin，需要手动初始化：

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 使用 Config Plugin 时，原生 Key 已自动配置
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // 仅在使用 Web API 时需要
});

// 不使用 Config Plugin 时
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
  webKey: 'your-web-api-key', // 可选
});
```

## API 参考

### POI 搜索

搜索指定关键词的地点：

```typescript
import { searchPOI } from 'expo-gaode-map-search';

const result = await searchPOI({
  keyword: '酒店',
  city: '北京',
  types: '100000',  // POI 类型代码
  pageSize: 20,
  pageNum: 1,
});

console.log('找到', result.total, '个结果');
result.pois.forEach(poi => {
  console.log(poi.name, poi.address);
  console.log('位置:', poi.location);
});
```

### 周边搜索

搜索指定位置周边的地点：

```typescript
import { searchNearby } from 'expo-gaode-map-search';

const result = await searchNearby({
  keyword: '餐厅',
  center: { latitude: 39.9, longitude: 116.4 },
  radius: 1000,  // 搜索半径（米）
  types: '050000',
  pageSize: 20,
});

result.pois.forEach(poi => {
  console.log(poi.name, '距离:', poi.distance, '米');
});
```

### 沿途搜索

搜索路线沿途的特定地点（如加油站、ATM）：

```typescript
import { searchAlong } from 'expo-gaode-map-search';

const result = await searchAlong({
  keyword: '加油站',  // 支持：加油站、ATM、汽修、厕所
  polyline: [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.92, longitude: 116.42 },
  ],
  range: 500,  // 搜索范围（米）
});
```

::: tip iOS 支持的沿途搜索类型
- 加油站（关键词：加油、加油站）
- ATM（关键词：atm、银行）
- 汽修（关键词：汽修、维修）
- 厕所（关键词：厕所、卫生间）
:::

### 多边形搜索

在指定多边形区域内搜索：

```typescript
import { searchPolygon } from 'expo-gaode-map-search';

const result = await searchPolygon({
  keyword: '学校',
  polygon: [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.9, longitude: 116.41 },
  ],
  types: '141200',
  pageSize: 20,
});
```

### 输入提示

获取关键词的自动补全建议：

```typescript
import { getInputTips } from 'expo-gaode-map-search';

const result = await getInputTips({
  keyword: '天安门',
  city: '北京',
  types: '010000|050000',  // 多个类型用 | 分隔
});

result.tips.forEach(tip => {
  console.log(tip.name);
  console.log('地址:', tip.address);
  if (tip.location) {
    console.log('位置:', tip.location);
  }
});
```

## 类型定义

### POI（地点）

```typescript
interface POI {
  id: string;              // POI ID
  name: string;            // 名称
  address: string;         // 地址
  location: {              // 位置
    latitude: number;
    longitude: number;
  };
  typeCode: string;        // 类型代码
  typeDes: string;         // 类型描述
  tel?: string;            // 电话
  distance?: number;       // 距离（米）
  cityName?: string;       // 城市
  provinceName?: string;   // 省份
  adName?: string;         // 区域
  adCode?: string;         // 区域代码
}
```

### 搜索结果

```typescript
interface SearchResult {
  pois: POI[];             // POI 列表
  total: number;           // 总数
  pageNum: number;         // 当前页码
  pageSize: number;        // 每页数量
  pageCount: number;       // 总页数
}
```

## 完整示例

```typescript
import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map';
import { searchPOI, type POI } from 'expo-gaode-map-search';

export default function SearchScreen() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<POI[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);

  const handleSearch = async () => {
    try {
      const result = await searchPOI({
        keyword,
        city: '北京',
        pageSize: 10,
      });
      setResults(result.pois);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 10 }}>
        <TextInput
          value={keyword}
          onChangeText={setKeyword}
          placeholder="输入关键词搜索"
          onSubmitEditing={handleSearch}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            padding: 10,
            borderRadius: 5,
          }}
        />
      </View>

      <View style={{ flex: 1 }}>
        <MapView
          style={{ flex: 1 }}
          initialCameraPosition={{
            target: selectedPOI?.location || { latitude: 39.9, longitude: 116.4 },
            zoom: selectedPOI ? 15 : 10,
          }}
        >
          {results.map((poi) => (
            <Marker
              key={poi.id}
              position={poi.location}
              title={poi.name}
              onPress={() => setSelectedPOI(poi)}
            />
          ))}
        </MapView>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: 200 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedPOI(item)}
            style={{
              padding: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#eee',
              backgroundColor: selectedPOI?.id === item.id ? '#f0f0f0' : 'white',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
            <Text style={{ color: '#666', marginTop: 5 }}>{item.address}</Text>
            {item.distance && (
              <Text style={{ color: '#999', marginTop: 5 }}>
                距离: {item.distance} 米
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
```

## POI 类型代码

常用的 POI 类型代码：

| 类型 | 代码 | 说明 |
|------|------|------|
| 汽车服务 | 010000 | 加油站、停车场等 |
| 汽车销售 | 020000 | 4S店、汽车配件等 |
| 汽车维修 | 030000 | 汽修厂、洗车店等 |
| 摩托车服务 | 040000 | 摩托车销售维修等 |
| 餐饮服务 | 050000 | 餐厅、快餐等 |
| 购物服务 | 060000 | 超市、商场等 |
| 生活服务 | 070000 | 美发、洗衣等 |
| 体育休闲服务 | 080000 | 运动场馆等 |
| 医疗保健服务 | 090000 | 医院、诊所等 |
| 住宿服务 | 100000 | 酒店、宾馆等 |
| 风景名胜 | 110000 | 公园、景区等 |
| 商务住宅 | 120000 | 写字楼、小区等 |
| 政府机构 | 130000 | 政府部门等 |
| 科教文化 | 140000 | 学校、图书馆等 |
| 交通设施 | 150000 | 地铁、机场等 |
| 金融保险 | 160000 | 银行、ATM等 |
| 公司企业 | 170000 | 公司、工厂等 |

完整列表请参考 [高德地图 POI 分类编码](https://lbs.amap.com/api/webservice/download)。

## 常见问题

### 搜索结果为空？

1. 检查关键词是否正确
2. 检查城市参数是否正确
3. 尝试扩大搜索范围或调整类型代码

### iOS 报错 "API Key 未设置"？

1. 确保使用了 Config Plugin 配置 `iosKey`
2. 或者在代码中调用 `ExpoGaodeMapModule.initSDK()`
3. 重新构建原生代码：`npx expo prebuild --clean`

### Android 搜索功能正常，iOS 不工作？

1. 检查是否安装了 `AMapSearchKit` Pod
2. 运行 `cd ios && pod install`
3. 检查 Xcode 项目是否正确链接了搜索框架

## 相关文档

- [快速开始](/guide/getting-started) - 基础使用
- [架构说明](/guide/architecture) - Monorepo 架构
- [API 文档](/api/) - 完整 API 参考