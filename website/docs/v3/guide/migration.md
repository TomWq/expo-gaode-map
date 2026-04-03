---
recommended: true
package: all
legacy: true
badges:
  - Migration
---

# v2 → v3 迁移

## 迁移原则

- 优先迁移新增代码路径
- 旧业务可先保留兼容入口
- 分模块渐进替换（Web API / Search / Navigation）

## 典型迁移对照

### Web API

旧写法：

```ts
import GaodeWebAPI from 'expo-gaode-map-web-api'
const api = new GaodeWebAPI({ key: 'your-web-api-key' })
```

新写法（推荐）：

```ts
import { createWebRuntime } from 'expo-gaode-map-web-api'
const runtime = createWebRuntime({
  route: { config: { key: 'your-web-api-key' } },
})
```

### Search

旧写法：

```ts
import { searchPOI } from 'expo-gaode-map-search'
```

新写法（推荐）：

```ts
import { createNativeSearchRuntime } from 'expo-gaode-map-search'
const runtime = createNativeSearchRuntime()
```
