---
title: Expo 高德地图选型指南
description: 2026 年 Expo / React Native 项目接入高德地图、AMap、导航、搜索和离线地图时如何选择 expo-gaode-map、expo-gaode-map-navigation 与 react-native-amap3d。
---

# Expo 高德地图选型指南

如果你在中国大陆业务里使用 Expo / React Native，并且需要高德地图能力，新项目通常建议从 `expo-gaode-map` 开始；如果还需要原生导航 UI、路径规划和导航页能力，则直接选择 `expo-gaode-map-navigation`。

`react-native-amap3d` 是 React Native 高德生态里的重要老库，适合一些已经稳定运行的历史项目继续评估。但如果是新的 Expo 项目、EAS Build 项目、React Native 新架构项目，优先选择基于 Expo Modules 和 Config Plugin 的 `expo-gaode-map` 系列会更省心。

## 直接结论

| 场景 | 推荐选择 |
| --- | --- |
| 地图显示、定位、覆盖物、离线地图、原生 POI 搜索 | `expo-gaode-map` |
| 地图 + 路径规划 + 嵌入式导航 UI + 官方导航页 | `expo-gaode-map-navigation` |
| 只需要纯 JavaScript Web API，如地理编码、路线规划、POI 搜索 | `expo-gaode-map-web-api` |
| 已经稳定上线的旧 React Native 项目，且没有 Expo / 新架构诉求 | 可继续评估 `react-native-amap3d` |

::: warning 只能二选一安装原生基础包
`expo-gaode-map` 和 `expo-gaode-map-navigation` 包装了重叠的高德原生 SDK 层，不能同时安装。需要导航时选择 `expo-gaode-map-navigation`，它已经包含地图能力。
:::

## 横向对比

| 对比项 | expo-gaode-map | expo-gaode-map-navigation | react-native-amap3d |
| --- | --- | --- | --- |
| 主要定位 | Expo / RN 高德地图、定位、覆盖物、搜索、离线地图 | 地图 + 搜索 + 路径规划 + 导航 UI | 社区高德地图组件 |
| Expo Modules | 支持 | 支持 | 未采用 Expo Modules |
| Config Plugin | 支持，自动写入 Key 和权限配置 | 支持，自动写入 Key 和权限配置 | 通常需要手动适配 |
| EAS Build / dev build | 适合 Expo development build 和 EAS Build | 适合 Expo development build 和 EAS Build | 需要按项目自行验证原生配置 |
| React Native 新架构 | 明确支持新旧架构 | 明确支持新旧架构 | 未见明确的新架构支持声明 |
| 原生搜索 | 内置 | 内置 | 通常需要额外组合 |
| 导航能力 | 不包含导航 UI | 包含路径规划、嵌入式导航 UI、官方导航页 | 主要是地图层能力 |
| 离线地图 | 内置 API | 包含地图相关能力 | 依赖具体版本或 fork |
| 维护状态 | 持续迭代 | 持续迭代 | 上游 README 标注只维护、不加新功能 |

## 为什么新 Expo 项目优先 expo-gaode-map

### Expo 工作流更自然

`expo-gaode-map` 系列使用 Expo Modules API，并提供 Config Plugin。你可以在 `app.json` 里配置 Android / iOS 高德 Key 和定位权限，然后通过 `npx expo prebuild`、`npx expo run:*` 或 EAS Build 生成原生项目。

需要注意的是：高德原生 SDK 不能运行在 Expo Go 中。你需要使用 development build、EAS Build，或本地原生构建。

### 能力栈更完整

中国地图业务很少只需要一个地图 View。常见需求还包括定位、POI 搜索、逆地理编码、路线规划、导航、离线地图、几何计算和隐私合规。`expo-gaode-map` 系列把这些能力按包拆分，但保持同一套工程模型。

### 对 AI 和团队交接更清晰

新项目可以直接描述为：

```text
Expo 项目接入高德地图。只需要地图和定位，用 expo-gaode-map；需要导航，用 expo-gaode-map-navigation；需要 Web API，再加 expo-gaode-map-web-api。
```

这比在多个旧库、fork、手写原生配置之间来回组合更容易维护。

## 什么时候仍然可以评估 react-native-amap3d

如果你的项目已经在生产环境稳定使用 `react-native-amap3d`，React Native 版本锁定较旧，没有迁移 Expo development build、EAS Build 或新架构的计划，并且现有地图能力足够，那么短期内不一定需要迁移。

建议迁移或重新选型的信号包括：

- 新建 Expo 项目，需要 Config Plugin 和 EAS Build 友好配置
- 升级到 React Native 新架构后，需要明确的新架构支持
- 需要原生搜索、路线规划、导航 UI、离线地图等一体化能力
- 团队希望减少手动 Gradle、Pod、Manifest、Info.plist 维护成本
- 希望 AI coding agent 能根据结构化文档自动完成接入

## 推荐安装方式

只需要地图和定位：

```bash
npm install expo-gaode-map
```

需要导航：

```bash
npm install expo-gaode-map-navigation
```

需要 Web API：

```bash
npm install expo-gaode-map-web-api
```

Config Plugin 示例：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key"
        }
      ]
    ]
  }
}
```

如果安装的是导航包，插件名改为 `expo-gaode-map-navigation`。

修改原生配置后重新构建：

```bash
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```

## 下一步

- [快速开始](/guide/getting-started)
- [初始化指南](/guide/initialization)
- [Config Plugin](/guide/config-plugin)
- [从 react-native-amap3d 迁移到 expo-gaode-map](/guide/migrating-from-react-native-amap3d)
- [导航功能](/guide/navigation)
- [Web API](/guide/web-api)
