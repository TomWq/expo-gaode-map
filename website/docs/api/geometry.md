# 几何计算 API

完整的几何计算工具 API 文档。

> 💡 **提示**: 几何计算 API 用于处理地图上的距离、面积和点位关系计算,支持多种实用场景,由 C++ 实现。

## API 列表

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `distanceBetweenCoordinates` | `from: LatLng, to: LatLng` | `number` | 计算两点距离(米) |
| `calculatePolygonArea` | `coordinates: LatLng[]` | `number` | 计算多边形面积(平方米) |
| `calculateRectangleArea` | `southWest: LatLng, northEast: LatLng` | `number` | 计算矩形面积(平方米) |
| `isPointInPolygon` | `point: LatLng, polygon: LatLng[]` | `boolean` | 判断点是否在多边形内 |
| `isPointInCircle` | `point: LatLng, center: LatLng, radius: number` | `boolean` | 判断点是否在圆内 |
| `calculateCentroid` | `polygon: LatLng[] | LatLng[][]` | `LatLng | null` | 计算多边形质心 |
| `calculatePathBounds` | `points: LatLng[]` | `object | null` | 计算路径边界和中心点 |
| `encodeGeoHash` | `coordinate: LatLng, precision: number` | `string` | GeoHash 编码 |
| `simplifyPolyline` | `points: LatLng[], tolerance: number` | `LatLng[]` | 轨迹抽稀 (RDP 算法) |
| `calculatePathLength` | `points: LatLng[]` | `number` | 计算路径总长度 |
| `calculateFitZoom` | `points: LatLng[], options?: FitZoomOptions` | `number` | 根据点集与视口估算推荐缩放级别 |
| `getNearestPointOnPath` | `path: LatLng[], target: LatLng` | `object \| null` | 获取路径上距离目标点最近的点 |
| `getPointAtDistance` | `points: LatLng[], distance: number` | `object \| null` | 获取路径上指定距离的点 |
| `parsePolyline` | `polylineStr: string` | `LatLng[]` | 解析高德原始 Polyline 字符串 |
| `latLngToTile` | `coordinate: LatLng, zoom: number` | `object` | 经纬度转瓦片坐标 (x, y, z) |
| `tileToLatLng` | `tile: {x, y, z}` | `LatLng` | 瓦片坐标转经纬度 |
| `findPointInPolygons` | `point: LatLng, polygons: LatLng[][]` | `number` | 批量地理围栏检测 |
| `generateHeatmapGrid` | `points: LatLng[], gridSize: number` | `object[]` | 生成热力图聚合网格 |

## 瓦片与像素转换

### latLngToTile

将地理坐标转换为指定缩放级别下的瓦片坐标。

```tsx
const tile = ExpoGaodeMapModule.latLngToTile(
  { latitude: 39.9, longitude: 116.4 },
  15
);
// tile: { x: 26981, y: 12415, z: 15 }
```

### tileToLatLng

将瓦片坐标转换为对应的地理坐标（瓦片左上角）。

### latLngToPixel

将地理坐标转换为指定缩放级别下的世界像素坐标。

## 批量地理围栏

### findPointInPolygons

检测一个点是否在多个多边形中的某一个内部。相比循环调用 `isPointInPolygon`，该方法在 C++ 层进行了批量处理，性能更优。

```tsx
const polygons = [polygon1, polygon2, polygon3];
const index = ExpoGaodeMapModule.findPointInPolygons(point, polygons);
if (index !== -1) {
  console.log(`点在第 ${index} 个多边形内`);
}
```

## 热力图处理

### generateHeatmapGrid

将大量离散点聚合为指定大小的网格点，用于自定义热力图绘制或数据分析。

```tsx
const points = [
  { latitude: 39.9, longitude: 116.4, weight: 1.5 },
  { latitude: 39.901, longitude: 116.401, weight: 2.0 },
  // ... 更多点
];

const grid = ExpoGaodeMapModule.generateHeatmapGrid(points, 50); // 50米网格
// grid: [{ latitude, longitude, intensity }, ...]
```

