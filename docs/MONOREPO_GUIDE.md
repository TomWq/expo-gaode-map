# Monorepo 架构指南

本文档说明如何使用和维护 expo-gaode-map 的 Monorepo 架构。

## 📁 项目结构

```
expo-gaode-map/
├── packages/
│   ├── core/                    # 核心包 (expo-gaode-map)
│   │   ├── src/                 # TypeScript 源码
│   │   ├── android/             # Android 原生代码
│   │   ├── ios/                 # iOS 原生代码
│   │   ├── plugin/              # Config plugin
│   │   └── package.json
│   │
│   └── search/                  # 搜索模块 (expo-gaode-map-search)
│       ├── src/                 # TypeScript 源码
│       ├── android/             # Android 原生代码
│       ├── ios/                 # iOS 原生代码
│       └── package.json
│
├── example/                     # 示例应用
│   ├── App.tsx
│   ├── OptionalModuleDemo.tsx
│   └── package.json
│
├── docs/                        # 文档
├── package.json                 # 根 package.json
└── pnpm-workspace.yaml          # Workspace 配置
```

## 🚀 快速开始

### 1. 安装 pnpm

```bash
npm install -g pnpm
```

### 2. 安装依赖

```bash
# 在项目根目录
pnpm install
```

这会安装所有 workspace 包的依赖。

### 3. 构建所有包

```bash
pnpm build
```

### 4. 运行示例应用

```bash
cd example
pnpm start

# 或者运行 Android/iOS
pnpm android
pnpm ios
```

## 📦 包管理

### 核心包 (packages/core)

**包名：** `expo-gaode-map`

**功能：**
- 地图显示和交互
- 定位服务
- 覆盖物（标记、圆形、折线、多边形等）
- 相机控制
- 模块检测工具

**发布：**
```bash
cd packages/core
npm run build
npm publish
```

### 搜索模块 (packages/search)

**包名：** `expo-gaode-map-search`

**功能：**
- POI 搜索
- 周边搜索
- 沿途搜索
- 多边形搜索
- 输入提示

**发布：**
```bash
cd packages/search
npm run build
npm publish
```

## 🔧 开发工作流

### 添加新的可选模块

1. **创建模块目录**
```bash
mkdir -p packages/navigation
cd packages/navigation
```

2. **初始化 package.json**
```bash
pnpm init
```

3. **配置文件结构**
```
packages/navigation/
├── src/
│   ├── index.ts
│   ├── ExpoGaodeMapNavigation.types.ts
│   └── ExpoGaodeMapNavigationModule.ts
├── android/
│   ├── build.gradle
│   └── src/main/java/expo/modules/gaodemap/navigation/
├── ios/
│   ├── ExpoGaodeMapNavigation.podspec
│   └── ExpoGaodeMapNavigationModule.swift
├── expo-module.config.json
├── tsconfig.json
├── package.json
└── README.md
```

4. **更新 package.json**
```json
{
  "name": "expo-gaode-map-navigation",
  "version": "1.0.0",
  "peerDependencies": {
    "expo-gaode-map": "^2.0.0"
  }
}
```

### 本地开发和测试

1. **在 example 中使用 workspace 包**

`example/package.json`:
```json
{
  "dependencies": {
    "expo-gaode-map": "workspace:*",
    "expo-gaode-map-search": "workspace:*"
  }
}
```

2. **自动链接**

修改 `example/package.json`:
```json
{
  "expo": {
    "autolinking": {
      "nativeModulesDir": "../packages"
    }
  }
}
```

3. **实时开发**
```bash
# 终端 1: 监听核心包变化
cd packages/core
npm run build -- --watch

# 终端 2: 监听搜索模块变化
cd packages/search
npm run build -- --watch

# 终端 3: 运行示例应用
cd example
pnpm start
```

### 依赖管理

**添加依赖到特定包：**
```bash
# 添加到核心包
pnpm --filter expo-gaode-map add lodash

# 添加到搜索模块
pnpm --filter expo-gaode-map-search add axios

# 添加到示例应用
pnpm --filter expo-gaode-map-example add react-native-gesture-handler
```

