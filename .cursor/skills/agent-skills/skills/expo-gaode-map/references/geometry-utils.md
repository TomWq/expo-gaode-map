# 几何计算工具 (Geometry Utilities)

`expo-gaode-map` 提供了基于原生 SDK 的高性能几何计算 API，用于处理坐标转换、距离计算、空间关系判断以及轨迹处理。

## 快速模式

### ✅ 正确：使用 C++ 引擎进行大批量计算
```ts
// 当处理超过 1000 个点的轨迹时，务必使用原生简化 API
const simplified = ExpoGaodeMapModule.simplifyPolyline(hugePath, 1.0);
```

### ✅ 正确：处理多边形空洞
```ts
// 传递二维数组表示带孔多边形
const area = ExpoGaodeMapModule.calculatePolygonArea([
  outerRing, // 外环
  innerHole1, // 第一个孔
  innerHole2  // 第二个孔
]);
```

### ❌ 错误：在 JS 层手动计算距离
```ts
// ❌ 错误：JS 层计算未考虑地球曲率且性能较差
const dist = Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + ...);

// ✅ 正确：使用原生 API
const dist = ExpoGaodeMapModule.distanceBetweenCoordinates(p1, p2);
```

## 核心 API

### 坐标转换 (Coordinate Conversion)

将非 GCJ-02 坐标系（如 GPS、百度）转换为高德地图标准的 GCJ-02 坐标系。

```ts
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const converted = await ExpoGaodeMapModule.coordinateConvert({
  latitude: 39.9,
  longitude: 116.4
}, 0); // 0: GPS (WGS-84), 1: BAIDU (BD-09), 2: MAPBAR, 3: MAPABC, 4: SOSOMAP, 5: ALIYUN, 6: GOOGLE
```

### 距离与面积计算

在原生层进行精确的地球曲面计算。

```ts
// 1. 两点间距离 (米)
const distance = ExpoGaodeMapModule.distanceBetweenCoordinates(p1, p2);

// 2. 计算路径总长度 (米)
const length = ExpoGaodeMapModule.calculatePathLength([p1, p2, p3]);

// 3. 计算多边形面积 (平方米)
// 支持嵌套数组表示空洞
const area = ExpoGaodeMapModule.calculatePolygonArea([p1, p2, p3, p4]);

// 4. 计算矩形面积 (平方米)
const rectArea = ExpoGaodeMapModule.calculateRectangleArea(southWest, northEast);

// 5. 生成网格聚合数据 (Grid Aggregation)
// 将大量散点按网格聚合，常用于展示网格聚合图或处理大规模点数据
const grid = ExpoGaodeMapModule.generateHeatmapGrid(points, 500); // 500米网格
// 返回: Array<{ latitude, longitude, intensity }>

// 6. 计算路径边界和中心点 (Zoom to span)
const bounds = ExpoGaodeMapModule.calculatePathBounds(path);
// 返回: { north, south, east, west, center: { latitude, longitude } }
```

### 空间关系判断

判断点与几何形状的位置关系。

```ts
// 1. 点是否在圆内
const inCircle = ExpoGaodeMapModule.isPointInCircle(point, center, radius);

// 2. 点是否在多边形内
// polygon 支持 LatLngPoint[] 或 LatLngPoint[][] (处理空洞)
const inPolygon = ExpoGaodeMapModule.isPointInPolygon(point, polygon);
```

### 轨迹处理工具

用于平滑、简化或分析地图轨迹。

```ts
// 1. 轨迹抽稀 (RDP 算法)
// tolerance: 允许误差(米)，值越大抽稀越明显
const simplified = ExpoGaodeMapModule.simplifyPolyline(points, 2.0);

// 2. 获取路径上距离目标点最近的点
const nearest = ExpoGaodeMapModule.getNearestPointOnPath(path, target);
// 返回: { latitude, longitude, index, distanceMeters }

// 3. 获取路径上指定距离的点 (常用于平滑移动动画)
const pointInfo = ExpoGaodeMapModule.getPointAtDistance(path, 500); 
// 返回: { latitude, longitude, angle } (angle 为切线角度)

// 4. 计算多边形质心
const centroid = ExpoGaodeMapModule.calculateCentroid(polygon);

// 5. 解析高德原始 Polyline 字符串
const points = ExpoGaodeMapModule.parsePolyline("116.4,39.9;116.5,40.0");
```

### 编码工具

```ts
// GeoHash 编码
const hash = ExpoGaodeMapModule.encodeGeoHash({ latitude: 39.9, longitude: 116.4 }, 10);
```

## 性能建议

1. **优先使用原生 API**: 对于涉及大量坐标或复杂计算（如轨迹抽稀、面积计算），原生 API 的性能远高于 JS 层的库。
2. **异步转换**: `coordinateConvert` 是异步的（Promise），适合处理少量单次转换；如果需要批量转换，建议在数据准备阶段处理。
3. **轨迹简化**: 在渲染上万个点的折线前，务必先使用 `simplifyPolyline` 进行抽稀，以减少渲染压力。

## 常见陷阱

- **坐标系**: 高德地图 SDK 内部始终使用 **GCJ-02**。传入任何计算 API 的点都应确保是 GCJ-02 坐标。
- **多边形空洞**: `isPointInPolygon` 和 `calculatePolygonArea` 支持嵌套数组（`LatLngPoint[][]`）。第一个子数组应为外环，后续子数组为内环（空洞）。
