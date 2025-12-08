# expo-gaode-map-navigation

高德地图导航功能模块，为 `expo-gaode-map` 提供路径规划和导航引导功能。

## 功能特性

- 🗺️ **路径规划**：支持驾车、步行、骑行、公交等多种出行方式
- 🧭 **导航引导**：提供实时导航引导功能
- 📍 **多种策略**：支持最快路线、最短路线、避免拥堵等策略
- 🚗 **途经点支持**：支持设置途经点的路径规划

## ⚠️ 重要提示

**Android SDK 依赖冲突**：导航模块使用 `navi-3dmap` SDK，与核心包的 `3dmap` SDK 会产生冲突。

请务必阅读：[Android SDK 冲突解决方案](./ANDROID_SDK_CONFLICT.md)

## 安装

首先确保已安装主包：

```bash
npm install expo-gaode-map
```

然后安装导航模块：

```bash
npm install expo-gaode-map-navigation
```

或使用 yarn/pnpm：

```bash
yarn add expo-gaode-map-navigation
pnpm add expo-gaode-map-navigation
```

**Android 配置**：安装后需要修改核心包的 SDK 依赖，详见 [ANDROID_SDK_CONFLICT.md](./ANDROID_SDK_CONFLICT.md)

## 基础用法

```typescript
import { calculateRoute, DriveStrategy } from 'expo-gaode-map-navigation';

// 驾车路径规划
const result = await calculateRoute({
  type: 'drive',
  from: { latitude: 39.9, longitude: 116.4 },
  to: { latitude: 39.91, longitude: 116.41 },
  strategy: DriveStrategy.FASTEST,
});

console.log('距离:', result.distance, '米');
console.log('时间:', result.duration, '秒');
console.log('路径点:', result.steps.length, '步');
```

## API 文档

详细的 API 文档请参考主项目文档。

## 许可证

MIT