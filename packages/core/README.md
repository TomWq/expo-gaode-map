# expo-gaode-map

一个功能完整的高德地图 React Native 组件库，**基于 Expo Modules 开发**，采用 Monorepo 架构，提供地图显示、定位、搜索、导航、Web API 等完整功能。

> 💡 本组件使用 [Expo Modules API](https://docs.expo.dev/modules/overview/) 构建，提供了类型安全的原生模块接口和优秀的开发体验。

## 📖 完整文档

**👉 [在线文档网站](https://TomWq.github.io/expo-gaode-map/)** · **👉 [示例仓库](https://github.com/TomWq/expo-gaode-map-example)**

包含完整的 API 文档、使用指南和示例代码：
- [快速开始](https://TomWq.github.io/expo-gaode-map/guide/getting-started.html)
- [初始化指南](https://TomWq.github.io/expo-gaode-map/guide/initialization.html)
- [搜索功能](https://TomWq.github.io/expo-gaode-map/guide/search.html)
- [导航功能](https://TomWq.github.io/expo-gaode-map/guide/navigation.html)
- [Web API](https://TomWq.github.io/expo-gaode-map/guide/web-api.html)
- [API 参考](https://TomWq.github.io/expo-gaode-map/api/)
- [使用示例](https://TomWq.github.io/expo-gaode-map/examples/)

## ✨ 主要特性

### 核心功能（expo-gaode-map）
- ✅ 完整的地图功能（多种地图类型、手势控制、相机操作）
- ✅ 精准定位（连续定位、单次定位、坐标转换）
- ✅ 丰富的覆盖物（Circle、Marker、Polyline、Polygon、HeatMap、Cluster 等）
- ✅ 完整的 TypeScript 类型定义
- ✅ 跨平台支持（Android、iOS）
- ✅ 同时支持 React Native 新旧架构（Paper & Fabric）

### 可选模块
- 🔍 **搜索功能**（expo-gaode-map-search）- POI 搜索、周边搜索、关键字搜索、地理编码等
- 🧭 **导航功能**（expo-gaode-map-navigation）- 驾车、步行、骑行、货车路径规划，实时导航
- 🌐 **Web API**（expo-gaode-map-web-api）- 纯 JavaScript 实现的路径规划、地理编码、POI 搜索等

## 📦 安装

### 方案一：仅使用地图和定位（核心包）

```bash
npm install expo-gaode-map

# 可选模块
npm install expo-gaode-map-search      # 搜索功能
npm install expo-gaode-map-web-api     # Web API
```

### 方案二：使用导航功能（导航包，已包含地图功能）

```bash
npm install expo-gaode-map-navigation  # 包含地图+导航

# 可选模块
npm install expo-gaode-map-web-api     # Web API
```

> ⚠️ **重要**：`expo-gaode-map` 和 `expo-gaode-map-navigation` 由于 SDK 冲突不能同时安装，二选一使用。

### Config Plugin 配置（推荐）

在 `app.json` 中配置，自动设置原生 API Key 和权限：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",  // 或 "expo-gaode-map-navigation"
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

## 🚀 快速开始

详细的初始化和使用指南请查看：
- 📖 [快速开始文档](https://TomWq.github.io/expo-gaode-map/guide/getting-started.html)
- 💻 [完整示例代码](https://github.com/TomWq/expo-gaode-map-example)

## 📚 功能模块对比

| 功能 | 核心包 | 搜索包 | 导航包 | Web API |
|-----|-------|-------|-------|---------|
| 地图显示 | ✅ | ❌ | ✅ | ❌ |
| 定位 | ✅ | ❌ | ✅ | ❌ |
| 覆盖物 | ✅ | ❌ | ✅ | ❌ |
| POI 搜索 | ❌ | ✅ | ❌ | ✅ |
| 地理编码 | ❌ | ✅ | ❌ | ✅ |
| 路径规划 | ❌ | ❌ | ✅ | ✅ |
| 实时导航 | ❌ | ❌ | ✅ | ❌ |
| 平台 | 原生 | 原生 | 原生 | Web/原生 |

## 🏗️ Monorepo 架构

```
expo-gaode-map/
├── packages/
│   ├── core/                    # expo-gaode-map（核心包）
│   │   └── 地图显示、定位、覆盖物
│   ├── search/                  # expo-gaode-map-search（搜索包）
│   │   └── POI 搜索、地理编码
│   ├── navigation/              # expo-gaode-map-navigation（导航包）
│   │   └── 地图+导航（替代 core）
│   └── web-api/                 # expo-gaode-map-web-api（Web API）
│       └── 纯 JS 实现的路径规划等
└── 注意：core 和 navigation 不能同时安装
```

## 💡 常见问题

### 1. 核心包和导航包如何选择？

- **只需要地图和定位** → 安装 `expo-gaode-map`
- **需要导航功能** → 安装 `expo-gaode-map-navigation`（已包含地图功能）
- **不能同时安装**：两个包由于原生 SDK 冲突，只能选择其一

### 2. 搜索功能和 Web API 有什么区别？

- **搜索包**（`expo-gaode-map-search`）：原生实现，性能更好，需要配置原生环境
- **Web API**（`expo-gaode-map-web-api`）：纯 JavaScript，无需原生配置，跨平台更好

### 3. 如何配置 API Key？

推荐使用 Config Plugin 自动配置，详见：[初始化指南](https://TomWq.github.io/expo-gaode-map/guide/initialization.html)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 🔗 相关链接

- [在线文档](https://TomWq.github.io/expo-gaode-map/)
- [GitHub 仓库](https://github.com/TomWq/expo-gaode-map)
- [高德地图开放平台](https://lbs.amap.com/)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## 🙏 致谢

本项目在开发过程中参考了以下优秀项目：

- **[react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d)** - 一个优秀的 React Native 高德地图组件

感谢这些开源项目的贡献者们！

## 📮 反馈与支持

如果你在使用过程中遇到问题或有任何建议，欢迎：

- 📝 提交 [GitHub Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 参与 [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- ⭐ 给项目点个 Star 支持一下
