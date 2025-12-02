# Examples

Complete code examples to help you get started quickly.

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

## Quick Start

### 1. Install Dependencies

```bash
npm install expo-gaode-map
```

### 2. Configure API Keys

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

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
      // Initialize SDK
      ExpoGaodeMapModule.initSDK({
        androidKey: 'your-android-key',
        iosKey: 'your-ios-key',
      });

      // Request permission
      const granted = await ExpoGaodeMapModule.requestLocationPermission();
      if (!granted) {
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

## More Examples

- [GitHub Repository](https://github.com/TomWq/expo-gaode-map/tree/main/example) - View complete example project
- [API Documentation](/en/api/) - Detailed API reference
- [Initialization Guide](/en/guide/initialization) - SDK initialization guide

## Need Help?

- [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues) - Report bugs or request features
- [Discussions](https://github.com/TomWq/expo-gaode-map/discussions) - Ask questions and share experiences
- QQ Group: 952241387