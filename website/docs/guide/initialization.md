# 初始化指南

本文档详细说明如何正确初始化和配置 expo-gaode-map。

## 基本初始化流程

::: warning 重要：隐私合规
根据中国大陆法律法规要求，**必须在用户首次同意隐私协议后** 。现在原生端会自动处理，无需额外处理。
:::

### 1. 隐私合规（首次使用时）

### 无需任何额外处理，原始端已经自动处理

### 2. SDK 初始化

在应用启动时初始化 SDK：

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

useEffect(() => {
  // 如果需要开启世界地图（海外地图）
  // 必须在 initSDK 之前调用
  // 世界地图为高级服务，需要开通相关权限：
  // 1.注册成为高德开放平台开发者，并申请 注册 key
  // 2.通过 工单 联系商务开通
  ExpoGaodeMapModule.setLoadWorldVectorMap(true);

  // 初始化 SDK
  ExpoGaodeMapModule.initSDK({
    webKey: 'your-web-api-key', // 使用 Web API 服务时需要
  });
}, []);
``````

::: tip Config Plugin 自动配置
如果使用了 Config Plugin，原生 API Key 会自动配置到原生项目中，**initSDK 可以不调用或只传 webKey**（更安全）。

```tsx
// 使用 Config Plugin 时
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // 仅在使用 Web API 时需要
});

```
:::

**不使用 Config Plugin 时**，需要手动传入原生 Key：

```tsx
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
  webKey: 'your-web-api-key', // 可选
});
```

### 3. 权限检查和请求

在使用定位功能前,必须先检查和请求权限:

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

  useEffect(() => {
  
    const initializeApp = async () => {
      // 2. 初始化 SDK（使用 Config Plugin 时可传空对象）
      ExpoGaodeMapModule.initSDK({
        webKey: 'your-web-api-key', // 仅在使用 Web API 时需要
      });
      
      // 3. 检查权限
        const status = await ExpoGaodeMapModule.checkLocationPermission();
        
      // 4. 如果没有权限,请求权限
        if (!status.granted) {
          const result = await ExpoGaodeMapModule.requestLocationPermission();
          
          if (!result.granted) {
            // 使用默认位置
            setInitialPosition({
              target: { latitude: 39.9, longitude: 116.4 },
              zoom: 10
            });
            
            Alert.alert(
              '需要定位权限',
              '请在设置中开启定位权限',
              [
                { text: '取消' },
                { text: '去设置', onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }}
              ]
            );
            return;
          }
        }
        
      // 5. 获取当前位置
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

### Q: 使用 Config Plugin 后还需要配置 API Key 吗？

A: 原生 API Key 不需要，Config Plugin 会自动配置。但如果要使用 Web API 服务（`expo-gaode-map-web-api`），仍需在 `initSDK` 中传入 `webKey`。

### Q: 如何处理用户拒绝权限的情况?

A: 提供默认位置并引导用户到设置开启权限。

### Q: 可以在地图加载后更新位置吗?

A: 可以,使用 `moveCamera` 方法更新地图中心。

### Q: 如何配置定位参数?

A: 使用配置方法,必须在 `initSDK` 之后调用。