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

### 搜索包：`@expo-gaode-map/search`

**位置**: `packages/search/`

**功能**:
- POI 搜索
- 周边搜索
- 沿途搜索
- 多边形搜索
- 输入提示

**安装**:
```bash
npm install @expo-gaode-map/search
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
# 只需要地图和定位
npm install expo-gaode-map

# 需要搜索功能时才安装
npm install @expo-gaode-map/search
```

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
npm install @expo-gaode-map/search
```

```typescript
// 之前（假设有搜索功能）
import { searchPOI } from 'expo-gaode-map';

// 现在
import { searchPOI } from '@expo-gaode-map/search';
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
cd example
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
│   └── search/               # 搜索包源码
│       ├── package.json
│       ├── src/
│       ├── ios/
│       └── android/
│
├── example/                  # 示例应用
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

## 配置说明

### API Key 配置

无论安装了哪些包，API Key 配置方式保持不变：

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

### 搜索包的 API Key

搜索包会自动使用核心包配置的 API Key，无需额外配置。

#### 工作原理

1. **Config Plugin** 将 API Key 写入原生项目（`Info.plist`、`AndroidManifest.xml`）
2. **核心模块** 在加载时自动从配置文件读取并设置 API Key
3. **搜索模块** 在初始化时检查 API Key，如果未设置则从配置文件读取

## 常见问题

### Q: 为什么要拆分成多个包？

A: 让用户按需安装功能，减少不必要的包体积。如果只需要地图显示和定位，就不需要安装搜索包。

### Q: 现有项目需要修改代码吗？

A: 如果只使用核心功能（地图、定位、覆盖物），无需修改代码。

### Q: 搜索包依赖核心包吗？

A: 是的，搜索包依赖核心包的类型定义和 SDK 初始化。

### Q: 如何调试 Monorepo 项目？

A: 使用 `pnpm install` 安装依赖后，Metro 会自动监听 `packages/` 目录的变化。

### Q: 未来会有更多功能包吗？

A: 是的，计划添加：
- `@expo-gaode-map/navigation` - 导航功能
- `@expo-gaode-map/offline` - 离线地图
- `@expo-gaode-map/utils` - 工具函数

## 技术细节

### 包管理

使用 **pnpm workspaces** 管理 Monorepo：

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'example'
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

- [快速开始](./website/docs/guide/getting-started.md)
- [架构说明](./website/docs/guide/architecture.md)
- [搜索功能](./website/docs/guide/search.md)
- [示例代码](./example/)

## 贡献

欢迎提交 Issue 和 PR！

## 许可

MIT