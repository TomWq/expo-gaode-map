# 核心地图 API 参考

## 1. ExpoGaodeMapView (地图视图)

**源文件**: `packages/core/src/ExpoGaodeMapView.tsx`

### 主要 Props
| 属性名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `mapType` | `MapType` | Standard, Satellite, Night, Navi, Bus |
| `myLocationEnabled` | `boolean` | 是否显示定位蓝点 |
| `trafficEnabled` | `boolean` | 是否显示路况 |
| `initialCameraPosition` | `CameraPosition` | `{ target, zoom, tilt, bearing }` |

### 方法 (Ref)
- `moveCamera(position, duration)`: 移动相机
- `setZoom(zoom, animated)`: 设置缩放

## 2. 覆盖物组件

### Marker (标记)
- `position`: `LatLngPoint` (必填)
- `icon`: 自定义图标
- `title`/`snippet`: 气泡内容

### Cluster (点聚合)
- **高性能**: 底层使用 C++ QuadTree 引擎。
- `points`: `ClusterPoint[]` (数据源)
- `renderMarker`: `(point) => ReactNode` (渲染函数)

## 3. ExpoGaodeMapModule (定位与高性能工具)

### 基础功能
- `initSDK({ androidKey, iosKey, webKey })`: 初始化 SDK。
- `getCurrentLocation()`: 获取当前位置。
- `start()` / `stop()`: 开启/停止持续定位。
- `getVersion()`: 获取 SDK 版本。

### 高性能几何计算 (C++ 引擎驱动)
**核心原则**：所有复杂的地理运算应调用以下原生方法，严禁在 JS 层手写算法。

| 方法名 | 参数 | 说明 |
| :--- | :--- | :--- |
| `distanceBetweenCoordinates` | `(p1, p2)` | 计算两点间距离 (米) |
| `getNearestPointOnPath` | `(path, target)` | 获取路径上距离目标点最近的点 (吸附/纠偏) |
| `simplifyPolyline` | `(points, tolerance)` | 轨迹抽稀 (RDP 算法)，`tolerance` 为米 |
| `calculatePathLength` | `(points)` | 计算路径总长度 (米) |
| `isPointInPolygon` | `(point, polygon)` | 判断点是否在多边形内 |
| `isPointInCircle` | `(point, center, radius)`| 判断点是否在圆内 |
| `calculatePolygonArea` | `(polygon)` | 计算多边形面积 (平方米) |
| `calculateCentroid` | `(polygon)` | 计算多边形质心 |
| `getPointAtDistance` | `(path, distance)` | 获取路径上指定距离处的点 (插值) |
| `encodeGeoHash` | `(point, precision)` | 生成 GeoHash 字符串 |

### 坐标转换
- `coordinateConvert(point, type)`: 转换其他坐标系 (WGS84, Baidu) 到 GCJ-02。
- `latLngToTile(point, zoom)`: 经纬度转瓦片坐标。
- `latLngToPixel(point, zoom)`: 经纬度转像素坐标。
- `parsePolyline(str)`: 解析高德原始 Polyline 字符串。
