# Initialization

This guide explains how to initialize the AMap SDK and configure permissions.

## SDK Initialization

### Basic Initialization

Initialize the SDK before using any map features:

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// Enable World Vector Map (Overseas Map) support
// Must be called before initSDK
ExpoGaodeMapModule.setLoadWorldVectorMap(true);

// Initialize SDK
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});
``````

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
          iosApiKey: process.env.GAODE_IOS_API_KEY,
          androidApiKey: process.env.GAODE_ANDROID_API_KEY,
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
    const granted = await ExpoGaodeMapModule.requestLocationPermission();
    if (granted) {
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
const hasPermission = await ExpoGaodeMapModule.hasLocationPermission();
console.log('Has location permission:', hasPermission);
```

## Privacy Compliance

⚠️ **Important**: Before collecting location data, you must:

1. Display privacy policy to users
2. Obtain user consent
3. Configure AMap SDK privacy compliance interface

### Configure Privacy Compliance

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// Update privacy consent status
ExpoGaodeMapModule.updatePrivacyAgree(true);

// Update privacy info status
ExpoGaodeMapModule.updatePrivacyShow(true, true);
```

### Privacy Compliance Process

```typescript
// 1. Show privacy policy on app first launch
function showPrivacyPolicy() {
  // Display your privacy policy UI
  // After user agrees:
  ExpoGaodeMapModule.updatePrivacyAgree(true);
  ExpoGaodeMapModule.updatePrivacyShow(true, true);
}

// 2. Then initialize SDK
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
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
const status = await ExpoGaodeMapModule.hasLocationPermission();

if (!status) {
  // Request permission
  const granted = await ExpoGaodeMapModule.requestLocationPermission();
  
  if (!granted) {
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