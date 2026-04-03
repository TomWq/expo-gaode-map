---
recommended: true
package: navigation
legacy: true
badges:
  - Navigation
  - Core/Nav Exclusive
---

# Navigation (v3)

`expo-gaode-map-navigation` is the integrated package that bundles map rendering and navigation capability.

## Installation

```bash
npm install expo-gaode-map-navigation
```

::: warning Mutual Exclusion
`expo-gaode-map-navigation` and `expo-gaode-map` cannot be installed together.
:::

## Recommended usage

- Navigation UI: use `NaviView`
- Independent route planning: prefer runtime/provider composition for extension capabilities

## Common combinations

- Navigation only: `expo-gaode-map-navigation`
- Navigation + Web data: `expo-gaode-map-navigation` + `expo-gaode-map-web-api`
- Navigation + native search: add `expo-gaode-map-search`
