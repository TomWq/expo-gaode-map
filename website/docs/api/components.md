# 组件与 Hooks

除了核心的 `MapView` 组件外，库还提供了一些辅助组件和 Hooks，用于简化开发和增强功能。

## useMap

`useMap` 是一个自定义 Hook，用于在 `MapView` 的子组件中获取地图实例的引用（`MapViewRef`）。

### 为什么需要它？

通常我们使用 `ref` 来控制地图（如移动视角、缩放等）。但在复杂的组件树中，将 `ref` 层层传递给深层子组件会很麻烦。`useMap` 利用 React Context 机制，让任何 `MapView` 内部的组件都能直接获取地图控制器。

### 使用方法

1. 确保你的组件在 `MapView` 内部。
2. 调用 `useMap()` 获取 `map` 实例。

```tsx
import { MapView, useMap } from 'expo-gaode-map';
import { Button, View } from 'react-native';

// 定义一个子组件
function ZoomControls() {
  const map = useMap(); // 获取地图实例

  const handleZoomIn = async () => {
    const status = await map.getCameraPosition();
    if (status.zoom) {
      map.setZoom(status.zoom + 1, true);
    }
  };

  return (
    <View>
      <Button title="放大" onPress={handleZoomIn} />
    </View>
  );
}

// 在 MapView 中使用
export default function App() {
  return (
    <MapView style={{ flex: 1 }}>
      {/* 直接放置子组件，无需传递 ref */}
      <MapUI>
         <ZoomControls />
      </MapUI>
    </MapView>
  );
}
```

### API

```ts
function useMap(): MapViewRef
```

*   **返回值**: `MapViewRef` 对象，包含 `setZoom`, `moveCamera`, `getCameraPosition` 等方法。
*   **注意**: 必须在 `MapView` 的子组件树中调用，否则会抛出错误。

---

## MapUI

`MapUI` 是一个辅助容器组件，用于包裹那些**不需要**作为地图原生覆盖物（如 Marker、Polyline）的普通 React UI 组件（如按钮、搜索框、浮动面板）。

### 为什么需要它？

`MapView` 的直接子组件通常被视为地图覆盖物（Markers, Polylines 等）。如果你直接在 `MapView` 下放置一个普通的 `View`，它可能无法正确显示，或者会被错误地处理为地图内容。

`MapUI` 的作用是明确告诉 `MapView`：**"这里面的内容是 UI 界面，不是地图数据"**。它会将包裹的内容渲染在地图视图的上层（绝对定位），确保 UI 元素可见且能响应交互。

### 使用方法

```tsx
import { MapView, MapUI } from 'expo-gaode-map';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <MapView style={{ flex: 1 }}>
      {/* 地图覆盖物：直接放在 MapView 下 */}
      <Marker coordinate={{ latitude: 39.9, longitude: 116.4 }} />

      {/* UI 元素：包裹在 MapUI 中 */}
      <MapUI>
        <View style={{ position: 'absolute', bottom: 50, right: 20 }}>
          <Text style={{ backgroundColor: 'white', padding: 10 }}>
            这是一个悬浮层
          </Text>
        </View>
      </MapUI>
    </MapView>
  );
}
```

### 特性

*   **渲染层级**: `MapUI` 内部的组件会渲染在地图图层之上。
*   **事件响应**: 内部组件可以正常响应触摸事件（Press, Scroll 等），不会被地图手势拦截。
*   **布局**: 通常需要配合 `position: 'absolute'` 来定位 UI 元素。

### 最佳实践

推荐将所有的悬浮 UI（搜索栏、定位按钮、图例等）都放在 `MapUI` 中，保持代码结构清晰，并避免原生图层混合带来的潜在问题。
