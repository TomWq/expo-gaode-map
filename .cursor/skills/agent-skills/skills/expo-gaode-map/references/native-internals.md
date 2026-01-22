---
title: Native Internals
impact: HIGH
tags: cpp-engine, jni, native-bridge, performance-optimization, memory-management
---

# Skill: Native Internals & Architecture

深入理解 `expo-gaode-map` 的跨平台架构、高性能 C++ 引擎以及双端桥接机制。

## 架构总览

本库采用 **"Single Source of Truth"** 架构。核心计算逻辑（聚合、几何运算、空间索引）完全由 C++11 编写，通过底层桥接技术提供给 Android 和 iOS 使用，确保了两端算法的完全一致性和极致性能。

### 1. 核心链路
- **JS 层**: 提供声明式 API。
- **桥接层 (TurboModules/Expo Modules)**: 处理类型映射和异常捕获。
- **原生层 (Kotlin/Swift)**: 负责 SDK 集成、UI 渲染及数据预处理。
- **引擎层 (C++)**: 负责大规模并行计算和复杂几何运算。

## 性能军规 (Performance Guidelines)

### 1. 跨平台通信损耗
- **iOS (Zero-Cost Bridge)**: 使用 Objective-C++。Swift 数据可以直接通过指针或基础容器传递给 C++，几乎无损耗。
- **Android (JNI Cost)**: 必须通过 JNI。**JNI 调用有固定开销 (Context Switch)**。

### 2. 安卓开发禁令 (Android CRITICAL)
- **❌ 严禁在循环中调用 JNI**: 宁可先在 Java 侧收集数据，最后一次性传递给 C++。
- **❌ 严禁在原生层循环中分配大量对象**: 例如在处理 1000 个点时，严禁创建 1000 个 `LatLng` 对象。
- **✅ 必须使用原始数组 (Primitive Arrays)**: 优先使用 `DoubleArray` 或 `FloatArray` 进行批量数据搬运。

### 3. iOS 优化建议
- **✅ 使用 NS_SWIFT_NAME**: 确保 Objective-C 定义的 C++ 接口在 Swift 中拥有自然的调用标签。

## 深度挖掘：C++ 引擎 (shared/cpp)

### 1. 聚合引擎 (Clustering Engine)
- **原理**: 动态四叉树 (Dynamic QuadTree) 空间索引。
- **性能**: 处理 50,000+ 点位时，聚合计算耗时控制在 10ms 以内。
- **策略**: 采用分级缓存机制，同一缩放级别下的重复移动不会触发全量重算。

### 2. 几何引擎 (Geometry Engine)
- **轨迹处理**: 采用 Ramer-Douglas-Peucker (RDP) 抽稀算法，在保持形状的前提下减少 80% 以上的点位。
- **网格聚合 (Grid Aggregation)**: 
  - 不同于平滑热力图，网格聚合通过经纬度投影到固定大小的平面网格（Grid Cell）实现。
  - **性能关键**: 采用 `std::unordered_map` 进行空间哈希，确保 $O(n)$ 复杂度。

### 3. 地球曲面计算
- 统一采用 **Haversine 公式** 计算大圆距离，避免因简单的欧几里得距离计算导致的地理位置偏差。

## 错误处理与调试

### 1. 异常链路
- C++ 异常通过标准 `std::exception` 抛出。
- 桥接层捕获 C++ 异常并转换为 JS 侧的 `GaodeMapError`。

### 2. 调试技巧
- **Android**: 使用 `adb logcat | grep ExpoGaodeMap` 查看 JNI 层的性能日志。
- **iOS**: 在 Xcode 中开启 `Address Sanitizer` 监控 C++ 内存泄漏。

## 何时触碰底层
- 当需要添加新的几何算法（如计算多边形交集）时。
- 当现有桥接层出现性能瓶颈（如大数据量传输卡顿）时。
- 当需要对接高德 SDK 的原生底层回调时。
