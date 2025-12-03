# Expo Config Plugin for expo-gaode-map

这是 `expo-gaode-map` 的 Expo Config Plugin 实现。

## 功能

- 自动配置 iOS 和 Android 平台的高德地图 API Key
- 自动添加定位权限
- 自动初始化高德地图 SDK

## 开发

### 构建插件

```bash
npm run build:plugin
```

### 目录结构

```
plugin/
├── src/
│   └── withGaodeMap.ts    # 插件源代码
├── build/                  # 编译输出目录
├── tsconfig.json          # TypeScript 配置
└── README.md              # 本文件
```

## 使用方法

请查看主文档: [CONFIG_PLUGIN.md](../docs/CONFIG_PLUGIN.md)

## 技术细节

### 修改的文件

**iOS:**
- `Info.plist` - 添加 API Key 和权限
- `AppDelegate.m` - 添加 SDK 初始化代码

**Android:**
- `AndroidManifest.xml` - 添加 API Key 和权限

### 依赖

- `@expo/config-plugins` - Expo 配置插件核心库

## 参考

- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [Creating a Config Plugin](https://docs.expo.dev/config-plugins/plugins-and-mods/)