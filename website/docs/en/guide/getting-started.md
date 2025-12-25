# Getting Started

Quick start guide to help you integrate expo-gaode-map into your Expo project.

## Prerequisites

- Node.js >= 16
- Expo SDK >= 50
- React Native >= 0.73

## Installation

```bash
bun install expo-gaode-map
```

Or using other package managers:

```bash
# Using yarn
yarn add expo-gaode-map

```

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
          "iosApiKey": "your-ios-api-key",
          "androidApiKey": "your-android-api-key",
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

## Basic Usage

### 1. Initialize SDK

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// Initialize before using any map features
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});
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
      // 1. Configure privacy compliance
      ExpoGaodeMapModule.updatePrivacyAgree(true);
      ExpoGaodeMapModule.updatePrivacyShow(true, true);

      // 2. Initialize SDK
      ExpoGaodeMapModule.initSDK({
        androidKey: 'your-android-api-key',
        iosKey: 'your-ios-api-key',
      });

      // 3. Request location permission
      const granted = await ExpoGaodeMapModule.requestLocationPermission();
      
      if (granted) {
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