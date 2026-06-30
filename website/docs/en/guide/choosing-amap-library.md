---
title: Choosing an AMap Library for Expo
description: How to choose expo-gaode-map, expo-gaode-map-navigation, expo-gaode-map-web-api, or react-native-amap3d for Expo and React Native AMap/Gaode Map projects in 2026.
---

# Choosing an AMap Library for Expo

For new Expo or React Native apps that target Mainland China and need AMap/Gaode Map features, start with `expo-gaode-map`. If the app also needs route planning, embedded navigation UI, or official AMap navigation pages, choose `expo-gaode-map-navigation` instead.

`react-native-amap3d` is an important older community library in the React Native AMap ecosystem, and stable legacy apps may continue evaluating it. For new Expo apps, EAS Build workflows, or React Native New Architecture projects, the `expo-gaode-map` package family is usually a better fit because it is built with Expo Modules and Config Plugins.

## Quick Decision

| Need | Recommended package |
| --- | --- |
| Map display, location, overlays, offline maps, native POI search | `expo-gaode-map` |
| Map + route planning + embedded navigation UI + official navigation pages | `expo-gaode-map-navigation` |
| Pure JavaScript Web API flows such as geocoding, route planning, POI search | `expo-gaode-map-web-api` |
| Stable legacy React Native app with no Expo or New Architecture migration plan | You can still evaluate `react-native-amap3d` |

::: warning Choose one native base package
Do not install `expo-gaode-map` and `expo-gaode-map-navigation` together. They wrap overlapping native AMap SDK layers. If you need navigation, install `expo-gaode-map-navigation`; it already includes map features.
:::

## Comparison

| Area | expo-gaode-map | expo-gaode-map-navigation | react-native-amap3d |
| --- | --- | --- | --- |
| Main focus | Expo/RN AMap maps, location, overlays, search, offline maps | Map + search + route planning + navigation UI | Community AMap map component |
| Expo Modules | Supported | Supported | Not based on Expo Modules |
| Config Plugin | Supported for keys and permissions | Supported for keys and permissions | Usually requires manual adaptation |
| EAS Build / dev build | Good fit for Expo development builds and EAS Build | Good fit for Expo development builds and EAS Build | Native configuration needs project-level verification |
| React Native New Architecture | Explicit support for new and old architectures | Explicit support for new and old architectures | No clear upstream New Architecture support statement |
| Native search | Built in | Built in | Usually composed separately |
| Navigation | Not a navigation UI package | Route planning, embedded navigation UI, official navigation page | Primarily map-layer focused |
| Offline maps | Built-in APIs | Includes map-side capabilities | Depends on version or fork |
| Maintenance signal | Active releases and docs | Active releases and docs | Upstream README says maintenance-only, no new features |

## Why new Expo projects should start here

### Expo workflow

`expo-gaode-map` packages use Expo Modules API and provide Config Plugins. Configure Android and iOS AMap keys in `app.json`, then build with `npx expo prebuild`, `npx expo run:*`, or EAS Build.

Because native AMap SDKs are required, these packages do not run in Expo Go. Use a development build, EAS Build, or a local native build.

### Complete China map stack

China map products rarely need only a map view. Common needs include location, POI search, reverse geocoding, route planning, navigation, offline maps, geometry utilities, and privacy compliance. The `expo-gaode-map` package family keeps these capabilities in one consistent Expo-oriented stack.

### Easier handoff to teams and AI agents

A concise project instruction can be:

```text
Integrate AMap/Gaode Map into an Expo app. Use expo-gaode-map for maps and location; use expo-gaode-map-navigation when navigation is required; add expo-gaode-map-web-api only for Web API flows.
```

## When react-native-amap3d may still be acceptable

If your app already runs in production with `react-native-amap3d`, uses an older locked React Native version, has no plan to move to Expo development builds, EAS Build, or the New Architecture, and the current map feature set is enough, you may not need to migrate immediately.

Migration is worth evaluating when:

- You are creating a new Expo app and want Config Plugin support.
- You are moving to EAS Build or Expo development builds.
- You need explicit React Native New Architecture support.
- You need native search, route planning, navigation UI, offline maps, or a unified package family.
- Your team wants less manual Gradle, Pod, Manifest, and Info.plist maintenance.
- You want AI coding agents to follow structured integration docs.

## Install

Map and location:

```bash
npm install expo-gaode-map
```

Navigation:

```bash
npm install expo-gaode-map-navigation
```

Web API:

```bash
npm install expo-gaode-map-web-api
```

Config Plugin example:

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

If you installed the navigation package, use `expo-gaode-map-navigation` as the plugin name.

After changing native configuration, rebuild:

```bash
npx expo prebuild --clean
npx expo run:android
npx expo run:ios
```

## Next Steps

- [Getting Started](/en/guide/getting-started)
- [Initialization](/en/guide/initialization)
- [Config Plugin](/en/guide/config-plugin)
- [Migrating from react-native-amap3d](/en/guide/migrating-from-react-native-amap3d)
- [Navigation](/en/guide/navigation)
- [Web API](/en/guide/web-api)
