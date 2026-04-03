---
recommended: true
package: search
legacy: true
badges:
  - Optional Package
---

# Search（v3 API）

## 运行时工厂

```ts
createNativeSearchRuntime(options?)
createNativeSearchProvider(options?)
createNativeGeocodeProvider(options?)
```

## 最小示例

```ts
import { createNativeSearchRuntime } from 'expo-gaode-map-search'

const runtime = createNativeSearchRuntime()

const page = await runtime.search.searchKeyword({
  keyword: '咖啡',
  city: '北京',
})
```

## 兼容入口

函数式 API 仍保留：

```ts
import { searchPOI, getInputTips } from 'expo-gaode-map-search'
```
