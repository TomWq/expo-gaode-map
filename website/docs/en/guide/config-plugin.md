# Config Plugin

## Overview

`expo-gaode-map` provides an Expo Config Plugin that automatically configures native projects when running `npx expo prebuild`, eliminating the need for manual native code modifications.

## Quick Start

### 1. Installation

```bash
npm install expo-gaode-map
# or
yarn add expo-gaode-map
```

### 2. Configure app.json

Add plugin configuration to your `app.json` file in the project root:

```json
{
  "expo": {
    "name": "Your App",
    "plugins": [
      [
        "expo-gaode-map",
        {
          "iosApiKey": "Your iOS Gaode Map API Key",
          "androidApiKey": "Your Android Gaode Map API Key",
          "enableLocation": true,
          "locationDescription": "We need to access your location to provide map services"
        }
      ]
    ]
  }
}
```

### 3. Run Prebuild

```bash
npx expo prebuild
```

### 4. Run Project

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## Configuration Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `iosApiKey` | string | No | - | iOS platform Gaode Map API Key |
| `androidApiKey` | string | No | - | Android platform Gaode Map API Key |
| `enableLocation` | boolean | No | true | Enable location functionality |
| `locationDescription` | string | No | "We need to access your location to provide map services" | iOS location permission description |

## Auto-Configured Content

The Config Plugin automatically configures the following:

### iOS Platform

#### Info.plist
```xml
<!-- API Key -->
<key>AMapApiKey</key>
<string>Your API Key</string>

<!-- Location Permissions -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need to access your location to provide map services</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>We need to access your location to provide map services</string>

<!-- Background Location -->
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
  [AMapServices sharedServices].apiKey = @"Your API Key";
  // ...
}
```

### Android Platform

#### AndroidManifest.xml
```xml
<!-- Permissions -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.INTERNET" />

<application>
  <!-- API Key -->
  <meta-data
    android:name="com.amap.api.v2.apikey"
    android:value="Your API Key" />
</application>
```

## Advanced Usage

### Dynamic Configuration

Use `app.config.js` to configure dynamically based on environment variables:

```javascript
export default {
  expo: {
    name: "Your App",
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

### Multi-Environment Configuration

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

## EAS Build Configuration

Configure environment variables in `eas.json`:

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

## Troubleshooting

### API Key Not Working

1. Ensure API Key is correctly configured in `app.json`
2. Delete `ios` and `android` directories, then run `npx expo prebuild` again
3. Check for extra spaces or quotes in API Key

### Configuration Changes Not Taking Effect

```bash
# Clean and rebuild
rm -rf ios android
npx expo prebuild
```

### Location Permissions Not Added

Ensure `enableLocation` is set to `true` or not set (defaults to true)

## Without Config Plugin

If you prefer not to use Config Plugin, you can manually configure native projects. See [Initialization](./initialization.md).

## Notes

- ⚠️ **API Key Security**: Don't commit API Keys directly to repository, use environment variables
- 🔄 **Rebuild Required**: After modifying plugin configuration, you must run `npx expo prebuild` again
- 📱 **Version Requirements**: Expo SDK >= 50
- 🏗️ **Native Directories**: If `ios` and `android` directories already exist, prebuild will update them

## Related Resources

- [Expo Config Plugins Official Documentation](https://docs.expo.dev/config-plugins/introduction/)
- [Gaode Map Open Platform](https://lbs.amap.com/)
- [Get API Key](https://lbs.amap.com/api/android-sdk/guide/create-project/get-key)