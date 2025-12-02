# Expo Config Plugin 配置指南

## 概述

`expo-gaode-map` 提供了 Expo Config Plugin,可以在运行 `npx expo prebuild` 时自动配置原生项目,无需手动修改原生代码。

## 工作原理

Config Plugin 会在预构建阶段自动执行以下操作:

### iOS 平台
1. 在 `Info.plist` 中添加高德地图 API Key
2. 添加定位权限描述
3. 在 `AppDelegate` 中自动初始化高德地图 SDK
4. 配置后台定位模式

### Android 平台
1. 在 `AndroidManifest.xml` 中添加 API Key
2. 添加必要的权限(定位、网络等)
3. 配置 meta-data

## 使用方法

### 1. 安装依赖

```bash
npm install expo-gaode-map
# 或
yarn add expo-gaode-map
```

### 2. 配置 app.json

在你的 `app.json` 或 `app.config.js` 中添加插件配置:

```json
{
  "expo": {
    "name": "你的应用",
    "plugins": [
      [
        "expo-gaode-map",
        {
          "iosApiKey": "你的iOS高德地图API Key",
          "androidApiKey": "你的Android高德地图API Key",
          "enableLocation": true,
          "locationDescription": "我们需要访问您的位置信息以提供地图服务"
        }
      ]
    ]
  }
}
```

### 3. 配置参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `iosApiKey` | string | 否 | - | iOS 平台的高德地图 API Key |
| `androidApiKey` | string | 否 | - | Android 平台的高德地图 API Key |
| `enableLocation` | boolean | 否 | true | 是否启用定位功能 |
| `locationDescription` | string | 否 | "需要访问您的位置信息以提供地图服务" | iOS 定位权限描述 |

### 4. 运行预构建

```bash
npx expo prebuild
```

这会自动生成或更新原生项目目录,并应用所有配置。

### 5. 运行项目

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 高级用法

### 使用 app.config.js 动态配置

如果需要根据环境变量动态配置 API Key:

```javascript
// app.config.js
export default {
  expo: {
    name: "你的应用",
    plugins: [
      [
        "expo-gaode-map",
        {
          iosApiKey: process.env.GAODE_IOS_API_KEY,
          androidApiKey: process.env.GAODE_ANDROID_API_KEY,
          enableLocation: true,
          locationDescription: "我们需要访问您的位置信息以提供地图服务"
        }
      ]
    ]
  }
};
```

### 多环境配置

```javascript
// app.config.js
const isDev = process.env.APP_ENV === 'development';

export default {
  expo: {
    name: "你的应用",
    plugins: [
      [
        "expo-gaode-map",
        {
          iosApiKey: isDev 
            ? process.env.GAODE_IOS_API_KEY_DEV 
            : process.env.GAODE_IOS_API_KEY_PROD,
          androidApiKey: isDev 
            ? process.env.GAODE_ANDROID_API_KEY_DEV 
            : process.env.GAODE_ANDROID_API_KEY_PROD,
          enableLocation: true
        }
      ]
    ]
  }
};
```

## 自动配置的内容

### iOS (Info.plist)

```xml
<key>AMapApiKey</key>
<string>你的API Key</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>需要访问您的位置信息以提供地图服务</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>需要访问您的位置信息以提供地图服务</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>需要访问您的位置信息以提供地图服务</string>

<key>UIBackgroundModes</key>
<array>
  <string>location</string>
</array>
```

### iOS (AppDelegate)

```objective-c
#import <AMapFoundationKit/AMapFoundationKit.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [AMapServices sharedServices].apiKey = @"你的API Key";
  // ... 其他代码
}
```

### Android (AndroidManifest.xml)

```xml
<!-- 权限 -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.INTERNET" />

<application>
  <!-- API Key -->
  <meta-data
    android:name="com.amap.api.v2.apikey"
    android:value="你的API Key" />
</application>
```

## 常见问题

### 1. 预构建后 API Key 没有生效

**解决方案:**
- 确保在 `app.json` 中正确配置了 API Key
- 删除 `ios` 和 `android` 目录后重新运行 `npx expo prebuild`
- 检查 API Key 是否有引号或空格

### 2. 定位权限没有添加

**解决方案:**
- 确保 `enableLocation` 设置为 `true` 或不设置(默认为 true)
- 重新运行 `npx expo prebuild`

### 3. 修改配置后不生效

**解决方案:**
```bash
# 清理并重新预构建
rm -rf ios android
npx expo prebuild
```

### 4. 在 EAS Build 中使用

在 `eas.json` 中配置环境变量:

```json
{
  "build": {
    "production": {
      "env": {
        "GAODE_IOS_API_KEY": "your-ios-key",
        "GAODE_ANDROID_API_KEY": "your-android-key"
      }
    }
  }
}
```

## 不使用 Config Plugin

如果你不想使用 Config Plugin,也可以手动配置原生项目。请参考:
- [手动配置 iOS](./INITIALIZATION.md#ios-配置)
- [手动配置 Android](./INITIALIZATION.md#android-配置)

## 注意事项

1. **API Key 安全性**: 不要将 API Key 直接提交到代码仓库,建议使用环境变量
2. **重新预构建**: 每次修改插件配置后,都需要重新运行 `npx expo prebuild`
3. **原生目录**: 如果项目中已存在 `ios` 和 `android` 目录,prebuild 会更新它们
4. **版本兼容**: 确保 `expo` 版本 >= 50

## 相关链接

- [Expo Config Plugins 官方文档](https://docs.expo.dev/config-plugins/introduction/)
- [高德地图开放平台](https://lbs.amap.com/)
- [如何获取 API Key](https://lbs.amap.com/api/android-sdk/guide/create-project/get-key)