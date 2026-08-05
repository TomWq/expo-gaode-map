# expo-gaode-map

面向中国大陆地图业务的 Expo / React Native 高德地图原生组件库，基于 **Expo Modules API** 构建，提供地图显示、定位、覆盖物、原生搜索、离线地图和几何工具。

> Expo / React Native AMap (Gaode Map) native library for maps, location, overlays, native search, offline maps, and geometry utilities on Android and iOS.

> 💡 本组件使用 [Expo Modules API](https://docs.expo.dev/modules/overview/) 构建，提供了类型安全的原生模块接口和优秀的开发体验。

## 📖 完整文档

**👉 [在线文档网站](https://tomwq.github.io/expo-gaode-map/)** · **👉 [Core 示例](https://github.com/TomWq/expo-gaode-map/tree/main/example)**

包含完整的 API 文档、使用指南和示例代码：
- [选型指南](https://tomwq.github.io/expo-gaode-map/guide/choosing-amap-library.html)
- [兼容性矩阵](https://tomwq.github.io/expo-gaode-map/guide/compatibility.html)
- [快速开始](https://tomwq.github.io/expo-gaode-map/guide/getting-started.html)
- [初始化指南](https://tomwq.github.io/expo-gaode-map/guide/initialization.html)
- [搜索功能](https://tomwq.github.io/expo-gaode-map/guide/search.html)
- [API 参考](https://tomwq.github.io/expo-gaode-map/api/)

## 适用范围与限制

- 只需要地图、定位、覆盖物、原生搜索或离线地图时，使用 `expo-gaode-map`。
- 需要路径规划或实时导航时，改用 `expo-gaode-map-navigation`；两个原生包不能同时安装。
- 原生地图能力不支持 Expo Go，需要 Development Build、EAS Build 或本地原生构建。
- 使用前需要申请高德 Android/iOS Key，并在首次调用 SDK 前完成隐私同意流程。
- 主要面向 Android/iOS 中国大陆高德地图业务；需要通用全球地图或多地图供应商抽象时，应评估其他方案。

## ✨ 主要特性

### 核心功能（expo-gaode-map）
- ✅ 完整的地图功能（多种地图类型、手势控制、相机操作，离线地图,自定义地图样式）
- ✅ 定位（支持精准/粗略定位、连续定位、单次定位、坐标转换和定位蓝点配置）
- ✅ 丰富的覆盖物（Circle、Marker、Polyline、Polygon、HeatMap、Cluster 等）
- ✅ 友好的错误提示系统（详细的解决方案和文档链接）
- ✅ 完整的 TypeScript 类型定义
- ✅ 跨平台支持（Android、iOS）
- ✅ 同时支持 React Native 新旧架构（Paper & Fabric）
- ✅ 核心逻辑配套 Jest 测试和持续集成检查
- ✅ 支持自定义Marker覆盖物
- ✅ 默认实现了优化地图加载，减少内存占用
- ✅ 几何运算（距离/面积、点在圆/多边形、质心/边界、路径长度/抽稀、GeoHash、瓦片/像素坐标转换、最近点、热力网格等，由 C++ 实现）
- ✅ 丰富的使用案例
- ✅ 更多内容和功能请查看 [完整文档](https://TomWq.github.io/expo-gaode-map/)



### 可选模块
- 🔍 **搜索功能** - 已内置在 `expo-gaode-map` 中，提供 POI 搜索、周边搜索、关键字搜索、地理编码等
- 🧭 **导航功能**（expo-gaode-map-navigation）- 驾车、步行、骑行、货车路径规划，实时导航
- 🌐 **Web API**（expo-gaode-map-web-api）- 纯 JavaScript 实现的路径规划、地理编码、POI 搜索等

> ⚠️ **Search 模块维护说明**
>
> 从 `2.2.34` 开始，搜索能力已经集成到 `expo-gaode-map`（core）和 `expo-gaode-map-navigation` 的 map 能力中，`expo-gaode-map-search` 将不再作为独立模块继续维护。`2.2.33` 是最后一个支持 `expo-gaode-map-search` 单独集成的版本；新项目请直接从 `expo-gaode-map` 或 `expo-gaode-map-navigation` 导入搜索 API。
>
> 高德官方 Android SDK 在 `10.0.700` 之后将远程依赖由“地图 + 定位”调整为“地图 + 定位 + 搜索”，依赖地址从 `com.amap.api:3dmap:latest.integration` 调整为 `com.amap.api:3dmap-location-search:latest.integration`。继续单独维护 search 模块会带来重复合包和依赖冲突成本，因此搜索能力改为随 core / navigation 一起维护。

## 📦 安装

> ⚠️ **版本兼容性说明**：
> - 如果你的项目使用 **Expo SDK 54 及以上**，请安装 默认的 版本。
> - 如果你的项目使用 **Expo SDK 53 及以下**（如 50, 51, 52, 53），请使用 **V1** 版本（Tag: `v1`）。
>   ```bash
>   npm install expo-gaode-map@v1.2.3
>   ```
>   **说明**：V1 版本不支持世界地图，只是为了兼容佬项目使用，请尽快升级你的 expo 版本到 54 及以上，使用最新的 V2 版本。

### 方案一：仅使用地图和定位（核心包）

```bash
npm install expo-gaode-map

# 可选模块
npm install expo-gaode-map-web-api     # Web API
```

### 方案二：使用导航功能（导航包，已包含地图功能）

```bash
npm install expo-gaode-map-navigation  # 包含地图+导航

# 可选模块
npm install expo-gaode-map-web-api     # Web API
```

> ⚠️ **重要**：`expo-gaode-map` 和 `expo-gaode-map-navigation` 由于 SDK 冲突不能同时安装，二选一使用。

> [!IMPORTANT]
> **离线地图与原生 SDK 版本**：`expo-gaode-map@2.2.45` 使用 Android 地图 SDK `10.1.700` 和 iOS 地图 SDK `10.1.600`。从 `expo-gaode-map@2.3.0` 开始，Android 和 iOS 地图 SDK 升级为 `11.2.000`。根据高德官方客服回复，从地图 SDK `11.1.200` 开始，离线地图下载需要联系高德商务单独开通权限；不使用离线地图的项目无需申请。需要离线地图但不准备申请权限的项目，请继续固定使用 `expo-gaode-map@2.2.45`。具体政策以高德最新官方说明及商务答复为准。

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
- 💻 [地图示例工程](https://github.com/TomWq/expo-gaode-map/tree/main/example)

## 定位精度策略

`checkLocationPermission()` 返回的 `granted: true` 同时包含精准定位和粗略定位。通过 `accuracyAuthorization` 区分当前精度：`full` 为精准定位，`reduced` 为粗略定位，`none` 为无定位权限。

- 地图定位点、当前位置、逆地理编码和区域级业务应接受粗略定位，不要阻止整个地图页面加载。
- 米级签到、精确围栏、道路匹配、精确上车点或正式导航等功能，可以在具体功能入口要求精准定位。
- 只有完全未授权时才调用 `requestLocationPermission()`；已经是粗略定位时，不要循环请求，用户确认后使用 `openAppSettings()` 引导到系统设置。

完整决策表和代码示例见[定位 API](https://tomwq.github.io/expo-gaode-map/api/location.html#粗略定位与精准定位如何选择)，可运行示例见 `example` 工程中的“权限基础示例”。

## 📚 功能模块对比

| 功能 | 核心包 | 搜索包 | 导航包 | Web API |
|-----|-------|-------|-------|---------|
| 地图显示 | ✅ | ❌ | ✅ | ❌ |
| 定位 | ✅ | ❌ | ✅ | ❌ |
| 覆盖物 | ✅ | ❌ | ✅ | ❌ |
| POI 搜索 | ✅ | ⚠️ 2.2.33 及以下 | ✅ | ✅ |
| 地理编码 | ✅ | ⚠️ 2.2.33 及以下 | ✅ | ✅ |
| 路径规划 | ❌ | ❌ | ✅ | ✅ |
| 实时导航 | ❌ | ❌ | ✅ | ❌ |
| 平台 | 原生 | 原生 | 原生 | Web/原生 |

## 🏗️ Monorepo 架构

```
expo-gaode-map/
├── packages/
│   ├── core/                    # expo-gaode-map（核心包）
│   │   └── 地图显示、定位、覆盖物、搜索
│   ├── search/                  # expo-gaode-map-search（独立搜索包，2.2.33 后不再维护）
│   │   └── POI 搜索、地理编码（历史兼容）
│   ├── navigation/              # expo-gaode-map-navigation（导航包）
│   │   └── 地图+搜索+导航（替代 core）
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

- **内置原生搜索**（`expo-gaode-map` / `expo-gaode-map-navigation`）：原生实现，性能更好，无需网络请求，需要配置原生环境
- **独立搜索包**（`expo-gaode-map-search`）：仅建议历史项目固定 `2.2.33` 使用，后续不再单独维护
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

**完整错误处理指南**：[错误处理文档](https://tomwq.github.io/expo-gaode-map/guide/error-handling.html)

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


## 📚 文档与资源

- [在线文档](https://tomwq.github.io/expo-gaode-map/)
- [错误处理指南](https://tomwq.github.io/expo-gaode-map/guide/error-handling.html)
- [测试与质量保证](https://tomwq.github.io/expo-gaode-map/guide/testing.html)
- [GitHub 仓库](https://github.com/TomWq/expo-gaode-map)
- [地图示例工程](https://github.com/TomWq/expo-gaode-map/tree/main/example)
- [导航示例工程](https://github.com/TomWq/expo-gaode-map/tree/main/example-navigation)
- [高德地图开放平台](https://lbs.amap.com/)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## 🙏 致谢

本项目在开发过程中参考了以下优秀项目：

- **[react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d)** - 一个优秀的 React Native 高德地图组件

感谢这些开源项目的贡献者们！

## 📮 反馈与支持

如果你在使用过程中遇到问题或有任何建议，欢迎：

- 📝 提交 [GitHub Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 查看并参与 [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- ⭐ 给项目点个 Star 支持一下
- QQ：582752848 

## 📄 License

MIT
