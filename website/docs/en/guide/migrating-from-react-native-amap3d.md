---
title: Migrating from react-native-amap3d
description: How to migrate a React Native AMap/Gaode Map project from react-native-amap3d to expo-gaode-map or expo-gaode-map-navigation.
---

# Migrating from react-native-amap3d

`react-native-amap3d` is a classic library in the React Native AMap ecosystem. If your app is stable in production, migrate only when the engineering benefits are clear. For new Expo apps, EAS Build workflows, or React Native New Architecture upgrades, `expo-gaode-map` and `expo-gaode-map-navigation` fit the current Expo model more naturally.

This guide gives you a staged migration path: first make native configuration and a minimal map screen work, then migrate location, overlays, search, and navigation.

## Choose the target package

| Existing capability | New package |
| --- | --- |
| Map display, camera control, Marker, Polyline, Polygon, location | `expo-gaode-map` |
| Map + route planning + embedded navigation UI or official navigation page | `expo-gaode-map-navigation` |
| Pure JavaScript geocoding, POI search, route planning | `expo-gaode-map-web-api` |

::: warning Do not install core and navigation together
`expo-gaode-map` and `expo-gaode-map-navigation` cannot be installed together. The navigation package already includes map features.
:::

## 1. Remove the old package and install the new one

Map only:

```bash
npm uninstall react-native-amap3d
npm install expo-gaode-map
```

Navigation:

```bash
npm uninstall react-native-amap3d
npm install expo-gaode-map-navigation
```

For bare React Native apps, install Expo Modules first:

```bash
npx install-expo-modules@latest
```

## 2. Configure the Config Plugin

Prefer adding the plugin to your existing `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key",
          "enableLocation": true,
          "enableBackgroundLocation": false,
          "locationDescription": "We need your location to provide map features"
        }
      ]
    ]
  }
}
```

If you use the navigation package, change the plugin name to `expo-gaode-map-navigation`.

If your app already uses `app.config.ts` or `app.config.js`, add the same plugin entry there.

## 3. Rebuild native projects

Expo:

```bash
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```

Or use EAS Build:

```bash
eas build --platform android
eas build --platform ios
```

For bare React Native apps with Expo Modules installed, follow your normal native build and CocoaPods workflow.

## 4. Add the privacy compliance flow first

On fresh installs or after your privacy policy version changes, complete AMap privacy consent before rendering a map or calling location, search, or navigation APIs.

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    privacyVersion: '2026-03-13',
  });
}
```

If you use `expo-gaode-map-navigation`, import from that package:

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map-navigation';
```

When native keys are configured by the Config Plugin, basic map code usually does not need `initSDK({ androidKey, iosKey })`. Only pass `webKey` when using Web API features:

```tsx
ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });
```

## 5. Replace the minimal map screen

Start with the smallest working screen. This confirms your keys, privacy flow, permissions, and native build are healthy.

```tsx
import { MapView } from 'expo-gaode-map';

export function BasicMapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.908823, longitude: 116.39747 },
        zoom: 12,
      }}
      myLocationEnabled
    />
  );
}
```

If you use the navigation package:

```tsx
import { MapView } from 'expo-gaode-map-navigation';
```

## 6. Migrate common APIs

| Old capability | New implementation |
| --- | --- |
| Map view | `MapView` |
| Marker | `Marker` |
| Polyline | `Polyline` |
| Polygon | `Polygon` |
| Circle | `Circle` |
| Camera control via refs | Camera methods on `MapViewRef` |
| Location permission | `ExpoGaodeMapModule.checkLocationPermission()` / `requestLocationPermission()` or `useLocationPermissions()` |
| Current location | `ExpoGaodeMapModule.getCurrentLocation()` |
| POI search | `searchPOI` / `searchNearby` / `getInputTips` |
| Route planning and navigation | route planning APIs and `ExpoGaodeMapNaviView` from `expo-gaode-map-navigation` |

Overlay example:

```tsx
import { MapView, Marker, Polyline } from 'expo-gaode-map';

export function OverlayScreen() {
  return (
    <MapView style={{ flex: 1 }}>
      <Marker position={{ latitude: 39.908823, longitude: 116.39747 }} />
      <Polyline
        points={[
          { latitude: 39.908823, longitude: 116.39747 },
          { latitude: 39.918823, longitude: 116.40747 },
        ]}
        width={6}
        color="#1677ff"
      />
    </MapView>
  );
}
```

## 7. Recommended migration order

1. Migrate installation, Config Plugin, privacy flow, and a minimal `MapView`.
2. Migrate overlays such as Marker, Polyline, Polygon, and Circle.
3. Migrate permission and current-location logic.
4. If the old app composed search manually, evaluate built-in native search or `expo-gaode-map-web-api`.
5. If navigation is required, migrate to `expo-gaode-map-navigation` and do not keep the core package installed in the same app.

## Troubleshooting Checklist

- Do not test in Expo Go. Use a development build, EAS Build, or local native build.
- Re-run `prebuild` or rebuild in the cloud after changing Config Plugin settings.
- Android and iOS AMap keys are separate and must match package name, signature, and Bundle ID.
- Complete privacy consent before rendering `MapView` on fresh installs.
- Do not install `expo-gaode-map` and `expo-gaode-map-navigation` together.
- Add a `webKey` when using Web API features.

## Next Steps

- [Choosing an AMap Library](/en/guide/choosing-amap-library)
- [Getting Started](/en/guide/getting-started)
- [Initialization](/en/guide/initialization)
- [Error Handling](/en/guide/error-handling)
- [Navigation](/en/guide/navigation)
