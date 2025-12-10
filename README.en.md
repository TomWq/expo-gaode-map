# expo-gaode-map

English | [简体中文](./README.md)

A full-featured AMap (Gaode Map) React Native component library, **built with Expo Modules**, using Monorepo architecture, providing map display, location, search, navigation, Web API, and more.

> 💡 This component is built with [Expo Modules API](https://docs.expo.dev/modules/overview/), providing type-safe native module interfaces and excellent developer experience.

## 📖 Complete Documentation

**👉 [Documentation Website](https://TomWq.github.io/expo-gaode-map/)** · **👉 [Example Repository](https://github.com/TomWq/expo-gaode-map-example)**

Including complete API documentation, guides, and examples:
- [Getting Started](https://TomWq.github.io/expo-gaode-map/en/guide/getting-started.html)
- [Initialization Guide](https://TomWq.github.io/expo-gaode-map/en/guide/initialization.html)
- [Search Features](https://TomWq.github.io/expo-gaode-map/en/guide/search.html)
- [Navigation Features](https://TomWq.github.io/expo-gaode-map/en/guide/navigation.html)
- [Web API](https://TomWq.github.io/expo-gaode-map/en/guide/web-api.html)
- [API Reference](https://TomWq.github.io/expo-gaode-map/en/api/)
- [Examples](https://TomWq.github.io/expo-gaode-map/en/examples/)

## ✨ Features

### Core Features (expo-gaode-map)
- ✅ Complete map functionality (multiple map types, gesture control, camera operations)
- ✅ Accurate location (continuous location, single location, coordinate conversion)
- ✅ Rich overlays (Circle, Marker, Polyline, Polygon, HeatMap, Cluster, etc.)
- ✅ Complete TypeScript type definitions
- ✅ Cross-platform support (Android, iOS)
- ✅ Support both React Native architectures (Paper & Fabric)

### Optional Modules
- 🔍 **Search Features** (expo-gaode-map-search) - POI search, nearby search, keyword search, geocoding, etc.
- 🧭 **Navigation Features** (expo-gaode-map-navigation) - Driving, walking, cycling, truck route planning, real-time navigation
- 🌐 **Web API** (expo-gaode-map-web-api) - Pure JavaScript implementation of route planning, geocoding, POI search, etc.

## 📦 Installation

### Option 1: Map and Location Only (Core Package)

```bash
npm install expo-gaode-map

# Optional modules
npm install expo-gaode-map-search      # Search features
npm install expo-gaode-map-web-api     # Web API
```

### Option 2: Navigation Features (Navigation Package, includes map features)

```bash
npm install expo-gaode-map-navigation  # Includes map + navigation

# Optional modules
npm install expo-gaode-map-web-api     # Web API
```

> ⚠️ **Important**: `expo-gaode-map` and `expo-gaode-map-navigation` cannot be installed together due to SDK conflicts. Choose one.

### Config Plugin Setup (Recommended)

Configure in `app.json` to automatically set native API Keys and permissions:

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

Rebuild after configuration:

```bash
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```

## 🚀 Quick Start

For detailed initialization and usage guide, please check:
- 📖 [Getting Started Guide](https://TomWq.github.io/expo-gaode-map/en/guide/getting-started.html)
- 💻 [Complete Example Code](https://github.com/TomWq/expo-gaode-map-example)

## 📚 Feature Comparison

| Feature | Core | Search | Navigation | Web API |
|---------|------|--------|------------|---------|
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
│   │   └── Map + Navigation (replaces core)
│   └── web-api/                 # expo-gaode-map-web-api (Web API)
│       └── Pure JS route planning, etc.
└── Note: core and navigation cannot be installed together
```

## 💡 FAQ

### 1. How to choose between Core and Navigation packages?

- **Only need map and location** → Install `expo-gaode-map`
- **Need navigation features** → Install `expo-gaode-map-navigation` (includes map features)
- **Cannot install both**: The two packages conflict due to native SDK, choose one

### 2. What's the difference between Search package and Web API?

- **Search package** (`expo-gaode-map-search`): Native implementation, better performance, requires native setup
- **Web API** (`expo-gaode-map-web-api`): Pure JavaScript, no native setup needed, better cross-platform compatibility

### 3. How to configure API Keys?

Recommended to use Config Plugin for automatic configuration. See: [Initialization Guide](https://TomWq.github.io/expo-gaode-map/en/guide/initialization.html)

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT

## 🔗 Related Links

- [Documentation](https://TomWq.github.io/expo-gaode-map/)
- [GitHub Repository](https://github.com/TomWq/expo-gaode-map)
- [AMap Open Platform](https://lbs.amap.com/)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

## 🙏 Acknowledgments

This project referenced the following excellent projects during development:

- **[react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d)** - An excellent React Native AMap component

Thanks to the contributors of these open-source projects!

## 📮 Feedback and Support

If you encounter problems or have suggestions:

- 📝 Submit [GitHub Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 Join [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- ⭐ Star the project to show support