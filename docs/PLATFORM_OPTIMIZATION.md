# 平台优化指南

本文档介绍 `expo-gaode-map` 针对不同平台和设备的优化功能。

## 目录

- [Android 14+ 权限适配](#android-14-权限适配)
- [折叠屏设备适配](#折叠屏设备适配)
- [iOS 17+ 新特性支持](#ios-17-新特性支持)
- [iPad 多任务优化](#ipad-多任务优化)

---

## Android 14+ 权限适配

Android 14 (API Level 34) 引入了新的位置权限模型，需要更精细的权限管理。

### 主要变化

1. **更严格的权限提示**：系统会要求应用提供更明确的权限说明
2. **前台/后台权限分离**：需要分两步请求前台和后台位置权限
3. **"仅本次"选项**：用户可以选择仅授予一次性权限
4. **永久拒绝检测**：需要检测用户是否永久拒绝权限

### 使用方法

#### 1. 实际权限请求（使用原有 API）

```typescript
import ExpoGaodeMapModule from 'expo-gaode-map';

// 检查权限状态
const status = await ExpoGaodeMapModule.checkLocationPermission();
console.log('权限已授予:', status.granted);

// 请求位置权限
const result = await ExpoGaodeMapModule.requestLocationPermission();
if (result.granted) {
  console.log('权限授予成功');
} else {
  console.log('权限被拒绝');
}
```

#### 2. 检查系统版本

```typescript
import { PlatformDetector } from 'expo-gaode-map';

// 检查是否为 Android 14+
const isAndroid14 = PlatformDetector.needsAndroid14Permissions();
console.log('Android 14+:', isAndroid14);

// 获取完整系统信息
const systemInfo = PlatformDetector.getSystemVersion();
console.log('系统信息:', systemInfo);
```

#### 3. 获取权限说明文案（请求前向用户展示）

```typescript
import { PermissionUtils, LocationPermissionType } from 'expo-gaode-map';

// 获取前台位置权限说明
const foregroundRationale = PermissionUtils.getPermissionRationale(
  LocationPermissionType.FOREGROUND
);

// 获取后台位置权限说明
const backgroundRationale = PermissionUtils.getPermissionRationale(
  LocationPermissionType.BACKGROUND
);

console.log('权限说明:', foregroundRationale);
```

#### 4. 权限请求最佳实践（整合说明文案 + 实际请求）

```typescript
import { Alert } from 'react-native';
import ExpoGaodeMapModule from 'expo-gaode-map';
import { PermissionUtils, LocationPermissionType } from 'expo-gaode-map';

async function requestLocationPermission() {
  // 1. 先显示权限说明（使用工具类获取适配当前系统的文案）
  const rationale = PermissionUtils.getPermissionRationale(
    LocationPermissionType.FOREGROUND
  );
  
  Alert.alert('需要位置权限', rationale, [
    { text: '取消', style: 'cancel' },
    {
      text: '授权',
      onPress: async () => {
        // 2. 实际请求权限（使用原有 API）
        const result = await ExpoGaodeMapModule.requestLocationPermission();
        if (result.granted) {
          console.log('权限授予成功');
        } else {
          console.log('权限被拒绝');
        }
      }
    }
  ]);
}

async function requestBackgroundPermission() {
  // 后台权限必须在前台权限授予后请求
  const rationale = PermissionUtils.getPermissionRationale(
    LocationPermissionType.BACKGROUND
  );
  
  Alert.alert('需要后台位置权限', rationale, [
    { text: '取消', style: 'cancel' },
    {
      text: '授权',
      onPress: async () => {
        // 实际请求（需要先确保前台权限已授予）
        const status = await ExpoGaodeMapModule.checkLocationPermission();
        if (status.granted) {
          // 这里可以请求后台权限（如使用 expo-location）
          console.log('前台权限已授予，可以请求后台权限');
        }
      }
    }
  ]);
}
```

#### 5. 打印诊断信息

```typescript
import { PermissionUtils } from 'expo-gaode-map';

// 打印权限管理诊断信息
PermissionUtils.printDiagnostics();

// 输出示例：
// === 权限管理诊断信息 ===
// 平台: android
// 系统版本: 34
// Android 14+: 是
// iOS 17+: 否
// 支持后台位置: 是
// 
// 💡 最佳实践建议:
// Android 14+ 特别注意:
//   1. 先解释为什么需要权限，再发起请求
//   2. 前台和后台权限分两步请求
//   ...
```

### 原生层支持

原生端提供了 `PermissionHelper` 工具类（仅供高级使用）：

```kotlin
// Android (Kotlin)
import expo.modules.gaodemap.utils.PermissionHelper

// 检查是否为 Android 14+
val isAndroid14 = PermissionHelper.isAndroid14Plus()

// 检查前台位置权限状态
val status = PermissionHelper.checkForegroundLocationPermission(context)
println("权限已授予: ${status.granted}")
println("永久拒绝: ${status.isPermanentlyDenied}")

// 获取权限说明文案
val rationale = PermissionHelper.getPermissionRationale(
    PermissionHelper.LocationPermissionType.FOREGROUND,
    isAndroid14
)
```

---

## 折叠屏设备适配

自动适配 Android 折叠屏设备（如 Samsung Galaxy Z Fold、Huawei Mate X 等）的展开/折叠状态变化。

### 设备检测

```typescript
import { PlatformDetector, DeviceType, FoldState } from 'expo-gaode-map';

// 获取设备信息
const deviceInfo = PlatformDetector.getDeviceInfo();
console.log('设备类型:', deviceInfo.type); // 'phone' | 'tablet' | 'foldable'
console.log('是否为折叠屏:', deviceInfo.isFoldable);

// 获取当前折叠状态
const foldState = PlatformDetector.getFoldState();
console.log('折叠状态:', foldState); // 'folded' | 'unfolded' | 'half_folded'

// 监听折叠状态变化
const removeListener = PlatformDetector.addDimensionChangeListener((newInfo) => {
  console.log('屏幕尺寸变化:', newInfo);
  console.log('新折叠状态:', PlatformDetector.getFoldState());
});

// 清理监听器
// removeListener();
```

### 使用折叠屏地图组件

#### 方法 1：使用 `FoldableMapView` 组件

```typescript
import React from 'react';
import { FoldableMapView, FoldState, DeviceInfo } from 'expo-gaode-map';

export default function App() {
  return (
    <FoldableMapView
      style={{ flex: 1 }}
      initialCameraPosition={{
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 12,
      }}
      foldableConfig={{
        // 折叠时自动调整缩放级别
        autoAdjustZoom: true,
        // 展开时增加的缩放级别
        unfoldedZoomDelta: 1,
        // 折叠/展开时保持地图中心点
        keepCenterOnFold: true,
        // 折叠状态变化回调
        onFoldStateChange: (state: FoldState, info: DeviceInfo) => {
          console.log('折叠状态变化:', state);
          console.log('设备信息:', info);
        },
        // 启用调试日志
        debug: __DEV__,
      }}
    />
  );
}
```

#### 方法 2：使用 `useFoldableMap` Hook

```typescript
import React, { useRef } from 'react';
import ExpoGaodeMapView, { useFoldableMap } from 'expo-gaode-map';

export default function App() {
  const mapRef = useRef(null);
  
  // 使用折叠屏适配 Hook
  const { foldState, deviceInfo, isFoldable } = useFoldableMap(mapRef, {
    autoAdjustZoom: true,
    unfoldedZoomDelta: 1,
    keepCenterOnFold: true,
    onFoldStateChange: (state, info) => {
      console.log('折叠状态:', state);
    },
  });

  return (
    <View style={{ flex: 1 }}>
      <ExpoGaodeMapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 12,
        }}
      />
      
      {isFoldable && (
        <Text style={{ position: 'absolute', top: 50, left: 10 }}>
          折叠状态: {foldState}
        </Text>
      )}
    </View>
  );
}
```

### 折叠屏适配原理

1. **屏幕尺寸检测**：通过宽高比和已知分辨率识别折叠屏设备
2. **状态判断**：
   - 折叠（`folded`）：宽高比 > 2.0
   - 展开（`unfolded`）：宽高比 < 1.5
   - 半折叠（`half_folded`）：介于两者之间
3. **自动调整**：
   - 展开时增加缩放级别（屏幕更大，显示更多内容）
   - 折叠时减少缩放级别（屏幕更小，保持可视性）
   - 可选：保持地图中心点不变

---

## iOS 17+ 新特性支持

iOS 17 引入了新的隐私保护机制和位置权限提示。

### 主要变化

1. **Privacy Manifest**：需要在 `PrivacyInfo.xcprivacy` 中声明位置访问原因
2. **更详细的权限提示**：系统会显示更清晰的权限选项说明
3. **精确位置控制**：用户可以选择"精确"或"模糊"位置

### 使用方法

#### 1. 检查 iOS 版本

```typescript
import { PlatformDetector } from 'expo-gaode-map';

// 检查是否为 iOS 17+
const isiOS17 = PlatformDetector.supportsiOS17Features();
console.log('iOS 17+:', isiOS17);
```

#### 2. 配置 Info.plist

确保在 `Info.plist` 中配置了必要的权限说明：

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>为了在地图上显示您的位置，应用需要访问您的位置信息。</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>为了提供后台导航和路径规划功能，应用需要始终访问位置权限。</string>

<!-- iOS 14+ 精确位置说明 -->
<key>NSLocationTemporaryUsageDescriptionDictionary</key>
<dict>
  <key>navigation</key>
  <string>为了提供准确的导航服务</string>
  <key>tracking</key>
  <string>为了记录精确的运动轨迹</string>
</dict>
```

#### 3. 配置 Privacy Manifest (iOS 17+)

在项目中添加 `PrivacyInfo.xcprivacy` 文件：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryLocation</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <!-- 地图显示和导航 -->
                <string>DDA9.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

#### 4. 获取精确位置权限说明

```typescript
import { PermissionManager } from 'expo-gaode-map';

const accuracyRationale = PermissionManager.getAccuracyRationale();
console.log('精确位置说明:', accuracyRationale);

// iOS 17+ 输出示例：
// 为了提供准确的导航和定位服务，应用需要访问精确位置。
// 
// 选择"模糊位置"可能会导致：
// • 地图定位不准确
// • 导航路线偏差
// • 搜索结果不精确
```

#### 5. 验证配置

```typescript
import { PermissionManager } from 'expo-gaode-map';

// 验证 iOS 配置
const validation = PermissionManager.validateiOSConfiguration();
console.log('配置有效:', validation.valid);
console.log('建议:', validation.recommendations);
```

---

## iPad 多任务优化

iPad 支持多任务模式（Split View、Slide Over），需要特别优化地图布局。

### 检测 iPad 和多任务

```typescript
import { PlatformDetector } from 'expo-gaode-map';

// 检查是否为 iPad
const isIPad = PlatformDetector.isIPad();
console.log('是否为 iPad:', isIPad);

// 检查是否支持多任务
const supportsMultitasking = PlatformDetector.supportsMultitasking();
console.log('支持多任务:', supportsMultitasking);
```

### 多任务适配建议

```typescript
import React, { useEffect, useState } from 'react';
import { View, Dimensions } from 'react-native';
import ExpoGaodeMapView, { PlatformDetector } from 'expo-gaode-map';

export default function App() {
  const [layout, setLayout] = useState(Dimensions.get('window'));

  useEffect(() => {
    if (!PlatformDetector.supportsMultitasking()) {
      return;
    }

    // 监听窗口大小变化（多任务模式）
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      console.log('窗口大小变化:', window);
      setLayout(window);
    });

    return () => subscription.remove();
  }, []);

  // 根据窗口大小调整控件位置
  const isCompact = layout.width < 768; // iPad 分屏后的紧凑模式

  return (
    <View style={{ flex: 1 }}>
      <ExpoGaodeMapView
        style={{ flex: 1 }}
        initialCameraPosition={{
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 12,
        }}
      />
      
      {/* 根据布局调整控件 */}
      <View style={{
        position: 'absolute',
        top: 50,
        right: isCompact ? 10 : 20,
        flexDirection: isCompact ? 'column' : 'row',
      }}>
        {/* 控件内容 */}
      </View>
    </View>
  );
}
```

---

## 完整示例

