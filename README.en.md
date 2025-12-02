# expo-gaode-map

English | [简体中文](./README.md)

A full-featured AMap (Gaode Map) React Native component library, **built with Expo Modules**, providing map display, location, overlays, and more:
- Android: [AMap Android SDK](https://lbs.amap.com/api/android-sdk/summary)
- iOS: [AMap iOS SDK](https://lbs.amap.com/api/ios-sdk/summary)

> 💡 This component is built with [Expo Modules API](https://docs.expo.dev/modules/overview/), providing type-safe native module interfaces and excellent developer experience.

## ✨ Features

- ✅ Complete map functionality (multiple map types, gesture control, camera operations)
- ✅ Accurate location (continuous location, single location, coordinate conversion)
- ✅ Rich overlays (Circle, Marker, Polyline, Polygon)
- ✅ Complete TypeScript type definitions (zero any types)
- ✅ Modular architecture design
- ✅ Support both declarative components and imperative API
- ✅ Cross-platform support (Android, iOS)
- ✅ Support custom styles and event listeners
- ✅ Support both React Native architectures (Paper & Fabric)

## 📦 Installation

### Stable Version (Recommended)

```bash
npm install expo-gaode-map
# or
yarn add expo-gaode-map
# or
pnpm add expo-gaode-map
```


### Expo Projects

If you're using an Expo managed project (using `expo prebuild` or development builds), you need to rebuild native code after installation:

```bash
# Using EAS Build
eas build --platform android

# Or using local build
npx expo prebuild
npx expo run:android
```

### Pure React Native Projects

For pure React Native projects (created with `react-native init`), ensure `expo` package is installed as a dependency:

```bash
npm install expo
# Then rebuild the app
npx react-native run-android
```

## 🚀 Quick Start

### 1. Get AMap API Key

Visit [AMap Open Platform](https://lbs.amap.com/) to register and create an application to get API Key.

> ⚠️ **Important: Native Configuration and Permissions**
>
> AMap SDK requires configuration in native projects:
>
> **Android Required Configuration:**
> 1. Configure API Key in `AndroidManifest.xml`
> 2. Add required permissions (network, location, etc.)
> 3. Configure privacy compliance (required)
>
> **iOS Required Configuration:**
> 1. Configure API Key in `Info.plist`
> 2. Add location permission descriptions (NSLocationWhenInUseUsageDescription, etc.)
> 3. Configure privacy compliance (required)
>
> **Detailed Configuration Guides:**
> - **Android**: [AMap Android SDK Configuration Guide](https://lbs.amap.com/api/android-sdk/guide/create-project/android-studio-create-project)
> - **iOS**: [AMap iOS SDK Configuration Guide](https://lbs.amap.com/api/ios-sdk/guide/create-project/cocoapods)
>
> For Expo projects, use `npx expo prebuild` to generate native code before configuration.

### 2. Initialization and Permission Management

**Recommended initialization process**:

```tsx
import { useEffect, useState } from 'react';
import {
  MapView,
  ExpoGaodeMapModule,
} from 'expo-gaode-map';

export default function App() {
  const [initialPosition, setInitialPosition] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      // 1. Initialize SDK
      ExpoGaodeMapModule.initSDK({
        androidKey: 'your-android-api-key',
        iosKey: 'your-ios-api-key',
      });
      
      // 2. Check and request permission
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        await ExpoGaodeMapModule.requestLocationPermission();
      }
      
      // 3. Get location and set map
      try {
        const location = await ExpoGaodeMapModule.getCurrentLocation();
        setInitialPosition({
          target: { latitude: location.latitude, longitude: location.longitude },
          zoom: 15
        });
      } catch (error) {
        // Use default location
        setInitialPosition({
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10
        });
      }
    };
    
    initialize();
  }, []);

  if (!initialPosition) return null;

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={initialPosition}
      myLocationEnabled={true}
    />
  );
}
```

> 📖 **Detailed Initialization Guide**: [INITIALIZATION.en.md](docs/INITIALIZATION.en.md)
>
> Includes complete permission handling, error handling, and best practices.

### 3. Basic Map Usage

```tsx
import { MapView } from 'expo-gaode-map';

export default function MapScreen() {
  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 10,
      }}
      myLocationEnabled={true}
      onLoad={() => console.log('Map loaded')}
    />
  );
}
```

## 📚 Feature Overview

### 🗺️ Map Display
- Multiple map types (normal, satellite, night, etc.)
- Camera control (move, zoom, rotate, tilt)
- Gesture control and UI control configuration
- Zoom level limits

### 📍 Location Features
- Continuous and single location
- Reverse geocoding (address resolution)
- Location configuration (accuracy, interval, mode, etc.)
- Custom location blue dot style

### 🎨 Overlays
- Circle
- Marker
- Polyline
- Polygon
- Support both declarative and imperative usage

### 📝 More Examples

For detailed usage examples, see: [EXAMPLES.en.md](docs/EXAMPLES.en.md)

Includes:
- Basic map application
- Location tracking application
- Overlay operation examples
- Advanced usage and best practices

## 📝 Documentation

- [API Documentation](docs/API.en.md) - Complete API reference
- [Usage Examples](docs/EXAMPLES.en.md) - Detailed code examples
- [Initialization Guide](docs/INITIALIZATION.en.md) - SDK initialization and permission management
- [Architecture Documentation](docs/ARCHITECTURE.en.md) - Project structure and file 

## 🎨 Advanced Usage

### followUserLocation Explained

`followUserLocation` controls whether the map automatically follows user location:

**Browse Mode (default - `false`):**
```tsx
<MapView
  myLocationEnabled={true}
  followUserLocation={false}  // or omit
/>
```
- ✅ Show location dot
- ✅ User can freely scroll map
- ✅ Map won't auto-move

**Navigation Mode (`true`):**
```tsx
<MapView
  myLocationEnabled={true}
  followUserLocation={true}
/>
```
- ✅ Show location dot
- ✅ Map auto-follows user movement
- ⚠️ Suitable for navigation scenarios


### Color Format

Overlay colors support two formats:

1. **String format** (ARGB): `"#AARRGGBB"`
   ```tsx
   <Circle fillColor="#8800FF00" />  // 50% transparent green
   ```
   ```

### Performance Optimization

- ✅ Use imperative API for large numbers of overlays
- ✅ Remove unnecessary overlays promptly
- ✅ Avoid complex operations in high-frequency events like `onPress`
- ✅ Don't set location interval too small (recommend >= 1000ms)

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT

## 🔗 Related Links

- [AMap Open Platform](https://lbs.amap.com/)
- [AMap Android SDK](https://lbs.amap.com/api/android-sdk/summary)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [GitHub Repository](https://github.com/TomWq/expo-gaode-map)

## 🙏 Acknowledgments

This project referenced the following excellent projects during development:

- **[react-native-amap3d](https://github.com/qiuxiang/react-native-amap3d)** - An excellent React Native AMap component that provided important references for this project's design and implementation

Thanks to the contributors of these open-source projects for bringing valuable experience and code to the community.

## 📮 Feedback and Support

If you encounter problems or have suggestions:

- 📝 Submit [GitHub Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 Join [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- ⭐ Star the project to show support
- 💬 Join QQ Group: 952241387