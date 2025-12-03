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
│   └── search/             # @expo-gaode-map/search（搜索包）
│       ├── src/            # TypeScript 代码
│       ├── ios/            # iOS 原生代码
│       └── android/        # Android 原生代码
│
├── example/                # 示例应用
├── website/                # 文档网站
└── pnpm-workspace.yaml     # Workspace 配置
```

### 为什么使用 Monorepo？

1. **按需安装**：用户只安装需要的功能模块，减少包体积
2. **代码共享**：核心类型和工具可以在包之间共享
3. **统一管理**：所有包使用相同的开发工具和配置
4. **版本一致**：依赖版本统一管理，避免冲突

## 核心包（expo-gaode-map）

### TypeScript 代码结构

```
packages/core/src/
├── index.ts                          # 主导出文件
├── ExpoGaodeMapModule.ts             # 原生模块导入
├── ExpoGaodeMapView.tsx              # 地图视图组件
├── ExpoGaodeMap.types.ts             # 类型定义导出
├── components/                       # React 组件
│   └── overlays/                     # 覆盖物组件
│       ├── Circle.tsx                # 圆形组件
│       ├── Marker.tsx                # 标记点组件
│       ├── Polyline.tsx              # 折线组件
│       └── Polygon.tsx               # 多边形组件
└── types/                            # TypeScript 类型定义
    ├── common.types.ts               # 通用类型
    ├── map-view.types.ts             # 地图视图类型
    ├── location.types.ts             # 定位类型
    └── overlays.types.ts             # 覆盖物类型
```

### iOS 代码结构

```
packages/core/ios/
├── ExpoGaodeMapModule.swift          # Expo 模块定义
├── ExpoGaodeMapView.swift            # 地图视图组件
├── managers/                         # 管理器类
│   ├── CameraManager.swift           # 相机控制管理器
│   └── UIManager.swift               # UI 和手势管理器
├── modules/                          # 功能模块
│   └── LocationManager.swift         # 定位管理器
└── overlays/                         # 覆盖物视图
    ├── CircleView.swift              # 圆形覆盖物
    ├── MarkerView.swift              # 标记点
    ├── PolylineView.swift            # 折线
    └── PolygonView.swift             # 多边形
```

### Android 代码结构

```
packages/core/android/
└── src/main/java/expo/modules/gaodemap/
    ├── ExpoGaodeMapModule.kt         # Expo 模块定义
    ├── ExpoGaodeMapView.kt           # 地图视图组件
    ├── managers/                     # 管理器类
    │   ├── CameraManager.kt          # 相机控制管理器
    │   └── UIManager.kt              # UI 和手势管理器
    ├── modules/                      # 功能模块
    │   ├── SDKInitializer.kt         # SDK 初始化
    │   └── LocationManager.kt        # 定位管理器
    └── overlays/                     # 覆盖物视图
        ├── CircleView.kt             # 圆形覆盖物
        ├── MarkerView.kt             # 标记点
        ├── PolylineView.kt           # 折线
        └── PolygonView.kt            # 多边形
```

## 搜索包（@expo-gaode-map/search）

### TypeScript 代码结构

```
packages/search/src/
├── index.ts                          # 主导出文件
├── ExpoGaodeMapSearchModule.ts       # 原生模块导入
└── ExpoGaodeMapSearch.types.ts       # 类型定义
```

### iOS 代码结构

```
packages/search/ios/
├── ExpoGaodeMapSearch.podspec        # CocoaPods 配置
└── ExpoGaodeMapSearchModule.swift    # 搜索模块实现
```

### Android 代码结构

```
packages/search/android/
├── build.gradle                      # Gradle 配置
└── src/main/java/expo/modules/gaodemap/search/
    └── ExpoGaodeMapSearchModule.kt   # 搜索模块实现
