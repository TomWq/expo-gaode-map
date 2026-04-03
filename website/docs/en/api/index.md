# API Documentation

Complete API reference documentation.

> ⚠️ **Permission and Privacy Compliance Warning**
>
> Before using map and location features, ensure:
> 1. ✅ Required permissions are configured in native project
> 2. ✅ Request user authorization at runtime
> 3. ✅ Comply with privacy laws and regulations
> 4. ✅ On a fresh install, complete privacy consent before `initSDK`
> 5. ✅ After consent is granted once, privacy state is persisted and auto-restored natively

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

// Complete privacy compliance first
if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
  });
}

// Initialize SDK
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // only needed for Web API features
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
import { createNativeSearchRuntime } from 'expo-gaode-map-search';

const searchRuntime = createNativeSearchRuntime();

// Keyword search
const result = await searchRuntime.search.searchKeyword({
  keyword: 'Starbucks',
  city: 'Beijing',
});

// Nearby search
const nearby = await searchRuntime.search.searchNearby({
  center: { latitude: 39.9, longitude: 116.4 },
  keyword: 'restaurant',
  radius: 2000,
});

// Input tips
const tips = await searchRuntime.search.getInputTips({
  keyword: 'Star',
  city: 'Beijing',
});
```

## Related Documentation

- [Examples](/en/examples/) - Detailed code examples
- [Search Examples](/en/examples/search) - Search feature examples
- [Initialization Guide](/en/guide/initialization) - SDK initialization and permission management
- [Getting Started](/en/guide/getting-started) - Quick start guide
