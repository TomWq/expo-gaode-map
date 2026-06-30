---
layout: home
title: expo-gaode-map 概览
description: expo-gaode-map 产品概览，快速了解 Expo / React Native 高德地图、定位、导航、搜索与离线地图能力。

hero:
  name: "expo-gaode-map"
  text: "文档概览"
  tagline: 基于 Expo Modules 开发的完整高德地图解决方案
  image:
    src: /logo.svg
    alt: expo-gaode-map
  actions:
    - theme: brand
      text: 返回首页
      link: /
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
    title: 导航功能 （可选）
    details: 完整的路径规划和导航能力，支持驾车、步行、骑行、货车等多种出行方式
  - icon: 📥
    title: 离线地图 🆕
    details: 城市地图下载管理、实时进度监控、存储管理，无网络也能使用地图
  - icon: 🌐
    title: Web API 服务 （可选）
    details: 纯 JavaScript 实现，提供地理编码、路径规划、POI 搜索等跨平台服务
  - icon: 🔍
    title: 内置原生搜索
    details: POI 搜索、周边搜索、沿途搜索等，随 core / navigation 一起维护
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

::: warning 版本兼容性说明
**请根据您的 Expo SDK 版本选择合适的包版本：**

| Expo SDK 版本 | 推荐包版本 | 安装命令 | 说明 |
| :--- | :--- | :--- | :--- |
| **SDK 54+** | **Latest** | `npm install expo-gaode-map` | ✅ 功能最全 <br>✅ 使用高德 iOS SDK v10.1.600+ |
| **SDK 53 及以下** | **V1** | `npm install expo-gaode-map@v1` | ⚠️ 不支持加载世界向量地图<br>✅ 使用高德 iOS SDK v10.0.1000<br>*(注：旧版 Expo 使用新版高德 SDK 会导致 iOS 闪退)* |

> **提示**：除了世界地图功能外，V1 和 Latest 版本的 API 接口完全一致，可放心切换。
:::

### 安装

```bash
# 核心包（地图+定位）
npm install expo-gaode-map

# 导航包（包含地图+导航）🆕
npm install expo-gaode-map-navigation

# Web API 服务 🆕
npm install expo-gaode-map-web-api

# 搜索能力已内置在 expo-gaode-map / expo-gaode-map-navigation 中
```

::: tip 包选择建议
- 只需要地图和定位 → `expo-gaode-map`
- 需要导航功能 → `expo-gaode-map-navigation`（已包含地图）
- 需要跨平台 Web 服务 → `expo-gaode-map-web-api`
- 需要原生搜索 → 直接使用 `expo-gaode-map` 或 `expo-gaode-map-navigation` 内置 API
:::

::: warning Search 模块维护说明
`2.2.33` 是最后一个支持 `expo-gaode-map-search` 单独集成的版本。从下个版本开始，搜索能力随 `expo-gaode-map` / `expo-gaode-map-navigation` 一起维护，独立 search 包不再单独维护。

高德官方 Android SDK 在 `10.0.700` 之后将远程依赖由“地图 + 定位”调整为“地图 + 定位 + 搜索”，依赖地址从 `com.amap.api:3dmap:latest.integration` 调整为 `com.amap.api:3dmap-location-search:latest.integration`。历史项目如仍需独立搜索包，请固定到 `expo-gaode-map-search@2.2.33`。
:::


::: tip 重要提示
- 原生 Key 可以通过 Config Plugin 自动写入，也可以手动配置到 Android 的 `AndroidManifest.xml` 和 iOS 的 `Info.plist`
- 已配置原生 Key 且仅地图/定位场景时，通常不需要再调用 `initSDK({ androidKey, iosKey })`；仅在使用 `expo-gaode-map-web-api` 时再调用 `initSDK({ webKey })`
- 只有未配置原生 Key 时，才需要调用 `initSDK({ androidKey, iosKey })` 后再使用地图能力
- 建议使用真机测试，模拟器可能不支持地图功能，会出现黑屏或闪退等异常情况
:::

查看完整示例 → [快速开始指南](/guide/getting-started) · 导航相关示例请直接查看仓库内 `example-navigation/`

## 选型入口

新 Expo / React Native 项目接入高德地图时，推荐先看 [Expo 高德地图选型指南](/guide/choosing-amap-library) 和 [兼容性矩阵](/guide/compatibility)。如果你正在从 `react-native-amap3d` 迁移，可以直接看 [迁移指南](/guide/migrating-from-react-native-amap3d)。

| 需求 | 推荐 |
| :--- | :--- |
| 地图、定位、覆盖物、离线地图、原生搜索 | `expo-gaode-map` |
| 地图 + 路径规划 + 导航 UI | `expo-gaode-map-navigation` |
| 纯 JS Web API | `expo-gaode-map-web-api` |

## 核心功能模块

### 📦 expo-gaode-map
核心地图包，提供基础地图显示、定位、覆盖物等功能。

[快速开始](/guide/getting-started) · [API 文档](/api/mapview)

### 🚗 expo-gaode-map-navigation 🆕
导航功能包，提供完整的路径规划和导航能力：
- **路径规划**: 驾车、步行、骑行、货车、摩托车、电动车
- **导航视图**: 官方导航界面，实时路况、语音播报
- **独立规划**: 不影响当前导航状态的路径计算

[使用指南](/guide/navigation) · [API 文档](/api/navigation)

### 🌐 expo-gaode-map-web-api 🆕
Web API 服务包，纯 JavaScript 实现，跨平台一致：
- **地理编码**: 地址与坐标相互转换
- **路径规划**: 支持驾车、步行、骑行、公交等
- **POI 搜索**: 关键字搜索、周边搜索、多边形搜索
- **输入提示**: 实时搜索建议

[使用指南](/guide/web-api) · [API 文档](/api/web-api)

### 🔍 内置原生搜索
原生 POI 搜索能力已内置在 `expo-gaode-map` 和 `expo-gaode-map-navigation` 中。

[搜索文档](/api/search)

## 为什么选择 expo-gaode-map？

- ✅ **基于 Expo Modules**: 现代化的开发体验，类型安全
- ✅ **功能完整**: 覆盖地图、导航、搜索等主要功能
- ✅ **模块化设计**: 按需安装，避免不必要的包体积
- ✅ **文档完善**: 详细的中英文档和丰富的示例
- ✅ **积极维护**: 持续更新和社区支持
- ✅ **新老架构支持**: 完美兼容 React Native 新架构（Fabric & TurboModules）
- ✅ **场景丰富**: 可以实现多种地图场景，如打车、外卖、导航等
- ✅ **开源免费**: MIT 协议，可商用

## 社区

- 📝 [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 QQ 群: 952241387

## 致谢

本项目早期开发参考过 [react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d) 等社区项目的生态经验，并在 Expo Modules、新架构、搜索、导航、离线地图和文档体系上继续扩展。
