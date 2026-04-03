---
recommended: true
package: all
legacy: true
badges:
  - Migration
---

# v2 → v3 Migration

## Strategy

- Move new code paths first
- Keep existing business logic on compatibility APIs temporarily
- Replace by module (Web API / Search / Navigation)

## Typical migration

### Web API

Legacy:

```ts
import GaodeWebAPI from 'expo-gaode-map-web-api'
const api = new GaodeWebAPI({ key: 'your-web-api-key' })
```

Recommended:

```ts
import { createWebRuntime } from 'expo-gaode-map-web-api'
const runtime = createWebRuntime({
  route: { config: { key: 'your-web-api-key' } },
})
```

### Search

Legacy:

```ts
import { searchPOI } from 'expo-gaode-map-search'
```

Recommended:

```ts
import { createNativeSearchRuntime } from 'expo-gaode-map-search'
const runtime = createNativeSearchRuntime()
```
