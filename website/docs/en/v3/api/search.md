---
recommended: true
package: search
legacy: true
badges:
  - Optional Package
---

# Search (v3 API)

## Runtime factories

```ts
createNativeSearchRuntime(options?)
createNativeSearchProvider(options?)
createNativeGeocodeProvider(options?)
```

## Minimal example

```ts
import { createNativeSearchRuntime } from 'expo-gaode-map-search'

const runtime = createNativeSearchRuntime()

const page = await runtime.search.searchKeyword({
  keyword: 'coffee',
  city: 'Beijing',
})
```

## Compatibility entry

Function-style APIs are still available:

```ts
import { searchPOI, getInputTips } from 'expo-gaode-map-search'
```
