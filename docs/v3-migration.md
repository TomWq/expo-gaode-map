# V3 Migration Guide

## Scope

This guide covers the first migration wave from legacy APIs to the v3 runtime/provider model.

- Keep package split: `core`, `navigation`, `search`, `web-api`
- Keep optional native search installation
- Keep `core` and `navigation` mutually exclusive

## New Canonical Entrypoints

### `expo-gaode-map`

- Runtime: `createCoreRuntime`
- Platform assembly (map + capability runtime): `createCorePlatformRuntime`
- Capability assembly: `createCoreCapabilityRuntime`
- Capability inspection: `resolveCoreCapabilityAdapters`

### `expo-gaode-map-navigation`

- Runtime: `createNavigationRuntime`
- Platform assembly (map + capability runtime): `createNavigationPlatformRuntime`
- Capability assembly: `createNavigationCapabilityRuntime`
- Capability inspection: `resolveNavigationCapabilityAdapters`

### `expo-gaode-map-search`

- Provider: `createNativeSearchProvider`, `createNativeGeocodeProvider`
- Runtime: `createNativeSearchRuntime`
- Capability adapter: `createNativeSearchCapabilityAdapter`

### `expo-gaode-map-web-api`

- Provider: `createWebSearchProvider`, `createWebGeocodeProvider`, `createWebRouteProvider`
- Runtime: `createWebRuntime`, `createWebDataRuntime`
- Capability adapters: `createWebCapabilityAdapter`, `createWebDataCapabilityAdapter`
- Works as a pure JS package without mandatory `core/navigation` installation

## Legacy API Status

- `expo-gaode-map-search` legacy function APIs are now marked `@deprecated`
- `expo-gaode-map-web-api` class API `GaodeWebAPI` is now marked `@deprecated`
- Legacy APIs are still supported in this phase for backward compatibility
- `expo-gaode-map-search` legacy functions now delegate to v3 runtime internally (thin compatibility layer)
- Main entry default exports remain legacy-compatible in this phase:
  - `expo-gaode-map-search` default export -> `LegacySearch`
  - `expo-gaode-map-web-api` default export -> `GaodeWebAPI`
- Legacy 专用入口：
  - `expo-gaode-map-search/legacy`
  - `expo-gaode-map-web-api/legacy`

## Unified Error Shape

v3 now standardizes error payload fields across packages:

```ts
{
  code: string;
  type: string;
  message: string;
  retryable: boolean;
  cause?: unknown;
}
```

- `core/navigation`: `GaodeMapError`
- `search`: `GaodeSearchError`
- `web-api`: `GaodeAPIError` and `GaodeWebApiRuntimeError`
- v3 runtime/provider: `GaodeProviderError`

## Migration Examples

### Search package: function API -> provider/runtime

Legacy:

```ts
import Search from 'expo-gaode-map-search';

const result = await Search.searchPOI({ keyword: '咖啡' });
```

V3:

```ts
import { createNativeSearchRuntime } from 'expo-gaode-map-search';

const runtime = createNativeSearchRuntime();
const result = await runtime.search.searchKeyword({ keyword: '咖啡' });
```

### Web API package: class API -> runtime

Legacy:

```ts
import GaodeWebAPI from 'expo-gaode-map-web-api';

const api = new GaodeWebAPI({ key: 'web-key' });
const result = await api.poi.search('咖啡');
```

V3:

```ts
import { createWebRuntime } from 'expo-gaode-map-web-api';

const runtime = createWebRuntime({
  search: { key: 'web-key' },
  geocode: { key: 'web-key' },
  route: { key: 'web-key' },
});

const result = await runtime.search.searchKeyword({ keyword: '咖啡' });
```

### Core/Navigation: platform runtime assembly (推荐)

```ts
import { createCorePlatformRuntime } from 'expo-gaode-map';

const platform = createCorePlatformRuntime({
  map: {
    privacyConfig: {
      hasShow: true,
      hasContainsPrivacy: true,
      hasAgree: true,
    },
    sdkConfig: {
      iosKey: 'ios-key',
      androidKey: 'android-key',
      webKey: 'web-key',
    },
  },
  autoBootstrapMap: true,
  capability: {
    selection: {
      requirements: {
        search: true,
        geocode: true,
        route: true,
      },
      prefer: 'native-first',
    },
  },
});

const routePlan = await platform.capabilities.route.calculateDrivingRoute({
  origin: { latitude: 39.9, longitude: 116.4 },
  destination: { latitude: 39.91, longitude: 116.41 },
});
```

## Next Planned Cut

- Narrow legacy exports to thin compatibility layer
- Unify error object shape across all four packages
- Move docs/examples default path to v3 runtime/provider model
- Keep navigation transit fallback on provider/runtime exports (`createWebRouteProvider` / `createWebRuntime`) instead of class-only binding
