---
title: Native Internals
impact: LOW
tags: cpp-engine, jni, native-module, module-loader, error-handling
---

# Skill: Native Internals

了解 `expo-gaode-map` 的底层实现，包括 C++ 聚合引擎、错误处理。

## 快速参考

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

### C++ 引擎
`expo-gaode-map` 拥有一个高性能的 C++ 共享库 (`shared/cpp`)：
1. **聚合引擎 (Clustering)**: 基于 QuadTree 实现，确保处理数万个点时 JS 线程不阻塞。
2. **几何引擎 (Geometry)**: 
   - **轨迹抽稀**: 采用 Ramer-Douglas-Peucker (RDP) 算法。
   - **空间关系**: 基于射线投影法的多边形内点判断。
   - **地球曲面计算**: 采用大圆距离 (Great Circle Distance) 公式，确保距离计算的地理准确性。
   - **跨平台一致性**: 核心逻辑在 `GeometryEngine.cpp` 中实现，通过 JNI (Android) 和 Objective-C++ (iOS) 桥接到 JS 层，确保两端行为完全一致。


