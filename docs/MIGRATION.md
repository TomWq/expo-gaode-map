# 迁移指南 - v2.0 API 变更

## 概述

从 v2.0 开始，我们移除了多余的封装层，统一使用 `ExpoGaodeMapModule` 调用所有定位和权限相关的方法。这样做的好处是：

- ✅ 命名一致性：所有导出都是大写开头（MapView, ExpoGaodeMapModule, Marker, Circle 等）
- ✅ 更清晰的 API：直接从原生模块调用，减少中间层
- ✅ 更好的类型推导：完整的 TypeScript 类型定义，零 any 类型
- ✅ 更易维护：减少代码重复，统一调用方式

## 主要变更

### 导入方式变更

#### ❌ 旧的方式（v1.x）

```typescript
import {
  MapView,
  Marker,
  Circle,
  // 小写函数
  initSDK,
  start,
  stop,
  getCurrentLocation,
  checkLocationPermission,
  requestLocationPermission,
  configure,
  addLocationListener,
} from 'expo-gaode-map';

// 使用
initSDK({ androidKey: 'xxx', iosKey: 'xxx' });
const location = await getCurrentLocation();
start();
```

#### ✅ 新的方式（v2.0）

```typescript
import {
  MapView,
  Marker,
  Circle,
  // 统一使用 ExpoGaodeMapModule
  ExpoGaodeMapModule,
} from 'expo-gaode-map';

// 使用
ExpoGaodeMapModule.initSDK({ androidKey: 'xxx', iosKey: 'xxx' });
const location = await ExpoGaodeMapModule.getCurrentLocation();
ExpoGaodeMapModule.start();
```

## 详细迁移步骤

### 1. SDK 初始化

**旧方式：**
```typescript
import { initSDK } from 'expo-gaode-map';

initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
});
```

**新方式：**
```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
});
```

### 2. 定位控制

**旧方式：**
```typescript
import { start, stop, getCurrentLocation, isStarted } from 'expo-gaode-map';

start();
stop();
const location = await getCurrentLocation();
const started = await isStarted();
```

**新方式：**
```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

ExpoGaodeMapModule.start();
ExpoGaodeMapModule.stop();
const location = await ExpoGaodeMapModule.getCurrentLocation();
const started = await ExpoGaodeMapModule.isStarted();
```

### 3. 权限管理

**旧方式：**
```typescript
import { checkLocationPermission, requestLocationPermission } from 'expo-gaode-map';

const status = await checkLocationPermission();
const result = await requestLocationPermission();
```

**新方式：**
```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const status = await ExpoGaodeMapModule.checkLocationPermission();
const result = await ExpoGaodeMapModule.requestLocationPermission();
```

### 4. 定位配置

**旧方式：**
```typescript
import { configure } from 'expo-gaode-map';

configure({
  withReGeocode: true,
  interval: 2000,
  accuracy: 3,
});
```

**新方式：**
```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 直接调用配置方法
ExpoGaodeMapModule.setLocatingWithReGeocode(true);
ExpoGaodeMapModule.setInterval(2000);
ExpoGaodeMapModule.setDesiredAccuracy(3);
```

### 5. 位置监听

**旧方式：**
```typescript
import { addLocationListener } from 'expo-gaode-map';

const subscription = addLocationListener((location) => {
  console.log('位置更新:', location);
});

// 清理
subscription.remove();
```

**新方式：**
```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const subscription = ExpoGaodeMapModule.addLocationListener('onLocationUpdate', (location) => {
  console.log('位置更新:', location);
});

// 清理
subscription.remove();
```

### 6. 坐标转换

**旧方式：**
```typescript
import { coordinateConvert, CoordinateType } from 'expo-gaode-map';

const gcj02 = await coordinateConvert(
  { latitude: 39.9, longitude: 116.4 },
  CoordinateType.WGS84
);
```

