# Navigation

`expo-gaode-map-navigation` is a standalone navigation module that integrates map display and navigation capabilities, providing route planning and real-time navigation features.

## Features

- ✅ **Integrated Map**: Built-in map display, no need for separate core package
- ✅ **Route Planning**: Supports driving, walking, cycling, and transit routes
- ✅ **Real-time Navigation**: Turn-by-turn voice guidance and route display
- ✅ **Independent Service**: Route planning without map display
- ✅ **Multi-strategy**: Supports various route planning strategies

## Important Notes

::: danger Binary Conflict
The navigation package conflicts with the core map package (`expo-gaode-map`) and **cannot be used together**. Choose one based on your needs:
- Use `expo-gaode-map-navigation` if you need navigation features
- Use `expo-gaode-map` if you only need map display
:::

## Installation

```bash
npm install expo-gaode-map-navigation
```

## Quick Start

### 1. Configure Plugin

Add to [`app.json`](app.json):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map-navigation",
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key"
        }
      ]
    ]
  }
}
```

### 2. Initialize SDK

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
  webKey: 'your-web-api-key', // Optional: for Web API package
});
```

### 3. Use Map Component

```typescript
import { ExpoGaodeMapView } from 'expo-gaode-map-navigation';

<ExpoGaodeMapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9042, longitude: 116.4074 },
    zoom: 10,
  }}
/>
```

## Route Planning

### Independent Route Service

Plan routes without displaying a map:

```typescript
import { 
  ExpoGaodeMapNavigationModule,
  DrivingStrategy 
} from 'expo-gaode-map-navigation';

// Driving route
const result = await ExpoGaodeMapNavigationModule.calculateDriveRoute({
  from: { latitude: 39.9042, longitude: 116.4074 },
  to: { latitude: 39.9, longitude: 116.3 },
  waypoints: [
    { latitude: 39.91, longitude: 116.35 }
  ],
  strategy: DrivingStrategy.AVOID_CONGESTION,
});

console.log(`Distance: ${result.distance}m`);
console.log(`Duration: ${result.duration}s`);
console.log(`Toll: ${result.tolls}元`);

// Walking route
const walkResult = await ExpoGaodeMapNavigationModule.calculateWalkRoute({
  from: { latitude: 39.9042, longitude: 116.4074 },
  to: { latitude: 39.9, longitude: 116.3 },
});

// Cycling route
const bikeResult = await ExpoGaodeMapNavigationModule.calculateBikeRoute({
  from: { latitude: 39.9042, longitude: 116.4074 },
  to: { latitude: 39.9, longitude: 116.3 },
});
```

### Navigation View

Display navigation interface with real-time guidance:

```typescript
import { ExpoGaodeMapNaviView } from 'expo-gaode-map-navigation';

<ExpoGaodeMapNaviView
  style={{ flex: 1 }}
  startPoint={{ latitude: 39.9042, longitude: 116.4074 }}
  endPoint={{ latitude: 39.9, longitude: 116.3 }}
  waypoints={[
    { latitude: 39.91, longitude: 116.35 }
  ]}
  strategy={DrivingStrategy.AVOID_CONGESTION}
  onCalculateRouteSuccess={(event) => {
    console.log('Route calculated:', event.nativeEvent);
  }}
  onCalculateRouteFailure={(event) => {
    console.error('Route failed:', event.nativeEvent);
  }}
/>
```

## Driving Strategies

| Strategy | Description |
|----------|-------------|
| `DrivingStrategy.DEFAULT` (0) | Default, recommended by Gaode |
| `DrivingStrategy.AVOID_CONGESTION` (1) | Avoid traffic jams |
| `DrivingStrategy.AVOID_HIGHWAY` (2) | Avoid highways |
| `DrivingStrategy.AVOID_TOLL` (3) | Avoid tolls |
| `DrivingStrategy.HIGHWAY_PRIORITY` (4) | Prefer highways |
| `DrivingStrategy.LESS_TOLL` (5) | Minimize tolls |
| `DrivingStrategy.DISTANCE_PRIORITY` (6) | Shortest distance |
| `DrivingStrategy.TIME_PRIORITY` (9) | Shortest time |

## Android Considerations

### Strategy Mapping

Android uses the `navi-3dmap` SDK with different strategy values. The module automatically maps them:

| Exposed Strategy | Android Value | Description |
|------------------|---------------|-------------|
| `DEFAULT` (0) | 0 | Default |
| `AVOID_CONGESTION` (1) | 4 | Avoid congestion |
| `AVOID_HIGHWAY` (2) | 3 | Avoid highways |
| `AVOID_TOLL` (3) | 1 | Avoid tolls |
| `HIGHWAY_PRIORITY` (4) | 6 | Highway priority |
| `LESS_TOLL` (5) | 2 | Less toll |
| `DISTANCE_PRIORITY` (6) | 5 | Distance priority |
| `TIME_PRIORITY` (9) | 10 | Time priority |

### Multi-strategy Support

Android supports combining multiple strategies:

```typescript
// Avoid highways + avoid tolls
const result = await ExpoGaodeMapNavigationModule.calculateDriveRoute({
  from: { latitude: 39.9042, longitude: 116.4074 },
  to: { latitude: 39.9, longitude: 116.3 },
  strategy: DrivingStrategy.AVOID_HIGHWAY | DrivingStrategy.AVOID_TOLL,
});
```

## API Reference

### Route Planning Methods

- [`calculateDriveRoute()`](ExpoGaodeMapNavigationModule.ts) - Calculate driving route
- [`calculateWalkRoute()`](ExpoGaodeMapNavigationModule.ts) - Calculate walking route
- [`calculateBikeRoute()`](ExpoGaodeMapNavigationModule.ts) - Calculate cycling route

### Navigation View Props

- `startPoint` - Start coordinate
- `endPoint` - End coordinate
- `waypoints` - Waypoint array (optional)
- `strategy` - Route planning strategy
- `onCalculateRouteSuccess` - Route calculation success callback
- `onCalculateRouteFailure` - Route calculation failure callback

### Map Component

The navigation package includes all map component features. See [Map View API](/en/api/mapview) for details.

## Related Documentation

- [Map View API](/en/api/mapview) - Map display features
- [Search API](/en/api/search) - Native search module
- [Web API](/en/api/web-api) - Web API services