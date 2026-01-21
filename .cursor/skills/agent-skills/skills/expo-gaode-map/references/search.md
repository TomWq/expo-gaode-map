---
title: Search
impact: HIGH
tags: search, poi, geocoding, input-tips, nearby-search
---

# Skill: Search

提供 POI 搜索（关键字、周边、沿途、多边形）、输入提示及逆地理编码服务。

## 快速参考

### POI 搜索 (searchPOI)
```ts
import { searchPOI } from 'expo-gaode-map-search';

const result = await searchPOI({
  keyword: '酒店',
  city: '北京',
  pageSize: 20,
  pageNum: 1
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
  requireExtension: true
});

console.log(result.formattedAddress);
```

## 快速模式

### ✅ 正确：在搜索前初始化
```ts
import { initSearch } from 'expo-gaode-map-search';

// 可选：提前调用以检测 API Key 配置问题
initSearch();
```

### ✅ 正确：使用城市编码提高准确性
```ts
// 相比使用 "北京"，使用 "010" 能更准确地锁定区域
const result = await searchPOI({
  keyword: '银行',
  city: '010'
});
```

### ❌ 错误：不处理搜索空结果
搜索可能返回 0 个结果或抛出异常（如网络问题、API Key 无效），务必使用 try-catch 并检查 `result.pois.length`。

## 何时使用

- 实现搜索框的自动完成（输入提示）。
- 查找用户当前位置附近的设施（周边搜索）。
- 将地图点击的坐标转换为具体的街道地址（逆地理编码）。
- 沿着导航路线查找加油站或充电桩（沿途搜索）。

## 深度挖掘

### POI 类型 (Types)
可以使用高德定义的类型编码（如 `050100` 表示中餐厅）进行过滤。多个类型可以用 `|` 分隔。

### 逆地理编码扩展 (requireExtension)
如果设置为 `true`，结果将包含更详细的商圈信息、道路列表及 AOI（兴趣区域）信息。

### 常见陷阱
1. **配额限制**: 高德搜索 API 有每日调用次数和并发限制，高频调用需注意频率控制。
2. **坐标偏转**: 搜索返回的坐标和输入的坐标均应为 GCJ-02 坐标系。
3. **城市限制**: 关键字搜索如果不传 `city`，则在全国范围内搜索，结果可能包含非预期城市的 POI。
