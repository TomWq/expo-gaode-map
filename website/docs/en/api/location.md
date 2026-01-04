# Location API

Complete location functionality API documentation.

> ⚠️ **Permission Required**: All location APIs require location permission. Please check and request permission before use.

## Location Control

All location APIs are called through `ExpoGaodeMapModule`:

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// Initialize SDK
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});

// Start continuous location
ExpoGaodeMapModule.start();

// Stop location
ExpoGaodeMapModule.stop();

// Get current location
const location = await ExpoGaodeMapModule.getCurrentLocation();
```

## API List

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `initSDK` | `{androidKey, iosKey}` | `void` | Initialize SDK |
| `setLoadWorldVectorMap` | `enabled: boolean` | `void` | Enable/Disable world vector map (Overseas map). Must be called before initialization |
| `start` | - | `void` | Start continuous location |
| `stop` | - | `void` | Stop location |
| `isStarted` | - | `Promise<boolean>` | Check if location is active |
| `getCurrentLocation` | - | `Promise<Location>` | Get current location |

## Permission Management

### Check Permission

```tsx
const status = await ExpoGaodeMapModule.checkLocationPermission();
console.log(status.granted); // true or false
```

### Request Permission

```tsx
const result = await ExpoGaodeMapModule.requestLocationPermission();
if (result.granted) {
  console.log('Permission granted');
} else {
  console.log('Permission denied');
}
```

## Location Configuration

### Common Configuration

| Method | Parameters | Description |
|--------|------------|-------------|
| `setLocatingWithReGeocode` | `boolean` | Whether to return reverse geocoding |
| `setInterval` | `number` | Location interval (milliseconds) |
| `setGeoLanguage` | `number` | Reverse geocoding language |

### Android-Specific Configuration

| Method | Parameters | Description |
|--------|------------|-------------|
| `setLocationMode` | `0 \| 1 \| 2` | Location mode (0: High accuracy, 1: Battery saving, 2: Device only) |
| `setOnceLocation` | `boolean` | Single location |
| `setSensorEnable` | `boolean` | Use device sensors |

### iOS-Specific Configuration

| Method | Parameters | Description |
|--------|------------|-------------|
| `setLocationTimeout` | `number` | Location timeout (seconds) |
| `setReGeocodeTimeout` | `number` | Reverse geocoding timeout (seconds) |
| `setDesiredAccuracy` | `number` | Desired accuracy (0-5) |

## Event Listeners

### Listen to Location Updates

```tsx
const subscription = ExpoGaodeMapModule.addLocationListener(
  'onLocationUpdate',
  (location) => {
    console.log('Location updated:', location);
  }
);

// Unsubscribe
subscription.remove();
```

### Listen to Heading Updates (iOS)

```tsx
const subscription = ExpoGaodeMapModule.addLocationListener(
  'onHeadingUpdate',
  (heading) => {
    console.log('Heading updated:', heading);
  }
);

// Unsubscribe
subscription.remove();
```

## Coordinate Conversion

```tsx
const converted = await ExpoGaodeMapModule.coordinateConvert(
  { latitude: 39.9, longitude: 116.4 },
  0 // Conversion type
);
```

## Location Type

```typescript
interface Location {
  // Basic location info
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  bearing: number;
  speed: number;
  
  // Address info (requires reverse geocoding)
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  
  // Other info
  provider?: string;
  timestamp?: number;
}
```

## Complete Example

```tsx
import { useEffect, useState } from 'react';
import { ExpoGaodeMapModule, type Location } from 'expo-gaode-map';

export default function LocationExample() {
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    const init = async () => {
      // Initialize
      ExpoGaodeMapModule.initSDK({
        androidKey: 'your-android-key',
        iosKey: 'your-ios-key',
      });

      // Configure
      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setInterval(2000);

      // Listen
      const sub = ExpoGaodeMapModule.addLocationListener(
        'onLocationUpdate',
        setLocation
      );

      // Start location
      ExpoGaodeMapModule.start();

      return () => {
        sub.remove();
        ExpoGaodeMapModule.stop();
      };
    };

    init();
  }, []);

  return (
    <View>
      {location && (
        <Text>
          Location: {location.latitude}, {location.longitude}
        </Text>
      )}
    </View>
  );
}
```

## Related Documentation

- [Initialization Guide](/en/guide/initialization)
- [MapView API](/en/api/mapview)
- [Examples](/en/examples/location-tracking)