---
layout: home

hero:
  name: "expo-gaode-map"
  text: "高德地图 React Native 组件"
  tagline: 基于 Expo Modules 开发的完整高德地图解决方案
  image:
    src: /logo.svg
    alt: expo-gaode-map
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看 GitHub
      link: https://github.com/TomWq/expo-gaode-map

features:
  - icon: 🗺️
    title: 完整的地图功能
    details: 支持多种地图类型、手势控制、相机操作等完整功能
  - icon: 📍
    title: 精准定位
    details: 连续定位、单次定位、坐标转换，满足各种定位需求
  - icon: 🚗
    title: 导航功能 🆕
    details: 完整的路径规划和导航能力，支持驾车、步行、骑行、货车等多种出行方式
  - icon: 🌐
    title: Web API 服务 🆕
    details: 纯 JavaScript 实现，提供地理编码、路径规划、POI 搜索等跨平台服务
  - icon: 🔍
    title: 原生搜索（可选）
    details: POI 搜索、周边搜索、沿途搜索等，性能更优的原生实现
  - icon: 🎨
    title: 丰富的覆盖物
    details: Circle、Marker、Polyline、Polygon 等多种覆盖物支持
  - icon: 📝
    title: TypeScript 支持
    details: 完整的 TypeScript 类型定义，零 any 类型
  - icon: 🔧
    title: 模块化设计
    details: Monorepo 架构，核心功能和扩展功能分离，按需使用
  - icon: 📱
    title: 跨平台支持
    details: 同时支持 Android 和 iOS 平台
  - icon: ⚡
    title: 新老架构兼容
    details: 完美支持 React Native 新架构（Fabric & TurboModules）和旧架构
---

## 快速开始

### 安装

```bash
# 核心包（地图+定位）
npm install expo-gaode-map

# 导航包（包含地图+导航）🆕
npm install expo-gaode-map-navigation

# Web API 服务 🆕
npm install expo-gaode-map-web-api

# 原生搜索（可选）
npm install expo-gaode-map-search
```

::: tip 包选择建议
- 只需要地图和定位 → `expo-gaode-map`
- 需要导航功能 → `expo-gaode-map-navigation`（已包含地图）
- 需要跨平台 Web 服务 → `expo-gaode-map-web-api`
- 需要原生搜索 → `expo-gaode-map-search`
:::

### 基础使用

```tsx
import { MapView, ExpoGaodeMapModule } from 'expo-gaode-map';

// ⚠️ 首次启动时，用户同意隐私协议后调用一次（原生端会持久化）
ExpoGaodeMapModule.updatePrivacyCompliance(true);

// 初始化 SDK（使用 Config Plugin 时可传空对象）
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // 仅在使用 Web API 服务时需要
});

// 使用地图
<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  myLocationEnabled={true}
/>
```

::: tip 重要提示
- `updatePrivacyCompliance(true)` 只需在用户首次同意时调用一次，原生端会自动持久化
- 使用 Config Plugin 时，原生 Key 会自动配置，`initSDK` 可传空对象（更安全）
- `webKey` 仅在使用 `expo-gaode-map-web-api` 包时需要
:::

查看完整示例 → [快速开始指南](/guide/getting-started)

## 核心功能模块

### 📦 expo-gaode-map
核心地图包，提供基础地图显示、定位、覆盖物等功能。

[快速开始](/guide/getting-started) · [API 文档](/api/mapview)

### 🚗 expo-gaode-map-navigation 🆕
导航功能包，提供完整的路径规划和导航能力：
- **路径规划**: 驾车、步行、骑行、货车、摩托车、电动车
- **导航视图**: 官方导航界面，实时路况、语音播报
- **独立规划**: 不影响当前导航状态的路径计算

[导航文档](/api/navigation) · [使用示例](/examples/navigation)

### 🌐 expo-gaode-map-web-api 🆕
Web API 服务包，纯 JavaScript 实现，跨平台一致：
- **地理编码**: 地址与坐标相互转换
- **路径规划**: 支持驾车、步行、骑行、公交等
- **POI 搜索**: 关键字搜索、周边搜索、多边形搜索
- **输入提示**: 实时搜索建议

[Web API 文档](/api/web-api) · [使用示例](/examples/web-api)

### 🔍 expo-gaode-map-search
原生搜索包，性能更优的 POI 搜索实现（可选）。

[搜索文档](/api/search)

## 为什么选择 expo-gaode-map？

- ✅ **基于 Expo Modules**: 现代化的开发体验，类型安全
- ✅ **功能完整**: 覆盖地图、导航、搜索等主要功能
- ✅ **模块化设计**: 按需安装，避免不必要的包体积
- ✅ **文档完善**: 详细的中英文档和丰富的示例
- ✅ **积极维护**: 持续更新和社区支持
- ✅ **开源免费**: MIT 协议，可商用

## 社区

- 📝 [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- 💬 QQ 群: 952241387

## 致谢

本项目参考了 [react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d) 的优秀设计。