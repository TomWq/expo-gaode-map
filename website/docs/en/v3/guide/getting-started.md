---
recommended: true
package: all
legacy: true
badges:
  - Quick Start
---

# V3 Quick Start

## 1. Choose base package

- Map only: `expo-gaode-map`
- Navigation: `expo-gaode-map-navigation`

```bash
npm install expo-gaode-map
# or
npm install expo-gaode-map-navigation
```

## 2. Add optional capability packages

```bash
npm install expo-gaode-map-search
npm install expo-gaode-map-web-api
```

## 3. Recommended entry (v3 runtime/provider)

```ts
import { createWebRuntime } from 'expo-gaode-map-web-api'
import { createNativeSearchRuntime } from 'expo-gaode-map-search'

const webRuntime = createWebRuntime({
  search: { config: { key: 'your-web-api-key' } },
  geocode: { config: { key: 'your-web-api-key' } },
  route: { config: { key: 'your-web-api-key' } },
})

const searchRuntime = createNativeSearchRuntime()
```

## 4. Compatibility

- Legacy default exports are still available.
- New code should prefer runtime/provider APIs.

Next:
- [Architecture](/en/v3/guide/architecture)
- [Migration](/en/v3/guide/migration)
