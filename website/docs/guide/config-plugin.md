# Config Plugin 配置

## 概述

`expo-gaode-map` 提供了 Expo Config Plugin,可以在运行 `npx expo prebuild` 时自动配置原生项目,无需手动修改原生代码。

## 快速开始

### 1. 安装

```bash
bun add expo-gaode-map
# 或
yarn add expo-gaode-map
# 或
npm install expo-gaode-map
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
          "iosKey": "你的iOS高德地图API Key",
          "androidKey": "你的Android高德地图API Key",
          "enableLocation": true,
          "enableBackgroundLocation": false,
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
| `iosKey` | string | 否 | - | iOS 平台的高德地图 API Key |
| `androidKey` | string | 否 | - | Android 平台的高德地图 API Key |
| `enableLocation` | boolean | 否 | true | 是否启用定位功能 |
| `enableBackgroundLocation` | boolean | 否 | false | 是否启用后台定位（Android & iOS） |
| `locationDescription` | string | 否 | "需要访问您的位置信息以提供地图服务" | iOS 定位权限描述 |

## 自动配置内容

Config Plugin 会自动完成以下配置:

### iOS 平台

#### Info.plist
```xml
<!-- API Key -->
<key>AMapApiKey</key>
<string>你的API Key</string>

<!-- 使用时定位权限（始终添加） -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>需要访问您的位置信息以提供地图服务</string>

<!-- 以下仅在 enableBackgroundLocation=true 时添加 -->
<key>NSLocationAlwaysUsageDescription</key>
<string>需要访问您的位置信息以提供地图服务</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>需要访问您的位置信息以提供地图服务</string>

<!-- 后台定位模式 -->
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

**基础权限（始终添加）：**
```xml
<!-- 网络权限 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

<!-- 定位权限 -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

**后台定位权限（仅在 enableBackgroundLocation=true 时添加）：**
```xml
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

**应用配置：**
```xml
<application>
  <!-- API Key -->
  <meta-data
    android:name="com.amap.api.v2.apikey"
    android:value="你的API Key" />
    
  <!-- 前台服务（仅在 enableBackgroundLocation=true 时添加） -->
  <service
    android:name="expo.modules.gaodemap.services.LocationForegroundService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="location" />
</application>
```

## 后台定位配置

### 启用后台定位

如果你的应用需要在后台持续获取位置信息（例如导航、运动轨迹记录等），需要启用后台定位：

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "iosKey": "你的API Key",
          "androidKey": "你的API Key",
          "enableBackgroundLocation": true
        }
      ]
    ]
  }
}
```

### 后台定位的影响

当 `enableBackgroundLocation: true` 时：

**Android:**
- ✅ 添加后台定位权限（`ACCESS_BACKGROUND_LOCATION`）
- ✅ 添加前台服务权限（`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`）
- ✅ 自动注册 `LocationForegroundService` 服务
- ⚠️ 应用在后台时会显示常驻通知

**iOS:**
- ✅ 添加始终定位权限（`NSLocationAlwaysUsageDescription`）
- ✅ 启用后台定位模式（`UIBackgroundModes`）
- ⚠️ App Store 审核时需要说明使用原因

### 注意事项

- ⚠️ **权限敏感性**: 后台定位权限很敏感，用户可能拒绝授权
- ⚠️ **应用商店审核**: Google Play 和 App Store 会严格审查后台定位的使用
- ⚠️ **耗电量**: 后台定位会增加电池消耗
- ✅ **必要性原则**: 只在确实需要时才启用后台定位

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
          iosKey: process.env.GAODE_IOS_API_KEY,
          androidKey: process.env.GAODE_ANDROID_API_KEY,
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
          iosKey: isDev 
            ? process.env.GAODE_IOS_API_KEY_DEV 
            : process.env.GAODE_IOS_API_KEY_PROD,
          androidKey: isDev 
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