## 距离计算

计算两个坐标点之间的直线距离。

```tsx
import { ExpoGaodeMapModule } from '@gaomap/core';

const distance = ExpoGaodeMapModule.distanceBetweenCoordinates(
  { latitude: 39.90923, longitude: 116.397428 }, // 天安门
  { latitude: 39.916527, longitude: 116.397545 }  // 故宫
);
console.log(`距离: ${distance.toFixed(2)} 米`);
// 输出: 距离: 823.45 米
```

**参数说明**:
- `from`: 起始坐标点 `{ latitude: number, longitude: number }`
- `to`: 目标坐标点 `{ latitude: number, longitude: number }`

**返回值**: `number` - 两点之间的距离(单位:米)

## 面积计算

### calculatePolygonArea

计算任意多边形的面积,支持三角形、四边形及更复杂的多边形。

```tsx
// 计算不规则四边形面积
const area = ExpoGaodeMapModule.calculatePolygonArea([
  { latitude: 39.923, longitude: 116.391 },  // 西北角
  { latitude: 39.923, longitude: 116.424 },  // 东北角
  { latitude: 39.886, longitude: 116.424 },  // 东南角
  { latitude: 39.886, longitude: 116.391 },  // 西南角
]);
console.log(`面积: ${(area / 1000000).toFixed(2)} 平方公里`);
// 输出: 面积: 13.51 平方公里

// 计算三角形面积
const triangleArea = ExpoGaodeMapModule.calculatePolygonArea([
  { latitude: 39.923, longitude: 116.391 },
  { latitude: 39.923, longitude: 116.424 },
  { latitude: 39.886, longitude: 116.408 },
]);
```

**参数说明**:
- `coordinates`: 多边形顶点坐标数组(至少3个点)
  - 按顺时针或逆时针顺序排列
  - 自动闭合,无需重复第一个点

**返回值**: `number` - 多边形面积(单位:平方米)

### calculateRectangleArea

计算矩形面积的优化方法,比 `calculatePolygonArea` 更简单快捷。

```tsx
const area = ExpoGaodeMapModule.calculateRectangleArea(
  { latitude: 39.886, longitude: 116.391 },  // 西南角
  { latitude: 39.923, longitude: 116.424 }   // 东北角
);
console.log(`矩形面积: ${(area / 1000000).toFixed(2)} 平方公里`);
// 输出: 矩形面积: 13.51 平方公里
```

**参数说明**:
- `southWest`: 矩形西南角坐标
- `northEast`: 矩形东北角坐标

**返回值**: `number` - 矩形面积(单位:平方米)

## 空间关系判断

### isPointInPolygon

判断一个点是否在多边形区域内部。

```tsx
// 定义多边形区域
const polygon = [
  { latitude: 39.923, longitude: 116.391 },
  { latitude: 39.923, longitude: 116.424 },
  { latitude: 39.886, longitude: 116.424 },
  { latitude: 39.886, longitude: 116.391 },
];

// 检测点是否在区域内
const point1 = { latitude: 39.9, longitude: 116.4 };
const isInside1 = ExpoGaodeMapModule.isPointInPolygon(point1, polygon);
console.log(`点 (39.9, 116.4) 是否在区域内: ${isInside1}`);
// 输出: 点 (39.9, 116.4) 是否在区域内: true

// 检测区域外的点
const point2 = { latitude: 40.0, longitude: 117.0 };
const isInside2 = ExpoGaodeMapModule.isPointInPolygon(point2, polygon);
console.log(`点 (40.0, 117.0) 是否在区域内: ${isInside2}`);
// 输出: 点 (40.0, 117.0) 是否在区域内: false
```

**参数说明**:
- `point`: 要检测的坐标点
- `polygon`: 多边形顶点坐标数组

