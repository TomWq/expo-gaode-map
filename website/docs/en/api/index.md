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

### Core Features

- [MapView Props & Methods](/en/api/mapview)
- [Components & Hooks](/en/api/mapview#components-and-hooks)
- [Location API](/en/api/location)
- [Geometry Utils](/en/api/geometry)
- [Overlay Components](/en/api/overlays)
- [Type Definitions](/en/api/types)

### Extended Features

- [Search API](/en/api/search) - POI search, nearby search, along-route search, input tips
- [Navigation API](/en/api/navigation) - Route planning and navigation
- [Offline Maps API](/en/api/offline-map) - City map download and management
- [Web API](/en/api/web-api) - AMap Web Service API (pure JavaScript)

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

### Search Features

```tsx
import { searchPOI, searchNearby, getInputTips } from 'expo-gaode-map-search';

// Keyword search
const result = await searchPOI({
  keyword: 'Starbucks',
  city: 'Beijing',
});

// Nearby search
const nearby = await searchNearby({
  center: { latitude: 39.9, longitude: 116.4 },
  keyword: 'restaurant',
  radius: 2000,
});

// Input tips
const tips = await getInputTips({
  keyword: 'Star',
  city: 'Beijing',
});
```

## Related Documentation

- [Examples](/en/examples/) - Detailed code examples
- [Search Examples](/en/examples/search) - Search feature examples
- [Initialization Guide](/en/guide/initialization) - SDK initialization and permission management
- [Getting Started](/en/guide/getting-started) - Quick start guide
