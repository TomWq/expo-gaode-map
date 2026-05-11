# expo-gaode-map

[![oosmetrics](https://api.oosmetrics.com/api/v1/badge/achievement/48b42d9e-d007-4a63-9252-347a56d4fa12.svg)](https://oosmetrics.com/repo/TomWq/expo-gaode-map)

> Production-first AMap (Gaode Map) stack for Expo and React Native apps in China.

A fully-featured AMap (Gaode Map) library built with **Expo Modules API**. Use it when you need a China-ready map stack with map rendering, location, search, navigation, offline maps, and Web API support in one place.

If you are migrating from `react-native-amap3d`, `expo-gaode-map` is the Expo-first AMap replacement for new projects.

> 💡 This library is built using [Expo Modules API](https://docs.expo.dev/modules/overview/), providing type-safe native module interfaces and an excellent developer experience.

<div align="center">

[🇨🇳 中文文档](README_zh.md)

</div>

## Why expo-gaode-map?

If your product targets China map workflows and you want Expo integration without stitching together multiple libraries, `expo-gaode-map` is built for that path.

- China-ready AMap integration instead of a generic global map abstraction
- Expo Modules + Config Plugin workflow for smoother setup and maintenance
- Map + search + navigation + offline capabilities with one consistent API family
- New Architecture and classic architecture support
- Production-focused details such as privacy compliance flow, typed errors, and geometry utilities

## Best Fit

- You are building an Expo or React Native app for users in Mainland China
- You need AMap-native capabilities, not just a generic map view
- You want one stack for map, POI search, route planning, navigation, and optional Web API usage
- You need a library that is actively iterated and documented

## Quick Start

Choose one native package:

```bash
# Map + location + overlays + built-in native search
npm install expo-gaode-map

# Optional Web API package
npm install expo-gaode-map-web-api
```

```bash
# Map + navigation + built-in native search
npm install expo-gaode-map-navigation

# Optional Web API package
npm install expo-gaode-map-web-api
```

> `expo-gaode-map` and `expo-gaode-map-navigation` cannot be installed together because they wrap overlapping native SDK layers. Choose one.

| Need | Install |
|---|---|
| Map, location, overlays | `expo-gaode-map` |
| Map + navigation UI | `expo-gaode-map-navigation` |
| Web API on top of either base package | `expo-gaode-map-web-api` |

Add the config plugin in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key"
        }
      ]
    ]
  }
}
```

Then rebuild:

```bash
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```

## Packages

- `expo-gaode-map`: map rendering, location, overlays, offline maps, geometry utilities, built-in native search
- `expo-gaode-map-navigation`: map + route planning + embedded navigation + official navigation page support
- `expo-gaode-map-web-api`: pure JavaScript geocoding, route planning, POI search, input tips, and other Web API flows

## Documentation and Examples

**👉 [Online Documentation](https://TomWq.github.io/expo-gaode-map/)**  
**👉 Local examples: [`example/`](./example) / [`example-navigation/`](./example-navigation)**

Start here if you want runnable examples or API details:
- [Getting Started](https://TomWq.github.io/expo-gaode-map/guide/getting-started.html)
- [Initialization Guide](https://TomWq.github.io/expo-gaode-map/guide/initialization.html)
- [Search Functionality](https://TomWq.github.io/expo-gaode-map/guide/search.html)
- [Navigation Functionality](https://TomWq.github.io/expo-gaode-map/guide/navigation.html)
- [Web API](https://TomWq.github.io/expo-gaode-map/guide/web-api.html)
- [API Reference](https://TomWq.github.io/expo-gaode-map/api/)
- [Local Map Example](./example) / [Navigation Example](./example-navigation)

## What You Can Build

- Map-centric consumer apps with AMap-native rendering and overlays
- Delivery, fleet, field-service, and check-in flows with precise location and route tools
- POI search, address picker, reverse geocoding, and route preview experiences
- Turn-by-turn navigation experiences with embedded navigation UI or official navigation pages
- Offline-first or network-variable map workflows

## 🚀 Why Choose expo-gaode-map?

> If your target is China map products with Expo integration, New Architecture readiness, and a unified stack
> for map + search + navigation + offline capabilities, `expo-gaode-map` is built as a production-first default.

| Comparison | expo-gaode-map | react-native-maps (general map stack) | react-native-amap3d (older community AMap stack) |
|---|---|---|---|
| China map readiness (AMap) | ✅ Designed around native AMap capabilities | ⚠️ Primarily generic abstraction; in Mainland China, Android delivery often faces Google Maps/GMS availability constraints | ✅ Core AMap capabilities |
| Expo integration experience | ✅ Expo Modules + Config Plugin (auto key/permission setup) | ⚠️ Usually requires additional project wiring | ⚠️ Often requires manual adaptation |
| React Native New Architecture (Fabric/TurboModules) | ✅ Explicit New + Old Architecture support | ✅/⚠️ Depends on official support scope | ⚠️ No clear New Architecture support statement |
| Unified stack (Map + Search + Navigation + Web API) | ✅ Search is built into core/navigation; Web API remains optional | ❌ Usually multi-library assembly | ❌ Primarily map-layer scope |
| Navigation (route planning + nav view) | ✅ `expo-gaode-map-navigation` | ❌ | ❌ |
| Search stack (POI/nearby/geocode) | ✅ Built into `expo-gaode-map` / `expo-gaode-map-navigation` + `web-api` | ❌ | ⚠️ Usually requires extra composition |
| Offline maps | ✅ Built-in APIs | ⚠️ Usually needs extra implementation | ⚠️ Depends on fork/version |
| Geometry utilities (TS + C++) | ✅ Built in (distance/area/simplification/nearest point, etc.) | ❌ | ❌ |
| Privacy compliance + typed error guidance | ✅ Built in with solution links | ⚠️ Usually app-side implementation | ⚠️ Usually app-side implementation |
| Maintenance signal | ✅ Active releases + docs + example repo | ✅ Active but general-map focused | ⚠️ Upstream [README](https://github.com/qiuxiang/react-native-amap3d) states "maintenance only, no new features" |

> Note: Comparison is based on public documentation and common engineering usage patterns as of 2026-04-15.

## ✨ Key Features

### Core Features (expo-gaode-map)
- ✅ Complete map functionality (multiple map types, gesture controls, camera operations, offline maps)
- ✅ Precise location (continuous location, single location, coordinate conversion)
- ✅ Rich overlays (Circle, Marker, Polyline, Polygon, HeatMap, Cluster, etc.)
- ✅ Friendly error notification system (detailed solutions and documentation links)
- ✅ Complete TypeScript type definitions
- ✅ Cross-platform support (Android, iOS)
- ✅ Supports both new and old React Native architectures (Paper & Fabric)
- ✅ High test coverage 
- ✅ User-friendly error notification system
- ✅ Custom Marker overlay support
- ✅ Lean native implementation with simpler lifecycle management and lower maintenance cost

### Optional Modules
- 🔍 **Search Functionality** - Built into `expo-gaode-map` and `expo-gaode-map-navigation`: POI search, nearby search, keyword search, geocoding, etc.
- 🧭 **Navigation Functionality** (expo-gaode-map-navigation) - Driving, walking, cycling, truck route planning, real-time navigation
- 🌐 **Web API** (expo-gaode-map-web-api) - Pure JavaScript implementation of route planning, geocoding, POI search, etc.

> ⚠️ **Search Module Maintenance Notice**
>
> From `2.2.34` onward, native search is maintained inside `expo-gaode-map` (core) and the map layer of `expo-gaode-map-navigation`. `2.2.33` is the last version that supports standalone `expo-gaode-map-search` integration. If your project still needs the standalone search package, pin it to `2.2.33`; new projects should import search APIs from `expo-gaode-map` or `expo-gaode-map-navigation`.
>
> Why: after AMap Android SDK `10.0.700`, the official remote dependency bundle changed from "map + location" to "map + location + search", and the remote dependency coordinate changed from `com.amap.api:3dmap:latest.integration` to `com.amap.api:3dmap-location-search:latest.integration`. Maintaining search as a separate package now creates unnecessary bundling and dependency-conflict cost, so search is maintained with core/navigation instead.

## 📦 Installation

> ⚠️ **Version Compatibility**:
> - If you are using **Expo SDK 54+**, please install the **Latest** version.
> - If you are using **Expo SDK 53 or lower** (e.g., 50, 51, 52, 53), please use the **V1** version (Tag: `v1`).
>   ```bash
>   npm install expo-gaode-map@v1.2.3
>   ```
>   **Note**: V1 version does not support World Map functionality. Please upgrade to Expo SDK 54+ for World Map support.

### Option 1: Map and Location Only (Core Package)

```bash
npm install expo-gaode-map

