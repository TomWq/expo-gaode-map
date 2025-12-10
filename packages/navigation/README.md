# expo-gaode-map-navigation

高德地图“导航一体化”模块。内置地图渲染能力与导航能力，提供从地图展示到路径规划与实时导航的完整解决方案。

## 模块定位与使用约束

- 独立使用：本模块已封装地图相关能力（MapView/覆盖物等）与导航能力，不需要、也不应同时安装核心地图包。
- 禁止共存：请勿与 `expo-gaode-map` 同时安装或链接。两者均包含地图 SDK，Android 上会产生 `3dmap` vs `navi-3dmap` 的二进制冲突。
- 简化依赖：安装本模块即可获得地图 + 导航全量能力，无需额外地图依赖。

## 功能特性

- 🗺️ 地图渲染：内置地图视图与常用覆盖物（标注、折线、多边形、热力图、聚合等）
- 🧭 路径与导航：驾车、步行、骑行等多种出行策略与实时引导
- ⚙️ 策略丰富：最快、最短、避拥堵、少收费、少红绿灯等
- 🚗 复杂路线：支持多途经点、限行考虑、分段规划
- 🌐 Web API 协作：可与 `expo-gaode-map-web-api` 配合，统一通过基础初始化下发 Web Key 后使用

## 安装

仅安装本模块（不要安装 `expo-gaode-map`）：

```bash
# npm
npm install expo-gaode-map-navigation

# or yarn
yarn add expo-gaode-map-navigation

# or pnpm
pnpm add expo-gaode-map-navigation
```

如果项目中已安装过核心地图包，请先移除避免冲突：

```bash
npm uninstall expo-gaode-map
# or: yarn remove expo-gaode-map
# or: pnpm remove expo-gaode-map
```

## 初始化

在应用启动阶段初始化 SDK Key（Android/iOS 原生 Key 与可选的 Web API Key）：

```ts
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key', // 可选；若使用 Web API 包，建议一并下发
});
```

说明：
- 如后续使用 `expo-gaode-map-web-api`，建议同时传入 `webKey`，该包会从本模块运行时读取 `webKey`，实现“无参构造”的简化用法（new GaodeWebAPI()）。

## 地图与导航基础用法

地图视图（内置地图能力）：

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
          zoom: 12,
        }}
      >
        <Marker
          position={{ latitude: 39.909186, longitude: 116.397411 }}
          title="天安门"
          snippet="北京·东城区"
        />
      </MapView>
    </View>
  );
}
```

路径规划与导航（示例）：

```ts
import { calculateRoute, DriveStrategy } from 'expo-gaode-map-navigation';

const result = await calculateRoute({
  type: 'drive',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST,
});

// 结果包含距离/时长/分步指引等
```

说明：
- 地图组件与导航能力均来自 `expo-gaode-map-navigation`，无需、也不应从 `expo-gaode-map` 引入任何 API。

## 路径规划（原生与 Web API 双方案）

本模块同时支持“原生导航引擎路径规划”和“Web API 路径规划”，可按业务场景自由选择或组合使用：

- 原生方案（推荐用于移动端实时导航）：端侧原生 SDK 能力，更适合实时引导、语音播报、复杂交通路况处理、弱网/离线等。
- Web API 方案（推荐用于快速查询/对比/多端一致）：通过 `expo-gaode-map-web-api` 发起 HTTP 请求，便于统一计算逻辑、方案对比或与服务端配合。

原生方案示例：
```ts
import { calculateRoute, DriveStrategy } from 'expo-gaode-map-navigation';

const result = await calculateRoute({
  type: 'drive',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST,
});

// result 包含距离/时长/分步指引等原生返回
```

Web API 方案示例（需在初始化时提供 webKey）：
```ts
import { GaodeWebAPI } from 'expo-gaode-map-web-api';

// 无参构造：从 expo-gaode-map-navigation 初始化中动态解析 webKey
const api = new GaodeWebAPI();

// 驾车路径规划（Web API）
const res = await api.route.driving('116.400000,39.900000', '116.410000,39.910000', {
  show_fields: 'cost,navi',
});

// res.route.paths[0] 中包含距离/时长/导航步骤等
```

选择建议：
- 实时导航/引导优先原生方案；
- 方案对比、批量测算、多端统一优先 Web API；也可结合两者，在端上落地选择逻辑。

## Android 注意事项

- 本模块内部使用 `navi-3dmap` 体系，已包含地图能力；请勿同时引入核心 `3dmap` 体系以免二进制冲突。
- 若历史项目从核心包迁移至本模块，务必移除 `expo-gaode-map` 依赖与其 native 配置（Gradle/CocoaPods 链接等）。

## 许可

MIT