**返回值**: `boolean` - `true` 表示点在多边形内,`false` 表示不在

### isPointInCircle

判断一个点是否在圆形区域内。

```tsx
// 定义圆形区域(圆心在天安门,半径1000米)
const center = { latitude: 39.90923, longitude: 116.397428 };
const radius = 1000; // 1公里

// 检测故宫是否在1公里范围内
const gugong = { latitude: 39.916527, longitude: 116.397545 };
const isNearby = ExpoGaodeMapModule.isPointInCircle(gugong, center, radius);
console.log(`故宫是否在1公里范围内: ${isNearby}`);
// 输出: 故宫是否在1公里范围内: true
```

**参数说明**:
- `point`: 要检测的坐标点
- `center`: 圆心坐标
- `radius`: 半径(单位:米)

**返回值**: `boolean` - `true` 表示点在圆内,`false` 表示不在

## 路径分析

### calculatePathBounds

计算一组坐标点的最小外接矩形（边界）和中心点。常用于地图自动缩放以适应路径（Zoom to span）。

```tsx
const points = [
  { latitude: 39.9, longitude: 116.3 },
  { latitude: 39.91, longitude: 116.4 },
  { latitude: 39.88, longitude: 116.35 },
];

const bounds = ExpoGaodeMapModule.calculatePathBounds(points);

if (bounds) {
  console.log('边界:', {
    north: bounds.north, // 北纬
    south: bounds.south, // 南纬
    east: bounds.east,   // 东经
    west: bounds.west    // 西经
  });
  console.log('中心点:', bounds.center);
}
```

**参数说明**:
- `points`: 坐标点数组

**返回值**: `object | null` - 包含 `north`, `south`, `east`, `west` 边界值和 `center` 中心点。

### calculateFitZoom

根据一组坐标点和当前视口尺寸，计算“可以同时看到所有点”的推荐缩放级别（zoom）。

```tsx
const points = [
  { latitude: 39.9042, longitude: 116.4074 }, // 北京
  { latitude: 39.91407, longitude: 116.39765 }, // 故宫午门
  { latitude: 39.92541, longitude: 116.39707 }, // 景山
];

const zoom = ExpoGaodeMapModule.calculateFitZoom(points, {
  viewportWidthPx: 390,
  viewportHeightPx: 844,
  paddingPx: 48,
  minZoom: 3,
  maxZoom: 20,
});

console.log('推荐缩放级别:', zoom);
```

**参数说明**:
- `points`: 坐标点数组，建议至少 1 个点
- `options.viewportWidthPx`: 视口宽度（像素），默认 `390`
- `options.viewportHeightPx`: 视口高度（像素），默认 `844`
- `options.paddingPx`: 内边距（像素），默认 `48`
- `options.minZoom`: 最小缩放限制，默认 `3`
- `options.maxZoom`: 最大缩放限制，默认 `20`

**返回值**: `number` - 推荐缩放级别（会被 `minZoom` / `maxZoom` 约束）。

**适用场景**:
- 多景点同时入镜（行程总览）
- 路线规划完成后的自动镜头调整
- 自定义相机动画前的 zoom 预估（可配合 `moveCamera` 使用）

### calculateCentroid

计算多边形的几何质心（Centroid）。

```tsx
const polygon = [
  { latitude: 39.9, longitude: 116.3 },
  { latitude: 39.91, longitude: 116.4 },
  { latitude: 39.88, longitude: 116.35 },
];

const centroid = ExpoGaodeMapModule.calculateCentroid(polygon);
// centroid: { latitude: 39.8966, longitude: 116.35 }
```

**参数说明**:
- `polygon`: 多边形顶点坐标数组

**返回值**: `LatLng | null` - 质心坐标点。

## 数据转换

### parsePolyline

解析高德地图 API 返回的原始 Polyline 字符串。高德路径规划 API（如驾车、步行）返回的 polyline 通常是一个长字符串，格式为 `"经度,纬度;经度,纬度;..."`。此方法可将其高效转换为组件可用的坐标数组。

