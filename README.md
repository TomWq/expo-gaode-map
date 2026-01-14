# expo-gaode-map

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

## ✨ Key Features

### Core Features (expo-gaode-map)
- ✅ Complete map functionality (multiple map types, gesture controls, camera operations, offline maps)
- ✅ Precise location (continuous location, single location, coordinate conversion)
- ✅ Rich overlays (Circle, Marker, Polyline, Polygon, HeatMap, Cluster, etc.)
- ✅ Friendly error notification system (detailed solutions and documentation links)
- ✅ Complete TypeScript type definitions
- ✅ Cross-platform support (Android, iOS)
- ✅ Supports both new and old React Native architectures (Paper & Fabric)
- ✅ High test coverage (75.7%, 207 unit tests)
- ✅ User-friendly error notification system
- ✅ Custom Marker overlay support
- ✅ Optimized map loading by default to reduce memory usage

### Optional Modules
- 🔍 **Search Functionality** (expo-gaode-map-search) - POI search, nearby search, keyword search, geocoding, etc.
- 🧭 **Navigation Functionality** (expo-gaode-map-navigation) - Driving, walking, cycling, truck route planning, real-time navigation
- 🌐 **Web API** (expo-gaode-map-web-api) - Pure JavaScript implementation of route planning, geocoding, POI search, etc.

## 📦 Installation

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
- 群：952241387 （欢迎加入，交流使用经验、问题反馈等）