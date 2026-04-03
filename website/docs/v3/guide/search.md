---
recommended: true
package: search
legacy: true
badges:
  - Optional Package
---

# Search（v3）

`expo-gaode-map-search` 在 v3 中推荐使用 runtime/provider 入口。

## 推荐入口

```ts
import { createNativeSearchRuntime } from 'expo-gaode-map-search'

const runtime = createNativeSearchRuntime()

const page = await runtime.search.searchKeyword({
  keyword: '酒店',
  city: '北京',
  page: 1,
  pageSize: 20,
})
```

## 兼容入口

函数式 API 仍可用（兼容层）：

```ts
import { searchPOI } from 'expo-gaode-map-search'
```

如果需要显式 legacy 子路径：

```ts
import { searchPOI } from 'expo-gaode-map-search/legacy'
```

参考：
- [Search（v3 API）](/v3/api/search)
