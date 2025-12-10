# 初始化指南

本文档详细说明如何正确初始化和配置 expo-gaode-map。

## 基本初始化流程

::: warning 重要：隐私合规
根据中国大陆法律法规要求，**必须在用户首次同意隐私协议后**调用 `updatePrivacyCompliance(true)`。原生端会自动持久化该状态，后续启动无需再次调用。
:::

### 1. 隐私合规（首次使用时）

**仅在用户首次同意隐私协议时**调用一次：

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 检查用户是否已同意
const agreed = await AsyncStorage.getItem('privacy_agreed');
if (!agreed) {
  // 显示隐私协议弹窗，用户点击同意后：
  await AsyncStorage.setItem('privacy_agreed', 'true');
  // ✅ 调用一次后，原生端会持久化，后续无需再调用
  ExpoGaodeMapModule.updatePrivacyCompliance(true);
}
```

::: tip 原生持久化
`updatePrivacyCompliance(true)` 调用后，原生端会自动保存该状态。应用重启后无需再次调用，SDK 会自动读取保存的状态。
:::

### 2. SDK 初始化

在应用启动时初始化 SDK：

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

useEffect(() => {
  // 初始化 SDK
  ExpoGaodeMapModule.initSDK({
    webKey: 'your-web-api-key', // 使用 Web API 服务时需要
  });
}, []);
```

::: tip Config Plugin 自动配置
如果使用了 Config Plugin，原生 API Key 会自动配置到原生项目中，**initSDK 可以传空对象或只传 webKey**（更安全）。

```tsx
// 使用 Config Plugin 时
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // 仅在使用 Web API 时需要
});

// 或传空对象（如果不使用 Web API）
ExpoGaodeMapModule.initSDK({});
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

## 隐私合规详解

### updatePrivacyCompliance() 方法

```typescript
ExpoGaodeMapModule.updatePrivacyCompliance(hasAgreed: boolean): void
```

**参数：**
- `hasAgreed`: 用户是否已同意隐私协议（必须为 `true`）

**说明：**
- 这是**强制要求**，必须在用户首次同意隐私协议时调用
- **只需调用一次**，原生端会自动持久化该状态
- 应用重启后无需再次调用，SDK 会自动读取保存的状态
- 建议在用户首次打开应用时，展示隐私协议弹窗
- 用户同意后，调用此方法即可

### 隐私合规流程示例

```tsx
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpoGaodeMapModule } from 'expo-gaode-map';

const PRIVACY_KEY = 'privacy_agreed';

async function handlePrivacyCompliance() {
  // 检查用户是否已同意
  const agreed = await AsyncStorage.getItem(PRIVACY_KEY);
  
  if (!agreed) {
    // 首次启动，显示隐私协议弹窗
    return new Promise((resolve) => {
      Alert.alert(
        '隐私协议',
        '我们需要您同意隐私协议才能使用地图服务',
        [
          {
            text: '拒绝',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: '同意',
            onPress: async () => {
              // 保存同意状态到本地（用于下次判断）
              await AsyncStorage.setItem(PRIVACY_KEY, 'true');
              // ✅ 调用一次，原生端会持久化
              ExpoGaodeMapModule.updatePrivacyCompliance(true);
              resolve(true);
            }
          }
        ]
      );
    });
  }
  
  // 已同意过，无需再次调用 updatePrivacyCompliance
  // 原生端已保存状态，SDK 会自动读取
  return true;
}
```

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
      try {
        // 1. 隐私合规（首次使用时）
        const agreed = await AsyncStorage.getItem(PRIVACY_KEY);
        if (!agreed) {
          // 首次启动，显示隐私协议弹窗
          Alert.alert(
            '隐私协议',
            '我们需要您同意隐私协议才能使用地图服务',
            [
              { text: '拒绝', style: 'cancel' },
              {
                text: '同意',
                onPress: async () => {
                  await AsyncStorage.setItem(PRIVACY_KEY, 'true');
                  // ✅ 调用一次，原生端会持久化
                  ExpoGaodeMapModule.updatePrivacyCompliance(true);
                  await continueInitialization();
                }
              }
            ]
          );
          return;
        }
        
        // 已同意过，直接继续初始化（无需再次调用 updatePrivacyCompliance）
        await continueInitialization();
        
      } catch (error) {
        console.error('初始化失败:', error);
        setInitialPosition({
          target: { latitude: 39.9, longitude: 116.4 },
          zoom: 10
        });
      }
    };
    
    const continueInitialization = async () => {
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

### Q: 为什么必须调用 updatePrivacyCompliance？

A: 根据《中华人民共和国个人信息保护法》等相关法律法规，应用在收集用户位置信息前，必须获得用户明确同意。高德地图 SDK 要求开发者在首次使用前调用此方法，确保合规。

### Q: 每次启动都需要调用 updatePrivacyCompliance 吗？

A: **不需要。**只需要在用户首次同意隐私协议时调用一次，原生端会自动持久化该状态。后续启动时，SDK 会自动读取保存的状态，无需再次调用。

### Q: 忘记首次调用 updatePrivacyCompliance 会怎样？

A: SDK 可能无法正常工作，地图显示或定位功能可能失败。请务必在用户首次同意隐私协议后调用。

### Q: 如何处理用户拒绝隐私协议的情况？

A: 如果用户拒绝，不应调用 `updatePrivacyCompliance(true)`，也不能使用地图功能。应用应提供无地图的替代方案，或引导用户重新考虑。

### Q: 使用 Config Plugin 后还需要配置 API Key 吗？

A: 原生 API Key 不需要，Config Plugin 会自动配置。但如果要使用 Web API 服务（`expo-gaode-map-web-api`），仍需在 `initSDK` 中传入 `webKey`。

### Q: 如何处理用户拒绝权限的情况?

A: 提供默认位置并引导用户到设置开启权限。

### Q: 可以在地图加载后更新位置吗?

A: 可以,使用 `moveCamera` 方法更新地图中心。

### Q: 如何配置定位参数?

A: 使用配置方法,必须在 `initSDK` 之后调用。