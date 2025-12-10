# 项目架构文档

本文档详细说明了 expo-gaode-map 项目的 Monorepo 架构和代码结构。

## Monorepo 架构

expo-gaode-map 采用 **pnpm workspaces** 管理的 Monorepo 架构，提供模块化的功能包：

```
expo-gaode-map/
├── packages/
│   ├── core/               # expo-gaode-map（核心包）
│   │   ├── src/            # TypeScript 代码
│   │   ├── ios/            # iOS 原生代码
│   │   ├── android/        # Android 原生代码
│   │   └── plugin/         # Config Plugin
│   │
│   ├── search/             # expo-gaode-map-search（搜索包）
│   │   ├── src/            # TypeScript 代码
│   │   ├── ios/            # iOS 原生代码
│   │   └── android/        # Android 原生代码
│   │
│   ├── navigation/         # expo-gaode-map-navigation（导航包）
│   │   ├── src/            # TypeScript 代码
│   │   ├── ios/            # iOS 原生代码
│   │   └── android/        # Android 原生代码
│   │
│   └── web-api/            # expo-gaode-map-web-api（Web API 包）
│       └── src/            # TypeScript 代码（纯 JS）
│
├── example/                # 示例应用（使用核心包）
├── navigation/             # 导航示例应用
├── website/                # 文档网站
└── pnpm-workspace.yaml     # Workspace 配置
```

### 为什么使用 Monorepo？

1. **按需安装**：用户只安装需要的功能模块，减少包体积
2. **代码共享**：核心类型和工具可以在包之间共享
3. **统一管理**：所有包使用相同的开发工具和配置
4. **版本一致**：依赖版本统一管理，避免冲突

## 核心包（expo-gaode-map）

提供基础的地图显示和定位功能。详细结构请参考原文档。

## 搜索包（expo-gaode-map-search）

提供 POI 搜索和输入提示功能。详细结构请参考原文档。

## 导航包（expo-gaode-map-navigation）

导航包是一个**独立的集成包**，内置完整的地图功能和导航能力。

::: danger 二进制冲突警告
导航包与核心包（expo-gaode-map）存在二进制冲突，**不能同时安装**。需要根据项目需求选择其一。
:::

### 特点

- **集成地图**：内置完整的地图显示功能
- **路径规划**：驾车、步行、骑行、公交路线规划
- **实时导航**：提供导航视图和语音导航
- **独立服务**：支持无地图的独立路径规划

## Web API 包（expo-gaode-map-web-api）

Web API 包是**纯 JavaScript 实现**，通过 HTTP 调用高德 Web 服务 API。

### 特点

- **跨平台**：纯 JS 实现，无原生依赖
- **协同工作**：从核心包或导航包读取 webKey
- **V5 API**：适配最新的路径规划 API
- **类型安全**：完整的 TypeScript 类型定义

### 功能模块

- **地理编码服务**：地址与坐标互转、批量编码
- **路径规划服务**：驾车、步行、骑行、公交路线规划（V5 API）
- **POI 搜索服务**：关键字搜索、周边搜索、详情查询
- **输入提示服务**：POI/公交站点/公交线路提示

## SDK 依赖关系

### Android

```
核心包：com.amap.api:3dmap:10.0.600（统一 SDK）
搜索包：依赖核心包的 SDK
导航包：com.amap.api:navi-3dmap（与核心包冲突）
Web API 包：无原生依赖
```

### iOS

```
核心包：AMapFoundationKit + AMapLocationKit + MAMapKit
搜索包：AMapFoundationKit + AMapSearchKit
导航包：AMapFoundationKit + AMapNaviKit + MAMapKit
Web API 包：无原生依赖
```

## 包之间的关系

```
方案一：核心包 + 扩展包
┌─────────────────────────────────────┐
│         用户应用 (example)           │
└──────┬──────────────┬───────────────┘
       │              │
       ▼              ▼
┌─────────────┐  ┌──────────────────┐
│ expo-gaode- │  │ expo-gaode-map-  │
│    map      │◄─┤     search       │
│  (核心包)    │  │   (搜索包)        │
└──────┬──────┘  └──────────────────┘
       │
       ▼
┌─────────────────────────────┐
│    高德地图 SDK              │
└─────────────────────────────┘

方案二：导航包（独立）
┌─────────────────────────────────────┐
│      导航应用 (navigation)           │
└──────────────────┬──────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ expo-gaode-map-     │
         │   navigation        │
         │ (集成地图+导航)      │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ 高德导航 SDK         │
         │  (navi-3dmap)       │
         └─────────────────────┘

通用：Web API 包
┌─────────────────────────────────────┐
│     任一方案的应用                    │
└──────────────────┬──────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │ expo-gaode-map-     │
         │   web-api           │
         │ (纯 JS，读取 webKey) │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ 高德 Web 服务 API    │
         └─────────────────────┘
```

## 相关文档

- [快速开始](/guide/getting-started) - 快速开始和基本使用
- [配置插件](/guide/config-plugin) - Config Plugin 详细配置
- [初始化指南](/guide/initialization) - SDK 初始化详细说明
- [搜索功能](/guide/search) - 搜索模块使用指南
- [导航 API](/api/navigation) - 导航模块完整文档
- [Web API](/api/web-api) - Web API 服务文档
- [API 文档](/api/) - 完整 API 文档
- [使用示例](/examples/) - 示例代码