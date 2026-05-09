# Examples

Complete code examples to help you get started quickly.

> The snippets on this page are for quick reference. For runnable apps, prefer the local `example/` and `example-navigation/` projects in this repository.

## Basic Examples

### [Basic Map](/en/examples/basic-map)
Learn how to create a basic map application, including:
- Initialize SDK
- Display map
- Configure map type
- Control map gestures

### [Location Tracking](/en/examples/location-tracking)
Learn how to implement location tracking features, including:
- Request location permission
- Continuous location updates
- Single location request
- Display user location on map

### [Overlays](/en/examples/overlays)
Learn how to add various overlays on the map, including:
- Markers
- Circles
- Polylines
- Polygons

### [Search Features](/en/examples/search)
Learn how to use the search module, including:
- POI keyword search
- Nearby search
- Route search
- Autocomplete suggestions

## Quick Start

### 1. Install Dependencies

```bash
npm install expo-gaode-map
```

### 2. Configure API Keys

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
  });
}

ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});
```

### 3. Display Map

```tsx
import { MapView } from 'expo-gaode-map';

function App() {
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

## Common Patterns

### Initialize and Request Permission

```tsx
import { useEffect } from 'react';
import { ExpoGaodeMapModule } from 'expo-gaode-map';

function useMapInit() {
  useEffect(() => {
    const init = async () => {
      if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
        ExpoGaodeMapModule.setPrivacyConfig({
          hasShow: true,
          hasContainsPrivacy: true,
          hasAgree: true,
        });
      }

      // Only needed for Web API features
      // ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

      // Request permission
      const result = await ExpoGaodeMapModule.requestLocationPermission();
      if (!result.granted) {
        console.log('Location permission denied');
      }
    };

    init();
  }, []);
}
```

### Use Ref to Control Map

```tsx
import { useRef } from 'react';
import { MapView, type MapViewRef } from 'expo-gaode-map';

function MapWithControls() {
  const mapRef = useRef<MapViewRef>(null);

  const moveToBeijing = () => {
    mapRef.current?.setCenter(
      { latitude: 39.9, longitude: 116.4 },
      true
    );
  };

  const zoomIn = () => {
    mapRef.current?.setZoom(15, true);
  };

  return (
    <>
      <MapView ref={mapRef} style={{ flex: 1 }} />
      <Button onPress={moveToBeijing} title="Go to Beijing" />
      <Button onPress={zoomIn} title="Zoom In" />
    </>
  );
}
```

### Listen to Location Updates

```tsx
import { useEffect, useState } from 'react';
import { ExpoGaodeMapModule } from 'expo-gaode-map';

function LocationTracker() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Start location
    ExpoGaodeMapModule.start();

    // Listen to updates
    const subscription = ExpoGaodeMapModule.addLocationListener(
      'onLocationUpdate',
      setLocation
    );

    return () => {
      subscription.remove();
      ExpoGaodeMapModule.stop();
    };
  }, []);

  return (
    <View>
      {location && (
        <Text>
          {location.latitude}, {location.longitude}
        </Text>
      )}
    </View>
  );
}
```

## Extended Features

### Search Features

```tsx
import { searchPOI, searchNearby, getInputTips } from 'expo-gaode-map';

// Keyword search
const result = await searchPOI({
  keyword: 'Starbucks',
  city: 'Beijing',
  pageNum: 1,
  pageSize: 20
});

// Nearby search
const nearby = await searchNearby({
  center: { latitude: 39.9, longitude: 116.4 },
  keyword: 'restaurant',
  radius: 2000,
});

// Autocomplete
const tips = await getInputTips({
  keyword: 'Star',
  city: 'Beijing',
});
```

Learn more: [Search Examples](/en/examples/search)

## More Examples

- `example/` - complete local map example app
- `example-navigation/` - complete local navigation example app
- [API Documentation](/en/api/) - Detailed API reference
- [Search API](/en/api/search) - Search module API reference
- [Initialization Guide](/en/guide/initialization) - SDK initialization guide

## Complete Example

This example includes privacy compliance, permission handling, and loading states:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Alert, Linking, Platform } from 'react-native';
import {
  MapView,
  ExpoGaodeMapModule,
  type LatLng,
} from 'expo-gaode-map';

export default function App() {
  const [initialPosition, setInitialPosition] = useState<{
    target: LatLng;
    zoom: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
          ExpoGaodeMapModule.setPrivacyConfig({
            hasShow: true,
            hasContainsPrivacy: true,
            hasAgree: true,
          });
        }

        const status = await ExpoGaodeMapModule.checkLocationPermission();

        if (!status.granted) {
          const result = await ExpoGaodeMapModule.requestLocationPermission();

          if (!result.granted) {
            setInitialPosition({
              target: { latitude: 39.9, longitude: 116.4 },
              zoom: 10,
            });

            Alert.alert(
              'Location permission required',
              'Please enable location permission in settings',
              [
                { text: 'Cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  },
                },
              ]
            );
            return;
          }
        }

        const location = await ExpoGaodeMapModule.getCurrentLocation();
        setInitialPosition({
          target: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          zoom: 15,
        });
      } catch (err) {
        console.error('Initialization failed:', err);
        setError('Initialization failed');
        setInitialPosition({
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10,
        });
      }
    };

    initialize();
  }, []);

  if (!initialPosition && !error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={initialPosition!}
      myLocationEnabled={true}
      onLoad={() => console.log('Map loaded')}
    />
  );
}
```

## Next Steps

- [Basic Map](/en/examples/basic-map) - learn the basics
- [Location Tracking](/en/examples/location-tracking) - learn location features
- [Overlays](/en/examples/overlays) - learn overlay usage
- [API Documentation](/en/api/) - full API reference

## Need Help?

- [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues) - Report bugs or request features
- [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues) - Ask questions and share experiences
- QQ Group: 952241387
