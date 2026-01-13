# expo-gaode-map-navigation

高德地图“导航一体化”模块。内置地图渲染能力与导航能力，提供从地图展示到路径规划、实时导航的完整解决方案。

## 特性

- 🗺️ **地图渲染**：内置完整地图能力，支持 Marker、Polyline、Polygon、Circle、Cluster、HeatMap 等覆盖物。
- 🚗 **多模式路径规划**：支持驾车、步行、骑行、电动车、货车、摩托车等多种出行方式。
- 🧭 **实时导航 UI**：提供 `NaviView` 组件，内置完整的导航界面、语音播报、转向指引、路况显示等。
- 🛣️ **独立路径规划**：支持“先算路、再导航”的高级模式，可实现多路线对比与选择。
- ⚙️ **策略丰富**：支持速度优先、避让拥堵、少收费、不走高速等多种算路策略。
- � **开箱即用**：封装了 Android/iOS 原生导航 SDK，统一 JS 接口。

## 安装

本模块已包含地图与导航的所有能力，**不需要**、也不应同时安装 `expo-gaode-map`。

```bash
# bun
bun add expo-gaode-map-navigation

# yarn
yarn add expo-gaode-map-navigation

# npm
npm install expo-gaode-map-navigation
```

**⚠️ 重要提示：**
如果项目中已安装 `expo-gaode-map`，请务必先卸载，否则会导致 Android 端二进制冲突（`3dmap` vs `navi-3dmap`）。`expo-gaode-map` 和 `expo-gaode-map-navigation` 由于 SDK 冲突不能同时安装，二选一使用。


### Config Plugin 配置（推荐）

在 `app.json` 中配置，自动设置原生 API Key 和权限：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map-navigation", 
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key"
        }
      ]
    ]
  }
}
```
配置后重新构建：

```bash
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```


## 快速开始

### 1. 显示地图

使用内置的 `MapView` 组件显示地图：

```tsx
import React from 'react';
import { View } from 'react-native';
import { MapView, Marker } from 'expo-gaode-map-navigation';

export default function BasicMapScreen() {
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialCameraPosition={{
          target: { latitude: 39.909186, longitude: 116.397411 },
          zoom: 15,
        }}
      >
        <Marker
          position={{ latitude: 39.909186, longitude: 116.397411 }}
          title="天安门"
        />
      </MapView>
    </View>
  );
}
```

### 2. 嵌入导航视图

使用 `NaviView` 组件直接嵌入导航界面：

```tsx
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { NaviView, type NaviViewRef } from 'expo-gaode-map-navigation';

