# 定位 API

定位、权限、隐私合规和方向监听相关能力都通过 `ExpoGaodeMapModule` 提供。

## 推荐调用顺序

```tsx
import { ExpoGaodeMapModule } from 'expo-gaode-map';

// 1. 用户同意隐私后，先同步隐私状态
if (!ExpoGaodeMapModule.getPrivacyStatus().isReady) {
  ExpoGaodeMapModule.setPrivacyConfig({
    hasShow: true,
    hasContainsPrivacy: true,
    hasAgree: true,
    privacyVersion: '2026-03-13',
  });
}

// 2. 仅在使用 Web API 时调用
ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

// 3. 先检查权限，仅在完全未授权时请求
let permission = await ExpoGaodeMapModule.checkLocationPermission();
if (!permission.granted) {
  permission = await ExpoGaodeMapModule.requestLocationPermission();
}

// 4. 精准或粗略定位都可以开始定位
if (permission.granted) {
  ExpoGaodeMapModule.start();
}
```

> ⚠️ 从当前版本开始，如果在隐私同意前调用地图 / 定位能力，JS 层会明确抛出 `PRIVACY_NOT_AGREED` 相关错误，避免原生 SDK 直接崩溃。

## SDK 与隐私

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `initSDK` | `SDKConfig` | `void` | 按需初始化 SDK（未使用 Config Plugin，或需要下发 `webKey` 时） |
| `isSDKInitialized` | - | `boolean` | 当前 JS 侧是否已调用过初始化 |
| `setPrivacyVersion` | `(version: string)` | `void` | 设置隐私协议版本；版本变化时会要求重新同意 |
| `setPrivacyConfig` | `PrivacyConfig` | `void` | 一次性设置隐私状态 |
| `resetPrivacyConsent` | - | `void` | 清空已持久化的隐私同意状态 |
| `getPrivacyStatus` | - | `PrivacyStatus` | 获取当前隐私状态 |
| `setLoadWorldVectorMap` | `(enabled: boolean)` | `void` | 是否启用世界向量地图，需在初始化前设置 |
| `getVersion` | - | `string` | 获取原生 SDK 版本 |
| `isNativeSDKConfigured` | - | `boolean` | 原生侧是否已配置 API Key |

> 新接入统一使用 `setPrivacyConfig(...)` 同步隐私状态；`setPrivacyShow` / `setPrivacyAgree` 不再作为 JS 公开 API 暴露。

### PrivacyConfig

```ts
interface PrivacyConfig {
  hasShow: boolean;
  hasContainsPrivacy: boolean;
  hasAgree: boolean;
  privacyVersion?: string;
}
```

### PrivacyStatus

```ts
interface PrivacyStatus {
  hasShow: boolean;
  hasContainsPrivacy: boolean;
  hasAgree: boolean;
  isReady: boolean;
  privacyVersion?: string | null;
  agreedPrivacyVersion?: string | null;
  restoredFromStorage?: boolean;
}
```

## 定位控制

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `start` | - | `void` | 开始连续定位 |
| `stop` | - | `void` | 停止定位 |
| `isStarted` | - | `Promise<boolean>` | 是否正在定位 |
| `getCurrentLocation` | - | `Promise<Coordinates \| ReGeocode>` | 获取单次定位结果 |
| `coordinateConvert` | `(coordinate, type)` | `Promise<LatLng>` | 坐标系转换 |
| `addLocationListener` | `(listener)` | `{ remove(): void }` | 监听位置更新 |

> `addLocationListener` 现在只接收一个回调函数，不再需要传事件名。

## 权限管理

> ⚠️ 权限检查 / 请求同样依赖隐私状态。首次安装时请先完成隐私同意；后续启动原生会自动恢复已同意状态。

### `useLocationPermissions`（推荐）

```tsx
import { useEffect } from 'react';
import { ExpoGaodeMapModule, useLocationPermissions } from 'expo-gaode-map';

export default function PermissionExample() {
  const [status, requestPermission] = useLocationPermissions();

  useEffect(() => {
    ExpoGaodeMapModule.setPrivacyConfig({
      hasShow: true,
      hasContainsPrivacy: true,
      hasAgree: true,
    });
  }, []);

  return (
    <Button
      title={status?.granted ? '已授权' : '请求权限'}
      onPress={requestPermission}
    />
  );
}
```

### 权限方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `checkLocationPermission` | - | `Promise<PermissionStatus>` | 检查前台定位权限 |
| `requestLocationPermission` | - | `Promise<PermissionStatus>` | 请求前台定位权限 |
| `requestBackgroundLocationPermission` | - | `Promise<PermissionStatus>` | 请求后台定位权限 |
| `openAppSettings` | - | `void` | 打开系统设置页 |

### PermissionStatus

```ts
interface PermissionStatus {
  granted: boolean;
  status: 'granted' | 'denied' | 'undetermined';
  accuracyAuthorization?: 'full' | 'reduced' | 'none';
  fineLocation?: boolean;
  coarseLocation?: boolean;
  backgroundLocation?: boolean;
  shouldShowRationale?: boolean;
  isPermanentlyDenied?: boolean;
  isAndroid14Plus?: boolean;
  message?: string;
}
```

