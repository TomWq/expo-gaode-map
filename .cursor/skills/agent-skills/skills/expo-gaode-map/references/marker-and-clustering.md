---
title: Marker and Clustering
impact: CRITICAL
tags: marker, cluster, quadtree, cpp-engine, icons
---

# Skill: Marker and Clustering

实现高性能的地图标记 (Marker) 和大规模点聚合 (Clustering)。

## 快速参考

### Marker 核心属性

| 属性 | 类型 | 说明 |
|----------|----------|--------------|
| `position` | `LatLngPoint` | 坐标位置 `{latitude, longitude}` 或 `[lng, lat]` |
| `title` | `string` | 标题，点击显示 Callout |
| `snippet` | `string` | 描述文字，点击显示 Callout |
| `icon` | `string | ImageSource` | 图标资源 (URL, 本地 asset 或 require) |
| `iconWidth` / `iconHeight` | `number` | 图标宽高 (像素) |
| `anchor` | `Point` | 锚点比例 (@platform android) |
| `centerOffset` | `Point` | 偏移位置 (@platform ios) |
| `pinColor` | `string` (Enum) | 大头针颜色: `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `violet`, `magenta`, `rose`, `purple` |
| `draggable` | `boolean` | 是否可拖拽 |
| `smoothMovePath` | `LatLng[]` | 设置后 Marker 将沿轨迹平滑移动 |
| `cacheKey` | `string` | 图标缓存 key，建议设置以提高性能 |

### Cluster 核心属性

| 属性 | 类型 | 说明 |
|----------|----------|--------------|
| `points` | `ClusterPoint[]` | 待聚合的点数据 |
| `radius` | `number` | 聚合半径 (像素) |
| `minClusterSize` | `number` | 最小聚合数量 |
| `clusterStyle` | `ViewStyle` | 聚合点外框样式 |
| `clusterTextStyle` | `TextStyle` | 聚合点文字样式 |
| `clusterBuckets` | `Array` | 分级聚合样式配置 |
| `onClusterPress` | `function` | 点击聚合簇回调 |

## 快速模式

### ✅ 正确：使用 position 属性
```tsx
<Marker
  position={{ latitude: 39.9, longitude: 116.4 }}
  title="北京"
  pinColor="blue"
/>
```

### ✅ 正确：实现平滑移动
```tsx
<Marker
  position={currentPos}
  smoothMovePath={pathArray}
  smoothMoveDuration={5}
/>
```

### ❌ 错误：使用 coordinate 属性
```tsx
// ❌ 错误：组件使用的是 position 而不是 coordinate
<Marker coordinate={{...}} /> 
```

## 何时使用

- 展示地图上的业务点位。
- 处理上千个点位时的性能瓶颈（使用 Cluster）。
- 需要 Marker 沿路径移动（如车辆实时追踪）。

## 深度挖掘

### 聚合 (Clustering) 实现
`Cluster` 组件通过 `points` 属性接收数据。内部使用 C++ 实现的 QuadTree 引擎进行计算：
- 渲染时，会自动根据缩放级别显示聚合簇或单个 Marker。
- 支持 `onClusterPress` 事件获取聚合簇包含的具体点位信息。

### 自定义视图 (Children)
Marker 支持嵌套 React 组件作为自定义图标。
- **注意**: 当使用 `children` 时，组件会被渲染为图片。建议提供 `customViewWidth` 和 `customViewHeight` 以获得最佳显示效果。

### 常见陷阱
1. **cacheKey**: 对于频繁创建/销毁且图标相同的 Marker，务必设置相同的 `cacheKey` 以复用原生 Bitmap 资源。
2. **pinColor**: 仅在未提供 `icon` 或 `children` 时生效。
3. **坐标格式**: `LatLngPoint` 兼容多种格式，但在 JS 层建议统一使用对象格式 `{ latitude, longitude }` 以保持代码一致性。
