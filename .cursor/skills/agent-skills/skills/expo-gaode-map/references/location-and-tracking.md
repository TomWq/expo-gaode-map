---
title: Location and Tracking
impact: HIGH
tags: location, tracking, permissions, geolocation
---

# Skill: Location and Tracking

管理用户定位显示、位置追踪以及权限处理。

## 快速参考

### 开启定位
```tsx
<MapView 
  myLocationEnabled={true}
  followUserLocation={true}
  onLocation={(event) => {
    console.log('Current Location:', event.nativeEvent);
  }}
/>
```

### 定位蓝点自定义 (userLocationRepresentation)
```tsx
<MapView
  userLocationRepresentation={{
    showsAccuracyRing: true,
    fillColor: 'rgba(0, 0, 255, 0.1)',
    strokeColor: 'blue',
    lineWidth: 2,
    image: 'custom_location_icon', // 资源名或远程 URL
    imageWidth: 40,
    imageHeight: 40,
    enablePulseAnimation: true, // @platform ios
  }}
/>
```

### 权限处理最佳实践
在请求权限前显示说明文案：
```ts
import { PermissionUtils, LocationPermissionType, ExpoGaodeMapModule } from 'expo-gaode-map';

// 1. 获取适配当前系统的权限说明
const rationale = PermissionUtils.getPermissionRationale(LocationPermissionType.FOREGROUND);

// 2. 显示自定义弹窗告诉用户为什么需要权限...

// 3. 执行实际请求
const result = await ExpoGaodeMapModule.requestLocationPermission();
```

### 权限 Hook (useLocationPermissions)
使用 Expo 标准的权限 Hook 管理状态：
```tsx
import { useLocationPermissions } from 'expo-gaode-map';

const LocationScreen = () => {
  const [status, requestPermission] = useLocationPermissions();

  if (!status?.granted) {
    return <Button title="授权定位" onPress={requestPermission} />;
  }

  return <MapView myLocationEnabled={true} />;
};
```

## 快速模式

### ✅ 正确：区分前后台权限
- **前台**: 基础地图定位。
- **后台**: 轨迹记录、导航。Android 8.0+ 需配置 `foregroundService`。

### ✅ 正确：动态处理权限文案
使用 `PermissionUtils` 自动处理 Android 14+ 和 iOS 17+ 的文案差异。

### ❌ 错误：不配置权限说明直接请求
在新版 Android/iOS 系统上，这可能导致权限请求被系统直接静默拒绝或降低通过率。

## 何时使用

- 需要在地图上实时显示用户位置。
- 实现“我的位置”按钮功能。
- 运动追踪、外勤打卡等需要位置持续更新的场景。

## 深度挖掘

### Android 后台定位 (Foreground Service)
如果需要在应用退到后台时持续获取位置，必须在 `app.json` 中配置：
```json
{
  "expo": {
    "plugins": [
      ["expo-gaode-map", {
        "enableBackgroundLocation": true,
        "locationDescription": "正在持续记录您的运动轨迹"
      }]
    ]
  }
}
```

### 常见陷阱
1. **精度圈**: `showsAccuracyRing` 在某些 Android 版本上可能受系统定位服务精度影响而不显示。
2. **频率控制**: `onLocation` 事件触发频率受系统和高德 SDK 内部策略控制，通常为 1-2 秒一次。
3. **坐标偏转**: `onLocation` 返回的是 GCJ-02 坐标，直接用于高德地图显示是准确的。如果发送给后端或其他地图，请注意坐标系转换。
