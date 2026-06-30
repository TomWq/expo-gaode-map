---
title: Compatibility Matrix
description: Compatibility notes for expo-gaode-map, expo-gaode-map-navigation, and expo-gaode-map-web-api across Expo SDK, React Native, New Architecture, Expo Go, development builds, and EAS Build.
---

# Compatibility Matrix

This matrix explains the recommended support status for the `expo-gaode-map` package family across Expo SDK, React Native, platforms, and build workflows. It is not a promise that every historical combination has been tested one by one. It is a public maintenance baseline: what is verified, what is recommended, what is theoretical, what is legacy, and what is unsupported.

## Status Legend

| Status | Meaning |
| --- | --- |
| Verified | Tested by maintainers through examples, CI, or release flow |
| Recommended | Current mainline combination and first priority for fixes |
| Theoretical | Version range and workflow should match, but not every combination is tested |
| Legacy | Kept for old projects, lower maintenance priority |
| Verify yourself | May work, but is not covered by the default support baseline |
| Unsupported | The workflow does not match, or it cannot run by design |

## Expo / React Native Compatibility

| Expo SDK | React Native | Recommended package version | iOS | Android | New Architecture | EAS Build | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SDK 55 | RN 0.83.x | `expo-gaode-map@2.2.x` / `expo-gaode-map-navigation@2.0.x` | Verified | Verified | Supported | Supported | Recommended |
| SDK 54 | RN 0.81 / 0.82 | `expo-gaode-map@2.2.x` / `expo-gaode-map-navigation@2.0.x` | Theoretical | Theoretical | Supported | Supported | Recommended |
| SDK 53 and lower | RN 0.79 / 0.80 and older | `expo-gaode-map@v1` | Legacy | Legacy | Mostly legacy architecture | Verify yourself | Maintained |
| SDK 52 and lower | Older RN versions | `expo-gaode-map@v1` or older | Verify yourself | Verify yourself | Not recommended | Verify yourself | Legacy projects |

::: tip Current mainline
The current example apps use Expo SDK 55 and React Native 0.83.x. New projects should prefer SDK 55 with `expo-gaode-map@2.2.x` or `expo-gaode-map-navigation@2.0.x`.
:::

## Package Compatibility

| Package | Expo SDK 54+ | Expo SDK 53- | New Architecture | Expo Go | Dev Build | EAS Build |
| --- | --- | --- | --- | --- | --- | --- |
| `expo-gaode-map` | Recommended 2.x | Use v1 | Supported | Unsupported | Supported | Supported |
| `expo-gaode-map-navigation` | Recommended 2.x | Verify yourself | Supported | Unsupported | Supported | Supported |
| `expo-gaode-map-web-api` | Supported | Supported | No native dependency | Supported | Supported | Supported |
| `expo-gaode-map-search` | No longer maintained as standalone | `2.2.33` legacy compatibility | Not recommended | Unsupported | Verify yourself | Verify yourself |

::: warning Expo Go is not supported for native AMap SDKs
`expo-gaode-map` and `expo-gaode-map-navigation` depend on native AMap SDKs, so they do not run inside Expo Go. Use an Expo development build, EAS Build, or a local native build.
:::

## Verified Environments

| Date | Package version | Expo SDK | React Native | Platform | Build workflow | New Architecture | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-06-30 | `expo-gaode-map@2.2.38` | SDK 55 | RN 0.83.x | Android / iOS | CI verification suite + example apps | Supported | Passed |
| 2026-06-30 | `expo-gaode-map-navigation@2.0.18` | SDK 55 | RN 0.83.x | Android / iOS | CI verification suite + example apps | Supported | Passed |
| 2026-06-30 | `expo-gaode-map-web-api@2.0.x` | SDK 55 | RN 0.83.x | JS / native runtime | CI verification suite + example apps | No native dependency | Passed |

## Release Checklist

Before each release, maintainers should at least run the following checks. This does not mean every API is manually tested every time, but the core path should stay buildable, runnable, and diagnosable.

```md
- [ ] yarn lint
- [ ] yarn test
- [ ] yarn build:core
- [ ] yarn build:navigation
- [ ] yarn build:web-api
- [ ] yarn test:example-navigation
- [ ] Android example local build or EAS Build verified
- [ ] iOS example local build or EAS Build verified
- [ ] MapView renders
- [ ] Location permission flow works
- [ ] Marker / Polyline / Polygon smoke test
- [ ] Native search smoke test
- [ ] Navigation example smoke test when releasing navigation
- [ ] Website docs build passes
```

## Version Guidance

- New Expo projects: use the latest Expo SDK and `expo-gaode-map@2.x`.
- Navigation projects: use `expo-gaode-map-navigation` directly and do not install the core package together.
- Expo SDK 53 and lower: pin `expo-gaode-map@v1` and plan an upgrade path.
- Standalone `expo-gaode-map-search`: only for legacy projects pinned to `2.2.33`; new projects should use the built-in search APIs from core / navigation.

## Related Docs

- [Choosing an AMap Library](/en/guide/choosing-amap-library)
- [Getting Started](/en/guide/getting-started)
- [Initialization](/en/guide/initialization)
- [Config Plugin](/en/guide/config-plugin)
- [Migrating from react-native-amap3d](/en/guide/migrating-from-react-native-amap3d)
