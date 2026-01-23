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

## 3. ExpoGaodeMapModule (定位与工具)

- `initSDK({ androidKey, iosKey, webKey })`: 初始化
- `getCurrentLocation()`: 单次定位
- `start()` / `stop()`: 持续定位控制
- `calculateDistance(p1, p2)`: 计算距离
