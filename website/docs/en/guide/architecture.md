# Project Architecture

This document explains the Monorepo architecture and package layout of the
expo-gaode-map project.

## Monorepo Overview

expo-gaode-map uses a **Bun workspaces**-based Monorepo to organize multiple
packages in a single repository:

```
expo-gaode-map/
├── packages/
│   ├── core/               # expo-gaode-map (core map package)
│   │   ├── src/            # TypeScript source code
│   │   ├── ios/            # iOS native code
│   │   ├── android/        # Android native code
│   │   └── plugin/         # Expo Config Plugin
│   │
│   ├── search/             # expo-gaode-map-search (search package)
│   │   ├── src/            # TypeScript source code
│   │   ├── ios/            # iOS native code
│   │   └── android/        # Android native code
│   │
│   ├── navigation/         # expo-gaode-map-navigation (navigation package)
│   │   ├── src/            # TypeScript source code
│   │   ├── ios/            # iOS native code
│   │   └── android/        # Android native code
│   │
│   └── web-api/            # expo-gaode-map-web-api (Web API package)
│       └── src/            # TypeScript code (pure JS, no native)
│
├── example/                # Example app (uses core package)
├── navigation/             # Navigation example app
├── website/                # Documentation site (this project)
```

### Why Monorepo?

- **Install only what you need** – users can install only required modules to
  keep app bundle size smaller.
- **Shared code** – core types and utilities are shared between packages.
- **Unified tooling** – all packages share the same build, test, and lint
  configuration.
- **Consistent versions** – dependencies are managed in one place to avoid
  version conflicts.

## Core Package (expo-gaode-map)

The core package provides fundamental map rendering and location features.

Key responsibilities:

- MapView component and overlay components (Marker, Polyline, Polygon, Circle,
  HeatMap, MultiPoint, Cluster)
- Location APIs (single location, continuous tracking, coordinate conversion)
- Expo Config Plugin integration
- Error handling utilities and platform detection helpers

For detailed APIs, see:

- [MapView API](/en/api/mapview)
- [Location API](/en/api/location)
- [Overlays](/en/api/overlays)
- [Type Definitions](/en/api/types)

## Search Package (expo-gaode-map-search)

The search package provides native POI search functionality:

- POI keyword search
- Nearby search
- Along-route search
- Polygon search
- Input tips (autocomplete)

It is an **optional** package – install it only when search is required.

Related docs:

- [Search Guide](/en/guide/search)
- [Search API](/en/api/search)
- [Search Examples](/en/examples/search)

## Navigation Package (expo-gaode-map-navigation)

The navigation package is a **standalone integrated solution** that bundles
full map rendering and navigation capabilities.

::: danger Binary Conflict Warning
expo-gaode-map-navigation conflicts with the core package `expo-gaode-map` at
the native SDK level. **Do not install them together**. Choose one solution per
app.
:::

Features:

- Built-in MapView and overlay components
- Multiple route planning modes (drive, walk, ride, truck, motorcycle,
  electric bike)
- Real-time turn-by-turn navigation via `NaviView`
- Independent route planning APIs that do not affect current navigation

Related docs:

- [Navigation Guide](/en/guide/navigation)
- [Navigation API](/en/api/navigation)

## Web API Package (expo-gaode-map-web-api)

The Web API package is a **pure JavaScript** client for AMap Web Service APIs.
It communicates with AMap servers via HTTP.

Characteristics:

- Pure JS, no native dependencies
- Works together with core or navigation packages by reading `webKey` from
  `initSDK`
- Supports the latest V5 route planning APIs
- Fully typed with TypeScript definitions

Main capabilities:

- Geocoding: address ↔ coordinate (single and batch)
- Route planning: drive, walk, ride, transit (V5 APIs)
- POI search: keyword, nearby, detail
- Input tips: POI/bus station/bus line suggestions

Related docs:

- [Web API Guide](/en/guide/web-api)
- [Web API Reference](/en/api/web-api)

## SDK Dependencies

### Android

```text
Core package:      com.amap.api:3dmap:10.0.600 (unified SDK)
Search package:    depends on core SDK
Navigation package: com.amap.api:navi-3dmap (conflicts with core)
Web API package:   no native dependencies
```

### iOS

```text
Core package:      AMapFoundationKit + AMapLocationKit + MAMapKit
Search package:    AMapFoundationKit + AMapSearchKit
Navigation package: AMapFoundationKit + AMapNaviKit + MAMapKit
Web API package:   no native dependencies
```

## Package Combinations

### Option 1: Core + Extensions

```text
User App (example)
 ├─ expo-gaode-map           (core map package)
 ├─ expo-gaode-map-search    (search, optional)
 └─ expo-gaode-map-web-api   (Web services, optional)

      ↓
   AMap Native SDK
```

### Option 2: Navigation Package Only

```text
Navigation App (navigation)
 └─ expo-gaode-map-navigation (integrated map + navigation)

      ↓
   AMap Navi SDK (navi-3dmap)
```

### Web API (Both Options)

```text
Any App (core or navigation)
 ├─ expo-gaode-map or expo-gaode-map-navigation
 └─ expo-gaode-map-web-api

      ↓
   AMap Web Service API
```

## Related Documentation

- [Getting Started](/en/guide/getting-started)
- [Config Plugin](/en/guide/config-plugin)
- [Initialization](/en/guide/initialization)
- [Search Guide](/en/guide/search)
- [Navigation Guide](/en/guide/navigation)
- [Web API Guide](/en/guide/web-api)
- [API Reference](/en/api/)
- [Examples](/en/examples/)

