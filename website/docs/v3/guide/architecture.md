---
recommended: true
package: all
badges:
  - Architecture
---

# V3 架构说明

## 一句话

`v3 = 4 个独立包 + 统一 runtime/provider 协议 + 共享领域模型`

## 包职责

- `expo-gaode-map`：核心地图 runtime（地图、定位、覆盖物）
- `expo-gaode-map-navigation`：导航 runtime（导航地图、导航状态、导航 UI）
- `expo-gaode-map-search`：原生搜索 provider（可选）
- `expo-gaode-map-web-api`：纯 JS 数据 provider（可选，可独立）

## 关键约束

- `core` 和 `navigation` 互斥安装
- `search` 和 `web-api` 都是可选能力包

## 用户层心智

1. 先选基础运行平台：Core 或 Navigation  
2. 再按能力装配：Search / Geocode / Route  
3. 新代码优先 runtime/provider，旧代码走兼容层

## 相关文档

- [Web API（v3）](/v3/guide/web-api)
- [Search（v3）](/v3/guide/search)
- [迁移说明](/v3/guide/migration)
