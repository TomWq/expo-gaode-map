---
recommended: true
package: all
badges:
  - Architecture
---

# V3 Architecture

## One-line definition

`v3 = 4 independent packages + shared runtime/provider contracts + unified domain model`

## Package responsibilities

- `expo-gaode-map`: core map runtime
- `expo-gaode-map-navigation`: navigation runtime
- `expo-gaode-map-search`: native search provider (optional)
- `expo-gaode-map-web-api`: pure JS data provider (optional, standalone)

## Key constraints

- `core` and `navigation` are mutually exclusive
- `search` and `web-api` are optional capability packages

## User mental model

1. Pick base runtime: Core or Navigation  
2. Compose capabilities: Search / Geocode / Route  
3. Prefer runtime/provider for new code, keep legacy for compatibility

## Related docs

- [Web API (v3)](/en/v3/guide/web-api)
- [Search (v3)](/en/v3/guide/search)
- [Migration](/en/v3/guide/migration)
