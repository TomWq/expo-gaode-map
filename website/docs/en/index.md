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
  - icon: 📥
    title: Offline Maps 🆕
    details: City map download management, real-time progress monitoring, storage management, works without network
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
npm install expo-gaode-map
```

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

## Why expo-gaode-map?

- ✅ **Built with Expo Modules**: Modern development experience
- ✅ **Feature Complete**: Cover main AMap features
- ✅ **Well Documented**: Detailed documentation in Chinese and English
- ✅ **Actively Maintained**: Continuous updates and community support
- ✅ **Open Source**: MIT license, free for commercial use

## Community

- 📝 [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- 💬 QQ Group: 952241387
