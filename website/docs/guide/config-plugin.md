# Config Plugin 配置

## 概述

`expo-gaode-map` 提供了 Expo Config Plugin,可以在运行 `npx expo prebuild` 时自动配置原生项目,无需手动修改原生代码。

## 快速开始

### 1. 安装

```bash
npm install expo-gaode-map
# 或
yarn add expo-gaode-map
```

### 2. 配置 app.json

在项目根目录的 `app.json` 文件中添加插件配置:

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

### 3. 运行预构建

```bash
npx expo prebuild
```

### 4. 运行项目

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## 配置参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `iosApiKey` | string | 否 | - | iOS 平台的高德地图 API Key |
| `androidApiKey` | string | 否 | - | Android 平台的高德地图 API Key |
| `enableLocation` | boolean | 否 | true | 是否启用定位功能 |
| `locationDescription` | string | 否 | "需要访问您的位置信息以提供地图服务" | iOS 定位权限描述 |

## 自动配置内容

Config Plugin 会自动完成以下配置:

### iOS 平台

#### Info.plist
```xml
<!-- API Key -->
<key>AMapApiKey</key>
<string>你的API Key</string>

<!-- 定位权限 -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要访问您的位置信息以提供地图服务</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>需要访问您的位置信息以提供地图服务</string>

<!-- 后台定位 -->
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
</array>
```

#### AppDelegate
```objective-c
#import <AMapFoundationKit/AMapFoundationKit.h>

- (BOOL)application:(UIApplication *)application 
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [AMapServices sharedServices].apiKey = @"你的API Key";
  // ...
}
```

### Android 平台

#### AndroidManifest.xml
```xml
<!-- 权限 -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.INTERNET" />

<application>
  <!-- API Key -->
  <meta-data
    android:name="com.amap.api.v2.apikey"
    android:value="你的API Key" />
</application>
```

## 高级用法

### 动态配置

使用 `app.config.js` 根据环境变量动态配置:

```javascript
export default {
  expo: {
    name: "你的应用",
    plugins: [
      [
        "expo-gaode-map",
        {
          iosApiKey: process.env.GAODE_IOS_API_KEY,
          androidApiKey: process.env.GAODE_ANDROID_API_KEY,
          enableLocation: true
        }
      ]
    ]
  }
};
```

### 多环境配置

```javascript
const isDev = process.env.APP_ENV === 'development';

export default {
  expo: {
    plugins: [
      [
        "expo-gaode-map",
        {
          iosApiKey: isDev 
            ? process.env.GAODE_IOS_API_KEY_DEV 
            : process.env.GAODE_IOS_API_KEY_PROD,
          androidApiKey: isDev 
            ? process.env.GAODE_ANDROID_API_KEY_DEV 
            : process.env.GAODE_ANDROID_API_KEY_PROD
        }
      ]
    ]
  }
};
```

## EAS Build 配置

在 `eas.json` 中配置环境变量:

```json
{
  "build": {
    "development": {
      "env": {
        "GAODE_IOS_API_KEY": "dev-ios-key",
        "GAODE_ANDROID_API_KEY": "dev-android-key"
      }
    },
    "production": {
      "env": {
        "GAODE_IOS_API_KEY": "prod-ios-key",
        "GAODE_ANDROID_API_KEY": "prod-android-key"
      }
    }
  }
}
```

## 常见问题

### API Key 没有生效

1. 确保在 `app.json` 中正确配置了 API Key
2. 删除 `ios` 和 `android` 目录后重新运行 `npx expo prebuild`
3. 检查 API Key 是否有多余的空格或引号

### 配置修改后不生效

```bash
# 清理并重新预构建
rm -rf ios android
npx expo prebuild
```

### 定位权限没有添加

确保 `enableLocation` 设置为 `true` 或不设置(默认为 true)

## 不使用 Config Plugin

如果不想使用 Config Plugin,可以手动配置原生项目。详见 [初始化配置](./initialization.md)。

## 注意事项

- ⚠️ **API Key 安全**: 不要将 API Key 直接提交到代码仓库,使用环境变量
- 🔄 **重新预构建**: 每次修改插件配置后需要重新运行 `npx expo prebuild`
- 📱 **版本要求**: Expo SDK >= 50
- 🏗️ **原生目录**: 如果已存在 `ios` 和 `android` 目录,prebuild 会更新它们

## 相关资源

- [Expo Config Plugins 官方文档](https://docs.expo.dev/config-plugins/introduction/)
- [高德地图开放平台](https://lbs.amap.com/)
- [获取 API Key](https://lbs.amap.com/api/android-sdk/guide/create-project/get-key)