# Optional modules
npm install expo-gaode-map-web-api     # Web API
```

### Option 2: Navigation Functionality (Navigation Package, Includes Map)

```bash
npm install expo-gaode-map-navigation  # Includes map + navigation

# Optional modules
npm install expo-gaode-map-web-api     # Web API
```

> ⚠️ **Important**: `expo-gaode-map` and `expo-gaode-map-navigation` cannot be installed simultaneously due to SDK conflicts. Choose one.

### Bare React Native (Non-Expo) Projects

This library is built with Expo Modules. If your app is a plain React Native project (not Expo managed), install Expo Modules first:

```bash
npx install-expo-modules@latest
```

Then install this package and rebuild native projects:

```bash
npm install expo-gaode-map
cd ios && pod install && cd ..
npx react-native run-ios
npx react-native run-android
```

If your project already has Expo Modules integrated, you can skip `install-expo-modules`.

### Config Plugin Configuration (Recommended)

Configure in `app.json` to automatically set up native API keys and permissions:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",  // or "expo-gaode-map-navigation"
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key"
        }
      ]
    ]
  }
}
```

After configuration, rebuild:

```bash
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```

When API keys are configured in the native project via Config Plugin or manual native setup, the native map SDK is auto-initialized by default on app startup.

`ExpoGaodeMapModule.initSDK({ webKey })` is only needed when you use `expo-gaode-map-web-api` (or when you want to set a runtime `webKey` manually).

