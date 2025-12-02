# 定位 API

完整的定位功能 API 文档。

> ⚠️ **权限要求**: 所有定位 API 都需要定位权限。使用前请先调用权限检查和请求方法。

## 定位控制

所有定位 API 通过 `ExpoGaodeMapModule` 调用：

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 初始化 SDK
ExpoGaodeMapModule.initSDK({
  androidKey: 'your-android-api-key',
  iosKey: 'your-ios-api-key',
});

// 开始连续定位
ExpoGaodeMapModule.start();

// 停止定位
ExpoGaodeMapModule.stop();

// 获取当前位置
const location = await ExpoGaodeMapModule.getCurrentLocation();
```

## API 列表

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `initSDK` | `{androidKey, iosKey}` | `void` | 初始化 SDK |
| `start` | - | `void` | 开始连续定位 |
| `stop` | - | `void` | 停止定位 |
| `isStarted` | - | `Promise<boolean>` | 检查是否正在定位 |
| `getCurrentLocation` | - | `Promise<Location>` | 获取当前位置 |

## 权限管理

### 检查权限

```tsx
const status = await ExpoGaodeMapModule.checkLocationPermission();
console.log(status.granted); // true 或 false
```

### 请求权限

```tsx
const result = await ExpoGaodeMapModule.requestLocationPermission();
if (result.granted) {
  console.log('权限已授予');
} else {
  console.log('权限被拒绝');
}
```

## 定位配置

### 通用配置

| 方法 | 参数 | 说明 |
|------|------|------|
| `setLocatingWithReGeocode` | `boolean` | 是否返回逆地理信息 |
| `setInterval` | `number` | 定位间隔（毫秒） |
| `setGeoLanguage` | `number` | 逆地理语言 |

### Android 专用配置

| 方法 | 参数 | 说明 |
|------|------|------|
| `setLocationMode` | `0 \| 1 \| 2` | 定位模式（0: 高精度, 1: 省电, 2: 仅设备） |
| `setOnceLocation` | `boolean` | 是否单次定位 |
| `setSensorEnable` | `boolean` | 是否使用设备传感器 |

### iOS 专用配置

| 方法 | 参数 | 说明 |
|------|------|------|
| `setLocationTimeout` | `number` | 定位超时时间（秒） |
| `setReGeocodeTimeout` | `number` | 逆地理超时时间（秒） |
| `setDesiredAccuracy` | `number` | 期望精度（0-5） |

## 事件监听

### 监听位置更新

```tsx
const subscription = ExpoGaodeMapModule.addLocationListener(
  'onLocationUpdate',
  (location) => {
    console.log('位置更新:', location);
  }
);

// 取消监听
subscription.remove();
```

### 监听方向更新（iOS）

```tsx
const subscription = ExpoGaodeMapModule.addLocationListener(
  'onHeadingUpdate',
  (heading) => {
    console.log('方向更新:', heading);
  }
);

// 取消监听
subscription.remove();
```

## 坐标转换

```tsx
const converted = await ExpoGaodeMapModule.coordinateConvert(
  { latitude: 39.9, longitude: 116.4 },
  0 // 转换类型
);
```

## Location 类型

```typescript
interface Location {
  // 基础位置信息
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  bearing: number;
  speed: number;
  
  // 地址信息（需要开启逆地理）
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  
  // 其他信息
  provider?: string;
  timestamp?: number;
}
```

## 完整示例

```tsx
import { useEffect, useState } from 'react';
import { ExpoGaodeMapModule, type Location } from 'expo-gaode-map';

export default function LocationExample() {
  const [location, setLocation] = useState<Location | null>(null);

  useEffect(() => {
    const init = async () => {
      // 初始化
      ExpoGaodeMapModule.initSDK({
        androidKey: 'your-android-key',
        iosKey: 'your-ios-key',
      });

      // 配置
      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setInterval(2000);

      // 监听
      const sub = ExpoGaodeMapModule.addLocationListener(
        'onLocationUpdate',
        setLocation
      );

      // 开始定位
      ExpoGaodeMapModule.start();

      return () => {
        sub.remove();
        ExpoGaodeMapModule.stop();
      };
    };

    init();
  }, []);

  return (
    <View>
      {location && (
        <Text>
          位置: {location.latitude}, {location.longitude}
        </Text>
      )}
    </View>
  );
}
```

## 相关文档

- [初始化指南](/guide/initialization)
- [MapView API](/api/mapview)
- [使用示例](/examples/location-tracking)