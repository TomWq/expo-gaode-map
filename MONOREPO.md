# Monorepo 架构说明

expo-gaode-map 已重构为 Monorepo 架构，提供模块化的功能包。

## 包结构

### 核心包：`expo-gaode-map`

**位置**: `packages/core/`

**功能**:
- 地图显示和交互
- 定位功能
- 覆盖物（Marker、Circle、Polyline、Polygon 等）
- 相机控制
- Config Plugin

**安装**:
```bash
npm install expo-gaode-map
```

### 搜索包：`expo-gaode-map-search`

**位置**: `packages/search/`

**功能**:
- POI 搜索
- 周边搜索
- 沿途搜索
- 多边形搜索
- 输入提示

**安装**:
```bash
npm install expo-gaode-map-search
```

### 导航包：`expo-gaode-map-navigation`

**位置**: `packages/navigation/`

**功能**:
- 集成地图显示（内置完整地图功能）
- 驾车/步行/骑行/公交路径规划
- 实时导航和语音导航
- 导航视图组件
- 独立路径规划服务（无需地图）

**重要提示**:
::: danger 二进制冲突
导航包与核心包（expo-gaode-map）使用不同的 SDK，**不能同时安装**。

- 如果只需要地图显示和定位，使用 `expo-gaode-map`
- 如果需要导航功能，使用 `expo-gaode-map-navigation`
:::

**安装**:
```bash
npm install expo-gaode-map-navigation
```

### Web API 包：`expo-gaode-map-web-api`

**位置**: `packages/web-api/`

**功能**:
- 地理编码（地址 ↔ 坐标转换）
- 路径规划（驾车/步行/骑行/公交，V5 API）
- POI 搜索（关键字/周边/详情）
- 输入提示（POI/公交站点/公交线路）

**特点**:
- 纯 JavaScript 实现，无原生依赖
- 跨平台一致性
- 与核心包或导航包协同工作（读取 webKey）
- 支持最新的高德 Web 服务 V5 API

**安装**:
```bash
npm install expo-gaode-map-web-api
```

## 为什么使用 Monorepo？

### 优势

1. **按需安装** - 用户只安装需要的功能，减少应用包体积
2. **模块化** - 功能清晰分离，易于维护
3. **统一管理** - 共享依赖和配置
4. **类型安全** - 包之间可以共享 TypeScript 类型

### 对比

#### 之前（单一包）

```bash
npm install expo-gaode-map
# 包含所有功能，包体积大
```

#### 现在（Monorepo）

```bash
# 方案一：只需要地图和定位
npm install expo-gaode-map

# 方案二：需要导航功能（与方案一互斥）
npm install expo-gaode-map-navigation

# 扩展：需要搜索功能（配合核心包）
npm install expo-gaode-map-search

# 扩展：需要 Web API 服务（可配合任一方案）
npm install expo-gaode-map-web-api
```

## 包选择指南

### 场景一：只需要地图显示和定位

```bash
npm install expo-gaode-map
```

适用于：地图展示、标记点、路径绘制、定位追踪等基础场景。

### 场景二：需要导航功能

```bash
npm install expo-gaode-map-navigation
```

适用于：需要实时导航、路径规划、导航视图的应用。
**注意**：导航包已内置地图功能，无需再安装核心包。

### 场景三：需要搜索功能

```bash
# 基于核心包
npm install expo-gaode-map
npm install expo-gaode-map-search

# 或基于导航包
npm install expo-gaode-map-navigation
npm install expo-gaode-map-search
```

### 场景四：需要 Web API 服务

```bash
# 配合核心包
npm install expo-gaode-map
npm install expo-gaode-map-web-api

# 或配合导航包
npm install expo-gaode-map-navigation
npm install expo-gaode-map-web-api
```

Web API 包提供纯 JS 实现的地理编码、路径规划、POI 搜索等功能。

## 迁移指南

### 如果你只使用地图和定位功能

**无需修改代码**，核心功能保持在 `expo-gaode-map` 包中：

```typescript
import { MapView, ExpoGaodeMapModule, Marker } from 'expo-gaode-map';
// 一切正常工作
```

### 如果你需要搜索功能

安装搜索包并更新导入：

```bash
npm install expo-gaode-map-search
```

```typescript
// 之前（假设有搜索功能）
import { searchPOI } from 'expo-gaode-map';

// 现在
import { searchPOI } from 'expo-gaode-map-search';
```

### 如果你需要导航功能

安装导航包（替换核心包）：

```bash
# 卸载核心包（如果已安装）
npm uninstall expo-gaode-map

# 安装导航包
npm install expo-gaode-map-navigation
```

```typescript
// 地图功能（API 与核心包相同）
import { ExpoGaodeMapView } from 'expo-gaode-map-navigation';

// 导航功能
import { 
  ExpoGaodeMapNavigationModule,
  ExpoGaodeMapNaviView 
} from 'expo-gaode-map-navigation';
```

