# Expo Config Plugin Configuration Guide

## Overview

`expo-gaode-map` provides an Expo Config Plugin that automatically configures native projects when running `npx expo prebuild`, eliminating the need for manual native code modifications.

## How It Works

The Config Plugin automatically performs the following operations during the prebuild phase:

### iOS Platform
1. Adds Gaode Map API Key to `Info.plist`
2. Adds location permission descriptions
3. Automatically initializes Gaode Map SDK in `AppDelegate`
4. Configures background location mode

### Android Platform
1. Adds API Key to `AndroidManifest.xml`
2. Adds necessary permissions (location, network, etc.)
3. Configures meta-data

## Usage

### 1. Install Dependencies

```bash
npm install expo-gaode-map
# or
yarn add expo-gaode-map
```

### 2. Configure app.json

Add plugin configuration to your `app.json` or `app.config.js`:

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

### 3. Configuration Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `iosApiKey` | string | No | - | iOS platform Gaode Map API Key |
| `androidApiKey` | string | No | - | Android platform Gaode Map API Key |
| `enableLocation` | boolean | No | true | Enable location functionality |
| `locationDescription` | string | No | "We need to access your location to provide map services" | iOS location permission description |

### 4. Run Prebuild

```bash
npx expo prebuild
```

This will automatically generate or update native project directories and apply all configurations.

### 5. Run Project

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## Advanced Usage

### Dynamic Configuration with app.config.js

Configure API Keys dynamically based on environment variables:

```javascript
// app.config.js
export default {
  expo: {
    name: "Your App",
    plugins: [
      [
        "expo-gaode-map",
        {
          iosApiKey: process.env.GAODE_IOS_API_KEY,
          androidApiKey: process.env.GAODE_ANDROID_API_KEY,
          enableLocation: true,
          locationDescription: "We need to access your location to provide map services"
        }
      ]
    ]
  }
};
```

### Multi-Environment Configuration

```javascript
// app.config.js
const isDev = process.env.APP_ENV === 'development';

export default {
  expo: {
    name: "Your App",
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

## Auto-Configured Content

### iOS (Info.plist)

```xml
<key>AMapApiKey</key>
<string>Your API Key</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We need to access your location to provide map services</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>We need to access your location to provide map services</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need to access your location to provide map services</string>

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
  [AMapServices sharedServices].apiKey = @"Your API Key";
  // ... other code
}
```

### Android (AndroidManifest.xml)

```xml
<!-- Permissions -->
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
    android:value="Your API Key" />
</application>
```

## Troubleshooting

### 1. API Key Not Working After Prebuild

**Solution:**
- Ensure API Key is correctly configured in `app.json`
- Delete `ios` and `android` directories, then run `npx expo prebuild` again
- Check for quotes or spaces in API Key

### 2. Location Permissions Not Added

**Solution:**
- Ensure `enableLocation` is set to `true` or not set (defaults to true)
- Run `npx expo prebuild` again

### 3. Configuration Changes Not Taking Effect

**Solution:**
```bash
# Clean and rebuild
rm -rf ios android
npx expo prebuild
```

### 4. Using with EAS Build

Configure environment variables in `eas.json`:

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

## Without Config Plugin

If you prefer not to use Config Plugin, you can manually configure native projects. See:
- [Manual iOS Configuration](./INITIALIZATION.en.md#ios-configuration)
- [Manual Android Configuration](./INITIALIZATION.en.md#android-configuration)

## Notes

1. **API Key Security**: Don't commit API Keys directly to repository, use environment variables
2. **Rebuild Required**: After modifying plugin configuration, you must run `npx expo prebuild` again
3. **Native Directories**: If `ios` and `android` directories already exist, prebuild will update them
4. **Version Compatibility**: Ensure `expo` version >= 50

## Related Links

- [Expo Config Plugins Official Documentation](https://docs.expo.dev/config-plugins/introduction/)
- [Gaode Map Open Platform](https://lbs.amap.com/)
- [How to Get API Key](https://lbs.amap.com/api/android-sdk/guide/create-project/get-key)