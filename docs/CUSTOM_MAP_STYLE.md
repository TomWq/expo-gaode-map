# 自定义地图样式

## 概述

高德地图 SDK 支持自定义地图样式，让你的地图更美观、更符合应用风格。这个功能可以让你的地图看起来和高德地图 APP 一样精美。

## 为什么需要自定义样式？

默认的 SDK 地图样式比较基础，而高德地图 APP 使用了精心设计的自定义样式。通过使用自定义样式，你可以：

- 🎨 让地图更美观，色彩更丰富
- 🎯 突出重要信息，隐藏不必要的元素
- 🌈 匹配应用的整体设计风格
- ✨ 提供更好的用户体验

## 使用方式

### 方式一：在线样式（推荐）

在线样式是最简单的方式，只需要一个样式 ID。

#### 1. 创建自定义样式

1. 登录 [高德开放平台控制台](https://console.amap.com/)
2. 进入「自定义地图」功能
3. 使用可视化编辑器创建你的地图样式
4. 发布样式并获取样式 ID

#### 2. 在代码中使用

```tsx
import { MapView } from '@huolala-tech/expo-gaode-map';

export default function App() {
  return (
    <MapView
      style={{ flex: 1 }}
      customMapStyle={{
        styleId: 'your-style-id-here'  // 替换为你的样式 ID
      }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 15
      }}
    />
  );
}
```

### 方式二：本地样式文件

如果你需要离线使用或有特殊需求，可以使用本地样式文件。

#### 1. 准备样式文件

从高德开放平台下载样式文件（通常包含 `.data` 和 `.extra` 文件）。

#### 2. 添加到项目

**iOS:**
- 将样式文件添加到 Xcode 项目的 Resources 目录
- 确保文件被包含在 Copy Bundle Resources 中

**Android:**
- 将样式文件放到 `android/app/src/main/assets/` 目录

#### 3. 在代码中使用

```tsx
import { MapView } from '@huolala-tech/expo-gaode-map';

export default function App() {
  return (
    <MapView
      style={{ flex: 1 }}
      customMapStyle={{
        styleDataPath: 'style.data',           // 主样式文件
        extraStyleDataPath: 'style_extra.data' // 额外样式文件（可选）
      }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 15
      }}
    />
  );
}
```

## 完整示例

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MapView, Marker } from '@huolala-tech/expo-gaode-map';

export default function CustomStyleMapExample() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        // 使用在线自定义样式
        customMapStyle={{
          styleId: 'amap://styles/your-style-id'
        }}
        // 地图配置
        mapType={0}
        buildingsEnabled={true}
        labelsEnabled={true}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 15,
          tilt: 0,
          bearing: 0
        }}
      >
        <Marker
          position={{ latitude: 39.9, longitude: 116.4 }}
          title="自定义样式地图"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
```

## 动态切换样式

你可以动态切换地图样式：

```tsx
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { MapView } from '@huolala-tech/expo-gaode-map';

export default function DynamicStyleExample() {
  const [styleId, setStyleId] = useState('style-1');

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        customMapStyle={{ styleId }}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 15
        }}
      />
      
      <View style={{ position: 'absolute', top: 50, right: 20 }}>
        <Button title="样式 1" onPress={() => setStyleId('style-1')} />
        <Button title="样式 2" onPress={() => setStyleId('style-2')} />
        <Button title="默认样式" onPress={() => setStyleId('')} />
      </View>
    </View>
  );
}
```

## 禁用自定义样式

如果要恢复默认样式，传入空对象或不设置 `customMapStyle` 属性：

```tsx
<MapView
  style={{ flex: 1 }}
  customMapStyle={{}}  // 或者不设置这个属性
/>
```

## API 参考

### customMapStyle

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| styleId | string | 否 | 在线样式 ID（从高德开放平台获取） |
| styleDataPath | string | 否 | 本地样式文件路径 |
| extraStyleDataPath | string | 否 | 额外样式文件路径（可选） |

**注意：**
- `styleId` 和 `styleDataPath` 二选一
- 使用 `styleId` 时会忽略 `styleDataPath`
- `extraStyleDataPath` 仅在使用本地样式时有效

## 常见问题

### 1. 样式不生效？

**检查清单：**
- ✅ 确认样式 ID 正确
- ✅ 确认网络连接正常（在线样式需要网络）
- ✅ 确认样式文件路径正确（本地样式）
- ✅ 确认样式文件已正确添加到项目中

### 2. 如何获取样式 ID？

1. 登录高德开放平台控制台
2. 进入「自定义地图」
3. 创建或选择已有样式
4. 点击「发布」获取样式 ID

### 3. 本地样式文件放在哪里？

**iOS:** 
- Xcode 项目的 Resources 目录
- 确保在 Build Phases > Copy Bundle Resources 中

**Android:**
- `android/app/src/main/assets/` 目录

### 4. 可以同时使用多个样式吗？

不可以。一次只能应用一个样式，但你可以动态切换。

### 5. 自定义样式会影响性能吗？

- 在线样式：首次加载需要下载，之后会缓存
- 本地样式：无网络请求，性能更好
- 整体影响很小，可以放心使用

## 相关资源

- [高德开放平台 - 自定义地图](https://lbs.amap.com/api/javascript-api/guide/map/map-style)
- [高德地图样式编辑器](https://lbs.amap.com/dev/mapstyle/index)
- [iOS SDK 文档](https://lbs.amap.com/api/ios-sdk/guide/create-map/custom-map-style)
- [Android SDK 文档](https://lbs.amap.com/api/android-sdk/guide/create-map/custom-map-style)

## 技术支持

如有问题，请提交 [GitHub Issue](https://github.com/huolalatech/expo-gaode-map/issues)。