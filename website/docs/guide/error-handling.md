# 错误处理指南

expo-gaode-map 提供了完善的错误处理系统，帮助开发者快速定位和解决问题。

## 🎯 主要特性

- ✅ **友好的错误消息** - 格式化的错误信息，易于理解
- ✅ **详细的解决方案** - 每个错误都提供具体的修复步骤
- ✅ **文档链接** - 指向相关文档以获取更多帮助
- ✅ **自动错误识别** - 智能包装原生错误
- ✅ **TypeScript 支持** - 完整的类型定义
- ✅ **错误日志控制** - 开发环境可控的日志输出

## 📋 错误类型

### 1. SDK_NOT_INITIALIZED

SDK 尚未初始化就调用了相关功能。

**示例错误：**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️  高德地图错误 [SDK_NOT_INITIALIZED]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 错误信息：
   高德地图 SDK 尚未初始化

💡 解决方案：
   请在使用地图功能前先调用 initSDK()：
   
   import ExpoGaodeMapModule from 'expo-gaode-map';
   
   ExpoGaodeMapModule.initSDK({
     androidKey: 'your-android-key',
     iosKey: 'your-ios-key',
   });
```

**解决方法：**
```typescript
import ExpoGaodeMapModule from 'expo-gaode-map';

// 在 App.tsx 或入口文件中初始化
useEffect(() => {
  ExpoGaodeMapModule.initSDK({
    androidKey: 'your-android-key',
    iosKey: 'your-ios-key',
  });
}, []);
```

### 2. INVALID_API_KEY

API Key 配置错误或缺失。

**常见原因：**
- API Key 为空或格式错误
- 未在高德开放平台申请 Key
- Key 的应用包名/Bundle ID 不匹配

**解决方法：**
1. 访问 [高德开放平台](https://lbs.amap.com/) 申请 API Key
2. 确保 Key 的应用信息与项目配置一致
3. 使用 Config Plugin 自动配置（推荐）

### 3. PERMISSION_DENIED

定位权限被用户拒绝。

**解决方法：**
```typescript
import { Alert, Linking } from 'react-native';
import ExpoGaodeMapModule from 'expo-gaode-map';

async function requestLocationPermission() {
  try {
    const hasPermission = await ExpoGaodeMapModule.checkLocationPermission();
    
    if (!hasPermission) {
      const granted = await ExpoGaodeMapModule.requestLocationPermission();
      
      if (!granted) {
        Alert.alert(
          '需要定位权限',
          '请在设置中开启定位权限',
          [
            { text: '取消', style: 'cancel' },
            { text: '去设置', onPress: () => Linking.openSettings() }
          ]
        );
      }
    }
  } catch (error) {
    console.error('权限请求失败:', error);
  }
}
```

### 4. LOCATION_FAILED

定位失败（GPS 信号弱、网络问题等）。

**常见原因：**
- GPS 信号弱或被遮挡
- 网络连接问题
- 设备定位服务未开启

**解决方法：**
```typescript
try {
  const location = await ExpoGaodeMapModule.getCurrentLocation();
} catch (error) {
  if (error instanceof GaodeMapError) {
    if (error.type === ErrorType.LOCATION_FAILED) {
      // 提示用户检查 GPS 和网络
      Alert.alert(
        '定位失败',
        '请检查 GPS 是否开启，并确保网络连接正常'
      );
    }
  }
}
```

### 5. NATIVE_MODULE_UNAVAILABLE

原生模块不可用（未正确安装）。

**解决方法：**
```bash
# 1. 清理并重新安装
rm -rf node_modules
npm install

# 2. 重新构建原生代码
npx expo prebuild --clean
npx expo run:android
npx expo run:ios

# 3. iOS 需要安装 Pods
cd ios && pod install && cd ..
```

### 6. MAP_VIEW_NOT_INITIALIZED

地图视图未初始化就调用了操作方法。

**解决方法：**
```typescript
import { useRef } from 'react';
import { ExpoGaodeMapView } from 'expo-gaode-map';

function MapScreen() {
  const mapRef = useRef<ExpoGaodeMapView>(null);

  const moveCamera = () => {
    // 确保 ref 已绑定
    if (mapRef.current) {
      mapRef.current.moveCamera({
        target: { latitude: 39.9, longitude: 116.4 },
        zoom: 15,
      });
    }
  };

  return (
    <ExpoGaodeMapView
      ref={mapRef}
      style={{ flex: 1 }}
    />
  );
}
```

### 7. INVALID_PARAMETER

参数类型或值错误。

**解决方法：**
```typescript
// ❌ 错误：缺少必需参数
mapRef.current?.moveCamera({});

// ✅ 正确：提供完整参数
mapRef.current?.moveCamera({
  target: { latitude: 39.9, longitude: 116.4 },
  zoom: 15,
});
```

### 8. NETWORK_ERROR

网络请求失败（API 调用失败、配额用尽等）。

**常见原因：**
- 网络连接问题
- API 调用配额用尽
- 服务暂时不可用

## 💻 基本用法

### 捕获和处理错误

```typescript
import ExpoGaodeMapModule, { 
  GaodeMapError, 
  ErrorType 
} from 'expo-gaode-map';

try {
  await ExpoGaodeMapModule.getCurrentLocation();
} catch (error) {
  if (error instanceof GaodeMapError) {
    // 获取错误信息
    console.error('错误类型:', error.type);
    console.error('错误消息:', error.message);
    console.error('解决方案:', error.solution);
    console.error('文档链接:', error.docUrl);
    
    // 根据错误类型处理
    switch (error.type) {
      case ErrorType.SDK_NOT_INITIALIZED:
        // 初始化 SDK
        break;
      case ErrorType.PERMISSION_DENIED:
        // 引导用户授权
        break;
      case ErrorType.LOCATION_FAILED:
        // 提示用户检查设置
        break;
    }
  }
}
```

### 统一错误处理

```typescript
import { Alert } from 'react-native';
import { GaodeMapError, ErrorType } from 'expo-gaode-map';

