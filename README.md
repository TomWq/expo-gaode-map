<div align="center">

# expo-gaode-map

A fully-featured Amap (Gaode Map) React Native library, **built with Expo Modules API**, using Monorepo architecture. It provides complete functionality including map display, location, search, navigation, and Web API.

> 💡 This library is built using [Expo Modules API](https://docs.expo.dev/modules/overview/), providing type-safe native module interfaces and an excellent developer experience.

---

<!-- Language Switch Button -->
<div style="margin: 20px 0;">
  <a href="#english" onclick="showLanguage('english')" style="margin: 0 10px; padding: 8px 16px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">English</a>
  <a href="#chinese" onclick="showLanguage('chinese')" style="margin: 0 10px; padding: 8px 16px; background-color: #6c757d; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">中文</a>
</div>

<script>
function showLanguage(lang) {
  var englishContent = document.getElementById('english-content');
  var chineseContent = document.getElementById('chinese-content');
  var englishBtn = document.querySelector('a[href="#english"]');
  var chineseBtn = document.querySelector('a[href="#chinese"]');
  
  if (lang === 'english') {
    englishContent.style.display = 'block';
    chineseContent.style.display = 'none';
    englishBtn.style.backgroundColor = '#007bff';
    chineseBtn.style.backgroundColor = '#6c757d';
  } else {
    englishContent.style.display = 'none';
    chineseContent.style.display = 'block';
    englishBtn.style.backgroundColor = '#6c757d';
    chineseBtn.style.backgroundColor = '#007bff';
  }
}

// Auto-detect browser language
var userLang = navigator.language || navigator.userLanguage;
if (userLang && userLang.startsWith('zh')) {
  showLanguage('chinese');
} else {
  showLanguage('english');
}
</script>

</div>

---

## <span id="english">English Content</span>

<div id="english-content">

## 📖 Complete Documentation

**👉 [Online Documentation](https://TomWq.github.io/expo-gaode-map/)** · **👉 [Example Repository](https://github.com/TomWq/expo-gaode-map-example)**

Includes complete API documentation, usage guides, and example code:
- [Getting Started](https://TomWq.github.io/expo-gaode-map/guide/getting-started.html)
- [Initialization Guide](https://TomWq.github.io/expo-gaode-map/guide/initialization.html)
- [Search Functionality](https://TomWq.github.io/expo-gaode-map/guide/search.html)
- [Navigation Functionality](https://TomWq.github.io/expo-gaode-map/guide/navigation.html)
- [Web API](https://TomWq.github.io/expo-gaode-map/guide/web-api.html)
- [API Reference](https://TomWq.github.io/expo-gaode-map/api/)
- [Usage Examples](https://github.com/TomWq/expo-gaode-map-example)

## ✨ Key Features

### Core Features (expo-gaode-map)
- ✅ Complete map functionality (multiple map types, gesture controls, camera operations, offline maps)
- ✅ Precise location (continuous location, single location, coordinate conversion)
- ✅ Rich overlays (Circle, Marker, Polyline, Polygon, HeatMap, Cluster, etc.)
- ✅ Friendly error notification system (detailed solutions and documentation links)
- ✅ Complete TypeScript type definitions
- ✅ Cross-platform support (Android, iOS)
- ✅ Supports both new and old React Native architectures (Paper & Fabric)
- ✅ High test coverage (75.7%, 207 unit tests)
- ✅ User-friendly error notification system
- ✅ Custom Marker overlay support
- ✅ Optimized map loading by default to reduce memory usage

### Optional Modules
- 🔍 **Search Functionality** (expo-gaode-map-search) - POI search, nearby search, keyword search, geocoding, etc.
- 🧭 **Navigation Functionality** (expo-gaode-map-navigation) - Driving, walking, cycling, truck route planning, real-time navigation
- 🌐 **Web API** (expo-gaode-map-web-api) - Pure JavaScript implementation of route planning, geocoding, POI search, etc.

## 📦 Installation

### Option 1: Map and Location Only (Core Package)

```bash
npm install expo-gaode-map

# Optional modules
npm install expo-gaode-map-search      # Search functionality
npm install expo-gaode-map-web-api     # Web API
```

### Option 2: Navigation Functionality (Navigation Package, Includes Map)

```bash
npm install expo-gaode-map-navigation  # Includes map + navigation

# Optional modules
npm install expo-gaode-map-web-api     # Web API
```

> ⚠️ **Important**: `expo-gaode-map` and `expo-gaode-map-navigation` cannot be installed simultaneously due to SDK conflicts. Choose one.

### Config Plugin Configuration (Recommended)

Configure in `app.json` to automatically set up native API keys and permissions:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",  // or "expo-gaode-map-navigation"
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key"
        }
      ]
    ]
  }
}
```

After configuration, rebuild:

```bash
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```

## 🚀 Quick Start

For detailed initialization and usage guides, please see:
- 📖 [Getting Started Documentation](https://TomWq.github.io/expo-gaode-map/guide/getting-started.html)
- 💻 [Complete Example Code](https://github.com/TomWq/expo-gaode-map-example)

## 📚 Feature Module Comparison

| Feature | Core Package | Search Package | Navigation Package | Web API |
|---------|-------------|----------------|-------------------|----------|
| Map Display | ✅ | ❌ | ✅ | ❌ |
| Location | ✅ | ❌ | ✅ | ❌ |
| Overlays | ✅ | ❌ | ✅ | ❌ |
| POI Search | ❌ | ✅ | ❌ | ✅ |
| Geocoding | ❌ | ✅ | ❌ | ✅ |
| Route Planning | ❌ | ❌ | ✅ | ✅ |
| Real-time Navigation | ❌ | ❌ | ✅ | ❌ |
| Platform | Native | Native | Native | Web/Native |

## 🏗️ Monorepo Architecture

```
expo-gaode-map/
├── packages/
│   ├── core/                    # expo-gaode-map (Core package)
│   │   └── Map display, location, overlays
│   ├── search/                  # expo-gaode-map-search (Search package)
│   │   └── POI search, geocoding
│   ├── navigation/              # expo-gaode-map-navigation (Navigation package)
│   │   └── Map + navigation (replaces core)
│   └── web-api/                 # expo-gaode-map-web-api (Web API)
│       └── Pure JS route planning, etc.
└── Note: core and navigation cannot be installed together
```

## 💡 FAQ

### 1. How to choose between Core and Navigation packages?

- **Only need map and location** → Install `expo-gaode-map`
- **Need navigation functionality** → Install `expo-gaode-map-navigation` (includes map functionality)
- **Cannot install both**: Due to native SDK conflicts, you can only choose one

### 2. What's the difference between Search and Web API?

- **Search package** (`expo-gaode-map-search`): Native implementation, better performance, requires native environment configuration
- **Web API** (`expo-gaode-map-web-api`): Pure JavaScript, no native configuration needed, better cross-platform compatibility

### 3. How to configure API keys?

It's recommended to use Config Plugin for automatic configuration. See: [Initialization Guide](https://TomWq.github.io/expo-gaode-map/guide/initialization.html)

### 4. How to handle errors? 🆕

`expo-gaode-map` provides a comprehensive error handling system:

```typescript
import ExpoGaodeMapModule, { GaodeMapError, ErrorType } from 'expo-gaode-map';

try {
  await ExpoGaodeMapModule.getCurrentLocation();
} catch (error) {
  if (error instanceof GaodeMapError) {
    console.error(error.message);  // Friendly error message
    console.log(error.solution);   // Detailed solution
    console.log(error.docUrl);     // Related documentation link
  }
}
```

**Complete Error Handling Guide**: [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md)

Supported error types:
- `SDK_NOT_INITIALIZED` - SDK not initialized
- `INVALID_API_KEY` - API key configuration error
- `PERMISSION_DENIED` - Permission not granted
- `LOCATION_FAILED` - Location failed
- `MAP_VIEW_NOT_INITIALIZED` - Map view not initialized
- More error types...

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT

## 📚 Documentation & Resources

- [Online Documentation](https://TomWq.github.io/expo-gaode-map/)
- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md) 🆕
- [GitHub Repository](https://github.com/TomWq/expo-gaode-map)
- [Example Project](https://github.com/TomWq/expo-gaode-map-example)
- [Amap Open Platform](https://lbs.amap.com/)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## 🙏 Acknowledgments

This project referenced the following excellent projects during development:

- **[react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d)** - An excellent React Native Amap component

Thank you to all contributors of these open-source projects!

## 📮 Feedback & Support

If you encounter any issues or have any suggestions during usage, please feel free to:

- 📝 Submit a [GitHub Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 Join [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- ⭐ Give the project a Star to show your support

</div>

---

## <span id="chinese">中文内容</span>

<div id="chinese-content" style="display: none;">

## 📖 完整文档

**👉 [在线文档网站](https://TomWq.github.io/expo-gaode-map/)** · **👉 [示例仓库](https://github.com/TomWq/expo-gaode-map-example)**

包含完整的 API 文档、使用指南和示例代码：
- [快速开始](https://TomWq.github.io/expo-gaode-map/guide/getting-started.html)
- [初始化指南](https://TomWq.github.io/expo-gaode-map/guide/initialization.html)
- [搜索功能](https://TomWq.github.io/expo-gaode-map/guide/search.html)
- [导航功能](https://TomWq.github.io/expo-gaode-map/guide/navigation.html)
- [Web API](https://TomWq.github.io/expo-gaode-map/guide/web-api.html)
- [API 参考](https://TomWq.github.io/expo-gaode-map/api/)
- [使用示例](https://github.com/TomWq/expo-gaode-map-example)

## ✨ 主要特性

### 核心功能（expo-gaode-map）
- ✅ 完整的地图功能（多种地图类型、手势控制、相机操作，离线地图）
- ✅ 精准定位（连续定位、单次定位、坐标转换）
- ✅ 丰富的覆盖物（Circle、Marker、Polyline、Polygon、HeatMap、Cluster 等）
- ✅ 友好的错误提示系统（详细的解决方案和文档链接）
- ✅ 完整的 TypeScript 类型定义
- ✅ 跨平台支持（Android、iOS）
- ✅ 同时支持 React Native 新旧架构（Paper & Fabric）
- ✅ 高测试覆盖率（75.7%，207 个单元测试）
- ✅ 友好的错误提示系统
- ✅ 支持自定义Marker覆盖物
- ✅ 默认优化地图加载，减少内存占用

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

### 4. 如何处理错误？ 🆕

`expo-gaode-map` 提供了完善的错误处理系统：

```typescript
import ExpoGaodeMapModule, { GaodeMapError, ErrorType } from 'expo-gaode-map';

try {
  await ExpoGaodeMapModule.getCurrentLocation();
} catch (error) {
  if (error instanceof GaodeMapError) {
    console.error(error.message);  // 友好的错误信息
    console.log(error.solution);   // 详细的解决方案
    console.log(error.docUrl);     // 相关文档链接
  }
}
```

**完整错误处理指南**：[ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md)

支持的错误类型：
- `SDK_NOT_INITIALIZED` - SDK 未初始化
- `INVALID_API_KEY` - API Key 配置错误
- `PERMISSION_DENIED` - 权限未授予
- `LOCATION_FAILED` - 定位失败
- `MAP_VIEW_NOT_INITIALIZED` - 地图视图未初始化
- 更多错误类型...

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 📚 文档与资源

- [在线文档](https://TomWq.github.io/expo-gaode-map/)
- [错误处理指南](./ERROR_HANDLING_GUIDE.md) 🆕
- [GitHub 仓库](https://github.com/TomWq/expo-gaode-map)
- [示例项目](https://github.com/TomWq/expo-gaode-map-example)
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

</div>
