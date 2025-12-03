# expo-gaode-map-search

高德地图搜索功能模块，提供 POI 搜索、周边搜索、沿途搜索、多边形搜索和输入提示功能。

## 安装

```bash
npm install expo-gaode-map-search
# 或
pnpm add expo-gaode-map-search
```

**前置依赖：**
- `expo-gaode-map` >= 2.0.0

## 功能特性

- ✅ POI 关键词搜索
- ✅ 周边搜索
- ✅ 沿途搜索
- ✅ 多边形区域搜索
- ✅ 输入提示（自动补全）
- ✅ 支持分页
- ✅ 支持类型过滤
- ✅ 完整的 TypeScript 类型定义

## 基本用法

### POI 搜索

```typescript
import { searchPOI } from 'expo-gaode-map-search';

const result = await searchPOI({
  keyword: '酒店',
  city: '北京',
  pageSize: 20,
  pageNum: 1,
});

console.log('找到', result.total, '个结果');
result.pois.forEach(poi => {
  console.log(poi.name, poi.address);
});
```

### 周边搜索

```typescript
import { searchNearby } from 'expo-gaode-map-search';

const result = await searchNearby({
  keyword: '餐厅',
  center: { latitude: 39.9, longitude: 116.4 },
  radius: 1000, // 1公里
});
```

### 沿途搜索

```typescript
import { searchAlong } from 'expo-gaode-map-search';

const result = await searchAlong({
  keyword: '加油站',
  polyline: [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
    { latitude: 39.92, longitude: 116.42 },
  ],
  range: 500,
});
```

### 多边形搜索

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
});
```

### 输入提示

```typescript
import { getInputTips } from 'expo-gaode-map-search';

const result = await getInputTips({
  keyword: '天安门',
  city: '北京',
});

result.tips.forEach(tip => {
  console.log(tip.name, tip.address);
});
```

## API 文档

### searchPOI(options)

POI 关键词搜索。

**参数：**
- `keyword` (string, 必需): 搜索关键词
- `city` (string, 可选): 城市名称或城市编码
- `types` (string, 可选): POI 类型，多个类型用 | 分隔
- `pageSize` (number, 可选): 每页记录数，默认 20，最大 50
- `pageNum` (number, 可选): 当前页码，从 1 开始
- `sortByDistance` (boolean, 可选): 是否按距离排序
- `center` (Coordinates, 可选): 中心点坐标

**返回：** `Promise<SearchResult>`

### searchNearby(options)

周边搜索。

**参数：**
- `keyword` (string, 必需): 搜索关键词
- `center` (Coordinates, 必需): 中心点坐标
- `radius` (number, 可选): 搜索半径（米），默认 1000，最大 50000
- `types` (string, 可选): POI 类型
- `pageSize` (number, 可选): 每页记录数
- `pageNum` (number, 可选): 当前页码

**返回：** `Promise<SearchResult>`

### searchAlong(options)

沿途搜索。

**参数：**
- `keyword` (string, 必需): 搜索关键词
- `polyline` (Coordinates[], 必需): 路线坐标点数组
- `range` (number, 可选): 搜索范围（米），默认 500，最大 1000
- `types` (string, 可选): POI 类型

**返回：** `Promise<SearchResult>`

### searchPolygon(options)

多边形区域搜索。

**参数：**
- `keyword` (string, 必需): 搜索关键词
- `polygon` (Coordinates[], 必需): 多边形顶点坐标数组
- `types` (string, 可选): POI 类型
- `pageSize` (number, 可选): 每页记录数
- `pageNum` (number, 可选): 当前页码

**返回：** `Promise<SearchResult>`

### getInputTips(options)

输入提示（自动补全）。

**参数：**
- `keyword` (string, 必需): 关键词
- `city` (string, 可选): 城市名称或城市编码
- `types` (string, 可选): POI 类型

**返回：** `Promise<InputTipsResult>`

## 类型定义

### Coordinates

```typescript
interface Coordinates {
  latitude: number;
  longitude: number;
}
```

### POI

```typescript
interface POI {
  id: string;
  name: string;
  address: string;
  location: Coordinates;
  typeCode: string;
  typeDes: string;
  tel?: string;
  distance?: number;
  cityName?: string;
  cityCode?: string;
  provinceName?: string;
  adName?: string;
  adCode?: string;
}
```

### SearchResult

```typescript
interface SearchResult {
  pois: POI[];
  total: number;
  pageNum: number;
  pageSize: number;
  pageCount: number;
}
```

### InputTip

```typescript
interface InputTip {
  id: string;
  name: string;
  address: string;
  location?: Coordinates;
  typeCode?: string;
  cityName?: string;
  adName?: string;
}
```

### InputTipsResult

```typescript
interface InputTipsResult {
  tips: InputTip[];
}
```

## POI 类型码

常用 POI 类型码（types 参数）：

- `050000` - 餐饮服务
- `060000` - 购物服务
- `070000` - 生活服务
- `080000` - 体育休闲服务
- `090000` - 医疗保健服务
- `100000` - 住宿服务
- `110000` - 风景名胜
- `120000` - 商务住宅
- `130000` - 政府机构及社会团体
- `140000` - 科教文化服务
- `150000` - 交通设施服务
- `160000` - 金融保险服务
- `170000` - 公司企业
- `180000` - 道路附属设施
- `190000` - 地名地址信息
- `200000` - 公共设施

详细类型码请参考：https://lbs.amap.com/api/webservice/guide/api/search#poi_typecode

## 注意事项

1. **需要初始化核心包**：使用搜索功能前，需要先初始化 `expo-gaode-map` 核心包
2. **API 调用限制**：请遵守高德地图 API 调用限制
3. **坐标系统**：使用的是高德坐标系（GCJ-02）
4. **错误处理**：建议使用 try-catch 处理搜索错误

## 完整示例

```typescript
import { useEffect, useState } from 'react';
import { View, TextInput, FlatList, Text } from 'react-native';
import { ExpoGaodeMapModule } from 'expo-gaode-map';
import { searchPOI, getInputTips, type POI, type InputTip } from 'expo-gaode-map-search';

export default function SearchScreen() {
  const [keyword, setKeyword] = useState('');
  const [tips, setTips] = useState<InputTip[]>([]);
  const [pois, setPois] = useState<POI[]>([]);

  useEffect(() => {
    // 初始化核心包
    ExpoGaodeMapModule.initSDK({
      androidKey: 'your-android-key',
      iosKey: 'your-ios-key',
    });
  }, []);

  // 输入提示
  const handleInputChange = async (text: string) => {
    setKeyword(text);
    
    if (text.length > 1) {
      try {
        const result = await getInputTips({
          keyword: text,
          city: '北京',
        });
        setTips(result.tips);
      } catch (error) {
        console.error('输入提示失败:', error);
      }
    }
  };

  // 搜索
  const handleSearch = async () => {
    try {
      const result = await searchPOI({
        keyword,
        city: '北京',
        pageSize: 20,
      });
      setPois(result.pois);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  return (
    <View>
      <TextInput
        value={keyword}
        onChangeText={handleInputChange}
        onSubmitEditing={handleSearch}
        placeholder="搜索地点"
      />
      
      <FlatList
        data={pois}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.address}</Text>
          </View>
        )}
      />
    </View>
  );
}
```

## 许可证

MIT

## 相关链接

- [expo-gaode-map](https://github.com/TomWq/expo-gaode-map)
- [高德地图搜索 API 文档](https://lbs.amap.com/api/android-sdk/guide/map-data/poi)