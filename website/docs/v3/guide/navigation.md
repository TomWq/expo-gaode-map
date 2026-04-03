---
recommended: true
package: navigation
legacy: true
badges:
  - Navigation
  - Core/Nav Exclusive
---

# 导航（v3）

`expo-gaode-map-navigation` 是导航一体化包，包含地图与导航能力。

## 安装

```bash
npm install expo-gaode-map-navigation
```

::: warning 互斥约束
`expo-gaode-map-navigation` 与 `expo-gaode-map` 不能同时安装。
:::

## 推荐用法

- 导航 UI：使用 `NaviView`
- 独立算路：优先使用 runtime/provider（例如 web route provider 作为补充能力）

## 常见组合

- 仅导航：`expo-gaode-map-navigation`
- 导航 + Web 数据：`expo-gaode-map-navigation` + `expo-gaode-map-web-api`
- 导航 + 原生搜索：额外安装 `expo-gaode-map-search`
