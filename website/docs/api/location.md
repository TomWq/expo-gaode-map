# 定位 API

完整的定位功能 API 文档。

> ⚠️ **权限要求**: 所有定位 API 都需要定位权限。使用前请先调用权限检查和请求方法。

## 定位控制

所有定位 API 通过 `ExpoGaodeMapModule` 调用：

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 初始化 SDK（使用 Config Plugin 时可传空对象）
ExpoGaodeMapModule.initSDK({
  webKey: 'your-web-api-key', // 仅在使用 Web API 时需要
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
| `initSDK` | `{androidKey?, iosKey?, webKey?}` | `void` | 初始化 SDK（使用 Config Plugin 时原生 Key 可省略） |
| `start` | - | `void` | 开始连续定位 |
| `stop` | - | `void` | 停止定位 |
| `isStarted` | - | `Promise<boolean>` | 检查是否正在定位 |
| `getCurrentLocation` | - | `Promise<Location>` | 获取当前位置 |

## 权限管理

### useLocationPermissions Hook (推荐)

使用 React Hook 简化权限管理，自动处理权限状态和请求：

```tsx
import { useLocationPermissions } from 'expo-gaode-map';

function MyComponent() {
  const [status, requestPermission] = useLocationPermissions();

  useEffect(() => {
    const init = async () => {
      // 请求权限
      await requestPermission();
      
      // 检查权限状态
      if (status?.granted) {
        ExpoGaodeMapModule.start();
      }
    };
    
    init();
  }, [status, requestPermission]);

  return (
    <View>
      {status?.granted ? (
        <Text>✅ 权限已授予</Text>
      ) : (
        <Button title="请求定位权限" onPress={requestPermission} />
      )}
    </View>
  );
}
```

#### 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `status` | `PermissionStatus \| null` | 当前权限状态对象 |
| `requestPermission` | `() => Promise<PermissionStatus>` | 请求权限的方法 |

#### PermissionStatus 类型

```typescript
interface PermissionStatus {
  granted: boolean;           // 是否已授权
  status: 'granted' | 'denied' | 'notDetermined'; // 权限状态
  fineLocation?: boolean;      // Android: 精确位置权限
  coarseLocation?: boolean;    // Android: 粗略位置权限
  backgroundLocation?: boolean; // Android: 后台位置权限
  shouldShowRationale?: boolean; // Android: 是否应显示权限说明
  isPermanentlyDenied?: boolean; // Android: 权限是否被永久拒绝
  isAndroid14Plus?: boolean;    // Android: 是否为 Android 14+
  message?: string;            // 额外的消息说明
}
```

### 手动检查权限

```tsx
const status = await ExpoGaodeMapModule.checkLocationPermission();
console.log(status.granted); // true 或 false
console.log(status.status);  // "granted" | "denied" | "notDetermined"
```

### 手动请求权限

```tsx
const result = await ExpoGaodeMapModule.requestLocationPermission();
if (result.granted) {
  console.log('权限已授予');
} else {
  console.log('权限被拒绝');
}
```

### 请求后台位置权限（Android 10+）

```tsx
const result = await ExpoGaodeMapModule.requestBackgroundLocationPermission();
if (result.granted) {
  console.log('后台定位权限已授予');
} else if (result.isPermanentlyDenied) {
  console.log('权限被永久拒绝，需要引导用户到设置页面');
  ExpoGaodeMapModule.openAppSettings();
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

### 使用 useLocationPermissions Hook（推荐）

```tsx
import { useEffect, useState } from 'react';
import { 
  ExpoGaodeMapModule, 
  useLocationPermissions,
  type Location 
} from 'expo-gaode-map';

export default function LocationExample() {
  const [location, setLocation] = useState<Location | null>(null);
  const [status, requestPermission] = useLocationPermissions();

  useEffect(() => {
    const init = async () => {
      // 请求定位权限
      await requestPermission();
      
      // 检查权限是否已授予
      if (!status?.granted) {
        console.log('未授予定位权限');
        return;
      }

      // 初始化（使用 Config Plugin 时可传空对象）
      ExpoGaodeMapModule.initSDK({
        webKey: 'your-web-api-key', // 可选
      });

      // 配置
      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setInterval(2000);

      // 监听位置更新
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
  }, [status, requestPermission]);

  return (
    <View>
      {status?.granted ? (
        <>
          <Text>✅ 定位权限已授予</Text>
          {location && (
            <Text>
              位置: {location.latitude}, {location.longitude}
              {location.address && `\n地址: ${location.address}`}
            </Text>
          )}
        </>
      ) : (
        <>
          <Text>⚠️ 需要定位权限</Text>
          <Button title="请求权限" onPress={requestPermission} />
        </>
      )}
    </View>
  );
}
```

### 使用手动权限管理

```tsx
import { useEffect, useState } from 'react';
import { ExpoGaodeMapModule, type Location } from 'expo-gaode-map';

export default function LocationExample() {
  const [location, setLocation] = useState<Location | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      // 1. 检查权限
      const permission = await ExpoGaodeMapModule.checkLocationPermission();
      
      if (!permission.granted) {
        // 2. 请求权限
        const result = await ExpoGaodeMapModule.requestLocationPermission();
        
        if (!result.granted) {
          setHasPermission(false);
          return;
        }
      }

      setHasPermission(true);

      // 3. 初始化（使用 Config Plugin 时可传空对象）
      ExpoGaodeMapModule.initSDK({
        webKey: 'your-web-api-key', // 可选
      });

      // 4. 配置
      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setInterval(2000);

      // 5. 监听
      const sub = ExpoGaodeMapModule.addLocationListener(
        'onLocationUpdate',
        setLocation
      );

      // 6. 开始定位
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
      {hasPermission === null ? (
        <Text>正在检查权限...</Text>
      ) : hasPermission ? (
        <>
          <Text>✅ 定位权限已授予</Text>
          {location && (
            <Text>
              位置: {location.latitude}, {location.longitude}
              {location.address && `\n地址: ${location.address}`}
            </Text>
          )}
        </>
      ) : (
        <Text>❌ 未授予定位权限</Text>
      )}
    </View>
  );
}
```

## 相关文档

- [初始化指南](/guide/initialization)
- [MapView API](/api/mapview)
- [使用示例](/examples/location-tracking)
