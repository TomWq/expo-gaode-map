---
title: Device Adaptation
impact: MEDIUM
tags: foldable, tablet, responsive, layout
---

# Skill: Device Adaptation

处理折叠屏、平板电脑及不同屏幕尺寸的地图适配。

## 快速参考

### 折叠屏适配组件 (FoldableMapView)
自动监听折叠状态变化并调整地图缩放级别：
```tsx
import { FoldableMapView, FoldState } from 'expo-gaode-map';

<FoldableMapView
  foldableConfig={{
    autoAdjustZoom: true,      // 折叠/展开时自动调整缩放
    unfoldedZoomDelta: 1.5,    // 展开时增加的缩放级别
    keepCenterOnFold: true,    // 保持中心点不变
    onFoldStateChange: (state, deviceInfo) => {
      console.log('Fold State:', state); // HALF_OPENED, FLIPPED, etc.
    }
  }}
  // 其他 MapViewProps...
/>
```

### 折叠屏适配 Hook (useFoldableMap)
如果你不想使用 `FoldableMapView` 组件，可以在自定义组件中使用 Hook：
```tsx
import { useFoldableMap, MapView } from 'expo-gaode-map';

const MyCustomMap = () => {
  const mapRef = useRef<MapViewRef>(null);
  
  // 自动处理折叠状态导致的缩放变化
  const { foldState, deviceInfo } = useFoldableMap(mapRef, {
    autoAdjustZoom: true,
    debug: true
  });

  return <MapView ref={mapRef} />;
};
```

### 平台与设备检测 (PlatformDetector)
```ts
import { 
  PlatformDetector, 
  isAndroid14Plus, 
  isiOS17Plus, 
  isTablet, 
  isFoldable 
} from 'expo-gaode-map';

// 基础检测函数
if (isFoldable()) { /* ... */ }
if (isTablet()) { /* ... */ }

// 详细设备信息
const deviceInfo = PlatformDetector.getDeviceInfo();
console.log(deviceInfo.screenAspectRatio); // 获取宽高比
```

## 快速模式

### ✅ 正确：使用 FoldableMapView 替代基础 MapView
在需要支持折叠屏的应用中，优先使用 `FoldableMapView`。它包装了基础 `MapView` 并增加了状态监听逻辑。

### ✅ 正确：响应式边距控制
针对不同设备设置不同的地图 UI 边距：
```tsx
const padding = PlatformDetector.isTablet() ? 40 : 20;
<MapView logoPosition={{ bottom: padding, left: padding }} />
```

### ❌ 错误：硬编码屏幕尺寸
不要假设 Android 设备只有手机形态。折叠屏在展开状态下的宽高比接近平板，折叠后接近普通手机。

## 何时使用

- 应用目标用户包含使用三星 Z Fold、华为 Mate X 等折叠屏设备的人群。
- 需要在 iPad 或 Android 平板上提供优化的地图展示效果。
- 需要根据系统版本（如 Android 14+）动态调整功能。

## 深度挖掘

### 折叠状态 (FoldState)
- `CLOSED`: 完全折叠。
- `HALF_OPENED`: 半开状态（如笔记本模式）。
- `FULL`: 完全展开。

### 自动缩放逻辑
`FoldableMapView` 在设备展开时通常会增加缩放级别（Zoom Level），以填满更大的显示区域并保持视觉重点。折叠时则相应减小，确保视野范围（FOV）的一致性。

### 常见陷阱
1. **尺寸变化延迟**: 在某些设备上，从折叠到展开的尺寸变化事件可能有几十毫秒的延迟，`FoldableMapView` 内部已做了去抖处理。
2. **iOS 适配**: `isFoldable` 目前在 iOS 上始终返回 `false`（直到苹果发布折叠屏设备）。
3. **性能**: 频繁的尺寸变化监听对性能影响极小，因为 `PlatformDetector` 使用的是原生端的高效回调。