**新方式：**
```typescript
import { ExpoGaodeMapModule, CoordinateType } from 'expo-gaode-map';

const gcj02 = await ExpoGaodeMapModule.coordinateConvert(
  { latitude: 39.9, longitude: 116.4 },
  CoordinateType.WGS84
);
```

### 7. 方向更新（iOS）

**旧方式：**
```typescript
import { startUpdatingHeading, stopUpdatingHeading } from 'expo-gaode-map';

startUpdatingHeading();
stopUpdatingHeading();
```

**新方式：**
```typescript
import { ExpoGaodeMapModule } from 'expo-gaode-map';

ExpoGaodeMapModule.startUpdatingHeading();
ExpoGaodeMapModule.stopUpdatingHeading();
```

## 完整迁移示例

### 旧代码（v1.x）

```typescript
import { useEffect, useState } from 'react';
import {
  MapView,
  initSDK,
  checkLocationPermission,
  requestLocationPermission,
  configure,
  getCurrentLocation,
  start,
  stop,
  addLocationListener,
} from 'expo-gaode-map';

export default function App() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const init = async () => {
      // 初始化
      initSDK({
        androidKey: 'xxx',
        iosKey: 'xxx',
      });
      
      // 权限
      const status = await checkLocationPermission();
      if (!status.granted) {
        await requestLocationPermission();
      }
      
      // 配置
      configure({
        withReGeocode: true,
        interval: 2000,
      });
      
      // 监听
      const sub = addLocationListener((loc) => {
        setLocation(loc);
      });
      
      // 获取位置
      const loc = await getCurrentLocation();
      setLocation(loc);
      
      // 开始定位
      start();
      
      return () => {
        sub.remove();
        stop();
      };
    };
    
    init();
  }, []);

  return <MapView style={{ flex: 1 }} myLocationEnabled />;
}
```

### 新代码（v2.0）

```typescript
import { useEffect, useState } from 'react';
import {
  MapView,
  ExpoGaodeMapModule,
} from 'expo-gaode-map';

export default function App() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const init = async () => {
      // 初始化
      ExpoGaodeMapModule.initSDK({
        androidKey: 'xxx',
        iosKey: 'xxx',
      });
      
      // 权限
      const status = await ExpoGaodeMapModule.checkLocationPermission();
      if (!status.granted) {
        await ExpoGaodeMapModule.requestLocationPermission();
      }
      
      // 配置
      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setInterval(2000);
      
      // 监听
      const sub = ExpoGaodeMapModule.addLocationListener('onLocationUpdate', (loc) => {
        setLocation(loc);
      });
      
      // 获取位置
      const loc = await ExpoGaodeMapModule.getCurrentLocati on();
      setLocation(loc);
      
      // 开始定位
      ExpoGaodeMapModule.start();
      
      return () => {
        sub.remove();
        ExpoGaodeMapModule.stop();
      };
    };
    
    init();
  }, []);

  return <MapView style={{ flex: 1 }} myLocationEnabled />;
}
```

## API 对照表

| 旧 API (v1.x) | 新 API (v2.0) | 说明 |
|--------------|---------------|------|
| `initSDK()` | `ExpoGaodeMapModule.initSDK()` | SDK 初始化 |
| `start()` | `ExpoGaodeMapModule.start()` | 开始定位 |
| `stop()` | `ExpoGaodeMapModule.stop()` | 停止定位 |
| `isStarted()` | `ExpoGaodeMapModule.isStarted()` | 检查定位状态 |
| `getCurrentLocation()` | `ExpoGaodeMapModule.getCurrentLocation()` | 获取当前位置 |
| `checkLocationPermission()` | `ExpoGaodeMapModule.checkLocationPermission()` | 检查权限 |
| `requestLocationPermission()` | `ExpoGaodeMapModule.requestLocationPermission()` | 请求权限 |
| `configure(options)` | 使用单独的配置方法 | 见下方详细说明 |
| `addLocationListener()` | `ExpoGaodeMapModule.addLocationListener('onLocationUpdate', ...)` | 位置监听 |
| `coordinateConvert()` | `ExpoGaodeMapModule.coordinateConvert()` | 坐标转换 |
| `startUpdatingHeading()` | `ExpoGaodeMapModule.startUpdatingHeading()` | 开始方向更新 |
| `stopUpdatingHeading()` | `ExpoGaodeMapModule.stopUpdatingHeading()` | 停止方向更新 |

