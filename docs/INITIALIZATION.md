# 初始化指南

本文档详细说明如何正确初始化和配置 expo-gaode-map。

## 目录

- [基本初始化流程](#基本初始化流程)
- [权限管理](#权限管理)
- [完整示例](#完整示例)
- [常见问题](#常见问题)

## 基本初始化流程

### 1. SDK 初始化

在应用启动时初始化 SDK（通常在 App 组件的 useEffect 中）:

```tsx
import { initSDK } from 'expo-gaode-map';

useEffect(() => {
  initSDK({
    androidKey: 'your-android-api-key',
    iosKey: 'your-ios-api-key',
  });
}, []);
```

### 2. 权限检查和请求

在使用定位功能前,必须先检查和请求权限:

```tsx
import { 
  checkLocationPermission, 
  requestLocationPermission 
} from 'expo-gaode-map';

// 检查权限状态
const status = await checkLocationPermission();
console.log('权限状态:', status);
// { granted: boolean, canAskAgain: boolean }

// 请求权限
if (!status.granted) {
  const result = await requestLocationPermission();
  if (result.granted) {
    console.log('权限已授予');
  } else {
    console.log('权限被拒绝');
  }
}
```

### 3. 获取位置

权限授予后,可以获取当前位置:

```tsx
import { getCurrentLocation } from 'expo-gaode-map';

try {
  const location = await getCurrentLocation();
  console.log('当前位置:', location);
} catch (error) {
  console.error('获取位置失败:', error);
}
```

## 权限管理

### 权限 API

| API | 说明 | 返回值 |
|-----|------|--------|
| `checkLocationPermission()` | 检查定位权限状态 | `Promise<PermissionStatus>` |
| `requestLocationPermission()` | 请求定位权限 | `Promise<PermissionStatus>` |

### PermissionStatus 类型

```typescript
interface PermissionStatus {
  granted: boolean;      // 是否已授予权限
  canAskAgain: boolean;  // 是否可以再次请求
}
```

### 权限状态说明

- **granted: true** - 用户已授予权限,可以使用定位功能
- **granted: false, canAskAgain: true** - 用户拒绝了权限,但可以再次请求
- **granted: false, canAskAgain: false** - 用户永久拒绝了权限,需要引导用户到设置中手动开启

## 完整示例

### 推荐的初始化流程

```tsx
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { 
  MapView,
  initSDK,
  checkLocationPermission,
  requestLocationPermission,
  getCurrentLocation,
  type LatLng,
} from 'expo-gaode-map';

export default function App() {
  const [initialPosition, setInitialPosition] = useState<{
    target: LatLng;
    zoom: number;
  } | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. 初始化 SDK
        console.log('正在初始化高德地图 SDK...');
        initSDK({
          androidKey: 'your-android-api-key',
          iosKey: 'your-ios-api-key',
        });
        
        // 2. 检查权限
        const status = await checkLocationPermission();
        
        // 3. 如果没有权限,请求权限
        if (!status.granted) {
          const result = await requestLocationPermission();
          
          if (!result.granted) {
            // 权限被拒绝,使用默认位置
            console.log('定位权限被拒绝,使用默认位置');
            setInitialPosition({
              target: { latitude: 39.90923, longitude: 116.397428 },
              zoom: 10
            });
            
            // 如果不能再次请求,引导用户到设置
            if (!result.canAskAgain) {
              Alert.alert(
                '需要定位权限',
                '请在设置中开启定位权限以使用完整功能',
                [
                  { text: '取消', style: 'cancel' },
                  { text: '去设置', onPress: () => {
                    // 打开应用设置
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  }}
                ]
              );
            }
            return;
          }
        }
        
        // 4. 获取当前位置
        const location = await getCurrentLocation();
        console.log('当前位置:', location);
        
        // 5. 设置地图初始位置
        setInitialPosition({
          target: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          zoom: 15
        });
        
      } catch (error) {
        console.error('初始化失败:', error);
        // 使用默认位置
        setInitialPosition({
          target: { latitude: 39.90923, longitude: 116.397428 },
          zoom: 10
        });
      }
    };

    initializeApp();
  }, []);

  // 等待初始化完成
  if (!initialPosition) {
    return <LoadingScreen />;
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialCameraPosition={initialPosition}
      myLocationEnabled={true}
      onLoad={() => console.log('地图加载完成')}
    />
  );
}
```

### 关键要点

1. **初始化顺序**:
   ```
   initSDK → checkPermission → requestPermission → getCurrentLocation → 渲染地图
   ```

2. **权限处理**:
   - ✅ 总是先检查权限状态
   - ✅ 只在需要时请求权限
   - ✅ 处理权限被拒绝的情况
   - ✅ 提供默认位置作为后备方案

3. **地图渲染**:
   - ✅ 等待初始化完成后再渲染地图
   - ✅ 使用 `initialCameraPosition` 设置初始位置
   - ✅ Android 和 iOS 会自动处理位置更新

## 常见问题

### Q: 如何处理用户拒绝权限的情况?

**A:** 提供默认位置并引导用户:

```tsx
if (!result.granted) {
  // 使用默认位置
  setInitialPosition({
    target: { latitude: 39.90923, longitude: 116.397428 },
    zoom: 10
  });
  
  // 如果不能再次请求,引导到设置
  if (!result.canAskAgain) {
    Alert.alert(
      '需要定位权限',
      '请在设置中开启定位权限',
      [
        { text: '取消' },
        { text: '去设置', onPress: () => Linking.openSettings() }
      ]
    );
  }
}
```

### Q: 可以在地图加载后更新位置吗?

**A:** 可以,使用 `moveCamera` 方法:

```tsx
const mapRef = useRef<MapViewRef>(null);

// 更新地图中心
await mapRef.current?.moveCamera({
  target: { latitude: 40.0, longitude: 116.5 },
  zoom: 15,
}, 1000); // 1秒动画
```

### Q: 如何配置定位参数?

**A:** 使用 `configure` 函数:

```tsx
import { configure } from 'expo-gaode-map';

configure({
  withReGeocode: true,  // 返回地址信息
  mode: 0,              // 高精度模式
  interval: 2000,       // 2秒更新一次
});
```

### Q: Android 和 iOS 的初始化有区别吗?

**A:** 初始化流程相同,但有以下差异:

**Android:**
- 需要在 `AndroidManifest.xml` 中配置权限
- 支持更多定位配置选项

**iOS:**
- 需要在 `Info.plist` 中配置权限描述
- 支持后台定位和方向更新

详细配置请参考 [高德地图官方文档](https://lbs.amap.com/)。

## 最佳实践

1. **总是处理权限**:
   ```tsx
   // ✅ 好的做法
   const status = await checkLocationPermission();
   if (!status.granted) {
     await requestLocationPermission();
   }
   
   // ❌ 不好的做法
   await getCurrentLocation(); // 可能因为没有权限而失败
   ```

2. **提供加载状态**:
   ```tsx
   if (!initialPosition) {
     return <LoadingScreen />;
   }
   ```

3. **错误处理**:
   ```tsx
   try {
     const location = await getCurrentLocation();
   } catch (error) {
     console.error('获取位置失败:', error);
     // 使用默认位置
   }
   ```

4. **避免重复初始化**:
   ```tsx
   useEffect(() => {
     initSDK({ ... });
   }, []); // 空依赖数组,只初始化一次
   ```

## 相关文档

- [API 文档](./API.md) - 完整的 API 参考
- [使用示例](./EXAMPLES.md) - 详细的代码示例
- [README](../README.md) - 快速开始指南