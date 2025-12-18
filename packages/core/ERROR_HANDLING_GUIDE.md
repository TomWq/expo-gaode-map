# 错误处理指南

expo-gaode-map 提供了完善的错误处理系统，帮助开发者快速定位和解决问题。

## 📋 目录

- [错误类型](#错误类型)
- [使用方法](#使用方法)
- [常见错误场景](#常见错误场景)
- [最佳实践](#最佳实践)

## 错误类型

所有错误都是 `GaodeMapError` 类的实例，包含以下信息：

```typescript
interface ErrorDetails {
  type: ErrorType;        // 错误类型
  message: string;        // 错误消息
  solution: string;       // 解决方案
  docUrl?: string;        // 文档链接
  originalError?: Error;  // 原始错误
}
```

### 支持的错误类型

| 错误类型 | 说明 | 常见原因 |
|---------|------|---------|
| `SDK_NOT_INITIALIZED` | SDK 未初始化 | 未调用 initSDK() |
| `INVALID_API_KEY` | API Key 配置错误 | Key 无效或未配置 |
| `PERMISSION_DENIED` | 权限未授予 | 用户拒绝定位权限 |
| `LOCATION_FAILED` | 定位失败 | GPS 未开启或信号弱 |
| `NATIVE_MODULE_UNAVAILABLE` | 原生模块不可用 | 未正确安装或构建 |
| `MAP_VIEW_NOT_INITIALIZED` | 地图视图未初始化 | 地图未渲染完成 |
| `INVALID_PARAMETER` | 参数错误 | 传入参数类型错误 |
| `NETWORK_ERROR` | 网络错误 | 网络连接失败 |

## 使用方法

### 1. 基本错误捕获

```typescript
import ExpoGaodeMapModule, { GaodeMapError } from 'expo-gaode-map';

try {
  await ExpoGaodeMapModule.getCurrentLocation();
} catch (error) {
  if (error instanceof GaodeMapError) {
    // 友好的错误信息已经格式化好了
    console.error(error.message);
    
    // 可以访问错误详情
    console.log('错误类型:', error.type);
    console.log('解决方案:', error.solution);
    console.log('文档链接:', error.docUrl);
  }
}
```

### 2. SDK 初始化错误处理

```typescript
import ExpoGaodeMapModule, { ErrorType } from 'expo-gaode-map';
import { Alert } from 'react-native';

function initializeSDK() {
  try {
    ExpoGaodeMapModule.initSDK({
      androidKey: 'your-android-key',
      iosKey: 'your-ios-key',
    });
  } catch (error) {
    if (error instanceof GaodeMapError) {
      if (error.type === ErrorType.INVALID_API_KEY) {
        Alert.alert(
          'API Key 配置错误',
          '请检查您的高德地图 API Key 配置',
          [
            { text: '查看文档', onPress: () => Linking.openURL(error.docUrl!) },
            { text: '确定' },
          ]
        );
      }
    }
  }
}
```

### 3. 权限请求错误处理

```typescript
import ExpoGaodeMapModule, { ErrorType, GaodeMapError } from 'expo-gaode-map';
import { Alert, Linking } from 'react-native';

async function requestLocationPermission() {
  try {
    const result = await ExpoGaodeMapModule.requestLocationPermission();
    
    if (!result.granted) {
      Alert.alert(
        '需要定位权限',
        '请在设置中开启定位权限以使用地图功能',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '去设置', 
            onPress: () => Linking.openSettings() 
          },
        ]
      );
    }
    
    return result.granted;
  } catch (error) {
    if (error instanceof GaodeMapError) {
      console.error(error.message);
    }
    return false;
  }
}
```

### 4. 地图视图操作错误处理

```typescript
import { MapView, MapViewRef, GaodeMapError, ErrorType } from 'expo-gaode-map';
import React, { useRef } from 'react';

function MapComponent() {
  const mapRef = useRef<MapViewRef>(null);
  
  const moveToLocation = async () => {
    try {
      await mapRef.current?.moveCamera({
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 15,
      });
    } catch (error) {
      if (error instanceof GaodeMapError) {
        if (error.type === ErrorType.MAP_VIEW_NOT_INITIALIZED) {
          console.log('地图还未准备好，请稍后再试');
        }
      }
    }
  };
  
  return (
    <MapView
      ref={mapRef}
      onMapReady={() => {
        console.log('地图已准备好');
        moveToLocation();
      }}
    />
  );
}
```

### 5. 自定义错误日志

```typescript
import { ErrorLogger, GaodeMapError } from 'expo-gaode-map';

// 在开发环境启用详细日志
ErrorLogger.setEnabled(__DEV__);

// 生产环境可以禁用
ErrorLogger.setEnabled(false);

// 手动记录警告
ErrorLogger.warn('定位精度较低', { accuracy: 100 });
```

## 常见错误场景

### 场景 1: SDK 未初始化

**错误信息：**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️  高德地图错误 [SDK_NOT_INITIALIZED]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 错误信息：
   高德地图 SDK 尚未初始化

💡 解决方案：
   请在使用地图功能前先调用 initSDK()...
```

**解决方案：**
```typescript
// App.tsx - 应用启动时初始化
import ExpoGaodeMapModule from 'expo-gaode-map';

export default function App() {
  useEffect(() => {
    ExpoGaodeMapModule.initSDK({
      androidKey: process.env.EXPO_PUBLIC_AMAP_ANDROID_KEY,
      iosKey: process.env.EXPO_PUBLIC_AMAP_IOS_KEY,
    });
  }, []);
  
  return <YourApp />;
}
```

### 场景 2: API Key 配置错误

**错误信息：**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️  高德地图错误 [INVALID_API_KEY]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 错误信息：
   Android 和 iOS API Key 配置错误或未配置
```

**解决方案：**

1. 使用 Config Plugin（推荐）：

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-gaode-map",
        {
          "androidKey": "your-android-key",
          "iosKey": "your-ios-key"
        }
      ]
    ]
  }
}
```

2. 或在代码中配置：

```typescript
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-key',
  iosKey: 'your-ios-key',
});
```

### 场景 3: 权限被拒绝

**解决方案：**
```typescript
import { Alert, Linking } from 'react-native';

