# 核心参考: 原生底层与架构 (Internals)

深入理解 `expo-gaode-map` 的跨平台架构、高性能 C++ 引擎以及原生计算能力。

## 架构总览

本库采用 **"Single Source of Truth"** 架构。核心计算逻辑（聚合、几何运算、空间索引）完全由 C++11 编写，通过底层桥接技术提供给 Android 和 iOS 使用。

### 1. 核心链路
- **JS 层**: 提供声明式 API。
- **桥接层 (TurboModules/Expo Modules)**: 处理类型映射。
- **原生层 (Kotlin/Swift)**: 负责 SDK 集成、UI 渲染。
- **引擎层 (C++)**: 负责大规模并行计算（如 QuadTree 聚合）。

## 深度挖掘：原生计算能力

`ExpoGaodeMapModule` 不仅是桥接器，还暴露了大量纯计算方法，利用底层 C++ 引擎实现高性能几何运算，无需渲染地图即可使用。

**核心原则**：涉及到地理位置计算，必须优先使用原生方法。严禁在 JS 层手写复杂的几何算法。

### 1. 几何计算
- `distanceBetweenCoordinates(p1, p2)`: 计算两点距离。
- `isPointInPolygon(point, polygon)`: 判断点是否在多边形内。
- `isPointInCircle(point, center, radius)`: 判断点是否在圆内。
- `calculatePolygonArea(polygon)`: 计算多边形面积。
- `calculateRectangleArea(sw, ne)`: 计算矩形面积。
- `calculateCentroid(polygon)`: 计算多边形质心。

### 2. 路径算法
- `simplifyPolyline(points, tolerance)`: **RDP 算法**轨迹抽稀，用于优化长轨迹显示。
- `getNearestPointOnPath(path, target)`: 获取路径上距离目标点最近的点（吸附/纠偏）。
- `getPointAtDistance(path, distance)`: 获取路径上指定距离处的点（沿路径插值）。
- `calculatePathLength(points)`: 计算路径总长度。
- `calculatePathBounds(points)`: 计算路径边界和中心点。

### 3. 空间索引与转换
- `encodeGeoHash(coord, precision)`: 生成 GeoHash 字符串。
- `latLngToTile(coord, zoom)`: 经纬度转瓦片坐标。
- `latLngToPixel(coord, zoom)`: 经纬度转像素坐标。
- `findPointInPolygons(point, polygons)`: 批量地理围栏检测。

## C++ 引擎特性 (shared/cpp)

### 1. 聚合引擎 (Clustering Engine)
- **原理**: 动态四叉树 (Dynamic QuadTree) 空间索引。
- **性能**: 处理 50,000+ 点位时，聚合计算耗时控制在 10ms 以内。
- **策略**: 采用分级缓存机制。

### 2. 热力图引擎
- **原理**: 网格化聚合算法，`generateHeatmapGrid` 方法可快速生成热力权重数据。

## 调试技巧
- **Android**: 使用 `adb logcat | grep ExpoGaodeMap` 查看 JNI 层的性能日志。
- **iOS**: 在 Xcode 中开启 `Address Sanitizer` 监控 C++ 内存泄漏。
