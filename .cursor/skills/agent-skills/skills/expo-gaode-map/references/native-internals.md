---
title: Native Internals
impact: LOW
tags: cpp-engine, jni, native-module, module-loader, error-handling
---

# Skill: Native Internals

了解 `expo-gaode-map` 的底层实现，包括 C++ 聚合引擎、模块加载机制及错误处理。

## 快速参考

### 模块检测与加载 (ModuleLoader)
动态检查原生模块是否安装成功，支持懒加载：
```ts
import { 
  getInstalledModules, 
  printModuleInfo, 
  requireModule,
  createLazyLoader
} from 'expo-gaode-map';

// 1. 打印当前加载的所有高德地图模块信息
printModuleInfo();

// 2. 强制要求模块存在，不存在则抛出异常
requireModule('expo-gaode-map-search', '搜索功能');

// 3. 创建懒加载器
const loadSearch = createLazyLoader(() => require('expo-gaode-map-search'));
const search = loadSearch();
```

### 错误处理 (ErrorHandler)
统一捕获和处理地图相关的异常：
```ts
import { ErrorHandler, ErrorType, GaodeMapError } from 'expo-gaode-map';

// 设置全局错误监听
ErrorHandler.setLogger((error: GaodeMapError) => {
  console.log(`[MapError] Type: ${error.type}, Message: ${error.message}`);
});

// 常见错误类型
// ErrorType.NATIVE_MODULE_NOT_FOUND
// ErrorType.INVALID_PARAMETER
// ErrorType.PERMISSION_DENIED
```

### 常见原生 API (ExpoGaodeMapModule)
```ts
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 检查 SDK 是否配置成功
const isConfigured = ExpoGaodeMapModule.isNativeSDKConfigured();

// 获取 SDK 版本号
const version = ExpoGaodeMapModule.getVersion();
```

## 何时使用

- 需要在应用启动阶段动态检查模块完整性。
- 处理地图组件抛出的原生底层异常。
- 获取 SDK 版本信息用于排查问题。

## 深度挖掘

### C++ 聚合引擎
地图点聚合（Clustering）的核心计算是在 C++ 层完成的（QuadTree 实现），这保证了即使在处理数万个点时，JS 线程也不会被阻塞。

### 模块懒加载 (createLazyLoader)
为了优化启动性能，可以使用 `createLazyLoader`。它返回一个 Proxy 对象，只有在第一次访问模块属性时才会真正执行模块加载。
