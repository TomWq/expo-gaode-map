# Initialization

This guide explains how to initialize the AMap SDK and configure permissions.

## SDK Initialization

::: warning Privacy Compliance
Before calling any AMap capability, you must first complete runtime privacy consent:
On a fresh install, you must do this yourself from your app's privacy UI.
After consent is granted once, native iOS / Android now persist and automatically restore the privacy state on later cold starts.

Config Plugin only writes native keys and permission declarations. It does **not** replace the first runtime privacy step.
:::

### Basic Initialization

Initialize the SDK only after privacy consent is completed:

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const privacyStatus = ExpoGaodeMapModule.getPrivacyStatus();

if (!privacyStatus.isReady) {
  // Call this from your own privacy dialog "Agree" callback
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    privacyVersion: '2026-03-13',
  });
}

// Enable World Vector Map (Overseas Map) support
// Must be called before initSDK
ExpoGaodeMapModule.setLoadWorldVectorMap(true);

// Initialize SDK
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});
```

### Get API Keys

1. Visit [AMap Open Platform](https://lbs.amap.com/)
2. Register and log in
3. Create an application
4. Get API Keys for Android and iOS platforms

### Using Environment Variables

For better security, use environment variables:

```typescript
// app.config.js
export default {
  expo: {
    plugins: [
      [
        'expo-gaode-map',
        {
          iosKey: process.env.GAODE_IOS_API_KEY,
          androidKey: process.env.GAODE_ANDROID_API_KEY,
        }
      ]
    ]
  }
};
```

## Permission Configuration

### iOS Permissions

Add location permission descriptions to `Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need to access your location to provide map services</string>

<key>NSLocationAlwaysUsageDescription</key>
<string>We need to access your location to provide map services</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need to access your location to provide map services</string>
```

For background location:

```xml
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
</array>
```

### Android Permissions

Add permissions to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

For background location (Android 10+):

```xml
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

## Runtime Permission Requests

### Request Location Permission

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

async function requestLocationPermission() {
  try {
    const result = await ExpoGaodeMapModule.requestLocationPermission();
    if (result.granted) {
      console.log('Location permission granted');
    } else {
      console.log('Location permission denied');
    }
  } catch (error) {
    console.error('Error requesting permission:', error);
  }
}
```

### Check Permission Status

```typescript
const status = await ExpoGaodeMapModule.checkLocationPermission();
console.log('Has location permission:', status.granted);
```

## Privacy Compliance

⚠️ **Important**: Before collecting location data on a fresh install, you must:

1. Display privacy policy to users
2. Obtain user consent
3. Call `setPrivacyConfig(...)`
4. After that, privacy state is persisted natively and restored automatically on later cold starts

### Configure Privacy Compliance

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

ExpoGaodeMapModule.setPrivacyConfig({
  hasShow: true,
  hasContainsPrivacy: true,
  hasAgree: true,
  privacyVersion: '2026-03-13',
});
```

### Privacy Compliance Process

```typescript
// 1. Show privacy policy on app first launch
function showPrivacyPolicy() {
  // Display your privacy policy UI
  // After user agrees:
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
  });
}

// 2. Then initialize SDK
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // only needed for Web API features
});

// 3. Request location permission
await requestLocationPermission();
```

## Using Config Plugin

For Expo projects, you can use Config Plugin to automatically configure:

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

Then run:

```bash
npx expo prebuild
```

See [Config Plugin Guide](./config-plugin) for details.

## Troubleshooting

### Map Not Displaying

1. Check if API Keys are correct
2. Ensure SDK is initialized before using map
3. Check network connection
4. Verify package name/Bundle ID matches the one registered with API Key

### Location Not Working

1. Ensure location permissions are granted
2. Check privacy compliance configuration
3. Verify location services are enabled on device
4. Check location permission descriptions in Info.plist (iOS)

### Permission Request Failed

```typescript
// Check current permission status
const status = await ExpoGaodeMapModule.checkLocationPermission();

if (!status.granted) {
  // Request permission
  const result = await ExpoGaodeMapModule.requestLocationPermission();
  
  if (!result.granted) {
    // Guide user to settings
    Alert.alert(
      'Permission Required',
      'Please enable location permission in Settings',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openSettings }
      ]
    );
  }
}
```

## Complete Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { MapView, ExpoGaodeMapModule } from 'expo-gaode-map';

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeMap();
  }, []);

  async function initializeMap() {
    try {
      // 1. Configure privacy compliance
      if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
        ExpoGaodeMapModule.setPrivacyConfig({
          hasShow: true,
          hasContainsPrivacy: true,
          hasAgree: true,
        });
      }

      // 2. Initialize SDK
      ExpoGaodeMapModule.initSDK({});

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
    return <View style={{ flex: 1 }} />;
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      myLocationEnabled={true}
    />
  );
}

export default App;
```

## Next Steps

- [MapView API](/en/api/mapview)
- [Location API](/en/api/location)
- [Examples](/en/examples/)

## Related Resources

- [AMap Open Platform](https://lbs.amap.com/)
- [Privacy Compliance Guidelines](https://lbs.amap.com/api/android-sdk/guide/create-project/dev-attention)
- [iOS Location Permission Best Practices](https://developer.apple.com/documentation/corelocation/requesting_authorization_to_use_location_services)