`granted` 表示应用已经获得可用的前台定位权限。Android 只有 `ACCESS_COARSE_LOCATION`，或 iOS 用户关闭“精准位置”时，`granted` 仍然是 `true`。

`accuracyAuthorization` 用于区分当前精度：

| 值 | 含义 | 建议处理 |
|----|------|----------|
| `full` | 精准定位 | 可以执行依赖米级精度的功能 |
| `reduced` | 粗略定位 | 继续地图、定位和逆地理编码，仅限制真正依赖精准定位的功能 |
| `none` | 没有可用定位权限 | 请求前台定位权限或提供无定位降级方案 |

> `accuracyAuthorization` 保持可选是为了兼容尚未重新构建的旧原生客户端。升级包版本后需要重新构建 Android/iOS 应用，新的原生实现才会返回该字段。

## 粗略定位与精准定位：如何选择

默认策略是**接受粗略定位**，不要把 `reduced` 当成权限拒绝，也不要因为用户关闭精准定位而阻止整个地图页面加载。粗略定位仍然可以显示定位点、返回坐标并执行逆地理编码，但坐标误差会更大，地址可能只适合区域级展示。

只有当一个具体功能确实依赖米级精度时，才在用户进入或执行该功能时要求精准定位：

| 业务场景 | 粗略定位是否可用 | 推荐策略 |
|----------|------------------|----------|
| 地图浏览、显示当前位置、城市/区县内容 | 可以 | 直接继续 |
| 逆地理编码、天气、区域推荐、较大范围附近搜索 | 可以 | 继续使用，并根据 `location.accuracy` 适当扩大搜索半径 |
| 路线预览、地址选择 | 通常可以 | 允许用户手动修正起点或地图选点 |
| 实时导航、道路匹配、精确上车点或配送点 | 不建议 | 在启动该功能前要求精准定位 |
| 小范围签到、米级电子围栏、到店/到岗判定 | 不建议 | 在提交或判定前要求精准定位 |
| 安全、救援等位置误差会造成明显风险的功能 | 不建议 | 明确说明原因后要求精准定位，并提供退出或替代流程 |

要求精准定位时，应满足以下原则：

1. 只限制依赖精准定位的功能，不要在应用启动或地图首页全局拦截。
2. 说明该功能为什么需要精准定位，以及粗略定位可能造成的影响。
3. 用户拒绝后保留地图浏览、粗略定位和其他不依赖米级精度的功能。
4. 已经是 `reduced` 时，不要循环调用 `requestLocationPermission()` 期待自动升级；应由用户确认后调用 `openAppSettings()`，返回应用时重新检查权限。

```tsx
import { Alert } from 'react-native';
import { ExpoGaodeMapModule, type PermissionStatus } from 'expo-gaode-map';

function hasFullAccuracy(permission: PermissionStatus) {
  return permission.accuracyAuthorization === 'full' ||
    (permission.accuracyAuthorization == null && permission.fineLocation === true);
}

async function getLocationForFeature(requiresPreciseLocation: boolean) {
  let permission = await ExpoGaodeMapModule.checkLocationPermission();

  // 完全未授权时才请求；粗略定位已经属于有效授权。
  if (!permission.granted) {
    permission = await ExpoGaodeMapModule.requestLocationPermission();
  }

  if (!permission.granted) {
    return null;
  }

  if (requiresPreciseLocation && !hasFullAccuracy(permission)) {
    Alert.alert(
      '需要开启精准定位',
      '该功能依赖米级位置精度，请在系统设置中为本应用开启精准定位。',
      [
        { text: '暂不使用', style: 'cancel' },
        { text: '打开设置', onPress: () => ExpoGaodeMapModule.openAppSettings() },
      ]
    );
    return null;
  }

  ExpoGaodeMapModule.setLocatingWithReGeocode(true);
  return ExpoGaodeMapModule.getCurrentLocation();
}

// 地图定位、逆地理编码：接受粗略定位
const mapLocation = await getLocationForFeature(false);

// 米级签到、实时导航等：要求精准定位
const preciseLocation = await getLocationForFeature(true);
```

`expo-gaode-map-navigation` 提供相同的 `ExpoGaodeMapModule` 和 `PermissionStatus`，使用时只需把示例中的导入包名替换为 `expo-gaode-map-navigation`。

## 定位配置

### 通用配置

| 方法 | 参数 | 说明 |
|------|------|------|
| `setLocatingWithReGeocode` | `(enabled: boolean)` | 是否返回逆地理信息 |
| `setInterval` | `(interval: number)` | 定位间隔，毫秒 |
| `setGeoLanguage` | `('DEFAULT' \| 'EN' \| 'ZH')` | 逆地理返回语言 |

### Android 专用

