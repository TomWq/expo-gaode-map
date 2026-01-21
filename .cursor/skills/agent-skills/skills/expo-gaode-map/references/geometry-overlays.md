---
title: Geometry Overlays
impact: HIGH
tags: polyline, polygon, circle, geometry
---

# Skill: Geometry Overlays

在地图上绘制线段、多边形和圆形等几何图形。

## 快速参考

### 组件属性

| 组件 | 核心属性 | 说明 |
|----------|----------|--------------|
| `Polyline` | `points`, `strokeWidth`, `strokeColor`, `colors`, `gradient`, `texture` | 折线 (支持渐变、纹理) |
| `Polygon` | `points`, `fillColor`, `strokeWidth`, `strokeColor` | 多边形 (支持带孔 `points: LatLngPoint[][]`) |
| `Circle` | `center`, `radius`, `fillColor`, `strokeWidth`, `strokeColor` | 圆形区域 |

### 快速参考 (公共属性)

- `points`: 节点坐标数组，支持 `LatLng[]` 或 `[lng, lat][]`。
- `strokeColor`: 线条颜色 `ColorValue` (String 或 Number)。
- `strokeWidth`: 线条宽度 (像素)。
- `zIndex`: 覆盖物层级。

## 快速模式

### ✅ 正确：使用 points 属性
```tsx
<Polyline
  points={[{ latitude: 39.9, longitude: 116.4 }, { latitude: 31.2, longitude: 121.4 }]}
  strokeWidth={5}
  strokeColor="#FF0000"
/>
```

### ✅ 正确：实现轨迹抽稀
```tsx
<Polyline
  points={largePath}
  simplificationTolerance={2.0} // 开启 RDP 算法简化轨迹
/>
```

### ❌ 错误：使用 coordinates 属性
```tsx
// ❌ 错误：组件使用的是 points 而不是 coordinates
<Polyline coordinates={...} /> 
```

## 何时使用

- 展示行驶路线、运动轨迹。
- 标注地理围栏、区域划分。
- 实现带孔的多边形（如排除特定区域的范围）。

## 深度挖掘

### 轨迹抽稀 (Simplification)
`Polyline` 和 `Polygon` 支持 `simplificationTolerance` (米)。当轨迹点非常密集时，开启抽稀可以显著降低渲染压力和内存占用。

### 分段颜色 (Polyline Colors)
`Polyline` 的 `colors` 属性支持为每一段折线设置不同的颜色，常用于表示路况（如绿、黄、红）。

### 带孔多边形 (Polygon Holes)
`Polygon` 的 `points` 属性支持二维数组：
- `points[0]` 是外轮廓。
- `points[1...n]` 是内部的孔洞。

### 常见陷阱
1. **坐标格式**: `Polyline` 和 `Polygon` 统一使用 `points`。
2. **单位**: `Circle` 的 `radius` 单位是 **米**，其他宽度均为 **像素**。
3. **闭合**: `Polygon` 不需要手动闭合，原生层会自动处理。
