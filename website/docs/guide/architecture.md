# 项目架构文档

本文档详细说明了 expo-gaode-map 项目的代码结构和各个文件的职责。

## 目录结构概览

```
expo-gaode-map/
├── src/                    # TypeScript 源代码
├── ios/                    # iOS 原生代码
├── android/                # Android 原生代码
├── docs/                   # 文档
└── example/                # 示例应用
```

## TypeScript 代码结构

```
src/
├── index.ts                          # 主导出文件
├── ExpoGaodeMapModule.ts             # 原生模块导入
├── ExpoGaodeMapView.tsx              # 地图视图组件
├── ExpoGaodeMap.types.ts             # 类型定义导出
├── components/                       # React 组件
│   └── overlays/                     # 覆盖物组件
│       ├── Circle.tsx                # 圆形组件
│       ├── Marker.tsx                # 标记点组件
│       ├── Polyline.tsx              # 折线组件
│       └── Polygon.tsx               # 多边形组件
└── types/                            # TypeScript 类型定义
    ├── common.types.ts               # 通用类型
    ├── map-view.types.ts             # 地图视图类型
    ├── location.types.ts             # 定位类型
    └── overlays.types.ts             # 覆盖物类型
```

## iOS 代码结构

```
ios/
├── ExpoGaodeMapModule.swift          # Expo 模块定义
├── ExpoGaodeMapView.swift            # 地图视图组件
├── managers/                         # 管理器类
│   ├── CameraManager.swift           # 相机控制管理器
│   └── UIManager.swift               # UI 和手势管理器
├── modules/                          # 功能模块
│   └── LocationManager.swift         # 定位管理器
└── overlays/                         # 覆盖物视图
    ├── CircleView.swift              # 圆形覆盖物
    ├── MarkerView.swift              # 标记点
    ├── PolylineView.swift            # 折线
    └── PolygonView.swift             # 多边形
```

## Android 代码结构

```
android/
└── src/main/java/expo/modules/gaodemap/
    ├── ExpoGaodeMapModule.kt         # Expo 模块定义
    ├── ExpoGaodeMapView.kt           # 地图视图组件
    ├── managers/                     # 管理器类
    │   ├── CameraManager.kt          # 相机控制管理器
    │   └── UIManager.kt              # UI 和手势管理器
    ├── modules/                      # 功能模块
    │   ├── SDKInitializer.kt         # SDK 初始化
    │   └── LocationManager.kt        # 定位管理器
    └── overlays/                     # 覆盖物视图
        ├── CircleView.kt             # 圆形覆盖物
        ├── MarkerView.kt             # 标记点
        ├── PolylineView.kt           # 折线
        └── PolygonView.kt            # 多边形
```

## 架构设计原则

### 1. 职责分离

- **Module**: 负责模块定义和方法注册
- **View**: 负责视图创建和属性管理
- **Manager**: 负责具体功能实现
- **Overlay**: 负责覆盖物渲染

### 2. 跨平台一致性

- iOS 和 Android 提供相同的 API
- TypeScript 层统一封装
- 差异在原生层处理

### 3. 内存管理

- 使用弱引用避免循环引用
- 及时清理监听器和资源
- 主线程操作使用 Handler/DispatchQueue

### 4. 错误处理

- Promise 处理异步操作
- 统一的错误码和消息
- 详细的错误日志

## 开发指南

### 添加新功能

1. 在原生层实现功能(iOS 和 Android)
2. 在 Module 中注册方法
3. 在 TypeScript 层封装 API
4. 添加类型定义
5. 更新文档

### 调试技巧

- 使用日志查看调用流程
- 检查主线程操作
- 验证内存泄露
- 测试边界情况

## 相关文档

- [快速开始](/guide/getting-started) - 快速开始和基本使用
- [API 文档](/api/) - 完整 API 文档
- [使用示例](/examples/) - 示例代码