async function handleLocationPermission() {
  try {
    // 先检查权限
    const status = await ExpoGaodeMapModule.checkLocationPermission();
    
    if (!status.granted) {
      // 请求权限
      const result = await ExpoGaodeMapModule.requestLocationPermission();
      
      if (!result.granted) {
        // 引导用户去设置
        Alert.alert(
          '需要定位权限',
          '请在设置中开启定位权限',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '去设置', 
              onPress: () => Linking.openSettings() 
            },
          ]
        );
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
```

### 场景 4: 定位失败

**解决方案：**
```typescript
async function getCurrentLocation() {
  try {
    // 配置定位参数提高成功率
    ExpoGaodeMapModule.setLocationTimeout(30); // 增加超时时间
    ExpoGaodeMapModule.setInterval(2000);      // 设置定位间隔
    
    // Android 特有配置
    if (Platform.OS === 'android') {
      ExpoGaodeMapModule.setLocationMode(2);   // 高精度模式
      ExpoGaodeMapModule.setGpsFirst(true);    // GPS 优先
    }
    
    // iOS 特有配置
    if (Platform.OS === 'ios') {
      ExpoGaodeMapModule.setDesiredAccuracy(0); // 最佳精度
    }
    
    const location = await ExpoGaodeMapModule.getCurrentLocation();
    return location;
  } catch (error) {
    if (error instanceof GaodeMapError) {
      if (error.type === ErrorType.LOCATION_FAILED) {
        Alert.alert(
          '定位失败',
          '请检查：\n1. GPS 是否开启\n2. 网络连接是否正常\n3. 是否在室内或信号较弱的地方'
        );
      }
    }
    return null;
  }
}
```

## 最佳实践

### 1. 统一错误处理

创建一个错误处理工具：

```typescript
// utils/errorHandler.ts
import { GaodeMapError, ErrorType } from 'expo-gaode-map';
import { Alert, Linking } from 'react-native';

export function handleGaodeMapError(error: unknown) {
  if (!(error instanceof GaodeMapError)) {
    console.error('未知错误:', error);
    return;
  }
  
  switch (error.type) {
    case ErrorType.SDK_NOT_INITIALIZED:
      Alert.alert('错误', 'SDK 未初始化，请重启应用');
      break;
      
    case ErrorType.INVALID_API_KEY:
      Alert.alert('配置错误', 'API Key 配置错误，请联系开发者');
      break;
      
    case ErrorType.PERMISSION_DENIED:
      Alert.alert(
        '需要权限',
        '请在设置中开启定位权限',
        [
          { text: '取消', style: 'cancel' },
          { text: '去设置', onPress: () => Linking.openSettings() },
        ]
      );
      break;
      
    case ErrorType.LOCATION_FAILED:
      Alert.alert('定位失败', '请检查 GPS 和网络连接');
      break;
      
    default:
      Alert.alert('错误', error.message);
  }
}

// 使用
try {
  await ExpoGaodeMapModule.getCurrentLocation();
} catch (error) {
  handleGaodeMapError(error);
}
```

### 2. 错误监控集成

集成到错误监控服务（如 Sentry）：

```typescript
import * as Sentry from '@sentry/react-native';
import { GaodeMapError } from 'expo-gaode-map';

try {
  await ExpoGaodeMapModule.getCurrentLocation();
} catch (error) {
  if (error instanceof GaodeMapError) {
    Sentry.captureException(error, {
      tags: {
        errorType: error.type,
        module: 'gaode-map',
      },
      extra: {
        solution: error.solution,
        docUrl: error.docUrl,
      },
    });
  }
}
```

### 3. 优雅降级

```typescript
async function getLocation() {
  try {
    return await ExpoGaodeMapModule.getCurrentLocation();
  } catch (error) {
    if (error instanceof GaodeMapError) {
      console.warn('高德定位失败，尝试使用备用方案');
      
      // 降级到其他定位方案
      return await getFallbackLocation();
    }
  }
}
```

### 4. 开发环境详细日志

```typescript
import { ErrorLogger } from 'expo-gaode-map';

// 开发环境启用详细日志
if (__DEV__) {
  ErrorLogger.setEnabled(true);
}

// 生产环境禁用
if (!__DEV__) {
  ErrorLogger.setEnabled(false);
}
```

## 错误类型参考

```typescript
import { ErrorType } from 'expo-gaode-map';

// 所有可用的错误类型
ErrorType.SDK_NOT_INITIALIZED           // SDK 未初始化
ErrorType.INVALID_API_KEY                // API Key 错误
ErrorType.PERMISSION_DENIED              // 权限被拒绝
ErrorType.LOCATION_FAILED                // 定位失败
ErrorType.NATIVE_MODULE_UNAVAILABLE      // 原生模块不可用
ErrorType.MAP_VIEW_NOT_INITIALIZED       // 地图视图未初始化
ErrorType.INVALID_PARAMETER              // 参数错误
ErrorType.NETWORK_ERROR                  // 网络错误
```

## 更多资源

- [完整 API 文档](https://TomWq.github.io/expo-gaode-map/api/)
- [初始化指南](https://TomWq.github.io/expo-gaode-map/guide/initialization.html)
- [故障排除](https://TomWq.github.io/expo-gaode-map/guide/troubleshooting.html)
- [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)