# example-navigation

`example-navigation` 是仓库内专门用于验证导航能力的 Expo 示例工程，覆盖：

- `NaviView` 官方嵌入式导航
- 基于 `NaviView` 事件自绘的嵌入式 HUD / 车道 HUD / 路况光柱
- 独立算路与路线选择
- Web 路线预览与近似跟线导航
- 官方黑盒导航页调起

## 运行前准备

1. 复制环境变量模板：

```bash
cp .env.example .env
```

2. 在 `.env` 中填写高德 Key：

- `EXPO_PUBLIC_AMAP_ANDROID_KEY`
- `EXPO_PUBLIC_AMAP_IOS_KEY`
- `EXPO_PUBLIC_AMAP_WEB_KEY`

说明：

- `Android Key` / `iOS Key` 用于原生导航与地图能力
- `Web Key` 仅在 Web 路线规划、避让区域/道路预览等场景需要；不用这些示例时可留空

## 安装依赖

在本目录执行：

```bash
npm install
```

或：

```bash
yarn install
```

## 运行示例

### Android

```bash
npx expo run:android
```

### iOS

首次或 `Podfile` 变化后先安装 Pods：

```bash
npx pod-install ios
```

然后运行：

```bash
npx expo run:ios
```

### Metro 调试

```bash
npx expo start --dev-client
```

## 主要示例页

- `自定义 UI 导航界面`
  用于查看如何基于 `NaviView` + 导航事件，自行组合顶部 HUD、车道 HUD、路况光柱和控制按钮
- `独立算路导航`
  展示“先算路、后选择、再导航”的流程
- `跟随 Web 路线`
  展示 Web 预览路线与原生近似跟线导航的边界
- `纯官方嵌入式 UI`
  仅用于对比原生官方嵌入式 `NaviView` 在当前 React Native / Expo 宿主中的表现

## 重要说明

- 如果你的目标是交付稳定的嵌入式导航页面，建议参考本示例工程里的“自定义 UI 导航界面”实现
- 示例里的自定义导航页默认走完整自定义 UI 模式，也就是默认 `showUIElements=false`
- Android 上官方嵌入式 `NaviView` 在部分 React Native / Expo 宿主里，顶部信息区、车道信息、路口大图联动效果可能与高德官方 Demo 不一致
- iOS 官方 SDK 当前只提供实景路口放大图 `showCrossImage / hideCrossImage`，不提供 Android 那套 3D 路口模型开关
- `纯官方嵌入式 UI` 页面保留为对比/回归用，不建议直接作为业务默认方案
- 示例里的自定义嵌入式页面方案，不替代 `openOfficialNaviPage` 的官方黑盒整页导航
