# 核心参考: 定位与追踪

管理用户定位显示、位置追踪以及权限处理。

## 快速参考

### 开启定位
```tsx
<MapView 
  myLocationEnabled={true}
  followUserLocation={true}
  // 配置定位蓝点样式
  userLocationRepresentation={{
    showsAccuracyRing: true,
    strokeColor: 'blue',
    fillColor: 'rgba(0,0,255,0.1)',
    image: 'custom_location_icon',
    // Android: 连续定位、定位点旋转、地图视角不移动
    locationType: 'LOCATION_ROTATE_NO_CENTER' 
  }}
  onLocation={(event) => {
    console.log('Current Location:', event.nativeEvent);
  }}
/>
```

### 权限处理 (PermissionUtils)
```ts
import { PermissionUtils, LocationPermissionType, ExpoGaodeMapModule } from 'expo-gaode-map';

// 1. 获取适配 Android 14+ / iOS 17+ 的权限文案
const rationale = PermissionUtils.getPermissionRationale(LocationPermissionType.FOREGROUND);

// 2. 请求权限
const result = await ExpoGaodeMapModule.requestLocationPermission();
```

### 单次定位
```ts
const location = await ExpoGaodeMapModule.getCurrentLocation();
console.log(location.latitude, location.longitude);
```

## 深度挖掘

### Android 后台定位配置 (Config Plugin)
如果需要在应用退到后台时持续获取位置（如运动记录），必须在 `app.json` 中配置 `enableBackgroundLocation`。这将自动处理 Android 8.0+ 的前台服务注册和权限声明。

```json
{
  "expo": {
    "plugins": [
      ["expo-gaode-map", {
        "enableBackgroundLocation": true, // 关键配置
        "locationDescription": "正在持续记录您的运动轨迹" // iOS 权限文案
      }]
    ]
  }
}
```

### 定位模式与配置
`ExpoGaodeMapModule` 提供了丰富的定位配置方法：
- `setLocationMode(mode)`: 设置高精度/低功耗/仅设备模式。
- `setInterval(ms)`: 设置定位间隔。
- `setDistanceFilter(distance)`: 设置最小更新距离 (iOS)。
- `setLocatingWithReGeocode(boolean)`: 是否返回逆地理编码信息。

### 常见陷阱
1. **频率控制**: `onLocation` 事件触发频率受系统和高德 SDK 内部策略控制，通常为 1-2 秒一次。
2. **坐标偏转**: `onLocation` 返回的是 GCJ-02 坐标，直接用于高德地图显示是准确的。如果发送给后端或其他地图，请注意坐标系转换。
