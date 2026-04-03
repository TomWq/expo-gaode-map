---
recommended: true
package: web-api
legacy: true
badges:
  - Standalone Ready
---

# Web API (v3)

`expo-gaode-map-web-api` can run standalone in v3, and can also reuse `webKey` from base map SDK initialization.

## Recommended entry

```ts
import { createWebRuntime } from 'expo-gaode-map-web-api'

const runtime = createWebRuntime({
  search: { config: { key: 'your-web-api-key' } },
  geocode: { config: { key: 'your-web-api-key' } },
  route: { config: { key: 'your-web-api-key' } },
})
```

## Key resolution order

1. explicit `config.key`
2. `expo-gaode-map` `initSDK({ webKey })`
3. `expo-gaode-map-navigation` `initSDK({ webKey })`

## Compatibility entry

`GaodeWebAPI` class remains available:

```ts
import GaodeWebAPI from 'expo-gaode-map-web-api'
const api = new GaodeWebAPI({ key: 'your-web-api-key' })
```