function handleMapError(error: unknown) {
  if (error instanceof GaodeMapError) {
    // 显示友好的错误提示
    Alert.alert(
      '操作失败',
      `${error.message}\n\n${error.solution}`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '查看文档', 
          onPress: () => {
            // 打开文档链接
            Linking.openURL(error.docUrl);
          }
        }
      ]
    );
  } else {
    // 未知错误
    Alert.alert('错误', '发生了未知错误');
  }
}

// 使用
try {
  await ExpoGaodeMapModule.start();
} catch (error) {
  handleMapError(error);
}
```

## 🔧 错误日志控制

### 开启/关闭错误日志

```typescript
import { ErrorLogger } from 'expo-gaode-map';

// 开发环境开启日志
if (__DEV__) {
  ErrorLogger.enable();
} else {
  ErrorLogger.disable();
}
```

### 自定义日志处理

```typescript
import { ErrorLogger, GaodeMapError } from 'expo-gaode-map';

// 集成到错误监控服务（如 Sentry）
const originalLog = console.error;
console.error = (...args) => {
  const error = args[0];
  if (error instanceof GaodeMapError) {
    // 上报到监控服务
    Sentry.captureException(error, {
      tags: {
        errorType: error.type,
        component: 'expo-gaode-map'
      },
      extra: {
        solution: error.solution,
        docUrl: error.docUrl
      }
    });
  }
  originalLog.apply(console, args);
};
```

## 🎨 最佳实践

### 1. 在应用启动时初始化

```typescript
// App.tsx
import { useEffect } from 'react';
import ExpoGaodeMapModule from 'expo-gaode-map';

export default function App() {
  useEffect(() => {
    // 尽早初始化 SDK
    ExpoGaodeMapModule.initSDK({
      androidKey: process.env.EXPO_PUBLIC_AMAP_ANDROID_KEY,
      iosKey: process.env.EXPO_PUBLIC_AMAP_IOS_KEY,
    }).catch(console.error);
  }, []);

  return <NavigationContainer>{/* ... */}</NavigationContainer>;
}
```

### 2. 使用自定义 Hook

```typescript
// hooks/useMapSDK.ts
import { useEffect, useState } from 'react';
import ExpoGaodeMapModule, { GaodeMapError } from 'expo-gaode-map';

export function useMapSDK() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<GaodeMapError | null>(null);

  useEffect(() => {
    ExpoGaodeMapModule.initSDK({
      androidKey: process.env.EXPO_PUBLIC_AMAP_ANDROID_KEY!,
      iosKey: process.env.EXPO_PUBLIC_AMAP_IOS_KEY!,
    })
      .then(() => setIsReady(true))
      .catch(setError);
  }, []);

  return { isReady, error };
}

// 使用
function MapScreen() {
  const { isReady, error } = useMapSDK();

  if (error) {
    return <ErrorView error={error} />;
  }

  if (!isReady) {
    return <LoadingView />;
  }

  return <ExpoGaodeMapView style={{ flex: 1}} />;
}
```

### 3. 优雅降级

```typescript
import { Platform } from 'react-native';
import ExpoGaodeMapModule from 'expo-gaode-map';

async function getLocation() {
  try {
    const location = await ExpoGaodeMapModule.getCurrentLocation();
    return location;
  } catch (error) {
    // 降级到系统定位
    if (Platform.OS === 'web') {
      return getWebLocation();
    }
    // 使用缓存位置
    return getCachedLocation();
  }
}
```

### 4. 错误边界组件

```typescript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { GaodeMapError } from 'expo-gaode-map';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: GaodeMapError | null;
}

class MapErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    if (error instanceof GaodeMapError) {
      return { error };
    }
    return { error: null };
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            {this.state.error.message}
          </Text>
          <Text style={{ marginBottom: 20 }}>
            {this.state.error.solution}
          </Text>
          <Button title="重试" onPress={this.handleReset} />
        </View>
      );
    }

    return this.props.children;
  }
}

// 使用
<MapErrorBoundary>
  <MapScreen />
</MapErrorBoundary>
```

## 🔍 调试技巧

### 检查 SDK 状态

```typescript
import ExpoGaodeMapModule from 'expo-gaode-map';

// 检查 SDK 是否已初始化
const isInitialized = await ExpoGaodeMapModule.isSDKInitialized();
console.log('SDK 已初始化:', isInitialized);
```

### 开发环境日志

```typescript
import { ErrorLogger } from 'expo-gaode-map';

if (__DEV__) {
  // 开启详细日志
  ErrorLogger.enable();
  
  // 记录所有地图操作
  const originalMoveCamera = mapRef.current?.moveCamera;
  mapRef.current!.moveCamera = (...args) => {
    console.log('移动相机:', args);
    return originalMoveCamera?.apply(mapRef.current, args);
  };
}
```

## 📚 相关资源

- [API 文档](/api/)
- [初始化指南](/guide/initialization)
- [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)

## 💡 常见问题

### Q: 如何在生产环境隐藏错误详情？

```typescript
if (!__DEV__) {
  ErrorLogger.disable();
}
```

### Q: 如何集成到错误监控服务？

参考上面的"自定义日志处理"章节。

### Q: 错误消息可以自定义吗？

可以继承 `GaodeMapError` 类并覆盖 `message` 属性：

```typescript
import { GaodeMapError, ErrorType } from 'expo-gaode-map';

class CustomMapError extends GaodeMapError {
  constructor(type: ErrorType) {
    super(type, '自定义错误消息', '自定义解决方案');
  }
}