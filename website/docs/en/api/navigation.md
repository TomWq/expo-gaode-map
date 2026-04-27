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

if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
  });
}

// If native keys are configured via Config Plugin or manually, and you only use
// map/navigation features, you can skip initSDK.
// Only needed for Web API features:
ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

// Only if native keys are not configured:
// ExpoGaodeMapModule.initSDK({
//   androidKey: 'your-android-key',
//   iosKey: 'your-ios-key',
//   webKey: 'your-web-api-key', // optional unless using Web API
// });
```

## Built-in Map Features

The navigation package includes its own `MapView` and overlay implementation. The API shape stays aligned with the core package, but the underlying map stack comes from the navigation SDK, so it does not depend on `expo-gaode-map`.

### Import map components

```typescript
import { useRef } from 'react';
import {
  MapView,
  Marker,
  Cluster,
  type MapViewRef,
} from 'expo-gaode-map-navigation';
```

### Camera control and event throttling

- `moveCamera(position, duration?)` now uses `CameraUpdate`
- `cameraEventThrottleMs?: number` controls native `onCameraMove` frequency
- Default is `32`; pass `0` to disable throttling

```typescript
const mapRef = useRef<MapViewRef | null>(null);

await mapRef.current?.moveCamera(
  {
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 14,
  },
  300
);
```

### Custom Marker / Cluster

- `Marker` custom `children` are measured automatically from layout
- `Cluster` now supports `icon?: string` with HTTP URL, local file path, or bundle resource name

### fitToCoordinates

`MapViewRef` in the navigation package also exposes `fitToCoordinates(points, options?)` to auto-fit a point set in the current viewport.

```typescript
await mapRef.current?.fitToCoordinates(routePoints, {
  duration: 500,
  paddingFactor: 0.2,
  maxZoom: 18,
});
```

### calculateFitZoom

The built-in `ExpoGaodeMapModule` in the navigation package also supports `calculateFitZoom(points, options?)`, useful when you want to pre-compute zoom before calling `moveCamera`.

```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';

const points = [
  { latitude: 39.9042, longitude: 116.4074 },
  { latitude: 39.91407, longitude: 116.39765 },
  { latitude: 39.92541, longitude: 116.39707 },
];

const zoom = ExpoGaodeMapModule.calculateFitZoom(points, {
  viewportWidthPx: 390,
  viewportHeightPx: 844,
  paddingPx: 48,
  minZoom: 3,
  maxZoom: 20,
});

await mapRef.current?.moveCamera(
  {
    target: points[0],
    zoom,
  },
  300
);
```

### 3. Use Map Component

```typescript
import { MapView } from 'expo-gaode-map-navigation';

<MapView
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

Custom annotation icons are now exposed as image props:

- `carImage`: custom ego vehicle icon on both iOS and Android
- `carImageSize`: custom ego vehicle icon size on both iOS and Android (`{ width, height }` in RN logical pixels)
- `startPointImage` / `wayPointImage` / `endPointImage`: custom route marker icons on both iOS and Android
- `fourCornersImage`: Android-only four-corners direction bitmap
- `carCompassImage`: iOS-only ego compass image
- `cameraImage`: iOS-only camera icon

These props accept either a string URI/resource name or a React Native asset source such as `require(...)`.

### Custom Embedded Navigation UI

For embedded navigation screens inside your own React Native page, the package now exposes the low-level `ExpoGaodeMapNaviView`, events, and native props only. The full custom HUD / lane HUD / traffic bar reference implementation has been moved into the repo's `example-navigation` app under `example-navigation/lib/navigation-ui/*`.

Recommended approach:

- Use `ExpoGaodeMapNaviView` for the native navigation map, guidance, lane events, traffic-status events, and cross-image events
- Render your own HUD from `onNaviInfoUpdate`, `onLaneInfoUpdate`, `onTrafficStatusesUpdate`, and `onNaviVisualStateChange`
- Start from the `example-navigation` "Custom Navigation UI" example and trim it to your product needs
- If you need route picking plus start/end/multi-waypoint input, start from the `route-picker` example inside `example-navigation`

