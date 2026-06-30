---
title: 从 react-native-amap3d 迁移到 expo-gaode-map
description: 将 React Native 高德地图项目从 react-native-amap3d 迁移到 expo-gaode-map 或 expo-gaode-map-navigation 的选型、配置和代码迁移步骤。
---

# 从 react-native-amap3d 迁移到 expo-gaode-map

`react-native-amap3d` 是高德地图 React Native 生态里的经典库。如果你的项目已经稳定运行，可以先按业务节奏评估迁移收益。对于新的 Expo 项目、正在接入 EAS Build 的项目，或准备升级 React Native 新架构的项目，`expo-gaode-map` / `expo-gaode-map-navigation` 会更贴近当前 Expo 工程模型。

这份文档的目标不是一键替换所有 API，而是给你一条可控的迁移路径：先完成原生配置和最小地图渲染，再逐步迁移定位、覆盖物、搜索和导航。

## 迁移前先选包

| 旧项目能力 | 新包 |
| --- | --- |
| 地图显示、相机控制、Marker、Polyline、Polygon、定位 | `expo-gaode-map` |
| 地图 + 路径规划 + 嵌入式导航 UI 或官方导航页 | `expo-gaode-map-navigation` |
| 纯 JS 地理编码、POI 搜索、路线规划 | `expo-gaode-map-web-api` |

::: warning 不要同时安装 core 和 navigation
`expo-gaode-map` 与 `expo-gaode-map-navigation` 不能同时安装。导航包已经包含地图能力，需要导航时直接选导航包。
:::

## 1. 移除旧包并安装新包

只需要地图能力：

```bash
npm uninstall react-native-amap3d
npm install expo-gaode-map
```

需要导航能力：

```bash
npm uninstall react-native-amap3d
npm install expo-gaode-map-navigation
```

如果你的项目是纯 React Native，先接入 Expo Modules：

```bash
npx install-expo-modules@latest
```

## 2. 配置 Config Plugin

优先在现有 `app.json` 中配置插件：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key",
          "enableLocation": true,
          "enableBackgroundLocation": false,
          "locationDescription": "我们需要访问您的位置信息以提供地图服务"
        }
      ]
    ]
  }
}
```

使用导航包时，插件名改为 `expo-gaode-map-navigation`。

如果你的项目已经使用 `app.config.ts` 或 `app.config.js`，也可以在动态配置里加入同样的插件项。

## 3. 重新生成或构建原生项目

Expo 项目：

```bash
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```

也可以使用 EAS Build：

```bash
eas build --platform android
eas build --platform ios
```

纯 React Native 项目在安装 Expo Modules 后，按原生流程重新安装 Pods 并构建。

## 4. 先接隐私合规流程

首次安装或隐私协议版本变化后，要先完成高德隐私同意，再渲染地图或调用定位、搜索、导航 API。

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    privacyVersion: '2026-03-13',
  });
}
```

如果你使用的是 `expo-gaode-map-navigation`，从导航包导入对应模块：

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';
```

已通过 Config Plugin 写入原生 Key 时，基础地图代码通常不需要再调用 `initSDK({ androidKey, iosKey })`。只有使用 Web API 时才需要传入 `webKey`：

```tsx
ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });
```

## 5. 替换最小地图

迁移时建议先把页面缩到最小可运行状态，确认 Key、隐私、权限、构建链路都没问题。

```tsx
import { MapView } from 'expo-gaode-map';

export function BasicMapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.908823, longitude: 116.39747 },
        zoom: 12,
      }}
      myLocationEnabled
    />
  );
}
```

如果使用导航包：

```tsx
import { MapView } from 'expo-gaode-map-navigation';
```

## 6. 迁移常见 API

| 旧能力 | 新实现 |
| --- | --- |
| 地图 View | `MapView` |
| Marker | `Marker` |
| Polyline | `Polyline` |
| Polygon | `Polygon` |
| Circle | `Circle` |
| 地图 ref 控制相机 | `MapViewRef` 上的相机方法 |
| 定位权限 | `ExpoGaodeMapModule.checkLocationPermission()` / `requestLocationPermission()` 或 `useLocationPermissions()` |
| 当前定位 | `ExpoGaodeMapModule.getCurrentLocation()` |
| POI 搜索 | `searchPOI` / `searchNearby` / `getInputTips` |
| 路径规划与导航 | `expo-gaode-map-navigation` 的 route planning 与 `ExpoGaodeMapNaviView` |

覆盖物示例：

```tsx
import { MapView, Marker, Polyline } from 'expo-gaode-map';

export function OverlayScreen() {
  return (
    <MapView style={{ flex: 1 }}>
      <Marker position={{ latitude: 39.908823, longitude: 116.39747 }} />
      <Polyline
        points={[
          { latitude: 39.908823, longitude: 116.39747 },
          { latitude: 39.918823, longitude: 116.40747 },
        ]}
        width={6}
        color="#1677ff"
      />
    </MapView>
  );
}
```

## 7. 分阶段迁移建议

1. 先迁移安装、Config Plugin、隐私流程和最小 `MapView`。
2. 再迁移 Marker、Polyline、Polygon、Circle 等覆盖物。
3. 然后迁移定位权限和当前位置逻辑。
4. 如果旧项目自己拼了搜索服务，评估改用内置原生搜索或 `expo-gaode-map-web-api`。
5. 如果需要导航，迁移到 `expo-gaode-map-navigation`，不要在同一 App 同时保留 core 包。

## 排查清单

- 不能在 Expo Go 中测试，需要 development build、EAS Build 或本地原生构建
- 修改 Config Plugin 后要重新 `prebuild` 或重新云构建
- Android / iOS 高德 Key 要分别创建，并匹配包名、签名、Bundle ID
- 首次安装必须先完成隐私同意，再渲染 `MapView`
- `expo-gaode-map` 与 `expo-gaode-map-navigation` 不能同时安装
- 使用 Web API 时需要额外配置 `webKey`

## 下一步

- [Expo 高德地图选型指南](/guide/choosing-amap-library)
- [快速开始](/guide/getting-started)
- [初始化指南](/guide/initialization)
- [错误处理](/guide/error-handling)
- [导航功能](/guide/navigation)
