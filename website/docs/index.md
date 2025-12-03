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
  - icon: 🔍
    title: 搜索功能（可选）
    details: POI 搜索、周边搜索、沿途搜索等，按需安装
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

**核心包（必需）**
```bash
npm install expo-gaode-map
```

**搜索功能（可选）**
```bash
npm install expo-gaode-map-search
```

### 基础使用

```tsx
import { MapView } from 'expo-gaode-map';

// 使用地图组件（API Key 通过 Config Plugin 自动配置）
<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  myLocationEnabled={true}
/>
```

### 使用搜索功能

```tsx
import { searchPOI } from 'expo-gaode-map-search';

const results = await searchPOI({
  keyword: '酒店',
  city: '北京',
});
```

## 为什么选择 expo-gaode-map？

- ✅ **基于 Expo Modules**: 现代化的开发体验，类型安全
- ✅ **功能完整**: 覆盖高德地图主要功能
- ✅ **文档完善**: 详细的中英文档和示例
- ✅ **积极维护**: 持续更新和社区支持
- ✅ **开源免费**: MIT 协议，可商用

## 社区

- 📝 [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- 💬 QQ 群: 952241387

## 致谢

本项目参考了 [react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d) 的优秀设计。