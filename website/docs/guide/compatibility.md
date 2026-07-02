---
title: 兼容性矩阵
description: expo-gaode-map、expo-gaode-map-navigation 与 expo-gaode-map-web-api 在 Expo SDK、React Native、新架构、Expo Go、Dev Build 和 EAS Build 下的兼容性说明。
---

# 兼容性矩阵

这份矩阵用于说明 `expo-gaode-map` 系列在不同 Expo SDK、React Native、平台和构建方式下的推荐状态。它不是“所有历史版本都逐项测试过”的承诺，而是一个公开的维护基线：哪些组合已验证、哪些理论支持、哪些属于历史兼容、哪些不支持。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| 已验证 | 当前维护者在示例工程、CI 或发布流程中实际验证过 |
| 推荐 | 当前主线推荐组合，优先修复问题 |
| 理论支持 | 版本范围和工程模型匹配，但未对每个组合逐项验证 |
| 历史兼容 | 为旧项目保留，低频维护，不再作为新项目默认方案 |
| 需自行验证 | 可能可用，但维护者不做默认保证 |
| 不支持 | 工程模型不匹配，或明确不能运行 |

## Expo / React Native 兼容性

| Expo SDK | React Native | 推荐包版本 | iOS | Android | 新架构 | EAS Build | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SDK 56 | RN 0.85.x | `expo-gaode-map@2.2.x` / `expo-gaode-map-navigation@2.0.x` | 示例配置已验证 | 示例配置已验证 | 支持 | 支持 | 推荐 |
| SDK 55 | RN 0.83.x | `expo-gaode-map@2.2.x` / `expo-gaode-map-navigation@2.0.x` | 理论支持 | 理论支持 | 支持 | 支持 | 维护 |
| SDK 54 | RN 0.81 / 0.82 | `expo-gaode-map@2.2.x` / `expo-gaode-map-navigation@2.0.x` | 理论支持 | 理论支持 | 支持 | 支持 | 维护 |
| SDK 53 及以下 | RN 0.79 / 0.80 及更早 | `expo-gaode-map@v1` | 历史兼容 | 历史兼容 | 旧架构为主 | 需自行验证 | 维护 |
| SDK 52 及以下 | 旧版本 RN | `expo-gaode-map@v1` 或更早版本 | 需自行验证 | 需自行验证 | 不推荐 | 需自行验证 | 历史项目 |

::: tip 当前主线
当前仓库示例工程使用 Expo SDK 56、React Native 0.85.x。新项目建议优先使用 SDK 56 + `expo-gaode-map@2.2.x` 或 `expo-gaode-map-navigation@2.0.x`。
:::

## 包兼容性

| 包 | Expo SDK 54+ | Expo SDK 53- | 新架构 | Expo Go | Dev Build | EAS Build |
| --- | --- | --- | --- | --- | --- | --- |
| `expo-gaode-map` | 推荐 2.x | 使用 v1 | 支持 | 不支持 | 支持 | 支持 |
| `expo-gaode-map-navigation` | 推荐 2.x | 需自行验证 | 支持 | 不支持 | 支持 | 支持 |
| `expo-gaode-map-web-api` | 支持 | 支持 | 无原生依赖 | 支持 | 支持 | 支持 |
| `expo-gaode-map-search` | 不再单独维护 | `2.2.33` 历史兼容 | 不推荐 | 不支持 | 需自行验证 | 需自行验证 |

::: warning Expo Go 不支持原生高德 SDK
`expo-gaode-map` 和 `expo-gaode-map-navigation` 都依赖高德原生 SDK，不能在 Expo Go 中运行。请使用 Expo development build、EAS Build 或本地原生构建。
:::

## 已验证环境

| 日期 | 包版本 | Expo SDK | React Native | 平台 | 构建方式 | 新架构 | 结果 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-30 | `expo-gaode-map@2.2.38` | SDK 56 | RN 0.85.x | Android / iOS 配置 | `expo-doctor` + 依赖校验 + 示例工程 | 支持 | 通过 |
| 2026-06-30 | `expo-gaode-map-navigation@2.0.18` | SDK 56 | RN 0.85.x | Android / iOS 配置 | 依赖校验 + navigation 示例 smoke test | 支持 | 通过 |
| 2026-06-30 | `expo-gaode-map-web-api@2.0.x` | SDK 56 | RN 0.85.x | JS / Native 环境 | 依赖校验 + 示例工程 | 无原生依赖 | 通过 |

## 发版前验证清单

每次发布前建议至少完成以下检查。不是每次都要人工点完所有 API，但核心路径应保持可构建、可运行、可排查。

```md
- [ ] yarn lint
- [ ] yarn test
- [ ] yarn build:core
- [ ] yarn build:navigation
- [ ] yarn build:web-api
- [ ] yarn test:example-navigation
- [ ] Android example local build 或 EAS Build 验证
- [ ] iOS example local build 或 EAS Build 验证
- [ ] MapView 可渲染
- [ ] 定位权限流程可用
- [ ] Marker / Polyline / Polygon 基础覆盖物 smoke test
- [ ] 原生搜索 smoke test
- [ ] navigation 示例 smoke test（发布 navigation 包时）
- [ ] website 文档构建通过
```

## 版本选择建议

- 新 Expo 项目：优先使用最新 Expo SDK 与 `expo-gaode-map@2.x`。
- 需要导航：直接使用 `expo-gaode-map-navigation`，不要同时安装 core 包。
- Expo SDK 53 及以下：优先固定 `expo-gaode-map@v1`，并将项目升级计划纳入后续迭代。
- 独立 `expo-gaode-map-search`：只建议历史项目固定到 `2.2.33`，新项目请直接使用 core / navigation 内置搜索 API。

## 相关文档

- [选型指南](/guide/choosing-amap-library)
- [快速开始](/guide/getting-started)
- [初始化指南](/guide/initialization)
- [Config Plugin](/guide/config-plugin)
- [从 react-native-amap3d 迁移](/guide/migrating-from-react-native-amap3d)
