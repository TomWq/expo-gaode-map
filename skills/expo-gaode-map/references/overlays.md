---
title: Geometry Overlays
impact: HIGH
tags: polyline, polygon, circle, geometry, heatmap, multipoint
---

# 核心参考: 几何与高级覆盖物

在地图上绘制线段、多边形、圆形以及处理大数据量的热力图和海量点。

## 快速参考

### 基础几何组件

| 组件 | 核心属性 | 说明 |
|----------|----------|--------------|
| `Polyline` | `points`, `strokeWidth`, `strokeColor`, `colors`, `gradient` | 折线 (支持渐变、分段颜色、虚线、纹理) |
| `Polygon` | `points`, `fillColor`, `strokeWidth`, `strokeColor` | 多边形 (支持带孔 `points: LatLngPoint[][]`) |
| `Circle` | `center`, `radius`, `fillColor`, `strokeWidth`, `strokeColor` | 圆形区域 |

### 高级可视化组件 (Advanced)

| 组件 | 核心属性 | 说明 |
|----------|----------|--------------|
| `HeatMap` | `data`, `radius`, `opacity`, `gradient` | **热力图**: 用于展示密度分布 |
| `MultiPoint` | `points`, `icon` | **海量点**: 渲染成千上万个点，性能远超 Marker |

## 快速模式

### ✅ 正确：使用 HeatMap 展示密度
```tsx
<HeatMap
  data={[{latitude: 39.9, longitude: 116.4}, ...]}
  radius={30}
  opacity={0.8}
  gradient={{
    colors: ['blue', 'yellow', 'red'],
    startPoints: [0.2, 0.5, 0.9]
  }}
  allowRetinaAdapting={true} // iOS 高清适配
/>
```

### ✅ 正确：使用 MultiPoint 渲染万级数据
```tsx
// 所有点共享同一个 icon 资源，极大降低内存
<MultiPoint
  points={[{latitude: 39.9, longitude: 116.4}, ...]}
  icon={require('./marker.png')}
  onMultiPointPress={(event) => console.log('Clicked index:', event.index)}
/>
```

### ✅ 正确：绘制复杂多边形 (带孔)
```tsx
<Polygon
  points={[
    // 外轮廓
    [{latitude: 30, longitude: 110}, {latitude: 30, longitude: 120}, ...],
    // 内孔 (挖空部分)
    [{latitude: 31, longitude: 111}, {latitude: 31, longitude: 115}, ...]
  ]}
  fillColor="rgba(255, 0, 0, 0.5)"
/>
```

## 深度挖掘

### 轨迹优化与计算 (Polyline Optimization)
当处理复杂轨迹或长路径时，请务必利用原生能力进行优化：

- **渲染抽稀**: `Polyline` 和 `Polygon` 组件支持 `simplificationTolerance` (米) 属性。开启后，底层会自动在渲染前进行抽稀。
- **计算抽稀**: 如果需要手动获取抽稀后的坐标点，请使用 `ExpoGaodeMapModule.simplifyPolyline(points, tolerance)`。
- **路径纠偏/吸附**: 使用 `ExpoGaodeMapModule.getNearestPointOnPath(path, target)` 获取路径上最近的点。这在实现“点到线”的距离计算或导航吸附时非常有用。
- **总长度计算**: 使用 `ExpoGaodeMapModule.calculatePathLength(points)`。

**严禁**：不要在 JS 层编写 RDP 抽稀算法或点到线段的距离算法，原生 C++ 引擎的执行速度快几个数量级。

### GeoUtils 工具
- **智能坐标纠错**: `GeoUtils.normalizeLatLng` 会自动检测并修复经纬度反转的问题。
- **多态支持**: 支持 GeoJSON 风格的嵌套数组格式，方便直接对接后端数据。

### HeatMap 性能优化
`HeatMap` 组件内部使用了 `React.memo`，仅在 `data` 或样式属性变化时重新渲染。建议将 `data` 数组保持引用稳定（使用 `useMemo`）。
