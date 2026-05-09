---
layout: home

hero:
  name: "expo-gaode-map"
  text: "AMap React Native Component"
  tagline: Complete AMap solution built with Expo Modules
  image:
    src: /logo.svg
    alt: expo-gaode-map
  actions:
    - theme: brand
      text: Get Started
      link: /en/guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/TomWq/expo-gaode-map

features:
  - icon: 🗺️
    title: Complete Map Features
    details: Support multiple map types, gesture control, camera operations
  - icon: 📍
    title: Accurate Location
    details: Continuous location, single location, coordinate conversion
  - icon: 🚗
    title: Navigation (Optional)
    details: Route planning and navigation for driving, walking, cycling, trucks, and more
  - icon: 📥
    title: Offline Maps 🆕
    details: City map download management, real-time progress monitoring, storage management, works without network
  - icon: 🌐
    title: Web API Service (Optional)
    details: Pure JavaScript services for geocoding, route planning, POI search, and other cross-platform flows
  - icon: 🔍
    title: Built-in Native Search
    details: POI search, nearby search, and search along route are maintained with core / navigation packages
  - icon: 🎨
    title: Rich Overlays
    details: Circle, Marker, Polyline, Polygon and more
  - icon: 📝
    title: TypeScript Support
    details: Complete TypeScript type definitions
  - icon: 🔧
    title: Modular Design
    details: Clear architecture, easy to maintain and extend
  - icon: 📱
    title: Cross-platform
    details: Support both Android and iOS platforms
  - icon: ⚡
    title: New & Old Architecture
    details: Full support for React Native new architecture (Fabric & TurboModules) and legacy architecture
---

## Quick Start

::: warning Version Compatibility
- If you are using **Expo SDK 54+**, please install the **Latest** version.
- If you are using **Expo SDK 53 or lower** (e.g., 50, 51, 52, 53), please use the **V1** version (Tag: `v1`).
  ```bash
  npm install expo-gaode-map@v1
  ```
  **Note**: Apart from lacking **World Map** functionality, the V1 version shares the same API as V2 (Latest).
:::

### Installation

```bash
# Core package (map + location)
npm install expo-gaode-map

# Navigation package (includes map + navigation)
npm install expo-gaode-map-navigation

# Web API service
npm install expo-gaode-map-web-api

# Search is built into expo-gaode-map / expo-gaode-map-navigation
```

::: tip Package Selection
- Only need map and location → `expo-gaode-map`
- Need navigation → `expo-gaode-map-navigation` (includes map features)
- Need cross-platform Web services → `expo-gaode-map-web-api`
- Need native search → use the built-in APIs from `expo-gaode-map` or `expo-gaode-map-navigation`
:::

::: warning Search Package Notice
Native search is built into `expo-gaode-map` and `expo-gaode-map-navigation`. `2.2.33` is the last version that supports standalone `expo-gaode-map-search` integration.

After AMap Android SDK `10.0.700`, the official remote dependency bundle changed from `com.amap.api:3dmap:latest.integration` to `com.amap.api:3dmap-location-search:latest.integration`, so search is maintained with core/navigation instead of as a separate package.
:::

### Basic Usage

```tsx
import { MapView, ExpoGaodeMapModule } from 'expo-gaode-map';

// If native keys are configured via Config Plugin or manually, you do not need
// to pass androidKey / iosKey in JavaScript.
// Only needed for Web API features:
// ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

// Only if native keys are not configured:
// ExpoGaodeMapModule.initSDK({
//   androidKey: 'your-android-api-key',
//   iosKey: 'your-ios-api-key',
// });

// Use map component
<MapView
  style={{ flex: 1 }}
  initialCameraPosition={{
    target: { latitude: 39.9, longitude: 116.4 },
    zoom: 10,
  }}
  myLocationEnabled={true}
/>
```

::: tip Important Notes
- Native keys can be written automatically with Config Plugin or configured manually in Android `AndroidManifest.xml` and iOS `Info.plist`
- If native keys are configured and you only use map/location features, you usually do not need `initSDK({ androidKey, iosKey })`; call `initSDK({ webKey })` only for `expo-gaode-map-web-api`
- Only call `initSDK({ androidKey, iosKey })` when native keys are not configured
- Test on real devices when possible; emulators may show blank maps or crash
:::

See full examples in [Getting Started](/en/guide/getting-started). For navigation examples, check the local `example-navigation/` project.

## Core Modules

### 📦 expo-gaode-map

Core map package for map display, location, overlays, offline maps, geometry utilities, and built-in native search.

[Getting Started](/en/guide/getting-started) · [API Reference](/en/api/mapview)

### 🚗 expo-gaode-map-navigation 🆕

Navigation package with complete route planning and navigation capabilities:

- **Route planning**: driving, walking, cycling, truck, motorcycle, and e-bike routes
- **Navigation view**: official navigation UI with real-time guidance and traffic information
- **Independent route planning**: calculate routes without affecting the current navigation state

[Guide](/en/guide/navigation) · [API Reference](/en/api/navigation)

### 🌐 expo-gaode-map-web-api 🆕

Pure JavaScript Web API package with cross-platform behavior:

- **Geocoding**: convert addresses and coordinates
- **Route planning**: driving, walking, cycling, transit, and more
- **POI search**: keyword search, nearby search, polygon search
- **Input tips**: live search suggestions

[Guide](/en/guide/web-api) · [API Reference](/en/api/web-api)

### 🔍 Built-in Native Search

Native POI search is built into `expo-gaode-map` and `expo-gaode-map-navigation`.

[Search API](/en/api/search)

## Why expo-gaode-map?

If you are replacing `react-native-amap3d` in a new Expo or React Native project, `expo-gaode-map` is the Expo-first AMap replacement to start with.

- ✅ **Built with Expo Modules**: Modern development experience
- ✅ **Feature Complete**: Cover main AMap features
- ✅ **Modular Design**: Install only the packages your app needs
- ✅ **Well Documented**: Detailed documentation in Chinese and English
- ✅ **Actively Maintained**: Continuous updates and community support
- ✅ **New & Old Architecture**: Compatible with React Native Fabric / TurboModules and the legacy architecture
- ✅ **Rich Scenarios**: Suitable for ride-hailing, delivery, navigation, check-in, and location-driven apps
- ✅ **Open Source**: MIT license, free for commercial use

## Community

- 📝 [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 QQ Group: 952241387