```

## SDK 依赖关系

### Android

```
核心包：com.amap.api:3dmap:10.0.600（统一 SDK，包含所有功能）
搜索包：依赖核心包的 SDK，无需额外依赖
```

### iOS

```
核心包：
  - AMapFoundationKit（基础框架）
  - AMapLocationKit（定位）
  - MAMapKit（地图）

搜索包：
  - AMapFoundationKit（API Key 管理）
  - AMapSearchKit（搜索功能）
```

## API Key 初始化机制

### 核心包负责设置 API Key

1. **Config Plugin 方式**（推荐）
   - Android: 写入 `AndroidManifest.xml`
   - iOS: 写入 `Info.plist` 和 `AppDelegate.m`

2. **手动初始化方式**
   ```typescript
   ExpoGaodeMapModule.initSDK({
     androidKey: 'your-key',
     iosKey: 'your-key'
   });
   ```

### 搜索包自动读取 API Key

搜索模块在初始化时会：
1. 检查 `AMapServices.shared().apiKey` 是否已设置
2. 如果未设置，从 `Info.plist` 读取并设置
3. 延迟初始化：首次调用搜索方法时才初始化

这确保了搜索包可以独立工作，不依赖核心包的初始化顺序。

## 架构设计原则

### 1. 模块化设计

- **核心包**：提供基础的地图和定位功能
- **扩展包**：按需提供额外功能（搜索、导航等）
- **独立发布**：各包独立版本管理

### 2. 职责分离

- **Module**: 负责模块定义和方法注册
- **View**: 负责视图创建和属性管理
- **Manager**: 负责具体功能实现
- **Overlay**: 负责覆盖物渲染

### 3. 跨平台一致性

- iOS 和 Android 提供相同的 API
- TypeScript 层统一封装
- 平台差异在原生层处理

### 4. 依赖管理

- **核心包**：Expo Modules API + 高德地图 SDK
- **搜索包**：依赖核心包 + 搜索 SDK（iOS）或复用统一 SDK（Android）
- **自动链接**：使用 Expo Autolinking

### 5. 内存管理

- 使用弱引用避免循环引用
- 及时清理监听器和资源
- 主线程操作使用 Handler/DispatchQueue

### 6. 错误处理

- Promise 处理异步操作
- 统一的错误码和消息
- 详细的错误日志

## 开发指南

### 添加新功能包

1. 在 `packages/` 下创建新目录
2. 添加 `package.json` 和 `expo-module.config.json`
3. 实现 iOS 和 Android 原生代码
4. 在 TypeScript 层封装 API
5. 更新 `pnpm-workspace.yaml`
6. 在 example 中测试

### 调试技巧

- **Monorepo 调试**：使用 Metro `watchFolders` 监听包目录
- **原生日志**：使用 `print`（iOS）或 `Log.d`（Android）
- **类型检查**：运行 `pnpm typecheck`
- **依赖检查**：使用 `pnpm why` 查看依赖来源

### 发布流程

```bash
# 1. 构建所有包
pnpm build

# 2. 发布核心包
cd packages/core
npm publish

# 3. 发布搜索包
cd packages/search
npm publish
```

## 包之间的关系

```
┌─────────────────────────────────────┐
│         用户应用 (example)           │
└──────────┬──────────────┬───────────┘
           │              │
           ▼              ▼
    ┌─────────────┐  ┌──────────────────┐
    │ expo-gaode- │  │ @expo-gaode-map/ │
    │    map      │◄─┤     search       │
    │  (核心包)    │  │   (搜索包)        │
    └──────┬──────┘  └──────────────────┘
           │
           ▼
    ┌─────────────────────────────┐
    │    高德地图 SDK              │
    │ - Android: 3dmap 10.0.600   │
    │ - iOS: Foundation + Search  │
    └─────────────────────────────┘
```

## 相关文档

- [快速开始](/guide/getting-started) - 快速开始和基本使用
- [配置插件](/guide/config-plugin) - Config Plugin 详细配置
- [API 文档](/api/) - 完整 API 文档
- [使用示例](/examples/) - 示例代码