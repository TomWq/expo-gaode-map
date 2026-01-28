# 核心参考: 原生搜索 (Search)

提供 POI 搜索（关键字、周边、沿途、多边形）、输入提示及逆地理编码服务。

## 快速参考

### POI 搜索 (searchPOI)
```ts
import { searchPOI } from 'expo-gaode-map-search';

const result = await searchPOI({
  keyword: '酒店',
  city: '北京', // 建议使用 cityCode (如 '010') 提高准确性
  pageSize: 20,
  types: '050000|060000' // 多类型过滤
});

console.log(`Found ${result.total} items`);
result.pois.forEach(poi => console.log(poi.name, poi.address));
```

### 周边搜索 (searchNearby)
```ts
import { searchNearby } from 'expo-gaode-map-search';

const result = await searchNearby({
  keyword: '餐厅',
  center: { latitude: 39.9, longitude: 116.4 },
  radius: 2000 // 米
});
```

### 沿途搜索 (searchAlong)
```ts
import { searchAlong } from 'expo-gaode-map-search';

const result = await searchAlong({
  keyword: '加油站',
  polyline: [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
  ],
  range: 500, // 偏移范围（米）
});
```

### 多边形搜索 (searchPolygon)
```ts
import { searchPolygon } from 'expo-gaode-map-search';

const result = await searchPolygon({
  keyword: '学校',
  polygon: [
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.4 },
    { latitude: 39.91, longitude: 116.41 },
  ],
});
```

### 输入提示 (getInputTips)
```ts
import { getInputTips } from 'expo-gaode-map-search';

const result = await getInputTips({
  keyword: '肯德基',
  city: '北京'
});

result.tips.forEach(tip => console.log(tip.name, tip.district));
```

### 逆地理编码 (reGeocode)
```ts
import { reGeocode } from 'expo-gaode-map-search';

const result = await reGeocode({
  location: { latitude: 39.9, longitude: 116.4 },
  radius: 1000,
  requireExtension: true // 开启扩展信息 (商圈、道路、AOI)
});

console.log(result.formattedAddress);
console.log(result.aois); // 兴趣区域
```

## 深度挖掘

### POI 类型 (Types)
可以使用高德定义的类型编码（如 `050100` 表示中餐厅）进行过滤。多个类型可以用 `|` 分隔。

### 逆地理编码扩展 (requireExtension)
如果设置为 `true`，结果将包含更详细的商圈信息、道路列表及 AOI（兴趣区域）信息。

### 常见陷阱
1. **配额限制**: 高德搜索 API 有每日调用次数和并发限制。
2. **坐标偏转**: 搜索返回的坐标和输入的坐标均应为 GCJ-02 坐标系。
3. **空结果处理**: 务必检查 `result.pois.length`，并做好 `try-catch` 处理异常。