```tsx
import { ExpoGaodeMapModule } from '@gaomap/core';

const polylineStr = "116.4074,39.9042;116.4191,39.9042";
const points = ExpoGaodeMapModule.parsePolyline(polylineStr);

// points: [{latitude: 39.9042, longitude: 116.4074}, ...]
```

**参数说明**:
- `polylineStr`: 高德原始字符串 `"lng,lat;lng,lat;..."`

**返回值**: `LatLng[]` - 解析后的坐标点数组

## 使用场景

### 1. 距离计算
- 计算用户到目标地点的距离
- 显示附近POI的距离信息
- 路径规划距离估算

### 2. 面积计算
- 计算地块面积(农田、建筑用地等)
- 区域规划面积统计
- 房产面积估算

### 3. 地理围栏
- 判断用户是否进入/离开某个区域
- 检测POI是否在服务范围内
- 区域碰撞检测

### 4. 位置分析
- 分析用户活动范围
- 统计区域内的设施数量
- 热力图数据处理

## 注意事项

1. **坐标系统**: 所有坐标默认使用高德坐标系(GCJ-02)
2. **性能考虑**: 对于复杂多边形(>100个顶点),计算可能需要较长时间
3. **精度问题**: 由于地球曲率,超大范围的计算可能存在误差
4. **边界情况**: 点在多边形边界上时,不同平台可能返回不同结果

## 完整示例

```tsx
import React, { useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { ExpoGaodeMapModule } from '@gaomap/core';

export default function GeometryExample() {
  const [results, setResults] = useState<string[]>([]);

  const runCalculations = () => {
    const newResults: string[] = [];

    // 1. 计算两点距离
    const distance = ExpoGaodeMapModule.distanceBetweenCoordinates(
      { latitude: 39.90923, longitude: 116.397428 },
      { latitude: 39.916527, longitude: 116.397545 }
    );
    newResults.push(`天安门到故宫距离: ${distance.toFixed(2)}米`);

    // 2. 计算多边形面积
    const polygon = [
      { latitude: 39.923, longitude: 116.391 },
      { latitude: 39.923, longitude: 116.424 },
      { latitude: 39.886, longitude: 116.424 },
      { latitude: 39.886, longitude: 116.391 },
    ];
    const polygonArea = ExpoGaodeMapModule.calculatePolygonArea(polygon);
    newResults.push(`多边形面积: ${(polygonArea / 1000000).toFixed(2)}平方公里`);

    // 3. 计算矩形面积
    const rectArea = ExpoGaodeMapModule.calculateRectangleArea(
      { latitude: 39.886, longitude: 116.391 },
      { latitude: 39.923, longitude: 116.424 }
    );
    newResults.push(`矩形面积: ${(rectArea / 1000000).toFixed(2)}平方公里`);

    // 4. 判断点是否在多边形内
    const testPoint = { latitude: 39.9, longitude: 116.4 };
    const isInPolygon = ExpoGaodeMapModule.isPointInPolygon(testPoint, polygon);
    newResults.push(`点(39.9,116.4)在多边形内: ${isInPolygon}`);

    // 5. 判断点是否在圆内
    const center = { latitude: 39.90923, longitude: 116.397428 };
    const isInCircle = ExpoGaodeMapModule.isPointInCircle(
      testPoint,
      center,
      10000 // 10公里
    );
    newResults.push(`点在10公里圆内: ${isInCircle}`);

    setResults(newResults);
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="运行几何计算" onPress={runCalculations} />
      <ScrollView style={{ marginTop: 20 }}>
        {results.map((result, index) => (
          <Text key={index} style={{ marginTop: 10 }}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
```

## 相关文档

- [坐标类型定义](/api/types#latlng)
- [定位 API](/api/location)
- [几何计算示例](/examples/geometry)
