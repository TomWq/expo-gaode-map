# expo-gaode-map

一个功能完整的高德地图 React Native 组件库，**基于 Expo Modules 开发**，提供地图显示、定位、搜索、导航、路线规划、POI搜索等完整功能。

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
- [使用示例](https://github.com/TomWq/expo-gaode-map-example)

## ✨ 主要特性

### 核心功能（expo-gaode-map）
- ✅ 完整的地图功能（多种地图类型、手势控制、相机操作，离线地图,自定义地图样式）
- ✅ 精准定位（连续定位、单次定位、坐标转换，定位蓝点配置）
- ✅ 丰富的覆盖物（Circle、Marker、Polyline、Polygon、HeatMap、Cluster 等）
- ✅ 友好的错误提示系统（详细的解决方案和文档链接）
- ✅ 完整的 TypeScript 类型定义
- ✅ 跨平台支持（Android、iOS）
- ✅ 同时支持 React Native 新旧架构（Paper & Fabric）
- ✅ 高测试覆盖率（75.7%，207 个单元测试）
- ✅ 支持自定义Marker覆盖物
- ✅ 默认实现了优化地图加载，减少内存占用
- ✅ 几何运算（距离计算、面积计算等，由 C++ 实现）
- ✅ 丰富的使用案例
- ✅ 提供AI编程助手，帮助开发者快速集成和使用（https://TomWq.github.io/expo-gaode-map/guide/ai-skills.html）
- ✅ 更多内容和功能请查看 [完整文档](https://TomWq.github.io/expo-gaode-map/)



### 可选模块
- 🔍 **搜索功能**（expo-gaode-map-search）- POI 搜索、周边搜索、关键字搜索、地理编码等
- 🧭 **导航功能**（expo-gaode-map-navigation）- 驾车、步行、骑行、货车路径规划，实时导航
- 🌐 **Web API**（expo-gaode-map-web-api）- 纯 JavaScript 实现的路径规划、地理编码、POI 搜索等

## 📦 安装

> ⚠️ **版本兼容性说明**：
> - 如果你的项目使用 **Expo SDK 54 及以上**，请安装 默认的 版本。
> - 如果你的项目使用 **Expo SDK 53 及以下**（如 50, 51, 52, 53），请使用 **V1** 版本（Tag: `v1`）。
>   ```bash
>   npm install expo-gaode-map@v1
>   ```
>   **说明**：V1 版本除了不支持**世界地图**功能外，其余 API 与 V2 (Latest) 版本完全一致。

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
│       └── 纯 JS 实现的POI 搜索、地理编码、路径规划等
└── 注意：core 和 navigation 不能同时安装
```

## 💡 常见问题

### 1. 核心包和导航包如何选择？

- **只需要地图和定位** → 安装 `expo-gaode-map`
- **需要导航功能** → 安装 `expo-gaode-map-navigation`（已包含地图功能）
- **不能同时安装**：两个包由于原生 SDK 冲突，只能选择其一

### 2. 搜索功能和 Web API 有什么区别？

- **搜索包**（`expo-gaode-map-search`）：原生实现，性能更好，无需网络请求，需要配置原生环境
- **Web API**（`expo-gaode-map-web-api`）：纯 JavaScript，无需原生配置，跨平台更好，需要网络请求，但功能更加强大和完善

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
### 5. 地图在模拟器上显示异常(可能会出现黑屏或闪退)

建议：
- 确保在真机上测试，模拟器可能不支持地图功能
- 检查是否正确配置了 API Key

**完整错误处理指南**：[ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md)

### 6. Google Play 版本支持

如果你的应用需要上架 Google Play，需要使用高德地图 Google Play 版本的 SDK（通过了 Google Play 的合规审核）。

#### 步骤 1：下载 SDK
前往 [高德开放平台](https://lbs.amap.com/api/android-sdk/download) 下载包含 Google Play 版本的 SDK（通常是合包，包含地图、搜索、定位功能）。

#### 步骤 2：放入项目
将下载的 `.aar` 或 `.jar` 文件放入你的 Expo 项目根目录下的 `libs` 文件夹中（如果没有则创建），例如 `libs/AMap_3DMap_GooglePlay.aar`。

#### 步骤 3：配置插件
在 `app.json` 中配置 `customMapSdkPath`：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key",
          "customMapSdkPath": "./libs/AMap_3DMap_GooglePlay.aar" 
        }
      ]
    ]
  }
}
```

> **注意**：Google Play 版本的 SDK 通常是合包（包含地图+搜索+定位）。如果你的项目中引入了其他高德相关依赖（如 `expo-gaode-map-search`），可能会导致类冲突。插件会自动处理大部分冲突，但如果依然遇到 `Duplicate class` 错误，请检查是否引入了多余的依赖。

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
- [示例项目(地图)](https://github.com/TomWq/expo-gaode-map-example)
- [示例项目(导航)](https://github.com/TomWq/expo-gaode-map-navigation-example)
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
- 群：952241387 （欢迎加入，交流使用经验、问题反馈等）
