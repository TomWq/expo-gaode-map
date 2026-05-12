# Getting Started

Quick start guide to help you integrate expo-gaode-map into your Expo project.

## AI-assisted integration Skill

If you want an AI coding agent to wire `expo-gaode-map` into an existing Expo / React Native project, install `expo-gaode-map-skill`. It guides the agent through package selection, Expo config changes, Config Plugin setup, a minimal map screen, and the required `prebuild` step.

### Install in Codex

```bash
npx skills add TomWq/expo-gaode-map-skill
```

Restart Codex after installation so the new Skill is loaded. Then use a prompt like:

```text
Integrate expo-gaode-map into the current Expo project, keep the existing navigation structure, and add a minimal runnable map screen.
```

### Other AI tools

For Claude Code, Cursor, Windsurf, Cline, Roo Code, and similar tools, ask the agent to read `AGENTS.md` from the Skill repository, or copy `AGENTS.md` / `references/` into the rules file used by your tool.

Skill repository: [TomWq/expo-gaode-map-skill](https://github.com/TomWq/expo-gaode-map-skill)

## Prerequisites

- Node.js >= 16
- Expo SDK >= 50
- React Native >= 0.73

## Project Structure

`expo-gaode-map` uses a monorepo architecture and provides modular packages:

- **`expo-gaode-map`** - core package for map display, location, and overlays
- **Built-in search** - already included in `expo-gaode-map` and `expo-gaode-map-navigation`
- **`expo-gaode-map-navigation`** - optional navigation package; do not install it together with `expo-gaode-map`
- **`expo-gaode-map-web-api`** - optional Web API package

Install only the packages you need to avoid unnecessary app size growth.

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

### Search features

Search is built into the core package and navigation package, so you do not need to install `expo-gaode-map-search` separately.

::: warning Standalone search package notice
`2.2.33` is the last version that supports standalone `expo-gaode-map-search` integration. From the next version onward, the separate search package is no longer maintained.

After AMap Android SDK `10.0.700`, the official remote dependency bundle changed from "map + location" to "map + location + search", and the dependency coordinate changed from `com.amap.api:3dmap:latest.integration` to `com.amap.api:3dmap-location-search:latest.integration`. Legacy projects that still need the standalone package should pin `expo-gaode-map-search@2.2.33`.
:::

### Navigation package (optional)

If you need navigation features:

```bash
npm install expo-gaode-map-navigation
```

### Web API package (optional)

If you need Web API services:

```bash
npm install expo-gaode-map-web-api
```

### Expo projects

If you are using an Expo-managed project, rebuild native code after installation:

```bash
# With EAS Build
eas build --platform android

# Or with a local build
npx expo prebuild
npx expo run:android
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

### 4. Add overlays

```tsx
import { MapView, Marker, Circle } from 'expo-gaode-map';

export default function MapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
    >
      <Marker position={{ latitude: 39.9, longitude: 116.4 }} title="Beijing" />
      <Circle
        center={{ latitude: 39.9, longitude: 116.4 }}
        radius={1000}
        fillColor="#8800FF00"
        strokeColor="#FFFF0000"
      />
    </MapView>
  );
}
```

### 5. Custom map styles

`expo-gaode-map` supports custom map styles so your map can match your app's visual language.

Use an online style:

```tsx
<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  customMapStyle={{
    styleId: 'your-style-id',
  }}
/>
```

Use local style files:

```tsx
<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  customMapStyle={{
    styleDataPath: 'style.data',
    extraStyleDataPath: 'style.extra',
  }}
/>
```

### 6. Use search features

After installing `expo-gaode-map` or `expo-gaode-map-navigation`:

```tsx
import { searchPOI, searchNearby } from 'expo-gaode-map';

const results = await searchPOI({
  keyword: 'hotel',
  city: 'Beijing',
  pageSize: 20,
});

const nearby = await searchNearby({
  keyword: 'restaurant',
  center: { latitude: 39.9, longitude: 116.4 },
  radius: 1000,
});
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

### Do I still need to configure API keys in code after configuring native keys?

**No.** If API keys are already configured in the native project through Config Plugin or manual setup, you do not need to pass `androidKey` or `iosKey` in JavaScript again. Only Web API services need `webKey`:

```tsx
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key',
});
```

### Why keep mobile keys in native projects?

Keeping mobile keys in native projects is safer because it avoids exposing sensitive keys in JavaScript. Expo projects should use Config Plugin when possible; bare React Native projects can write keys manually into `AndroidManifest.xml` / `Info.plist`. Web API keys are the exception because they are used from JavaScript.

### How do I install only the modules I need?

```bash
# Map and location only
npm install expo-gaode-map

# Map, location, and search
npm install expo-gaode-map

# Web API services
npm install expo-gaode-map expo-gaode-map-web-api

# Navigation features
npm install expo-gaode-map-navigation
```

## Next Steps

- [Initialization Guide](./initialization) - Detailed initialization and permission setup
- [Config Plugin](./config-plugin) - Automatic configuration with Config Plugin
- [API Documentation](/en/api/) - Complete API reference
- [Examples](/en/examples/) - More code examples

## Need Help?

- [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- View and participate in [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- QQ Group: 952241387
