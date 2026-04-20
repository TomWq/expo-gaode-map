# expo-gaode-map

> 面向 React Native / Expo 的高德地图（AMap）解决方案，覆盖地图渲染、定位、搜索、导航与离线地图能力。

一个功能完整的高德地图 React Native 组件库，**基于 Expo Modules 开发**，采用 Monorepo 架构，提供地图显示、定位、搜索、导航、Web API 等完整功能。

> 💡 本组件使用 [Expo Modules API](https://docs.expo.dev/modules/overview/) 构建，提供了类型安全的原生模块接口和优秀的开发体验。

<div align="center">

[🇺🇸 English README](README.md)

</div>

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

## 🚀 为什么选择 expo-gaode-map？

> 如果你的目标是「中国地图业务 + Expo 集成 + 新架构可用 + 导航/搜索/离线一体化」，  
> `expo-gaode-map` 更接近可直接落地的默认方案。

| 对比项 | expo-gaode-map | react-native-maps（通用地图） | react-native-amap3d（社区老库） |
|---|---|---|---|
| 中国地图业务（高德）适配深度 | ✅ 原生高德能力为核心设计 | ⚠️ 通用抽象为主；中国大陆 Android 场景常受 Google Maps/GMS 可用性限制 | ✅ 基础高德能力 |
| Expo 集成体验 | ✅ Expo Modules + Config Plugin（Key/权限自动化） | ⚠️ 需按项目自行补配置 | ⚠️ 多数项目需手动适配 |
| React Native 新架构（Fabric/TurboModules） | ✅ 明确支持新旧架构 | ✅/⚠️ 以其官方支持范围为准 | ⚠️ 未见明确的新架构支持声明 |
| 一体化能力（地图+搜索+导航+Web API） | ✅ 同仓四包协同维护 | ❌ 常需多库拼装 | ❌ 主要是地图层能力 |
| 导航能力（路径规划 + 导航视图） | ✅ `expo-gaode-map-navigation` | ❌ | ❌ |
| 搜索能力（POI/周边/地理编码） | ✅ `expo-gaode-map-search` + `web-api` | ❌ | ⚠️ 需额外组合 |
| 离线地图 | ✅ 内置能力与 API | ⚠️ 通常需额外方案 | ⚠️ 依 fork/版本差异 |
| 几何工具链（TS + C++） | ✅ 内置（距离/面积/抽稀/最近点等） | ❌ | ❌ |
| 隐私合规 + 错误提示体系 | ✅ 内置错误类型、解决方案与文档链接 | ⚠️ 需业务侧自行建设 | ⚠️ 需业务侧自行建设 |
| 维护信号 | ✅ 持续迭代、文档和示例同步 | ✅ 活跃但目标是通用地图 | ⚠️ 上游 [README](https://github.com/qiuxiang/react-native-amap3d) 标注“只维护，不加新功能” |

> 注：对比基于公开文档与常见工程实践，结论时间为 2026-04-15。

## ✨ 主要特性

### 核心功能（expo-gaode-map）
- ✅ 完整的地图功能（多种地图类型、手势控制、相机操作，离线地图,自定义地图样式）
- ✅ 精准定位（连续定位、单次定位、坐标转换，定位蓝点配置）
- ✅ 丰富的覆盖物（Circle、Marker、Polyline、Polygon、HeatMap、Cluster 等）
- ✅ 友好的错误提示系统（详细的解决方案和文档链接）
- ✅ 完整的 TypeScript 类型定义
- ✅ 跨平台支持（Android、iOS）
- ✅ 同时支持 React Native 新旧架构（Paper & Fabric）
- ✅ 高测试覆盖率
- ✅ 支持自定义Marker覆盖物
- ✅ 原生实现精简，生命周期更清晰，便于稳定维护
- ✅ 几何运算（距离/面积、点在圆/多边形、质心/边界、路径长度/抽稀、GeoHash、瓦片/像素坐标转换、最近点、热力网格等，由 C++ 实现）
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
>   npm install expo-gaode-map@1.2.3
>   ```
>   **说明**：V1 版本不支持世界地图，只是为了兼容佬项目使用，请尽快升级你的 expo 版本到 54 及以上，使用最新的 V2 版本。

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

### 纯 React Native（非 Expo 托管）项目

本库基于 Expo Modules 开发。如果你的项目是纯 React Native（不是 Expo 托管项目），请先接入 Expo Modules：

```bash
npx install-expo-modules@latest
```

然后安装本库并重新构建原生工程：

```bash
npm install expo-gaode-map
cd ios && pod install && cd ..
npx react-native run-ios
npx react-native run-android
```

如果你的项目已经接入了 Expo Modules，可以跳过 `install-expo-modules` 这一步。

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

当 Config Plugin（`androidKey` / `iosKey`）已配置时，原生地图 SDK 默认会在启动时自动初始化。

`ExpoGaodeMapModule.initSDK({ webKey })` 仅在你需要 `expo-gaode-map-web-api`（或希望运行时手动设置 `webKey`）时调用。

如果你**没有**使用 Config Plugin，则**必须**先调用：

```ts
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
});
```

然后再使用地图/定位/导航/搜索能力。

## 🔒 隐私合规接入

在**首次安装**（或你的隐私协议版本变更后）时，必须先完成隐私告知与同意，再渲染 `MapView`。

从当前版本开始，用户一旦同意，iOS / Android 原生层会**持久化并在后续冷启动时自动恢复**隐私状态，因此**不需要每次打开 App 都重复调用** `setPrivacyConfig()`。

```ts
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const privacyStatus = ExpoGaodeMapModule.getPrivacyStatus();

if (!privacyStatus.isReady) {
  // 请在你自己的隐私弹窗“同意”回调里调用
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    privacyVersion: '2026-03-13',
  });
}
// 使用 Config Plugin 时：仅在需要 expo-gaode-map-web-api 时调用
ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });
```

如果是新安装用户且还没完成隐私同意，库会明确抛出 `PRIVACY_NOT_AGREED`，而不是让原生 SDK 直接异常。

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

- **搜索包**（`expo-gaode-map-search`）：原生实现，性能更好，需要配置原生环境
- **Web API**（`expo-gaode-map-web-api`）：纯 JavaScript，无需原生配置，跨平台更好，功能更加强大和完善

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
- QQ：582752848 （有需要的随时联系）
