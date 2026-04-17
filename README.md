# expo-gaode-map

> React Native / Expo AMap (Gaode Map) solution for China map apps, with map rendering, location, search, navigation, and offline map support.

A fully-featured Amap (Gaode Map) React Native library, **built with Expo Modules API**, using Monorepo architecture. It provides complete functionality including map display, location, search, navigation, and Web API.

> 💡 This library is built using [Expo Modules API](https://docs.expo.dev/modules/overview/), providing type-safe native module interfaces and an excellent developer experience.

<div align="center">

[🇨🇳 中文文档](README_zh.md)

</div>

## 📖 Complete Documentation

**👉 [Online Documentation](https://TomWq.github.io/expo-gaode-map/)** · **👉 [Example Repository](https://github.com/TomWq/expo-gaode-map-example)**

Includes complete API documentation, usage guides, and example code:
- [Getting Started](https://TomWq.github.io/expo-gaode-map/guide/getting-started.html)
- [Initialization Guide](https://TomWq.github.io/expo-gaode-map/guide/initialization.html)
- [Search Functionality](https://TomWq.github.io/expo-gaode-map/guide/search.html)
- [Navigation Functionality](https://TomWq.github.io/expo-gaode-map/guide/navigation.html)
- [Web API](https://TomWq.github.io/expo-gaode-map/guide/web-api.html)
- [API Reference](https://TomWq.github.io/expo-gaode-map/api/)
- [Usage Examples](https://github.com/TomWq/expo-gaode-map-example)

## 🚀 Why Choose expo-gaode-map?

> If your target is China map products with Expo integration, New Architecture readiness, and a unified stack
> for map + search + navigation + offline capabilities, `expo-gaode-map` is built as a production-first default.

| Comparison | expo-gaode-map | react-native-maps (general map stack) | react-native-amap3d (older community AMap stack) |
|---|---|---|---|
| China map readiness (AMap) | ✅ Designed around native AMap capabilities | ⚠️ Primarily generic abstraction; in Mainland China, Android delivery often faces Google Maps/GMS availability constraints | ✅ Core AMap capabilities |
| Expo integration experience | ✅ Expo Modules + Config Plugin (auto key/permission setup) | ⚠️ Usually requires additional project wiring | ⚠️ Often requires manual adaptation |
| React Native New Architecture (Fabric/TurboModules) | ✅ Explicit New + Old Architecture support | ✅/⚠️ Depends on official support scope | ⚠️ No clear New Architecture support statement |
| Unified stack (Map + Search + Navigation + Web API) | ✅ Four coordinated packages in one monorepo | ❌ Usually multi-library assembly | ❌ Primarily map-layer scope |
| Navigation (route planning + nav view) | ✅ `expo-gaode-map-navigation` | ❌ | ❌ |
| Search stack (POI/nearby/geocode) | ✅ `expo-gaode-map-search` + `web-api` | ❌ | ⚠️ Usually requires extra composition |
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
- 🔍 **Search Functionality** (expo-gaode-map-search) - POI search, nearby search, keyword search, geocoding, etc.
- 🧭 **Navigation Functionality** (expo-gaode-map-navigation) - Driving, walking, cycling, truck route planning, real-time navigation
- 🌐 **Web API** (expo-gaode-map-web-api) - Pure JavaScript implementation of route planning, geocoding, POI search, etc.

## 📦 Installation

> ⚠️ **Version Compatibility**:
> - If you are using **Expo SDK 54+**, please install the **Latest** version.
> - If you are using **Expo SDK 53 or lower** (e.g., 50, 51, 52, 53), please use the **V1** version (Tag: `v1`).
>   ```bash
>   npm install expo-gaode-map@v1
>   ```
>   **Note**: Apart from lacking **World Map** functionality, the V1 version shares the same API as V2 (Latest).

### Option 1: Map and Location Only (Core Package)

```bash
npm install expo-gaode-map

# Optional modules
npm install expo-gaode-map-search      # Search functionality
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

With Config Plugin (`androidKey` / `iosKey`) configured, the native map SDK is auto-initialized by default on app startup.

`ExpoGaodeMapModule.initSDK({ webKey })` is only needed when you use `expo-gaode-map-web-api` (or when you want to set a runtime `webKey` manually).

If you **do not** use Config Plugin, you **must** call:

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
// With Config Plugin: only needed when you use expo-gaode-map-web-api
ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });
```

If privacy consent is missing on a fresh install, the library now throws a clear `PRIVACY_NOT_AGREED` error instead of leaving the native SDK to fail unpredictably.

## 🚀 Quick Start

For detailed initialization and usage guides, please see:
- 📖 [Getting Started Documentation](https://TomWq.github.io/expo-gaode-map/guide/getting-started.html)
- 💻 [Complete Example Code](https://github.com/TomWq/expo-gaode-map-example)

## 📚 Feature Module Comparison

| Feature | Core Package | Search Package | Navigation Package | Web API |
|---------|-------------|----------------|-------------------|----------|
| Map Display | ✅ | ❌ | ✅ | ❌ |
| Location | ✅ | ❌ | ✅ | ❌ |
| Overlays | ✅ | ❌ | ✅ | ❌ |
| POI Search | ❌ | ✅ | ❌ | ✅ |
| Geocoding | ❌ | ✅ | ❌ | ✅ |
| Route Planning | ❌ | ❌ | ✅ | ✅ |
| Real-time Navigation | ❌ | ❌ | ✅ | ❌ |
| Platform | Native | Native | Native | Web/Native |

## 🏗️ Monorepo Architecture

```
expo-gaode-map/
├── packages/
│   ├── core/                    # expo-gaode-map (Core package)
│   │   └── Map display, location, overlays
│   ├── search/                  # expo-gaode-map-search (Search package)
│   │   └── POI search, geocoding
│   ├── navigation/              # expo-gaode-map-navigation (Navigation package)
│   │   └── Map + navigation (replaces core)
│   └── web-api/                 # expo-gaode-map-web-api (Web API)
│       └── Pure JS route planning, etc.
└── Note: core and navigation cannot be installed together
```

## 💡 FAQ

### 1. How to choose between Core and Navigation packages?

- **Only need map and location** → Install `expo-gaode-map`
- **Need navigation functionality** → Install `expo-gaode-map-navigation` (includes map functionality)
- **Cannot install both**: Due to native SDK conflicts, you can only choose one

### 2. What's the difference between Search and Web API?

- **Search package** (`expo-gaode-map-search`): Native implementation, better performance, requires native environment configuration
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
- [Example Project](https://github.com/TomWq/expo-gaode-map-example)
- [Amap Open Platform](https://lbs.amap.com/)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## 🙏 Acknowledgments

This project referenced the following excellent projects during development:

- **[react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d)** - An excellent React Native Amap component

Thank you to all contributors of these open-source projects!

## 📮 Feedback & Support

If you encounter any issues or have any suggestions during usage, please feel free to:

- 📝 Submit a [GitHub Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 Join [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- ⭐ Give the project a Star to show your support
- QQ：582752848 （如果有咨询的，随时联系我）
