# 初始化指南

本文档详细说明如何正确初始化和配置 expo-gaode-map。

## 基本初始化流程

::: warning 重要：隐私合规
根据中国大陆法律法规要求，**必须在用户首次同意隐私协议后**，再调用任何高德 SDK 相关能力。
当前版本不会自动替你展示隐私弹窗，但**用户一旦同意后，原生层会持久化并在后续冷启动时自动恢复隐私状态**。
也就是说：**首次安装时必须手动完成一次；后续启动通常无需重复调用。**
:::

### 1. 隐私合规（首次使用时）

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const privacyStatus = ExpoGaodeMapModule.getPrivacyStatus();

if (!privacyStatus.isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    privacyVersion: '2026-03-13', // 可选：隐私协议版本号
  });
}
```

推荐流程：
1. 首次进入应用先展示你的隐私协议页面
2. 用户点击同意后调用 `setPrivacyConfig(...)`
3. 原生层会持久化同意状态，后续冷启动自动恢复
4. 如果未使用 Config Plugin，或你需要 Web API 服务，再调用 `initSDK(...)`
5. 最后再请求定位权限、渲染地图或调用搜索/定位能力

### 2. SDK 初始化

在隐私确认完成后按需初始化 SDK：

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

useEffect(() => {
  const privacyStatus = ExpoGaodeMapModule.getPrivacyStatus();

  // 1. 首次安装时，在用户同意后同步隐私状态
  if (!privacyStatus.isReady) {
    ExpoGaodeMapModule.setPrivacyConfig({
      hasShow: true,
      hasContainsPrivacy: true,
      hasAgree: true,
      privacyVersion: '2026-03-13',
    });
  }

  // 如果需要开启世界地图（海外地图）
  // 必须在 initSDK 之前调用
  // 世界地图为高级服务，需要开通相关权限：
  // 1.注册成为高德开放平台开发者，并申请 注册 key
  // 2.通过 工单 联系商务开通
  // ExpoGaodeMapModule.setLoadWorldVectorMap(true);

  // 2. 按需调用：
  // - 已通过 Config Plugin 或手动原生配置写入移动端 Key：通常可不调用 initSDK
  // - 使用 Web API：调用 initSDK 并传入 webKey
  ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });
}, []);
```

::: tip 原生 Key 配置后无需在 JS 中重复传入
如果已通过 Config Plugin 或手动方式把 API Key 写入原生项目：

- Android: `AndroidManifest.xml` 中的 `com.amap.api.v2.apikey`
- iOS: `Info.plist` 中的 `AMapApiKey`

则不需要再调用 `initSDK({ androidKey, iosKey })`，**但运行时隐私步骤仍必须手动调用**。
因此：地图/定位场景通常不需要再显式调用 `initSDK`；只有在使用 Web API（或运行时手动设置 `webKey`）时再调用。

```tsx
if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
  });
}

// 仅在使用 Web API 时调用
ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

```
:::

::: warning 未配置原生 Key 时才需要运行时传入
如果既没有使用 Config Plugin，也没有手动在原生项目中配置 API Key，才需要显式调用：

```tsx
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});
```

才能正常使用地图相关能力。
:::

**没有配置原生 Key 时**，才需要运行时传入移动端 Key：

```tsx
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
  webKey: 'your-web-api-key', // 可选
});
```

### 3. 权限检查和请求

在使用定位功能前,必须先检查和请求权限:

#### 方式一：手动检查和请求权限
```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 检查权限状态
const status = await ExpoGaodeMapModule.checkLocationPermission();
console.log('权限状态:', status);
// { granted: boolean, status: string }

// 请求权限
if (!status.granted) {
  const result = await ExpoGaodeMapModule.requestLocationPermission();
  if (result.granted) {
    console.log('权限已授予');
  } else {
    console.log('权限被拒绝');
  }
}
```
#### 方式二: useLocationPermissions Hook (推荐)

```tsx
import { useLocationPermissions } from 'expo-gaode-map';

const [status, requestPermission] = useLocationPermissions();

```


### 4. 获取位置

权限授予后,可以获取当前位置:

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

try {
  const location = await ExpoGaodeMapModule.getCurrentLocation();
  console.log('当前位置:', location);
} catch (error) {
  console.error('获取位置失败:', error);
}
```

## 权限管理

### 权限 API

| API | 说明 | 返回值 |
|-----|------|--------|
| `ExpoGaodeMapModule.checkLocationPermission()` | 检查定位权限状态 | `Promise<PermissionStatus>` |
| `ExpoGaodeMapModule.requestLocationPermission()` | 请求定位权限 | `Promise<PermissionStatus>` |

### 权限状态说明

- **granted: true** - 用户已授予权限,可以使用定位功能
- **granted: false** - 用户未授予权限


## 完整示例

```tsx
import { useEffect, useState } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MapView,
  ExpoGaodeMapModule,
  type LatLng,
} from 'expo-gaode-map';

const PRIVACY_KEY = 'privacy_agreed';

export default function App() {
  const [initialPosition, setInitialPosition] = useState<{
    target: LatLng;
    zoom: number;
  } | null>(null);
  const [status, requestPermission] = useLocationPermissions();

  useEffect(() => {
  
    const initializeApp = async () => {
      // 1. 首次安装时，在用户同意隐私后同步一次
      if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
        ExpoGaodeMapModule.setPrivacyConfig({
          hasShow: true,
          hasContainsPrivacy: true,
          hasAgree: true,
          privacyVersion: '2026-03-13',
        });
      }

      // 2. 仅在使用 Web API 时调用
      // ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

      // 3. 请求定位权限
      await requestPermission();

      // 4. 获取当前位置
      const location = await ExpoGaodeMapModule.getCurrentLocation();
      setInitialPosition({
          target: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          zoom: 15
      });
    };
    initializeApp();
  }, []);

  if (!initialPosition) {
    return <LoadingScreen />;
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={initialPosition}
      myLocationEnabled={true}
    />
  );
}
```

## 常见问题

### Q: 原生项目中配置 API Key 后还需要在代码中配置吗？

A: 原生 API Key 不需要。只要 API Key 已经通过 Config Plugin 或手动方式配置到原生项目中，就不需要再在 JavaScript 中传入 `androidKey` / `iosKey`。但如果要使用 Web API 服务（`expo-gaode-map-web-api`），仍需在 `initSDK` 中传入 `webKey`。

### Q: 使用 Config Plugin 后，还需要调用隐私接口吗？

A: **首次安装时需要。**Config Plugin 只负责原生 key、权限声明等静态配置；运行时隐私同意仍必须由你在用户同意后手动设置一次。设置完成后，原生会自动持久化并在后续冷启动恢复。

### Q: 每次打开 App 都要重复调用隐私接口吗？

A: **通常不需要。**当前版本会在原生层保存用户已经同意的隐私状态。后续启动时会自动恢复；只有新安装、清除 App 数据、卸载重装，或者你主动升级了 `privacyVersion` 时，才需要重新走一次隐私同意流程。

### Q: 如何处理用户拒绝权限的情况?

A: 提供默认位置并引导用户到设置开启权限。

### Q: 可以在地图加载后更新位置吗?

A: 可以,使用 `moveCamera` 方法更新地图中心。

### Q: 如何配置定位参数?

A: 使用配置方法,必须在 `initSDK` 之后调用。
