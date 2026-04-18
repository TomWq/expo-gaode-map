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

// With Config Plugin and map/navigation-only usage, you can skip initSDK.
// Only needed for Web API features:
ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

// Without Config Plugin, provide native keys manually:
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

- In most cases, `Marker` custom `children` no longer need explicit `customViewWidth` / `customViewHeight`
- `Cluster` now supports `icon?: string` with HTTP URL, local file path, or bundle resource name

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

### EmbeddedNaviView

For embedded navigation screens inside your own React Native page, prefer `EmbeddedNaviView`.

It still uses the native `NaviView` underneath, but adds a reusable library HUD for the top navigation info area so Android and iOS behave more consistently in embedded layouts.

```typescript
import React, { useRef } from 'react';
import { EmbeddedNaviView, type NaviViewRef } from 'expo-gaode-map-navigation';

function EmbeddedNavigationScreen() {
  const naviRef = useRef<NaviViewRef>(null);

  return (
    <EmbeddedNaviView
      ref={naviRef}
      style={{ flex: 1 }}
      naviType={1}
      showDefaultHud={true}
      showExitButton={true}
      onExitPress={() => {
        void naviRef.current?.stopNavigation();
      }}
    />
  );
}
```

Default behavior:

- On Android, `hideNativeTopInfoLayout` defaults to `true` so the native top info panel does not overlap the custom HUD
- On iOS, the component applies embedded-friendly defaults for `driveViewEdgePadding` and `screenAnchor`
- The built-in HUD and exit button are enabled by default
- The actual navigation map, guidance, voice, lane info, and cross images still come from the native `NaviView`

Android embedded note:

- In some React Native / Expo hosts, the official embedded `NaviView` top info panel, lane information, and cross-image transitions may differ from the official AMap demo / official black-box page
- If your goal is a stable embedded navigation page, prefer `EmbeddedNaviView`
- If you specifically want to verify the native official embedded UI, use the `official-embedded` page in the repo's `example-navigation` example app

Use the right layer for the right job:

- `NaviView`: native embedded navigation view
- `EmbeddedNaviView`: reusable custom embedded UI built on top of `NaviView`
- `openOfficialNaviPage`: official full-screen black-box route/navigation page

`EmbeddedNaviView` is for embedded pages only. It is not a replacement for the official black-box page UI.

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
- `naviStatusBarEnabled` - Android only; enables the official AMap navigation status bar when the underlying AMap SDK exposes that API

### EmbeddedNaviView Extra Props

- `showDefaultHud` - Shows the built-in top HUD for embedded navigation
- `showDefaultLaneHud` - Shows the built-in custom lane HUD
- `hideLaneHudWhenCrossVisible` - Hides the custom lane HUD when a cross image / model cross is visible
- `laneHudPlacement` - Places the custom lane HUD at the top or bottom
- `laneHudScale` - Scales the custom lane HUD
- `laneHudCrossTopOffset` - Overrides the top offset used while the cross image is visible
- `showExitButton` - Shows the default floating exit button
- `exitButtonText` - Custom label for the default exit button
- `onExitPress` - Callback when the default exit button is pressed

Recommended usage:

- Use `showDefaultHud={false}` if you want to render your own HUD entirely from `NaviView` events
- Use `showDefaultLaneHud={false}` if you want to disable the library lane HUD
- Pass `hideNativeTopInfoLayout={false}` explicitly if you want to keep the native embedded top info panel instead of relying on defaults

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
