---
recommended: true
package: web-api
legacy: true
badges:
  - Standalone Ready
---

# Web API（v3 API）

## 运行时工厂

```ts
createWebRuntime(options?)
createWebDataRuntime(options?)
createWebSearchProvider(options?)
createWebGeocodeProvider(options?)
createWebRouteProvider(options?)
```

## 最小示例

```ts
import { createWebRuntime } from 'expo-gaode-map-web-api'

const runtime = createWebRuntime({
  geocode: { config: { key: 'your-web-api-key' } },
})

const result = await runtime.geocode.reverseGeocode({
  location: { longitude: 116.481028, latitude: 39.989643 },
})
```

## 兼容类

`GaodeWebAPI` 保留为兼容入口，但新代码建议优先 runtime/provider。
