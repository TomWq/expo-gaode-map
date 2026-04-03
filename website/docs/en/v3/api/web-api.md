---
recommended: true
package: web-api
legacy: true
badges:
  - Standalone Ready
---

# Web API (v3 API)

## Runtime factories

```ts
createWebRuntime(options?)
createWebDataRuntime(options?)
createWebSearchProvider(options?)
createWebGeocodeProvider(options?)
createWebRouteProvider(options?)
```

## Minimal example

```ts
import { createWebRuntime } from 'expo-gaode-map-web-api'

const runtime = createWebRuntime({
  geocode: { config: { key: 'your-web-api-key' } },
})

const result = await runtime.geocode.reverseGeocode({
  location: { longitude: 116.481028, latitude: 39.989643 },
})
```

## Compatibility class

`GaodeWebAPI` is preserved for compatibility, but runtime/provider is the recommended v3 path.