## 配置方法对照

`configure()` 函数被替换为直接调用配置方法：

| configure 选项 | 新方法 |
|---------------|--------|
| `withReGeocode` | `ExpoGaodeMapModule.setLocatingWithReGeocode(boolean)` |
| `mode` | `ExpoGaodeMapModule.setLocationMode(number)` |
| `interval` | `ExpoGaodeMapModule.setInterval(number)` |
| `onceLocation` | `ExpoGaodeMapModule.setOnceLocation(boolean)` |
| `sensorEnable` | `ExpoGaodeMapModule.setSensorEnable(boolean)` |
| `wifiScan` | `ExpoGaodeMapModule.setWifiScan(boolean)` |
| `gpsFirst` | `ExpoGaodeMapModule.setGpsFirst(boolean)` |
| `onceLocationLatest` | `ExpoGaodeMapModule.setOnceLocationLatest(boolean)` |
| `geoLanguage` | `ExpoGaodeMapModule.setGeoLanguage(string)` |
| `locationCacheEnable` | `ExpoGaodeMapModule.setLocationCacheEnable(boolean)` |
| `httpTimeout` | `ExpoGaodeMapModule.setHttpTimeOut(number)` |
| `accuracy` | `ExpoGaodeMapModule.setDesiredAccuracy(number)` |
| `timeout` | `ExpoGaodeMapModule.setLocationTimeout(number)` |
| `reGeocodeTimeout` | `ExpoGaodeMapModule.setReGeocodeTimeout(number)` |
| `distanceFilter` | `ExpoGaodeMapModule.setDistanceFilter(number)` |
| `pausesLocationUpdatesAutomatically` | `ExpoGaodeMapModule.setPausesLocationUpdatesAutomatically(boolean)` |
| `allowsBackgroundLocationUpdates` | `ExpoGaodeMapModule.setAllowsBackgroundLocationUpdates(boolean)` |
| `protocol` | `ExpoGaodeMapModule.setLocationProtocol(string)` |

## 类型定义

所有类型定义保持不变，仍然可以从主模块导入：

```typescript
import type {
  LatLng,
  Coordinates,
  ReGeocode,
  CameraPosition,
  MapViewRef,
  PermissionStatus,
  SDKConfig,
  // ... 其他类型
} from 'expo-gaode-map';
```

新增类型可以从 `ExpoGaodeMapModule` 导入：

```typescript
import type { SDKConfig, PermissionStatus } from 'expo-gaode-map';
```

## 常见问题

### Q: 为什么要做这个改变？

**A:** 主要原因：
1. **命名一致性**：统一使用大写开头（MapView, Marker, Circle, ExpoGaodeMapModule）
2. **减少冗余**：移除了只是简单包装原生模块的中间层
3. **更好的类型推导**：直接使用原生模块的类型定义，避免类型丢失
4. **更易维护**：减少代码重复，统一调用方式

### Q: 是否需要立即迁移？

**A:** 如果你正在使用 v1.x，建议在方便时迁移到 v2.0。迁移过程很简单，主要是替换导入和调用方式。

### Q: MapView 和覆盖物组件有变化吗？

**A:** 没有变化！MapView、Marker、Circle、Polyline、Polygon 等组件的使用方式完全相同。

### Q: 类型定义有变化吗？

**A:** 类型定义更加完善，移除了所有 `any` 类型，提供了完整的 TypeScript 类型推导。

## 需要帮助？

如果在迁移过程中遇到问题，欢迎：
- 📝 提交 [GitHub Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 参与 [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- 💬 加入 QQ 群：952241387