## 开发

### 环境要求

- Node.js >= 18
- pnpm >= 8.0

### 安装依赖

```bash
pnpm install
```

### 构建所有包

```bash
pnpm build
```

### 运行示例

```bash
# 核心包示例
cd example
pnpm install
npx expo run:ios
# 或
npx expo run:android

# 导航包示例
cd navigation
pnpm install
npx expo run:ios
# 或
npx expo run:android
```

### 目录结构

```
expo-gaode-map/
├── packages/
│   ├── core/                 # 核心包源码
│   │   ├── package.json
│   │   ├── src/
│   │   ├── ios/
│   │   ├── android/
│   │   └── plugin/
│   │
│   ├── search/               # 搜索包源码
│   │   ├── package.json
│   │   ├── src/
│   │   ├── ios/
│   │   └── android/
│   │
│   ├── navigation/           # 导航包源码
│   │   ├── package.json
│   │   ├── src/
│   │   ├── ios/
│   │   └── android/
│   │
│   └── web-api/              # Web API 包源码
│       ├── package.json
│       └── src/
│
├── example/                  # 核心包示例应用
├── navigation/               # 导航包示例应用
├── website/                  # 文档网站
├── pnpm-workspace.yaml       # Workspace 配置
└── package.json              # 根 package.json
```

## 发布

### 发布核心包

```bash
cd packages/core
npm version patch  # 或 minor, major
npm publish
```

### 发布搜索包

```bash
cd packages/search
npm version patch
npm publish
```

### 发布导航包

```bash
cd packages/navigation
npm version patch
npm publish
```

### 发布 Web API 包

```bash
cd packages/web-api
npm version patch
npm publish
```

## 配置说明

### API Key 配置

#### 核心包配置

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "iosApiKey": "your-ios-api-key",
          "androidApiKey": "your-android-api-key"
        }
      ]
    ]
  }
}
```

#### 导航包配置

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map-navigation",
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key"
        }
      ]
    ]
  }
}
```

#### Web API Key 配置

在基础模块（核心包或导航包）初始化时提供：

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';
// 或
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key', // Web API 包会自动读取
});
```

### 搜索包的 API Key

搜索包会自动使用核心包/导航包配置的 API Key，无需额外配置。

#### 工作原理

1. **Config Plugin** 将 API Key 写入原生项目（`Info.plist`、`AndroidManifest.xml`）
2. **核心/导航模块** 在加载时自动从配置文件读取并设置 API Key
3. **搜索模块** 在初始化时检查 API Key，如果未设置则从配置文件读取

## 常见问题

### Q: 为什么要拆分成多个包？

A: 让用户按需安装功能，减少不必要的包体积。如果只需要地图显示和定位，就不需要安装搜索包或导航包。

### Q: 现有项目需要修改代码吗？

A: 如果只使用核心功能（地图、定位、覆盖物），无需修改代码。

### Q: 核心包和导航包能同时使用吗？

A: 不能。它们使用不同的高德 SDK，会产生二进制冲突。必须选择其一：
- 只需要地图 → 使用核心包
- 需要导航 → 使用导航包（已包含地图功能）

### Q: Web API 包需要依赖核心包或导航包吗？

A: 是的，Web API 包需要从核心包或导航包读取 webKey。但它是纯 JS 实现，不依赖原生代码。

### Q: 搜索包依赖核心包吗？

A: 是的，搜索包依赖核心包的类型定义和 SDK 初始化。也可以配合导航包使用。

### Q: 如何调试 Monorepo 项目？

A: 使用 `pnpm install` 安装依赖后，Metro 会自动监听 `packages/` 目录的变化。

### Q: 未来会有更多功能包吗？

A: 可能会添加：
- 离线地图包
- 工具函数包
- 其他扩展功能

## 技术细节

### 包管理

使用 **pnpm workspaces** 管理 Monorepo：

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'example'
  - 'navigation'
```

### 包依赖

```json
// packages/search/package.json
{
  "dependencies": {
    "expo-gaode-map": "workspace:*"
  }
}
```

`workspace:*` 协议确保使用本地 workspace 中的包。

### Metro 配置

```js
// example/metro.config.js
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

## 相关文档

- [快速开始](./docs/INITIALIZATION.md)
- [架构说明](./docs/ARCHITECTURE.md)
- [搜索功能](./docs/SEARCH_MODULE_PLATFORM_DIFFERENCES.md)
- [导航功能](./docs/BASIC_NAVIGATION_GUIDE.md)
- [示例代码](./example/)
- [在线文档](https://tomwq.github.io/expo-gaode-map/)

## 贡献

欢迎提交 Issue 和 PR！

## 许可

MIT