export default function NavigationScreen() {
  const naviRef = useRef<NaviViewRef>(null);

  useEffect(() => {
    // 延迟 1 秒后开始导航
    const timer = setTimeout(() => {
      if (naviRef.current) {
        naviRef.current.startNavigation(
          { latitude: 39.909186, longitude: 116.397411 }, // 起点
          { latitude: 39.99, longitude: 116.47 },         // 终点
          0 // 0: GPS导航, 1: 模拟导航
        );
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <NaviView
        ref={naviRef}
        style={{ flex: 1 }}
        showCamera={true} // 显示摄像头
        enableVoice={true} // 开启语音
      />
    </View>
  );
}
```

## 详细用法

### 路径规划 (API)

使用 `calculateRoute` 方法进行路径计算，不涉及 UI 显示，适合用于获取距离、时间或绘制路线。

#### 驾车路径规划

```typescript
import { calculateRoute, RouteType, DriveStrategy } from 'expo-gaode-map-navigation';

const result = await calculateRoute({
  type: RouteType.DRIVE,
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST, // 速度优先
  avoidRoad: '京通快速路', // 避让道路名称
});

console.log(`总距离: ${result.routes[0].distance}米`);
console.log(`预计耗时: ${result.routes[0].duration}秒`);
```

#### 步行/骑行路径规划

```typescript
import { calculateRoute, RouteType, RideStrategy } from 'expo-gaode-map-navigation';

// 骑行
const rideResult = await calculateRoute({
  type: RouteType.RIDE,
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: RideStrategy.FASTEST,
});

// 步行
const walkResult = await calculateRoute({
  type: RouteType.WALK,
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  multiple: true, // 返回多条路线
});
```

#### 货车路径规划

```typescript
import { calculateRoute, RouteType, TruckSize } from 'expo-gaode-map-navigation';

const truckResult = await calculateRoute({
  type: RouteType.TRUCK,
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  size: TruckSize.MEDIUM, // 中型货车
  height: 3.5, // 高度 3.5m
  load: 10,    // 载重 10吨
});
```

### 独立路径规划 (Advanced)

“独立路径规划”允许你先计算路线，并在地图上展示多条方案，用户选择其中一条后再开始导航。这通常比直接开始导航体验更好。

```typescript
import {
  independentDriveRoute,
  selectIndependentRoute,
  startNaviWithIndependentPath,
  DriveStrategy
} from 'expo-gaode-map-navigation';

// 1. 发起算路（不会自动开始导航）
const result = await independentDriveRoute({
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.AVOID_CONGESTION,
});

// 2. 选择某一条路线（例如 index=1 的路线）
// 这通常配合地图上的点击事件，高亮显示某条路线
await selectIndependentRoute({
  routeId: result.routes[1].id
});

// 3. 使用当前选中的路线开始导航
await startNaviWithIndependentPath({
  emulator: true, // 开启模拟导航
});
```

### 地图组件 (Map)

模块导出了完整的地图组件，与 `expo-gaode-map` API 保持一致。

```tsx
import { MapView, Circle, Polygon } from 'expo-gaode-map-navigation';

<MapView style={{ flex: 1 }}>
  {/* 圆形覆盖物 */}
  <Circle
    center={{ latitude: 39.9, longitude: 116.4 }}
    radius={1000}
    fillColor="rgba(0,0,255, 0.3)"
    strokeColor="rgba(0,0,255, 0.5)"
  />
  
  {/* 多边形 */}
  <Polygon
    points={[
      { latitude: 39.9, longitude: 116.4 },
      { latitude: 39.91, longitude: 116.41 },
      { latitude: 39.92, longitude: 116.42 },
    ]}
    strokeWidth={2}
  />
</MapView>
```

## API 参考

### DriveStrategy (驾车策略)

| 值 | 说明 |
|---|---|
| `FASTEST` (0) | 速度优先（时间最短） |
| `FEE_FIRST` (1) | 费用优先（少收费） |
| `SHORTEST` (2) | 距离优先 |
| `NO_HIGHWAY` (5) | 不走高速 |
| `AVOID_CONGESTION` (4) | 躲避拥堵 |
| ... | 更多策略请参考类型定义 |

### NaviView Props

| 属性 | 类型 | 说明 |
|---|---|---|
| `naviType` | number | 导航类型（0: GPS, 1: 模拟） |
| `showCrossImage` | boolean | 是否显示路口放大图 |
| `showCamera` | boolean | 是否显示摄像头 |
| `showTrafficButton` | boolean | 是否显示路况按钮 |
| `enableVoice` | boolean | 是否开启语音播报 |
| `onArrive` | function | 到达目的地回调 |
| `onNaviInfoUpdate` | function | 导航信息更新（剩余距离、时间等） |

## 注意事项

1.  **二进制冲突**：严禁与 `expo-gaode-map` 共存。本模块已包含 `3dmap` SDK。
2.  **Web API**：如果需要更灵活的 HTTP 算路（如公交跨城规划、Web端展示），推荐配合 `expo-gaode-map-web-api` 使用。
3.  **权限**：使用导航功能前，请确保应用已获取定位权限（`ACCESS_FINE_LOCATION`）。


## 📚 文档与资源

- [在线文档](https://TomWq.github.io/expo-gaode-map/)
- [GitHub 仓库](https://github.com/TomWq/expo-gaode-map/packages/navigation)
- [示例项目(导航)](https://github.com/TomWq/expo-gaode-map-navigation-example)
- [高德地图开放平台](https://lbs.amap.com/)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## License

MIT License
