---
name: expo-gaode-map
description: 核心地图开发助手。提供地图显示、覆盖物绘制（标记/聚合/图形）、定位服务及离线地图功能的开发指引。
---

# Expo Gaode Map

## 描述
`expo-gaode-map` 是高德地图的 React Native 核心包（Expo Module）。它提供了原生地图视图、定位服务、离线地图管理以及基于 C++ 引擎的高性能点聚合功能。

## 使用场景
- **基础地图**：显示标准/卫星/夜间地图，控制缩放、旋转、俯视。
- **定位服务**：获取用户当前位置、持续定位、后台定位轨迹记录。
- **覆盖物绘制**：绘制标记点 (Marker)、折线 (Polyline)、多边形 (Polygon)、圆 (Circle)。
- **高性能聚合**：处理成千上万个标记点的聚合显示 (Cluster)。
- **离线地图**：下载城市离线数据以节省流量。

## 开发指令

### 1. 配置 (Configuration)
- **推荐**：在 `app.json` 的 `plugins` 节点配置 API Key 和权限。
- **备选**：如果未使用插件配置，需在根组件调用 `ExpoGaodeMapModule.initSDK({ androidKey, iosKey })`。

### 2. 地图集成 (MapView)
- 使用 `<MapView>` 组件显示地图。
- 必须设置 `style` (通常是 `flex: 1`) 否则地图不可见。
- 使用 `initialCameraPosition` 设置初始视角（中心点、缩放）。

### 3. 常用功能实现
- **显示定位**：设置 `myLocationEnabled` 和 `followUserLocation`。
- **添加标记**：在 `MapView` 内部嵌套 `<Marker>` 组件。
- **绘制路线**：在 `MapView` 内部嵌套 `<Polyline>` 组件。
- **点聚合**：使用 `<Cluster>` 组件包裹数据源，通过 `clusterStyle` 定制样式。

## 快速模式

### ✅ 场景 1：最简地图显示
```tsx
import { MapView } from 'expo-gaode-map';

export default function App() {
  return (
    <MapView 
      style={{ flex: 1 }} 
      mapType={0} // 0: Standard, 1: Satellite
      initialCameraPosition={{
        target: { latitude: 39.909, longitude: 116.397 }, // 北京天安门
        zoom: 10
      }}
    />
  );
}
```

### ✅ 场景 2：定位与用户追踪
```tsx
<MapView
  style={{ flex: 1 }}
  myLocationEnabled={true}      // 显示蓝点
  followUserLocation={true}     // 跟随用户移动
  onLocation={(e) => {
    console.log('当前坐标:', e.nativeEvent);
  }}
/>
```

### ✅ 场景 3：高性能点聚合 (Cluster)
```tsx
import { Cluster } from 'expo-gaode-map';

<Cluster
  points={[
    { latitude: 39.9, longitude: 116.4 },
    { latitude: 39.8, longitude: 116.3 },
    // ... 更多点
  ]}
  radius={30} // 聚合半径
  clusterStyle={{ 
    backgroundColor: '#4285F4', 
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  }}
  clusterTextStyle={{ color: '#FFFFFF', fontSize: 12 }}
  onClusterPress={(e) => console.log('点击聚合簇:', e.nativeEvent)}
/>
```

## 参考文档
- [地图视图 (MapView) - 属性与事件](./references/map-view.md)
- [标记与聚合 (Marker & Cluster) - 样式与交互](./references/marker-cluster.md)
- [几何覆盖物 (Overlays) - 折线/多边形/圆](./references/overlays.md)
- [定位与追踪 (Location) - 权限与后台服务](./references/location.md)
- [离线地图 (Offline) - 下载与管理](./references/offline.md)
