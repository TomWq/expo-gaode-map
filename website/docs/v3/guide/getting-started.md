---
recommended: true
package: all
legacy: true
badges:
  - Quick Start
---

# V3 快速开始

## 1. 选择基础包

- 只做地图：`expo-gaode-map`
- 做导航：`expo-gaode-map-navigation`

```bash
npm install expo-gaode-map
# 或
npm install expo-gaode-map-navigation
```

## 2. 按需安装能力包

```bash
npm install expo-gaode-map-search
npm install expo-gaode-map-web-api
```

## 3. 推荐写法（v3 runtime/provider）

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

## 4. 兼容说明

- 旧入口仍可用（默认导出保持兼容）。
- 新代码建议优先使用 runtime/provider。

下一步：
- [架构说明](/v3/guide/architecture)
- [迁移说明](/v3/guide/migration)
