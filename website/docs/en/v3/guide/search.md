---
recommended: true
package: search
legacy: true
badges:
  - Optional Package
---

# Search (v3)

Use runtime/provider APIs as the recommended entry in v3.

## Recommended entry

```ts
import { createNativeSearchRuntime } from 'expo-gaode-map-search'

const runtime = createNativeSearchRuntime()

const page = await runtime.search.searchKeyword({
  keyword: 'coffee',
  city: 'Beijing',
  page: 1,
  pageSize: 20,
})
```

## Compatibility entry

Function APIs are still available:

```ts
import { searchPOI } from 'expo-gaode-map-search'
```

Explicit legacy subpath:

```ts
import { searchPOI } from 'expo-gaode-map-search/legacy'
```