Only if you **do not** use Config Plugin and **have not** manually configured API keys in the native project, you must call:

```ts
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
});
```

before using map/location/navigation/search capabilities.

## 🔒 Privacy Compliance

On a **fresh install** (or after your privacy policy version changes), you must complete privacy consent **before** rendering `MapView`.

After consent is granted once, native iOS / Android now **persist and auto-restore** the privacy state on later cold starts, so you do **not** need to call `setPrivacyConfig()` again on every app launch.

```ts
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const privacyStatus = ExpoGaodeMapModule.getPrivacyStatus();

if (!privacyStatus.isReady) {
  // Call these in your own privacy dialog "Agree" callback
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    privacyVersion: '2026-03-13',
  });
}
// With native keys configured via Config Plugin or manual setup:
// only needed when you use expo-gaode-map-web-api
ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });
```

If privacy consent is missing on a fresh install, the library now throws a clear `PRIVACY_NOT_AGREED` error instead of leaving the native SDK to fail unpredictably.

## 🚀 Quick Start

For detailed initialization and usage guides, please see:
- 📖 [Getting Started Documentation](https://TomWq.github.io/expo-gaode-map/guide/getting-started.html)
- 💻 [Map Example App](./example) / [Navigation Example App](./example-navigation)

## 📚 Feature Module Comparison

| Feature | Core Package | Search Package | Navigation Package | Web API |
|---------|-------------|----------------|-------------------|----------|
| Map Display | ✅ | ❌ | ✅ | ❌ |
| Location | ✅ | ❌ | ✅ | ❌ |
| Overlays | ✅ | ❌ | ✅ | ❌ |
| POI Search | ✅ | ⚠️ 2.2.33 and lower | ✅ | ✅ |
| Geocoding | ✅ | ⚠️ 2.2.33 and lower | ✅ | ✅ |
| Route Planning | ❌ | ❌ | ✅ | ✅ |
| Real-time Navigation | ❌ | ❌ | ✅ | ❌ |
| Platform | Native | Native | Native | Web/Native |

## 🏗️ Monorepo Architecture

```
expo-gaode-map/
├── packages/
│   ├── core/                    # expo-gaode-map (Core package)
│   │   └── Map display, location, overlays, search
│   ├── search/                  # expo-gaode-map-search (standalone search package, deprecated after 2.2.33)
│   │   └── POI search, geocoding (legacy compatibility)
│   ├── navigation/              # expo-gaode-map-navigation (Navigation package)
│   │   └── Map + search + navigation (replaces core)
│   └── web-api/                 # expo-gaode-map-web-api (Web API)
│       └── Pure JS route planning, etc.
└── Note: core and navigation cannot be installed together
```

## 💡 FAQ

### 1. How to choose between Core and Navigation packages?

- **Only need map and location** → Install `expo-gaode-map`
- **Need navigation functionality** → Install `expo-gaode-map-navigation` (includes map functionality)
- **Replacing `react-native-amap3d` in a new project** → Start with `expo-gaode-map`; use `expo-gaode-map-navigation` if you also need route planning or turn-by-turn navigation
- **Cannot install both**: Due to native SDK conflicts, you can only choose one

### 2. What's the difference between Search and Web API?

- **Built-in native search** (`expo-gaode-map` / `expo-gaode-map-navigation`): Native implementation, better performance, requires native environment configuration
- **Standalone search package** (`expo-gaode-map-search`): legacy-only; pin to `2.2.33` if you still need standalone integration
- **Web API** (`expo-gaode-map-web-api`): Pure JavaScript, no native configuration needed, better cross-platform compatibility

### 3. How to configure API keys?

It's recommended to use Config Plugin for automatic configuration. See: [Initialization Guide](https://TomWq.github.io/expo-gaode-map/guide/initialization.html)

### 4. How to handle errors? 🆕

`expo-gaode-map` provides a comprehensive error handling system:

```typescript
import ExpoGaodeMapModule, { GaodeMapError, ErrorType } from 'expo-gaode-map';

try {
  await ExpoGaodeMapModule.getCurrentLocation();
} catch (error) {
  if (error instanceof GaodeMapError) {
    console.error(error.message);  // Friendly error message
    console.log(error.solution);   // Detailed solution
    console.log(error.docUrl);     // Related documentation link
  }
}
```

**Complete Error Handling Guide**: [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md)

Supported error types:
- `SDK_NOT_INITIALIZED` - SDK not initialized
- `INVALID_API_KEY` - API key configuration error
- `PERMISSION_DENIED` - Permission not granted
- `LOCATION_FAILED` - Location failed
- `MAP_VIEW_NOT_INITIALIZED` - Map view not initialized
- More error types...

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT

## 📚 Documentation & Resources

- [Online Documentation](https://TomWq.github.io/expo-gaode-map/)
- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md) 🆕
- [GitHub Repository](https://github.com/TomWq/expo-gaode-map)
- [Map Example App](./example)
- [Navigation Example App](./example-navigation)
- [Amap Open Platform](https://lbs.amap.com/)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## 🙏 Acknowledgments

This project referenced the following excellent projects during development:

- **[react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d)** - An excellent React Native Amap component

Thank you to all contributors of these open-source projects!

## 📮 Feedback & Support

If you encounter any issues or have any suggestions during usage, please feel free to:

- 📝 Submit a [GitHub Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 Join [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- ⭐ Give the project a Star to show your support
- email：582752848@qq.com

## 🙌 Thank you for your support!
