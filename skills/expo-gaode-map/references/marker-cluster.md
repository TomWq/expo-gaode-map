---
title: Marker and Clustering
impact: CRITICAL
tags: marker, cluster, quadtree, cpp-engine, icons
---

# 核心参考: Marker 与 聚合 (Clustering)

实现高性能的地图标记 (Marker) 和大规模点聚合 (Clustering)。

## 快速参考

### Marker 核心属性

| 属性 | 类型 | 说明 |
|----------|----------|--------------|
| `position` | `LatLngPoint` | 坐标位置 `{latitude, longitude}` |
| `title` | `string` | 标题，点击显示 Callout |
| `snippet` | `string` | 描述文字，点击显示 Callout |
| `icon` | `string \| ImageSource` | 图标资源 (URL, 本地 asset 或 require) |
| `pinColor` | `string` (Enum) | 大头针颜色 (仅默认图标有效): `red`, `blue`, `green` 等 |
| `draggable` | `boolean` | 是否可拖拽 |
| `flat` | `boolean` | 是否平贴地图 (Android) |
| `zIndex` | `number` | 层级 (Android) |
| `smoothMovePath` | `LatLng[]` | 设置后 Marker 将沿轨迹平滑移动 |
| `cacheKey` | `string` | 图标缓存 key，建议设置以提高性能 |

### Cluster 核心属性

| 属性 | 类型 | 说明 |
|----------|----------|--------------|
| `points` | `ClusterPoint[]` | 待聚合的点数据 |
| `radius` | `number` | 聚合半径 (像素) |
| `minClusterSize` | `number` | 最小聚合数量 |
| `clusterStyle` | `ViewStyle` | 聚合点外框样式 (背景色、圆角等) |
| `clusterTextStyle` | `TextStyle` | 聚合点文字样式 (颜色、大小等) |
| `clusterBuckets` | `Array` | 分级聚合样式配置 |
| `onClusterPress` | `function` | 点击聚合簇回调 |

**注意**：`renderMarker` 和 `renderCluster` 属性目前**暂未实现**，请勿使用。请通过 `clusterStyle` 和 `clusterBuckets` 配置样式。

## 快速模式

### ✅ 正确：使用 position 属性
```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  title="北京"
  pinColor="blue"
  onMarkerPress={(e) => console.log('Clicked')}
/>
```

### ✅ 正确：配置聚合样式
```tsx
<Cluster
  points={points}
  radius={30}
  clusterStyle={{ backgroundColor: 'blue', borderRadius: 15 }}
  clusterTextStyle={{ color: 'white', fontSize: 12 }}
  // 分级样式：当数量 > 10 时变为红色，> 100 时变为绿色
  clusterBuckets={[
    { minPoints: 10, backgroundColor: 'red' },
    { minPoints: 100, backgroundColor: 'green' }
  ]}
/>
```

## 深度挖掘

### 聚合 (Clustering) 实现
`Cluster` 组件通过 `points` 属性接收数据。内部使用 C++ 实现的 QuadTree 引擎进行计算：
- 渲染时，会自动根据缩放级别显示聚合簇或单个 Marker。
- 样式定制：目前主要通过 `clusterStyle` (基础样式) 和 `clusterBuckets` (分级样式) 进行配置。

### 性能优化技巧
1. **cacheKey**: 对于频繁创建/销毁且图标相同的 Marker，务必设置相同的 `cacheKey` 以复用原生 Bitmap 资源。
2. **pinColor**: 仅在未提供 `icon` 或 `children` 时生效。
3. **坐标格式**: `LatLngPoint` 兼容多种格式，但在 JS 层建议统一使用对象格式 `{ latitude, longitude }` 以保持代码一致性。
