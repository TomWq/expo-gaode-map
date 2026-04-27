# Getting Started

Quick start guide to help you integrate expo-gaode-map into your Expo project.

## Prerequisites

- Node.js >= 16
- Expo SDK >= 50
- React Native >= 0.73

## Installation

::: warning Version Compatibility
- If you are using **Expo SDK 54+**, please install the **Latest** version.
- If you are using **Expo SDK 53 or lower** (e.g., 50, 51, 52, 53), please use the **V1** version (Tag: `v1`).
  ```bash
  npm install expo-gaode-map@v1
  ```
  **Note**: Apart from lacking **World Map** functionality, the V1 version shares the same API as V2 (Latest).
:::

```bash
bun add expo-gaode-map
```

Or using other package managers:

```bash
# Using yarn
yarn add expo-gaode-map

# Using npm
npm install expo-gaode-map

```

### Bare React Native (non-Expo managed) projects

This package uses Expo Modules. In plain React Native apps, install Expo Modules first:

```bash
npx install-expo-modules@latest
npm install expo-gaode-map
cd ios && pod install && cd ..
npx react-native run-ios
npx react-native run-android
```

If Expo Modules is already integrated in your app, you can skip `install-expo-modules`.

## Get API Keys

1. Visit [AMap Open Platform](https://lbs.amap.com/)
2. Register and log in
3. Create an application
4. Get API Keys for Android and iOS platforms

## Configuration

### Using Config Plugin (Recommended)

Add to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "iosKey": "your-ios-api-key",
          "androidKey": "your-android-api-key",
          "enableLocation": true,
          "locationDescription": "We need to access your location to provide map services"
        }
      ]
    ]
  }
}
```

Then run prebuild:

```bash
npx expo prebuild
```

### Manual Configuration

If you prefer manual configuration, see [Initialization Guide](./initialization).

If you do **not** use Config Plugin, you **must** call:

```typescript
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});
```

before using map/location/search/navigation capabilities.

## Basic Usage

### 1. Privacy + Initialization

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 1. On first install, complete privacy compliance once
if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    privacyVersion: '2026-03-13',
  });
}

// 2. With Config Plugin, native SDK auto-initializes by default.
// Only call initSDK when you need Web API features:
// ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });
```

### 2. Display Map

```tsx
import { MapView } from 'expo-gaode-map';

export default function App() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    />
  );
}
```

### 3. Enable Location

```tsx
<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  myLocationEnabled={true}
  followUserLocation={true}
/>
```

## Complete Example

For runnable apps, prefer the local `example/` and `example-navigation/` projects in this repository.

```tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { MapView, ExpoGaodeMapModule } from 'expo-gaode-map';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeMap();
  }, []);

  async function initializeMap() {
    try {
      // 1. On first install, save privacy consent after the user agrees
      if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
        ExpoGaodeMapModule.setPrivacyConfig({
          hasShow: true,
          hasContainsPrivacy: true,
          hasAgree: true,
        });
      }

      // 2. Only needed for Web API features
      // ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

      // 3. Request location permission
      const result = await ExpoGaodeMapModule.requestLocationPermission();
      
      if (result.granted) {
        setIsReady(true);
      } else {
        Alert.alert('Location permission is required');
      }
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  if (!isReady) {
    return <View style={styles.container} />;
  }

  return (
    <MapView
      style={styles.container}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      myLocationEnabled={true}
      onLoad={() => console.log('Map loaded')}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

## Run Your App

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

## Common Issues

### Map Not Displaying

**Check:**
- ✅ API Keys are correct
- ✅ SDK is initialized before map component renders
- ✅ Network connection is available
- ✅ Package name/Bundle ID matches the one registered with API Key

### Location Not Working

**Check:**
- ✅ Location permissions are granted
- ✅ Privacy compliance is configured
- ✅ Location services are enabled on device
- ✅ Permission descriptions are added to Info.plist (iOS)

### Build Errors

**Solutions:**
```bash
# Clean build
cd ios && pod deintegrate && pod install && cd ..

# Or for Android
cd android && ./gradlew clean && cd ..

# Rebuild
npx expo prebuild --clean
```

## Next Steps

- [Initialization Guide](./initialization) - Detailed initialization and permission setup
- [Config Plugin](./config-plugin) - Automatic configuration with Config Plugin
- [API Documentation](/en/api/) - Complete API reference
- [Examples](/en/examples/) - More code examples

## Need Help?

- [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- QQ Group: 952241387