**添加 workspace 包之间的依赖：**
```bash
cd packages/search
pnpm add expo-gaode-map@workspace:*
```

**更新所有依赖：**
```bash
pnpm update -r
```

## 🏗️ 构建和发布

### 构建单个包

```bash
# 构建核心包
pnpm --filter expo-gaode-map run build

# 构建搜索模块
pnpm --filter expo-gaode-map-search run build
```

### 构建所有包

```bash
pnpm -r --filter './packages/*' run build
```

### 清理构建产物

```bash
# 清理所有包
pnpm -r --filter './packages/*' run clean

# 清理特定包
pnpm --filter expo-gaode-map run clean
```

### 发布流程

**1. 更新版本号**

```bash
cd packages/core
npm version patch  # 或 minor, major

cd packages/search
npm version patch
```

**2. 构建**

```bash
pnpm build
```

**3. 发布到 npm**

```bash
# 发布核心包
cd packages/core
npm publish

# 发布搜索模块
cd packages/search
npm publish
```

**4. 创建 Git 标签**

```bash
git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0
```

### 批量发布（使用 Changesets，可选）

安装 changesets：
```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

创建 changeset：
```bash
pnpm changeset
```

发布：
```bash
pnpm changeset version
pnpm changeset publish
```

## 🧪 测试

### 运行测试

```bash
# 测试所有包
pnpm -r test

# 测试特定包
pnpm --filter expo-gaode-map test
```

### Lint

```bash
# Lint 所有包
pnpm -r lint

# Lint 特定包
pnpm --filter expo-gaode-map lint
```

## 📝 文档

### 生成 API 文档

```bash
# 安装 typedoc
pnpm add -Dw typedoc

# 生成文档
pnpm typedoc
```

### 更新 README

每个包都应该有自己的 README.md：
- `packages/core/README.md` - 核心包文档
- `packages/search/README.md` - 搜索模块文档

## 🔍 故障排除

### 问题: 模块找不到

**解决方案:**
```bash
# 清理并重新安装
rm -rf node_modules
rm -rf packages/*/node_modules
rm pnpm-lock.yaml
pnpm install
```

### 问题: 构建失败

**解决方案:**
```bash
# 清理构建产物
pnpm -r clean

# 重新构建
pnpm build
```

### 问题: 示例应用无法链接原生模块

**解决方案:**

1. 清理 example 的构建缓存：
```bash
cd example
rm -rf android/build android/.gradle
rm -rf ios/Pods ios/build
```

2. 重新安装：
```bash
cd example
pnpm install
npx pod-install
```

3. 确保 autolinking 配置正确：
```json
{
  "expo": {
    "autolinking": {
      "nativeModulesDir": "../packages"
    }
  }
}
```

### 问题: TypeScript 类型错误

**解决方案:**
```bash
# 清理并重新构建类型
pnpm -r clean
pnpm build
```

## 📋 最佳实践

### 1. 版本管理

- 核心包使用语义化版本（Semver）
- 可选模块版本独立于核心包
- 使用 peerDependencies 指定核心包版本范围

### 2. 依赖管理

- 共享依赖放在根 package.json 的 devDependencies
- 运行时依赖放在各自包的 dependencies
- 使用 peerDependencies 避免重复打包

### 3. Git 工作流

```bash
# 功能分支
git checkout -b feature/add-navigation-module

# 提交变更
git add packages/navigation
git commit -m "feat(navigation): add navigation module"

# 推送
git push origin feature/add-navigation-module
```

### 4. Changelog

每个包维护自己的 CHANGELOG.md：
- `packages/core/CHANGELOG.md`
- `packages/search/CHANGELOG.md`

## 🔗 相关资源

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [Monorepo 最佳实践](https://monorepo.tools/)
- [Changesets](https://github.com/changesets/changesets)

## 📞 支持

遇到问题？
- 📖 查看 [完整文档](../README.md)
- 🐛 提交 [Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 参与 [讨论](https://github.com/TomWq/expo-gaode-map/discussions)