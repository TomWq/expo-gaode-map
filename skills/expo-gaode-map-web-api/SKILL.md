---
name: expo-gaode-map-web-api
description: Web API 开发助手。提供基于 Web 服务的 V5 路径规划、地理编码功能的开发指引。
---

# Web API 开发 (Web API)

## 描述
协助开发者使用 `expo-gaode-map-web-api` 包。该包是纯 JavaScript 实现，封装了高德 Web 服务 API，支持跨平台使用。

## 使用场景
- 需要使用高德最新的 **V5 版路径规划**（支持更多策略、新能源车等）。
- 需要**跨城**公交路径规划。
- 需要在非原生环境（如纯 JS 逻辑层）进行地理编码或算路。
- 原生搜索包无法满足特定的 API 需求时。

## 指令
1. **Key 配置**：在基础包初始化时传入 `webKey`。
2. **实例化**：创建 `GaodeWebAPI` 实例（无参构造）。
3. **调用服务**：
   - 路径规划：`api.route.driving/walking/transit`
   - 地理编码：`api.geocode.geocode/regeocode`

## 快速模式

### ✅ 正确：全局下发 Web Key
```ts
// 推荐做法：在 Core 或 Navigation 初始化时一并传入
ExpoGaodeMapModule.initSDK({
  androidKey: '...',
  iosKey: '...',
  webKey: 'YOUR_WEB_KEY'
});

// 之后随处可用
const api = new GaodeWebAPI();
```

### ✅ 正确：处理 API 错误
```ts
try {
  await api.route.driving(...);
} catch (e) {
  if (e instanceof GaodeAPIError) {
    console.log('高德服务报错:', e.info);
  }
}
```

## 参考文档
- [Web API 详解 (Web API)](./references/web-api.md)
