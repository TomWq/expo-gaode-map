---
recommended: true
package: web-api
legacy: true
badges:
  - Standalone Ready
---

# Web API（v3）

`expo-gaode-map-web-api` 在 v3 中可独立使用，也可与基础地图模块协同复用 `webKey`。

## 推荐入口

```ts
import { createWebRuntime } from 'expo-gaode-map-web-api'

const runtime = createWebRuntime({
  search: { config: { key: 'your-web-api-key' } },
  geocode: { config: { key: 'your-web-api-key' } },
  route: { config: { key: 'your-web-api-key' } },
})
```

## key 解析顺序

1. 显式传入 `config.key`
2. `expo-gaode-map` 的 `initSDK({ webKey })`
3. `expo-gaode-map-navigation` 的 `initSDK({ webKey })`

## 兼容入口

`GaodeWebAPI` class 仍保留作为兼容层：

```ts
import GaodeWebAPI from 'expo-gaode-map-web-api'
const api = new GaodeWebAPI({ key: 'your-web-api-key' })
```

参考：
- [Web API（v3 API）](/v3/api/web-api)