| 方法 | 参数 | 说明 |
|------|------|------|
| `setLocationMode` | `(mode: LocationMode)` | 定位模式 |
| `setOnceLocation` | `(enabled: boolean)` | 是否单次定位 |
| `setSensorEnable` | `(enabled: boolean)` | 是否启用设备传感器 |
| `setWifiScan` | `(enabled: boolean)` | 是否允许 Wi‑Fi 扫描 |
| `setGpsFirst` | `(enabled: boolean)` | 是否 GPS 优先 |
| `setOnceLocationLatest` | `(enabled: boolean)` | 是否等待 Wi‑Fi 列表刷新后再返回结果 |
| `setLocationCacheEnable` | `(enabled: boolean)` | 是否启用定位缓存 |
| `setHttpTimeOut` | `(timeout: number)` | 网络请求超时，毫秒 |
| `setLocationProtocol` | `('HTTP' \| 'HTTPS')` | 网络协议 |

### iOS 专用

| 方法 | 参数 | 说明 |
|------|------|------|
| `setDesiredAccuracy` | `(accuracy: LocationAccuracy)` | 期望定位精度 |
| `setLocationTimeout` | `(seconds: number)` | 定位超时 |
| `setReGeocodeTimeout` | `(seconds: number)` | 逆地理超时 |
| `setDistanceFilter` | `(meters: number)` | 最小距离过滤 |
| `setPausesLocationUpdatesAutomatically` | `(enabled: boolean)` | 是否允许系统自动暂停定位 |
| `setAllowsBackgroundLocationUpdates` | `(enabled: boolean)` | 是否允许后台定位 |
| `startUpdatingHeading` | - | 开始监听朝向 |
| `stopUpdatingHeading` | - | 停止监听朝向 |

## 事件监听

### 监听位置更新

```tsx
const subscription = ExpoGaodeMapModule.addLocationListener((location) => {
  console.log('位置更新:', location);
});

subscription.remove();
```

### 监听朝向更新（iOS）

朝向更新事件走原生事件订阅，不走 `addLocationListener`：

```tsx
const subscription = ExpoGaodeMapModule.addListener('onHeadingUpdate', (heading) => {
  console.log('方向更新:', heading);
});

ExpoGaodeMapModule.startUpdatingHeading();

subscription.remove();
ExpoGaodeMapModule.stopUpdatingHeading();
```

## 坐标转换

```tsx
import { CoordinateType, ExpoGaodeMapModule } from 'expo-gaode-map';

const converted = await ExpoGaodeMapModule.coordinateConvert(
  { latitude: 39.9, longitude: 116.4 },
  CoordinateType.GPS
);
```

## 主要类型

### Coordinates

```ts
interface Coordinates {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  heading: number;
  speed: number;
  timestamp: number;
  isAvailableCoordinate?: boolean;
  address?: string;
}
```

### ReGeocode

```ts
interface ReGeocode extends Coordinates {
  address: string;
  country: string;
  province: string;
  city: string;
  district: string;
  cityCode: string;
  adCode: string;
  street: string;
  streetNumber: string;
  poiName: string;
  aoiName: string;
  description?: string;
  coordType?: 'GCJ02' | 'WGS84';
  buildingId?: string;
}
```

### LocationMode

```ts
enum LocationMode {
  HighAccuracy = 1,
  BatterySaving = 2,
  DeviceSensors = 3,
}
```

### LocationAccuracy

```ts
enum LocationAccuracy {
  BestForNavigation = 0,
  Best = 1,
  NearestTenMeters = 2,
  HundredMeters = 3,
  Kilometer = 4,
  ThreeKilometers = 5,
}
```

## 完整示例

```tsx
import { useEffect, useRef, useState } from 'react';
import { Button, Text, View } from 'react-native';
import {
  ExpoGaodeMapModule,
  LocationMode,
  type ReGeocode,
} from 'expo-gaode-map';

export default function LocationExample() {
  const [location, setLocation] = useState<ReGeocode | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      ExpoGaodeMapModule.setPrivacyConfig({
        hasShow: true,
        hasContainsPrivacy: true,
        hasAgree: true,
      });

      // 仅在使用 Web API 时调用
      // ExpoGaodeMapModule.initSDK({ webKey: 'your-web-api-key' });

      let permission = await ExpoGaodeMapModule.checkLocationPermission();
      if (!permission.granted) {
        permission = await ExpoGaodeMapModule.requestLocationPermission();
      }
      if (!permission.granted) return;

      ExpoGaodeMapModule.setLocatingWithReGeocode(true);
      ExpoGaodeMapModule.setLocationMode(LocationMode.HighAccuracy);
      ExpoGaodeMapModule.setInterval(2000);

      const sub = ExpoGaodeMapModule.addLocationListener((result) => {
        setLocation(result as ReGeocode);
      });

      ExpoGaodeMapModule.start();
      startedRef.current = true;

      return () => {
        sub.remove();
        if (startedRef.current) {
          ExpoGaodeMapModule.stop();
        }
      };
    };

    const cleanup = run();
    return () => {
      cleanup.then((fn) => fn?.()).catch(() => {});
    };
  }, []);

  return (
    <View>
      <Button
        title="获取当前位置"
        onPress={async () => {
          const current = await ExpoGaodeMapModule.getCurrentLocation();
          console.log(current);
        }}
      />
      <Text>{location ? location.address : '等待定位中...'}</Text>
    </View>
  );
}
```
