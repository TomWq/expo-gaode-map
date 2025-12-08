b
# 基础导航功能实现指南

## 概述

本文档介绍了 expo-gaode-map-navigation 模块的基础导航功能实现，包括路径规划和导航界面两个核心功能。

## 功能模块

### 1. 路径规划模块

路径规划模块提供了多种交通方式的路线计算功能：

#### 驾车路径规划
```typescript
import * as ExpoGaodeMapNavigation from 'expo-gaode-map-navigation';
import { RouteType, DriveStrategy } from 'expo-gaode-map-navigation';

const result = await ExpoGaodeMapNavigation.calculateDriveRoute({
  from: {
    latitude: 39.9042,
    longitude: 116.4074,
  },
  to: {
    latitude: 39.908823,
    longitude: 116.397470,
  },
  type: RouteType.DRIVE,
  strategy: DriveStrategy.SHORTEST, // 最短路径
});
```

#### 支持的交通方式