Android embedded note:

- In some React Native / Expo hosts, the official embedded `ExpoGaodeMapNaviView` top info panel, lane information, and cross-image transitions may differ from the official AMap demo / official black-box page
- On Android, the pure official embedded UI is more likely to show incomplete top panels, overlay glitches, or inconsistent styling across hosts/devices; treat it as a boundary-check page rather than a production UI baseline
- If your goal is a stable embedded navigation page, start from the custom UI example in `example-navigation`
- If you specifically want to verify the native official embedded UI, use the `official-embedded` page in the repo's example app

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
- `carImageSize` - Custom ego vehicle icon size (`{ width, height }`)
- `iosLiveActivityEnabled` - Enables iOS Live Activity state updates (requires Widget Extension configuration)
- `mapViewModeType` - Cross-platform map mode (`0` day, `1` night, `2` auto, `3` custom; Android falls back to day when custom style path is unavailable)
- `isNightMode` - Legacy compatibility prop (`true`/`false` maps to `mapViewModeType` `1/0`; `mapViewModeType` takes precedence)
- `onCalculateRouteSuccess` - Route calculation success callback
- `onCalculateRouteFailure` - Route calculation failure callback
- `naviStatusBarEnabled` - Android only; enables the official AMap navigation status bar when the underlying AMap SDK exposes that API

### iOS Live Activity Notes

- With `iosLiveActivityEnabled`, lock screen / Dynamic Island is updated from navigation snapshots.
- On destination arrival, the module updates the card to an "Arrived" state first, then auto-dismisses it after about 6 seconds.
- If Xcode prints `[api] Error updating activity content: Payload maximum size exceeded.`:
  - the module now degrades payload automatically (keep turn icon first, trim text first),
  - and only drops the turn icon as a last fallback.
- Useful diagnostics:
  - `payload ... keeping turn icon`
  - `payload still too large ... dropped turn icon`
  - `arrived destination card displayed for ... stopping activity`

### Custom UI Reference

The package no longer exports a ready-made `EmbeddedNaviView`. Instead, the example app contains a reference implementation you can reuse:

- `example-navigation/lib/navigation-ui/EmbeddedNaviView.tsx`
- `example-navigation/lib/navigation-ui/EmbeddedNaviHud.tsx`
- `example-navigation/lib/navigation-ui/EmbeddedNaviLaneView.tsx`
- `example-navigation/lib/navigation-ui/EmbeddedNaviTrafficBar.tsx`
- `example-navigation/app/examples/ui-props.tsx`
- `example-navigation/app/examples/route-picker.tsx`
- `example-navigation/app/examples/official-embedded.tsx`

That example demonstrates:

- full custom mode with `showUIElements={false}`
- embedded-friendly `driveViewEdgePadding` / `screenAnchor` handling
- a top HUD rendered from `onNaviInfoUpdate`
- a custom lane HUD rendered from `onLaneInfoUpdate`
- a custom traffic bar rendered from `onTrafficStatusesUpdate`
- floating overview/lock and traffic toggle controls

### Map Component

The navigation package includes all map component features. See [Map View API](/en/api/mapview) for details.

### Android SDK Compatibility

- `naviStatusBarEnabled` depends on Android AMap SDK versions that expose `AMapNaviViewOptions.setNaviStatusBarEnabled(...)`.
- The module now applies this setting compatibly.
- If the resolved AMap SDK in the host app does not provide that method, the module no longer fails compilation.
- In that case, Android skips the setting at runtime and logs a warning, so `naviStatusBarEnabled` behaves as a no-op.
- If you need this prop to actually take effect on Android, upgrade the host app's AMap navigation SDK to a version that includes the API.

## Related Documentation

- [Map View API](/en/api/mapview) - Map display features
- [Search API](/en/api/search) - Native search module
- [Web API](/en/api/web-api) - Web API services
