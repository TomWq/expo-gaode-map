# API Documentation

Complete API reference documentation.

> ⚠️ **Permission and Privacy Compliance Warning**
>
> Before using map and location features, ensure:
> 1. ✅ Required permissions are configured in native project
> 2. ✅ Request user authorization at runtime
> 3. ✅ Comply with privacy laws and regulations
> 4. ✅ Configure AMap SDK privacy compliance interface

## Table of Contents

- [MapView Props](/en/api/mapview)
- [MapView Methods](/en/api/mapview#mapview-methods)
- [Location API](/en/api/location)
- [Overlay Components](/en/api/overlays)
- [Type Definitions](/en/api/types)

## Quick Navigation

### Map Component

```tsx
import { MapView } from 'expo-gaode-map';

<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  myLocationEnabled={true}
/>
```

### Location Features

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// Initialize SDK
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});

// Get current location
const location = await ExpoGaodeMapModule.getCurrentLocation();
```

### Overlays

```tsx
import { Circle, Marker, Polyline, Polygon } from 'expo-gaode-map';

<MapView>
  <Marker position={{ latitude: 39.9, longitude: 116.4 }} />
  <Circle center={{ latitude: 39.9, longitude: 116.4 }} radius={1000} />
</MapView>
```

## Related Documentation

- [Examples](/en/examples/) - Detailed code examples
- [Initialization Guide](/en/guide/initialization) - SDK initialization and permission management
- [Getting Started](/en/guide/getting-started) - Quick start guide