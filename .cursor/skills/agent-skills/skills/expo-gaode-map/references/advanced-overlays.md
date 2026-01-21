---
title: Advanced Overlays
impact: MEDIUM
tags: heatmap, multipoint, visualization
---

# Skill: Advanced Overlays

使用热力图 (HeatMap) 和海量点 (MultiPoint) 进行复杂数据可视化。

## 快速参考

### HeatMap 核心属性

| 属性 | 类型 | 说明 |
|----------|----------|--------------|
| `data` | `LatLngPoint[]` | 热力点坐标数组 |
| `radius` | `number` | 热力半径 (米) |
| `opacity` | `number` | 透明度 (0-1) |
| `gradient` | `HeatMapGradient` | 颜色渐变配置 |
| `visible` | `boolean` | 是否显示 (用于性能优化) |
| `allowRetinaAdapting` | `boolean` | 是否开启高清热力图 (@platform ios) |

### MultiPoint 核心属性

| 属性 | 类型 | 说明 |
|----------|----------|--------------|
| `points` | `MultiPointItem[]` | 海量点数据集合 |
| `icon` | `string | ImageSource` | 共享图标 |
| `iconWidth` | `number` | 图标宽度 |
| `iconHeight` | `number` | 图标高度 |
| `onMultiPointPress` | `function` | 点击回调 (包含 index 和 item) |

## 快速模式

### ✅ 正确：使用 points 属性 (MultiPoint)
```tsx
<MultiPoint
  points={largeDataset}
  icon={require('./assets/dot.png')}
  onMultiPointPress={(e) => console.log('Clicked:', e.nativeEvent.item.id)}
/>
```

### ✅ 正确：配置热力图渐变
```tsx
<HeatMap
  data={thermalPoints}
  gradient={{
    colors: ['#0000FF', '#00FF00', '#FF0000'],
    startPoints: [0.1, 0.5, 0.9]
  }}
/>
```

### ❌ 错误：使用 data 属性 (MultiPoint)
```tsx
// ❌ 错误：MultiPoint 使用的是 points 而不是 data
<MultiPoint data={...} /> 
```

## 何时使用

- **热力图**: 展示区域密集度、热度分布。
- **海量点**: 展示上万个简单的、共享图标的点位。

## 深度挖掘

### 性能优化
1. **HeatMap visible**: 切换 `visible` 属性比卸载/重装组件性能更高，特别是在频繁切换视图时。
2. **MultiPoint**: 在原生层高效渲染。如果点位需要独立的不同图标，应考虑使用 `Cluster`。

### 常见陷阱
1. **HeatMap Radius**: 单位是 **米**，在大缩放级别下可能需要调整以获得理想视觉效果。
2. **MultiPoint Interaction**: 仅支持基本的点击事件，不支持拖拽或自定义 Callout。
